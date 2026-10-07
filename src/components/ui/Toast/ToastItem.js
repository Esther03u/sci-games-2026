'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, X, Info } from '@/components/animate-ui/icons';

const ICON_MAP = {
  success: CheckCircle2,
  error: AlertTriangle,
  warn: AlertTriangle,
  info: Info,
};

export default function ToastItem({ toast: item, onDismiss, index, isHovered }) {
  const { id, type, title, message, duration, action } = item;
  const Icon = ICON_MAP[type] || Info;

  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(duration);
  const startRef = useRef(0);

  // Countdown timer
  useEffect(() => {
    if (paused || isHovered) return undefined;

    const timer = setTimeout(() => {
      onDismiss(id);
    }, remainingRef.current);

    startRef.current = Date.now();

    return () => {
      clearTimeout(timer);
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startRef.current));
    };
  }, [id, duration, paused, isHovered, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -24, scale: 0.94 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{ opacity: 0, scale: 0.9, y: -16, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', damping: 30, stiffness: 420 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.4}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 400) {
          onDismiss(id);
        }
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`sg-toast-card is-${type}`}
      role="alert"
    >
      <div className={`sg-toast-icon is-${type}`}>
        <Icon size={18} />
      </div>

      <div className="sg-toast-content">
        {title && <div className="sg-toast-title">{title}</div>}
        <div className="sg-toast-message">{message}</div>
        {action && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              action.onClick?.();
              onDismiss(id);
            }}
            style={{ marginTop: '0.45rem', padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        className="sg-toast-close"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(id);
        }}
        aria-label="ปิดการแจ้งเตือน"
      >
        <X size={14} />
      </button>

      {/* Progress countdown bar */}
      <div className="sg-toast-progress">
        <motion.div
          className={`sg-toast-progress-bar is-${type}`}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: paused || isHovered ? undefined : 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}
