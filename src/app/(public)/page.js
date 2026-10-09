import Link from 'next/link';
import HeroSection from '@/components/public/HeroSection';
import FeaturedMatchesLive from '@/components/public/FeaturedMatchesLive';
import { thaiToday } from '@/lib/featured-matches';
import StandingsPodium from '@/components/public/StandingsPodium';
import GlassCard from '@/components/ui/GlassCard';
import { loadPublicPage } from '@/lib/queries/page';
import { getAnnouncements, getPublicMatches, getSports, getTeams, rows } from '@/lib/queries/core';
import { getPodiumSettings } from '@/lib/queries/podium';
import { loadPlacements } from '@/lib/queries/placements';
import DepartmentsByColor from '@/components/public/DepartmentsByColor';
import { Pin } from '@/components/animate-ui/icons';

// ISR like /schedule and /results: one Supabase read per 30 s however many
// people open the home page (Free tier egress). Admin writes revalidate '/'.
export const revalidate = 30;

const FALLBACK_DEPARTMENTS = [
  { id: '1', name: 'เทคโนโลยีดิจิทัล', team_id: '11111111-1111-1111-1111-111111111111' },
  { id: '2', name: 'วิทยาการคอมพิวเตอร์', team_id: '11111111-1111-1111-1111-111111111111' },
  { id: '3', name: 'เทคโนโลยีสารสนเทศ', team_id: '22222222-2222-2222-2222-222222222222' },
  { id: '4', name: 'นวัตกรรมอาหารและเครื่องดื่ม', team_id: '22222222-2222-2222-2222-222222222222' },
  { id: '5', name: 'วิทยาศาสตร์สิ่งแวดล้อม', team_id: '33333333-3333-3333-3333-333333333333' },
  { id: '6', name: 'สาธารณสุขศาสตร์', team_id: '33333333-3333-3333-3333-333333333333' },
  { id: '7', name: 'การจัดการภัยพิบัติและสิ่งแวดล้อม', team_id: '44444444-4444-4444-4444-444444444444' },
  { id: '8', name: 'คหกรรมศาสตร์ประยุกต์', team_id: '44444444-4444-4444-4444-444444444444' },
];

const FALLBACK_TEAMS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'สีแดง', color_hex: '#ef4444', sort_order: 1 },
  { id: '22222222-2222-2222-2222-222222222222', name: 'สีฟ้า', color_hex: '#0284c7', sort_order: 2 },
  { id: '33333333-3333-3333-3333-333333333333', name: 'สีเขียว', color_hex: '#10b981', sort_order: 3 },
  { id: '44444444-4444-4444-4444-444444444444', name: 'สีม่วง', color_hex: '#8b5cf6', sort_order: 4 },
];

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
  const displayTeams = teams?.length > 0 ? teams : FALLBACK_TEAMS;
  const displayDepartments = departments?.length > 0 ? departments : FALLBACK_DEPARTMENTS;

  return (
    <div>
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Pinned Announcements (if any) */}
      {announcements.length > 0 && (
        <section className="home-section">
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <h2 className="home-news-title">ข่าวประชาสัมพันธ์ล่าสุด</h2>
            <Link href="/news" style={{ fontSize: '0.9rem', color: 'var(--accent-text)', fontWeight: 600 }}>
              ดูข่าวทั้งหมด →
            </Link>
          </div>
          <div className="home-news-grid">
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
                <h3 className="home-news-card-title">{item.title}</h3>
                <p className="home-news-card-text">{item.content}</p>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      {/* 3. Highlight Matches */}
      <FeaturedMatchesLive
        initialMatches={allMatches}
        initialSports={sports}
        initialTeams={teams}
        today={thaiToday()}
      />

      {/* 4. Podium Rankings Section */}
      <section className="home-section-lg">
        <div className="home-section-head">
          <h2 className="home-h2">อันดับคะแนน</h2>
          <p className="home-sub">ร่วมลุ้นว่าสีไหนจะได้ครองอันดับเท่าไหร่ในงาน Sci Games 2026</p>
        </div>
        <StandingsPodium standings={standings} countdownSettings={podiumSettings} interactive={true} />
      </section>

      {/* 4b. Departments per colour (switch in /admin/settings) */}
      {placements.showDepartments && (
        <section className="home-section-lg">
          <div className="home-section-head">
            <h2 className="home-h2">สาขาในแต่ละสี</h2>
            <p className="home-sub">ดูว่าสาขาของคุณอยู่ทีมสีไหน</p>
          </div>
          <DepartmentsByColor teams={displayTeams} departments={displayDepartments} />
        </section>
      )}
    </div>
  );
}
