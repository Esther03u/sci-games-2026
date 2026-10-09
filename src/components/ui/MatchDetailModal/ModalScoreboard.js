'use client';
import { Calendar } from '@/components/animate-ui/icons';
import { fmtEventDay } from '@/lib/format';
import TeamName from './TeamName';

/** Big scoreboard: team names either side, time / final score / live score in the middle. */
export default function ModalScoreboard({
  match,
  sport,
  view,
  styleA,
  styleB,
  isScheduleView,
  matchTimeStr,
}) {
  const {
    isFinal,
    isThird,
    isMedalRound,
    teamA,
    teamB,
    isLive,
    isFinished,
    scoreA,
    scoreB,
    teamAWins,
    teamBWins,
  } = view;
  return (
    <div
      style={{
        padding: '1.25rem 0.75rem 1.15rem',
        overflow: 'hidden',
        background: isFinal
          ? `radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.28) 0%, transparent 70%), radial-gradient(ellipse at 0% 50%, ${styleA.hex}40 0%, transparent 65%), radial-gradient(ellipse at 100% 50%, ${styleB.hex}40 0%, transparent 65%), linear-gradient(135deg, var(--mc-gold-tint) 0%, var(--surface) 40%, var(--surface) 60%, var(--mc-gold-tint-soft) 100%)`
          : isThird
            ? `radial-gradient(ellipse at 50% 0%, rgba(234, 88, 12, 0.24) 0%, transparent 70%), radial-gradient(ellipse at 0% 50%, ${styleA.hex}40 0%, transparent 65%), radial-gradient(ellipse at 100% 50%, ${styleB.hex}40 0%, transparent 65%), linear-gradient(135deg, var(--mc-bronze-tint) 0%, var(--surface) 40%, var(--surface) 60%, var(--mc-bronze-tint-soft) 100%)`
            : `radial-gradient(ellipse at 0% 50%, ${styleA.hex}40 0%, transparent 65%), radial-gradient(ellipse at 100% 50%, ${styleB.hex}40 0%, transparent 65%), linear-gradient(90deg, ${styleA.hex}22 0%, var(--surface) 38%, var(--surface) 62%, ${styleB.hex}22 100%)`,
      }}
    >
      <div className="md-board">
        {/* Team A (Left) - Perfectly Centered Name */}
        <TeamName
          team={teamA}
          wins={teamAWins}
          lost={isFinished && teamBWins}
          isMedalRound={isMedalRound}
          isFinal={isFinal}
          isThird={isThird}
        />

        {/* Match Score / Time Status */}
        <div className="md-board-center">
          {isScheduleView ? (
            /* SCHEDULE MODE: SHOW TIME ONLY */
            <div>
              <div
                style={{
                  fontSize: 'clamp(1.25rem, 4vw, 1.65rem)',
                  fontWeight: 900,
                  fontFamily: 'var(--font-heading)',
                  color: isFinal ? 'var(--mc-gold-ink)' : isThird ? 'var(--mc-bronze-ink)' : 'var(--text)',
                  lineHeight: 1,
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                {matchTimeStr}
              </div>
            </div>
          ) : isFinished ? (
            /* RESULTS MODE: FINISHED SCORE */
            <div>
              <div className="md-big-score">
                <span
                  style={{
                    color: isFinished && teamBWins ? 'var(--text-3)' : 'var(--text)',
                    opacity: isFinished && teamBWins ? 0.5 : 1,
                  }}
                >
                  {scoreA}
                </span>
                <span className="md-score-dash">-</span>
                <span
                  style={{
                    color: isFinished && teamAWins ? 'var(--text-3)' : 'var(--text)',
                    opacity: isFinished && teamAWins ? 0.5 : 1,
                  }}
                >
                  {scoreB}
                </span>
              </div>
              {match.is_walkover && <div className="md-walkover">★ ชนะบาย (Walkover)</div>}
            </div>
          ) : isLive ? (
            /* RESULTS MODE: LIVE MATCH (REAL-TIME SCORE) */
            <div>
              <div className="md-big-score">
                <span className="md-text">{scoreA ?? 0}</span>
                <span className="md-score-dash">-</span>
                <span className="md-text">{scoreB ?? 0}</span>
              </div>
              <div className="md-live-line">
                <span className="md-live-dot" />
                <span>กำลังแข่งขัน (LIVE)</span>
                {sport?.scoring_type === 'sets' && match.current_set && (
                  <span className="md-live-set">
                    • เซต {match.current_set} ({match.sets_a ?? 0}-{match.sets_b ?? 0})
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* UPCOMING IN RESULTS */
            <div>
              <div
                style={{
                  fontSize: 'clamp(1.25rem, 4vw, 1.65rem)',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: isFinal ? 'var(--mc-gold-ink)' : isThird ? 'var(--mc-bronze-ink)' : 'var(--text)',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {matchTimeStr}
              </div>
            </div>
          )}

          <div
            style={{
              fontSize: '0.74rem',
              color: isFinal ? 'var(--mc-gold-ink-2)' : isThird ? 'var(--mc-bronze-ink-2)' : 'var(--text-3)',
              marginTop: '0.45rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            <Calendar size={11} /> {fmtEventDay(match.match_date)}
          </div>
        </div>

        {/* Team B (Right) - Perfectly Centered Name */}
        <TeamName
          team={teamB}
          wins={teamBWins}
          lost={isFinished && teamAWins}
          isMedalRound={isMedalRound}
          isFinal={isFinal}
          isThird={isThird}
        />
      </div>
    </div>
  );
}
