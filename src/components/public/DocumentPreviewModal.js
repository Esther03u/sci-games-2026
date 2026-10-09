'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

  const isHandbook = doc?.id === 'handbook-2026';

  // Construct URLs
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const isOnline = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
  const absolutePdfUrl = doc ? `${origin}${doc.downloadUrl}` : '';
  const googleViewerUrl = doc
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(absolutePdfUrl)}&embedded=true`
    : '';

  // Use Google Docs viewer when online or when toggled, fallback to direct PDF
  const iframeSrc =
    isOnline || useGoogleViewer ? googleViewerUrl : `${doc?.downloadUrl}#toolbar=1&navpanes=0`;

  return (
    <AnimatePresence>
      {isOpen && doc && (
        <motion.div
          ref={overlayRef}
          onClick={(e) => {
            if (e.target === overlayRef.current) onClose();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="dp-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-modal-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
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
            <div className="dp-head">
              <div className="dp-head-left">
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
                <div className="dp-head-info">
                  <div id="preview-modal-title" className="dp-title">
                    {doc.title}
                  </div>
                  <div className="dp-meta">
                    {doc.badge} • {doc.fileSize}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="dp-actions">
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
            <div className="dp-frame-wrap">
              <iframe src={iframeSrc} title={`พรีวิว ${doc.title}`} className="dp-frame" />
            </div>

            {/* Bottom Helper Bar */}
            <div className="dp-foot">
              <span>💡 หากอุปกรณ์ไม่แสดงตัวอย่างเอกสาร สามารถกดเปิดอ่านเต็มจอหรือดาวน์โหลดได้โดยตรง</span>
              <div className="dp-foot-right">
                {!isOnline && (
                  <button
                    type="button"
                    onClick={() => setUseGoogleViewer(!useGoogleViewer)}
                    className="dp-link-btn"
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
