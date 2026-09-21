'use client';
import GlassCard from '@/components/ui/GlassCard';
import TeamBadge from '@/components/ui/TeamBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import Banner from '@/components/ui/Banner';
import { MapPin, Clock } from '@/components/animate-ui/icons';
import { fmtRemaining, fmtTime } from '@/lib/format';
import { roundLabel } from '@/lib/labels';
import { editDeadline } from './scoring';

/** Step 1 — pick the match to score, grouped live / upcoming / recently finished. */
export default function MatchPicker({
  groups,
  sports,
  teams,
  now,
  editWindowMinutes,
  realtimeStatus,
  noAssignment,
  offlineBanner,
  error,
  onSelect,
}) {
  const renderCard = (m) => {
    const s = sports.find((x) => x.id === m.sport_id);
    const a = teams.find((t) => t.id === m.team_a_id);
    const b = teams.find((t) => t.id === m.team_b_id);
    const teamsKnown = a && b;
    const dl = m.status === 'finished' ? editDeadline(m, editWindowMinutes) : null;

    return (
      <div
        key={m.id}
        onClick={() => teamsKnown && onSelect(m)}
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
            {m.round && <span style={{ color: 'var(--text-3)', fontWeight: 400 }}> · {roundLabel(m.round)}</span>}
          </span>
          <StatusBadge status={m.status} />
        </div>

        <div className="flex-between" style={{ padding: '0.5rem 0' }}>
          <TeamBadge name={a?.name || 'รอผล'} colorHex={a?.color_hex} emoji={a?.logo_emoji} size="md" />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
            {s?.scoring_type === 'sets' ? `${m.sets_a ?? 0} - ${m.sets_b ?? 0}` : `${m.score_a ?? 0} - ${m.score_b ?? 0}`}
          </span>
          <TeamBadge name={b?.name || 'รอผล'} colorHex={b?.color_hex} emoji={b?.logo_emoji} size="md" />
        </div>

        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-3)',
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <MapPin size={12} /> {m.venue}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> {fmtTime(m.match_time)} น.
          </span>
          {dl && (
            <span style={{ color: 'var(--gold-700)', marginLeft: 'auto' }}>แก้ได้อีก {fmtRemaining(dl.getTime() - now)}</span>
          )}
        </div>
      </div>
    );
  };

  const renderGroup = (title, list, emptyText) => (
    <section style={{ marginBottom: '1.5rem' }}>
      <h3
        style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.6rem',
        }}
      >
        {title} <span style={{ color: 'var(--text-muted)' }}>({list.length})</span>
      </h3>
      {list.length === 0 ? (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>{emptyText}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>{list.map(renderCard)}</div>
      )}
    </section>
  );

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.25rem' }}>
          เลือกคู่การแข่งขันที่จะลงคะแนน
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
          {realtimeStatus === 'SUBSCRIBED' ? 'รายการอัปเดตอัตโนมัติ' : 'กำลังเชื่อมต่อ Realtime...'}
        </p>
      </div>

      {offlineBanner}
      <Banner kind="error">{error}</Banner>

      {noAssignment ? (
        <GlassCard style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-3)' }}>
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
