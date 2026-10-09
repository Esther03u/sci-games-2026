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
    <div
      style={{
        padding: '1.1rem 1.25rem 0.95rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
        borderBottom: '1px solid var(--surface-2)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.92rem',
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: '0.01em',
            lineHeight: 1.3,
          }}
        >
          <span>{sport?.name || 'กีฬา'} • </span>
          <span style={{ whiteSpace: 'nowrap' }}>Sci Games 2026</span>
        </div>
        <div
          style={{
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
          }}
        >
          {isFinal ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                boxShadow: '0 2px 10px rgba(245, 158, 11, 0.45)',
                padding: '0.15rem 0.65rem',
                borderRadius: '999px',
                fontWeight: 900,
                fontSize: '0.74rem',
              }}
            >
              <span>★</span>
              <span>
                {roundText}
                {catText}
              </span>
            </span>
          ) : isThird ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                color: '#ffffff',
                boxShadow: '0 2px 10px rgba(234, 88, 12, 0.45)',
                padding: '0.15rem 0.65rem',
                borderRadius: '999px',
                fontWeight: 900,
                fontSize: '0.74rem',
              }}
            >
              <span>★</span>
              <span>
                {roundText}
                {catText}
              </span>
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.76rem',
                color: 'var(--text-3)',
                fontWeight: 600,
              }}
            >
              {roundText}
              {catText}
            </span>
          )}
          {match.court && (
            <span style={{ fontSize: '0.74rem', color: 'var(--text-3)' }}>• {match.court}</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger-text)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#ef4444',
                animation: 'pulse 1.5s infinite',
              }}
            />
            <span>LIVE</span>
          </span>
        ) : isScheduleView ? (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: 'rgba(250, 204, 21, 0.15)',
              color: 'var(--accent-text)',
              border: '1px solid rgba(250, 204, 21, 0.35)',
              whiteSpace: 'nowrap',
            }}
          >
            {match.match_number ? `คู่ที่ ${match.match_number}` : 'ตารางแข่ง'}
          </span>
        ) : (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              background: 'var(--surface-2)',
              color: 'var(--text-3)',
              border: '1px solid var(--border)',
              whiteSpace: 'nowrap',
            }}
          >
            รอการแข่งขัน
          </span>
        )}

        <motion.button
          onClick={onClose}
          whileTap={{ scale: 0.88 }}
          transition={{ duration: 0.1 }}
          style={{
            background: 'var(--surface-2)',
            border: 'none',
            color: 'var(--text-3)',
            cursor: 'pointer',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            touchAction: 'manipulation',
          }}
          aria-label="ปิดหน้าต่าง"
        >
          <X size={16} />
        </motion.button>
      </div>
    </div>
  );
}
