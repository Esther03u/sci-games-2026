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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
          alignItems: 'center',
          gap: '0.4rem',
        }}
      >
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
        <div style={{ textAlign: 'center', minWidth: 0, padding: '0 0.15rem', flexShrink: 0 }}>
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
              <div
                style={{
                  fontSize: 'clamp(1.75rem, 6vw, 2.3rem)',
                  fontWeight: 900,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.06em',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    color: isFinished && teamBWins ? 'var(--text-3)' : 'var(--text)',
                    opacity: isFinished && teamBWins ? 0.5 : 1,
                  }}
                >
                  {scoreA}
                </span>
                <span style={{ color: 'var(--text-muted)', margin: '0 6px', fontWeight: 400 }}>-</span>
                <span
                  style={{
                    color: isFinished && teamAWins ? 'var(--text-3)' : 'var(--text)',
                    opacity: isFinished && teamAWins ? 0.5 : 1,
                  }}
                >
                  {scoreB}
                </span>
              </div>
              {match.is_walkover && (
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--accent-text)',
                    fontWeight: 800,
                    marginTop: '0.3rem',
                  }}
                >
                  ★ ชนะบาย (Walkover)
                </div>
              )}
            </div>
          ) : isLive ? (
            /* RESULTS MODE: LIVE MATCH (REAL-TIME SCORE) */
            <div>
              <div
                style={{
                  fontSize: 'clamp(1.75rem, 6vw, 2.3rem)',
                  fontWeight: 900,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.06em',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: 'var(--text)' }}>{scoreA ?? 0}</span>
                <span style={{ color: 'var(--text-muted)', margin: '0 6px', fontWeight: 400 }}>-</span>
                <span style={{ color: 'var(--text)' }}>{scoreB ?? 0}</span>
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--danger-text)',
                  fontWeight: 800,
                  marginTop: '0.35rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
                <span>กำลังแข่งขัน (LIVE)</span>
                {sport?.scoring_type === 'sets' && match.current_set && (
                  <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>
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
