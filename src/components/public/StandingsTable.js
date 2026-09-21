'use client';
import { useState } from 'react';
import TeamBadge from '@/components/ui/TeamBadge';
import StandingsPodium from '@/components/public/StandingsPodium';
import { Trophy, Medal, Award, ChevronDown, ChevronRight, BarChart3 } from '@/components/animate-ui/icons';

export default function StandingsTable({ standings = [], showMeters = true }) {
  const [showDetailTable, setShowDetailTable] = useState(true);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy size={18} style={{ color: 'var(--accent-text)' }} />;
    if (index === 1) return <Medal size={18} style={{ color: '#64748b' }} />;
    if (index === 2) return <Medal size={18} style={{ color: '#d97706' }} />;
    return <Award size={18} style={{ color: 'var(--text-muted)' }} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 3D Leaderboard Podium (Replaces the old visual progress bars) */}
      {showMeters && <StandingsPodium standings={standings} />}

      {/* Detailed Data Table Section with Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0.5rem' }}>
        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <BarChart3 size={17} style={{ color: 'var(--accent-text)' }} />
          <span>ตารางคะแนนและสถิติแบบละเอียด</span>
        </span>
        <button
          onClick={() => setShowDetailTable(!showDetailTable)}
          className="btn btn-secondary btn-sm"
          style={{
            fontSize: '0.8rem',
            padding: '0.3rem 0.75rem',
            borderRadius: '9999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span>{showDetailTable ? 'ซ่อนตาราง' : 'แสดงตาราง'}</span>
          {showDetailTable ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {showDetailTable && (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>อันดับ</th>
                <th>ทีม / สี</th>
                <th style={{ textAlign: 'center' }}>แข่ง</th>
                <th style={{ textAlign: 'center' }}>ชนะ</th>
                <th style={{ textAlign: 'center' }}>เสมอ</th>
                <th style={{ textAlign: 'center' }}>แพ้</th>
                <th style={{ textAlign: 'center', color: 'var(--text)' }}>คะแนนรวม</th>
              </tr>
            </thead>
            <tbody>
              {standings.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: 'center',
                      padding: '2.5rem',
                      color: 'var(--text-3)',
                    }}
                  >
                    ยังไม่มีข้อมูลคะแนน
                  </td>
                </tr>
              ) : (
                standings.map((team, index) => (
                  <tr
                    key={team.id || team.name}
                    style={{
                      background:
                        index === 0
                          ? 'rgba(250, 204, 21, 0.08)'
                          : 'transparent',
                    }}
                  >
                    {/* Rank */}
                    <td
                      style={{
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                      }}
                    >
                      <span style={{ marginRight: '0.4rem', display: 'inline-flex', verticalAlign: 'middle' }}>
                        {getRankIcon(index)}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
                        #{index + 1}
                      </span>
                    </td>

                    {/* Team Badge */}
                    <td>
                      <TeamBadge
                        name={team.name}
                        colorHex={team.color_hex}
                        emoji={team.logo_emoji}
                        size="md"
                      />
                    </td>

                    {/* Stats */}
                    <td style={{ textAlign: 'center' }}>{team.matches_played ?? 0}</td>
                    <td style={{ textAlign: 'center', color: 'var(--success-text)', fontWeight: 600 }}>
                      {team.wins ?? 0}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                      {team.draws ?? 0}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--danger-text)' }}>
                      {team.losses ?? 0}
                    </td>

                    {/* Total Points */}
                    <td
                      style={{
                        textAlign: 'center',
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: 'var(--accent-text)',
                      }}
                    >
                      {team.total_points ?? 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
