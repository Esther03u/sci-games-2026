import LiveMonitor from '@/components/admin/LiveMonitor';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadLiveData } from '@/lib/live-data';
import { Radio } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'Live Monitor - Admin',
  description: 'ติดตามทุกสนามแบบเรียลไทม์และแก้ไขคะแนน',
};

export const dynamic = 'force-dynamic';

export default async function AdminLivePage() {
  let initial = { sports: [], teams: [], matches: [], sets: [], events: [] };
  try {
    initial = await loadLiveData(await createServerSupabaseClient());
  } catch (err) {
    console.error('Error loading /admin/live:', err);
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Radio size={26} style={{ color: 'var(--gold-600)' }} /> Live Monitor
        </h1>
        <p className="page-subtitle">ทุกสนามในหน้าเดียว — ใครลงคะแนนล่าสุด อัปเดตเมื่อไหร่ และแก้ไขได้ทันที</p>
      </div>
      <LiveMonitor initial={initial} />
    </div>
  );
}
