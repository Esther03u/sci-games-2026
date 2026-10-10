'use client';
import React, { useState, useEffect } from 'react';
import CeremonyPrintSheet from '@/components/admin/CeremonyPrintSheet';
import { orderEvents, paginateCeremonyEvents } from '@/lib/ceremony';
import {
  Printer,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Eye,
  Maximize2,
  FileText,
  Layers,
} from 'lucide-react';

const STORAGE_KEY = 'sci_games_ceremony_settings_v1';

export default function CeremonyConsole({
  events = [],
  standings = [],
  sports = [],
  teams = [],
}) {
  const [orderPreset, setOrderPreset] = useState('official');
  const [customKeys, setCustomKeys] = useState(() => events.map((e) => e.key));
  const [filterCompletedOnly, setFilterCompletedOnly] = useState(false);
  const [includeFourthPlace, setIncludeFourthPlace] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [ceremonyTitle, setCeremonyTitle] = useState('พิธีมอบรางวัลและปิดการแข่งขัน Sci Games 2026');
  const [ceremonyDate, setCeremonyDate] = useState('11 ตุลาคม 2569');
  const [awardPresenter, setAwardPresenter] = useState('คณบดีคณะวิทยาศาสตร์และเทคโนโลยี');
  const [mcNotes, setMcNotes] = useState('ขอให้นักกีฬาทุกสีเข้าแถวหน้าโพเดียมอย่างพร้อมเพรียง');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('single'); // 'single' (ทีละหน้า) | 'all' (ทุกหน้า)

  // Load persistence
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.customKeys) setCustomKeys(parsed.customKeys);
          if (parsed.orderPreset) setOrderPreset(parsed.orderPreset);
          if (parsed.includeFourthPlace != null) setIncludeFourthPlace(parsed.includeFourthPlace);
          if (parsed.fontSize) setFontSize(parsed.fontSize);
        }
      }
    } catch {}
  }, []);

  // Save persistence
  const savePreferences = (keys, preset, fourth = includeFourthPlace, size = fontSize) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ customKeys: keys, orderPreset: preset, includeFourthPlace: fourth, fontSize: size })
        );
      }
    } catch {}
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const next = [...customKeys];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setCustomKeys(next);
    setOrderPreset('custom');
    savePreferences(next, 'custom');
  };

  const handleMoveDown = (index) => {
    if (index === customKeys.length - 1) return;
    const next = [...customKeys];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setCustomKeys(next);
    setOrderPreset('custom');
    savePreferences(next, 'custom');
  };

  const handleResetOrder = () => {
    const defaultKeys = events.map((e) => e.key);
    setCustomKeys(defaultKeys);
    setOrderPreset('official');
    savePreferences(defaultKeys, 'official');
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Filter & Order
  let displayEvents = orderEvents(events, orderPreset, customKeys);
  if (filterCompletedOnly) {
    displayEvents = displayEvents.filter((e) => e.done);
  }

  const pages = paginateCeremonyEvents(displayEvents);
  const totalPages = Math.max(1, pages.length);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Keyboard navigation (ArrowLeft: Previous, ArrowRight: Next)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentPage((p) => Math.min(totalPages, p + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPage((p) => Math.max(1, p - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isFullscreen ? '1fr' : 'minmax(320px, 380px) 1fr',
        gap: '1.5rem',
        alignItems: 'start',
      }}
    >
      {/* Left Control Panel */}
      {!isFullscreen ? (
        <div
          className="glass-card no-hover"
          style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <div className="flex-between">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SlidersHorizontal size={18} />
              <span>แผงควบคุมและตั้งค่า</span>
            </h3>
            <button
              onClick={handleResetOrder}
              className="btn btn-secondary btn-sm"
              title="คืนค่าเริ่มต้น"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
            >
              <RotateCcw size={14} /> รีเซ็ต
            </button>
          </div>

          {/* Action Trigger */}
          <button
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.75rem' }}
          >
            <Printer size={18} />
            <strong>พิมพ์เอกสาร / บันทึก PDF (ทุกหน้า)</strong>
          </button>

          {/* Presets */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.35rem' }}>
              การจัดลำดับการประกาศ:
            </label>
            <select
              value={orderPreset}
              onChange={(e) => {
                setOrderPreset(e.target.value);
                savePreferences(customKeys, e.target.value);
              }}
              className="input-select"
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px' }}
            >
              <option value="official">เรียงตามชนิดกีฬาทางการ (Handbook)</option>
              <option value="chronological">เรียงตามเวลาแข่งจบจริง (Timeline)</option>
              <option value="custom">กำหนดลำดับเอง (Custom Reorder)</option>
            </select>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filterCompletedOnly}
                onChange={(e) => setFilterCompletedOnly(e.target.checked)}
              />
              <span>ซ่อนรายการที่ยังแข่งไม่จบ (Finished Only)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeFourthPlace}
                onChange={(e) => setIncludeFourthPlace(e.target.checked)}
              />
              <span>รวมอันดับ 4 ในคำประกาศ (ค่าเริ่มต้น: โพเดียม 1-3)</span>
            </label>
          </div>

          {/* Font Size Selector */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.35rem' }}>
              ขนาดตัวหนังสือ (สำหรับพิธีกร):
            </label>
            <select
              value={fontSize}
              onChange={(e) => {
                setFontSize(e.target.value);
                savePreferences(customKeys, orderPreset, includeFourthPlace, e.target.value);
              }}
              className="input-select"
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px' }}
            >
              <option value="medium">ปกติ (มาตรฐาน - อ่านง่าย ชัดเจนบนเวที)</option>
              <option value="large">ใหญ่พิเศษ (ตัวโต สำหรับอ่านระยะไกล / เวที)</option>
              <option value="small">กะทัดรัด (ตัวหนังสือพอดี)</option>
            </select>
          </div>

          {/* Reorder List */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.35rem' }}>
              สลับคิวการมอบรางวัล ({displayEvents.length} รายการ):
            </label>
            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {displayEvents.map((e, idx) => (
                <div
                  key={e.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem',
                    background: 'var(--surface-2)',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {idx + 1}. {e.sport_name} {e.category}
                  </span>
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.15rem 0.35rem' }}
                      title="เลื่อนขึ้น"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === displayEvents.length - 1}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.15rem 0.35rem' }}
                      title="เลื่อนลง"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ceremony Inputs */}
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-3)', display: 'block', marginBottom: '0.25rem' }}>
              ชื่องาน / หัวกระดาษ:
            </label>
            <input
              type="text"
              value={ceremonyTitle}
              onChange={(e) => setCeremonyTitle(e.target.value)}
              className="input-text"
              style={{ width: '100%', padding: '0.45rem', fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-3)', display: 'block', marginBottom: '0.25rem' }}>
              ประธานในพิธีมอบรางวัล:
            </label>
            <input
              type="text"
              value={awardPresenter}
              onChange={(e) => setAwardPresenter(e.target.value)}
              className="input-text"
              style={{ width: '100%', padding: '0.45rem', fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-3)', display: 'block', marginBottom: '0.25rem' }}>
              โน้ตเตือนพิธีกร:
            </label>
            <textarea
              value={mcNotes}
              onChange={(e) => setMcNotes(e.target.value)}
              className="input-text"
              rows={2}
              style={{ width: '100%', padding: '0.45rem', fontSize: '0.82rem', resize: 'vertical' }}
            />
          </div>
        </div>
      ) : null}

      {/* Right A4 Preview Viewport */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-2)' }}>
            <Eye size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>ตัวอย่างหน้ากระดาษ A4 เสมือนจริง</span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '999px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              {totalPages} หน้า A4
            </span>
          </div>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Maximize2 size={14} />
            <span>{isFullscreen ? 'กลับสู่โหมดแก้ไข' : 'ขยายเต็มจอ (Stage View)'}</span>
          </button>
        </div>

        {/* Top Page Navigation Bar */}
        <div className="ceremony-nav-bar no-print">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage <= 1 || viewMode === 'all'}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 600,
              opacity: safeCurrentPage <= 1 || viewMode === 'all' ? 0.45 : 1,
              cursor: safeCurrentPage <= 1 || viewMode === 'all' ? 'not-allowed' : 'pointer',
            }}
            title="หน้าก่อนหน้า (ลูกศรซ้าย)"
          >
            <ChevronLeft size={16} />
            <span>หน้าก่อนหน้า</span>
          </button>

          <div className="ceremony-page-pills">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              const isActive = viewMode === 'single' && pageNum === safeCurrentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => {
                    setCurrentPage(pageNum);
                    setViewMode('single');
                  }}
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    padding: '0.35rem 0.85rem',
                    fontWeight: isActive ? 800 : 500,
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                  }}
                >
                  แผ่นที่ {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage >= totalPages || viewMode === 'all'}
            className="btn btn-primary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 700,
              opacity: safeCurrentPage >= totalPages || viewMode === 'all' ? 0.45 : 1,
              cursor: safeCurrentPage >= totalPages || viewMode === 'all' ? 'not-allowed' : 'pointer',
            }}
            title="หน้าถัดไป (ลูกศรขวา)"
          >
            <span>หน้าถัดไป</span>
            <ChevronRight size={16} />
          </button>

          <div style={{ display: 'flex', gap: '0.2rem', background: 'var(--surface-3, #334155)', padding: '2px', borderRadius: '8px' }}>
            <button
              onClick={() => setViewMode('single')}
              className={`btn btn-sm ${viewMode === 'single' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', border: 'none' }}
              title="แสดงทีละหน้า กดเปลี่ยนหน้าได้ทันที ไม่ต้องเลื่อนยาว"
            >
              <FileText size={13} style={{ marginRight: '4px' }} />
              ทีละหน้า
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`btn btn-sm ${viewMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', border: 'none' }}
              title="แสดงทุกหน้าเรียงกัน"
            >
              <Layers size={13} style={{ marginRight: '4px' }} />
              ทุกหน้า
            </button>
          </div>
        </div>

        {/* The Sheets Preview Wrapper */}
        <div className="ceremony-sheet-wrapper">
          <CeremonyPrintSheet
            events={displayEvents}
            standings={standings}
            teams={teams}
            options={{
              ceremonyTitle,
              ceremonyDate,
              awardPresenter,
              mcNotes,
              includeFourthPlace,
              fontSize,
            }}
            activePage={safeCurrentPage}
            viewMode={viewMode}
          />
        </div>

        {/* Bottom Page Navigation (Single-page mode only) */}
        {viewMode === 'single' && totalPages > 1 ? (
          <div className="ceremony-bottom-nav no-print">
            <button
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={safeCurrentPage <= 1}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
            >
              <ChevronLeft size={16} />
              <span>หน้าก่อนหน้า</span>
            </button>

            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-2)' }}>
              แผ่นที่ {safeCurrentPage} จาก {totalPages} (A4)
            </div>

            <button
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={safeCurrentPage >= totalPages}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
            >
              <span>หน้าถัดไป</span>
              <ChevronRight size={16} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
