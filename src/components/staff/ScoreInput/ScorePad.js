'use client';
import { useState } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import Banner from '@/components/ui/Banner';
import Modal from '@/components/ui/Modal';
import { Zap, Flag } from '@/components/animate-ui/icons';
import { SportIcon, TeamIcon } from '@/components/ui/SportIcon';
import { fmtRemaining, fmtClock, fmtTime, fmtPlace } from '@/lib/format';
import { roundLabel } from '@/lib/labels';

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
  onFinish,
  onWalkover,
}) {
  const [showWalkoverModal, setShowWalkoverModal] = useState(false);
  const { pending, lastSync, saving, score } = queue;
  const isSetSport = sport?.scoring_type === 'sets';
  const live = match.status === 'live';
  const canScore = (live || match.status === 'finished') && !editExpired;
  const elapsed =
    live && match.started_at && now ? fmtRemaining(now - new Date(match.started_at).getTime()) : null;
  const finishedSets = (isSetSport ? match.match_sets || [] : []).filter((x) => x.status === 'finished');
  const isBasket = sport?.name === 'บาสเกตบอล';

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', paddingBottom: '7.5rem' }}>
      {/* Header card */}
      <div
        className="glass-card"
        style={{
          padding: '0.85rem 1rem',
          marginBottom: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <button
          onClick={onBack}
          className="btn btn-secondary btn-sm"
          disabled={pending > 0}
          style={{ padding: '0.45rem 0.7rem', flexShrink: 0 }}
        >
          ‹ แมตช์
        </button>
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            background: 'var(--sci-yellow-surface)',
            border: '1px solid var(--sci-yellow-border)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold-700)',
            flexShrink: 0,
          }}
        >
          <SportIcon sportId={match.sport_id} sportName={sport?.name} size={20} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontWeight: 800,
              color: 'var(--text)',
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {sport?.name}
            {(match.round || match.category) && (
              <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>
                {' '}
                · {roundLabel(match.round)}
                {match.category && !roundLabel(match.round)?.includes(match.category)
                  ? ` (${match.category})`
                  : ''}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-3)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {fmtPlace(match)} · {fmtTime(match.match_time)} น.
          </div>
        </div>
        {live ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger-text)',
              fontSize: '0.74rem',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            <span className="live-dot" /> {elapsed || 'LIVE'}
          </span>
        ) : (
          <StatusBadge status={match.status} />
        )}
      </div>

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

      {/* Scoreboard */}
      <div
        className="glass-card score-board"
        style={{
          padding: 0,
          overflow: 'hidden',
          border: live ? '1.5px solid rgba(239, 68, 68, 0.35)' : undefined,
        }}
      >
        {isSetSport && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.6rem 1rem',
              background: 'var(--surface-2)',
              borderBottom: '1px solid var(--glass-border)',
              fontSize: '0.85rem',
            }}
          >
            <span style={{ color: 'var(--text-3)' }}>
              เซตที่ <strong style={{ color: 'var(--text)' }}>{match.current_set ?? 1}</strong>
            </span>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                fontSize: '1.15rem',
                color: 'var(--text)',
              }}
            >
              {match.sets_a ?? 0} <span style={{ color: 'var(--text-muted)' }}>–</span> {match.sets_b ?? 0}
            </span>
            <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>
              ชนะ {sport?.sets_to_win} เซต{sport?.points_per_set ? ` · เซตละ ${sport.points_per_set}` : ''}
            </span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'stretch' }}>
          {[
            { key: 'a', team: teamA, value: match.score_a ?? 0, fallback: '#ef4444' },
            { key: 'b', team: teamB, value: match.score_b ?? 0, fallback: '#0284c7' },
          ].map(({ key, team, value, fallback }, idx) => {
            const hex = team?.color_hex || fallback;
            return (
              <div
                key={key}
                style={{
                  gridColumn: idx === 0 ? 1 : 3,
                  gridRow: 1,
                  padding: '1.1rem 0.85rem 1rem',
                  textAlign: 'center',
                  background: `linear-gradient(180deg, ${hex}1f 0%, ${hex}0a 60%, transparent 100%)`,
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 12px 4px 6px',
                    borderRadius: 999,
                    background: 'var(--surface)',
                    border: `1px solid ${hex}55`,
                    boxShadow: `0 2px 8px ${hex}22`,
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: hex,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TeamIcon teamId={team?.id} teamName={team?.name} color="#fff" size={14} />
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)' }}>
                    {team?.name || '—'}
                  </span>
                </div>

                <div
                  key={`${key}-${value}`}
                  className="live-score is-bump"
                  style={{
                    fontSize: '5rem',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 900,
                    color: 'var(--text)',
                    lineHeight: 1,
                    margin: '0.6rem 0 0.75rem',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {value}
                </div>

                <button
                  onClick={() => score(key, 1)}
                  disabled={!canScore}
                  className="score-btn"
                  style={{
                    background: `linear-gradient(145deg, ${hex} 0%, ${hex}cc 100%)`,
                    boxShadow: `0 10px 24px ${hex}55`,
                  }}
                  aria-label={`+1 ${team?.name || ''}`}
                >
                  +1
                </button>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isBasket ? '1fr 1fr 1fr' : '1fr',
                    gap: '0.4rem',
                    marginTop: '0.5rem',
                  }}
                >
                  {isBasket && (
                    <>
                      <button
                        onClick={() => score(key, 2)}
                        disabled={!canScore}
                        className="score-btn score-btn-ghost"
                        style={{ color: hex, borderColor: `${hex}66` }}
                      >
                        +2
                      </button>
                      <button
                        onClick={() => score(key, 3)}
                        disabled={!canScore}
                        className="score-btn score-btn-ghost"
                        style={{ color: hex, borderColor: `${hex}66` }}
                      >
                        +3
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => score(key, -1)}
                    disabled={!canScore || value === 0}
                    className="score-btn score-btn-ghost"
                    aria-label={`-1 ${team?.name || ''}`}
                  >
                    −1
                  </button>
                </div>
              </div>
            );
          })}

          {/* VS divider */}
          <div
            style={{
              gridColumn: 2,
              gridRow: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 0.15rem',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '10%',
                bottom: '10%',
                width: 1,
                background: 'var(--glass-border)',
              }}
            />
            <span
              style={{
                position: 'relative',
                background: 'var(--surface, #fff)',
                border: '1px solid var(--glass-border)',
                borderRadius: 999,
                padding: '3px 8px',
                fontSize: '0.7rem',
                fontWeight: 800,
                color: 'var(--text-muted)',
                letterSpacing: '0.06em',
              }}
            >
              VS
            </span>
          </div>
        </div>

        {finishedSets.length > 0 && (
          <div
            style={{
              padding: '0.5rem 1rem 0.7rem',
              textAlign: 'center',
              fontSize: '0.8rem',
              color: 'var(--text-3)',
              borderTop: '1px solid var(--glass-border)',
            }}
          >
            เซตที่ผ่านมา: {finishedSets.map((x) => `${x.score_a}–${x.score_b}`).join(' | ')}
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="score-actions">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <button
            onClick={onUndo}
            disabled={saving || !canScore || pending > 0}
            className="btn btn-secondary"
            style={{ flex: 1, minHeight: 46, fontSize: '0.9rem' }}
          >
            ↶ ยกเลิกล่าสุด
          </button>
          {isSetSport && (
            <button
              onClick={onFinishSet}
              disabled={saving || !live || pending > 0 || (match.score_a ?? 0) === (match.score_b ?? 0)}
              className="btn btn-secondary"
              style={{
                flex: 1,
                minHeight: 46,
                fontSize: '0.9rem',
                color: 'var(--gold-700)',
                fontWeight: 700,
              }}
            >
              จบเซต {match.current_set ?? 1}
            </button>
          )}
          {live && (
            <button
              type="button"
              onClick={() => setShowWalkoverModal(true)}
              disabled={saving || pending > 0}
              className="btn btn-secondary"
              style={{
                minHeight: 46,
                padding: '0 0.85rem',
                fontSize: '0.88rem',
                color: 'var(--gold-700)',
                fontWeight: 700,
                borderColor: 'rgba(245, 158, 11, 0.4)',
              }}
            >
              ชนะบาย
            </button>
          )}
        </div>
        {live && (
          <button
            onClick={onFinish}
            disabled={pending > 0}
            className="btn btn-primary"
            style={{
              width: '100%',
              minHeight: 52,
              fontSize: '1.02rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Flag size={18} /> จบการแข่งขัน
          </button>
        )}
        <div
          style={{
            fontSize: '0.74rem',
            color: pending > 0 ? 'var(--gold-700)' : 'var(--text-3)',
            textAlign: 'center',
            marginTop: '0.45rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background:
                pending > 0
                  ? 'var(--gold-500)'
                  : realtimeStatus === 'SUBSCRIBED'
                    ? '#22c55e'
                    : 'var(--text-muted)',
            }}
          />
          {pending > 0
            ? `กำลังส่ง ${pending} รายการ...`
            : lastSync
              ? `ซิงค์แล้ว ${fmtClock(lastSync)}`
              : 'พร้อมบันทึกคะแนน'}
          {realtimeStatus !== 'SUBSCRIBED' && pending === 0 && ' · Realtime ยังไม่เชื่อมต่อ'}
        </div>
      </div>

      {/* Walkover Decision Modal */}
      <Modal
        isOpen={showWalkoverModal}
        onClose={() => setShowWalkoverModal(false)}
        title="บันทึกผลชนะบาย (Walkover)"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p
            style={{ fontSize: '0.88rem', color: 'var(--text-2)', marginBottom: '1.25rem', lineHeight: 1.5 }}
          >
            ใช้ในกรณีที่ทีมคู่แข่งไม่มารายงานตัวตามเวลาที่กำหนด หรือไม่ได้ส่งนักกีฬาลงแข่งขัน
            ระบบจะบันทึกผลชนะบาย จบการแข่งขัน และส่งทีมเข้ารอบอัตโนมัติ
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              type="button"
              disabled={saving || !teamA?.id}
              onClick={() => {
                setShowWalkoverModal(false);
                if (onWalkover) onWalkover('a');
              }}
              className="btn btn-secondary"
              style={{
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderColor: 'rgba(245, 158, 11, 0.4)',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '0.95rem' }}>
                  {teamA?.name || 'ทีม A'} ชนะบาย
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '2px' }}>
                  ({teamB?.name || 'ทีม B'} สละสิทธิ์/ไม่มาแข่ง)
                </div>
              </div>
              <span style={{ color: 'var(--gold-700)', fontWeight: 800 }}>เลือก ›</span>
            </button>

            <button
              type="button"
              disabled={saving || !teamB?.id}
              onClick={() => {
                setShowWalkoverModal(false);
                if (onWalkover) onWalkover('b');
              }}
              className="btn btn-secondary"
              style={{
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderColor: 'rgba(245, 158, 11, 0.4)',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '0.95rem' }}>
                  {teamB?.name || 'ทีม B'} ชนะบาย
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '2px' }}>
                  ({teamA?.name || 'ทีม A'} สละสิทธิ์/ไม่มาแข่ง)
                </div>
              </div>
              <span style={{ color: 'var(--gold-700)', fontWeight: 800 }}>เลือก ›</span>
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowWalkoverModal(false)}
              className="btn btn-secondary btn-sm"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
