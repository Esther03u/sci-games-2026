'use client';
import SlideCommit from '@/components/ui/SlideCommit';
import { fmtClock } from '@/lib/format';

/** Sticky bar: undo, finish set, walkover, the set-rule hint, slide-to-finish and sync status. */
export default function ActionBar({
  match,
  live,
  isSetSport,
  controls,
  canScore,
  saving,
  pending,
  lastSync,
  realtimeStatus,
  undoQueued,
  onUndo,
  onFinishSet,
  onFinish,
  onOpenWalkover,
}) {
  return (
    <div className="score-actions">
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <button
          onClick={onUndo}
          disabled={saving || !canScore || undoQueued}
          className="btn btn-secondary"
          style={{ flex: 1, minHeight: 46, fontSize: '0.9rem' }}
          aria-live="polite"
        >
          {undoQueued ? '↶ รอส่งคะแนนแล้วจะยกเลิก…' : '↶ ยกเลิกล่าสุด'}
        </button>
        {isSetSport && controls.finishSet && (
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
            onClick={onOpenWalkover}
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
      {live && controls.hint && (
        <div
          role="note"
          style={{
            padding: '0.75rem 0.9rem',
            borderRadius: '14px',
            background: 'var(--accent-surface)',
            border: '1px solid var(--accent-border)',
            color: 'var(--text-2)',
            fontSize: '0.82rem',
            lineHeight: 1.45,
            textAlign: 'center',
          }}
        >
          {controls.hint}
        </div>
      )}
      {live && controls.finishMatch && (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <SlideCommit
            width="100%"
            height={52}
            radius={26}
            label="เลื่อนเพื่อจบการแข่งขัน"
            doneLabel="จบการแข่งขัน"
            errorLabel="ไม่สามารถจบการแข่งขันได้"
            trackColor="#09090b"
            handleColor="#ffffff"
            successColor="#22c55e"
            dangerColor="#ef4444"
            disabled={pending > 0}
            onConfirm={() => {
              return new Promise((resolve) => {
                setTimeout(() => {
                  resolve();
                  setTimeout(onFinish, 350);
                }, 250);
              });
            }}
          />
        </div>
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
  );
}
