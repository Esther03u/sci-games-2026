'use client';

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from '@/components/animate-ui/icons';
import { SportIcon } from './SportIcon';
import MatchDetailModal from './MatchDetailModal';
import { fmtEventDay, fmtPlace } from '@/lib/format';
import { getTeamStyle } from '@/lib/team-style';
import { roundLabel } from '@/lib/labels';

const MatchCard = memo(function MatchCard({
  match,
  teams = [],
  sport,
  animated = false,
  showModalOnClick = true,
  isScheduleView = false,
  onClick,
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const isFinal = match.round?.includes('ชิงชนะเลิศ') || match.round === 'final';
  const isThird = match.round?.includes('ชิงอันดับ 3') || match.round === 'third';
  const isMedalRound = isFinal || isThird;
  const defaultPendingHex = isFinal ? '#f59e0b' : isThird ? '#ea580c' : '#64748b';
  const defaultPendingMedal = isFinal ? 'gold' : isThird ? 'bronze' : null;

  const isPendingA = !match.team_a_id;
  const isPendingB = !match.team_b_id;

  const teamA = match.team_a_id
    ? teams.find((t) => t.id === match.team_a_id) || {
        id: match.team_a_id,
        name: 'ทีม A',
        color_hex: '#ef4444',
        logo_emoji: '🔴',
      }
    : {
        id: null,
        name: 'รอผลการแข่งขัน',
        color_hex: defaultPendingHex,
        medal: defaultPendingMedal,
        logo_emoji: '',
        isPending: true,
      };

  const teamB = match.team_b_id
    ? teams.find((t) => t.id === match.team_b_id) || {
        id: match.team_b_id,
        name: 'ทีม B',
        color_hex: '#0284c7',
        logo_emoji: '🔵',
      }
    : {
        id: null,
        name: 'รอผลการแข่งขัน',
        color_hex: defaultPendingHex,
        medal: defaultPendingMedal,
        logo_emoji: '',
        isPending: true,
      };

  // In schedule view, do not display finished results or live score indicators
  const isLive = !isScheduleView && match.status === 'live';
  const isFinished = !isScheduleView && match.status === 'finished';
  const scoreA = isScheduleView ? null : match.score_a;
  const scoreB = isScheduleView ? null : match.score_b;

  const teamAWins = isFinished && scoreA != null && scoreB != null && scoreA > scoreB;
  const teamBWins = isFinished && scoreA != null && scoreB != null && scoreB > scoreA;

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
  const roundText =
    roundLabel(match.round) || (isFinal ? 'รอบชิงชนะเลิศ' : isThird ? 'รอบชิงอันดับ 3' : 'รอบการแข่งขัน');
  const catText = match.category && !roundText.includes(match.category) ? ` (${match.category})` : '';

  return (
    <>
      <motion.div
        className={`sports-match-card ${isLive ? 'is-live' : ''} ${animated ? 'animate-score' : ''}`}
        onClick={handleClick}
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
            ? `radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.22) 0%, transparent 75%), radial-gradient(ellipse at 0% 50%, ${styleA.hex}35 0%, transparent 60%), radial-gradient(ellipse at 100% 50%, ${styleB.hex}35 0%, transparent 60%), linear-gradient(135deg, rgba(254, 243, 199, 0.55) 0%, #ffffff 40%, #ffffff 60%, rgba(254, 243, 199, 0.35) 100%)`
            : isThird
              ? `radial-gradient(ellipse at 50% 0%, rgba(234, 88, 12, 0.18) 0%, transparent 75%), radial-gradient(ellipse at 0% 50%, ${styleA.hex}35 0%, transparent 60%), radial-gradient(ellipse at 100% 50%, ${styleB.hex}35 0%, transparent 60%), linear-gradient(135deg, rgba(255, 237, 213, 0.55) 0%, #ffffff 40%, #ffffff 60%, rgba(255, 237, 213, 0.35) 100%)`
              : `radial-gradient(ellipse at 0% 50%, ${styleA.hex}44 0%, transparent 65%), radial-gradient(ellipse at 100% 50%, ${styleB.hex}44 0%, transparent 65%), linear-gradient(90deg, ${styleA.hex}24 0%, #ffffff 40%, #ffffff 60%, ${styleB.hex}24 100%)`,
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.85rem',
            fontSize: '0.78rem',
            color: 'var(--text-3)',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text)', fontWeight: 800, fontSize: '0.92rem' }}>
              {sport?.name || 'กีฬา'}
            </span>
            {isFinal ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  boxShadow: '0 2px 10px rgba(245, 158, 11, 0.45)',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  letterSpacing: '0.02em',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
                }}
              >
                <span>★</span>
                <span>
                  {roundText}
                  {catText}
                </span>
              </span>
            ) : isThird ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  color: '#ffffff',
                  boxShadow: '0 2px 10px rgba(234, 88, 12, 0.45)',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  letterSpacing: '0.02em',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
                }}
              >
                <span>★</span>
                <span>
                  {roundText}
                  {catText}
                </span>
              </span>
            ) : (
              <>
                <span style={{ color: 'var(--border-strong)', margin: '0 2px' }}>•</span>
                <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>
                  {roundText}
                  {catText}
                </span>
              </>
            )}
          </div>

          <div>
            {isLive ? (
              <span
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--danger-text)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  fontSize: '0.68rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}
              >
                <motion.span
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    display: 'inline-block',
                  }}
                />
                LIVE
              </span>
            ) : (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-3)',
                  letterSpacing: '0.01em',
                }}
              >
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0',
          }}
        >
          {/* Team A (Left) - Perfectly Vertically Centered */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 0.15rem',
              minWidth: 0,
              width: '100%',
            }}
          >
            {teamA.isPending ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: isMedalRound ? '0.22rem 0.5rem' : '0.15rem 0.4rem',
                  borderRadius: '10px',
                  background: isFinal
                    ? 'linear-gradient(135deg, rgba(254, 243, 199, 0.95) 0%, rgba(253, 230, 138, 0.85) 100%)'
                    : isThird
                      ? 'linear-gradient(135deg, rgba(255, 237, 213, 0.95) 0%, rgba(254, 215, 170, 0.85) 100%)'
                      : 'var(--surface-2)',
                  border: isFinal
                    ? '1.5px solid rgba(245, 158, 11, 0.85)'
                    : isThird
                      ? '1.5px solid rgba(234, 88, 12, 0.8)'
                      : '1px solid var(--border)',
                  color: isFinal ? '#92400e' : isThird ? '#9a3412' : 'var(--text-3)',
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
                ? 'linear-gradient(135deg, rgba(255, 251, 235, 0.98) 0%, rgba(254, 243, 199, 0.9) 100%)'
                : isThird
                  ? 'linear-gradient(135deg, rgba(255, 247, 237, 0.98) 0%, rgba(255, 237, 213, 0.9) 100%)'
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
              <div style={{ padding: '0.15rem 0' }}>
                <div
                  style={{
                    fontSize: '1.18rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-heading)',
                    color: isFinal ? '#92400e' : isThird ? '#9a3412' : 'var(--text)',
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
                <div
                  style={{
                    fontSize: '1.55rem',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '0.06em',
                    lineHeight: 1.1,
                  }}
                >
                  <span
                    style={{
                      fontWeight: teamAWins ? 900 : 600,
                      color: isFinished && teamBWins ? 'var(--text-3)' : 'var(--text)',
                      opacity: isFinished && teamBWins ? 0.5 : 1,
                    }}
                  >
                    {scoreA}
                  </span>
                  <span style={{ color: 'var(--text-muted)', margin: '0 5px', fontWeight: 400 }}>-</span>
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
                      ? 'var(--gold-700)'
                      : isFinal
                        ? '#b45309'
                        : isThird
                          ? '#c2410c'
                          : 'var(--text-3)',
                    marginTop: '3px',
                    fontWeight: 800,
                  }}
                >
                  {match.is_walkover ? '★ ชนะบาย' : 'จบการแข่งขัน'}
                </div>
              </div>
            ) : isLive ? (
              /* RESULTS VIEW: Live (In Progress, No Score) */
              <div>
                <div
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-heading)',
                    color: isFinal ? '#92400e' : isThird ? '#9a3412' : 'var(--text)',
                    lineHeight: 1.1,
                  }}
                >
                  {displayTime}
                </div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--danger-text)',
                    fontWeight: 800,
                    marginTop: '3px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
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
                  กำลังแข่ง
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
                    color: isFinal ? '#92400e' : isThird ? '#9a3412' : 'var(--text)',
                    lineHeight: 1.1,
                  }}
                >
                  {displayTime}
                </div>
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: isFinal ? '#b45309' : isThird ? '#c2410c' : 'var(--text-3)',
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 0.15rem',
              minWidth: 0,
              width: '100%',
            }}
          >
            {teamB.isPending ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: isMedalRound ? '0.22rem 0.5rem' : '0.15rem 0.4rem',
                  borderRadius: '10px',
                  background: isFinal
                    ? 'linear-gradient(135deg, rgba(254, 243, 199, 0.95) 0%, rgba(253, 230, 138, 0.85) 100%)'
                    : isThird
                      ? 'linear-gradient(135deg, rgba(255, 237, 213, 0.95) 0%, rgba(254, 215, 170, 0.85) 100%)'
                      : 'var(--surface-2)',
                  border: isFinal
                    ? '1.5px solid rgba(245, 158, 11, 0.85)'
                    : isThird
                      ? '1.5px solid rgba(234, 88, 12, 0.8)'
                      : '1px solid var(--border)',
                  color: isFinal ? '#92400e' : isThird ? '#9a3412' : 'var(--text-3)',
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
              color: isFinal ? '#b45309' : isThird ? '#c2410c' : 'var(--accent-text)',
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
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
});

export default MatchCard;
