'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import MatchCard from '@/components/ui/MatchCard';
import GlassCard from '@/components/ui/GlassCard';
import { pickFeaturedMatches } from '@/lib/featured-matches';
import { useLiveScores } from '@/hooks/useLiveScores';

export default function FeaturedMatchesLive({
  initialMatches = [],
  initialSports = [],
  initialTeams = [],
}) {
  const live = useLiveScores(
    { matches: initialMatches, sports: initialSports, teams: initialTeams },
    { realtime: true, publicView: true, pollMs: 8000 }
  );

  const sports = live.sports.length > 0 ? live.sports : initialSports;
  const teams = live.teams.length > 0 ? live.teams : initialTeams;

  const matches = useMemo(() => {
    return pickFeaturedMatches(live.matches || initialMatches, sports);
  }, [live.matches, initialMatches, sports]);

  return (
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
              viewerCount={live.viewerCount}
            />
          ))}
        </div>
      )}
    </section>
  );
}
