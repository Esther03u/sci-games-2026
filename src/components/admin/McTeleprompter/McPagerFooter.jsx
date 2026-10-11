'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Sticky bottom bar with the giant previous / next buttons for the stage. */
export default function McPagerFooter({ currentPage, totalPages, onPrev, onNext }) {
  return (
    <footer className="mc-stage-footer">
      <button
        onClick={onPrev}
        disabled={currentPage <= 1}
        className="btn btn-secondary mc-pager-btn"
        aria-label="ย้อนกลับไปหน้าก่อนหน้า"
      >
        <ChevronLeft size={18} />
        <span>หน้าก่อนหน้า</span>
      </button>

      <div className="mc-pager-info">
        <div className="mc-pager-count">
          แผ่นที่ {currentPage} / {totalPages}
        </div>
        <div className="mc-pager-hint">แตะหรือปัดซ้าย-ขวาเพื่อเปลี่ยนหน้า</div>
      </div>

      <button
        onClick={onNext}
        disabled={currentPage >= totalPages}
        className="btn btn-primary mc-pager-btn mc-pager-next"
        aria-label="ไปยังหน้าถัดไป"
      >
        <span>หน้าถัดไป</span>
        <ChevronRight size={18} />
      </button>
    </footer>
  );
}
