'use client';
import {
  Printer,
  RotateCcw,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  QrCode,
} from 'lucide-react';

/** Left column of /admin/ceremony: print, MC QR, order, toggles, font size, queue, header texts. */
export default function ControlPanel({
  isRefreshing,
  onRefresh,
  onResetOrder,
  onPrint,
  onShowQr,
  orderPreset,
  onOrderPreset,
  filterCompletedOnly,
  onFilterCompletedOnly,
  includeFourthPlace,
  onIncludeFourthPlace,
  fontSize,
  onFontSize,
  displayEvents,
  onMoveUp,
  onMoveDown,
  ceremonyTitle,
  onCeremonyTitle,
  awardPresenter,
  onAwardPresenter,
  mcNotes,
  onMcNotes,
}) {
  return (
    <div className="glass-card no-hover cer-panel">
      <div className="flex-between">
        <h3 className="cer-panel-title">
          <SlidersHorizontal size={18} />
          <span>แผงควบคุมและตั้งค่า</span>
        </h3>
        <div className="cer-panel-tools">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary btn-sm cer-refresh-btn"
            aria-label="รีเฟรชผลสดทันที"
            title="รีเฟรชผลสดทันที"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={onResetOrder}
            className="btn btn-secondary btn-sm cer-reset-btn"
            title="คืนค่าเริ่มต้น"
          >
            <RotateCcw size={14} /> รีเซ็ต
          </button>
        </div>
      </div>

      {/* Action Triggers */}
      <div className="cer-actions">
        <button onClick={onPrint} className="btn btn-primary cer-print-btn">
          <Printer size={18} />
          <strong>พิมพ์เอกสาร / บันทึก PDF (ทุกหน้า)</strong>
        </button>

        <button type="button" onClick={onShowQr} className="btn btn-secondary cer-qr-btn">
          <QrCode size={18} />
          <span>สแกน QR สำหรับพิธีกร (/mc)</span>
        </button>
      </div>

      {/* Presets */}
      <div>
        <label htmlFor="ceremony-order-preset" className="cer-field-label">
          การจัดลำดับการประกาศ:
        </label>
        <select
          id="ceremony-order-preset"
          value={orderPreset}
          onChange={(e) => onOrderPreset(e.target.value)}
          className="input-select cer-select"
        >
          <option value="official">เรียงตามชนิดกีฬาทางการ (Handbook)</option>
          <option value="chronological">เรียงตามเวลาแข่งจบจริง (Timeline)</option>
          <option value="custom">กำหนดลำดับเอง (Custom Reorder)</option>
        </select>
      </div>

      {/* Toggles */}
      <div className="cer-toggles">
        <label htmlFor="ceremony-filter-completed" className="cer-toggle">
          <input
            id="ceremony-filter-completed"
            type="checkbox"
            checked={filterCompletedOnly}
            onChange={(e) => onFilterCompletedOnly(e.target.checked)}
          />
          <span>ซ่อนรายการที่ยังแข่งไม่จบ (Finished Only)</span>
        </label>
        <label htmlFor="ceremony-include-fourth" className="cer-toggle">
          <input
            id="ceremony-include-fourth"
            type="checkbox"
            checked={includeFourthPlace}
            onChange={(e) => onIncludeFourthPlace(e.target.checked)}
          />
          <span>รวมอันดับ 4 ในคำประกาศ (ค่าเริ่มต้น: โพเดียม 1-3)</span>
        </label>
      </div>

      {/* Font Size Selector */}
      <div>
        <label htmlFor="ceremony-font-size" className="cer-field-label">
          ขนาดตัวหนังสือ (สำหรับพิธีกร):
        </label>
        <select
          id="ceremony-font-size"
          value={fontSize}
          onChange={(e) => onFontSize(e.target.value)}
          className="input-select cer-select"
        >
          <option value="medium">ปกติ (มาตรฐาน - อ่านง่าย ชัดเจนบนเวที)</option>
          <option value="large">ใหญ่พิเศษ (ตัวโต สำหรับอ่านระยะไกล / เวที)</option>
          <option value="small">กะทัดรัด (ตัวหนังสือพอดี)</option>
        </select>
      </div>

      {/* Reorder List */}
      <div>
        <label className="cer-field-label">สลับคิวการมอบรางวัล ({displayEvents.length} รายการ):</label>
        <div className="cer-queue">
          {displayEvents.map((e, idx) => (
            <div key={e.key} className="cer-queue-row">
              <span className="cer-queue-name">
                {idx + 1}. {e.sport_name} {e.category}
              </span>
              <div className="cer-queue-moves">
                <button
                  type="button"
                  onClick={() => onMoveUp(idx)}
                  disabled={idx === 0}
                  className="btn btn-secondary btn-sm cer-move-btn"
                  aria-label={`เลื่อน ${e.sport_name} ${e.category} ขึ้น`}
                  title="เลื่อนขึ้น"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveDown(idx)}
                  disabled={idx === displayEvents.length - 1}
                  className="btn btn-secondary btn-sm cer-move-btn"
                  aria-label={`เลื่อน ${e.sport_name} ${e.category} ลง`}
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
        <label htmlFor="ceremony-title-input" className="cer-input-label">
          ชื่องาน / หัวกระดาษ:
        </label>
        <input
          id="ceremony-title-input"
          type="text"
          value={ceremonyTitle}
          onChange={(e) => onCeremonyTitle(e.target.value)}
          className="input-text cer-input"
        />
      </div>
      <div>
        <label htmlFor="ceremony-presenter-input" className="cer-input-label">
          ประธานในพิธีมอบรางวัล:
        </label>
        <input
          id="ceremony-presenter-input"
          type="text"
          value={awardPresenter}
          onChange={(e) => onAwardPresenter(e.target.value)}
          className="input-text cer-input"
        />
      </div>
      <div>
        <label htmlFor="ceremony-notes-input" className="cer-input-label">
          โน้ตเตือนพิธีกร:
        </label>
        <textarea
          id="ceremony-notes-input"
          value={mcNotes}
          onChange={(e) => onMcNotes(e.target.value)}
          className="input-text cer-input cer-textarea"
          rows={2}
        />
      </div>
    </div>
  );
}
