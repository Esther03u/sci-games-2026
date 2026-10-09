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
        <div className="sp-set-strip">
          <span className="sp-set-label">
            เซตที่ <strong className="sp-set-num">{match.current_set ?? 1}</strong>
          </span>
          <span className="sp-set-score">
            {match.sets_a ?? 0} <span className="sp-set-dash">–</span> {match.sets_b ?? 0}
          </span>
          <span className="sp-set-rule">
            ชนะ {sport?.sets_to_win} เซต{sport?.points_per_set ? ` · เซตละ ${sport.points_per_set}` : ''}
          </span>
        </div>
      )}

      <div className="sp-board-grid">
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
        <div className="sp-vs">
          <div className="sp-vs-line" />
          <span className="sp-vs-chip">VS</span>
        </div>
      </div>

      {finishedSets.length > 0 && (
        <div className="sp-past-sets">
          เซตที่ผ่านมา: {finishedSets.map((x) => `${x.score_a}–${x.score_b}`).join(' | ')}
        </div>
      )}
    </div>
  );
}
