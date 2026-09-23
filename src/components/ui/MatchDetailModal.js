'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Clock,
  MapPin,
  Trophy,
  Shield,
  Info,
  Calendar,
  Activity,
  CheckCircle,
  AlertTriangle,
} from '@/components/animate-ui/icons';
import { SportIcon } from './SportIcon';
import { getTeamStyle } from '@/lib/team-style';
import { fmtPlace, fmtEventDay } from '@/lib/format';
import { findHandbookSport } from '@/data/handbook';
import { roundLabel } from '@/lib/labels';

export default function MatchDetailModal({
  match,
  sport,
  teams = [],
  isOpen,
  isScheduleView = false,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('summary');

  if (!isOpen || !match) return null;

  const handbook = findHandbookSport(sport);
  const matchDuration = sport?.matchDuration || handbook?.matchDuration;
  const rulesSummary = sport?.rulesSummary || handbook?.rulesSummary;

  const isPendingA = !match.team_a_id;
  const isPendingB = !match.team_b_id;

  const isFinal = match.round?.includes('ชิงชนะเลิศ') || match.round === 'final';
  const isThird = match.round?.includes('ชิงอันดับ 3') || match.round === 'third';
  const isMedalRound = isFinal || isThird;
  const defaultPendingHex = isFinal ? '#f59e0b' : isThird ? '#ea580c' : '#64748b';
  const defaultPendingMedal = isFinal ? 'gold' : isThird ? 'bronze' : null;

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

  const isLive = !isScheduleView && match.status === 'live';
  const isFinished = !isScheduleView && match.status === 'finished';
  const scoreA = isScheduleView ? null : match.score_a;
  const scoreB = isScheduleView ? null : match.score_b;
  const teamAWins = isFinished && scoreA != null && scoreB != null && scoreA > scoreB;
  const teamBWins = isFinished && scoreA != null && scoreB != null && scoreB > scoreA;

  const styleA = getTeamStyle(teamA);
  const styleB = getTeamStyle(teamB);

  const tabs = [
    { id: 'summary', label: 'ภาพรวม' },
    { id: 'rules', label: 'กติกาการแข่งขัน' },
    { id: 'venue', label: 'สถานที่ & เวลา' },
  ];

  const matchTimeStr =
    match.time_display || (match.match_time ? match.match_time.slice(0, 5) + ' น.' : '--:-- น.');
  const roundText =
    roundLabel(match.round) || (isFinal ? 'รอบชิงชนะเลิศ' : isThird ? 'รอบชิงอันดับ 3' : 'รอบการแข่งขัน');
  const catText =
    match.category && !roundText.includes(match.category) ? ` (${match.category})` : '';

  return (
    <AnimatePresence>
      <div
        className="match-modal-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'var(--overlay)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <motion.div
          className="match-modal-container"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'var(--bg-elevated)',
            border: isFinal
              ? '2px solid rgba(245, 158, 11, 0.85)'
              : isThird
                ? '2px solid rgba(234, 88, 12, 0.8)'
                : '1px solid var(--border)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            color: 'var(--text)',
            boxShadow: isFinal
              ? '0 25px 60px -15px rgba(245, 158, 11, 0.35), 0 0 24px rgba(251, 191, 36, 0.2)'
              : isThird
                ? '0 25px 60px -15px rgba(234, 88, 12, 0.3), 0 0 24px rgba(251, 146, 60, 0.18)'
                : '0 25px 60px -15px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04)',
            position: 'relative',
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: '1.1rem 1.25rem 0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              borderBottom: '1px solid var(--surface-2)',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  color: 'var(--text)',
                  letterSpacing: '0.01em',
                  lineHeight: 1.3,
                }}
              >
                <span>{sport?.name || 'กีฬา'} • </span>
                <span style={{ whiteSpace: 'nowrap' }}>Sci Games 2026</span>
              </div>
              <div
                style={{
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                }}
              >
                {isFinal ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      boxShadow: '0 2px 10px rgba(245, 158, 11, 0.45)',
                      padding: '0.15rem 0.65rem',
                      borderRadius: '999px',
                      fontWeight: 900,
                      fontSize: '0.74rem',
                    }}
                  >
                    <span>★</span>
                    <span>{roundText}{catText}</span>
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
                      padding: '0.15rem 0.65rem',
                      borderRadius: '999px',
                      fontWeight: 900,
                      fontSize: '0.74rem',
                    }}
                  >
                    <span>★</span>
                    <span>{roundText}{catText}</span>
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.76rem',
                      color: 'var(--text-3)',
                      fontWeight: 600,
                    }}
                  >
                    {roundText}{catText}
                  </span>
                )}
                {match.court && (
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-3)' }}>• {match.court}</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {isFinished ? (
                <span
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: 'rgba(34, 197, 94, 0.12)',
                    color: 'var(--success-text)',
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  จบการแข่งขัน
                </span>
              ) : isLive ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--danger-text)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
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
                  LIVE
                </span>
              ) : isScheduleView ? (
                <span
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: 'rgba(250, 204, 21, 0.15)',
                    color: 'var(--accent-text)',
                    border: '1px solid rgba(250, 204, 21, 0.35)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {match.match_number ? `คู่ที่ ${match.match_number}` : 'ตารางแข่ง'}
                </span>
              ) : (
                <span
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    background: 'var(--surface-2)',
                    color: 'var(--text-3)',
                    border: '1px solid var(--border)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  รอการแข่งขัน
                </span>
              )}

              <button
                onClick={onClose}
                style={{
                  background: 'var(--surface-2)',
                  border: 'none',
                  color: 'var(--text-3)',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
                aria-label="ปิดหน้าต่าง"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Big Scoreboard / Match Header */}
          <div
            style={{
              padding: '1.6rem 1.5rem 1.4rem',
              background: isFinal
                ? `radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.28) 0%, transparent 70%), radial-gradient(ellipse at 0% 50%, ${styleA.hex}40 0%, transparent 65%), radial-gradient(ellipse at 100% 50%, ${styleB.hex}40 0%, transparent 65%), linear-gradient(135deg, rgba(254, 243, 199, 0.5) 0%, var(--surface) 40%, var(--surface) 60%, rgba(254, 243, 199, 0.3) 100%)`
                : isThird
                  ? `radial-gradient(ellipse at 50% 0%, rgba(234, 88, 12, 0.24) 0%, transparent 70%), radial-gradient(ellipse at 0% 50%, ${styleA.hex}40 0%, transparent 65%), radial-gradient(ellipse at 100% 50%, ${styleB.hex}40 0%, transparent 65%), linear-gradient(135deg, rgba(255, 237, 213, 0.5) 0%, var(--surface) 40%, var(--surface) 60%, rgba(255, 237, 213, 0.3) 100%)`
                  : `radial-gradient(ellipse at 0% 50%, ${styleA.hex}40 0%, transparent 65%), radial-gradient(ellipse at 100% 50%, ${styleB.hex}40 0%, transparent 65%), linear-gradient(90deg, ${styleA.hex}22 0%, var(--surface) 38%, var(--surface) 62%, ${styleB.hex}22 100%)`,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              {/* Team A (Left) - Perfectly Centered Name */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                {teamA.isPending ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: isMedalRound ? '0.4rem 0.95rem' : '0.25rem 0.6rem',
                      borderRadius: '12px',
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
                      fontSize: '1rem',
                      boxShadow: isFinal
                        ? '0 2px 10px rgba(245, 158, 11, 0.3)'
                        : isThird
                          ? '0 2px 10px rgba(234, 88, 12, 0.25)'
                          : 'none',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {teamA.name}
                  </span>
                ) : (
                  <div
                    style={{
                      fontSize: teamAWins ? '1.45rem' : isFinished && teamBWins ? '1.25rem' : '1.35rem',
                      fontWeight: teamAWins ? 900 : isFinished && teamBWins ? 600 : 800,
                      fontFamily: 'var(--font-heading)',
                      color: isFinished && teamBWins ? 'var(--text-3)' : 'var(--text)',
                      opacity: isFinished && teamBWins ? 0.5 : 1,
                      lineHeight: 1.2,
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span>{teamA.name}</span>
                  </div>
                )}
              </div>

              {/* Match Score / Time Status */}
              <div style={{ textAlign: 'center', minWidth: '130px' }}>
                {isScheduleView ? (
                  /* SCHEDULE MODE: SHOW TIME ONLY */
                  <div>
                    <div
                      style={{
                        fontSize: '1.85rem',
                        fontWeight: 900,
                        fontFamily: 'var(--font-heading)',
                        color: isFinal ? '#92400e' : isThird ? '#9a3412' : 'var(--text)',
                        lineHeight: 1,
                        letterSpacing: '0.02em',
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
                        fontSize: '2.5rem',
                        fontWeight: 900,
                        fontFamily: 'var(--font-heading)',
                        letterSpacing: '0.08em',
                        lineHeight: 1,
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
                      <span style={{ color: 'var(--text-muted)', margin: '0 8px', fontWeight: 400 }}>-</span>
                      <span
                        style={{
                          color: isFinished && teamAWins ? 'var(--text-3)' : 'var(--text)',
                          opacity: isFinished && teamAWins ? 0.5 : 1,
                        }}
                      >
                        {scoreB}
                      </span>
                    </div>
                  </div>
                ) : isLive ? (
                  /* RESULTS MODE: LIVE MATCH (IN PROGRESS, NO SCORE) */
                  <div>
                    <div
                      style={{
                        fontSize: '1.85rem',
                        fontWeight: 900,
                        fontFamily: 'var(--font-heading)',
                        color: isFinal ? '#92400e' : isThird ? '#9a3412' : 'var(--text)',
                        lineHeight: 1,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {matchTimeStr}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--danger-text)',
                        fontWeight: 800,
                        marginTop: '0.35rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
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
                      กำลังแข่งขัน (รอสรุปคะแนนหลังจบแมตช์)
                    </div>
                  </div>
                ) : (
                  /* UPCOMING IN RESULTS */
                  <div>
                    <div
                      style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-heading)',
                        color: isFinal ? '#92400e' : isThird ? '#9a3412' : 'var(--text)',
                        lineHeight: 1,
                      }}
                    >
                      {matchTimeStr}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    fontSize: '0.75rem',
                    color: isFinal ? '#b45309' : isThird ? '#c2410c' : 'var(--text-3)',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontWeight: 600,
                  }}
                >
                  <Calendar size={11} /> {fmtEventDay(match.match_date)}
                </div>
              </div>

              {/* Team B (Right) - Perfectly Centered Name */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                {teamB.isPending ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: isMedalRound ? '0.4rem 0.95rem' : '0.25rem 0.6rem',
                      borderRadius: '12px',
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
                      fontSize: '1rem',
                      boxShadow: isFinal
                        ? '0 2px 10px rgba(245, 158, 11, 0.3)'
                        : isThird
                          ? '0 2px 10px rgba(234, 88, 12, 0.25)'
                          : 'none',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {teamB.name}
                  </span>
                ) : (
                  <div
                    style={{
                      fontSize: teamBWins ? '1.45rem' : isFinished && teamAWins ? '1.25rem' : '1.35rem',
                      fontWeight: teamBWins ? 900 : isFinished && teamAWins ? 600 : 800,
                      fontFamily: 'var(--font-heading)',
                      color: isFinished && teamAWins ? 'var(--text-3)' : 'var(--text)',
                      opacity: isFinished && teamAWins ? 0.5 : 1,
                      lineHeight: 1.2,
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span>{teamB.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'var(--surface-2)',
              padding: '0.3rem 0.4rem',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              gap: '0.3rem',
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  minHeight: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.45rem 0.35rem',
                  fontSize: '0.78rem',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  color: activeTab === tab.id ? 'var(--text)' : 'var(--text-3)',
                  background: activeTab === tab.id ? 'var(--surface)' : 'transparent',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: activeTab === tab.id ? '0 2px 6px rgba(0, 0, 0, 0.06)' : 'none',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Area */}
          <div style={{ padding: '1.25rem 1.5rem 1.75rem' }}>
            {/* TAB 1: SUMMARY */}
            {activeTab === 'summary' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(isPendingA || isPendingB) && (
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      background: 'rgba(100, 116, 139, 0.08)',
                      border: '1px solid rgba(100, 116, 139, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      fontSize: '0.82rem',
                      color: 'var(--text-2)',
                    }}
                  >
                    <Info size={16} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                    <span>
                      แมตช์นี้จะแข่งขันหลังจบรอบตัดเชือก
                      โดยทีมที่ผ่านการคัดเลือกจะถูกส่งต่อเข้าสู่รอบนี้โดยอัตโนมัติ
                    </span>
                  </div>
                )}
                {/* Period/Set Scores if available (ONLY in Results mode when finished) */}
                {!isScheduleView && isFinished && match.period_scores && (
                  <div
                    style={{
                      background: 'var(--surface-2)',
                      borderRadius: '14px',
                      padding: '1rem',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--accent-text)',
                        marginBottom: '0.6rem',
                      }}
                    >
                      คะแนนย่อยประจำเซต / ครึ่งเวลา
                    </div>
                    <div
                      style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}
                    >
                      {Object.entries(match.period_scores).map(([k, v]) => (
                        <div
                          key={k}
                          style={{ display: 'flex', justifyContent: 'space-between', color: '#3f3f46' }}
                        >
                          <span style={{ textTransform: 'capitalize', color: 'var(--text-3)' }}>{k}:</span>
                          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Match Information Card */}
                <div
                  style={{
                    background: 'var(--surface-2)',
                    borderRadius: '14px',
                    padding: '1rem',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--text)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    {isScheduleView ? 'ข้อมูลการประกบคู่แข่งขัน' : 'บทวิเคราะห์ & สรุปแมตช์'}
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#3f3f46', lineHeight: 1.6, margin: 0 }}>
                    {isScheduleView
                      ? `การประกบคู่แข่งขันใน${roundText}${catText} ณ ${fmtPlace(match)} กำหนดเวลา ${matchTimeStr}`
                      : match.summary || 'การแข่งขันรอบสำคัญในงาน Sci Games 2026'}
                  </p>
                </div>

                {/* Match Details Quick Specs */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.75rem',
                    fontSize: '0.82rem',
                  }}
                >
                  <div
                    style={{
                      background: 'var(--surface-2)',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: '2px' }}>
                      เวลาแข่งขัน
                    </span>
                    <strong style={{ color: 'var(--text)' }}>{matchTimeStr}</strong>
                  </div>
                  <div
                    style={{
                      background: 'var(--surface-2)',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: '2px' }}>
                      สนามแข่งขัน
                    </span>
                    <strong style={{ color: 'var(--text)' }}>{fmtPlace(match)}</strong>
                  </div>
                  <div
                    style={{
                      background: 'var(--surface-2)',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: '2px' }}>
                      รอบการแข่ง
                    </span>
                    <strong style={{ color: 'var(--text)' }}>
                      {roundText}{catText}
                    </strong>
                  </div>
                  <div
                    style={{
                      background: 'var(--surface-2)',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: '2px' }}>
                      ระยะเวลาแข่งขัน
                    </span>
                    <strong style={{ color: 'var(--text)' }}>{matchDuration || 'ตามระเบียบสูจิบัตร'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: OFFICIAL HANDBOOK RULES */}
            {activeTab === 'rules' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-text)' }}>
                  ระเบียบการแข่งขันตามสูจิบัตร ({sport?.name})
                </div>
                <div
                  style={{
                    background: 'var(--surface-2)',
                    borderRadius: '14px',
                    padding: '1rem',
                    border: '1px solid var(--border)',
                  }}
                >
                  <ul
                    style={{
                      paddingLeft: '1.2rem',
                      margin: 0,
                      fontSize: '0.85rem',
                      lineHeight: 1.8,
                      color: 'var(--text-2)',
                    }}
                  >
                    {(
                      rulesSummary || [
                        'ปฏิบัติตามระเบียบการแข่งขันในสูจิบัตร',
                        'การตัดสินของคณะกรรมการถือเป็นที่สิ้นสุด',
                      ]
                    ).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                  <p style={{ margin: '0.75rem 0 0', fontSize: '0.78rem', color: 'var(--text-3)' }}>
                    สรุปจากสูจิบัตร — กติกาฉบับเต็มดาวน์โหลดได้ที่หน้า{' '}
                    <a href="/handbook" style={{ color: 'var(--accent-text)', fontWeight: 700 }}>
                      สูจิบัตรและกำหนดการ
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: VENUE & SCHEDULE */}
            {activeTab === 'venue' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div
                  style={{
                    background: 'var(--surface-2)',
                    borderRadius: '14px',
                    padding: '1rem',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'var(--accent-surface)',
                      border: '1px solid var(--accent-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MapPin size={18} style={{ color: 'var(--accent-text)' }} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: 'var(--text)',
                        marginBottom: '2px',
                      }}
                    >
                      {fmtPlace(match, sport?.venue)}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
                      มหาวิทยาลัยราชภัฏภูเก็ต • คณะวิทยาศาสตร์และเทคโนโลยี
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--accent-surface)',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--accent-border)',
                    fontSize: '0.82rem',
                    color: 'var(--accent-text)',
                    lineHeight: 1.6,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                  }}
                >
                  <AlertTriangle
                    size={16}
                    style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: '2px' }}
                  />
                  <div>
                    <strong>การรายงานตัว:</strong> กรุณามาถึงสนามก่อนเวลาแข่งขัน —
                    ระเบียบการรายงานตัวและบทลงโทษดูได้ในสูจิบัตร (หน้า{' '}
                    <a href="/handbook" style={{ color: 'inherit', fontWeight: 700 }}>
                      สูจิบัตรและกำหนดการ
                    </a>
                    )
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
