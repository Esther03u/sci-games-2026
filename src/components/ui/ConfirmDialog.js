'use client';
import { useCallback, useRef, useState } from 'react';
import Modal from '@/components/ui/Modal';

/**
 * Modal replacement for window.confirm().
 *
 *   const [confirm, confirmDialog] = useConfirm();
 *   ...
 *   if (!(await confirm({ title: 'ลบ PIN?', message: '...', danger: true }))) return;
 *   ...
 *   return <>{...}{confirmDialog}</>;
 */
export function useConfirm() {
  const [state, setState] = useState(null); // { title, message, confirmLabel, cancelLabel, danger }
  const resolverRef = useRef(null);

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState(typeof opts === 'string' ? { message: opts } : opts || {});
    });
  }, []);

  const finish = (value) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setState(null);
  };

  const dialog = (
    <ConfirmDialog
      open={Boolean(state)}
      title={state?.title}
      message={state?.message}
      confirmLabel={state?.confirmLabel}
      cancelLabel={state?.cancelLabel}
      danger={state?.danger}
      onConfirm={() => finish(true)}
      onCancel={() => finish(false)}
    />
  );

  return [confirm, dialog];
}

export default function ConfirmDialog({
  open,
  title = 'ยืนยันการทำรายการ',
  message,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal isOpen={open} onClose={onCancel} title={title}>
      {message && <p style={{ color: 'var(--mono-700)', fontSize: '0.95rem', lineHeight: 1.55, marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>{message}</p>}
      <div style={{ display: 'flex', gap: '0.6rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy} style={{ flex: 1 }}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onConfirm}
          disabled={busy}
          autoFocus
          style={{ flex: 1, background: danger ? '#dc2626' : undefined }}
        >
          {busy ? 'กำลังทำรายการ...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
