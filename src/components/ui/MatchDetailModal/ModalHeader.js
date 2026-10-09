'use client';
import { motion } from 'motion/react';
import { X } from '@/components/animate-ui/icons';

/** Sport • Sci Games 2026, round / category pill, court, status chip and the close button. */
export default function ModalHeader({
  match,
  sport,
  isFinal,
  isThird,
  isFinished,
  isLive,
  isScheduleView,
  roundText,
  catText,
  onClose,
}) {
  return (
    <div className="md-head">
      <div className="md-head-info">
        <div className="md-head-title">
          <span>{sport?.name || 'กีฬา'} • </span>
          <span className="md-nowrap">Sci Games 2026</span>
        </div>
        <div className="md-head-tags">
          {isFinal ? (
            <span className="md-pill-final">
              <span>★</span>
              <span>
                {roundText}
                {catText}
              </span>
            </span>
          ) : isThird ? (
            <span className="md-pill-third">
              <span>★</span>
              <span>
                {roundText}
                {catText}
              </span>
            </span>
          ) : (
            <span className="md-round">
              {roundText}
              {catText}
            </span>
          )}
          {match.court && <span className="md-court">• {match.court}</span>}
        </div>
      </div>

      <div className="md-head-actions">
        {isFinished ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: match.is_walkover ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.12)',
              color: match.is_walkover ? 'var(--accent-text)' : 'var(--success-text)',
              border: match.is_walkover
                ? '1px solid rgba(245, 158, 11, 0.35)'
                : '1px solid rgba(34, 197, 94, 0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            {match.is_walkover ? '★ ชนะบาย' : 'จบการแข่งขัน'}
          </span>
        ) : isLive ? (
          <span className="md-chip-live">
            <span className="md-live-dot" />
            <span>LIVE</span>
          </span>
        ) : isScheduleView ? (
          <span className="md-chip-schedule">
            {match.match_number ? `คู่ที่ ${match.match_number}` : 'ตารางแข่ง'}
          </span>
        ) : (
          <span className="md-chip-waiting">รอการแข่งขัน</span>
        )}

        <motion.button
          onClick={onClose}
          whileTap={{ scale: 0.88 }}
          transition={{ duration: 0.1 }}
          className="md-close"
          aria-label="ปิดหน้าต่าง"
        >
          <X size={16} />
        </motion.button>
      </div>
    </div>
  );
}
