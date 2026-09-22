'use client';
import { useEffect, useRef } from 'react';
import { X } from '@/components/animate-ui/icons';

export default function Modal({ isOpen, onClose, title, children }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="mobile-bottom-sheet-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="glass-card mobile-bottom-sheet-modal"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#ffffff',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
        }}
      >
        <div className="mobile-sheet-drag-handle hide-desktop" style={{ background: '#cbd5e1' }} />
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text)', fontWeight: 700 }}>{title}</h3>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
