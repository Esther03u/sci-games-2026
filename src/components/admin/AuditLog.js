'use client';
import { useMemo, useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import AdminTable, { Td, TR, EmptyRow } from '@/components/ui/AdminTable';
import { ROUND_LABEL, EVENT_LABEL, ACTION_LABEL } from '@/lib/labels';
import { fmtShortDateTimeSec as fmt, fmtTime } from '@/lib/format';
import { adminApi } from '@/lib/admin-api';
import Banner from '@/components/ui/Banner';
import { useConfirm } from '@/components/ui/ConfirmDialog';


export default function AuditLog({ events: initialEvents, logs, sports, teams, matches }) {
  const [tab, setTab] = useState('scores'); // scores | admin
  const [events, setEvents] = useState(initialEvents);
  const [sportId, setSportId] = useState('all');
  const [matchId, setMatchId] = useState('all');
  const [actor, setActor] = useState('');
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState('');
  const [msgKind, setMsgKind] = useState('success');
  const [confirm, confirmDialog] = useConfirm();

  const matchById = useMemo(() => Object.fromEntries(matches.map((m) => [m.id, m])), [matches]);
  const sportById = useMemo(() => Object.fromEntries(sports.map((s) => [s.id, s])), [sports]);
  const teamById = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams]);

  const matchLabel = (id) => {
    const m = matchById[id];
    if (!m) return id?.slice(0, 8) || '—';
    return `${sportById[m.sport_id]?.name || ''}${m.round ? ` ${ROUND_LABEL[m.round] || m.round}` : ''}: ${teamById[m.team_a_id]?.name || '?'} vs ${teamById[m.team_b_id]?.name || '?'}`;
  };

  const filteredEvents = useMemo(
    () =>
      events.filter((e) => {
        const m = matchById[e.match_id];
        if (sportId !== 'all' && m?.sport_id !== sportId) return false;
        if (matchId !== 'all' && e.match_id !== matchId) return false;
        if (actor && !(e.actor_label || '').toLowerCase().includes(actor.toLowerCase())) return false;
        return true;
      }),
    [events, sportId, matchId, actor, matchById]
  );

  const matchOptions = useMemo(
    () => matches.filter((m) => sportId === 'all' || m.sport_id === sportId).sort((a, b) => (b.match_date + b.match_time).localeCompare(a.match_date + a.match_time)),
    [matches, sportId]
  );

  const undo = async (e) => {
    const ok = await confirm({ title: 'ย้อนคะแนน?', message: `${e.delta > 0 ? '+' : ''}${e.delta} — ${matchLabel(e.match_id)}`, confirmLabel: 'ย้อน', danger: true });
    if (!ok) return;
    setBusy(e.id);
    setMsg('');
    try {
      await adminApi('/api/score/undo', { body: { event_id: e.id } });
      setEvents((prev) => prev.map((x) => (x.id === e.id ? { ...x, undone_by: 'pending' } : x)));
      setMsgKind('success');
      setMsg('ย้อนคะแนนแล้ว — หน้าผู้ชมอัปเดตทันที');
    } catch (err) {
      setMsgKind('error');
      setMsg(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        <button className={`btn btn-sm ${tab === 'scores' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('scores')}>
          คะแนนจากสนาม ({events.length})
        </button>
        <button className={`btn btn-sm ${tab === 'admin' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('admin')}>
          การแก้ไขข้อมูล ({logs.length})
        </button>
      </div>

      <Banner kind={msgKind}>{msg}</Banner>

      {tab === 'scores' ? (
        <>
          <GlassCard style={{ padding: '0.85rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="form-input" style={{ width: 'auto', minWidth: 140 }} value={sportId} onChange={(e) => { setSportId(e.target.value); setMatchId('all'); }}>
              <option value="all">ทุกกีฬา</option>
              {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="form-input" style={{ width: 'auto', minWidth: 220, maxWidth: '100%' }} value={matchId} onChange={(e) => setMatchId(e.target.value)}>
              <option value="all">ทุกแมตช์</option>
              {matchOptions.map((m) => <option key={m.id} value={m.id}>{matchLabel(m.id)} ({m.match_date?.slice(5)} {fmtTime(m.match_time)})</option>)}
            </select>
            <input className="form-input" style={{ width: 'auto', minWidth: 160 }} placeholder="ค้นหาชื่อผู้กด" value={actor} onChange={(e) => setActor(e.target.value)} />
            <span style={{ fontSize: '0.8rem', color: 'var(--mono-500)', marginLeft: 'auto' }}>{filteredEvents.length} รายการ (ล่าสุด 500)</span>
          </GlassCard>

          {matchId !== 'all' && <Timeline events={filteredEvents.slice().reverse()} match={matchById[matchId]} teamById={teamById} sport={sportById[matchById[matchId]?.sport_id]} />}

          <AdminTable columns={['เวลา', 'แมตช์', 'รายการ', 'คะแนน', 'โดย', '']} minWidth={720}>
                {filteredEvents.map((e) => {
                  const m = matchById[e.match_id];
                  const teamName = e.team ? teamById[e.team === 'a' ? m?.team_a_id : m?.team_b_id]?.name : null;
                  const undone = Boolean(e.undone_by);
                  const to = e.meta?.to;
                  return (
                    <tr key={e.id} style={{ ...TR, opacity: undone ? 0.5 : 1 }}>
                      <Td>{fmt(e.created_at)}</Td>
                      <Td style={{ maxWidth: 260 }}>{matchLabel(e.match_id)}</Td>
                      <Td>
                        <span style={{ fontWeight: 700, color: e.event_type === 'score' ? (e.delta > 0 ? '#15803d' : '#b91c1c') : 'var(--mono-800)' }}>
                          {EVENT_LABEL[e.event_type] || e.event_type}
                          {e.event_type === 'score' || e.event_type === 'undo' ? ` ${e.delta > 0 ? '+' : ''}${e.delta}` : ''}
                        </span>
                        {teamName && <span style={{ color: 'var(--mono-600)' }}> {teamName}</span>}
                        {e.set_number ? <span style={{ color: 'var(--mono-400)' }}> · เซต {e.set_number}</span> : null}
                        {undone && <span style={{ color: 'var(--mono-400)' }}> (ถูกยกเลิกแล้ว)</span>}
                      </Td>
                      <Td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{to ? `${to.a ?? '?'}–${to.b ?? '?'}` : e.meta?.score ? `${e.meta.score.a}–${e.meta.score.b}` : ''}</Td>
                      <Td>
                        {e.actor_label} <span style={{ color: 'var(--mono-400)' }}>({e.actor_type})</span>
                      </Td>
                      <Td style={{ textAlign: 'right' }}>
                        {e.event_type === 'score' && !undone && (
                          <button className="btn btn-sm btn-secondary" disabled={busy === e.id} onClick={() => undo(e)}>
                            ↶ ย้อน
                          </button>
                        )}
                      </Td>
                    </tr>
                  );
                })}
                {filteredEvents.length === 0 && <EmptyRow colSpan={6}>ไม่มีรายการ</EmptyRow>}
              </AdminTable>
        </>
      ) : (
        <AdminTable columns={['เวลา', 'ผู้ดูแล', 'การกระทำ', 'ตาราง', 'รายละเอียด']} minWidth={720}>
              {logs.map((l) => {
                const act = l.action.replace(`_${l.target_type}`, '');
                return (
                  <tr key={l.id} style={{ ...TR, verticalAlign: 'top' }}>
                    <Td>{fmt(l.created_at)}</Td>
                    <Td>{l.admin_users?.display_name || l.admin_user_id?.slice(0, 8)}</Td>
                    <Td style={{ fontWeight: 700, color: 'var(--mono-800)' }}>{ACTION_LABEL[act] || ACTION_LABEL[l.action] || l.action}</Td>
                    <Td>{l.target_type}</Td>
                    <Td style={{ maxWidth: 420 }}>
                      <Diff oldValues={l.old_values} newValues={l.new_values} />
                    </Td>
                  </tr>
                );
              })}
              {logs.length === 0 && <EmptyRow colSpan={5}>ยังไม่มีรายการ</EmptyRow>}
            </AdminTable>
      )}
      {confirmDialog}
    </div>
  );
}


const SKIP = new Set(['id', 'created_at', 'updated_at', 'updated_by']);

// Shows only the fields that changed between old and new.
function Diff({ oldValues, newValues }) {
  const keys = new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})]);
  const rows = [];
  for (const k of keys) {
    if (SKIP.has(k)) continue;
    const o = oldValues?.[k];
    const n = newValues?.[k];
    if (JSON.stringify(o) === JSON.stringify(n)) continue;
    rows.push(
      <div key={k} style={{ fontSize: '0.78rem' }}>
        <span style={{ color: 'var(--mono-500)' }}>{k}:</span>{' '}
        {oldValues && o !== undefined && <span style={{ color: '#b91c1c', textDecoration: 'line-through' }}>{String(o ?? '∅')}</span>}{' '}
        {newValues && n !== undefined && <span style={{ color: '#15803d', fontWeight: 600 }}>{String(n ?? '∅')}</span>}
      </div>
    );
  }
  if (rows.length === 0) return <span style={{ color: 'var(--mono-400)' }}>—</span>;
  return <div>{rows.slice(0, 8)}{rows.length > 8 && <div style={{ color: 'var(--mono-400)', fontSize: '0.75rem' }}>+{rows.length - 8} ฟิลด์</div>}</div>;
}

// Score progression for one match: 0-0 → 1-0 → 1-1 …
function Timeline({ events, match, teamById, sport }) {
  if (!match) return null;
  const a = teamById[match.team_a_id]?.name || 'A';
  const b = teamById[match.team_b_id]?.name || 'B';
  const steps = events.filter((e) => e.meta?.to && !e.undone_by).map((e) => `${e.meta.to.a}–${e.meta.to.b}`);
  return (
    <GlassCard style={{ padding: '0.85rem 1rem', marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--mono-600)', marginBottom: '0.4rem' }}>
        ลำดับคะแนน {sport?.name} · {a} vs {b}{sport?.scoring_type === 'sets' ? ' (คะแนนในเซต)' : ''}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--mono-800)', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--mono-400)' }}>0–0</span>
        {steps.map((s, i) => (
          <span key={i}>→ {s}</span>
        ))}
        {steps.length === 0 && <span style={{ color: 'var(--mono-400)' }}>ยังไม่มีคะแนน</span>}
      </div>
    </GlassCard>
  );
}
