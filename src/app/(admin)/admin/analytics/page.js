import AnalyticsCharts from '@/components/admin/AnalyticsCharts';
import { loadPage } from '@/lib/queries/page';
import { loadAnalytics } from '@/lib/queries/analytics';
import { summarizePageViews } from '@/lib/analytics-summary';

export const metadata = {
  title: 'สถิติการเข้าชมเว็บ - Admin',
  description: 'แดชบอร์ดสถิติผู้เข้าชมเว็บไซต์ Sci Games 2026',
};

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const { summary } = await loadPage('/admin/analytics', loadAnalytics, {
    summary: summarizePageViews([]),
  });

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">สถิติการเข้าชมเว็บไซต์</h1>
        <p className="page-subtitle">
          รายงานสถิติยอดการเปิดดูหน้า จำนวนผู้เข้าชม และสัดส่วนการเข้าชมผ่านอุปกรณ์ต่างๆ —
          นับเฉพาะหน้าที่ผู้ชมเปิด (ไม่รวมหน้าแอดมินและกรรมการ) แบ่งวันตามเวลาประเทศไทย ·
          รีเฟรชหรือกลับมาหน้าเดิมภายใน 30 นาทีในแท็บเดียวกันนับครั้งเดียว (ตั้งแต่ 10 ต.ค. 2569)
        </p>
      </div>

      <AnalyticsCharts summary={summary} />
    </div>
  );
}
