import Link from 'next/link';
import HeroSection from '@/components/public/HeroSection';
import QuickLinks from '@/components/public/QuickLinks';
import MatchCard from '@/components/ui/MatchCard';
import StandingsPodium from '@/components/public/StandingsPodium';
import GlassCard from '@/components/ui/GlassCard';
import { loadPublicPage } from '@/lib/queries/page';
import { getAnnouncements, getPublicMatches, getSports, getTeams, rows } from '@/lib/queries/core';
import { getPodiumSettings } from '@/lib/queries/podium';
import { loadPlacements } from '@/lib/queries/placements';
import DepartmentsByColor from '@/components/public/DepartmentsByColor';
import { pickFeaturedMatches } from '@/lib/featured-matches';
import { Pin } from '@/components/animate-ui/icons';

// ISR like /schedule and /results: one Supabase read per 30 s however many
// people open the home page (Free tier egress). Admin writes revalidate '/'.
export const revalidate = 30;

export default async function HomePage() {
  const [{ announcements, matches: allMatches, sports, teams, departments }, podiumSettings, placements] =
    await Promise.all([
      loadPublicPage(
        '/',
        async (sb) => {
          const [t, s, m, a, std] = await Promise.all([
            getTeams(sb),
            getSports(sb),
            getPublicMatches(sb),
            getAnnouncements(sb, { limit: 3 }),
            sb.from('departments').select('id, name, team_id').order('name'),
          ]);
          return {
            teams: rows(t),
            sports: rows(s),
            matches: rows(m),
            announcements: rows(a),
            departments: rows(std),
          };
        },
        { announcements: [], matches: [], sports: [], teams: [], departments: [] }
      ),
      getPodiumSettings(),
      loadPlacements().catch((err) => {
        console.error('home placements:', err);
        return { standings: [], revealed: false, showDepartments: false };
      }),
    ]);
  // Overall totals only once the podium has been opened; before that the
  // podium fetches /api/standings at the moment of the reveal.
  const standings = placements.revealed ? placements.standings : [];
  const matches = pickFeaturedMatches(allMatches, sports);

  return (
    <div>
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Pinned Announcements (if any) */}
      {announcements.length > 0 && (
        <section style={{ margin: '2.5rem 0' }}>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <h2
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--text)',
              }}
            >
              ข่าวประชาสัมพันธ์ล่าสุด
            </h2>
            <Link href="/news" style={{ fontSize: '0.9rem', color: 'var(--accent-text)', fontWeight: 600 }}>
              ดูข่าวทั้งหมด →
            </Link>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {announcements.map((item) => (
              <GlassCard key={item.id} style={{ padding: '1.25rem' }}>
                {item.is_pinned && (
                  <span
                    className="badge"
                    style={{
                      background: 'var(--accent-surface)',
                      color: 'var(--accent-text)',
                      border: '1px solid var(--accent-border)',
                      fontSize: '0.75rem',
                      marginBottom: '0.5rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontWeight: 600,
                    }}
                  >
                    <Pin size={12} /> ปักหมุด
                  </span>
                )}
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text)' }}>
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-2)',
                    lineHeight: 1.5,
                    WebkitLineClamp: 2,
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.content}
                </p>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      {/* 3. Highlight Matches */}
      <section style={{ margin: '3.5rem 0' }}>
        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h2
              style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: 'var(--text)',
              }}
            >
              การแข่งขันที่น่าสนใจ
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>แมตช์ที่กำลังแข่งขันและโปรแกรมถัดไป</p>
          </div>
          <Link href="/schedule" className="btn btn-secondary btn-sm">
            ดูตารางทั้งหมด
          </Link>
        </div>

        {matches.length === 0 ? (
          <GlassCard style={{ textAlign: 'center', padding: '2.5rem' }}>
            <p style={{ color: 'var(--text-3)', fontSize: '1.05rem' }}>
              ยังไม่มีแมตช์การแข่งขันในขณะนี้ ติดตามการประกบคู่เร็วๆ นี้
            </p>
          </GlassCard>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
              gap: '1rem',
            }}
          >
            {matches.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                teams={teams}
                sport={sports.find(
                  (s) =>
                    s.id === m.sport_id ||
                    (m.sport_id && m.sport_id.toLowerCase().includes(s.id.toLowerCase()))
                )}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Podium Rankings Section */}
      <section style={{ margin: '3.5rem 0' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'var(--text)',
            }}
          >
            อันดับคะแนน
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>
            ร่วมลุ้นว่าสีไหนจะได้ครองอันดับเท่าไหร่ในงาน Sci Games 2026
          </p>
        </div>
        <StandingsPodium standings={standings} countdownSettings={podiumSettings} interactive={true} />
      </section>

      {/* 4b. Departments per colour (switch in /admin/settings until the list is right) */}
      {placements.showDepartments && departments.length > 0 && (
        <section style={{ margin: '3.5rem 0' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)' }}>สาขาในแต่ละสี</h2>
            <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>ดูว่าสาขาของคุณอยู่ทีมสีไหน</p>
          </div>
          <DepartmentsByColor teams={teams} departments={departments} />
        </section>
      )}

      {/* 5. Quick Links */}
      <QuickLinks />
    </div>
  );
}
