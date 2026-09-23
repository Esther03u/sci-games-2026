'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Trophy, Medal, Award } from '@/components/animate-ui/icons';
import PodiumCountdown from './PodiumCountdown';

export default function StandingsPodium({
  standings = [],
  isMystery = false,
  countdownSettings = null,
  interactive = false,
}) {
  const [revealed, setRevealed] = useState(() => Boolean(countdownSettings?.revealed));

  const effectiveMystery = interactive ? !revealed : isMystery;

  // Ensure we have at least 4 default teams if standings is empty
  const defaultTeams = [
    { id: '1', name: 'สีแดง', color_hex: '#ef4444', total_points: 0, wins: 0, matches_played: 0 },
    { id: '2', name: 'สีน้ำเงิน', color_hex: '#3b82f6', total_points: 0, wins: 0, matches_played: 0 },
    { id: '3', name: 'สีเขียว', color_hex: '#22c55e', total_points: 0, wins: 0, matches_played: 0 },
    { id: '4', name: 'สีเหลือง', color_hex: '#eab308', total_points: 0, wins: 0, matches_played: 0 },
  ];

  const sourceData = standings.length > 0 ? standings : defaultTeams;

  // Sort by total_points desc, then wins desc
  const sorted = [...sourceData].sort((a, b) => {
    const diff = (b.total_points ?? 0) - (a.total_points ?? 0);
    if (diff !== 0) return diff;
    return (b.wins ?? 0) - (a.wins ?? 0);
  });

  const first = sorted[0] || defaultTeams[0];
  const second = sorted[1] || defaultTeams[1];
  const third = sorted[2] || defaultTeams[2];
  const runners = sorted.slice(3);

  return (
    <div className="podium-card">
      {/* Ambient Spotlight beaming down on Rank 1 */}
      <div className="podium-spotlight" />

      {/* Header (Only shown on full standings page) */}
      {!effectiveMystery && !interactive && (
        <div className="podium-header">
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'var(--accent-surface)',
                color: 'var(--accent-text)',
                border: '1px solid var(--accent-border)',
                borderRadius: '9999px',
                padding: '0.3rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.1)',
              }}
            >
              <Trophy size={14} style={{ color: 'var(--accent-text)' }} />
              <span>ผู้นำตารางคะแนนรวม 3 อันดับแรก</span>
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.82rem',
              color: 'var(--text-3)',
            }}
          >
            <span>คะแนนสะสมชิงชัย</span>
          </div>
        </div>
      )}

      {/* 3D Podium Stage (Order: 2 - 1 - 3) */}
      <div className="podium-stage">
        {/* RANK 2 (Left - Silver) */}
        <motion.div
          className="podium-col rank-2"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="podium-avatar-wrapper">
            <AnimatePresence mode="wait">
              {effectiveMystery ? (
                <motion.div
                  key="mystery-2"
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="podium-avatar-box rank-2"
                  style={{
                    background: 'linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%)',
                    color: '#ffffff',
                    fontSize: '2rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-heading)',
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    boxShadow: '0 8px 24px rgba(100, 116, 139, 0.35)',
                  }}
                >
                  ?
                </motion.div>
              ) : (
                <motion.div
                  key="revealed-2"
                  initial={{ rotateY: 90, opacity: 0, scale: 0.8 }}
                  animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, type: 'spring', bounce: 0.35 }}
                  className="podium-avatar-box rank-2"
                  style={{
                    backgroundColor: second.color_hex || '#3b82f6',
                    background: `linear-gradient(135deg, ${second.color_hex || '#3b82f6'}dd 0%, ${second.color_hex || '#3b82f6'} 100%)`,
                    boxShadow: `0 8px 24px ${second.color_hex || '#3b82f6'}55, inset 0 1px 2px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.25)`,
                  }}
                />
              )}
            </AnimatePresence>

            {!effectiveMystery && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div className="podium-team-title rank-2">{second.name}</div>
                <div className="podium-points-chip rank-2">
                  <Medal size={12} style={{ color: '#64748b' }} />
                  <span>{second.total_points ?? 0} แต้ม</span>
                </div>
              </motion.div>
            )}
          </div>

          <motion.div
            className="podium-block rank-2"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'bottom' }}
          >
            <span className="podium-digit">2</span>
          </motion.div>
        </motion.div>

        {/* RANK 1 (Center - Gold Champion) */}
        <motion.div
          className="podium-col rank-1"
          initial={{ opacity: 0, y: 45 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="podium-avatar-wrapper">
            {/* Animated Floating Crown */}
            <div className="podium-crown-wrap">
              <Crown size={28} />
            </div>

            <AnimatePresence mode="wait">
              {effectiveMystery ? (
                <motion.div
                  key="mystery-1"
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="podium-avatar-box rank-1"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, var(--accent-text) 100%)',
                    color: '#ffffff',
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-heading)',
                    textShadow: '0 2px 14px rgba(180, 83, 9, 0.6)',
                    boxShadow: '0 10px 32px rgba(217, 119, 6, 0.5), 0 0 0 4px rgba(251, 191, 36, 0.4)',
                  }}
                >
                  ?
                </motion.div>
              ) : (
                <motion.div
                  key="revealed-1"
                  initial={{ rotateY: 90, opacity: 0, scale: 0.8 }}
                  animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
                  className="podium-avatar-box rank-1"
                  style={{
                    backgroundColor: first.color_hex || '#ef4444',
                    background: `linear-gradient(135deg, ${first.color_hex || '#ef4444'}ee 0%, ${first.color_hex || '#ef4444'} 100%)`,
                    boxShadow: `0 10px 30px ${first.color_hex || '#ef4444'}66, inset 0 1px 2px rgba(255, 255, 255, 0.7), inset 0 -2px 4px rgba(0, 0, 0, 0.25)`,
                  }}
                />
              )}
            </AnimatePresence>

            {!effectiveMystery && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div className="podium-team-title rank-1">{first.name}</div>
                <div className="podium-points-chip rank-1">
                  <Trophy size={13} style={{ color: 'var(--accent-text)' }} />
                  <span>{first.total_points ?? 0} แต้ม</span>
                </div>
              </motion.div>
            )}
          </div>

          <motion.div
            className="podium-block rank-1"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'bottom' }}
          >
            <span className="podium-digit">1</span>
          </motion.div>
        </motion.div>

        {/* RANK 3 (Right - Bronze) */}
        <motion.div
          className="podium-col rank-3"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="podium-avatar-wrapper">
            <AnimatePresence mode="wait">
              {effectiveMystery ? (
                <motion.div
                  key="mystery-3"
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="podium-avatar-box rank-3"
                  style={{
                    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 50%, #9a3412 100%)',
                    color: '#ffffff',
                    fontSize: '1.9rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-heading)',
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    boxShadow: '0 8px 24px rgba(234, 88, 12, 0.35)',
                  }}
                >
                  ?
                </motion.div>
              ) : (
                <motion.div
                  key="revealed-3"
                  initial={{ rotateY: 90, opacity: 0, scale: 0.8 }}
                  animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, type: 'spring', bounce: 0.35 }}
                  className="podium-avatar-box rank-3"
                  style={{
                    backgroundColor: third.color_hex || '#eab308',
                    background: `linear-gradient(135deg, ${third.color_hex || '#eab308'}dd 0%, ${third.color_hex || '#eab308'} 100%)`,
                    boxShadow: `0 8px 24px ${third.color_hex || '#eab308'}55, inset 0 1px 2px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.25)`,
                  }}
                />
              )}
            </AnimatePresence>

            {!effectiveMystery && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div className="podium-team-title rank-3">{third.name}</div>
                <div className="podium-points-chip rank-3">
                  <Award size={12} style={{ color: '#c2410c' }} />
                  <span>{third.total_points ?? 0} แต้ม</span>
                </div>
              </motion.div>
            )}
          </div>

          <motion.div
            className="podium-block rank-3"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'bottom' }}
          >
            <span className="podium-digit">3</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Runners-up Row (Shown on full standings page OR when revealed on homepage) */}
      {!effectiveMystery && runners.length > 0 && (
        <motion.div
          className="podium-runners-row"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-3)', fontWeight: 600 }}>อันดับถัดไป:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {runners.map((r, idx) => (
              <div key={r.id || r.name} className="podium-runners-pill">
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: r.color_hex || '#22c55e',
                    boxShadow: `0 0 6px ${r.color_hex || '#22c55e'}aa`,
                  }}
                />
                <span style={{ fontWeight: 700 }}>
                  #{idx + 4} {r.name}
                </span>
                <span style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>
                  ({r.total_points ?? 0} แต้ม)
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Interactive Countdown & Reveal Controller (Underneath the 3D podium) */}
      {interactive && (
        <PodiumCountdown
          initialSettings={countdownSettings}
          isRevealed={revealed}
          onRevealChange={setRevealed}
        />
      )}
    </div>
  );
}
