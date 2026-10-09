'use client';
import { useMemo } from 'react';
import { useTheme } from '@/hooks/useTheme';
import GlassCard from '@/components/ui/GlassCard';
import { ChartLine, Activity, Sparkles } from '@/components/animate-ui/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// `summary` comes from summarizePageViews() on the server (lib/analytics-summary):
// every spectator page view, admin / staff pages excluded, days in Thai time.
const shortDate = (iso) => {
  const [, m, d] = iso.split('-');
  return `${Number(d)}/${Number(m)}`;
};

export default function AnalyticsCharts({ summary }) {
  const { totalViews, uniqueVisitors, mobileShare, daily, topPages, devices } = summary;
  const empty = totalViews === 0;

  const { lineData, barData, doughnutData } = useMemo(
    () => ({
      lineData: {
        labels: daily.map((d) => shortDate(d.date)),
        datasets: [
          {
            label: 'จำนวนการเปิดดูหน้า (Page Views)',
            data: daily.map((d) => d.count),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            tension: 0.35,
            fill: true,
          },
        ],
      },
      barData: {
        labels: topPages.map((p) => p.path),
        datasets: [
          {
            label: 'จำนวนการเข้าชม',
            data: topPages.map((p) => p.count),
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      doughnutData: {
        labels: ['Mobile (มือถือ)', 'Desktop (คอมพิวเตอร์)', 'Tablet (แท็บเล็ต)'],
        datasets: [
          {
            data: [devices.mobile, devices.desktop, devices.tablet],
            backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b'],
            borderColor: 'rgba(24, 24, 27, 0.8)',
            borderWidth: 2,
          },
        ],
      },
    }),
    [daily, topPages, devices]
  );

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const chartOptions = useMemo(() => {
    const textColor = isDark ? '#e4e4e7' : '#27272a';
    const mutedColor = isDark ? '#a1a1aa' : '#71717a';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: textColor, font: { family: 'Kanit' } },
        },
      },
      scales: {
        x: {
          ticks: { color: mutedColor },
          grid: { color: gridColor },
        },
        y: {
          ticks: { color: mutedColor },
          grid: { color: gridColor },
        },
      },
    };
  }, [isDark]);

  return (
    <div>
      {/* 1. Stat cards */}
      <div className="ac-stats">
        <GlassCard style={{ padding: '1.5rem' }}>
          <div className="ac-stat-label">ยอดเปิดดูหน้าทั้งหมด (Page Views)</div>
          <div className="ac-stat-views">{totalViews.toLocaleString('th-TH')} ครั้ง</div>
        </GlassCard>

        <GlassCard style={{ padding: '1.5rem' }}>
          <div className="ac-stat-label">ผู้เข้าชมเว็บไซต์ (Unique Visitors)</div>
          <div className="ac-stat-visitors">{uniqueVisitors.toLocaleString('th-TH')} คน</div>
        </GlassCard>

        <GlassCard style={{ padding: '1.5rem' }}>
          <div className="ac-stat-label">สัดส่วนการเข้าชมผ่านมือถือ</div>
          <div className="ac-stat-mobile">{mobileShare}%</div>
        </GlassCard>
      </div>

      {empty && (
        <GlassCard
          style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-2)', marginBottom: '2rem' }}
        >
          ยังไม่มีข้อมูลการเข้าชมจากผู้ชม
        </GlassCard>
      )}

      {/* 2. Charts Grid */}
      <div className="ac-charts">
        {/* Visitors over time */}
        <GlassCard style={{ padding: '1.5rem' }}>
          <h3 className="ac-chart-title">
            <ChartLine size={18} style={{ color: '#38bdf8' }} /> แนวโน้มการเข้าชมเว็บไซต์ตามช่วงเวลา
          </h3>
          <div className="ac-chart-box">
            <Line data={lineData} options={chartOptions} />
          </div>
        </GlassCard>

        {/* Top pages */}
        <GlassCard style={{ padding: '1.5rem' }}>
          <h3 className="ac-chart-title">
            <Activity size={18} style={{ color: '#a78bfa' }} /> หน้าเว็บยอดนิยม (Top Pages)
          </h3>
          <div className="ac-chart-box">
            <Bar data={barData} options={chartOptions} />
          </div>
        </GlassCard>

        {/* Device breakdown */}
        <GlassCard style={{ padding: '1.5rem' }}>
          <h3 className="ac-chart-title">
            <Sparkles size={18} style={{ color: 'var(--gold-600)' }} /> สัดส่วนอุปกรณ์ของผู้เข้าชม (Device
            Types)
          </h3>
          <div className="ac-chart-box">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: isDark ? '#e4e4e7' : '#27272a', font: { family: 'Kanit' } },
                  },
                },
              }}
            />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
