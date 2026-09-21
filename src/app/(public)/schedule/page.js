import ScheduleGrid from '@/components/public/ScheduleGrid';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Calendar } from '@/components/animate-ui/icons';
import { OFFICIAL_MATCHES, OFFICIAL_SPORTS, OFFICIAL_TEAMS } from '@/lib/tournamentData';

export const metadata = {
  title: 'ตารางการแข่งขัน',
  description: 'ตารางเวลาและสถานที่แข่งขันกีฬา 5 ชนิด 44 แมตช์ ในงาน Sci Games 2026 ตามสูจิบัตรทางการ',
};

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  let matches = [];
  let sports = [];
  let teams = [];

  try {
    const supabase = await createServerSupabaseClient();
    const [teamsRes, sportsRes, matchesRes] = await Promise.all([
      supabase.from('teams').select('*').order('sort_order'),
      supabase.from('sports').select('*').order('sort_order'),
      supabase.from('matches').select('*').order('match_date').order('match_time'),
    ]);

    if (teamsRes?.data?.length) teams = teamsRes.data;
    if (sportsRes?.data?.length) sports = sportsRes.data;
    if (matchesRes?.data?.length) matches = matchesRes.data;
  } catch (err) {
    console.error('Error loading schedule:', err);
  }

  // Fallback to official tournament handbook data if database is empty
  // Fall back to the handbook dataset as a whole: mixing DB sports (uuid ids)
  // with handbook matches ('sport-futsal') leaves every card without a sport.
  const useHandbook = matches.length === 0;
  const finalMatches = useHandbook ? OFFICIAL_MATCHES : matches;
  const finalSports = useHandbook ? OFFICIAL_SPORTS : sports;
  const finalTeams = useHandbook ? OFFICIAL_TEAMS : teams;

  return (
    <div>
      <div className="page-header text-center" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
          <Calendar size={32} style={{ color: '#fbbf24' }} /> ตารางการแข่งขัน
        </h1>
        <p className="page-subtitle">
          ตารางเวลาและสถานที่แข่งขันครบทุก 5 ชนิดกีฬา รวม 44 แมตช์ ระหว่างวันที่ 9 - 11 ตุลาคม 2569
        </p>
      </div>

      <ScheduleGrid matches={finalMatches} sports={finalSports} teams={finalTeams} />
    </div>
  );
}
