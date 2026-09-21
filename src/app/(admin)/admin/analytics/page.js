import AnalyticsCharts from '@/components/admin/AnalyticsCharts';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ChartLine } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'สถิติการเข้าชมเว็บ - Admin',
  description: 'แดชบอร์ดสถิติผู้เข้าชมเว็บไซต์ Sci Games 2026',
};

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  let pageViews = [];

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('page_views')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (data) pageViews = data;
  } catch (err) {
    console.error('Error fetching analytics data:', err);
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ChartLine size={28} style={{ color: 'var(--gold-600)' }} /> สถิติการเข้าชมเว็บไซต์
        </h1>
        <p className="page-subtitle">
          รายงานสถิติยอดการเปิดดูหน้า จำนวนผู้เข้าชม และสัดส่วนการเข้าชมผ่านอุปกรณ์ต่างๆ
        </p>
      </div>

      <AnalyticsCharts pageViews={pageViews} />
    </div>
  );
}
