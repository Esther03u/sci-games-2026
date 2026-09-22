'use client';
import { useLiveScores, useClock } from '@/hooks/useLiveScores';
import SportLiveCard from './SportLiveCard';

export default function LiveBoard({ initial }) {
  const { sports, teams, matches, setsByMatch, bumps, status, polling } = useLiveScores(initial);
  const now = useClock(); // 0 until mounted, then ticks every second

  const liveCount = matches.filter((m) => m.status === 'live').length;

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1
          className="page-title"
          style={{
            fontSize: '1.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <span className="live-dot" style={{ width: 12, height: 12 }} /> ผลสด
        </h1>
        <p className="page-subtitle" style={{ fontSize: '0.95rem' }}>
          {liveCount > 0
            ? `กำลังแข่ง ${liveCount} คู่ · คะแนนอัปเดตทันทีจากสนาม`
            : 'ยังไม่มีคู่ที่กำลังแข่ง · หน้านี้จะอัปเดตเองเมื่อเริ่มแข่ง'}
        </p>
        <ConnectionNote status={status} polling={polling} />
      </div>

      {/* Card order follows sports.sort_order and never changes — spectators
          keep their bearings while scores move. */}
      <div className="live-grid">
        {sports.map((sport) => (
          <SportLiveCard
            key={sport.id}
            sport={sport}
            matches={matches}
            teams={teams}
            setsByMatch={setsByMatch}
            bumps={bumps}
            now={now}
          />
        ))}
      </div>
    </div>
  );
}

export function ConnectionNote({ status, polling }) {
  if (status === 'SUBSCRIBED') return null;
  return (
    <p
      style={{
        fontSize: '0.78rem',
        color: polling ? 'var(--gold-700)' : 'var(--text-muted)',
        marginTop: '0.35rem',
      }}
    >
      {polling ? 'โหมดสำรอง: รีเฟรชทุก 15 วินาที' : 'กำลังเชื่อมต่อ Realtime…'}
    </p>
  );
}
