'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import MatchCard from '@/components/ui/MatchCard';
import GlassCard from '@/components/ui/GlassCard';
import { pickFeaturedMatches } from '@/lib/featured-matches';
import { useLiveScores, SPECTATOR_FEED } from '@/hooks/useLiveScores';

export default function FeaturedMatchesLive({ initialMatches = [], initialSports = [], initialTeams = [] }) {
  const live = useLiveScores(
    { matches: initialMatches, sports: initialSports, teams: initialTeams },
    SPECTATOR_FEED
  );

  const sports = live.sports.length > 0 ? live.sports : initialSports;
  const teams = live.teams.length > 0 ? live.teams : initialTeams;

  const matches = useMemo(() => {
    return pickFeaturedMatches(live.matches || initialMatches, sports);
  }, [live.matches, initialMatches, sports]);

  return (
    <section className="fm">
      <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2 className="fm-title">การแข่งขันที่น่าสนใจ</h2>
          <p className="fm-sub">แมตช์ที่กำลังแข่งขันและโปรแกรมถัดไป</p>
        </div>
        <Link href="/schedule" className="btn btn-secondary btn-sm">
          ดูตารางทั้งหมด
        </Link>
      </div>

      {matches.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: '2.5rem' }}>
          <p className="fm-empty">ยังไม่มีแมตช์การแข่งขันในขณะนี้ ติดตามการประกบคู่เร็วๆ นี้</p>
        </GlassCard>
      ) : (
        <div className="fm-grid">
          {matches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              teams={teams}
              sport={sports.find(
                (s) =>
                  s.id === m.sport_id || (m.sport_id && m.sport_id.toLowerCase().includes(s.id.toLowerCase()))
              )}
              sets={live.setsByMatch[m.id]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
