'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import Banner from '@/components/ui/Banner';
import { useActor } from '@/hooks/useActor';
import { useClock } from '@/hooks/useLiveScores';
import { useScoreQueue } from '@/hooks/useScoreQueue';
import { useMatchSync, useWakeLock } from '@/hooks/useMatchSync';
import { apiRequest } from '@/lib/api/client';
import MatchPicker from './MatchPicker';
import ScorePad from './ScorePad';
import ConfirmFinish from './ConfirmFinish';
import { editDeadline, groupMatches, upsertMatch } from './scoring';

/**
 * Staff scoring flow: pick a match → score it → confirm the result.
 * State and side effects live here; the three screens are presentational.
 */
export default function ScoreInput({
  matches: initialMatches = [],
  sports = [],
  teams = [],
  editWindowMinutes = 10,
}) {
  const { actor, loading: actorLoading, canScoreSport, isAdmin } = useActor();
  const now = useClock();

  const [step, setStep] = useState(1); // 1 pick, 2 score, 3 confirm
  const [matches, setMatches] = useState(initialMatches);
  // Fresh server rows (router.refresh below) replace the list — the
  // "adjust state when a prop changes" pattern, no effect needed.
  const [seenInitial, setSeenInitial] = useState(initialMatches);
  if (initialMatches !== seenInitial) {
    setSeenInitial(initialMatches);
    setMatches(initialMatches);
  }
  const [match, setMatch] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const queue = useScoreQueue({ match, setMatch, onError: setError });

  const realtimeStatus = useMatchSync({
    match,
    setMatch,
    setMatches,
    pendingRef: queue.pendingRef,
    onRemoteChange: useCallback(() => setNotice('คะแนนถูกอัปเดตจากเครื่องอื่น'), []),
    onRemoved: useCallback(() => {
      setMatch(null);
      setStep(1);
      setError('แมตช์นี้ถูกลบโดยผู้ดูแลระบบ');
    }, []),
  });

  useWakeLock(step === 2);

  // Realtime alone cannot keep the list fresh: PIN referees are anon to
  // Supabase and RLS (migration 008) hides `matches` from them, so no change
  // ever reaches their channel. Re-run the server page (service role) every
  // 20 s while the list is on screen and when the phone wakes up.
  const router = useRouter();
  useEffect(() => {
    if (step !== 1) return undefined;
    const refresh = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    const timer = setInterval(refresh, 20000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [step, router]);

  // auto-dismiss messages
  useEffect(() => {
    if (!error) return undefined;
    const t = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(t);
  }, [error]);
  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const visibleMatches = useMemo(
    () => (isAdmin ? matches : matches.filter((m) => canScoreSport(m.sport_id))),
    [matches, isAdmin, canScoreSport]
  );
  const groups = useMemo(
    () => groupMatches(visibleMatches, { editWindowMinutes, now, isAdmin }),
    [visibleMatches, editWindowMinutes, now, isAdmin]
  );

  const sport = sports.find((s) => s.id === match?.sport_id);
  const teamA = teams.find((t) => t.id === match?.team_a_id);
  const teamB = teams.find((t) => t.id === match?.team_b_id);
  const deadline = editDeadline(match, editWindowMinutes);
  const editExpired = match?.status === 'finished' && !isAdmin && (!deadline || deadline.getTime() <= now);

  const offlineBanner = !queue.online ? (
    <Banner kind="warn">
      {queue.pending > 0
        ? `ออฟไลน์ — รอส่ง ${queue.pending} รายการ (จะส่งอัตโนมัติเมื่อมีสัญญาณ)`
        : 'ออฟไลน์ — คะแนนจะถูกส่งเมื่อมีสัญญาณ'}
    </Banner>
  ) : null;

  // ------------------------------------------------------------ actions
  const select = (m) => {
    setMatch(m);
    setError('');
    setStep(2);
  };
  const start = () => queue.run(() => apiRequest(`/api/match/${match.id}/start`));
  const finishSet = () => queue.run(() => apiRequest(`/api/match/${match.id}/finish-set`));
  const undo = () => queue.run(() => apiRequest('/api/score/undo', { body: { match_id: match.id } }));
  const walkover = (winner) =>
    queue.run(async () => {
      const data = await apiRequest(`/api/match/${match.id}/walkover`, {
        body: { winner },
      });
      if (data) {
        setMatch(data);
        setSuccessResult({
          teamAName: teamA?.name,
          teamBName: teamB?.name,
          scoreA: data.score_a,
          scoreB: data.score_b,
          setsA: data.sets_a,
          setsB: data.sets_b,
          isWalkover: true,
          winnerName: winner === 'a' ? teamA?.name : teamB?.name,
        });
        setStep(3);
      }
      return data;
    });
  const confirmFinish = async () => {
    const data = await queue.run(() => apiRequest(`/api/match/${match.id}/finish`));
    if (data) {
      setSuccessResult({
        teamAName: teamA?.name,
        teamBName: teamB?.name,
        scoreA: data.score_a,
        scoreB: data.score_b,
        setsA: data.sets_a,
        setsB: data.sets_b,
      });
    }
  };
  // Back to the list: show this match's latest state straight away, then
  // pull everyone else's changes from the server.
  const backToList = () => {
    setMatches((prev) => upsertMatch(prev, match));
    setMatch(null);
    setStep(1);
    router.refresh();
  };
  const done = () => {
    setSuccessResult(null);
    backToList();
  };

  // ------------------------------------------------------------ screens
  if (step === 1) {
    if (actorLoading) {
      return (
        <GlassCard style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-3)' }}>
          กำลังตรวจสอบสิทธิ์...
        </GlassCard>
      );
    }
    return (
      <MatchPicker
        groups={groups}
        sports={sports}
        teams={teams}
        now={now}
        editWindowMinutes={editWindowMinutes}
        realtimeStatus={realtimeStatus}
        noAssignment={!isAdmin && actor && Array.isArray(actor.sportIds) && actor.sportIds.length === 0}
        offlineBanner={offlineBanner}
        error={error}
        onSelect={select}
      />
    );
  }

  if (step === 2 && match) {
    return (
      <ScorePad
        match={match}
        sport={sport}
        teamA={teamA}
        teamB={teamB}
        now={now}
        isAdmin={isAdmin}
        deadline={deadline}
        editExpired={editExpired}
        realtimeStatus={realtimeStatus}
        queue={queue}
        offlineBanner={offlineBanner}
        error={error}
        notice={notice}
        onBack={backToList}
        onStart={start}
        onFinishSet={finishSet}
        onUndo={undo}
        onFinish={() => setStep(3)}
        onWalkover={walkover}
      />
    );
  }

  if (step === 3 && match) {
    return (
      <ConfirmFinish
        match={match}
        sport={sport}
        teamA={teamA}
        teamB={teamB}
        isAdmin={isAdmin}
        editWindowMinutes={editWindowMinutes}
        saving={queue.saving}
        error={error}
        successResult={successResult}
        onBack={() => setStep(2)}
        onConfirm={confirmFinish}
        onDone={done}
      />
    );
  }

  return null;
}
