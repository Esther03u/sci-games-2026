'use client';
import { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import TeamBadge from '@/components/ui/TeamBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Clock, Zap, Flag, BadgeCheck, Check, AlertTriangle, Pin } from '@/components/animate-ui/icons';

export default function ScoreInput({ matches = [], sports = [], teams = [] }) {
  // Step 1: select match, Step 2: enter score, Step 3: confirm
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [matchStatus, setMatchStatus] = useState('upcoming');
  const [saving, setSaving] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const { adminUser } = useAuth();

  const handleSelectMatch = (m) => {
    setSelectedMatch(m);
    setScoreA(m.score_a ?? 0);
    setScoreB(m.score_b ?? 0);
    setMatchStatus(m.status);
    setCurrentStep(2);
  };

  const handleStartMatch = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('matches')
        .update({ status: 'live', updated_by: adminUser?.id || null })
        .eq('id', selectedMatch.id)
        .select('*')
        .single();

      if (!error && data) {
        setMatchStatus('live');
        setSelectedMatch(data);
      } else {
        alert('เกิดข้อผิดพลาด: ' + error?.message);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLiveScore = async (newA, newB) => {
    setScoreA(newA);
    setScoreB(newB);
    try {
      const supabase = createClient();
      await supabase
        .from('matches')
        .update({
          score_a: newA,
          score_b: newB,
          updated_by: adminUser?.id || null,
        })
        .eq('id', selectedMatch.id);
    } catch (err) {
      console.error('Realtime score sync error:', err);
    }
  };

  const handleFinalConfirm = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('matches')
        .update({
          score_a: scoreA,
          score_b: scoreB,
          status: 'finished',
          updated_by: adminUser?.id || null,
        })
        .eq('id', selectedMatch.id)
        .select('*')
        .single();

      if (!error && data) {
        setSuccessResult({
          sportName: sports.find((s) => s.id === selectedMatch.sport_id)?.name,
          teamAName: teams.find((t) => t.id === selectedMatch.team_a_id)?.name,
          teamBName: teams.find((t) => t.id === selectedMatch.team_b_id)?.name,
          scoreA,
          scoreB,
        });
      } else {
        alert('บันทึกผลไม่สำเร็จ: ' + error?.message);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSaving(false);
    }
  };

  // Render Step 1: Select Match
  if (currentStep === 1) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>
            เลือกคู่การแข่งขันที่จะลงคะแนน
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)' }}>
            แสดงแมตช์ที่กำลังแข่งและแมตช์ที่กำลังจะมาถึง
          </p>
        </div>

        {matches.length === 0 ? (
          <GlassCard style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.6)' }}>
            ยังไม่มีแมตช์การแข่งขันที่เปิดให้บันทึกคะแนนในขณะนี้
          </GlassCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {matches.map((m) => {
              const sport = sports.find((s) => s.id === m.sport_id);
              const teamA = teams.find((t) => t.id === m.team_a_id);
              const teamB = teams.find((t) => t.id === m.team_b_id);

              return (
                <div
                  key={m.id}
                  onClick={() => handleSelectMatch(m)}
                  className="glass-card"
                  style={{
                    padding: '1rem 1.25rem',
                    cursor: 'pointer',
                    border: m.status === 'live' ? '1px solid #4ade80' : '1px solid rgba(255,255,255,0.15)',
                    background: m.status === 'live' ? 'rgba(34, 197, 94, 0.1)' : 'var(--glass-bg)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 600, color: '#fbbf24', fontSize: '0.9rem' }}>
                      {sport?.name}
                    </span>
                    <StatusBadge status={m.status} />
                  </div>

                  <div className="flex-between" style={{ padding: '0.5rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TeamBadge name={teamA?.name} colorHex={teamA?.color_hex} emoji={teamA?.logo_emoji} size="md" />
                    </div>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                      {m.score_a ?? 0} - {m.score_b ?? 0}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TeamBadge name={teamB?.name} colorHex={teamB?.color_hex} emoji={teamB?.logo_emoji} size="md" />
                    </div>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={12} /> {m.venue}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {m.match_time?.slice(0, 5)} น.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Render Step 2: Live Scoring Controls
  if (currentStep === 2) {
    const sport = sports.find((s) => s.id === selectedMatch?.sport_id);
    const teamA = teams.find((t) => t.id === selectedMatch?.team_a_id);
    const teamB = teams.find((t) => t.id === selectedMatch?.team_b_id);

    return (
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        {/* Header navigation */}
        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
          <button
            onClick={() => setCurrentStep(1)}
            className="btn btn-secondary btn-sm"
          >
            เปลี่ยนแมตช์
          </button>
          <span style={{ fontWeight: 700, color: '#fbbf24' }}>
            {sport?.name}
          </span>
          <StatusBadge status={matchStatus} />
        </div>

        {/* Start Match CTA if upcoming */}
        {matchStatus === 'upcoming' && (
          <button
            onClick={handleStartMatch}
            disabled={saving}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '1.5rem', padding: '0.85rem', fontSize: '1.1rem', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Zap size={18} /> เริ่มการแข่งขัน (Start Live)
          </button>
        )}

        {/* Big Dual-Team Scoring Pad */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Team A Pad */}
          <GlassCard
            style={{
              padding: '1.25rem',
              textAlign: 'center',
              border: `2px solid ${teamA?.color_hex || '#ef4444'}66`,
              background: `${teamA?.color_hex || '#ef4444'}15`,
            }}
          >
            <div style={{ marginBottom: '0.5rem' }}>
              <TeamBadge name={teamA?.name} colorHex={teamA?.color_hex} emoji={teamA?.logo_emoji} size="md" />
            </div>

            <div
              style={{
                fontSize: '4.5rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1.1,
                margin: '0.5rem 0',
              }}
            >
              {scoreA}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => handleUpdateLiveScore(scoreA + 1, scoreB)}
                className="btn btn-primary"
                style={{ fontSize: '1.4rem', fontWeight: 800, padding: '0.5rem' }}
              >
                +1
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <button
                  onClick={() => handleUpdateLiveScore(scoreA + 2, scoreB)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  +2
                </button>
                <button
                  onClick={() => handleUpdateLiveScore(Math.max(0, scoreA - 1), scoreB)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#fca5a5' }}
                >
                  -1
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Team B Pad */}
          <GlassCard
            style={{
              padding: '1.25rem',
              textAlign: 'center',
              border: `2px solid ${teamB?.color_hex || '#3b82f6'}66`,
              background: `${teamB?.color_hex || '#3b82f6'}15`,
            }}
          >
            <div style={{ marginBottom: '0.5rem' }}>
              <TeamBadge name={teamB?.name} colorHex={teamB?.color_hex} emoji={teamB?.logo_emoji} size="md" />
            </div>

            <div
              style={{
                fontSize: '4.5rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1.1,
                margin: '0.5rem 0',
              }}
            >
              {scoreB}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => handleUpdateLiveScore(scoreA, scoreB + 1)}
                className="btn btn-primary"
                style={{ fontSize: '1.4rem', fontWeight: 800, padding: '0.5rem' }}
              >
                +1
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <button
                  onClick={() => handleUpdateLiveScore(scoreA, scoreB + 2)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  +2
                </button>
                <button
                  onClick={() => handleUpdateLiveScore(scoreA, Math.max(0, scoreB - 1))}
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#fca5a5' }}
                >
                  -1
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Finish Match Button */}
        <button
          onClick={() => setCurrentStep(3)}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.85rem', fontSize: '1.05rem', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Flag size={18} /> จบการแข่งขัน (ตรวจสอบและยืนยันผล)
        </button>
      </div>
    );
  }

  // Render Step 3: Confirmation Summary
  if (currentStep === 3) {
    const sport = sports.find((s) => s.id === selectedMatch?.sport_id);
    const teamA = teams.find((t) => t.id === selectedMatch?.team_a_id);
    const teamB = teams.find((t) => t.id === selectedMatch?.team_b_id);

    return (
      <div style={{ maxWidth: '440px', margin: '0 auto' }}>
        {successResult ? (
          <GlassCard style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <BadgeCheck size={56} style={{ color: '#4ade80' }} animateOnHover />
            </div>
            <h3 style={{ fontSize: '1.5rem', color: '#4ade80', marginBottom: '0.5rem' }}>
              บันทึกผลการแข่งขันเรียบร้อย!
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              ระบบได้อัปเดตตารางคะแนนรวมและส่งการแจ้งเตือน Real-time สู่หน้าเว็บหลักแล้ว
            </p>

            <button
              onClick={() => {
                setSuccessResult(null);
                setCurrentStep(1);
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              กลับไปเลือกแมตช์อื่น
            </button>
          </GlassCard>
        ) : (
          <GlassCard style={{ padding: '2rem 1.75rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#fbbf24', textAlign: 'center', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} /> ยืนยันผลการแข่งขันขั้นสุดท้าย
            </h3>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                กีฬา: {sport?.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1.25rem',
                  margin: '1rem 0',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <TeamBadge name={teamA?.name} colorHex={teamA?.color_hex} emoji={teamA?.logo_emoji} size="md" />
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)', marginTop: '0.25rem' }}>
                    {scoreA}
                  </div>
                </div>
                <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>VS</span>
                <div style={{ textAlign: 'center' }}>
                  <TeamBadge name={teamB?.name} colorHex={teamB?.color_hex} emoji={teamB?.logo_emoji} size="md" />
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)', marginTop: '0.25rem' }}>
                    {scoreB}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.06)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.8)',
                marginBottom: '1.5rem',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
              }}
            >
              <Pin size={16} style={{ marginTop: '2px', flexShrink: 0, color: '#fbbf24' }} />
              <div>
                <strong>ผลการคิดแต้ม:</strong>
                {scoreA > scoreB
                  ? ` ทีม${teamA?.name} ชนะ (+${sport?.win_points || 3} แต้ม), ทีม${teamB?.name} แพ้ (+${sport?.lose_points || 0} แต้ม)`
                  : scoreB > scoreA
                  ? ` ทีม${teamB?.name} ชนะ (+${sport?.win_points || 3} แต้ม), ทีม${teamA?.name} แพ้ (+${sport?.lose_points || 0} แต้ม)`
                  : ` ผลเสมอ ทั้งสองทีมได้ทีมละ +${sport?.draw_points || 1} แต้ม`}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setCurrentStep(2)}
                className="btn btn-secondary"
                disabled={saving}
                style={{ flex: 1 }}
              >
                ย้อนกลับ
              </button>
              <button
                onClick={handleFinalConfirm}
                disabled={saving}
                className="btn btn-primary"
                style={{ flex: 2, background: '#22c55e', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                {saving ? 'กำลังบันทึก...' : (
                  <>
                    <Check size={16} /> ยืนยันผลการแข่ง
                  </>
                )}
              </button>
            </div>
          </GlassCard>
        )}
      </div>
    );
  }

  return null;
}
