'use client';
import { useEffect, useState } from 'react';
import { QrCode, Copy, Check, ExternalLink, X } from 'lucide-react';
import { generateMcQr } from '@/lib/ceremony-qr';

/** QR + link to the MC's cue sheet (`mcPath` carries the secret key for an admin). */
export default function McQrModal({ mcPath, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  // only rendered after a click, so window is always there
  const url = `${window.location.origin}${mcPath}`;

  useEffect(() => {
    generateMcQr(url)
      .then(setQrDataUrl)
      .catch(() => {});
  }, [url]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mc-qr-modal-title"
      className="cer-qr-overlay"
      onClick={onClose}
    >
      <div className="glass-card cer-qr-card" onClick={(e) => e.stopPropagation()}>
        <div className="cer-qr-head">
          <div className="cer-qr-head-left">
            <div className="cer-qr-icon">
              <QrCode size={20} />
            </div>
            <div>
              <h3 id="mc-qr-modal-title" className="cer-qr-title">
                สแกน QR สคริปต์พิธีกร
              </h3>
              <p className="cer-qr-sub">ไม่ต้องล็อกอิน เปิดได้ทันทีบนมือถือ/แท็บเล็ต</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm cer-qr-close"
            aria-label="ปิดหน้าต่าง"
          >
            <X size={18} />
          </button>
        </div>

        {/* QR Image Frame */}
        <div className="cer-qr-frame">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR Code สำหรับหน้าพิธีกร /mc" className="cer-qr-img" />
          ) : (
            <div className="cer-qr-img cer-qr-loading">กำลังสร้าง QR Code...</div>
          )}
        </div>

        {/* URL Display and Copy Action */}
        <div className="cer-qr-body">
          <div className="cer-qr-url">{url}</div>

          <div className="cer-qr-actions">
            <button type="button" onClick={handleCopyLink} className="btn btn-secondary cer-qr-action">
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</span>
            </button>

            <a
              href={mcPath}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary cer-qr-action"
            >
              <ExternalLink size={16} />
              <span>เปิดดูหน้าสคริปต์</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
