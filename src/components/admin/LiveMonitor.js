'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { useLiveScores, useClock } from '@/hooks/useLiveScores';
import { relativeTime, fmtTime } from '@/lib/format';
import { ROUND_LABEL, EVENT_LABEL } from '@/lib/labels';
import { apiRequest } from '@/lib/api/client';
import Banner from '@/components/ui/Banner';
import { useConfirm } from '@/components/ui/ConfirmDialog';

const STATUS_ORDER = { live: 0, upcoming: 1, postponed: 2, finished: 3 };

export default function LiveMonitor({ initial }) {
  const { sports, teams, matches, setsByMatch, bumps, lastEvents, status, polling } = useLiveScores(initial, { withEvents: true });
  const now = useClock();
  const [filter, setFilter] = useState('active'); // active | all
  const [busy, setBusy] = useState(null); // match id
  const [error, setError] = useState('');
  const [override, setOverride] = useState(null); // match being overridden
  const [confirm, confirmDialog] = useConfirm();

  const rows = useMemo(() => {
    const list = filter === 'active' ? matches.filter((m) => m.status !== 'finished' || isRecent(m, now)) : matches;
    return list.slice().sort((a, b) => {
      const s = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      if (s !== 0) return s;
      const d = (a.match_date || '').localeCompare(b.match_date || '');
      if (d !== 0) return d;
      return (a.match_time || '').localeCompare(b.match_time || '');
    });
  }, [matches, filter, now]);

  const sportOf = (m) => sports.find((s) => s.id === m.sport_id);
  const teamOf = (id) => teams.find((t) => t.id === id);

  const act = async (m, action, body) => {
    setBusy(m.id);
    setError('');
    try {
      await apiRequest(`/api/match/${m.id}/${action}`, { body });
      // realtime will deliver the new row; nothing else to do
    } catch (err) {
      setError(`${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  const liveCount = matches.filter((m) => m.status === 'live').length;

  return (
    <div>
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="live-dot" />
          <strong style={{ color: 'var(--text)' }}>{liveCount} คู่กำลังแข่ง</strong>
          <span style={{ fontSize: '0.8rem', color: status === 'SUBSCRIBED' ? 'var(--success-text)' : polling ? 'var(--gold-700)' : 'var(--text-3)' }}>
            · {status === 'SUBSCRIBED' ? 'Realtime เชื่อมต่อแล้ว' : polling ? 'โหมดสำรอง (รีเฟรช 15 วิ)' : 'กำลังเชื่อมต่อ…'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('active')}>
            กำลังแข่ง / รอแข่ง
          </button>
          <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')}>
            ทั้งหมด ({matches.length})
          </button>
        </div>
      </div>

      <Banner kind="error">{error}</Banner>

      {rows.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-3)' }}>
          ไม่มีแมตช์ในมุมมองนี้ · <Link href="/admin/matches" style={{ color: 'var(--gold-700)' }}>สร้างแมตช์</Link>
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {rows.map((m) => {
            const sport = sportOf(m);
            const a = teamOf(m.team_a_id);
            const b = teamOf(m.team_b_id);
            const isSets = sport?.scoring_type === 'sets';
            const ev = lastEvents[m.id];
            const bump = bumps[m.id];
            const flash = bump && now && now - bump.at < 3000;
            const stale = m.status === 'live' && m.last_score_at && now - new Date(m.last_score_at).getTime() > 10 * 60 * 1000;

            return (
              <GlassCard
                key={m.id}
                style={{
                  padding: '0.85rem 1rem',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(120px, 1.2fr) minmax(200px, 2fr) minmax(160px, 1.5fr) auto',
                  gap: '0.75rem 1rem',
                  alignItems: 'center',
                  border: m.status === 'live' ? '1.5px solid rgba(239, 68, 68, 0.45)' : '1px solid var(--glass-border)',
                  background: flash ? 'rgba(22, 163, 74, 0.08)' : undefined,
                  transition: 'background 0.6s ease',
                }}
                className="admin-live-row"
              >
                {/* sport + meta */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: 'var(--text)' }}>{sport?.name || '—'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                    {m.round ? `${ROUND_LABEL[m.round] || m.round} · ` : ''}
                    {m.match_date?.slice(5)} {fmtTime(m.match_time)} · {m.venue}
                  </div>
                  <div style={{ marginTop: '0.3rem' }}>
                    <StatusBadge status={m.status} />
                  </div>
                </div>

                {/* score */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <TeamPill team={a} />
                  <div style={{ textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.9rem', fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>
                      {isSets ? `${m.sets_a ?? 0}–${m.sets_b ?? 0}` : `${m.score_a ?? 0}–${m.score_b ?? 0}`}
                    </div>
                    {isSets && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                        เซต {m.current_set ?? 1}: {m.score_a ?? 0}–{m.score_b ?? 0}
                        {(setsByMatch[m.id] || []).filter((s) => s.status === 'finished').length > 0 && (
                          <> · {(setsByMatch[m.id] || []).filter((s) => s.status === 'finished').map((s) => `${s.score_a}-${s.score_b}`).join(' ')}</>
                        )}
                      </div>
                    )}
                  </div>
                  <TeamPill team={b} />
                </div>

                {/* last actor */}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', minWidth: 0 }}>
                  {ev ? (
                    <>
                      <div style={{ color: 'var(--text-2)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ev.actor_label} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({ev.actor_type})</span>
                      </div>
                      <div>
                        {EVENT_LABEL[ev.event_type] || ev.event_type}
                        {ev.event_type === 'score' && ev.team ? ` ${ev.delta > 0 ? '+' : ''}${ev.delta} ${ev.team === 'a' ? a?.name : b?.name}` : ''}
                        {' · '}
                        {now ? relativeTime(ev.created_at, now) : ''}
                      </div>
                      {stale && <div style={{ color: 'var(--danger-text)', fontWeight: 600 }}>⚠ ไม่มีคะแนนมา 10 นาที+</div>}
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>ยังไม่มีการลงคะแนน</span>
                  )}
                </div>

                {/* actions */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {(m.status === 'upcoming' || m.status === 'postponed') && a && b && (
                    <button className="btn btn-sm btn-primary" disabled={busy === m.id} onClick={() => act(m, 'start')} style={{ background: 'var(--success-text)' }}>
                      เริ่ม
                    </button>
                  )}
                  {m.status === 'live' && (
                    <button className="btn btn-sm btn-primary" disabled={busy === m.id} onClick={async () => (await confirm({ title: 'จบแมตช์?', message: `${sport?.name}: ${a?.name} ${isSets ? m.sets_a : m.score_a}–${isSets ? m.sets_b : m.score_b} ${b?.name}`, confirmLabel: 'จบแมตช์' })) && act(m, 'finish')}>
                      จบแมตช์
                    </button>
                  )}
                  {m.status === 'finished' && (
                    <button className="btn btn-sm btn-secondary" disabled={busy === m.id} onClick={async () => (await confirm({ title: 'เปิดแมตช์ใหม่?', message: 'แมตช์จะกลับเป็น "กำลังแข่ง" และคะแนนสะสมจะถูกคำนวณใหม่เมื่อจบอีกครั้ง', confirmLabel: 'เปิดใหม่' })) && act(m, 'reopen')}>
                      เปิดใหม่
                    </button>
                  )}
                  {(m.status === 'live' || m.status === 'finished') && (
                    <button className="btn btn-sm btn-secondary" disabled={busy === m.id} onClick={() => setOverride(m)}>
                      แก้คะแนน
                    </button>
                  )}
                  <Link href={`/live/${m.sport_id}`} target="_blank" className="btn btn-sm btn-secondary" title="ดูหน้าผู้ชม">
                    ↗
                  </Link>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {override && (
        <OverrideModal
          match={override}
          sport={sportOf(override)}
          teamA={teamOf(override.team_a_id)}
          teamB={teamOf(override.team_b_id)}
          onClose={() => setOverride(null)}
          onSubmit={async (body) => {
            await act(override, 'override', body);
            setOverride(null);
          }}
        />
      )}

      {confirmDialog}

      <style jsx global>{`
        @media (max-width: 720px) {
          .admin-live-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function isRecent(m, now) {
  return m.finished_at && now && now - new Date(m.finished_at).getTime() < 60 * 60 * 1000;
}

function TeamPill({ team }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 9px',
        borderRadius: 999,
        background: team ? `${team.color_hex}1a` : 'var(--surface-2)',
        color: team ? 'var(--text)' : 'var(--text-muted)',
        fontSize: '0.8rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: team?.color_hex || 'var(--border)' }} />
      {team?.name || 'รอผล'}
    </span>
  );
}

function OverrideModal({ match, sport, teamA, teamB, onClose, onSubmit }) {
  const isSets = sport?.scoring_type === 'sets';
  const [scoreA, setScoreA] = useState(match.score_a ?? 0);
  const [scoreB, setScoreB] = useState(match.score_b ?? 0);
  const [setsA, setSetsA] = useState(match.sets_a ?? 0);
  const [setsB, setSetsB] = useState(match.sets_b ?? 0);
  const [saving, setSaving] = useState(false);

  const num = (v) => Math.max(0, parseInt(v, 10) || 0);

  return (
    <Modal isOpen onClose={onClose} title={`แก้คะแนน — ${sport?.name}`}>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1rem' }}>
        ตั้งค่าคะแนนตรง ๆ (บันทึกเป็น event ประเภท override พร้อมชื่อผู้แก้){isSets ? ' — คะแนนคือเซตปัจจุบัน, เซตคือจำนวนเซตที่ชนะ' : ''}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {[
          { label: teamA?.name || 'ทีม A', score: scoreA, setScore: setScoreA, sets: setsA, setSets: setSetsA },
          { label: teamB?.name || 'ทีม B', score: scoreB, setScore: setScoreB, sets: setsB, setSets: setSetsB },
        ].map((t) => (
          <div key={t.label}>
            <div style={{ fontWeight: 700, color: 'var(--text-2)', marginBottom: '0.4rem' }}>{t.label}</div>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>{isSets ? 'คะแนนเซตปัจจุบัน' : 'คะแนน'}</label>
            <input className="form-input" type="number" min="0" value={t.score} onChange={(e) => t.setScore(num(e.target.value))} />
            {isSets && (
              <>
                <label className="form-label" style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>เซตที่ชนะ</label>
                <input className="form-input" type="number" min="0" value={t.sets} onChange={(e) => t.setSets(num(e.target.value))} />
              </>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
        <button className="btn btn-secondary" onClick={onClose} disabled={saving} style={{ flex: 1 }}>
          ยกเลิก
        </button>
        <button
          className="btn btn-primary"
          disabled={saving}
          style={{ flex: 2 }}
          onClick={async () => {
            setSaving(true);
            try {
              await onSubmit({ score_a: scoreA, score_b: scoreB, sets_a: isSets ? setsA : null, sets_b: isSets ? setsB : null });
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกคะแนน'}
        </button>
      </div>
    </Modal>
  );
}
