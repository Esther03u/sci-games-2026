'use client';
import GlassCard from '@/components/ui/GlassCard';
import { Users, Zap, Flag, Trophy } from '@/components/animate-ui/icons';

export default function DashboardCards({ stats }) {
  const cards = [
    {
      title: 'นักกีฬาที่ลงทะเบียนแล้ว',
      value: `${stats?.totalAthletes || 0} คน`,
      sub: 'เป้าหมาย ~160 คน',
      icon: <Users size={24} style={{ color: '#60a5fa' }} />,
      color: '#60a5fa',
    },
    {
      title: 'การแข่งขันวันนี้',
      value: `${stats?.todayMatches || 0} แมตช์`,
      sub: 'ตามตารางกำหนดการ',
      icon: <Zap size={24} style={{ color: 'var(--success-text)' }} />,
      color: 'var(--success-text)',
    },
    {
      title: 'สถานะการแข่งขันทั้งหมด',
      value: `${stats?.finishedMatches || 0} / ${stats?.totalMatches || 0}`,
      sub: 'จบแล้ว / ทั้งหมด',
      icon: <Flag size={24} style={{ color: 'var(--gold-600)' }} />,
      color: 'var(--gold-600)',
    },
    {
      title: 'ทีมนำคะแนนรวม',
      value: stats?.topTeam ? stats.topTeam.name : '-',
      sub: stats?.topTeam ? `${stats.topTeam.total_points || 0} คะแนน` : 'ยังไม่มีคะแนน',
      icon: <Trophy size={24} style={{ color: stats?.topTeam?.color_hex || '#f87171' }} />,
      color: stats?.topTeam?.color_hex || '#f87171',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem',
      }}
    >
      {cards.map((c) => (
        <GlassCard
          key={c.title}
          style={{
            padding: '1.5rem',
            border: '1px solid var(--glass-border)',
          }}
        >
          <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--mono-700)' }}>
              {c.title}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>{c.icon}</span>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.85rem',
              fontWeight: 800,
              color: c.color,
              marginBottom: '0.25rem',
            }}
          >
            {c.value}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--mono-500)' }}>
            {c.sub}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
