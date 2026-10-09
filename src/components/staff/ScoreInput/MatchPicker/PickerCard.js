'use client';
import TeamBadge from '@/components/ui/TeamBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { MapPin, Clock } from '@/components/animate-ui/icons';
import { fmtRemaining, fmtTime, fmtPlace, fmtEventDay } from '@/lib/format';
import { roundLabel } from '@/lib/labels';
import { pressable } from '@/lib/pressable';
import { editDeadline } from '../scoring';

/** One match in the picker; disabled until both teams are known (bracket slots). */
export default function PickerCard({ m, sport: s, teamA: a, teamB: b, now, editWindowMinutes, onSelect }) {
  const teamsKnown = Boolean(a && b);
  const dl = m.status === 'finished' ? editDeadline(m, editWindowMinutes) : null;
  const isLive = m.status === 'live';

  return (
    <div
      {...pressable(() => onSelect(m), !teamsKnown)}
      className={`match-picker-card ${isLive ? 'is-live' : ''}`}
      style={{
        cursor: teamsKnown ? 'pointer' : 'not-allowed',
        opacity: teamsKnown ? 1 : 0.6,
      }}
    >
      {/* Header Tag & Status */}
      <div className="flex-between" style={{ marginBottom: '0.65rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'var(--surface-2)',
            padding: '0.22rem 0.6rem',
            borderRadius: '8px',
            border: '1px solid var(--border)',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>
            {s?.name || 'กีฬา'}
          </span>
          {(m.round || m.category) && (
            <span style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>
              · {roundLabel(m.round)}
              {m.category && !roundLabel(m.round)?.includes(m.category) ? ` (${m.category})` : ''}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {m.is_walkover && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--gold-700)',
                background: 'rgba(251, 191, 36, 0.15)',
                border: '1px solid var(--gold-500)',
                borderRadius: '6px',
                padding: '1px 6px',
              }}
            >
              ★ ชนะบาย
            </span>
          )}
          <StatusBadge status={m.status} />
        </div>
      </div>

      {/* Teams & Score Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 0',
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <TeamBadge name={a?.name || 'รอผล'} colorHex={a?.color_hex} emoji={a?.logo_emoji} size="md" />
        </div>

        <div style={{ padding: '0 0.85rem', textAlign: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.45rem',
              fontWeight: 800,
              letterSpacing: '1px',
              color: isLive ? '#22c55e' : 'var(--text)',
            }}
          >
            {s?.scoring_type === 'sets'
              ? `${m.sets_a ?? 0} - ${m.sets_b ?? 0}`
              : `${m.score_a ?? 0} - ${m.score_b ?? 0}`}
          </span>
          {s?.scoring_type === 'sets' && isLive && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '2px' }}>
              เซตปัจจุบัน: {m.score_a ?? 0} - {m.score_b ?? 0}
            </div>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <TeamBadge name={b?.name || 'รอผล'} colorHex={b?.color_hex} emoji={b?.logo_emoji} size="md" />
        </div>
      </div>

      {/* Footer Info & Action Callout */}
      <div
        style={{
          fontSize: '0.78rem',
          color: 'var(--text-3)',
          marginTop: '0.65rem',
          paddingTop: '0.6rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={13} style={{ color: 'var(--text-3)' }} />
            {fmtEventDay(m.match_date)} {fmtTime(m.match_time)} น.
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <MapPin size={13} style={{ color: 'var(--text-3)' }} />
            {fmtPlace(m)}
          </span>
          {dl && (
            <span style={{ color: 'var(--gold-700)', fontWeight: 600 }}>
              แก้ได้อีก {fmtRemaining(dl.getTime() - now)}
            </span>
          )}
        </div>

        <div>
          {teamsKnown ? (
            <div className="match-picker-cta">
              <span>{isLive ? '⚡ กำลังแข่ง · แตะลงคะแนน' : 'แตะเพื่อลงคะแนน →'}</span>
            </div>
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>รอผลคู่ก่อนหน้า</span>
          )}
        </div>
      </div>
    </div>
  );
}
