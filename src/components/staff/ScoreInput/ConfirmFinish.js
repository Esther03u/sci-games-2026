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
      <div className="cf-box">
        <GlassCard style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div className="cf-icon">
            <BadgeCheck size={56} style={{ color: 'var(--success-text)' }} animateOnHover />
          </div>
          <h3 className="cf-done-title">
            {successResult.isWalkover ? 'บันทึกผลชนะบายเรียบร้อย!' : 'บันทึกผลการแข่งขันเรียบร้อย!'}
          </h3>
          <p
            style={{
              color: successResult.isWalkover ? 'var(--gold-700)' : 'var(--text)',
              fontSize: '1.15rem',
              fontWeight: 800,
              marginBottom: '0.5rem',
            }}
          >
            {successResult.isWalkover
              ? `★ ${successResult.winnerName} ชนะบาย (${isSetSport ? `${successResult.setsA}-${successResult.setsB}` : `${successResult.scoreA}-${successResult.scoreB}`})`
              : `${successResult.teamAName} ${isSetSport ? successResult.setsA : successResult.scoreA} - ${isSetSport ? successResult.setsB : successResult.scoreB} ${successResult.teamBName}`}
          </p>
          <p className="cf-done-text">
            {successResult.isWalkover
              ? 'ระบบได้ปรับแต้มและส่งทีมเข้ารอบสู่สายการแข่งขันแบบ Realtime เรียบร้อยแล้ว'
              : 'ระบบได้อัปเดตตารางคะแนนรวมและส่งผลสู่หน้าเว็บหลักแบบ Realtime แล้ว'}
          </p>
          {!isAdmin && (
            <p className="cf-done-edit">
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
    <div className="cf-box">
      <GlassCard style={{ padding: '2rem 1.75rem' }}>
        <h3 className="cf-title">
          <AlertTriangle size={20} /> ยืนยันผลการแข่งขันขั้นสุดท้าย
        </h3>

        <Banner kind="error">{error}</Banner>

        <div className="cf-summary">
          <div className="cf-sport">กีฬา: {sport?.name}</div>
          <div className="cf-teams">
            <div className="cf-team">
              <TeamBadge name={teamA?.name} colorHex={teamA?.color_hex} emoji={teamA?.logo_emoji} size="md" />
              <div className="cf-score">{showA}</div>
            </div>
            <span className="cf-vs">VS</span>
            <div className="cf-team">
              <TeamBadge name={teamB?.name} colorHex={teamB?.color_hex} emoji={teamB?.logo_emoji} size="md" />
              <div className="cf-score">{showB}</div>
            </div>
          </div>
          {openSet && (
            <div className="cf-set-note">
              เซตที่ {match.current_set} ({match.score_a}-{match.score_b}) จะถูกปิดให้อัตโนมัติเมื่อยืนยัน
            </div>
          )}
          {drawNote && <div className="cf-warn">⚠ คะแนนเท่ากัน — {drawNote}</div>}
          {undecided && (
            <div className="cf-warn">
              ⚠ ยังไม่มีทีมชนะครบ {sport.sets_to_win} เซต — ถ้ายืนยันตอนนี้ผลจะถูกบันทึกตามนี้
            </div>
          )}
        </div>

        <div className="cf-note">
          <Pin size={16} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--gold-600)' }} />
          <div>
            <strong>ผลการคิดแต้ม:</strong>
            {winnerText(match, sport, teamA, teamB)}
          </div>
        </div>

        <div className="cf-actions">
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
