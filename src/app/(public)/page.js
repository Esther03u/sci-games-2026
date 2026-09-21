import Link from 'next/link';
import HeroSection from '@/components/public/HeroSection';
import QuickLinks from '@/components/public/QuickLinks';
import MatchCard from '@/components/ui/MatchCard';
import StandingsPodium from '@/components/public/StandingsPodium';
import GlassCard from '@/components/ui/GlassCard';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Zap, Megaphone, Pin, Trophy } from '@/components/animate-ui/icons';
import { OFFICIAL_MATCHES, OFFICIAL_SPORTS, OFFICIAL_TEAMS } from '@/lib/tournamentData';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let announcements = [];
  let matches = [];
  let sports = [];
  let teams = [];

  try {
    const supabase = await createServerSupabaseClient();
    const [teamsRes, sportsRes, matchesRes, annRes] = await Promise.all([
      supabase.from('teams').select('*').order('sort_order'),
      supabase.from('sports').select('*').order('sort_order'),
      supabase.from('matches').select('*').order('match_date').order('match_time').limit(4),
      supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('published_at', { ascending: false }).limit(3),
    ]);

    if (teamsRes?.data?.length) teams = teamsRes.data;
    if (sportsRes?.data?.length) sports = sportsRes.data;
    if (matchesRes?.data?.length) matches = matchesRes.data;
    if (annRes?.data?.length) announcements = annRes.data;
  } catch (err) {
    console.error('Data fetch fallback on Home:', err);
  }

  // Fall back to the handbook dataset as a whole so sport/team ids line up.
  const useHandbook = matches.length === 0;
  const finalTeams = useHandbook ? OFFICIAL_TEAMS : teams;
  const finalSports = useHandbook ? OFFICIAL_SPORTS : sports;
  const finalMatches = useHandbook ? OFFICIAL_MATCHES.slice(0, 4) : matches;

  return (
    <div>
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Pinned Announcements (if any) */}
      {announcements.length > 0 && (
        <section style={{ margin: '2.5rem 0' }}>
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)' }}>
              <Megaphone size={20} style={{ color: 'var(--accent-text)' }} /> ข่าวประชาสัมพันธ์ล่าสุด
            </h2>
            <Link href="/news" style={{ fontSize: '0.9rem', color: 'var(--accent-text)', fontWeight: 600 }}>
              ดูข่าวทั้งหมด →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {announcements.map((item) => (
              <GlassCard key={item.id} style={{ padding: '1.25rem' }}>
                {item.is_pinned && (
                  <span className="badge" style={{ background: 'var(--accent-surface)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)', fontSize: '0.75rem', marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                    <Pin size={12} /> ปักหมุด
                  </span>
                )}
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text)' }}>{item.title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.5, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={22} style={{ color: 'var(--accent-text)' }} /> การแข่งขันที่น่าสนใจ
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>
              แมตช์กำลังแข่งและแมตช์ที่กำลังจะมาถึง
            </p>
          </div>
          <Link href="/schedule" className="btn btn-secondary btn-sm">
            ดูตารางทั้งหมด
          </Link>
        </div>

        {finalMatches.length === 0 ? (
          <GlassCard style={{ textAlign: 'center', padding: '2.5rem' }}>
            <p style={{ color: 'var(--text-3)', fontSize: '1.05rem' }}>
              ยังไม่มีแมตช์การแข่งขันในขณะนี้ ติดตามการประกบคู่เร็วๆ นี้
            </p>
          </GlassCard>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {finalMatches.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                teams={finalTeams}
                sport={finalSports.find(
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
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy size={22} style={{ color: 'var(--accent-text)' }} /> อันดับคะแนน
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>
            ร่วมลุ้นว่าสีไหนจะได้ครองอันดับเท่าไหร่ในงาน Sci Games 2026
          </p>
        </div>
        <StandingsPodium isMystery={true} />
      </section>

      {/* 5. Quick Links */}
      <QuickLinks />
    </div>
  );
}
