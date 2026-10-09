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
      <div style={{ padding: '0.5rem 0' }}>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          ใช้ในกรณีที่ทีมคู่แข่งไม่มารายงานตัวตามเวลาที่กำหนด หรือไม่ได้ส่งนักกีฬาลงแข่งขัน
          ระบบจะบันทึกผลชนะบาย จบการแข่งขัน และส่งทีมเข้ารอบอัตโนมัติ
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
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
                <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '0.95rem' }}>
                  {winner?.name || winnerFallback} ชนะบาย
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '2px' }}>
                  ({loser?.name || loserFallback} สละสิทธิ์/ไม่มาแข่ง)
                </div>
              </div>
              <span style={{ color: 'var(--gold-700)', fontWeight: 800 }}>เลือก ›</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            ยกเลิก
          </button>
        </div>
      </div>
    </Modal>
  );
}
