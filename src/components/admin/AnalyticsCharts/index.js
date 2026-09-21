'use client';
import dynamic from 'next/dynamic';
import GlassCard from '@/components/ui/GlassCard';

// chart.js + react-chartjs-2 วาดบน canvas ฝั่ง client เท่านั้น → ไม่ต้อง SSR
// และแยก chunk ให้หน้า /admin/analytics แสดงหัวข้อก่อนแล้วค่อยโหลดกราฟ
const AnalyticsCharts = dynamic(() => import('./Charts'), {
  ssr: false,
  loading: () => (
    <GlassCard style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-2)' }}>
      กำลังโหลดกราฟ...
    </GlassCard>
  ),
});

export default AnalyticsCharts;
