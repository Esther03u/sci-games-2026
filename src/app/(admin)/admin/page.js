import DashboardCards from '@/components/admin/DashboardCards';
import StandingsTable from '@/components/public/StandingsTable';
import MatchCard from '@/components/ui/MatchCard';
import GlassCard from '@/components/ui/GlassCard';
import Link from 'next/link';
import { loadPage } from '@/lib/queries/page';
import { loadDashboard } from '@/lib/queries/admin';
import { LayoutDashboard, Trophy, Users, Zap } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'ภาพรวมระบบ Admin',
  description: 'แดชบอร์ดภาพรวมระบบจัดการแข่งขัน Sci Games 2026',
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const { stats, todayMatchesList, standings, sports, teams } = await loadPage('/admin', loadDashboard, {
    stats: { totalAthletes: 0, todayMatches: 0, finishedMatches: 0, totalMatches: 0, topTeam: null },
    todayMatchesList: [],
    standings: [],
    sports: [],
    teams: [],
  });

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1
            className="page-title"
            style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <LayoutDashboard size={24} style={{ color: 'var(--gold-600)' }} /> แดชบอร์ดภาพรวมระบบ
          </h1>
          <p className="page-subtitle">สถิติและสถานะการแข่งขัน Sci Games 2026</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            href="/admin/matches"
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Trophy size={14} /> บันทึกผลการแข่ง
          </Link>
          <Link
            href="/admin/athletes"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Users size={14} /> ดูรายชื่อนักกีฬา
          </Link>
        </div>
      </div>

      {/* 1. Stat Cards */}
      <DashboardCards stats={stats} />

      {/* 2. Grid: Matches Today & Standings */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
          gap: '2rem',
        }}
      >
        {/* Matches Overview */}
        <div>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Zap size={18} style={{ color: 'var(--gold-600)' }} /> การแข่งขันรอบล่าสุด / วันนี้
            </h2>
            <Link href="/admin/matches" style={{ fontSize: '0.88rem', color: 'var(--gold-600)' }}>
              จัดการทั้งหมด
            </Link>
          </div>

          {todayMatchesList.length === 0 ? (
            <GlassCard style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-3)' }}>
              ยังไม่มีรายการแข่งขัน
            </GlassCard>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {todayMatchesList.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  teams={teams}
                  sport={sports.find((s) => s.id === m.sport_id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Current Standings */}
        <div>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Trophy size={18} style={{ color: 'var(--gold-600)' }} /> สรุปคะแนนรวม 4 สี
            </h2>
            <Link href="/live" target="_blank" style={{ fontSize: '0.88rem', color: 'var(--gold-600)' }}>
              ดูหน้าเว็บสาธารณะ
            </Link>
          </div>
          <StandingsTable standings={standings} />
        </div>
      </div>
    </div>
  );
}
