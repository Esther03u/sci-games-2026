'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, MapPin, Trophy, Shield, Info, Calendar, Activity, CheckCircle } from '@/components/animate-ui/icons';

export default function MatchDetailModal({
  match,
  sport,
  teams = [],
  isOpen,
  isScheduleView = false,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(isScheduleView ? 'lineup' : 'summary');

  if (!isOpen || !match) return null;

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

  const isLive = !isScheduleView && match.status === 'live';
  const isFinished = !isScheduleView && match.status === 'finished';
  const scoreA = isScheduleView ? null : match.score_a;
  const scoreB = isScheduleView ? null : match.score_b;
  const teamAWins = isFinished && scoreA != null && scoreB != null && scoreA > scoreB;
  const teamBWins = isFinished && scoreA != null && scoreB != null && scoreB > scoreA;

  const tabs = [
    { id: 'summary', label: 'ภาพรวม' },
    { id: 'lineup', label: 'แผนผังสนาม' },
    { id: 'rules', label: 'กติกาการแข่งขัน' },
    { id: 'venue', label: 'สถานที่ & เวลา' },
  ];

  const matchTimeStr = match.time_display || (match.match_time ? match.match_time.slice(0, 5) + ' น.' : '--:-- น.');

  return (
    <AnimatePresence>
      <div
        className="match-modal-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.75)',
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
            background: 'linear-gradient(180deg, #181920 0%, #111215 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            color: '#f4f4f5',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
            position: 'relative',
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: '1.25rem 1.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.4rem' }}>{sport?.icon || '🏆'}</span>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em' }}>
                  {sport?.name || 'กีฬา'} • Sci Games 2026
                </div>
                <div style={{ fontSize: '0.78rem', color: '#a1a1aa' }}>
                  {match.round} • {match.category} {match.court ? `(${match.court})` : ''}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#a1a1aa',
                cursor: 'pointer',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              aria-label="ปิดหน้าต่าง"
            >
              <X size={16} />
            </button>
          </div>

          {/* Big Scoreboard / Match Header */}
          <div
            style={{
              padding: '1.5rem 1.5rem 1.25rem',
              background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 70%)',
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
              {/* Team A */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 0.6rem',
                    borderRadius: '50%',
                    background: teamA.color_hex || '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    boxShadow: `0 8px 24px ${teamA.color_hex || '#ef4444'}55, 0 0 0 3px rgba(255,255,255,0.15)`,
                  }}
                >
                  {teamA.logo_emoji || '🔴'}
                </div>
                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: teamAWins ? '#ffffff' : '#e4e4e7',
                  }}
                >
                  {teamA.name}
                </div>
                {teamAWins && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: '#22c55e',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      marginTop: '2px',
                    }}
                  >
                    <CheckCircle size={11} /> ผู้ชนะ
                  </span>
                )}
              </div>

              {/* Match Score / Time Status */}
              <div style={{ textAlign: 'center', minWidth: '130px' }}>
                {isScheduleView ? (
                  /* SCHEDULE MODE: SHOW TIME & PAIR ONLY */
                  <>
                    <div
                      style={{
                        fontSize: '1.85rem',
                        fontWeight: 900,
                        fontFamily: 'var(--font-heading)',
                        color: '#facc15',
                        lineHeight: 1,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {matchTimeStr}
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: 'rgba(250, 204, 21, 0.15)',
                        color: '#fde047',
                        border: '1px solid rgba(250, 204, 21, 0.3)',
                      }}
                    >
                      {match.match_number ? `คู่ที่ ${match.match_number} • ${match.court || 'สนามหลัก'}` : 'ตารางการแข่งขัน'}
                    </div>
                  </>
                ) : isFinished ? (
                  /* RESULTS MODE: FINISHED SCORE */
                  <>
                    <div
                      style={{
                        fontSize: '2.5rem',
                        fontWeight: 900,
                        fontFamily: 'var(--font-heading)',
                        letterSpacing: '0.08em',
                        color: '#ffffff',
                        lineHeight: 1,
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                      }}
                    >
                      {scoreA} - {scoreB}
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: 'rgba(34, 197, 94, 0.18)',
                        color: '#4ade80',
                        border: '1px solid rgba(34, 197, 94, 0.35)',
                      }}
                    >
                      จบการแข่งขัน (Full Time)
                    </div>
                  </>
                ) : isLive ? (
                  /* RESULTS MODE: LIVE SCORE */
                  <>
                    <div
                      style={{
                        fontSize: '2.5rem',
                        fontWeight: 900,
                        fontFamily: 'var(--font-heading)',
                        letterSpacing: '0.08em',
                        color: '#f87171',
                        lineHeight: 1,
                        textShadow: '0 0 16px rgba(239, 68, 68, 0.4)',
                      }}
                    >
                      {scoreA ?? 0} - {scoreB ?? 0}
                    </div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        marginTop: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
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
                      กำลังแข่งขัน (LIVE)
                    </div>
                  </>
                ) : (
                  /* UPCOMING IN RESULTS */
                  <>
                    <div
                      style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-heading)',
                        color: '#facc15',
                        lineHeight: 1,
                      }}
                    >
                      {matchTimeStr}
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: 'rgba(250, 204, 21, 0.15)',
                        color: '#fde047',
                        border: '1px solid rgba(250, 204, 21, 0.3)',
                      }}
                    >
                      รอการแข่งขัน
                    </div>
                  </>
                )}

                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#71717a',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Calendar size={11} /> {match.match_date}
                </div>
              </div>

              {/* Team B */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 0.6rem',
                    borderRadius: '50%',
                    background: teamB.color_hex || '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    boxShadow: `0 8px 24px ${teamB.color_hex || '#0284c7'}55, 0 0 0 3px rgba(255,255,255,0.15)`,
                  }}
                >
                  {teamB.logo_emoji || '🔵'}
                </div>
                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: teamBWins ? '#ffffff' : '#e4e4e7',
                  }}
                >
                  {teamB.name}
                </div>
                {teamBWins && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: '#22c55e',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      marginTop: '2px',
                    }}
                  >
                    <CheckCircle size={11} /> ผู้ชนะ
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '0.3rem 0.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              gap: '0.25rem',
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.5rem',
                  fontSize: '0.82rem',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  color: activeTab === tab.id ? '#ffffff' : '#a1a1aa',
                  background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
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
                {/* Period/Set Scores if available (ONLY in Results mode) */}
                {!isScheduleView && match.period_scores && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '14px',
                      padding: '1rem',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#facc15', marginBottom: '0.6rem' }}>
                      คะแนนย่อยประจำเซต / ครึ่งเวลา
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                      {Object.entries(match.period_scores).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', color: '#d4d4d8' }}>
                          <span style={{ textTransform: 'capitalize', color: '#a1a1aa' }}>{k}:</span>
                          <span style={{ fontWeight: 700, color: '#ffffff' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Match Information Card */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '14px',
                    padding: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
                    {isScheduleView ? 'ข้อมูลการประกบคู่แข่งขัน' : 'บทวิเคราะห์ & สรุปแมตช์'}
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#d4d4d8', lineHeight: 1.6, margin: 0 }}>
                    {isScheduleView
                      ? `การประกบคู่ระหว่าง ${teamA.name} พบ ${teamB.name} ใน${match.round} (${match.category}) ณ ${match.court || match.venue} กำหนดเวลา ${matchTimeStr}`
                      : (match.summary || 'การแข่งขันรอบสำคัญในงาน Sci Games 2026')}
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
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                    <span style={{ color: '#71717a', display: 'block', marginBottom: '2px' }}>เวลาแข่งขัน</span>
                    <strong style={{ color: '#f4f4f5' }}>{matchTimeStr}</strong>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                    <span style={{ color: '#71717a', display: 'block', marginBottom: '2px' }}>สนามแข่งขัน</span>
                    <strong style={{ color: '#f4f4f5' }}>{match.court || match.venue}</strong>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                    <span style={{ color: '#71717a', display: 'block', marginBottom: '2px' }}>รอบการแข่ง</span>
                    <strong style={{ color: '#f4f4f5' }}>{match.round} ({match.category})</strong>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                    <span style={{ color: '#71717a', display: 'block', marginBottom: '2px' }}>ระยะเวลาแข่งขัน</span>
                    <strong style={{ color: '#f4f4f5' }}>{sport?.matchDuration || 'ตามระเบียบสูจิบัตร'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TACTICAL PITCH / LINE UP */}
            {activeTab === 'lineup' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                    ผังตำแหน่งลงสนาม ({sport?.startingPlayers || 5} vs {sport?.startingPlayers || 5})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                    {teamA.name} vs {teamB.name}
                  </div>
                </div>

                {/* THE TACTICAL GREEN PITCH */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '260px',
                    background: 'radial-gradient(ellipse at center, #1b4d24 0%, #113318 85%)',
                    borderRadius: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.6), 0 10px 30px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {/* Pitch Grass Stripes */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 30px, transparent 30px, transparent 60px)',
                    }}
                  />

                  {/* Halfway Line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: '50%',
                      width: '2px',
                      background: 'rgba(255, 255, 255, 0.35)',
                      transform: 'translateX(-50%)',
                    }}
                  />

                  {/* Center Circle */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      border: '2px solid rgba(255, 255, 255, 0.35)',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />

                  {/* Left Goal Area Box */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      width: '45px',
                      height: '110px',
                      border: '2px solid rgba(255, 255, 255, 0.35)',
                      borderLeft: 'none',
                      transform: 'translateY(-50%)',
                    }}
                  />

                  {/* Right Goal Area Box */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: 0,
                      width: '45px',
                      height: '110px',
                      border: '2px solid rgba(255, 255, 255, 0.35)',
                      borderRight: 'none',
                      transform: 'translateY(-50%)',
                    }}
                  />

                  {/* Player Dots for Team A */}
                  {(sport?.tacticalPositions?.teamA || [
                    { role: 'GK', label: 'GK', x: 14, y: 50 },
                    { role: 'DF', label: 'DF', x: 30, y: 35 },
                    { role: 'DF', label: 'DF', x: 30, y: 65 },
                    { role: 'FW', label: 'FW', x: 42, y: 50 },
                  ]).map((pos, idx) => (
                    <div
                      key={`a-${idx}`}
                      style={{
                        position: 'absolute',
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 2,
                      }}
                    >
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: teamA.color_hex || '#ef4444',
                          border: '2px solid #ffffff',
                          color: '#ffffff',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 3px 8px rgba(0,0,0,0.5)',
                        }}
                      >
                        {pos.role}
                      </div>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          color: '#ffffff',
                          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                          marginTop: '2px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {pos.label}
                      </span>
                    </div>
                  ))}

                  {/* Player Dots for Team B */}
                  {(sport?.tacticalPositions?.teamB || [
                    { role: 'FW', label: 'FW', x: 58, y: 50 },
                    { role: 'DF', label: 'DF', x: 70, y: 35 },
                    { role: 'DF', label: 'DF', x: 70, y: 65 },
                    { role: 'GK', label: 'GK', x: 86, y: 50 },
                  ]).map((pos, idx) => (
                    <div
                      key={`b-${idx}`}
                      style={{
                        position: 'absolute',
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 2,
                      }}
                    >
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: teamB.color_hex || '#0284c7',
                          border: '2px solid #ffffff',
                          color: '#ffffff',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 3px 8px rgba(0,0,0,0.5)',
                        }}
                      >
                        {pos.role}
                      </div>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          color: '#ffffff',
                          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                          marginTop: '2px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {pos.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '1.5rem',
                    marginTop: '0.85rem',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: teamA.color_hex }} />
                    <span>{teamA.name} ({sport?.startingPlayers} คน)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: teamB.color_hex }} />
                    <span>{teamB.name} ({sport?.startingPlayers} คน)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: OFFICIAL HANDBOOK RULES */}
            {activeTab === 'rules' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#facc15' }}>
                  ระเบียบการแข่งขันตามสูจิบัตร ({sport?.name})
                </div>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '14px',
                    padding: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem', lineHeight: 1.8, color: '#d4d4d8' }}>
                    {(sport?.rulesSummary || [
                      'ปฏิบัติตามกติกาการแข่งขันมาตรฐานสากล',
                      'นักกีฬาต้องแสดงบัตรนักศึกษาหรือบัตรประชาชนก่อนลงสนาม',
                      'การตัดสินของคณะกรรมการถือเป็นที่สิ้นสุด',
                    ]).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 4: VENUE & SCHEDULE */}
            {activeTab === 'venue' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '14px',
                    padding: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}
                >
                  <MapPin size={22} style={{ color: '#ca8a04', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>
                      {match.venue || sport?.venue}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>
                      มหาวิทยาลัยราชภัฏภูเก็ต • คณะวิทยาศาสตร์และเทคโนโลยี
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(250, 204, 21, 0.08)',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    border: '1px solid rgba(250, 204, 21, 0.25)',
                    fontSize: '0.82rem',
                    color: '#fef08a',
                    lineHeight: 1.6,
                  }}
                >
                  ⚠️ <strong>ข้อกำหนดการรายงานตัว:</strong> ทีมต้องมาถึงสนามก่อนเวลาแข่งขันอย่างน้อย 10 - 15 นาที หากไม่พร้อมลงสนามภายในเวลาที่กำหนด คณะกรรมการจะปรับเป็นแพ้การแข่งขันทันทีตามระเบียบ
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
