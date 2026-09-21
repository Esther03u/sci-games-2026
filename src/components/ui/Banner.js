'use client';
import { AlertTriangle, Check, X } from '@/components/animate-ui/icons';

const KINDS = {
  error: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.45)', color: '#b91c1c', role: 'alert', Icon: AlertTriangle },
  warn: { bg: 'rgba(251, 191, 36, 0.14)', border: 'rgba(251, 191, 36, 0.5)', color: 'var(--gold-700)', role: 'status', Icon: AlertTriangle },
  info: { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.45)', color: '#1d4ed8', role: 'status', Icon: null },
  success: { bg: 'rgba(22, 163, 74, 0.10)', border: 'rgba(22, 163, 74, 0.4)', color: '#15803d', role: 'status', Icon: Check },
};

/**
 * Inline message strip used for errors, warnings, sync/offline notices and
 * success confirmations. Renders nothing when `children` is empty so callers
 * can pass state directly: <Banner kind="error">{error}</Banner>
 */
export default function Banner({ kind = 'info', children, onClose, style }) {
  if (!children) return null;
  const k = KINDS[kind] || KINDS.info;
  const Icon = k.Icon;
  return (
    <div
      role={k.role}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: k.bg,
        border: `1px solid ${k.border}`,
        color: k.color,
        padding: '0.65rem 0.9rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '0.85rem',
        fontSize: '0.9rem',
        lineHeight: 1.45,
        ...style,
      }}
    >
      {Icon && <Icon size={16} style={{ flexShrink: 0 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิดข้อความ"
          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 2, display: 'inline-flex' }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
