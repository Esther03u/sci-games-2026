'use client';

import { useState } from 'react';
import MatchCard from '@/components/ui/MatchCard';
import { OFFICIAL_TEAMS, OFFICIAL_SPORTS } from '@/data/handbook';
import '@/styles/public.css';
import '@/styles/match-card.css';

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

  // Match 1: Futsal
  const [futsalMatch, setFutsalMatch] = useState({
    id: 'demo-futsal-1',
    sport_id: futsalSport.id,
    team_a_id: 'team-purple',
    team_b_id: 'team-green',
    match_date: '2026-10-09',
    match_time: '19:00',
    venue: 'สนามฟุตซอล มหาวิทยาลัยราชภัฏภูเก็ต',
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
    venue: 'ยิมเนเซียม 1',
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

  // Match 3: Takraw
  const [takrawMatch, setTakrawMatch] = useState({
    id: 'demo-takraw-1',
    sport_id: takrawSport.id,
    team_a_id: 'team-purple',
    team_b_id: 'team-blue',
    match_date: '2026-10-09',
    match_time: '18:30',
    venue: 'สนามเซปักตะกร้อ',
    court: 'สนามกลาง',
    status: 'live',
    round: 'ชิงอันดับ 3',
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
    <div className="public-content" style={{ maxWidth: '1040px', margin: '0 auto', padding: '2rem 1rem 5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontWeight: 700,
            fontSize: '0.85rem',
            marginBottom: '0.75rem',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#ef4444',
              boxShadow: '0 0 10px #ef4444',
              animation: 'pulse 1.5s infinite',
            }}
          />
          INTERACTIVE LIVE PREVIEW
        </div>
        <h1 className="page-title" style={{ fontSize: '2.2rem', margin: '0 0 0.5rem' }}>
          ตัวอย่างระบบ Live Scores คะแนนสด Real-time
        </h1>
        <p className="page-subtitle" style={{ fontSize: '1rem', color: 'var(--color-text-muted)', maxWidth: '640px', margin: '0 auto' }}>
          จำลองการแสดงผลคะแนนสดแบบเรียลไทม์ ตัวเลขแต้ม และเซ็ตย่อย ทุกการ์ดคลิกเปิดดูรายละเอียดคะแนนสดได้ทันที
        </p>
      </div>

      {/* Simulator Control Toolbar */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1.25rem',
          padding: '1.25rem 1.5rem',
          marginBottom: '2.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.25rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)' }}>
          ทดลองจำลองสถานะและการลงคะแนนสด:
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setFutsalMatch((m) => ({ ...m, status: m.status === 'live' ? 'upcoming' : 'live' }));
              setVolleyballMatch((m) => ({ ...m, status: m.status === 'live' ? 'upcoming' : 'live' }));
              setTakrawMatch((m) => ({ ...m, status: m.status === 'live' ? 'upcoming' : 'live' }));
            }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            🔄 สลับสถานะ (LIVE ⟷ Upcoming)
          </button>
        </div>
      </div>

      {/* Live Match Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {/* Match 1: Futsal */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚽ ฟุตซอล (รอบชิงชนะเลิศ หญิง)
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setFutsalMatch((m) => ({ ...m, score_a: m.score_a + 1 }))}
                style={{ padding: '0.35rem 0.65rem', borderRadius: '0.5rem', background: '#8b5cf6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
              >
                +1 ประตู สีม่วง
              </button>
              <button
                onClick={() => setFutsalMatch((m) => ({ ...m, score_b: m.score_b + 1 }))}
                style={{ padding: '0.35rem 0.65rem', borderRadius: '0.5rem', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
              >
                +1 ประตู สีเขียว
              </button>
              <button
                onClick={() => setFutsalMatch((m) => ({ ...m, score_a: 0, score_b: 0 }))}
                style={{ padding: '0.35rem 0.65rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'inherit', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                รีเซ็ตแต้ม
              </button>
            </div>
          </div>
          <MatchCard match={futsalMatch} teams={teams} sport={futsalSport} />
        </div>

        {/* Match 2: Volleyball */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🏐 วอลเลย์บอล (กีฬาประเภทเซ็ต)
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() =>
                  setVolleyballMatch((m) => {
                    const newScoreA = m.score_a + 1;
                    const sets = [...(m.match_sets || [])];
                    if (sets[2]) sets[2] = { ...sets[2], score_a: newScoreA };
                    return { ...m, score_a: newScoreA, match_sets: sets };
                  })
                }
                style={{ padding: '0.35rem 0.65rem', borderRadius: '0.5rem', background: '#0284c7', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
              >
                +1 แต้ม สีฟ้า
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
                style={{ padding: '0.35rem 0.65rem', borderRadius: '0.5rem', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
              >
                +1 แต้ม สีแดง
              </button>
              <button
                onClick={() =>
                  setVolleyballMatch((m) => ({
                    ...m,
                    sets_a: m.sets_a === 1 ? 2 : 1,
                    sets_b: 1,
                  }))
                }
                style={{ padding: '0.35rem 0.65rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'inherit', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                สลับเซตได้
              </button>
            </div>
          </div>
          <MatchCard match={volleyballMatch} teams={teams} sport={volleyballSport} />
        </div>

        {/* Match 3: Sepak Takraw */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🎯 เซปักตะกร้อ (ชิงอันดับ 3 ชาย)
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() =>
                  setTakrawMatch((m) => {
                    const newScoreA = m.score_a + 1;
                    const sets = [...(m.match_sets || [])];
                    if (sets[1]) sets[1] = { ...sets[1], score_a: newScoreA };
                    return { ...m, score_a: newScoreA, match_sets: sets };
                  })
                }
                style={{ padding: '0.35rem 0.65rem', borderRadius: '0.5rem', background: '#8b5cf6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
              >
                +1 แต้ม สีม่วง
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
                style={{ padding: '0.35rem 0.65rem', borderRadius: '0.5rem', background: '#0284c7', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
              >
                +1 แต้ม สีฟ้า
              </button>
            </div>
          </div>
          <MatchCard match={takrawMatch} teams={teams} sport={takrawSport} />
        </div>
      </div>

      {/* Guide Note */}
      <div
        style={{
          marginTop: '3rem',
          padding: '1.5rem',
          borderRadius: '1rem',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          fontSize: '0.9rem',
          color: 'var(--color-text-muted)',
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
          💡 คำแนะนำในการทดสอบดูตัวอย่าง:
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
          <li>
            <strong>คลิกที่การ์ดแข่งขันใดก็ได้</strong> เพื่อทดสอบเปิดดูหน้าต่าง Modal รายละเอียดแมตช์สด (แสดงป้าย LIVE, สกอร์บอร์ดขนาดใหญ่, และแต้มเซ็ตย่อย)
          </li>
          <li>
            <strong>ทดลองกดปุ่มบวกแต้ม (+1)</strong> ด้านบนการ์ด เพื่อดูว่าตัวเลขสกอร์บนการ์ดและใน Modal อัปเดตทันทีแบบเรียลไทม์
          </li>
          <li>
            <strong>ทดสอบกับระบบจริง:</strong> เปิด 2 แท็บพร้อมกัน — แท็บหนึ่งเปิด <code>/admin/matches</code> หรือ <code>/staff/scoring</code> แล้วกดปุ่ม &ldquo;เริ่มแข่ง&rdquo; (Live) และกดแต้ม อีกแท็บเปิด <code>/results</code> หรือ <code>/live</code> จะเห็นคะแนนขยับสดทันทีผ่าน WebSocket ของ Supabase Realtime!
          </li>
        </ul>
      </div>
    </div>
  );
}
