'use client';
import { useEffect, useRef } from 'react';
import { X, Download, ExternalLink, FileText } from '@/components/animate-ui/icons';

export default function DocumentPreviewModal({ doc, isOpen, onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (!isOpen || !doc) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '1000px',
          height: '90vh',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: 'var(--glass-shadow-lg)',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                flexShrink: 0,
              }}
            >
              <FileText size={18} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div
                id="preview-modal-title"
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {doc.title}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                {doc.badge} • {doc.fileSize}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <a
              href={doc.downloadUrl}
              download={doc.fileName}
              className="btn btn-primary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                padding: '0.45rem 0.85rem',
              }}
            >
              <Download size={15} />
              <span>ดาวน์โหลด</span>
            </a>

            <a
              href={doc.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                textDecoration: 'none',
                fontSize: '0.85rem',
                padding: '0.45rem 0.75rem',
              }}
              title="เปิดในแท็บใหม่"
            >
              <ExternalLink size={15} />
              <span className="hide-mobile">เปิดแท็บใหม่</span>
            </a>

            <button
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{
                padding: '0.45rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
              aria-label="ปิดหน้าต่างตัวอย่าง"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PDF Preview Frame */}
        <div
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            position: 'relative',
            background: '#2b2b2b',
            overflow: 'hidden',
          }}
        >
          <iframe
            src={`${doc.downloadUrl}#toolbar=1&navpanes=0`}
            title={`พรีวิว ${doc.title}`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#ffffff',
            }}
          />
        </div>

        {/* Fallback Banner for Mobile & Embedded Limitation */}
        <div
          style={{
            padding: '0.6rem 1rem',
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: 'var(--text-2)',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>💡 หากอุปกรณ์ของคุณไม่แสดงเอกสารในกรอบด้านบน สามารถกดเปิดอ่านเต็มจอหรือดาวน์โหลดได้โดยตรง</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <a
              href={doc.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-text)', textDecoration: 'underline', fontWeight: 600 }}
            >
              เปิดเต็มจอ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
