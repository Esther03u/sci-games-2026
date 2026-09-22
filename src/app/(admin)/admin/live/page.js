import LiveMonitor from '@/components/admin/LiveMonitor';
import { loadPage } from '@/lib/queries/page';
import { loadLiveData, EMPTY_LIVE } from '@/lib/queries/live';
import { Radio } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'Live Monitor - Admin',
  description: 'ติดตามทุกสนามแบบเรียลไทม์และแก้ไขคะแนน',
};

export const dynamic = 'force-dynamic';

export default async function AdminLivePage() {
  const initial = await loadPage('/admin/live', (sb) => loadLiveData(sb, { withEvents: true }), EMPTY_LIVE);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Radio size={26} style={{ color: 'var(--gold-600)' }} /> Live Monitor
        </h1>
        <p className="page-subtitle">
          ทุกสนามในหน้าเดียว — ใครลงคะแนนล่าสุด อัปเดตเมื่อไหร่ และแก้ไขได้ทันที
        </p>
      </div>
      <LiveMonitor initial={initial} />
    </div>
  );
}
