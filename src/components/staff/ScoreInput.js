'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import TeamBadge from '@/components/ui/TeamBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { useActor } from '@/hooks/useActor';
import { useRealtime } from '@/hooks/useRealtime';
import { MapPin, Clock, Zap, Flag, BadgeCheck, Check, AlertTriangle, Pin } from '@/components/animate-ui/icons';
import { SportIcon, TeamIcon } from '@/components/ui/SportIcon';
import Banner from '@/components/ui/Banner';
import { apiRequest, NetworkError } from '@/lib/api/client';
import { fmtRemaining, fmtClock, fmtTime } from '@/lib/format';
import { roundLabel } from '@/lib/labels';

const RETRY_MS = 3000;
const MAX_RETRIES = 40; // ~2 minutes of retrying before giving up on one tap

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function editDeadline(match, editWindowMinutes) {
  if (!match?.finished_at) return null;
  return new Date(new Date(match.finished_at).getTime() + editWindowMinutes * 60 * 1000);
}

export default function ScoreInput({ matches: initialMatches = [], sports = [], teams = [], editWindowMinutes = 10 }) {
  const { actor, loading: actorLoading, canScoreSport, isAdmin } = useActor();

  // Step 1: select match, Step 2: enter score, Step 3: confirm
  const [currentStep, setCurrentStep] = useState(1);
  const [matches, setMatches] = useState(initialMatches);
  const [match, setMatch] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [successResult, setSuccessResult] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  // Score requests are sent one at a time so rapid taps arrive in order.
  const queueRef = useRef(Promise.resolve());
  const pendingRef = useRef(0);
  const matchRef = useRef(null);
  useEffect(() => {
    matchRef.current = match;
  }, [match]);

  const visibleMatches = useMemo(
    () => (isAdmin ? matches : matches.filter((m) => canScoreSport(m.sport_id))),
    [matches, isAdmin, canScoreSport]
  );

  const groups = useMemo(() => {
    const live = [];
    const upcoming = [];
    const recent = [];
    for (const m of visibleMatches) {
      if (m.status === 'live') live.push(m);
      else if (m.status === 'finished') {
        const dl = editDeadline(m, editWindowMinutes);
        if (isAdmin || (dl && dl.getTime() > now)) recent.push(m);
      } else upcoming.push(m);
    }
    recent.sort((a, b) => (b.finished_at || '').localeCompare(a.finished_at || ''));
    return { live, upcoming, recent };
  }, [visibleMatches, editWindowMinutes, now, isAdmin]);

  const sport = sports.find((s) => s.id === match?.sport_id);
  const teamA = teams.find((t) => t.id === match?.team_a_id);
  const teamB = teams.find((t) => t.id === match?.team_b_id);
  const isSetSport = sport?.scoring_type === 'sets';
  const deadline = editDeadline(match, editWindowMinutes);
  const editExpired = match?.status === 'finished' && !isAdmin && (!deadline || deadline.getTime() <= now);

  // ------------------------------------------------------------ side effects
  // 1s tick for countdowns
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

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

  // online / offline
  useEffect(() => {
    const update = () => setOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // warn before leaving with unsent taps
  useEffect(() => {
    const handler = (e) => {
      if (pendingRef.current > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // keep the screen on while scoring
  useEffect(() => {
    if (currentStep !== 2 || typeof navigator === 'undefined' || !navigator.wakeLock) return undefined;
    let lock = null;
    let cancelled = false;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        /* not granted (e.g. low battery) — nothing to do */
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !cancelled) request();
    };
    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    };
  }, [currentStep]);

  // Realtime: keep the list fresh and mirror changes made elsewhere
  // (another device, an admin override) into the match being scored.
  const onMatchChange = useCallback((payload) => {
    if (payload.eventType === 'DELETE') {
      setMatches((prev) => prev.filter((m) => m.id !== payload.old.id));
      if (matchRef.current?.id === payload.old.id) {
        setMatch(null);
        setCurrentStep(1);
        setError('แมตช์นี้ถูกลบโดยผู้ดูแลระบบ');
      }
      return;
    }
    const row = payload.new;
    setMatches((prev) => {
      const idx = prev.findIndex((m) => m.id === row.id);
      if (idx === -1) return [...prev, row];
      const next = prev.slice();
      next[idx] = row;
      return next;
    });
    const cur = matchRef.current;
    if (cur && cur.id === row.id && pendingRef.current === 0) {
      const changed =
        row.score_a !== cur.score_a ||
        row.score_b !== cur.score_b ||
        row.sets_a !== cur.sets_a ||
        row.sets_b !== cur.sets_b ||
        row.status !== cur.status ||
        row.current_set !== cur.current_set;
      if (changed) {
        setMatch(row);
        setNotice('คะแนนถูกอัปเดตจากเครื่องอื่น');
      }
    }
  }, []);
  const realtimeStatus = useRealtime('matches', null, onMatchChange);

  // ------------------------------------------------------------ actions
  const handleSelectMatch = (m) => {
    setMatch(m);
    setError('');
    setCurrentStep(2);
  };

  const runAction = async (fn) => {
    setSaving(true);
    setError('');
    try {
      const data = await fn();
      if (data) setMatch(data);
      setLastSync(new Date());
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleStartMatch = () => runAction(() => apiRequest(`/api/match/${match.id}/start`));
  const handleFinishSet = () => runAction(() => apiRequest(`/api/match/${match.id}/finish-set`));
  const handleUndo = () => runAction(() => apiRequest('/api/score/undo', { body: { match_id: match.id } }));

  // Optimistic +/- with a serialized queue. While taps are still queued the
  // optimistic score stays on screen; the server row is only applied when the
  // queue drains, so the number never jumps backwards mid-burst. Network
  // failures retry every RETRY_MS until the connection is back.
  const handleScore = (team, delta) => {
    if (!match) return;
    const key = team === 'a' ? 'score_a' : 'score_b';
    const matchId = match.id;
    setMatch((prev) => (prev ? { ...prev, [key]: Math.max(0, (prev[key] ?? 0) + delta) } : prev));
    pendingRef.current += 1;
    setPending(pendingRef.current);

    queueRef.current = queueRef.current.then(async () => {
      let serverRow = null;
      let attempt = 0;
      for (;;) {
        try {
          serverRow = await apiRequest('/api/score', { body: { match_id: matchId, team, delta } });
          setLastSync(new Date());
          break;
        } catch (err) {
          if (err instanceof NetworkError && attempt < MAX_RETRIES) {
            attempt += 1;
            setOnline(false);
            await sleep(RETRY_MS);
            continue;
          }
          setError(err.message);
          serverRow = await fetch(`/api/match/${matchId}`, { cache: 'no-store' })
            .then((r) => r.json())
            .then((j) => j.data)
            .catch(() => null);
          break;
        }
      }
      setOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
      pendingRef.current = Math.max(0, pendingRef.current - 1);
      setPending(pendingRef.current);
      if (serverRow) {
        if (pendingRef.current === 0) {
          setMatch(serverRow);
        } else {
          // keep optimistic scores, but pick up status/set changes from the server
          setMatch((prev) => (prev ? { ...serverRow, score_a: prev.score_a, score_b: prev.score_b } : serverRow));
        }
      }
    });
  };

  const handleFinalConfirm = async () => {
    const data = await runAction(() => apiRequest(`/api/match/${match.id}/finish`));
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

  // For set sports, finish_match() auto-closes an open, non-tied set — show
  // the sets as they will be after that, not as they are now.
  const projectedSets = () => {
    let a = match?.sets_a ?? 0;
    let b = match?.sets_b ?? 0;
    const sa = match?.score_a ?? 0;
    const sb = match?.score_b ?? 0;
    if (sa > sb) a += 1;
    else if (sb > sa) b += 1;
    return { a, b };
  };

  const winnerText = () => {
    if (!match) return '';
    const proj = isSetSport ? projectedSets() : null;
    const a = isSetSport ? proj.a : match.score_a;
    const b = isSetSport ? proj.b : match.score_b;
    if (a > b) return ` ทีม${teamA?.name} ชนะ (+${sport?.win_points ?? 3} แต้ม), ทีม${teamB?.name} แพ้ (+${sport?.lose_points ?? 0} แต้ม)`;
    if (b > a) return ` ทีม${teamB?.name} ชนะ (+${sport?.win_points ?? 3} แต้ม), ทีม${teamA?.name} แพ้ (+${sport?.lose_points ?? 0} แต้ม)`;
    return ` ผลเสมอ ทั้งสองทีมได้ทีมละ +${sport?.draw_points ?? 1} แต้ม`;
  };

  // ------------------------------------------------------------ shared bits
  const offlineBanner = !online ? (
    <Banner kind="warn">
      {pending > 0 ? `ออฟไลน์ — รอส่ง ${pending} รายการ (จะส่งอัตโนมัติเมื่อมีสัญญาณ)` : 'ออฟไลน์ — คะแนนจะถูกส่งเมื่อมีสัญญาณ'}
    </Banner>
  ) : null;

  const renderMatchCard = (m) => {
    const s = sports.find((x) => x.id === m.sport_id);
    const a = teams.find((t) => t.id === m.team_a_id);
    const b = teams.find((t) => t.id === m.team_b_id);
    const teamsKnown = a && b;
    const dl = m.status === 'finished' ? editDeadline(m, editWindowMinutes) : null;

    return (
      <div
        key={m.id}
        onClick={() => teamsKnown && handleSelectMatch(m)}
        className="glass-card"
        style={{
          padding: '1rem 1.25rem',
          cursor: teamsKnown ? 'pointer' : 'not-allowed',
          opacity: teamsKnown ? 1 : 0.55,
          border: m.status === 'live' ? '1px solid #4ade80' : '1px solid var(--glass-border)',
          background: m.status === 'live' ? 'rgba(34, 197, 94, 0.1)' : 'var(--glass-bg)',
          transition: 'all 0.15s ease',
        }}
      >
        <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--gold-600)', fontSize: '0.9rem' }}>
            {s?.name}
            {m.round && <span style={{ color: 'var(--mono-500)', fontWeight: 400 }}> · {roundLabel(m.round)}</span>}
          </span>
          <StatusBadge status={m.status} />
        </div>

        <div className="flex-between" style={{ padding: '0.5rem 0' }}>
          <TeamBadge name={a?.name || 'รอผล'} colorHex={a?.color_hex} emoji={a?.logo_emoji} size="md" />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--mono-900)' }}>
            {s?.scoring_type === 'sets' ? `${m.sets_a ?? 0} - ${m.sets_b ?? 0}` : `${m.score_a ?? 0} - ${m.score_b ?? 0}`}
          </span>
          <TeamBadge name={b?.name || 'รอผล'} colorHex={b?.color_hex} emoji={b?.logo_emoji} size="md" />
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--mono-500)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <MapPin size={12} /> {m.venue}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> {fmtTime(m.match_time)} น.
          </span>
          {dl && (
            <span style={{ color: 'var(--gold-700)', marginLeft: 'auto' }}>
              แก้ได้อีก {fmtRemaining(dl.getTime() - now)}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderGroup = (title, list, emptyText) => (
    <section style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--mono-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
        {title} <span style={{ color: 'var(--mono-400)' }}>({list.length})</span>
      </h3>
      {list.length === 0 ? (
        <div style={{ fontSize: '0.85rem', color: 'var(--mono-400)', padding: '0.5rem 0' }}>{emptyText}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>{list.map(renderMatchCard)}</div>
      )}
    </section>
  );

  // ----------------------------------------------------------- Step 1
  if (currentStep === 1) {
    if (actorLoading) {
      return (
        <GlassCard style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--mono-600)' }}>
          กำลังตรวจสอบสิทธิ์...
        </GlassCard>
      );
    }
    const noAssignment = !isAdmin && actor && Array.isArray(actor.sportIds) && actor.sportIds.length === 0;
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--mono-900)', marginBottom: '0.25rem' }}>
            เลือกคู่การแข่งขันที่จะลงคะแนน
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--mono-600)' }}>
            {realtimeStatus === 'SUBSCRIBED' ? 'รายการอัปเดตอัตโนมัติ' : 'กำลังเชื่อมต่อ Realtime...'}
          </p>
        </div>

        {offlineBanner}
        <Banner kind="error">{error}</Banner>

        {noAssignment ? (
          <GlassCard style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--mono-600)' }}>
            บัญชีนี้ยังไม่ได้รับมอบหมายชนิดกีฬา กรุณาติดต่อผู้ดูแลระบบ
          </GlassCard>
        ) : (
          <>
            {renderGroup('กำลังแข่ง', groups.live, 'ยังไม่มีแมตช์ที่กำลังแข่ง')}
            {renderGroup('ถัดไป', groups.upcoming, 'ไม่มีแมตช์ที่รอแข่ง')}
            {renderGroup('เพิ่งจบ — ยังแก้ได้', groups.recent, 'ไม่มี')}
          </>
        )}
      </div>
    );
  }

  // ----------------------------------------------------------- Step 2
  if (currentStep === 2 && match) {
    const live = match.status === 'live';
    const canScore = (live || match.status === 'finished') && !editExpired;
    const elapsed = live && match.started_at && now ? fmtRemaining(now - new Date(match.started_at).getTime()) : null;
    const finishedSets = (isSetSport ? (match.match_sets || []) : []).filter((x) => x.status === 'finished');

    return (
      <div style={{ maxWidth: '520px', margin: '0 auto', paddingBottom: '7.5rem' }}>
        {/* Header card */}
        <div className="glass-card" style={{ padding: '0.85rem 1rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => setCurrentStep(1)} className="btn btn-secondary btn-sm" disabled={pending > 0} style={{ padding: '0.45rem 0.7rem', flexShrink: 0 }}>
            ‹ แมตช์
          </button>
          <span style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--sci-yellow-surface)', border: '1px solid var(--sci-yellow-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-700)', flexShrink: 0 }}>
            <SportIcon sportId={match.sport_id} sportName={sport?.name} size={20} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 800, color: 'var(--mono-900)', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {sport?.name}
              {match.round && <span style={{ color: 'var(--mono-500)', fontWeight: 600 }}> · {roundLabel(match.round)}</span>}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--mono-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {match.venue} · {fmtTime(match.match_time)} น.
            </div>
          </div>
          {live ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-text)', fontSize: '0.74rem', fontWeight: 800, flexShrink: 0 }}>
              <span className="live-dot" /> {elapsed || 'LIVE'}
            </span>
          ) : (
            <StatusBadge status={match.status} />
          )}
        </div>

        {offlineBanner}
        <Banner kind="error">{error}</Banner>
        <Banner kind="info">{notice}</Banner>

        {(match.status === 'upcoming' || match.status === 'postponed') && (
          <button
            onClick={handleStartMatch}
            disabled={saving}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '0.85rem', padding: '1rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #22c55e, var(--success-text))', boxShadow: '0 10px 24px rgba(34,197,94,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Zap size={20} /> {saving ? 'กำลังเริ่ม...' : 'เริ่มการแข่งขัน'}
          </button>
        )}

        {match.status === 'finished' && (
          <div style={{ padding: '0.65rem 1rem', marginBottom: '0.85rem', textAlign: 'center', borderRadius: 'var(--radius-md)', background: 'var(--sci-yellow-surface)', border: '1px solid var(--sci-yellow-border)', fontSize: '0.88rem' }}>
            {isAdmin ? (
              <span style={{ color: 'var(--gold-700)' }}>แมตช์จบแล้ว — ผู้ดูแลระบบแก้ได้ตลอด</span>
            ) : editExpired ? (
              <span style={{ color: 'var(--danger-text)' }}>หมดเวลาแก้ไขแล้ว — ติดต่อผู้ดูแลระบบหากคะแนนผิด</span>
            ) : (
              <span style={{ color: 'var(--gold-700)' }}>
                แมตช์จบแล้ว — แก้ได้อีก <strong>{fmtRemaining(deadline.getTime() - now)}</strong>
              </span>
            )}
          </div>
        )}

        {/* Scoreboard */}
        <div className="glass-card score-board" style={{ padding: 0, overflow: 'hidden', border: live ? '1.5px solid rgba(239, 68, 68, 0.35)' : undefined }}>
          {isSetSport && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.6rem 1rem', background: 'var(--mono-100)', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--mono-600)' }}>เซตที่ <strong style={{ color: 'var(--mono-900)' }}>{match.current_set ?? 1}</strong></span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.15rem', color: 'var(--mono-900)' }}>
                {match.sets_a ?? 0} <span style={{ color: 'var(--mono-400)' }}>–</span> {match.sets_b ?? 0}
              </span>
              <span style={{ color: 'var(--mono-500)', fontSize: '0.75rem' }}>
                ชนะ {sport?.sets_to_win} เซต{sport?.points_per_set ? ` · เซตละ ${sport.points_per_set}` : ''}
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'stretch' }}>
            {[
              { key: 'a', team: teamA, score: match.score_a ?? 0, fallback: '#ef4444', side: 'left' },
              { key: 'b', team: teamB, score: match.score_b ?? 0, fallback: '#0284c7', side: 'right' },
            ].map(({ key, team, score, fallback, side }, idx) => {
              const hex = team?.color_hex || fallback;
              const isBasket = sport?.name === 'บาสเกตบอล';
              return (
                <div
                  key={key}
                  style={{
                    gridColumn: idx === 0 ? 1 : 3,
                    gridRow: 1,
                    padding: '1.1rem 0.85rem 1rem',
                    textAlign: 'center',
                    background: side === 'left'
                      ? `linear-gradient(180deg, ${hex}1f 0%, ${hex}0a 60%, transparent 100%)`
                      : `linear-gradient(180deg, ${hex}1f 0%, ${hex}0a 60%, transparent 100%)`,
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px 4px 6px', borderRadius: 999, background: '#fff', border: `1px solid ${hex}55`, boxShadow: `0 2px 8px ${hex}22` }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: hex, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TeamIcon teamId={team?.id} teamName={team?.name} color="#fff" size={14} />
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--mono-900)' }}>{team?.name || '—'}</span>
                  </div>

                  <div
                    key={`${key}-${score}`}
                    className="live-score is-bump"
                    style={{ fontSize: '5rem', fontFamily: 'var(--font-heading)', fontWeight: 900, color: 'var(--mono-900)', lineHeight: 1, margin: '0.6rem 0 0.75rem', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {score}
                  </div>

                  <button
                    onClick={() => handleScore(key, 1)}
                    disabled={!canScore}
                    className="score-btn"
                    style={{ background: `linear-gradient(145deg, ${hex} 0%, ${hex}cc 100%)`, boxShadow: `0 10px 24px ${hex}55` }}
                    aria-label={`+1 ${team?.name || ''}`}
                  >
                    +1
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: isBasket ? '1fr 1fr 1fr' : '1fr', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {isBasket && (
                      <>
                        <button onClick={() => handleScore(key, 2)} disabled={!canScore} className="score-btn score-btn-ghost" style={{ color: hex, borderColor: `${hex}66` }}>+2</button>
                        <button onClick={() => handleScore(key, 3)} disabled={!canScore} className="score-btn score-btn-ghost" style={{ color: hex, borderColor: `${hex}66` }}>+3</button>
                      </>
                    )}
                    <button onClick={() => handleScore(key, -1)} disabled={!canScore || score === 0} className="score-btn score-btn-ghost" aria-label={`-1 ${team?.name || ''}`}>
                      −1
                    </button>
                  </div>
                </div>
              );
            })}

            {/* VS divider */}
            <div style={{ gridColumn: 2, gridRow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 0.15rem', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10%', bottom: '10%', width: 1, background: 'var(--glass-border)' }} />
              <span style={{ position: 'relative', background: '#fff', border: '1px solid var(--glass-border)', borderRadius: 999, padding: '3px 8px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--mono-400)', letterSpacing: '0.06em' }}>VS</span>
            </div>
          </div>

          {finishedSets.length > 0 && (
            <div style={{ padding: '0.5rem 1rem 0.7rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--mono-600)', borderTop: '1px solid var(--glass-border)' }}>
              เซตที่ผ่านมา: {finishedSets.map((x) => `${x.score_a}–${x.score_b}`).join(' | ')}
            </div>
          )}
        </div>

        {/* Sticky action bar */}
        <div className="score-actions">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <button onClick={handleUndo} disabled={saving || !canScore || pending > 0} className="btn btn-secondary" style={{ flex: 1, minHeight: 46, fontSize: '0.9rem' }}>
              ↶ ยกเลิกล่าสุด
            </button>
            {isSetSport && (
              <button
                onClick={handleFinishSet}
                disabled={saving || !live || pending > 0 || (match.score_a ?? 0) === (match.score_b ?? 0)}
                className="btn btn-secondary"
                style={{ flex: 1, minHeight: 46, fontSize: '0.9rem', color: 'var(--gold-700)', fontWeight: 700 }}
              >
                จบเซต {match.current_set ?? 1}
              </button>
            )}
          </div>
          {live && (
            <button
              onClick={() => setCurrentStep(3)}
              disabled={pending > 0}
              className="btn btn-primary"
              style={{ width: '100%', minHeight: 52, fontSize: '1.02rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Flag size={18} /> จบการแข่งขัน
            </button>
          )}
          <div style={{ fontSize: '0.74rem', color: pending > 0 ? 'var(--gold-700)' : 'var(--mono-500)', textAlign: 'center', marginTop: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: pending > 0 ? 'var(--gold-500)' : realtimeStatus === 'SUBSCRIBED' ? '#22c55e' : 'var(--mono-400)' }} />
            {pending > 0
              ? `กำลังส่ง ${pending} รายการ...`
              : lastSync
              ? `ซิงค์แล้ว ${fmtClock(lastSync)}`
              : 'พร้อมบันทึกคะแนน'}
            {realtimeStatus !== 'SUBSCRIBED' && pending === 0 && ' · Realtime ยังไม่เชื่อมต่อ'}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------- Step 3
  if (currentStep === 3 && match) {
    return (
      <div style={{ maxWidth: '440px', margin: '0 auto' }}>
        {successResult ? (
          <GlassCard style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <BadgeCheck size={56} style={{ color: 'var(--success-text)' }} animateOnHover />
            </div>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--success-text)', marginBottom: '0.5rem' }}>บันทึกผลการแข่งขันเรียบร้อย!</h3>
            <p style={{ color: 'var(--mono-900)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {successResult.teamAName} {isSetSport ? successResult.setsA : successResult.scoreA} - {isSetSport ? successResult.setsB : successResult.scoreB} {successResult.teamBName}
            </p>
            <p style={{ color: 'var(--mono-700)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              ระบบได้อัปเดตตารางคะแนนรวมและส่งผลสู่หน้าเว็บหลักแบบ Realtime แล้ว
            </p>
            {!isAdmin && (
              <p style={{ color: 'var(--gold-700)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                กดผิด? แก้ได้ภายใน {editWindowMinutes} นาที จากหัวข้อ &quot;เพิ่งจบ — ยังแก้ได้&quot;
              </p>
            )}
            <button
              onClick={() => {
                setSuccessResult(null);
                setMatch(null);
                setCurrentStep(1);
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              กลับไปเลือกแมตช์อื่น
            </button>
          </GlassCard>
        ) : (
          <GlassCard style={{ padding: '2rem 1.75rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--gold-600)', textAlign: 'center', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} /> ยืนยันผลการแข่งขันขั้นสุดท้าย
            </h3>

            <Banner kind="error">{error}</Banner>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--mono-700)' }}>กีฬา: {sport?.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', margin: '1rem 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <TeamBadge name={teamA?.name} colorHex={teamA?.color_hex} emoji={teamA?.logo_emoji} size="md" />
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)', marginTop: '0.25rem' }}>
                    {isSetSport ? projectedSets().a : match.score_a}
                  </div>
                </div>
                <span style={{ fontSize: '1.2rem', color: 'var(--mono-400)', fontWeight: 700 }}>VS</span>
                <div style={{ textAlign: 'center' }}>
                  <TeamBadge name={teamB?.name} colorHex={teamB?.color_hex} emoji={teamB?.logo_emoji} size="md" />
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)', marginTop: '0.25rem' }}>
                    {isSetSport ? projectedSets().b : match.score_b}
                  </div>
                </div>
              </div>
              {isSetSport && (match.score_a ?? 0) !== (match.score_b ?? 0) && (
                <div style={{ fontSize: '0.85rem', color: 'var(--mono-600)' }}>
                  เซตที่ {match.current_set} ({match.score_a}-{match.score_b}) จะถูกปิดให้อัตโนมัติเมื่อยืนยัน
                </div>
              )}
              {isSetSport && sport?.sets_to_win && Math.max(projectedSets().a, projectedSets().b) < sport.sets_to_win && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.88rem', color: 'var(--danger-text)', fontWeight: 600 }}>
                  ⚠ ยังไม่มีทีมชนะครบ {sport.sets_to_win} เซต — ถ้ายืนยันตอนนี้ผลจะถูกบันทึกตามนี้
                </div>
              )}
            </div>

            <div style={{ background: 'var(--mono-100)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--mono-800)', marginBottom: '1.5rem', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <Pin size={16} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--gold-600)' }} />
              <div>
                <strong>ผลการคิดแต้ม:</strong>
                {winnerText()}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setCurrentStep(2)} className="btn btn-secondary" disabled={saving} style={{ flex: 1 }}>
                ย้อนกลับ
              </button>
              <button
                onClick={handleFinalConfirm}
                disabled={saving}
                className="btn btn-primary"
                style={{ flex: 2, background: '#22c55e', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                {saving ? 'กำลังบันทึก...' : (<><Check size={16} /> ยืนยันผลการแข่ง</>)}
              </button>
            </div>
          </GlassCard>
        )}
      </div>
    );
  }

  return null;
}
