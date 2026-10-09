'use client';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';

/** Confirm POST /api/match/[id]/reset — clears the result but keeps the fixture */
export default function ResetModal({ reset, sportById, teamName, loading }) {
  const m = reset.match;
  return (
    <Modal isOpen={!!m} onClose={reset.close} title="🔄 ยืนยันการรีเซ็ตผลการแข่งขัน">
      {m && (
        <div className="me-modal-body">
          <div className="me-reset-box">
            <div className="me-reset-title">
              {sportById.get(m.sport_id)?.name}
              {m.category ? ` · ${m.category}` : ''}
              {m.round ? ` · รอบ ${m.round}` : ''}
            </div>
            <div className="me-reset-teams">
              {teamName(m.team_a_id, 'รอผลการแข่งขัน')} vs {teamName(m.team_b_id, 'รอผลการแข่งขัน')}
            </div>
          </div>

          <ul className="me-reset-list">
            <li>
              ล้างคะแนน, รายการเซต, และสถานะกลับเป็น <strong>&quot;ยังไม่แข่ง (Upcoming)&quot;</strong>
            </li>
            <li>ล้างเวลาแข่งจริง และประวัติแต้มสดทั้งหมด</li>
            <li>
              <strong>คู่แข่งขัน วัน เวลา และสถานที่ จะยังคงอยู่ครบเหมือนเดิม 100%</strong> (แมตช์ไม่หาย)
            </li>
            {(m.next_match_id || m.loser_next_match_id) && (
              <li className="me-reset-li-accent">
                ดึงชื่อทีมในรอบชิงชนะเลิศ / รอบชิงอันดับ 3 กลับมาเป็น &quot;รอผลการแข่งขัน&quot; ให้อัตโนมัติ
              </li>
            )}
          </ul>

          <FormField label="หมายเหตุ / เหตุผล (ไม่บังคับ)">
            <input
              type="text"
              className="form-input"
              value={reset.reason}
              onChange={(e) => reset.setReason(e.target.value)}
              placeholder='เช่น "ทดสอบระบบ", "กรรมการกดผิด", "ประท้วงผล"'
            />
          </FormField>

          <div className="me-reset-actions">
            <button
              type="button"
              onClick={reset.close}
              className="btn btn-secondary btn-sm"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={reset.confirm}
              className="btn btn-primary btn-sm"
              disabled={loading}
              style={{
                background: 'var(--gold-600)',
                borderColor: 'var(--gold-600)',
                color: '#000',
                fontWeight: 700,
              }}
            >
              {loading ? 'กำลังรีเซ็ต...' : 'ยืนยันรีเซ็ตผล'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
