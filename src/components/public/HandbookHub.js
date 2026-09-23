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
  MapPin,
  Shield,
  Sparkles,
} from '@/components/animate-ui/icons';

export default function HandbookHub() {
  const [previewDoc, setPreviewDoc] = useState(null);

  const sportsHighlights = [
    { name: 'ฟุตซอล', venue: 'สนามฟุตซอล ม.ราชภัฏภูเก็ต', icon: '⚽' },
    { name: 'วอลเลย์บอล', venue: 'โรงยิมเนเซียม ม.ราชภัฏภูเก็ต', icon: '🏐' },
    { name: 'เซปักตะกร้อ', venue: 'สนามตะกร้อ ม.ราชภัฏภูเก็ต', icon: '🏸' },
    { name: 'บาสเกตบอล', venue: 'สนามบาสเกตบอล ม.ราชภัฏภูเก็ต', icon: '🏀' },
    { name: 'เปตอง', venue: 'สนามเปตอง (สนาม 1–4) ม.ราชภัฏภูเก็ต', icon: '⚪' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div className="page-header text-center" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            background: 'var(--accent-surface)',
            border: '1px solid var(--accent-border)',
            color: 'var(--accent-text)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1rem',
          }}
        >
          <Sparkles size={16} /> เอกสารทางการ Sci Games 2026
        </div>
        <h1 className="page-title" style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          สูจิบัตรและกำหนดการแข่งขัน
        </h1>
        <p className="page-subtitle" style={{ maxWidth: '680px', margin: '0 auto', color: 'var(--text-2)' }}>
          รวบรวมสูจิบัตร ระเบียบกติกา 5 ชนิดกีฬา และกำหนดการพิธีการอย่างเป็นทางการ
          สามารถเปิดอ่านตัวอย่างบนเบราว์เซอร์หรือดาวน์โหลดไฟล์ PDF ต้นฉบับได้ทันที
        </p>
      </div>

      {/* Documents Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.75rem',
          marginBottom: '3rem',
        }}
      >
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background:
                        doc.id === 'handbook-2026'
                          ? 'rgba(239, 68, 68, 0.12)'
                          : 'rgba(2, 132, 199, 0.12)',
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
                    <span
                      style={{
                        fontSize: '0.78rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-3)',
                        fontWeight: 600,
                      }}
                    >
                      {doc.category}
                    </span>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', fontWeight: 500 }}>
                      {doc.badge}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: 'var(--surface-2)',
                    color: 'var(--text-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {doc.format} • {doc.fileSize}
                </span>
              </div>

              {/* Title & Description */}
              <h2
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  marginBottom: '0.35rem',
                  color: 'var(--text)',
                  lineHeight: 1.3,
                }}
              >
                {doc.title}
              </h2>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-3)',
                  marginBottom: '1rem',
                  fontWeight: 500,
                }}
              >
                {doc.titleEn}
              </div>

              <p
                style={{
                  fontSize: '0.92rem',
                  color: 'var(--text-2)',
                  lineHeight: 1.6,
                  marginBottom: '1.25rem',
                }}
              >
                {doc.description}
              </p>

              {/* Key Highlights list */}
              <div
                style={{
                  background: 'var(--surface-2)',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  marginBottom: '1.75rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: '0.65rem',
                  }}
                >
                  เนื้อหาสำคัญภายในฉบับนี้:
                </div>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  {doc.highlights.map((item, idx) => (
                    <li
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        fontSize: '0.83rem',
                        color: 'var(--text-2)',
                        lineHeight: 1.45,
                      }}
                    >
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
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

      {/* Quick Facts Section */}
      <GlassCard
        className="no-hover"
        style={{
          padding: '2rem',
          borderRadius: '20px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Shield size={24} style={{ color: 'var(--accent-text)' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            ข้อมูลสำคัญการแข่งขัน Sci Games 2026
          </h3>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Sports & Venues */}
          <div
            style={{
              background: 'var(--surface-2)',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <MapPin size={16} style={{ color: 'var(--accent-text)' }} />
              <span>5 ชนิดกีฬาและสถานที่แข่งขัน</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {sportsHighlights.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.83rem',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                    {s.icon} {s.name}
                  </span>
                  <span style={{ color: 'var(--text-3)' }}>{s.venue}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dates & Timeline */}
          <div
            style={{
              background: 'var(--surface-2)',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Calendar size={16} style={{ color: 'var(--accent-text)' }} />
              <span>กำหนดวันจัดกิจกรรม</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.83rem' }}>
              <div>
                <strong style={{ color: 'var(--text)' }}>วันศุกร์ 9 ต.ค. 2569:</strong>
                <span style={{ color: 'var(--text-2)' }}> แข่งขันรอบแรก (17.30 - 23.30 น.)</span>
              </div>
              <div>
                <strong style={{ color: 'var(--text)' }}>วันเสาร์ 10 ต.ค. 2569:</strong>
                <span style={{ color: 'var(--text-2)' }}> แข่งขันรอบแรกและชิงอันดับ 3 (10.00 - 17.00 น.)</span>
              </div>
              <div>
                <strong style={{ color: 'var(--text)' }}>วันอาทิตย์ 11 ต.ค. 2569:</strong>
                <span style={{ color: 'var(--text-2)' }}> พิธีเปิด (09.00 น.), ชิงชนะเลิศ, พิธีปิดและมอบรางวัล</span>
              </div>
            </div>
          </div>

          {/* Regulations & Checklist */}
          <div
            style={{
              background: 'var(--surface-2)',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Shield size={16} style={{ color: 'var(--accent-text)' }} />
              <span>ข้อปฏิบัติสำคัญสำหรับนักกีฬา</span>
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: '1.1rem',
                fontSize: '0.82rem',
                color: 'var(--text-2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                lineHeight: 1.45,
              }}
            >
              <li>ต้องแสดงบัตรนักศึกษาหรือบัตรประชาชนต่อเจ้าหน้าที่ก่อนแข่งขันทุกนัด</li>
              <li>ทีมต้องมารายงานตัวก่อนเวลาแข่งขันอย่างน้อย 10 นาที</li>
              <li>สวมใส่ชุดแข่งขันที่มีหมายเลขชัดเจนและตรงกับใบลงทะเบียน</li>
              <li>การประท้วงต้องยื่นระหว่างการแข่งขัน คำตัดสินของกรรมการถือเป็นที่สิ้นสุด</li>
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        doc={previewDoc}
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
