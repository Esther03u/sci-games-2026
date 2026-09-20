'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import TeamBadge from '@/components/ui/TeamBadge';
import { Crown, Trophy, Medal, Award, Flame, Shield, Zap, Sparkles } from '@/components/animate-ui/icons';

export default function StandingsPodium({ standings = [], isMystery = false }) {
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

  const getTeamMascotIcon = (team, size = 32) => {
    const name = team?.name || '';
    const color = team?.color_hex?.toLowerCase() || '';

    if (name.includes('แดง') || color === '#ef4444') {
      return <Flame size={size} style={{ color: '#ffffff' }} />;
    }
    if (name.includes('น้ำเงิน') || color === '#3b82f6') {
      return <Shield size={size} style={{ color: '#ffffff' }} />;
    }
    if (name.includes('เหลือง') || color === '#eab308' || color === '#facc15') {
      return <Zap size={size} style={{ color: '#ffffff' }} />;
    }
    return <Sparkles size={size} style={{ color: '#ffffff' }} />;
  };

  return (
    <div className="podium-card">
      {/* Ambient Spotlight beaming down on Rank 1 */}
      <div className="podium-spotlight" />

      {/* Header (Only shown on full standings page) */}
      {!isMystery && (
        <div className="podium-header">
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: '#fef3c7',
                color: '#b45309',
                border: '1px solid #fde68a',
                borderRadius: '9999px',
                padding: '0.3rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.1)',
              }}
            >
              <Trophy size={14} style={{ color: '#ca8a04' }} />
              <span>ผู้นำตารางคะแนนรวม 3 อันดับแรก</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: '#71717a' }}>
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
            {isMystery ? (
              <div
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
              </div>
            ) : (
              <div
                className="podium-avatar-box rank-2"
                style={{
                  backgroundColor: second.color_hex || '#3b82f6',
                  background: `linear-gradient(135deg, ${second.color_hex || '#3b82f6'}dd 0%, ${second.color_hex || '#3b82f6'} 100%)`,
                }}
              >
                {getTeamMascotIcon(second, 28)}
              </div>
            )}
            {!isMystery && (
              <div className="podium-team-title rank-2">{second.name}</div>
            )}
            {!isMystery && (
              <div className="podium-points-chip rank-2">
                <Medal size={12} style={{ color: '#64748b' }} />
                <span>{second.total_points ?? 0} แต้ม</span>
              </div>
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

            {isMystery ? (
              <div
                className="podium-avatar-box rank-1"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                  color: '#ffffff',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-heading)',
                  textShadow: '0 2px 14px rgba(180, 83, 9, 0.6)',
                  boxShadow: '0 10px 32px rgba(217, 119, 6, 0.5), 0 0 0 4px rgba(251, 191, 36, 0.4)',
                }}
              >
                ?
              </div>
            ) : (
              <div
                className="podium-avatar-box rank-1"
                style={{
                  backgroundColor: first.color_hex || '#ef4444',
                  background: `linear-gradient(135deg, ${first.color_hex || '#ef4444'}ee 0%, ${first.color_hex || '#ef4444'} 100%)`,
                }}
              >
                {getTeamMascotIcon(first, 36)}
              </div>
            )}
            {!isMystery && (
              <div className="podium-team-title rank-1">{first.name}</div>
            )}
            {!isMystery && (
              <div className="podium-points-chip rank-1">
                <Trophy size={13} style={{ color: '#ca8a04' }} />
                <span>{first.total_points ?? 0} แต้ม</span>
              </div>
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
            {isMystery ? (
              <div
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
              </div>
            ) : (
              <div
                className="podium-avatar-box rank-3"
                style={{
                  backgroundColor: third.color_hex || '#eab308',
                  background: `linear-gradient(135deg, ${third.color_hex || '#eab308'}dd 0%, ${third.color_hex || '#eab308'} 100%)`,
                }}
              >
                {getTeamMascotIcon(third, 26)}
              </div>
            )}
            {!isMystery && (
              <div className="podium-team-title rank-3">{third.name}</div>
            )}
            {!isMystery && (
              <div className="podium-points-chip rank-3">
                <Award size={12} style={{ color: '#c2410c' }} />
                <span>{third.total_points ?? 0} แต้ม</span>
              </div>
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

      {/* Runners-up Row (Only on full standings page) */}
      {!isMystery && runners.length > 0 && (
          <div className="podium-runners-row">
            <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 600 }}>
              อันดับถัดไป:
            </span>
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
                  <span style={{ fontWeight: 700 }}>#{idx + 4} {r.name}</span>
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>({r.total_points ?? 0} แต้ม)</span>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
