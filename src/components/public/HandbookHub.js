'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { OFFICIAL_DOCUMENTS } from '@/data/documents';
import {
  OFFICIAL_SPORTS,
  TOURNAMENT_SCORING_CRITERIA,
  WALKOVER_RULES,
  CEREMONY_PROGRAMME,
} from '@/data/handbook';
import DocumentPreviewModal from './DocumentPreviewModal';
import GlassCard from '@/components/ui/GlassCard';
import {
  Download,
  Eye,
  ExternalLink,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Users,
  MapPin,
  Sparkles,
} from '@/components/animate-ui/icons';

export default function HandbookHub() {
  const [previewDoc, setPreviewDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('scoring'); // 'scoring' | 'sports' | 'schedule'
  const [selectedSportId, setSelectedSportId] = useState('sport-futsal');

  const selectedSport = OFFICIAL_SPORTS.find((s) => s.id === selectedSportId) || OFFICIAL_SPORTS[0];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Page Header */}
      <div className="page-header text-center" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1.1rem',
            borderRadius: '9999px',
            background: 'var(--accent-surface)',
            border: '1px solid var(--accent-border)',
            color: 'var(--accent-text)',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1rem',
          }}
        >
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))',
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

      {/* Interactive Tabs Header */}
      <div style={{ marginTop: '3.5rem', marginBottom: '1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.4rem' }}>
            สาระสำคัญจากสูจิบัตรทางการ
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-3)' }}>
            สรุปข้อมูลระเบียบ กติกา และเกณฑ์การตัดสินให้เรียกดูได้อย่างสะดวกรวดเร็ว
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          {[
            { key: 'scoring', label: '🏆 เกณฑ์คะแนนสะสม & ปรับแพ้', sub: 'หน้า 21 - 22' },
            { key: 'sports', label: '📋 ระเบียบและกติกา 5 ชนิดกีฬา', sub: 'หน้า 5 - 20' },
            { key: 'schedule', label: '⏱️ สรุปภาพรวมกำหนดการ 4 วัน', sub: '8 – 11 ต.ค.' },
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '14px',
                  border: active ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                  background: active ? 'var(--accent-surface)' : 'var(--surface)',
                  color: active ? 'var(--accent-text)' : 'var(--text-2)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: active ? '0 4px 14px rgba(239, 68, 68, 0.15)' : 'none',
                }}
              >
                <span>{tab.label}</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: '2px' }}>{tab.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Scoring Criteria & Walkover Rules */}
      <AnimatePresence mode="wait">
        {activeTab === 'scoring' && (
          <motion.div
            key="scoring"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'grid', gap: '1.5rem' }}
          >
            {/* Top Cards: Formula & Points per Rank */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
                gap: '1.5rem',
              }}
            >
              {/* Formula & Rule Card */}
              <GlassCard style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>⚖️</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    เกณฑ์คะแนนสะสมสี (เต็ม 100 คะแนน)
                  </h3>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '1rem' }}>
                  คะแนนสะสมสีใช้ตัดสินถ้วยรางวัลคะแนนรวมสูงสุด (ถ้วยเจ้าสนาม) โดยคิดจากผลการแข่งขันทุกรายการ
                  รายการละ 30 คะแนนเท่ากันทั้งประเภททีมและประเภทคู่ มีทั้งหมด 11 รายการ รวมคะแนนดิบ 330 คะแนน
                </p>

                <div
                  style={{
                    background: 'var(--surface-2)',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 600 }}>
                    สูตรการแปลงเป็นคะแนนเต็ม 100 คะแนน:
                  </div>
                  <div
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: 'var(--accent-text)',
                      marginTop: '0.35rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    {TOURNAMENT_SCORING_CRITERIA.formula}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                    {TOURNAMENT_SCORING_CRITERIA.formulaDescription}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-2)' }}>
                  <CheckCircle2 size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
                  <span>
                    สีที่ลงแข่งขันครบทุกรายการจะได้คะแนนรวม<strong>ไม่น้อยกว่า 50.00 คะแนน</strong> แม้ได้อันดับที่ 4 ทุกรายการ
                  </span>
                </div>
              </GlassCard>

              {/* Points per Placement Card */}
              <GlassCard style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🏅</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    คะแนนที่ได้รับต่อ 1 รายการ
                  </h3>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '1rem' }}>
                  ทุกทีมที่ลงแข่งขันในแต่ละรายการจะได้รับคะแนนตามอันดับจริงที่ทำได้
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                  {TOURNAMENT_SCORING_CRITERIA.placements.map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '12px',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontWeight: 600 }}>{p.rank}</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginTop: '0.2rem' }}>
                        {p.points} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-3)' }}>แต้ม</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
                  * สีที่ไม่ส่งทีมเข้าแข่งขันในรายการใด จะไม่ได้รับคะแนนในรายการนั้น
                </div>
              </GlassCard>
            </div>

            {/* Middle: 11 Events Breakdown & Walkover Table */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
                gap: '1.5rem',
              }}
            >
              {/* Event Breakdown */}
              <GlassCard style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.85rem' }}>
                  11 รายการแข่งขันที่นำมาคิดคะแนน (330 คะแนนดิบ)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {TOURNAMENT_SCORING_CRITERIA.eventBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '10px',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        fontSize: '0.9rem',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{item.sport}</span>
                      <span style={{ color: 'var(--text-2)' }}>
                        {item.events} รายการ • <strong style={{ color: 'var(--accent-text)' }}>{item.rawMax} คะแนนดิบ</strong>
                      </span>
                    </div>
                  ))}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '10px',
                      background: 'var(--accent-surface)',
                      border: '1px solid var(--accent-border)',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      color: 'var(--accent-text)',
                      marginTop: '0.25rem',
                    }}
                  >
                    <span>รวมทั้งหมด</span>
                    <span>11 รายการ • 330 คะแนนดิบ (100 คะแนนเต็ม)</span>
                  </div>
                </div>
              </GlassCard>

              {/* Walkover Rules */}
              <GlassCard style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.4rem' }}>
                  ผลคะแนนกรณีถูกปรับแพ้ (Walkover)
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '0.85rem' }}>
                  กรณีไม่พร้อมลงสนามภายใน 10 นาที, ผู้เล่นไม่ครบ หรือใช้ผู้เล่นผิดคุณสมบัติ
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {WALKOVER_RULES.map((w, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '10px',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        fontSize: '0.88rem',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{w.sport}</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: '#ef4444',
                          background: 'rgba(239, 68, 68, 0.1)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                        }}
                      >
                        {w.score}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                  * หากทั้งสองทีมถูกปรับแพ้ในนัดเดียวกัน ให้บันทึก 0 – 0 และไม่มีทีมใดผ่านเข้ารอบ
                </div>
              </GlassCard>
            </div>

            {/* Tie-breaker and Trophies Info */}
            <GlassCard style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>
                    การตัดสินกรณีคะแนนสะสมเท่ากัน
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                    {TOURNAMENT_SCORING_CRITERIA.tieBreaker}
                  </p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>
                    รางวัลเกียรติยศ
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {TOURNAMENT_SCORING_CRITERIA.trophies.map((tr, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-2)' }}>
                        <span style={{ color: '#eab308' }}>🏆</span>
                        <span>{tr}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Tab 2: Sport by Sport Rules */}
        {activeTab === 'sports' && (
          <motion.div
            key="sports"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {/* Sport Selector Pills */}
            <div
              style={{
                display: 'flex',
                gap: '0.6rem',
                overflowX: 'auto',
                paddingBottom: '0.75rem',
                marginBottom: '1.5rem',
              }}
            >
              {OFFICIAL_SPORTS.map((sport) => {
                const isSelected = sport.id === selectedSportId;
                return (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => setSelectedSportId(sport.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1.1rem',
                      borderRadius: '9999px',
                      border: isSelected ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--accent-surface)' : 'var(--surface)',
                      color: isSelected ? 'var(--accent-text)' : 'var(--text)',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span>{sport.icon}</span>
                    <span>{sport.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Sport Details Card */}
            <GlassCard style={{ padding: '2rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: '1.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span style={{ fontSize: '2.4rem' }}>{selectedSport.icon}</span>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                      ระเบียบการแข่งขันกีฬา{selectedSport.name}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-3)', fontWeight: 500 }}>
                      {selectedSport.nameEn} • Sci Games 2026
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      background: 'var(--surface-2)',
                      fontSize: '0.82rem',
                      color: 'var(--text-2)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <Clock size={14} />
                    <span>{selectedSport.matchDuration}</span>
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      background: 'var(--surface-2)',
                      fontSize: '0.82rem',
                      color: 'var(--text-2)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <Users size={14} />
                    <span>ส่ง {selectedSport.maxPlayers} คน (ลงสนาม {selectedSport.startingPlayers} คน)</span>
                  </span>
                </div>
              </div>

              {/* Venue Info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  fontSize: '0.88rem',
                  color: 'var(--text-2)',
                }}
              >
                <MapPin size={16} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                <span>
                  <strong>สถานที่แข่งขัน:</strong> {selectedSport.venue}
                </span>
              </div>

              {/* Rules List */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.85rem' }}>
                  ข้อกำหนดและกติกาการแข่งขัน:
                </h4>
                <div style={{ display: 'grid', gap: '0.65rem' }}>
                  {selectedSport.rulesSummary.map((rule, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.65rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        fontSize: '0.88rem',
                        color: 'var(--text)',
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: 'var(--accent-surface)',
                          color: 'var(--accent-text)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '1px',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call to View Schedule */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
                  ดูวันและเวลาแข่งของกีฬา{selectedSport.name}ทั้งหมดในตารางการแข่งขัน
                </span>
                <Link
                  href="/schedule"
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontSize: '0.85rem',
                    padding: '0.5rem 1rem',
                  }}
                >
                  <Calendar size={15} />
                  <span>ดูตารางแข่งกีฬา{selectedSport.name}</span>
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Tab 3: 4-Day Schedule Summary */}
        {activeTab === 'schedule' && (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            style={{ display: 'grid', gap: '1.25rem' }}
          >
            {/* Day 1: 8 Oct */}
            <GlassCard style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>⚽</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    วันพฤหัสบดีที่ 8 ตุลาคม 2569 (วันเปิดสนาม)
                  </h3>
                </div>
                <span style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'var(--accent-surface)', color: 'var(--accent-text)', fontWeight: 700 }}>
                  4 แมตช์
                </span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
                • <strong>กีฬาฟุตซอล</strong> ณ สนามฟุตซอล มหาวิทยาลัยราชภัฏภูเก็ต (รอบแรก ชาย-หญิง รวม 4 คู่ เวลา 17:30 – 21:30 น.)
              </p>
            </GlassCard>

            {/* Day 2: 9 Oct */}
            <GlassCard style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🔥</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    วันศุกร์ที่ 9 ตุลาคม 2569 (วันที่สองของการแข่งขัน)
                  </h3>
                </div>
                <span style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'var(--accent-surface)', color: 'var(--accent-text)', fontWeight: 700 }}>
                  28 แมตช์
                </span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                <li>• <strong>กีฬาเปตอง</strong> (12 คู่): สนาม 1 – 4 รอบแรก, ชิงที่ 3 และชิงชนะเลิศ (17:30 – 23:30 น.)</li>
                <li>• <strong>กีฬาเซปักตะกร้อ</strong> (8 คู่): รอบแรก, ชิงที่ 3 และชิงชนะเลิศ (17:30 – 21:30 น.)</li>
                <li>• <strong>กีฬาฟุตซอล</strong> (4 คู่): ชิงอันดับที่ 3 และชิงชนะเลิศ หญิง-ชาย (17:30 – 21:30 น.)</li>
                <li>• <strong>กีฬาวอลเลย์บอล</strong> (2 คู่): รอบแรก ชาย-หญิง (17:30 – 19:30 น.)</li>
                <li>• <strong>กีฬาบาสเกตบอล</strong> (2 คู่): รอบแรก ชาย-หญิง (17:30 – 19:30 น.)</li>
              </ul>
            </GlassCard>

            {/* Day 3: 10 Oct */}
            <GlassCard style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>⚡</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    วันเสาร์ที่ 10 ตุลาคม 2569 (รอบตัดเชือก & ชิงชนะเลิศ)
                  </h3>
                </div>
                <span style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'var(--accent-surface)', color: 'var(--accent-text)', fontWeight: 700 }}>
                  10 แมตช์
                </span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                <li>• <strong>กีฬาวอลเลย์บอล</strong> (4 คู่): รอบแรกที่เหลือ และรอบชิงอันดับที่ 3 (10:00 – 15:00 น.)</li>
                <li>• <strong>กีฬาบาสเกตบอล</strong> (6 คู่): รอบแรกที่เหลือ, ชิงอันดับ 3 และรอบชิงชนะเลิศ ชาย-หญิง (10:00 – 17:00 น.)</li>
              </ul>
            </GlassCard>

            {/* Day 4: 11 Oct */}
            <GlassCard style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🎉</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    วันอาทิตย์ที่ 11 ตุลาคม 2569 (วันพิธีการ & ชิงชนะเลิศส่งท้าย)
                  </h3>
                </div>
                <span style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'var(--accent-surface)', color: 'var(--accent-text)', fontWeight: 700 }}>
                  2 แมตช์ + พิธีการ
                </span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                <li>• 08:00 – 08:45 น. ลงทะเบียนเข้าร่วมกิจกรรม</li>
                <li>• 09:00 – 09:45 น. พิธีเปิด (กล่าวรายงานโดย นายกสโมสรนักศึกษา, กล่าวเปิดโดย คณบดีคณะวิทยาศาสตร์และเทคโนโลยี, เคารพธงชาติ, จุดพลุร่วมกัน)</li>
                <li>• 09:45 – 10:45 น. การแข่งขันวอลเลย์บอลยักษ์ (สโมสรนักศึกษาร่วมกับอาจารย์และนักศึกษา)</li>
                <li>• 10:45 – 11:45 น. วอลเลย์บอลรอบชิงชนะเลิศ ประเภททีมหญิง</li>
                <li>• 13:00 – 14:00 น. วอลเลย์บอลรอบชิงชนะเลิศ ประเภททีมชาย</li>
                <li>• 14:30 – 16:30 น. ประกาศผลการแข่งขัน พิธีมอบรางวัล และพิธีปิดการแข่งขัน</li>
              </ul>
            </GlassCard>

            {/* Link to Full Schedule */}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link
                href="/schedule"
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <Calendar size={18} />
                <span>เปิดดูตารางการแข่งขันครบทุก 44 แมตช์</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        doc={previewDoc}
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
