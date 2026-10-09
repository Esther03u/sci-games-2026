'use client';
import { useState } from 'react';
import { OFFICIAL_DOCUMENTS } from '@/data/documents';
import DocumentPreviewModal from './DocumentPreviewModal';
import GlassCard from '@/components/ui/GlassCard';
import {
  Download,
  Eye,
  ExternalLink,
  FileText,
  Calendar,
  CheckCircle2,
  Sparkles,
} from '@/components/animate-ui/icons';

export default function HandbookHub() {
  const [previewDoc, setPreviewDoc] = useState(null);

  return (
    <div className="hb">
      {/* Page Header */}
      <div className="page-header text-center" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div className="hb-badge">
          <Sparkles size={16} />
          <span>เอกสารทางการ Sci Games 2026 (8 – 11 ตุลาคม 2569)</span>
        </div>
        <h1 className="page-title" style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          สูจิบัตรและกำหนดการแข่งขัน
        </h1>
        <p className="page-subtitle" style={{ maxWidth: '720px', margin: '0 auto', color: 'var(--text-2)' }}>
          สูจิบัตรฉบับสมบูรณ์ กติกาการแข่งขัน 5 ชนิดกีฬา เกณฑ์คะแนนสะสมสีชิงถ้วยเจ้าสนาม
          และกำหนดการพิธีการอย่างเป็นทางการของคณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต
        </p>
      </div>

      {/* Documents Download & Preview Grid */}
      <div className="hb-grid">
        {OFFICIAL_DOCUMENTS.map((doc) => (
          <GlassCard
            key={doc.id}
            className="no-hover"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '2rem',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              borderRadius: '20px',
              boxShadow: 'var(--glass-shadow)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top accent glow line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background:
                  doc.id === 'handbook-2026'
                    ? 'linear-gradient(90deg, #ef4444, #f97316)'
                    : 'linear-gradient(90deg, #0284c7, #38bdf8)',
              }}
            />

            <div>
              {/* Category & Badge Header */}
              <div className="hb-card-head">
                <div className="hb-card-id">
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background:
                        doc.id === 'handbook-2026' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(2, 132, 199, 0.12)',
                      color: doc.id === 'handbook-2026' ? '#ef4444' : '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {doc.id === 'handbook-2026' ? <FileText size={24} /> : <Calendar size={24} />}
                  </div>
                  <div>
                    <span className="hb-kicker">{doc.category}</span>
                    <div className="hb-kicker-sub">{doc.badge}</div>
                  </div>
                </div>

                <span className="hb-tag">
                  {doc.format} • {doc.fileSize}
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="hb-title">{doc.title}</h2>
              <div className="hb-subtitle">{doc.titleEn}</div>

              <p className="hb-desc">{doc.description}</p>

              {/* Key Highlights list */}
              <div className="hb-toc">
                <div className="hb-toc-title">เนื้อหาสำคัญภายในฉบับนี้:</div>
                <ul className="hb-toc-list">
                  {doc.highlights.map((item, idx) => (
                    <li key={idx} className="hb-toc-item">
                      <CheckCircle2
                        size={15}
                        style={{
                          color: doc.id === 'handbook-2026' ? '#ef4444' : '#0284c7',
                          marginTop: '2px',
                          flexShrink: 0,
                        }}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              <div className="hb-actions">
                <a
                  href={doc.downloadUrl}
                  download={doc.fileName}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <Download size={18} />
                  <span>ดาวน์โหลด PDF</span>
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.1rem',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Eye size={18} />
                  <span>เปิดอ่านตัวอย่าง</span>
                </button>

                <a
                  href={doc.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{
                    padding: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="เปิดดูในแท็บใหม่"
                  aria-label={`เปิดดู ${doc.title} ในแท็บใหม่`}
                >
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        doc={previewDoc}
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
