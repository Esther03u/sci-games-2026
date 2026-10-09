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
        <div className="mpc-tag">
          <span className="mpc-tag-sport">{s?.name || 'กีฬา'}</span>
          {(m.round || m.category) && (
            <span className="mpc-tag-round">
              · {roundLabel(m.round)}
              {m.category && !roundLabel(m.round)?.includes(m.category) ? ` (${m.category})` : ''}
            </span>
          )}
        </div>

        <div className="mpc-status">
          {m.is_walkover && <span className="mpc-walkover">★ ชนะบาย</span>}
          <StatusBadge status={m.status} />
        </div>
      </div>

      {/* Teams & Score Row */}
      <div className="mpc-teams">
        <div className="mpc-team">
          <TeamBadge name={a?.name || 'รอผล'} colorHex={a?.color_hex} emoji={a?.logo_emoji} size="md" />
        </div>

        <div className="mpc-score">
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
            <div className="mpc-current-set">
              เซตปัจจุบัน: {m.score_a ?? 0} - {m.score_b ?? 0}
            </div>
          )}
        </div>

        <div className="mpc-team-right">
          <TeamBadge name={b?.name || 'รอผล'} colorHex={b?.color_hex} emoji={b?.logo_emoji} size="md" />
        </div>
      </div>

      {/* Footer Info & Action Callout */}
      <div className="mpc-footer">
        <div className="mpc-meta">
          <span className="mpc-meta-item">
            <Clock size={13} style={{ color: 'var(--text-3)' }} />
            {fmtEventDay(m.match_date)} {fmtTime(m.match_time)} น.
          </span>
          <span className="mpc-meta-item">
            <MapPin size={13} style={{ color: 'var(--text-3)' }} />
            {fmtPlace(m)}
          </span>
          {dl && <span className="mpc-edit-left">แก้ได้อีก {fmtRemaining(dl.getTime() - now)}</span>}
        </div>

        <div>
          {teamsKnown ? (
            <div className="match-picker-cta">
              <span>{isLive ? '⚡ กำลังแข่ง · แตะลงคะแนน' : 'แตะเพื่อลงคะแนน →'}</span>
            </div>
          ) : (
            <span className="mpc-waiting">รอผลคู่ก่อนหน้า</span>
          )}
        </div>
      </div>
    </div>
  );
}
