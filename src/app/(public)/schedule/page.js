import ScheduleGrid from '@/components/public/ScheduleGrid';
import { loadPublicPage } from '@/lib/queries/page';
import { getMatches, getSports, getTeams, rows } from '@/lib/queries/core';
import { Calendar } from '@/components/animate-ui/icons';
import { OFFICIAL_MATCHES, OFFICIAL_SPORTS, OFFICIAL_TEAMS } from '@/data/handbook';

export const metadata = {
  title: 'ตารางการแข่งขัน',
  description: 'ตารางเวลาและสถานที่แข่งขันกีฬา 5 ชนิด 44 แมตช์ ในงาน Sci Games 2026 ตามสูจิบัตรทางการ',
};

// ISR: cached and regenerated every 30 s; admin writes call revalidatePath()
// so edits show up right away. Only /live needs per-request rendering.
export const revalidate = 30;

export default async function SchedulePage() {
  const { matches, sports, teams } = await loadPublicPage(
    '/schedule',
    async (sb) => {
      const [t, s, m] = await Promise.all([getTeams(sb), getSports(sb), getMatches(sb)]);
      return { teams: rows(t), sports: rows(s), matches: rows(m) };
    },
    { matches: [], sports: [], teams: [] }
  );

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
          <Calendar size={32} style={{ color: 'var(--accent)' }} /> ตารางการแข่งขัน
        </h1>
        <p className="page-subtitle">
          ตารางเวลาและสถานที่แข่งขันครบทุก 5 ชนิดกีฬา รวม 44 แมตช์ ระหว่างวันที่ 9 - 11 ตุลาคม 2569
        </p>
      </div>

      <ScheduleGrid matches={finalMatches} sports={finalSports} teams={finalTeams} />
    </div>
  );
}
