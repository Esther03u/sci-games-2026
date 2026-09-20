'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import TeamBadge from '@/components/ui/TeamBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { useActor } from '@/hooks/useActor';
import { useRealtime } from '@/hooks/useRealtime';
import { MapPin, Clock, Zap, Flag, BadgeCheck, Check, AlertTriangle, Pin } from '@/components/animate-ui/icons';

const RETRY_MS = 3000;
const MAX_RETRIES = 40; // ~2 minutes of retrying before giving up on one tap

class NetworkError extends Error {}

// Every write goes through /api/* (see src/lib/api/scoring.js). Nothing here
// touches Supabase directly, so PIN referees and staff accounts behave the same.
async function api(path, body) {
  let res;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new NetworkError('ไม่มีสัญญาณอินเทอร์เน็ต');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    const err = new Error(json.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    err.code = json.error_code;
    throw err;
  }
  return json.data;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function roundLabel(round) {
  return { semi_1: 'รอบรองฯ 1', semi_2: 'รอบรองฯ 2', third: 'ชิงที่ 3', final: 'ชิงชนะเลิศ' }[round] || round;
}

function editDeadline(match, editWindowMinutes) {
  if (!match?.finished_at) return null;
  return new Date(new Date(match.finished_at).getTime() + editWindowMinutes * 60 * 1000);
}

function fmtRemaining(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
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

  const handleStartMatch = () => runAction(() => api(`/api/match/${match.id}/start`));
  const handleFinishSet = () => runAction(() => api(`/api/match/${match.id}/finish-set`));
  const handleUndo = () => runAction(() => api('/api/score/undo', { match_id: match.id }));

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
          serverRow = await api('/api/score', { match_id: matchId, team, delta });
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
    const data = await runAction(() => api(`/api/match/${match.id}/finish`));
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

  const winnerText = () => {
    if (!match) return '';
    const a = isSetSport ? match.sets_a : match.score_a;
    const b = isSetSport ? match.sets_b : match.score_b;
    if (a > b) return ` ทีม${teamA?.name} ชนะ (+${sport?.win_points ?? 3} แต้ม), ทีม${teamB?.name} แพ้ (+${sport?.lose_points ?? 0} แต้ม)`;
    if (b > a) return ` ทีม${teamB?.name} ชนะ (+${sport?.win_points ?? 3} แต้ม), ทีม${teamA?.name} แพ้ (+${sport?.lose_points ?? 0} แต้ม)`;
    return ` ผลเสมอ ทั้งสองทีมได้ทีมละ +${sport?.draw_points ?? 1} แต้ม`;
  };

  // ------------------------------------------------------------ shared bits
  const banner = (text, kind) =>
    text ? (
      <div
        role={kind === 'error' ? 'alert' : 'status'}
        style={{
          background: kind === 'error' ? 'rgba(239,68,68,0.15)' : kind === 'warn' ? 'rgba(251,191,36,0.15)' : 'rgba(59,130,246,0.15)',
          border: `1px solid ${kind === 'error' ? 'rgba(239,68,68,0.5)' : kind === 'warn' ? 'rgba(251,191,36,0.5)' : 'rgba(59,130,246,0.5)'}`,
          color: kind === 'error' ? '#b91c1c' : kind === 'warn' ? 'var(--gold-700)' : '#1d4ed8',
          padding: '0.65rem 0.9rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '0.85rem',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <AlertTriangle size={16} /> {text}
      </div>
    ) : null;

  const offlineBanner = !online
    ? banner(pending > 0 ? `ออฟไลน์ — รอส่ง ${pending} รายการ (จะส่งอัตโนมัติเมื่อมีสัญญาณ)` : 'ออฟไลน์ — คะแนนจะถูกส่งเมื่อมีสัญญาณ', 'warn')
    : null;

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
            <Clock size={12} /> {m.match_time?.slice(0, 5)} น.
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
        {banner(error, 'error')}

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

    return (
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
          <button onClick={() => setCurrentStep(1)} className="btn btn-secondary btn-sm" disabled={pending > 0}>
            เปลี่ยนแมตช์
          </button>
          <span style={{ fontWeight: 700, color: 'var(--gold-600)' }}>
            {sport?.name}
            {match.round && <span style={{ color: 'var(--mono-500)', fontWeight: 400 }}> · {roundLabel(match.round)}</span>}
          </span>
          <StatusBadge status={match.status} />
        </div>

        {offlineBanner}
        {banner(error, 'error')}
        {banner(notice, 'info')}

        {(match.status === 'upcoming' || match.status === 'postponed') && (
          <button
            onClick={handleStartMatch}
            disabled={saving}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '1.5rem', padding: '0.85rem', fontSize: '1.1rem', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Zap size={18} /> {saving ? 'กำลังเริ่ม...' : 'เริ่มการแข่งขัน (Start Live)'}
          </button>
        )}

        {match.status === 'finished' && (
          <GlassCard style={{ padding: '0.75rem 1rem', marginBottom: '1rem', textAlign: 'center', border: '1px solid rgba(251,191,36,0.4)' }}>
            {isAdmin ? (
              <span style={{ color: 'var(--gold-700)', fontSize: '0.9rem' }}>แมตช์จบแล้ว — ผู้ดูแลระบบแก้ได้ตลอด</span>
            ) : editExpired ? (
              <span style={{ color: '#b91c1c', fontSize: '0.9rem' }}>หมดเวลาแก้ไขแล้ว — ติดต่อผู้ดูแลระบบหากคะแนนผิด</span>
            ) : (
              <span style={{ color: 'var(--gold-700)', fontSize: '0.9rem' }}>
                แมตช์จบแล้ว — แก้ได้อีก <strong>{fmtRemaining(deadline.getTime() - now)}</strong> (ถึง {deadline.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })})
              </span>
            )}
          </GlassCard>
        )}

        {isSetSport && (
          <GlassCard style={{ padding: '0.75rem 1rem', marginBottom: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--mono-600)' }}>เซตที่ {match.current_set ?? 1}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold-600)', fontFamily: 'var(--font-heading)' }}>
              เซต {match.sets_a ?? 0} - {match.sets_b ?? 0}
              <span style={{ fontSize: '0.8rem', color: 'var(--mono-500)', fontWeight: 400, marginLeft: '0.5rem' }}>
                (ชนะ {sport?.sets_to_win} เซต{sport?.points_per_set ? ` · เซตละ ${sport.points_per_set}` : ''})
              </span>
            </div>
          </GlassCard>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          {[
            { key: 'a', team: teamA, score: match.score_a ?? 0, fallback: '#ef4444' },
            { key: 'b', team: teamB, score: match.score_b ?? 0, fallback: '#3b82f6' },
          ].map(({ key, team, score, fallback }) => (
            <GlassCard
              key={key}
              style={{
                padding: '1.25rem 0.75rem',
                textAlign: 'center',
                border: `2px solid ${team?.color_hex || fallback}66`,
                background: `${team?.color_hex || fallback}15`,
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                <TeamBadge name={team?.name} colorHex={team?.color_hex} emoji={team?.logo_emoji} size="md" />
              </div>
              <div style={{ fontSize: '4.5rem', fontFamily: 'var(--font-heading)', fontWeight: 900, color: 'var(--mono-900)', lineHeight: 1.1, margin: '0.5rem 0' }}>
                {score}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={() => handleScore(key, 1)}
                  disabled={!canScore}
                  className="btn btn-primary"
                  style={{ fontSize: '1.8rem', fontWeight: 800, padding: '0.9rem 0.5rem', minHeight: '96px', touchAction: 'manipulation' }}
                >
                  +1
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: sport?.name === 'บาสเกตบอล' ? '1fr 1fr 1fr' : '1fr', gap: '0.4rem' }}>
                  {sport?.name === 'บาสเกตบอล' && (
                    <>
                      <button onClick={() => handleScore(key, 2)} disabled={!canScore} className="btn btn-secondary btn-sm" style={{ fontWeight: 700, minHeight: '44px', touchAction: 'manipulation' }}>+2</button>
                      <button onClick={() => handleScore(key, 3)} disabled={!canScore} className="btn btn-secondary btn-sm" style={{ fontWeight: 700, minHeight: '44px', touchAction: 'manipulation' }}>+3</button>
                    </>
                  )}
                  <button
                    onClick={() => handleScore(key, -1)}
                    disabled={!canScore || score === 0}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--mono-500)', minHeight: '44px', touchAction: 'manipulation' }}
                  >
                    −1
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
          <button
            onClick={handleUndo}
            disabled={saving || !canScore || pending > 0}
            className="btn btn-secondary"
            style={{ flex: 1, fontSize: '0.9rem', minHeight: '44px' }}
          >
            ↶ ยกเลิกคะแนนล่าสุดของฉัน
          </button>
          {isSetSport && (
            <button
              onClick={handleFinishSet}
              disabled={saving || !live || pending > 0 || (match.score_a ?? 0) === (match.score_b ?? 0)}
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '0.9rem', color: 'var(--gold-600)', minHeight: '44px' }}
            >
              จบเซต {match.current_set ?? 1}
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--mono-500)', textAlign: 'center', marginBottom: '1rem' }}>
          {pending > 0
            ? `กำลังส่ง ${pending} รายการ...`
            : lastSync
            ? `✓ ซิงค์แล้ว ${lastSync.toLocaleTimeString('th-TH')}`
            : 'พร้อมบันทึกคะแนน'}
          {realtimeStatus !== 'SUBSCRIBED' && ' · Realtime ยังไม่เชื่อมต่อ'}
        </div>

        {live && (
          <button
            onClick={() => setCurrentStep(3)}
            disabled={pending > 0}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1.05rem', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Flag size={18} /> จบการแข่งขัน (ตรวจสอบและยืนยันผล)
          </button>
        )}
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
              <BadgeCheck size={56} style={{ color: '#16a34a' }} animateOnHover />
            </div>
            <h3 style={{ fontSize: '1.5rem', color: '#16a34a', marginBottom: '0.5rem' }}>บันทึกผลการแข่งขันเรียบร้อย!</h3>
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

            {banner(error, 'error')}

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--mono-700)' }}>กีฬา: {sport?.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', margin: '1rem 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <TeamBadge name={teamA?.name} colorHex={teamA?.color_hex} emoji={teamA?.logo_emoji} size="md" />
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)', marginTop: '0.25rem' }}>
                    {isSetSport ? match.sets_a : match.score_a}
                  </div>
                </div>
                <span style={{ fontSize: '1.2rem', color: 'var(--mono-400)', fontWeight: 700 }}>VS</span>
                <div style={{ textAlign: 'center' }}>
                  <TeamBadge name={teamB?.name} colorHex={teamB?.color_hex} emoji={teamB?.logo_emoji} size="md" />
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)', marginTop: '0.25rem' }}>
                    {isSetSport ? match.sets_b : match.score_b}
                  </div>
                </div>
              </div>
              {isSetSport && (match.score_a ?? 0) !== (match.score_b ?? 0) && (
                <div style={{ fontSize: '0.85rem', color: 'var(--mono-600)' }}>
                  เซตที่ {match.current_set} ({match.score_a}-{match.score_b}) จะถูกปิดให้อัตโนมัติเมื่อยืนยัน
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
