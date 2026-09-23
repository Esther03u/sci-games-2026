'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Download, ExternalLink, FileText, Calendar } from '@/components/animate-ui/icons';

export default function DocumentPreviewModal({ doc, isOpen, onClose }) {
  const overlayRef = useRef(null);
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);

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

  const isHandbook = doc.id === 'handbook-2026';

  // Construct URLs
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const isOnline = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
  const absolutePdfUrl = `${origin}${doc.downloadUrl}`;
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    absolutePdfUrl
  )}&embedded=true`;

  // Use Google Docs viewer when online or when toggled, fallback to direct PDF
  const iframeSrc = isOnline || useGoogleViewer ? googleViewerUrl : `${doc.downloadUrl}#toolbar=1&navpanes=0`;

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
        background: 'rgba(0, 0, 0, 0.82)',
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
          maxWidth: '960px',
          height: '92vh',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          boxShadow: 'var(--glass-shadow-lg)',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Top Header Bar */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isHandbook ? 'rgba(239, 68, 68, 0.12)' : 'rgba(2, 132, 199, 0.12)',
                color: isHandbook ? '#ef4444' : '#0284c7',
                flexShrink: 0,
              }}
            >
              {isHandbook ? <FileText size={20} /> : <Calendar size={20} />}
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
              <div style={{ fontSize: '0.76rem', color: 'var(--text-3)' }}>
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
              <span>ดาวน์โหลด PDF</span>
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
              title="เปิดอ่านเต็มจอในแท็บใหม่"
            >
              <ExternalLink size={15} />
              <span className="hide-mobile">เปิดเต็มจอ</span>
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

        {/* PDF Frame */}
        <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative', background: '#f8fafc' }}>
          <iframe
            src={iframeSrc}
            title={`พรีวิว ${doc.title}`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#ffffff',
            }}
          />
        </div>

        {/* Bottom Helper Bar */}
        <div
          style={{
            padding: '0.65rem 1.25rem',
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            color: 'var(--text-2)',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>💡 หากอุปกรณ์ไม่แสดงตัวอย่างเอกสาร สามารถกดเปิดอ่านเต็มจอหรือดาวน์โหลดได้โดยตรง</span>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {!isOnline && (
              <button
                type="button"
                onClick={() => setUseGoogleViewer(!useGoogleViewer)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-3)',
                  textDecoration: 'underline',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {useGoogleViewer ? 'สลับเป็น Native Viewer' : 'สลับเป็น Google Viewer'}
              </button>
            )}
            <a
              href={doc.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 600 }}
            >
              เปิดไฟล์เต็มจอ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
