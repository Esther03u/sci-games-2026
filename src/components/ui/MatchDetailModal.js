'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, MapPin, Trophy, Shield, Info, Calendar, Activity, CheckCircle, AlertTriangle } from '@/components/animate-ui/icons';
import { SportIcon } from './SportIcon';

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

  const getTeamStyle = (team) => {
    const hex = (team?.color_hex || '').toLowerCase();
    const id = (team?.id || '').toLowerCase();
    const name = (team?.name || '').toLowerCase();

    if (hex === '#ef4444' || id.includes('red') || name.includes('แดง')) {
      return {
        hex: '#ef4444',
        gradient: 'linear-gradient(145deg, #ff5c5c 0%, #ef4444 52%, var(--danger-text) 100%)',
        glow: 'rgba(239, 68, 68, 0.55)',
        ambient: 'rgba(239, 68, 68, 0.12)',
        ring: 'rgba(239, 68, 68, 0.35)',
      };
    }
    if (hex === '#0284c7' || hex === '#3b82f6' || id.includes('blue') || name.includes('ฟ้า') || name.includes('น้ำเงิน')) {
      return {
        hex: '#0284c7',
        gradient: 'linear-gradient(145deg, #38bdf8 0%, #0ea5e9 52%, #0284c7 100%)',
        glow: 'rgba(2, 132, 199, 0.55)',
        ambient: 'rgba(2, 132, 199, 0.12)',
        ring: 'rgba(2, 132, 199, 0.35)',
      };
    }
    if (hex === '#10b981' || hex === '#22c55e' || id.includes('green') || name.includes('เขียว')) {
      return {
        hex: '#10b981',
        gradient: 'linear-gradient(145deg, #34d399 0%, #10b981 52%, #047857 100%)',
        glow: 'rgba(16, 185, 129, 0.55)',
        ambient: 'rgba(16, 185, 129, 0.12)',
        ring: 'rgba(16, 185, 129, 0.35)',
      };
    }
    if (hex === '#8b5cf6' || hex === '#7c3aed' || id.includes('purple') || name.includes('ม่วง')) {
      return {
        hex: '#8b5cf6',
        gradient: 'linear-gradient(145deg, #c084fc 0%, #8b5cf6 52%, #6d28d9 100%)',
        glow: 'rgba(139, 92, 246, 0.55)',
        ambient: 'rgba(139, 92, 246, 0.12)',
        ring: 'rgba(139, 92, 246, 0.35)',
      };
    }
    const fallbackHex = team?.color_hex || '#ca8a04';
    return {
      hex: fallbackHex,
      gradient: team?.bg_gradient || `linear-gradient(145deg, ${fallbackHex}, #854d0e)`,
      glow: `${fallbackHex}55`,
      ambient: `${fallbackHex}14`,
      ring: `${fallbackHex}35`,
    };
  };

  const styleA = getTeamStyle(teamA);
  const styleB = getTeamStyle(teamB);

  const tabs = [
    { id: 'summary', label: 'ภาพรวม' },
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
            border: '1px solid var(--border)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            color: 'var(--text)',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04)',
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
                  fontSize: '0.76rem',
                  color: 'var(--text-3)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {match.round} • {match.category} {match.court ? `(${match.court})` : ''}
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
              background: `radial-gradient(ellipse at 0% 50%, ${styleA.hex}40 0%, transparent 65%), radial-gradient(ellipse at 100% 50%, ${styleB.hex}40 0%, transparent 65%), linear-gradient(90deg, ${styleA.hex}22 0%, var(--surface) 38%, var(--surface) 62%, ${styleB.hex}22 100%)`,
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
              {/* Team A (Left) - Perfectly Centered Name (Bold if Won, Muted if Lost) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: teamAWins ? '1.45rem' : isFinished && teamBWins ? '1.25rem' : '1.35rem',
                    fontWeight: teamAWins ? 900 : isFinished && teamBWins ? 600 : 800,
                    fontFamily: 'var(--font-heading)',
                    color: isFinished && teamBWins ? 'var(--text-3)' : 'var(--text)',
                    opacity: isFinished && teamBWins ? 0.5 : 1,
                    lineHeight: 1.2,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {teamA.name}
                </div>
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
                        color: 'var(--text)',
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
                      <span style={{ color: isFinished && teamBWins ? 'var(--text-3)' : 'var(--text)', opacity: isFinished && teamBWins ? 0.5 : 1 }}>
                        {scoreA}
                      </span>
                      <span style={{ color: 'var(--text-muted)', margin: '0 8px', fontWeight: 400 }}>-</span>
                      <span style={{ color: isFinished && teamAWins ? 'var(--text-3)' : 'var(--text)', opacity: isFinished && teamAWins ? 0.5 : 1 }}>
                        {scoreB}
                      </span>
                    </div>
                  </div>
                ) : isLive ? (
                  /* RESULTS MODE: LIVE SCORE */
                  <div>
                    <div
                      style={{
                        fontSize: '2.5rem',
                        fontWeight: 900,
                        fontFamily: 'var(--font-heading)',
                        letterSpacing: '0.08em',
                        color: 'var(--danger-text)',
                        lineHeight: 1,
                      }}
                    >
                      {scoreA ?? 0} - {scoreB ?? 0}
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
                        color: 'var(--text)',
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
                    color: 'var(--text-3)',
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

              {/* Team B (Right) - Perfectly Centered Name (Bold if Won, Muted if Lost) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: teamBWins ? '1.45rem' : isFinished && teamAWins ? '1.25rem' : '1.35rem',
                    fontWeight: teamBWins ? 900 : isFinished && teamAWins ? 600 : 800,
                    fontFamily: 'var(--font-heading)',
                    color: isFinished && teamAWins ? 'var(--text-3)' : 'var(--text)',
                    opacity: isFinished && teamAWins ? 0.5 : 1,
                    lineHeight: 1.2,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {teamB.name}
                </div>
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
                {/* Period/Set Scores if available (ONLY in Results mode) */}
                {!isScheduleView && match.period_scores && (
                  <div
                    style={{
                      background: 'var(--surface-2)',
                      borderRadius: '14px',
                      padding: '1rem',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-text)', marginBottom: '0.6rem' }}>
                      คะแนนย่อยประจำเซต / ครึ่งเวลา
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                      {Object.entries(match.period_scores).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', color: '#3f3f46' }}>
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
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>
                    {isScheduleView ? 'ข้อมูลการประกบคู่แข่งขัน' : 'บทวิเคราะห์ & สรุปแมตช์'}
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#3f3f46', lineHeight: 1.6, margin: 0 }}>
                    {isScheduleView
                      ? `การประกบคู่แข่งขันใน${match.round} (${match.category}) ณ ${match.court || match.venue} กำหนดเวลา ${matchTimeStr}`
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
                  <div style={{ background: 'var(--surface-2)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: '2px' }}>เวลาแข่งขัน</span>
                    <strong style={{ color: 'var(--text)' }}>{matchTimeStr}</strong>
                  </div>
                  <div style={{ background: 'var(--surface-2)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: '2px' }}>สนามแข่งขัน</span>
                    <strong style={{ color: 'var(--text)' }}>{match.court || match.venue}</strong>
                  </div>
                  <div style={{ background: 'var(--surface-2)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: '2px' }}>รอบการแข่ง</span>
                    <strong style={{ color: 'var(--text)' }}>{match.round} ({match.category})</strong>
                  </div>
                  <div style={{ background: 'var(--surface-2)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: '2px' }}>ระยะเวลาแข่งขัน</span>
                    <strong style={{ color: 'var(--text)' }}>{sport?.matchDuration || 'ตามระเบียบสูจิบัตร'}</strong>
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
                  <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem', lineHeight: 1.8, color: 'var(--text-2)' }}>
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
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>
                      {match.venue || sport?.venue}
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
                  <AlertTriangle size={16} style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>ข้อกำหนดการรายงานตัว:</strong> ทีมต้องมาถึงสนามก่อนเวลาแข่งขันอย่างน้อย 10 - 15 นาที หากไม่พร้อมลงสนามภายในเวลาที่กำหนด คณะกรรมการจะปรับเป็นแพ้การแข่งขันทันทีตามระเบียบ
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
