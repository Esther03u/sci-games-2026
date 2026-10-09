'use client';
import TeamBadge from '@/components/ui/TeamBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, fmtPlace } from '@/lib/format';
import { formatSetScores } from '@/lib/match-editor';
import { Calendar, MapPin, Pencil, Trash2, RotateCcw, Play } from '@/components/animate-ui/icons';

const ACTION_BTN = {
  padding: '0.25rem 0.55rem',
  fontSize: '0.78rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
};
const RESET_BTN = {
  ...ACTION_BTN,
  color: 'var(--gold-700)',
  borderColor: 'rgba(245, 158, 11, 0.45)',
  background: 'rgba(245, 158, 11, 0.08)',
};
const START_BTN = {
  ...ACTION_BTN,
  color: '#2563eb',
  borderColor: 'rgba(37, 99, 235, 0.4)',
  background: 'rgba(37, 99, 235, 0.08)',
};
const REOPEN_BTN = {
  ...ACTION_BTN,
  color: 'var(--success-text)',
  borderColor: 'rgba(34, 197, 94, 0.4)',
  background: 'rgba(34, 197, 94, 0.08)',
};
const DELETE_BTN = { ...ACTION_BTN, color: 'var(--danger-text)' };
const WALKOVER_PILL = {
  background: 'rgba(245, 158, 11, 0.15)',
  color: 'var(--gold-700)',
  border: '1px solid rgba(245, 158, 11, 0.35)',
  borderRadius: '999px',
  padding: '2px 7px',
  fontSize: '0.72rem',
  fontWeight: 800,
  whiteSpace: 'nowrap',
};

function MatchTeamBadge({ team }) {
  return (
    <TeamBadge
      name={team?.name || 'รอผลการแข่งขัน'}
      colorHex={team?.color_hex || '#94a3b8'}
      emoji={team?.logo_emoji || ''}
      size="sm"
    />
  );
}

/** One row of the admin match table: teams, score, status, schedule and actions */
export default function MatchRow({ match: m, sport, teamA, teamB, actions }) {
  const isSetSport = sport?.scoring_type === 'sets';
  const hasFinishedSets =
    isSetSport &&
    Array.isArray(m.match_sets) &&
    m.match_sets.some((s) => s.score_a !== null && s.score_b !== null);

  return (
    <tr>
      <td>
        <strong style={{ color: 'var(--text)' }}>{sport?.name}</strong>
        {m.round && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
            รอบ {m.round} {m.match_number ? `(คู่ที่ ${m.match_number})` : ''}
          </div>
        )}
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MatchTeamBadge team={teamA} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>VS</span>
          <MatchTeamBadge team={teamB} />
        </div>
      </td>
      <td style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.15rem',
            fontWeight: 800,
            color: 'var(--text)',
          }}
        >
          {m.status === 'upcoming' && m.score_a === null
            ? '-'
            : isSetSport
              ? `${m.sets_a ?? 0} - ${m.sets_b ?? 0}` // score_a/b hold the final set's points
              : `${m.score_a ?? 0} - ${m.score_b ?? 0}`}
          {isSetSport && m.status !== 'upcoming' && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-3)',
                marginLeft: '4px',
              }}
            >
              (เซต)
            </span>
          )}
        </div>
        {hasFinishedSets && (
          <div style={{ fontSize: '0.74rem', color: 'var(--text-2)', marginTop: '2px' }}>
            {formatSetScores(m.match_sets)}
          </div>
        )}
      </td>
      <td>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            flexWrap: 'wrap',
          }}
        >
          <StatusBadge status={m.status} />
          {m.is_walkover && <span style={WALKOVER_PILL}>ชนะบาย</span>}
        </div>
      </td>
      <td style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginBottom: '0.2rem',
          }}
        >
          <Calendar size={13} style={{ color: '#60a5fa', flexShrink: 0 }} />
          <span>
            {formatDate(m.match_date)} | {m.match_time?.slice(0, 5)} น.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <MapPin size={13} style={{ color: '#f87171', flexShrink: 0 }} />
          <span>{fmtPlace(m)}</span>
        </div>
      </td>
      <td style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            gap: '0.35rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => actions.onEditScore(m)}
            className="btn btn-primary btn-sm"
            title="บันทึกผลคะแนนหรือชนะบาย"
            style={ACTION_BTN}
          >
            <Pencil size={12} />
            <span>บันทึกผล</span>
          </button>

          <button
            type="button"
            onClick={() => actions.onEditSchedule(m)}
            className="btn btn-secondary btn-sm"
            title="แก้ไขทีม วัน เวลา หรือสนาม"
            style={ACTION_BTN}
          >
            <Calendar size={12} />
            <span>แก้ตาราง</span>
          </button>

          <button
            type="button"
            onClick={() => actions.onReset(m)}
            className="btn btn-secondary btn-sm"
            title="ล้างคะแนนและสถานะกลับเป็นยังไม่แข่ง (ตารางคู่แข่งยังคงอยู่ครบ 100%)"
            style={RESET_BTN}
          >
            <RotateCcw size={12} />
            <span>รีเซ็ตผล</span>
          </button>

          {m.status === 'upcoming' && m.team_a_id && m.team_b_id && (
            <button
              type="button"
              onClick={() => actions.onStart(m)}
              className="btn btn-secondary btn-sm"
              title="เริ่มการแข่งขัน (เปลี่ยนสถานะเป็น Live)"
              style={START_BTN}
            >
              <Play size={12} />
              <span>เริ่มแข่ง</span>
            </button>
          )}

          {m.status === 'finished' && (
            <button
              type="button"
              onClick={() => actions.onReopen(m)}
              className="btn btn-secondary btn-sm"
              title="เปิดกลับมาแข่งขันต่อ (Live)"
              style={REOPEN_BTN}
            >
              <Play size={12} />
              <span>แข่งต่อ</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => actions.onDelete(m)}
            className="btn btn-secondary btn-sm"
            title="ลบแมตช์นี้ออกจากตารางถาวร"
            style={DELETE_BTN}
          >
            <Trash2 size={12} />
            <span>ลบ</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
