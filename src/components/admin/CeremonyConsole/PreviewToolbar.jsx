'use client';
import { ChevronLeft, ChevronRight, Eye, Maximize2, FileText, Layers } from 'lucide-react';

/** Above the A4 preview: title + page count, stage-view toggle, then pager, page pills and view mode. */
export default function PreviewToolbar({
  totalPages,
  currentPage,
  viewMode,
  onViewMode,
  onPage,
  onPrev,
  onNext,
  isFullscreen,
  onToggleFullscreen,
}) {
  const prevDisabled = currentPage <= 1 || viewMode === 'all';
  const nextDisabled = currentPage >= totalPages || viewMode === 'all';

  return (
    <>
      <div className="cer-preview-head">
        <div className="cer-preview-title">
          <Eye size={18} />
          <span className="cer-preview-title-text">ตัวอย่างหน้ากระดาษ A4 เสมือนจริง</span>
          <span className="cer-pages-badge">{totalPages} หน้า A4</span>
        </div>
        <button onClick={onToggleFullscreen} className="btn btn-secondary btn-sm cer-inline-btn">
          <Maximize2 size={14} />
          <span>{isFullscreen ? 'กลับสู่โหมดแก้ไข' : 'ขยายเต็มจอ (Stage View)'}</span>
        </button>
      </div>

      {/* Top Page Navigation Bar */}
      <div className="ceremony-nav-bar no-print">
        <button
          onClick={onPrev}
          disabled={prevDisabled}
          className="btn btn-secondary btn-sm cer-nav-btn"
          title="หน้าก่อนหน้า (ลูกศรซ้าย)"
        >
          <ChevronLeft size={16} />
          <span>หน้าก่อนหน้า</span>
        </button>

        <div className="ceremony-page-pills">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            const isActive = viewMode === 'single' && pageNum === currentPage;
            return (
              <button
                key={pageNum}
                onClick={() => onPage(pageNum)}
                aria-current={isActive ? 'page' : undefined}
                className={`btn btn-sm cer-page-pill ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              >
                แผ่นที่ {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="btn btn-primary btn-sm cer-nav-btn cer-nav-next"
          title="หน้าถัดไป (ลูกศรขวา)"
        >
          <span>หน้าถัดไป</span>
          <ChevronRight size={16} />
        </button>

        <div className="cer-view-switch">
          <button
            onClick={() => onViewMode('single')}
            className={`btn btn-sm cer-view-btn ${viewMode === 'single' ? 'btn-primary' : 'btn-secondary'}`}
            title="แสดงทีละหน้า กดเปลี่ยนหน้าได้ทันที ไม่ต้องเลื่อนยาว"
          >
            <FileText size={13} className="cer-view-icon" />
            ทีละหน้า
          </button>
          <button
            onClick={() => onViewMode('all')}
            className={`btn btn-sm cer-view-btn ${viewMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            title="แสดงทุกหน้าเรียงกัน"
          >
            <Layers size={13} className="cer-view-icon" />
            ทุกหน้า
          </button>
        </div>
      </div>
    </>
  );
}

/** Under the A4 preview in single-page mode: previous / "sheet x of y" / next. */
export function BottomPager({ currentPage, totalPages, onPrev, onNext }) {
  return (
    <div className="ceremony-bottom-nav no-print">
      <button
        onClick={onPrev}
        disabled={currentPage <= 1}
        className="btn btn-secondary btn-sm cer-bottom-btn"
      >
        <ChevronLeft size={16} />
        <span>หน้าก่อนหน้า</span>
      </button>

      <div className="cer-bottom-count">
        แผ่นที่ {currentPage} จาก {totalPages} (A4)
      </div>

      <button
        onClick={onNext}
        disabled={currentPage >= totalPages}
        className="btn btn-primary btn-sm cer-bottom-btn cer-bottom-next"
      >
        <span>หน้าถัดไป</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
