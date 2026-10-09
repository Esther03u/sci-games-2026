'use client';

import { useState } from 'react';
import MatchCard from '@/components/ui/MatchCard';
import { OFFICIAL_TEAMS, OFFICIAL_SPORTS } from '@/data/handbook';
import '@/styles/public.css';
import '@/styles/match-card.css';

const GRID = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(330px, 100%), 1fr))',
  gap: '1rem',
};

export default function DemoLivePage() {
  const teams = OFFICIAL_TEAMS;
  const futsalSport = OFFICIAL_SPORTS.find((s) => s.id === 'sport-futsal') || {
    id: 'sport-futsal',
    name: 'ฟุตซอล',
    icon: '⚽',
  };
  const volleyballSport = OFFICIAL_SPORTS.find((s) => s.id === 'sport-volleyball') || {
    id: 'sport-volleyball',
    name: 'วอลเลย์บอล',
    icon: '🏐',
  };
  const takrawSport = OFFICIAL_SPORTS.find((s) => s.id === 'sport-takraw') || {
    id: 'sport-takraw',
    name: 'เซปักตะกร้อ',
    icon: '🎯',
  };

  // Match 1: Futsal (Live)
  const [futsalMatch, setFutsalMatch] = useState({
    id: 'demo-futsal-1',
    sport_id: futsalSport.id,
    team_a_id: 'team-purple',
    team_b_id: 'team-green',
    match_date: '2026-10-09',
    match_time: '19:00',
    venue: 'สนามฟุตซอล',
    court: 'สนาม 1',
    status: 'live',
    round: 'ชิงชนะเลิศ',
    category: 'หญิง',
    match_number: 1,
    score_a: 3,
    score_b: 2,
    points_a: 3,
    points_b: 2,
  });

  // Match 2: Volleyball (Sets)
  const [volleyballMatch, setVolleyballMatch] = useState({
    id: 'demo-volley-1',
    sport_id: volleyballSport.id,
    team_a_id: 'team-blue',
    team_b_id: 'team-red',
    match_date: '2026-10-09',
    match_time: '18:00',
    venue: 'ยิมเนเซียม',
    court: 'คอร์ท A',
    status: 'live',
    round: 'รอบแรก',
    category: 'หญิง',
    match_number: 2,
    score_a: 21,
    score_b: 19,
    sets_a: 1,
    sets_b: 1,
    current_set: 3,
    match_sets: [
      { set_number: 1, score_a: 25, score_b: 22 },
      { set_number: 2, score_a: 20, score_b: 25 },
      { set_number: 3, score_a: 21, score_b: 19 },
    ],
  });

  // Match 3: Takraw (Live)
  const [takrawMatch, setTakrawMatch] = useState({
    id: 'demo-takraw-1',
    sport_id: takrawSport.id,
    team_a_id: 'team-green',
    team_b_id: 'team-red',
    match_date: '2026-10-09',
    match_time: '18:30',
    venue: 'สนามตะกร้อ',
    court: 'สนาม 1',
    status: 'live',
    round: 'รอบแรก',
    category: 'ชาย',
    match_number: 3,
    score_a: 14,
    score_b: 11,
    sets_a: 1,
    sets_b: 0,
    current_set: 2,
    match_sets: [
      { set_number: 1, score_a: 15, score_b: 9 },
      { set_number: 2, score_a: 14, score_b: 11 },
    ],
  });

  return (
    <div className="public-content" style={{ maxWidth: '1180px', margin: '0 auto', padding: '2rem 1rem 5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ fontSize: '1.85rem' }}>
          ผลการแข่งขัน (ตัวอย่าง Real-time Grid)
        </h1>
        <p className="page-subtitle" style={{ fontSize: '0.98rem' }}>
          ขนาดการ์ดและเลย์เอาต์จัดเรียงแบบ Responsive Grid (3 คอลัมน์) ตรงกับหน้าผลการแข่งขันจริง 100%
        </p>

        {/* Global Toolbar */}
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setFutsalMatch((m) => ({ ...m, status: m.status === 'live' ? 'upcoming' : 'live' }));
              setVolleyballMatch((m) => ({ ...m, status: m.status === 'live' ? 'upcoming' : 'live' }));
              setTakrawMatch((m) => ({ ...m, status: m.status === 'live' ? 'upcoming' : 'live' }));
            }}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            🔄 สลับสถานะ (LIVE ⟷ Upcoming)
          </button>
        </div>
      </div>

      {/* Section: Live Matches (In exact same grid as /results) */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--danger-text)',
              animation: 'pulse 1.5s infinite',
            }}
          />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--danger-text)' }}>
            กำลังแข่งขัน (IN PROGRESS)
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
            (3 แมตช์ · แสดงคะแนนสดเรียลไทม์)
          </span>
        </div>

        {/* THE EXACT 3-COLUMN GRID */}
        <div style={GRID}>
          {/* Card 1: Futsal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <MatchCard match={futsalMatch} teams={teams} sport={futsalSport} />
            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
              <button
                onClick={() => setFutsalMatch((m) => ({ ...m, score_a: m.score_a + 1 }))}
                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', background: '#8b5cf6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
              >
                +1 ม่วง
              </button>
              <button
                onClick={() => setFutsalMatch((m) => ({ ...m, score_b: m.score_b + 1 }))}
                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
              >
                +1 เขียว
              </button>
              <button
                onClick={() => setFutsalMatch((m) => ({ ...m, score_a: 0, score_b: 0 }))}
                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: 'inherit', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
              >
                รีเซ็ต
              </button>
            </div>
          </div>

          {/* Card 2: Volleyball */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <MatchCard match={volleyballMatch} teams={teams} sport={volleyballSport} />
            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
              <button
                onClick={() =>
                  setVolleyballMatch((m) => {
                    const newScoreA = m.score_a + 1;
                    const sets = [...(m.match_sets || [])];
                    if (sets[2]) sets[2] = { ...sets[2], score_a: newScoreA };
                    return { ...m, score_a: newScoreA, match_sets: sets };
                  })
                }
                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', background: '#0284c7', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
              >
                +1 ฟ้า
              </button>
              <button
                onClick={() =>
                  setVolleyballMatch((m) => {
                    const newScoreB = m.score_b + 1;
                    const sets = [...(m.match_sets || [])];
                    if (sets[2]) sets[2] = { ...sets[2], score_b: newScoreB };
                    return { ...m, score_b: newScoreB, match_sets: sets };
                  })
                }
                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
              >
                +1 แดง
              </button>
              <button
                onClick={() =>
                  setVolleyballMatch((m) => ({
                    ...m,
                    sets_a: m.sets_a === 1 ? 2 : 1,
                    sets_b: 1,
                  }))
                }
                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: 'inherit', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
              >
                สลับเซต
              </button>
            </div>
          </div>

          {/* Card 3: Takraw */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <MatchCard match={takrawMatch} teams={teams} sport={takrawSport} />
            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
              <button
                onClick={() =>
                  setTakrawMatch((m) => {
                    const newScoreA = m.score_a + 1;
                    const sets = [...(m.match_sets || [])];
                    if (sets[1]) sets[1] = { ...sets[1], score_a: newScoreA };
                    return { ...m, score_a: newScoreA, match_sets: sets };
                  })
                }
                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
              >
                +1 เขียว
              </button>
              <button
                onClick={() =>
                  setTakrawMatch((m) => {
                    const newScoreB = m.score_b + 1;
                    const sets = [...(m.match_sets || [])];
                    if (sets[1]) sets[1] = { ...sets[1], score_b: newScoreB };
                    return { ...m, score_b: newScoreB, match_sets: sets };
                  })
                }
                style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
              >
                +1 แดง
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Note */}
      <div
        style={{
          marginTop: '3rem',
          padding: '1.25rem 1.5rem',
          borderRadius: '1rem',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          fontSize: '0.9rem',
          color: 'var(--color-text-muted)',
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
          ℹ️ ข้อมูลขนาดการ์ด:
        </div>
        <p style={{ margin: 0 }}>
          ตัวการ์ดแข่งขันใช้คอมโพเนนต์ <code>MatchCard</code> เดียวกัน 100% กับหน้าผลแข่งจริง (<code>/results</code>) โดยจัดวางใน <code>GRID</code> แบบ 3 คอลัมน์ (ความกว้างการ์ด <code>~330px</code> ต่อใบ)
        </p>
      </div>
    </div>
  );
}
