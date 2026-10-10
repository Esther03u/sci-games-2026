'use client';
import { createPortal } from 'react-dom';
import Modal from '@/components/ui/Modal';
import { PLACE_ICON, PLACE_LABEL } from '@/lib/podium-reveal';

/** Where one colour's points come from and how the total is worked out. */
export default function ScoreBreakdown({ team, breakdown, rank, points, eventsDone, eventsTotal, onClose }) {
  if (!team || !breakdown) return null;
  const { rows, medals, raw, maxRaw, total, formula, scaled } = breakdown;
  // portal: an ancestor's transform (podium card, admin layout) would trap position: fixed
  return createPortal(
    <Modal isOpen onClose={onClose} title={`ที่มาของคะแนน · ${team.name}`}>
      <div className="pr-bd">
        <div className="pr-bd-head" style={{ '--team': team.color_hex || '#64748b' }}>
          <span className="pr-bd-dot" />
          <strong>{team.name}</strong>
          {rank != null && <span className="pr-bd-rank">อันดับ {rank}</span>}
          <span className="pr-bd-total">
            {scaled ? total.toFixed(2) : total} <small>คะแนน</small>
          </span>
        </div>

        {rows.length === 0 ? (
          <p className="pr-bd-empty">ยังไม่ได้อันดับในรายการใด</p>
        ) : (
          <table className="pr-bd-table">
            <thead>
              <tr>
                <th>รายการ</th>
                <th>อันดับ</th>
                <th className="num">คะแนน</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td>{r.label}</td>
                  <td>
                    <span className={`pr-place p${r.place}`}>{PLACE_ICON[r.place]}</span>{' '}
                    {PLACE_LABEL[r.place]}
                  </td>
                  <td className="num">{r.points}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>รวมคะแนนดิบ</td>
                <td className="num">
                  {raw} <small>/ {maxRaw}</small>
                </td>
              </tr>
              {formula && (
                <tr className="pr-bd-final">
                  <td colSpan={2}>คะแนนรวม (เต็ม 100) = {formula}</td>
                  <td className="num">{total.toFixed(2)}</td>
                </tr>
              )}
            </tfoot>
          </table>
        )}

        <div className="pr-bd-medals">
          🥇 ×{medals[1]} · 🥈 ×{medals[2]} · 🥉 ×{medals[3]} · อันดับ 4 ×{medals[4]}
        </div>
        <p className="pr-bd-note">
          แต่ละรายการ ที่ 1 = {points[0]} · ที่ 2 = {points[1]} · ที่ 3 = {points[2]} · ที่ 4 = {points[3]}{' '}
          คะแนน
          {scaled ? ` · คะแนนรวม = คะแนนดิบ × 100 ÷ ${maxRaw} (ทศนิยม 2 ตำแหน่ง)` : ''} · ถ้าคะแนนรวมเท่ากัน
          ตัดสินด้วยจำนวนถ้วยชนะเลิศ → รองฯ 1 → รองฯ 2
          {eventsDone < eventsTotal ? ` · นับจาก ${eventsDone}/${eventsTotal} รายการที่แข่งจบแล้ว` : ''}
        </p>
      </div>
    </Modal>,
    document.body
  );
}
