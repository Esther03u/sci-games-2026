'use client';
import { useState } from 'react';
import Banner from '@/components/ui/Banner';
import { Zap } from '@/components/animate-ui/icons';
import { fmtRemaining } from '@/lib/format';
import { setControls } from '@/lib/set-rules';
import PadHeader from './PadHeader';
import Scoreboard from './Scoreboard';
import ActionBar from './ActionBar';
import WalkoverModal from './WalkoverModal';

/** Step 2 — the scoreboard with +1 / −1 pads and the fixed action bar. */
export default function ScorePad({
  match,
  sport,
  teamA,
  teamB,
  now,
  isAdmin,
  deadline,
  editExpired,
  realtimeStatus,
  queue, // { pending, online, lastSync, saving, score }
  offlineBanner,
  error,
  notice,
  onBack,
  onStart,
  onFinishSet,
  onUndo,
  undoQueued = false,
  onFinish,
  onWalkover,
}) {
  const [showWalkoverModal, setShowWalkoverModal] = useState(false);
  const { pending, lastSync, saving, score } = queue;
  const isSetSport = sport?.scoring_type === 'sets';
  const live = match.status === 'live';
  // one end-of-set / end-of-match control at a time (lib/set-rules)
  const controls = setControls(match, sport);
  const canScore = (live || match.status === 'finished') && !editExpired;
  const elapsed =
    live && match.started_at && now ? fmtRemaining(now - new Date(match.started_at).getTime()) : null;
  const finishedSets = (isSetSport ? match.match_sets || [] : []).filter((x) => x.status === 'finished');
  const isBasket = sport?.name === 'บาสเกตบอล';

  return (
    <div className="score-pad-container">
      <PadHeader
        match={match}
        sport={sport}
        live={live}
        elapsed={elapsed}
        pending={pending}
        onBack={onBack}
      />

      {offlineBanner}
      <Banner kind="error">{error}</Banner>
      <Banner kind="info">{notice}</Banner>

      {(match.status === 'upcoming' || match.status === 'postponed') && (
        <div style={{ marginBottom: '0.85rem' }}>
          <button
            onClick={onStart}
            disabled={saving}
            className="btn btn-primary"
            style={{
              width: '100%',
              marginBottom: '0.5rem',
              padding: '1rem',
              fontSize: '1.1rem',
              background: 'linear-gradient(135deg, #22c55e, var(--success-text))',
              boxShadow: '0 10px 24px rgba(34,197,94,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Zap size={20} /> {saving ? 'กำลังเริ่ม...' : 'เริ่มการแข่งขัน'}
          </button>
          <button
            type="button"
            onClick={() => setShowWalkoverModal(true)}
            disabled={saving}
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '0.65rem',
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              color: 'var(--gold-700)',
              borderColor: 'rgba(245, 158, 11, 0.4)',
              background: 'var(--surface)',
              fontWeight: 700,
            }}
          >
            ★ ตัดสินชนะบาย (Walkover)
          </button>
        </div>
      )}

      {match.status === 'finished' && (
        <div
          style={{
            padding: '0.65rem 1rem',
            marginBottom: '0.85rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-md)',
            background: 'var(--sci-yellow-surface)',
            border: '1px solid var(--sci-yellow-border)',
            fontSize: '0.88rem',
          }}
        >
          {isAdmin ? (
            <span style={{ color: 'var(--gold-700)' }}>แมตช์จบแล้ว — ผู้ดูแลระบบแก้ได้ตลอด</span>
          ) : editExpired ? (
            <span style={{ color: 'var(--danger-text)' }}>
              หมดเวลาแก้ไขแล้ว — ติดต่อผู้ดูแลระบบหากคะแนนผิด
            </span>
          ) : (
            <span style={{ color: 'var(--gold-700)' }}>
              แมตช์จบแล้ว — แก้ได้อีก <strong>{fmtRemaining(deadline.getTime() - now)}</strong>
            </span>
          )}
        </div>
      )}

      <Scoreboard
        match={match}
        sport={sport}
        teamA={teamA}
        teamB={teamB}
        live={live}
        isSetSport={isSetSport}
        finishedSets={finishedSets}
        canScore={canScore}
        isBasket={isBasket}
        score={score}
      />

      <ActionBar
        match={match}
        live={live}
        isSetSport={isSetSport}
        controls={controls}
        canScore={canScore}
        saving={saving}
        pending={pending}
        lastSync={lastSync}
        realtimeStatus={realtimeStatus}
        undoQueued={undoQueued}
        onUndo={onUndo}
        onFinishSet={onFinishSet}
        onFinish={onFinish}
        onOpenWalkover={() => setShowWalkoverModal(true)}
      />

      <WalkoverModal
        isOpen={showWalkoverModal}
        onClose={() => setShowWalkoverModal(false)}
        teamA={teamA}
        teamB={teamB}
        saving={saving}
        onWalkover={onWalkover}
      />
    </div>
  );
}
