'use client';
import { useMemo } from 'react';
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

export default function AnalyticsCharts({ pageViews = [] }) {
  // Aggregate stats
  const { totalViews, uniqueVisitors, lineData, barData, doughnutData } = useMemo(() => {
    const totalViews = pageViews.length;
    const uniqueHashes = new Set(pageViews.map((p) => p.visitor_hash));
    const uniqueVisitors = uniqueHashes.size;

    // Group by Date for Line Chart (last 7 days)
    const dateCounts = {};
    pageViews.forEach((p) => {
      const date = p.created_at ? p.created_at.split('T')[0] : 'Today';
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    const sortedDates = Object.keys(dateCounts).sort();
    const lineLabels = sortedDates.length ? sortedDates : ['วันที่ 1', 'วันที่ 2', 'วันนี้'];
    const lineValues = sortedDates.length ? sortedDates.map((d) => dateCounts[d]) : [12, 19, 25];

    // Group by Page Path for Bar Chart
    const pageCounts = {};
    pageViews.forEach((p) => {
      const path = p.page_path || '/';
      pageCounts[path] = (pageCounts[path] || 0) + 1;
    });

    const sortedPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const barLabels = sortedPages.length ? sortedPages.map((p) => p[0]) : ['/ (หน้าแรก)', '/schedule', '/results', '/standings', '/register'];
    const barValues = sortedPages.length ? sortedPages.map((p) => p[1]) : [45, 30, 22, 18, 14];

    // Group by Device Type for Doughnut
    const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
    pageViews.forEach((p) => {
      const dev = p.device_type || 'desktop';
      if (deviceCounts[dev] !== undefined) deviceCounts[dev]++;
      else deviceCounts.desktop++;
    });

    return {
      totalViews,
      uniqueVisitors,
      lineData: {
        labels: lineLabels,
        datasets: [
          {
            label: 'จำนวนการเปิดดูหน้า (Page Views)',
            data: lineValues,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            tension: 0.35,
            fill: true,
          },
        ],
      },
      barData: {
        labels: barLabels,
        datasets: [
          {
            label: 'จำนวนการเข้าชม',
            data: barValues,
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
            data: [
              deviceCounts.mobile || 1,
              deviceCounts.desktop || 1,
              deviceCounts.tablet || 0,
            ],
            backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b'],
            borderColor: 'rgba(24, 24, 27, 0.8)',
            borderWidth: 2,
          },
        ],
      },
    };
  }, [pageViews]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: 'var(--mono-800)', font: { family: 'Kanit' } },
      },
    },
    scales: {
      x: {
        ticks: { color: 'var(--mono-600)' },
        grid: { color: 'var(--mono-100)' },
      },
      y: {
        ticks: { color: 'var(--mono-600)' },
        grid: { color: 'var(--mono-100)' },
      },
    },
  };

  return (
    <div>
      {/* 1. Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <GlassCard style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--mono-700)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            ยอดเปิดดูหน้าทั้งหมด (Page Views)
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--gold-600)' }}>
            {totalViews} ครั้ง
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--mono-700)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            ผู้เข้าชมเว็บไซต์ (Unique Visitors)
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800, color: '#16a34a' }}>
            {uniqueVisitors} คน
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--mono-700)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            สัดส่วนการเข้าชมผ่านมือถือ
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800, color: '#60a5fa' }}>
            {totalViews > 0
              ? Math.round(
                  ((pageViews.filter((p) => p.device_type === 'mobile').length || 0) / totalViews) * 100
                )
              : 0}%
          </div>
        </GlassCard>
      </div>

      {/* 2. Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '2rem',
        }}
      >
        {/* Visitors over time */}
        <GlassCard style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--mono-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ChartLine size={18} style={{ color: '#38bdf8' }} /> แนวโน้มการเข้าชมเว็บไซต์ตามช่วงเวลา
          </h3>
          <div style={{ height: '260px' }}>
            <Line data={lineData} options={chartOptions} />
          </div>
        </GlassCard>

        {/* Top pages */}
        <GlassCard style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--mono-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} style={{ color: '#a78bfa' }} /> หน้าเว็บยอดนิยม (Top Pages)
          </h3>
          <div style={{ height: '260px' }}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </GlassCard>

        {/* Device breakdown */}
        <GlassCard style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--mono-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} style={{ color: 'var(--gold-600)' }} /> สัดส่วนอุปกรณ์ของผู้เข้าชม (Device Types)
          </h3>
          <div style={{ height: '260px' }}>
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: 'var(--mono-800)', font: { family: 'Kanit' } },
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
