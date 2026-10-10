'use client';
import { pageItems } from '@/lib/pagination';

/** ‹ 1 … 4 5 6 … 21 › with "แสดง 41–60 จาก 406"; hidden when everything fits on one page. */
export default function Pagination({ page, totalPages, from, to, total, onChange, label = 'รายการ' }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pgn" aria-label="เลือกหน้า">
      <span className="pgn-info">
        แสดง {from}–{to} จาก {total} {label}
      </span>
      <div className="pgn-buttons">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="หน้าก่อนหน้า"
        >
          ‹ ก่อนหน้า
        </button>
        {pageItems(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="pgn-gap" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'} pgn-num`}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`หน้า ${p}`}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="หน้าถัดไป"
        >
          ถัดไป ›
        </button>
      </div>
    </nav>
  );
}
