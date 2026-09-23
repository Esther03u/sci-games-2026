'use client';

import { useState } from 'react';
import { ChevronRight } from '@/components/animate-ui/icons';
import { SportIcon } from './SportIcon';
import MatchDetailModal from './MatchDetailModal';
import { fmtEventDay } from '@/lib/format';
import { getTeamStyle } from '@/lib/team-style';

export default function MatchCard({
  match,
  teams = [],
  sport,
  animated = false,
  showModalOnClick = true,
  isScheduleView = false,
  onClick,
}) {
  const [modalOpen, setModalOpen] = useState(false);

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
        color_hex: '#64748b',
        logo_emoji: '⏳',
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
        color_hex: '#64748b',
        logo_emoji: '⏳',
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

  const displayTime = match.match_time ? match.match_time.slice(0, 5) + ' น.' : '--:-- น.';
  const dateLabel = fmtEventDay(match.match_date);

  return (
    <>
      <div
        className={`sports-match-card ${isLive ? 'is-live' : ''} ${animated ? 'animate-score' : ''}`}
        onClick={handleClick}
        style={{
          background: `radial-gradient(ellipse at 0% 50%, ${styleA.hex}44 0%, transparent 65%), radial-gradient(ellipse at 100% 50%, ${styleB.hex}44 0%, transparent 65%), linear-gradient(90deg, ${styleA.hex}24 0%, var(--glass-bg) 40%, var(--glass-bg) 60%, ${styleB.hex}24 100%)`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '18px',
          border: isLive ? '1.5px solid rgba(239, 68, 68, 0.45)' : '1px solid rgba(228, 228, 231, 0.9)',
          padding: '1.1rem 1.25rem',
          boxShadow: isLive
            ? '0 10px 28px -4px rgba(239, 68, 68, 0.18), 0 2px 6px rgba(0, 0, 0, 0.04)'
            : '0 4px 22px -2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
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
            height: '2px',
            background: isLive
              ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.8), rgba(239, 68, 68, 0.2))'
              : `linear-gradient(90deg, ${styleA.hex} 0%, transparent 42%, transparent 58%, ${styleB.hex} 100%)`,
          }}
        />

        {/* Left Team Accent Stripe (Bold & Glowing) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '12%',
            bottom: '12%',
            width: '5px',
            borderRadius: '0 4px 4px 0',
            background: styleA.hex,
            boxShadow: `0 0 14px ${styleA.glow}`,
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
            width: '5px',
            borderRadius: '4px 0 0 4px',
            background: styleB.hex,
            boxShadow: `0 0 14px ${styleB.glow}`,
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
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
            <span style={{ color: 'var(--text)', fontWeight: 800, fontSize: '0.88rem' }}>
              {sport?.name || 'กีฬา'}
            </span>
            <span style={{ color: 'var(--border-strong)', margin: '0 2px' }}>•</span>
            <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>
              {match.round || 'รอบการแข่งขัน'} {match.category ? `(${match.category})` : ''}
            </span>
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
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    animation: 'pulse 1.5s infinite',
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
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0',
          }}
        >
          {/* Team A (Left) - Perfectly Vertically Centered (Bold if Won, Muted if Lost) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 0.25rem',
            }}
          >
            <div
              style={{
                fontSize: teamA.isPending ? '1.02rem' : teamAWins ? '1.28rem' : isFinished && teamBWins ? '1.12rem' : '1.22rem',
                fontWeight: teamA.isPending ? 600 : teamAWins ? 900 : isFinished && teamBWins ? 600 : 800,
                fontFamily: 'var(--font-heading)',
                color: teamA.isPending ? 'var(--text-3)' : isFinished && teamBWins ? 'var(--text-3)' : 'var(--text)',
                opacity: isFinished && teamBWins ? 0.5 : 1,
                lineHeight: 1.2,
                letterSpacing: '0.01em',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                justifyContent: 'center',
              }}
            >
              {teamA.isPending && <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>⏳</span>}
              <span>{teamA.name}</span>
            </div>
          </div>

          {/* Center (In schedule view: STRICTLY Match Time. In results view: Score or Time) */}
          <div
            style={{
              textAlign: 'center',
              padding: '0.45rem 1.15rem',
              minWidth: '120px',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)',
            }}
          >
            {isScheduleView ? (
              /* PURE SCHEDULE VIEW: Show Only Time */
              <div style={{ padding: '0.2rem 0' }}>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--text)',
                    lineHeight: 1.1,
                    letterSpacing: '0.02em',
                  }}
                >
                  {displayTime}
                </div>
              </div>
            ) : isFinished ? (
              /* RESULTS VIEW: Finished Score (Google Sports style: winner score bold black, loser score muted) */
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
                  style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '3px', fontWeight: 600 }}
                >
                  จบการแข่งขัน
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
                    color: 'var(--text)',
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
                    color: 'var(--text)',
                    lineHeight: 1.1,
                  }}
                >
                  {displayTime}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: '2px' }}>นัดต่อไป</div>
              </div>
            )}
          </div>

          {/* Team B (Right) - Perfectly Vertically Centered (Bold if Won, Muted if Lost) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 0.25rem',
            }}
          >
            <div
              style={{
                fontSize: teamB.isPending ? '1.02rem' : teamBWins ? '1.28rem' : isFinished && teamAWins ? '1.12rem' : '1.22rem',
                fontWeight: teamB.isPending ? 600 : teamBWins ? 900 : isFinished && teamAWins ? 600 : 800,
                fontFamily: 'var(--font-heading)',
                color: teamB.isPending ? 'var(--text-3)' : isFinished && teamAWins ? 'var(--text-3)' : 'var(--text)',
                opacity: isFinished && teamAWins ? 0.5 : 1,
                lineHeight: 1.2,
                letterSpacing: '0.01em',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                justifyContent: 'center',
              }}
            >
              <span>{teamB.name}</span>
              {teamB.isPending && <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>⏳</span>}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Court/Venue & Tap for Details hint */}
        <div
          style={{
            marginTop: '0.85rem',
            paddingTop: '0.65rem',
            borderTop: '1px solid var(--surface-2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem',
            color: 'var(--text-3)',
          }}
        >
          <div>
            <span>{match.court || match.venue || sport?.venue}</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              color: 'var(--accent-text)',
              fontWeight: 600,
            }}
          >
            <span>ดูรายละเอียด</span>
            <ChevronRight size={11} />
          </div>
        </div>
      </div>

      {/* Match Detail Modal Popup */}
      <MatchDetailModal
        match={match}
        sport={sport}
        teams={teams}
        isOpen={modalOpen}
        isScheduleView={isScheduleView}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
