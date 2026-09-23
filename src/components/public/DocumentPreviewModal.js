'use client';
import { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Calendar,
  BookOpen,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
} from '@/components/animate-ui/icons';
import { HANDBOOK_FULL_CONTENT, SCHEDULE_FULL_CONTENT } from '@/data/documentContent';

export default function DocumentPreviewModal({ doc, isOpen, onClose }) {
  const overlayRef = useRef(null);
  const [activeTab, setActiveTab] = useState('reader'); // 'reader' | 'pdf'
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedDay, setSelectedDay] = useState(0);

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

  // Construct absolute URL for Google Docs Viewer if online
  const isOnline = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
  const absolutePdfUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${doc.downloadUrl}`
      : doc.downloadUrl;
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    absolutePdfUrl
  )}&embedded=true`;

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

        {/* View Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 1.25rem',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('reader')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: activeTab === 'reader' ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                background: activeTab === 'reader' ? 'var(--accent-surface)' : 'transparent',
                color: activeTab === 'reader' ? 'var(--accent-text)' : 'var(--text-2)',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <BookOpen size={16} />
              <span>อ่านเนื้อหาบนเว็บ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: activeTab === 'pdf' ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                background: activeTab === 'pdf' ? 'var(--accent-surface)' : 'transparent',
                color: activeTab === 'pdf' ? 'var(--accent-text)' : 'var(--text-2)',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <FileText size={16} />
              <span>ไฟล์ PDF ต้นฉบับ</span>
            </button>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
            {activeTab === 'reader' ? '✨ โหมดอ่านสะดวกสำหรับทุกอุปกรณ์' : '📄 โหมดแสดงไฟล์ PDF ทางการ'}
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative' }}>
          {activeTab === 'reader' ? (
            /* =======================================================
               TAB 1: WEB READER (Responsive, Instant, 100% Fail-proof)
               ======================================================= */
            <div style={{ padding: '1.25rem 1.5rem', maxWidth: '860px', margin: '0 auto' }}>
              {isHandbook ? (
                /* Handbook Reader */
                <div>
                  {/* Sports Filter Chips */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      overflowX: 'auto',
                      paddingBottom: '0.75rem',
                      marginBottom: '1.25rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedSport('all')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '9999px',
                        border: selectedSport === 'all' ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                        background: selectedSport === 'all' ? 'var(--accent-surface)' : 'var(--surface-2)',
                        color: selectedSport === 'all' ? 'var(--accent-text)' : 'var(--text-2)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ทั้งหมด (กติกา 5 กีฬา)
                    </button>
                    {HANDBOOK_FULL_CONTENT.sportsRules.map((sport) => (
                      <button
                        key={sport.id}
                        type="button"
                        onClick={() => setSelectedSport(sport.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '9999px',
                          border: selectedSport === sport.id ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                          background: selectedSport === sport.id ? 'var(--accent-surface)' : 'var(--surface-2)',
                          color: selectedSport === sport.id ? 'var(--accent-text)' : 'var(--text-2)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {sport.icon} {sport.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSelectedSport('preface')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '9999px',
                        border: selectedSport === 'preface' ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                        background: selectedSport === 'preface' ? 'var(--accent-surface)' : 'var(--surface-2)',
                        color: selectedSport === 'preface' ? 'var(--accent-text)' : 'var(--text-2)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      📖 คำนำสูจิบัตร
                    </button>
                  </div>

                  {/* Preface Section */}
                  {(selectedSport === 'all' || selectedSport === 'preface') && (
                    <div
                      style={{
                        background: 'var(--surface-2)',
                        borderRadius: '14px',
                        padding: '1.25rem',
                        marginBottom: '1.5rem',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem' }}>
                        คำนำสูจิบัตรโครงการ Sci Games 2569
                      </h3>
                      {HANDBOOK_FULL_CONTENT.preface.content.map((p, idx) => (
                        <p key={idx} style={{ fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '0.6rem' }}>
                          {p}
                        </p>
                      ))}
                      <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-3)', fontWeight: 600, marginTop: '0.75rem' }}>
                        — {HANDBOOK_FULL_CONTENT.preface.author}
                      </div>
                    </div>
                  )}

                  {/* Sports Rules List */}
                  {HANDBOOK_FULL_CONTENT.sportsRules
                    .filter((s) => selectedSport === 'all' || selectedSport === s.id)
                    .map((sport) => (
                      <div
                        key={sport.id}
                        style={{
                          background: 'var(--surface)',
                          borderRadius: '16px',
                          padding: '1.5rem',
                          marginBottom: '1.5rem',
                          border: '1px solid var(--border)',
                          boxShadow: 'var(--glass-shadow)',
                        }}
                      >
                        {/* Sport Title & Venue */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                            {sport.icon} ระเบียบการแข่งขัน{sport.name}
                          </h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <MapPin size={14} style={{ color: 'var(--accent-text)' }} /> {sport.venue}
                          </span>
                        </div>

                        {/* Quick Spec Pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                          <span style={{ padding: '0.25rem 0.65rem', borderRadius: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text)' }}>
                            👥 {sport.playerCount}
                          </span>
                          <span style={{ padding: '0.25rem 0.65rem', borderRadius: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text)' }}>
                            ⏱️ {sport.matchDuration}
                          </span>
                          <span style={{ padding: '0.25rem 0.65rem', borderRadius: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text)' }}>
                            🏆 {sport.system}
                          </span>
                        </div>

                        {/* Detailed Rules */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {sport.rules.map((rule, rIdx) => (
                            <div key={rIdx} style={{ background: 'var(--surface-2)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.45rem' }}>
                                {rule.title}
                              </div>
                              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.84rem', color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: '0.35rem', lineHeight: 1.55 }}>
                                {rule.items.map((it, itIdx) => (
                                  <li key={itIdx}>{it}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                /* Schedule Reader */
                <div>
                  {/* Day Tabs */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                    {SCHEDULE_FULL_CONTENT.days.map((day, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDay(idx)}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: '8px',
                          border: selectedDay === idx ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                          background: selectedDay === idx ? 'var(--accent-surface)' : 'var(--surface-2)',
                          color: selectedDay === idx ? 'var(--accent-text)' : 'var(--text)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {day.date.split('ที่ ')[1] || day.date}
                      </button>
                    ))}
                  </div>

                  {/* Selected Day Content */}
                  {SCHEDULE_FULL_CONTENT.days[selectedDay] && (
                    <div>
                      <div style={{ marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>
                          {SCHEDULE_FULL_CONTENT.days[selectedDay].date}
                        </h3>
                        <div style={{ fontSize: '0.84rem', color: 'var(--accent-text)', fontWeight: 600 }}>
                          {SCHEDULE_FULL_CONTENT.days[selectedDay].dayLabel}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {SCHEDULE_FULL_CONTENT.days[selectedDay].events.map((ev, evIdx) => (
                          <div
                            key={evIdx}
                            style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: '14px',
                              padding: '1.25rem',
                              boxShadow: 'var(--glass-shadow)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                                🏅 {ev.sport}
                              </h4>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <MapPin size={13} style={{ color: 'var(--accent-text)' }} /> {ev.venue}
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                              {ev.matches.map((m, mIdx) => (
                                <div
                                  key={mIdx}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.25rem',
                                    background: 'var(--surface-2)',
                                    padding: '0.65rem 0.85rem',
                                    borderRadius: '8px',
                                    fontSize: '0.84rem',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-text)', fontWeight: 700 }}>
                                    <Clock size={14} />
                                    <span>{m.time}</span>
                                  </div>
                                  <div style={{ color: 'var(--text)', lineHeight: 1.45 }}>{m.match}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* =======================================================
               TAB 2: EMBEDDED PDF VIEWER (Google Docs / Native / Fallback)
               ======================================================= */
            <div style={{ width: '100%', height: '100%', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
              {/* Top Banner with Direct Open button */}
              <div
                style={{
                  padding: '0.6rem 1.25rem',
                  background: 'var(--surface-2)',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-2)',
                }}
              >
                <span>💡 หากอุปกรณ์มือถือไม่แสดงตัวอย่างเอกสาร กรุณากดปุ่มเปิดเต็มจอหรืออ่านในแท็บ &quot;อ่านเนื้อหาบนเว็บ&quot;</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a
                    href={doc.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem', textDecoration: 'none' }}
                  >
                    <ExternalLink size={14} /> เปิดไฟล์เต็มจอ
                  </a>
                  <a
                    href={doc.downloadUrl}
                    download={doc.fileName}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem', textDecoration: 'none' }}
                  >
                    <Download size={14} /> ดาวน์โหลด PDF
                  </a>
                </div>
              </div>

              {/* PDF Container */}
              <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative', background: '#f8fafc' }}>
                <iframe
                  src={isOnline ? googleDocsViewerUrl : `${doc.downloadUrl}#toolbar=1&navpanes=0`}
                  title={`พรีวิว ${doc.title}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '480px',
                    border: 'none',
                    background: '#ffffff',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Status Bar */}
        <div
          style={{
            padding: '0.65rem 1.25rem',
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: 'var(--text-3)',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={15} style={{ color: 'var(--status-finished)' }} />
            <span>เอกสารฉบับทางการ คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <a
              href={doc.downloadUrl}
              download={doc.fileName}
              style={{ color: 'var(--accent-text)', textDecoration: 'none', fontWeight: 600 }}
            >
              ดาวน์โหลด ({doc.fileSize})
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
