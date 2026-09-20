'use client';

import { useState } from 'react';
import { Clock, Trophy, Activity, CheckCircle, ChevronRight, MapPin } from '@/components/animate-ui/icons';
import MatchDetailModal from './MatchDetailModal';

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

  const teamA = teams.find((t) => t.id === match.team_a_id) || {
    name: 'ทีม A',
    color_hex: '#ef4444',
    logo_emoji: '🔴',
  };
  const teamB = teams.find((t) => t.id === match.team_b_id) || {
    name: 'ทีม B',
    color_hex: '#0284c7',
    logo_emoji: '🔵',
  };

  // In schedule view, do not display finished results or live score indicators
  const isLive = !isScheduleView && match.status === 'live';
  const isFinished = !isScheduleView && match.status === 'finished';
  const scoreA = isScheduleView ? null : match.score_a;
  const scoreB = isScheduleView ? null : match.score_b;

  const teamAWins = isFinished && scoreA != null && scoreB != null && scoreA > scoreB;
  const teamBWins = isFinished && scoreA != null && scoreB != null && scoreB > scoreA;

  const handleClick = () => {
    if (onClick) {
      onClick(match);
    } else if (showModalOnClick) {
      setModalOpen(true);
    }
  };

  const displayTime = match.match_time ? match.match_time.slice(0, 5) + ' น.' : '--:-- น.';
  const dateLabel = match.match_date === '2026-10-09'
    ? 'ศ. 9 ต.ค.'
    : match.match_date === '2026-10-10'
    ? 'ส. 10 ต.ค.'
    : match.match_date === '2026-10-11'
    ? 'อา. 11 ต.ค.'
    : match.match_date ? match.match_date.slice(5) : '';

  return (
    <>
      <div
        className={`sports-match-card ${isLive ? 'is-live' : ''} ${animated ? 'animate-score' : ''}`}
        onClick={handleClick}
        style={{
          background: 'linear-gradient(180deg, #1c1d24 0%, #131418 100%)',
          borderRadius: '16px',
          border: isLive
            ? '1px solid rgba(239, 68, 68, 0.5)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1rem 1.15rem',
          boxShadow: isLive
            ? '0 8px 24px -4px rgba(239, 68, 68, 0.25), 0 0 0 1px rgba(239, 68, 68, 0.2)'
            : '0 8px 20px -4px rgba(0, 0, 0, 0.35)',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Ambient Glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '20%',
            right: '20%',
            height: '1px',
            background: isLive
              ? 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.8), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(250, 204, 21, 0.35), transparent)',
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
            color: '#a1a1aa',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: '#facc15' }}>
            <span>{sport?.icon || '🏆'}</span>
            <span>{sport?.name || 'กีฬา'}</span>
            <span style={{ color: '#52525b', margin: '0 2px' }}>•</span>
            <span style={{ color: '#d4d4d8', fontWeight: 600 }}>
              {match.round || 'รอบการแข่งขัน'} {match.category ? `(${match.category})` : ''}
            </span>
          </div>

          <div>
            {isScheduleView ? (
              <span
                style={{
                  background: 'rgba(250, 204, 21, 0.12)',
                  color: '#facc15',
                  border: '1px solid rgba(250, 204, 21, 0.25)',
                  fontSize: '0.68rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '999px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Clock size={10} />
                {dateLabel ? `${dateLabel} • ` : ''}{match.match_number ? `คู่ที่ ${match.match_number}` : 'ตารางแข่ง'}
              </span>
            ) : isLive ? (
              <span
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  fontSize: '0.68rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 700,
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
                LIVE • {displayTime}
              </span>
            ) : isFinished ? (
              <span
                style={{
                  background: 'rgba(34, 197, 94, 0.12)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  fontSize: '0.68rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '999px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle size={10} />
                {dateLabel ? `${dateLabel} • ` : ''}จบแล้ว ({displayTime})
              </span>
            ) : (
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#d4d4d8',
                  fontSize: '0.68rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '999px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Clock size={10} />
                {dateLabel || ''} {displayTime}
              </span>
            )}
          </div>
        </div>

        {/* 3-Section Horizontal Match Layout (Team A - Center Time/Score - Team B) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {/* Team A (Left) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: teamA.color_hex || '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.05rem',
                flexShrink: 0,
                boxShadow: `0 3px 10px ${teamA.color_hex || '#ef4444'}44, 0 0 0 2px rgba(255,255,255,0.12)`,
              }}
            >
              {teamA.logo_emoji || '🔴'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.98rem',
                  fontWeight: teamAWins ? 800 : 700,
                  color: teamAWins ? '#ffffff' : '#e4e4e7',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {teamA.name}
              </div>
              {teamAWins && (
                <div style={{ fontSize: '0.65rem', color: '#4ade80', fontWeight: 700 }}>
                  WINNER
                </div>
              )}
            </div>
          </div>

          {/* Center (In schedule view: STRICTLY Match Time. In results view: Score or Time) */}
          <div
            style={{
              textAlign: 'center',
              padding: '0 0.5rem',
              minWidth: '105px',
            }}
          >
            {isScheduleView ? (
              /* PURE SCHEDULE VIEW: Show Only Time and Match Timing */
              <div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-heading)',
                    color: '#facc15',
                    lineHeight: 1.1,
                    letterSpacing: '0.02em',
                  }}
                >
                  {displayTime}
                </div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: '#a1a1aa',
                    marginTop: '3px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {dateLabel ? `${dateLabel} • ` : ''}{match.court ? match.court : 'เวลาแข่งขัน'}
                </div>
              </div>
            ) : isFinished ? (
              /* RESULTS VIEW: Finished Score */
              <div>
                <div
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-heading)',
                    color: '#ffffff',
                    letterSpacing: '0.05em',
                    lineHeight: 1.1,
                  }}
                >
                  {scoreA} - {scoreB}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#a1a1aa', marginTop: '3px', fontWeight: 600 }}>
                  Full Time • {displayTime}
                </div>
              </div>
            ) : isLive ? (
              /* RESULTS VIEW: Live Score */
              <div>
                <div
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-heading)',
                    color: '#f87171',
                    letterSpacing: '0.05em',
                    lineHeight: 1.1,
                  }}
                >
                  {scoreA ?? 0} - {scoreB ?? 0}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 700, marginTop: '3px' }}>
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
                    color: '#facc15',
                    lineHeight: 1.1,
                  }}
                >
                  {displayTime}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#a1a1aa', marginTop: '3px' }}>
                  นัดต่อไป
                </div>
              </div>
            )}
          </div>

          {/* Team B (Right) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.65rem',
              minWidth: 0,
              textAlign: 'right',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.98rem',
                  fontWeight: teamBWins ? 800 : 700,
                  color: teamBWins ? '#ffffff' : '#e4e4e7',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {teamB.name}
              </div>
              {teamBWins && (
                <div style={{ fontSize: '0.65rem', color: '#4ade80', fontWeight: 700 }}>
                  WINNER
                </div>
              )}
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: teamB.color_hex || '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.05rem',
                flexShrink: 0,
                boxShadow: `0 3px 10px ${teamB.color_hex || '#0284c7'}44, 0 0 0 2px rgba(255,255,255,0.12)`,
              }}
            >
              {teamB.logo_emoji || '🔵'}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Court/Venue & Tap for Details hint */}
        <div
          style={{
            marginTop: '0.85rem',
            paddingTop: '0.65rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem',
            color: '#71717a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={11} style={{ color: '#a1a1aa' }} />
            <span>{match.court || match.venue || sport?.venue}</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              color: '#facc15',
              fontWeight: 600,
            }}
          >
            <span>{isScheduleView ? 'ผังสนามและกติกา' : 'ดูรายละเอียด'}</span>
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
