'use client';
import Modal from '@/components/ui/Modal';

/** Pick which side wins by walkover (the other side did not show up). */
export default function WalkoverModal({ isOpen, onClose, teamA, teamB, saving, onWalkover }) {
  const sides = [
    { side: 'a', winner: teamA, loser: teamB, winnerFallback: 'ทีม A', loserFallback: 'ทีม B' },
    { side: 'b', winner: teamB, loser: teamA, winnerFallback: 'ทีม B', loserFallback: 'ทีม A' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="บันทึกผลชนะบาย (Walkover)">
      <div className="sp-wo-body">
        <p className="sp-wo-text">
          ใช้ในกรณีที่ทีมคู่แข่งไม่มารายงานตัวตามเวลาที่กำหนด หรือไม่ได้ส่งนักกีฬาลงแข่งขัน
          ระบบจะบันทึกผลชนะบาย จบการแข่งขัน และส่งทีมเข้ารอบอัตโนมัติ
        </p>

        <div className="sp-wo-options">
          {sides.map(({ side, winner, loser, winnerFallback, loserFallback }) => (
            <button
              key={side}
              type="button"
              disabled={saving || !winner?.id}
              onClick={() => {
                onClose();
                if (onWalkover) onWalkover(side);
              }}
              className="btn btn-secondary"
              style={{
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderColor: 'rgba(245, 158, 11, 0.4)',
                textAlign: 'left',
              }}
            >
              <div>
                <div className="sp-wo-winner">{winner?.name || winnerFallback} ชนะบาย</div>
                <div className="sp-wo-loser">({loser?.name || loserFallback} สละสิทธิ์/ไม่มาแข่ง)</div>
              </div>
              <span className="sp-wo-pick">เลือก ›</span>
            </button>
          ))}
        </div>

        <div className="sp-wo-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            ยกเลิก
          </button>
        </div>
      </div>
    </Modal>
  );
}
