'use client';
import TeamColumn from './TeamColumn';

/** Set strip (set sports), both team columns with the VS divider, and earlier sets. */
export default function Scoreboard({
  match,
  sport,
  teamA,
  teamB,
  live,
  isSetSport,
  finishedSets,
  canScore,
  isBasket,
  score,
}) {
  return (
    <div
      className="glass-card score-board"
      style={{
        padding: 0,
        overflow: 'hidden',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '380px',
        border: live ? '1.5px solid rgba(239, 68, 68, 0.35)' : undefined,
      }}
    >
      {isSetSport && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '0.6rem 1rem',
            background: 'var(--surface-2)',
            borderBottom: '1px solid var(--glass-border)',
            fontSize: '0.85rem',
            flexShrink: 0,
          }}
        >
          <span style={{ color: 'var(--text-3)' }}>
            เซตที่ <strong style={{ color: 'var(--text)' }}>{match.current_set ?? 1}</strong>
          </span>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 900,
              fontSize: '1.15rem',
              color: 'var(--text)',
            }}
          >
            {match.sets_a ?? 0} <span style={{ color: 'var(--text-muted)' }}>–</span> {match.sets_b ?? 0}
          </span>
          <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>
            ชนะ {sport?.sets_to_win} เซต{sport?.points_per_set ? ` · เซตละ ${sport.points_per_set}` : ''}
          </span>
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'stretch',
          minHeight: 0,
        }}
      >
        {[
          { key: 'a', team: teamA, value: match.score_a ?? 0, fallback: '#ef4444' },
          { key: 'b', team: teamB, value: match.score_b ?? 0, fallback: '#0284c7' },
        ].map(({ key, team, value, fallback }, idx) => (
          <TeamColumn
            key={key}
            side={key}
            team={team}
            value={value}
            fallback={fallback}
            column={idx === 0 ? 1 : 3}
            canScore={canScore}
            isBasket={isBasket}
            score={score}
          />
        ))}

        {/* VS divider */}
        <div
          style={{
            gridColumn: 2,
            gridRow: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 0.15rem',
            position: 'relative',
            height: '100%',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '5%',
              bottom: '5%',
              width: 1,
              background: 'var(--glass-border)',
            }}
          />
          <span
            style={{
              position: 'relative',
              background: 'var(--surface, #fff)',
              border: '1px solid var(--glass-border)',
              borderRadius: 999,
              padding: '4px 9px',
              fontSize: '0.72rem',
              fontWeight: 800,
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
            }}
          >
            VS
          </span>
        </div>
      </div>

      {finishedSets.length > 0 && (
        <div
          style={{
            padding: '0.5rem 1rem 0.7rem',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-3)',
            borderTop: '1px solid var(--glass-border)',
            flexShrink: 0,
          }}
        >
          เซตที่ผ่านมา: {finishedSets.map((x) => `${x.score_a}–${x.score_b}`).join(' | ')}
        </div>
      )}
    </div>
  );
}
