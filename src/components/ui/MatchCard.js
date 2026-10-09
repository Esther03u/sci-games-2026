'use client';

import { useState, memo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from '@/components/animate-ui/icons';
import { SportIcon } from './SportIcon';
import { fmtEventDay, fmtPlace } from '@/lib/format';
import { getTeamStyle } from '@/lib/team-style';
import { getMatchView, setScoreRows } from '@/lib/match-view';

// The detail modal (and the handbook data it reads) is only fetched once a
// card is opened, so list pages don't ship it up front. Pointer-down starts
// the download a moment before the click lands.
const loadDetailModal = () => import('./MatchDetailModal');
const MatchDetailModal = dynamic(loadDetailModal, { ssr: false });

const MatchCard = memo(function MatchCard({
  match,
  teams = [],
  sport,
  animated = false,
  showModalOnClick = true,
  isScheduleView = false,
  sets = [],
  onClick,
}) {
  const [modalOpen, setModalOpen] = useState(false);

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
    roundText,
    catText,
  } = getMatchView(match, teams, { isScheduleView, sport });

  // completed sets under the score (the set in progress is the big number)
  const setRows =
    !isScheduleView && sport?.scoring_type === 'sets' && (isFinished || isLive) ? setScoreRows(sets) : [];

  const styleA = getTeamStyle(teamA);
  const styleB = getTeamStyle(teamB);

  const handleClick = () => {
    if (onClick) {
      onClick(match);
    } else if (showModalOnClick) {
      setModalOpen(true);
    }
  };

  // Keyboard / screen-reader access: the card acts as a button that opens the details
  const clickable = Boolean(onClick || showModalOnClick);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const displayTime = match.match_time ? match.match_time.slice(0, 5) + ' น.' : '--:-- น.';
  const dateLabel = fmtEventDay(match.match_date);

  return (
    <>
      <motion.div
        className={`sports-match-card ${isLive ? 'is-live' : ''} ${animated ? 'animate-score' : ''}`}
        onClick={handleClick}
        onPointerDown={!onClick && showModalOnClick ? loadDetailModal : undefined}
        {...(clickable && {
          role: 'button',
          tabIndex: 0,
          onKeyDown: handleKeyDown,
          'aria-haspopup': 'dialog',
          'aria-label': `ดูรายละเอียด ${sport?.name || ''} ${roundText}${catText}: ${teamA?.name || 'รอผล'} พบ ${teamB?.name || 'รอผล'} ${dateLabel} ${displayTime}`,
        })}
        whileTap={{ scale: 0.98, transition: { duration: 0.08 } }}
        style={{
          background: isFinal
            ? `radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.22) 0%, transparent 75%), radial-gradient(ellipse at 0% 50%, ${styleA.hex}35 0%, transparent 60%), radial-gradient(ellipse at 100% 50%, ${styleB.hex}35 0%, transparent 60%), linear-gradient(135deg, var(--mc-gold-tint) 0%, var(--mc-center) 40%, var(--mc-center) 60%, var(--mc-gold-tint-soft) 100%)`
            : isThird
              ? `radial-gradient(ellipse at 50% 0%, rgba(234, 88, 12, 0.18) 0%, transparent 75%), radial-gradient(ellipse at 0% 50%, ${styleA.hex}35 0%, transparent 60%), radial-gradient(ellipse at 100% 50%, ${styleB.hex}35 0%, transparent 60%), linear-gradient(135deg, var(--mc-bronze-tint) 0%, var(--mc-center) 40%, var(--mc-center) 60%, var(--mc-bronze-tint-soft) 100%)`
              : `radial-gradient(ellipse at 0% 50%, ${styleA.hex}44 0%, transparent 65%), radial-gradient(ellipse at 100% 50%, ${styleB.hex}44 0%, transparent 65%), linear-gradient(90deg, ${styleA.hex}24 0%, var(--mc-center) 40%, var(--mc-center) 60%, ${styleB.hex}24 100%)`,
          borderRadius: '18px',
          border: isLive
            ? '1.5px solid rgba(239, 68, 68, 0.45)'
            : isFinal
              ? '2px solid rgba(245, 158, 11, 0.85)'
              : isThird
                ? '2px solid rgba(234, 88, 12, 0.8)'
                : '1px solid rgba(228, 228, 231, 0.9)',
          padding: '1rem 1.05rem',
          boxShadow: isLive
            ? '0 10px 28px -4px rgba(239, 68, 68, 0.18), 0 2px 6px rgba(0, 0, 0, 0.04)'
            : isFinal
              ? '0 10px 32px -4px rgba(245, 158, 11, 0.35), 0 0 16px rgba(251, 191, 36, 0.22), 0 2px 6px rgba(0, 0, 0, 0.04)'
              : isThird
                ? '0 10px 32px -4px rgba(234, 88, 12, 0.3), 0 0 16px rgba(251, 146, 60, 0.2), 0 2px 6px rgba(0, 0, 0, 0.04)'
                : '0 4px 22px -2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Ambient Top Glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: isMedalRound ? '4px' : '2px',
            background: isLive
              ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.8), rgba(239, 68, 68, 0.2))'
              : isFinal
                ? 'linear-gradient(90deg, #d97706 0%, #fbbf24 30%, #fffbeb 50%, #fbbf24 70%, #d97706 100%)'
                : isThird
                  ? 'linear-gradient(90deg, #9a3412 0%, #ea580c 30%, #ffedd5 50%, #ea580c 70%, #9a3412 100%)'
                  : `linear-gradient(90deg, ${styleA.hex} 0%, transparent 42%, transparent 58%, ${styleB.hex} 100%)`,
            boxShadow: isFinal
              ? '0 0 14px rgba(245, 158, 11, 0.9)'
              : isThird
                ? '0 0 14px rgba(234, 88, 12, 0.85)'
                : 'none',
          }}
        />

        {/* Left Team Accent Stripe (Bold & Glowing) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '12%',
            bottom: '12%',
            width: isMedalRound ? '6px' : '5px',
            borderRadius: '0 4px 4px 0',
            background:
              teamA.isPending && isFinal
                ? 'linear-gradient(180deg, #fde68a 0%, #f59e0b 50%, #b45309 100%)'
                : teamA.isPending && isThird
                  ? 'linear-gradient(180deg, #fed7aa 0%, #ea580c 50%, #9a3412 100%)'
                  : styleA.hex,
            boxShadow:
              teamA.isPending && isFinal
                ? '0 0 16px rgba(245, 158, 11, 0.8)'
                : teamA.isPending && isThird
                  ? '0 0 16px rgba(234, 88, 12, 0.8)'
                  : `0 0 14px ${styleA.glow}`,
            opacity: isFinished && teamBWins ? 0.35 : 1,
            transition: 'opacity 0.25s ease',
          }}
        />

        {/* Right Team Accent Stripe (Bold & Glowing) */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '12%',
            bottom: '12%',
            width: isMedalRound ? '6px' : '5px',
            borderRadius: '4px 0 0 4px',
            background:
              teamB.isPending && isFinal
                ? 'linear-gradient(180deg, #fde68a 0%, #f59e0b 50%, #b45309 100%)'
                : teamB.isPending && isThird
                  ? 'linear-gradient(180deg, #fed7aa 0%, #ea580c 50%, #9a3412 100%)'
                  : styleB.hex,
            boxShadow:
              teamB.isPending && isFinal
                ? '0 0 16px rgba(245, 158, 11, 0.8)'
                : teamB.isPending && isThird
                  ? '0 0 16px rgba(234, 88, 12, 0.8)'
                  : `0 0 14px ${styleB.glow}`,
            opacity: isFinished && teamAWins ? 0.35 : 1,
            transition: 'opacity 0.25s ease',
          }}
        />

        {/* Top Header Row: Sport Name & Round/Status */}
        <div className="mc-head">
          <div className="mc-head-left">
            <span className="mc-sport">{sport?.name || 'กีฬา'}</span>
            {isFinal ? (
              <span className="mc-pill-final">
                <span>★</span>
                <span>
                  {roundText}
                  {catText}
                </span>
              </span>
            ) : isThird ? (
              <span className="mc-pill-third">
                <span>★</span>
                <span>
                  {roundText}
                  {catText}
                </span>
              </span>
            ) : (
              <>
                <span className="mc-dot-sep">•</span>
                <span className="mc-round">
                  {roundText}
                  {catText}
                </span>
              </>
            )}
          </div>

          <div>
            {isLive ? (
              <span className="mc-live-chip">
                <motion.span
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="mc-live-dot"
                />
                LIVE
              </span>
            ) : (
              <span className="mc-time">
                {isScheduleView
                  ? match.match_number
                    ? `คู่ที่ ${match.match_number}`
                    : ''
                  : dateLabel || ''}
              </span>
            )}
          </div>
        </div>

        {/* 3-Section Horizontal Match Layout (Team A Color Fade - Center Time/Score - Team B Color Fade) */}
        <div className="mc-board">
          {/* Team A (Left) - Perfectly Vertically Centered */}
          <div className="mc-team">
            {teamA.isPending ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: isMedalRound ? '0.22rem 0.5rem' : '0.15rem 0.4rem',
                  borderRadius: '10px',
                  background: isFinal
                    ? 'var(--mc-gold-chip)'
                    : isThird
                      ? 'var(--mc-bronze-chip)'
                      : 'var(--surface-2)',
                  border: isFinal
                    ? '1.5px solid rgba(245, 158, 11, 0.85)'
                    : isThird
                      ? '1.5px solid rgba(234, 88, 12, 0.8)'
                      : '1px solid var(--border)',
                  color: isFinal ? 'var(--mc-gold-ink)' : isThird ? 'var(--mc-bronze-ink)' : 'var(--text-3)',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  boxShadow: isFinal
                    ? '0 2px 8px rgba(245, 158, 11, 0.28)'
                    : isThird
                      ? '0 2px 8px rgba(234, 88, 12, 0.24)'
                      : 'none',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.01em',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={teamA.name}
              >
                {teamA.name}
              </span>
            ) : (
              <div
                style={{
                  fontSize: teamAWins ? '1.28rem' : isFinished && teamBWins ? '1.12rem' : '1.22rem',
                  fontWeight: teamAWins ? 900 : isFinished && teamBWins ? 600 : 800,
                  fontFamily: 'var(--font-heading)',
                  color: isFinished && teamBWins ? 'var(--text-3)' : 'var(--text)',
                  opacity: isFinished && teamBWins ? 0.5 : 1,
                  lineHeight: 1.25,
                  letterSpacing: '0.01em',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{teamA.name}</span>
              </div>
            )}
          </div>

          {/* Center (In schedule view: STRICTLY Match Time. In results view: Score or Time) */}
          <div
            style={{
              textAlign: 'center',
              padding: '0.35rem 0.75rem',
              minWidth: '84px',
              background: isFinal
                ? 'var(--mc-gold-panel)'
                : isThird
                  ? 'var(--mc-bronze-panel)'
                  : 'var(--surface-2)',
              borderRadius: '16px',
              border: isFinal
                ? '1.5px solid rgba(245, 158, 11, 0.65)'
                : isThird
                  ? '1.5px solid rgba(234, 88, 12, 0.65)'
                  : '1px solid var(--border)',
              boxShadow: isFinal
                ? '0 4px 18px -2px rgba(245, 158, 11, 0.25), 0 1px 3px rgba(0, 0, 0, 0.02)'
                : isThird
                  ? '0 4px 18px -2px rgba(234, 88, 12, 0.22), 0 1px 3px rgba(0, 0, 0, 0.02)'
                  : '0 4px 16px -2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)',
            }}
          >
            {isScheduleView ? (
              /* PURE SCHEDULE VIEW: Show Only Time */
              <div className="mc-center-pad">
                <div
                  style={{
                    fontSize: '1.18rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-heading)',
                    color: isFinal ? 'var(--mc-gold-ink)' : isThird ? 'var(--mc-bronze-ink)' : 'var(--text)',
                    lineHeight: 1.1,
                    letterSpacing: '0.02em',
                  }}
                >
                  {displayTime}
                </div>
              </div>
            ) : isFinished ? (
              /* RESULTS VIEW: Finished Score */
              <div>
                <div className="mc-score">
                  <span
                    style={{
                      fontWeight: teamAWins ? 900 : 600,
                      color: isFinished && teamBWins ? 'var(--text-3)' : 'var(--text)',
                      opacity: isFinished && teamBWins ? 0.5 : 1,
                    }}
                  >
                    {scoreA}
                  </span>
                  <span className="mc-score-dash">-</span>
                  <span
                    style={{
                      fontWeight: teamBWins ? 900 : 600,
                      color: isFinished && teamAWins ? 'var(--text-3)' : 'var(--text)',
                      opacity: isFinished && teamAWins ? 0.5 : 1,
                    }}
                  >
                    {scoreB}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: match.is_walkover
                      ? 'var(--accent-text)'
                      : isFinal
                        ? 'var(--mc-gold-ink-2)'
                        : isThird
                          ? 'var(--mc-bronze-ink-2)'
                          : 'var(--text-3)',
                    marginTop: '3px',
                    fontWeight: 800,
                  }}
                >
                  {match.is_walkover ? '★ ชนะบาย' : 'จบการแข่งขัน'}
                </div>
              </div>
            ) : isLive ? (
              /* RESULTS VIEW: Live (Real-Time In Progress Score) */
              <div>
                <div className="mc-score">
                  <span className="mc-score-num">{scoreA ?? 0}</span>
                  <span className="mc-score-dash">-</span>
                  <span className="mc-score-num">{scoreB ?? 0}</span>
                </div>
                <div className="mc-live-line">
                  <span className="mc-pulse-dot" />
                  <span>กำลังแข่ง</span>
                  {sport?.scoring_type === 'sets' && match.current_set && (
                    <span className="mc-live-set">
                      • เซต {match.current_set} ({match.sets_a ?? 0}-{match.sets_b ?? 0})
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* RESULTS VIEW: Upcoming */
              <div>
                <div
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-heading)',
                    color: isFinal ? 'var(--mc-gold-ink)' : isThird ? 'var(--mc-bronze-ink)' : 'var(--text)',
                    lineHeight: 1.1,
                  }}
                >
                  {displayTime}
                </div>
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: isFinal
                      ? 'var(--mc-gold-ink-2)'
                      : isThird
                        ? 'var(--mc-bronze-ink-2)'
                        : 'var(--text-3)',
                    marginTop: '2px',
                    fontWeight: 600,
                  }}
                >
                  นัดต่อไป
                </div>
              </div>
            )}
          </div>

          {/* Team B (Right) - Perfectly Vertically Centered */}
          <div className="mc-team">
            {teamB.isPending ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: isMedalRound ? '0.22rem 0.5rem' : '0.15rem 0.4rem',
                  borderRadius: '10px',
                  background: isFinal
                    ? 'var(--mc-gold-chip)'
                    : isThird
                      ? 'var(--mc-bronze-chip)'
                      : 'var(--surface-2)',
                  border: isFinal
                    ? '1.5px solid rgba(245, 158, 11, 0.85)'
                    : isThird
                      ? '1.5px solid rgba(234, 88, 12, 0.8)'
                      : '1px solid var(--border)',
                  color: isFinal ? 'var(--mc-gold-ink)' : isThird ? 'var(--mc-bronze-ink)' : 'var(--text-3)',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  boxShadow: isFinal
                    ? '0 2px 8px rgba(245, 158, 11, 0.28)'
                    : isThird
                      ? '0 2px 8px rgba(234, 88, 12, 0.24)'
                      : 'none',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.01em',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={teamB.name}
              >
                {teamB.name}
              </span>
            ) : (
              <div
                style={{
                  fontSize: teamBWins ? '1.28rem' : isFinished && teamAWins ? '1.12rem' : '1.22rem',
                  fontWeight: teamBWins ? 900 : isFinished && teamAWins ? 600 : 800,
                  fontFamily: 'var(--font-heading)',
                  color: isFinished && teamAWins ? 'var(--text-3)' : 'var(--text)',
                  opacity: isFinished && teamAWins ? 0.5 : 1,
                  lineHeight: 1.25,
                  letterSpacing: '0.01em',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{teamB.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Per-set scores (set sports, results view) */}
        {setRows.length > 0 && (
          <div
            className="mc-sets"
            aria-label={`คะแนนรายเซต ${setRows.map((s) => `เซต ${s.n} ${s.a}-${s.b}`).join(', ')}`}
          >
            <span className="mc-sets-label">เซต</span>
            {setRows.map((s, i) => (
              <span key={s.n}>
                {i > 0 && <span className="mc-sets-sep">·</span>}
                <span style={{ color: s.winner === 'a' ? 'var(--text)' : undefined }}>{s.a}</span>-
                <span style={{ color: s.winner === 'b' ? 'var(--text)' : undefined }}>{s.b}</span>
              </span>
            ))}
          </div>
        )}

        {/* Bottom Bar: Court/Venue & Tap for Details hint */}
        <div
          style={{
            marginTop: '0.85rem',
            paddingTop: '0.65rem',
            borderTop: isFinal
              ? '1px solid rgba(245, 158, 11, 0.25)'
              : isThird
                ? '1px solid rgba(234, 88, 12, 0.25)'
                : '1px solid var(--surface-2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem',
            color: 'var(--text-3)',
          }}
        >
          <div>
            <span>{fmtPlace(match, sport?.venue)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              color: isFinal
                ? 'var(--mc-gold-ink-2)'
                : isThird
                  ? 'var(--mc-bronze-ink-2)'
                  : 'var(--accent-text)',
              fontWeight: 700,
            }}
          >
            <span>ดูรายละเอียด</span>
            <ChevronRight size={11} />
          </div>
        </div>
      </motion.div>

      {/* Match Detail Modal Popup (Lazy-mounted only when clicked open with smooth enter/exit) */}
      <AnimatePresence>
        {modalOpen && (
          <MatchDetailModal
            match={match}
            sport={sport}
            teams={teams}
            isScheduleView={isScheduleView}
            sets={sets}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
});

export default MatchCard;
