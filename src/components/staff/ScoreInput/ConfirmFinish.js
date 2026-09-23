'use client';
import GlassCard from '@/components/ui/GlassCard';
import TeamBadge from '@/components/ui/TeamBadge';
import Banner from '@/components/ui/Banner';
import { BadgeCheck, Check, AlertTriangle, Pin } from '@/components/animate-ui/icons';
import { drawWarning, projectedSets, winnerText } from './scoring';

/** Step 3 — review the projected result, confirm, then show the success card. */
export default function ConfirmFinish({
  match,
  sport,
  teamA,
  teamB,
  isAdmin,
  editWindowMinutes,
  saving,
  error,
  successResult,
  onBack,
  onConfirm,
  onDone,
}) {
  const isSetSport = sport?.scoring_type === 'sets';

  if (successResult) {
    return (
      <div style={{ maxWidth: '440px', margin: '0 auto' }}>
        <GlassCard style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <BadgeCheck size={56} style={{ color: 'var(--success-text)' }} animateOnHover />
          </div>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--success-text)', marginBottom: '0.5rem' }}>
            บันทึกผลการแข่งขันเรียบร้อย!
          </h3>
          <p style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {successResult.teamAName} {isSetSport ? successResult.setsA : successResult.scoreA} -{' '}
            {isSetSport ? successResult.setsB : successResult.scoreB} {successResult.teamBName}
          </p>
          <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
            ระบบได้อัปเดตตารางคะแนนรวมและส่งผลสู่หน้าเว็บหลักแบบ Realtime แล้ว
          </p>
          {!isAdmin && (
            <p style={{ color: 'var(--gold-700)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              กดผิด? แก้ได้ภายใน {editWindowMinutes} นาที จากหัวข้อ &quot;เพิ่งจบ — ยังแก้ได้&quot;
            </p>
          )}
          <button onClick={onDone} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
            กลับไปเลือกแมตช์อื่น
          </button>
        </GlassCard>
      </div>
    );
  }

  const proj = projectedSets(match);
  const showA = isSetSport ? proj.a : match.score_a;
  const showB = isSetSport ? proj.b : match.score_b;
  const openSet = isSetSport && (match.score_a ?? 0) !== (match.score_b ?? 0);
  const undecided = isSetSport && sport?.sets_to_win && Math.max(proj.a, proj.b) < sport.sets_to_win;
  const drawNote = drawWarning(match, sport);

  return (
    <div style={{ maxWidth: '440px', margin: '0 auto' }}>
      <GlassCard style={{ padding: '2rem 1.75rem' }}>
        <h3
          style={{
            fontSize: '1.3rem',
            color: 'var(--gold-600)',
            textAlign: 'center',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertTriangle size={20} /> ยืนยันผลการแข่งขันขั้นสุดท้าย
        </h3>

        <Banner kind="error">{error}</Banner>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-2)' }}>กีฬา: {sport?.name}</div>
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
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-heading)',
                  marginTop: '0.25rem',
                }}
              >
                {showA}
              </div>
            </div>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 700 }}>VS</span>
            <div style={{ textAlign: 'center' }}>
              <TeamBadge name={teamB?.name} colorHex={teamB?.color_hex} emoji={teamB?.logo_emoji} size="md" />
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-heading)',
                  marginTop: '0.25rem',
                }}
              >
                {showB}
              </div>
            </div>
          </div>
          {openSet && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
              เซตที่ {match.current_set} ({match.score_a}-{match.score_b}) จะถูกปิดให้อัตโนมัติเมื่อยืนยัน
            </div>
          )}
          {drawNote && (
            <div
              style={{
                marginTop: '0.75rem',
                fontSize: '0.88rem',
                color: 'var(--danger-text)',
                fontWeight: 600,
              }}
            >
              ⚠ คะแนนเท่ากัน — {drawNote}
            </div>
          )}
          {undecided && (
            <div
              style={{
                marginTop: '0.75rem',
                fontSize: '0.88rem',
                color: 'var(--danger-text)',
                fontWeight: 600,
              }}
            >
              ⚠ ยังไม่มีทีมชนะครบ {sport.sets_to_win} เซต — ถ้ายืนยันตอนนี้ผลจะถูกบันทึกตามนี้
            </div>
          )}
        </div>

        <div
          style={{
            background: 'var(--surface-2)',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            color: 'var(--text-2)',
            marginBottom: '1.5rem',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
          }}
        >
          <Pin size={16} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--gold-600)' }} />
          <div>
            <strong>ผลการคิดแต้ม:</strong>
            {winnerText(match, sport, teamA, teamB)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onBack} className="btn btn-secondary" disabled={saving} style={{ flex: 1 }}>
            ย้อนกลับ
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="btn btn-primary"
            style={{
              flex: 2,
              background: '#22c55e',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            {saving ? (
              'กำลังบันทึก...'
            ) : (
              <>
                <Check size={16} /> ยืนยันผลการแข่ง
              </>
            )}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
