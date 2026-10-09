'use client';
import Modal from '@/components/ui/Modal';
import { formatDate, fmtPlace } from '@/lib/format';

/** Confirm a hard delete — steers the admin to [รีเซ็ตผล] when that is what they meant */
export default function DeleteModal({ remove, sportById, teamName, loading }) {
  const m = remove.match;
  return (
    <Modal isOpen={!!m} onClose={remove.close} title="ยืนยันลบแมตช์ออกจากระบบถาวร">
      <div className="me-modal-body">
        {/* say exactly which match — the rows look alike on a phone */}
        {m && (
          <div className="me-del-match">
            <strong>
              {sportById.get(m.sport_id)?.name || 'กีฬา'}
              {m.category ? ` · ${m.category}` : ''}
              {m.round ? ` · ${m.round}` : ''}
              {m.match_number ? ` · คู่ที่ ${m.match_number}` : ''}
            </strong>
            <br />
            {teamName(m.team_a_id, 'รอผล')} vs {teamName(m.team_b_id, 'รอผล')}
            <br />
            <span className="me-muted3">
              {formatDate(m.match_date)} · {m.match_time?.slice(0, 5)} น. · {fmtPlace(m)}
            </span>
          </div>
        )}
        <div className="me-del-warn">
          <p className="me-del-warn-title">คำเตือน: นี่คือการลบคู่นี้ออกจากตารางถาวร (Hard Delete)</p>
          <p className="me-del-warn-text">
            แมตช์นี้จะ<strong>หายไปจากระบบ</strong> ทั้งหน้าตารางแข่ง ผลการแข่ง และผังสายแข่ง
          </p>
          <p className="me-del-warn-tip">
            หากท่านต้องการเพียงแค่ล้างผลคะแนนหรือเริ่มแข่งใหม่ กรุณากด &quot;ยกเลิก&quot; แล้วใช้ปุ่ม
            [รีเซ็ตผล] แทน
          </p>
        </div>

        {m?.match_number && (
          <p className="me-del-official">
            * คู่นี้เป็นคู่แข่งขันทางการตามสูจิบัตร (คู่ที่ {m.match_number}) หากลบแล้วตารางสูจิบัตรจะไม่ครบ
          </p>
        )}

        <div className="me-actions-end">
          <button onClick={remove.close} className="btn btn-secondary btn-sm" disabled={loading}>
            ยกเลิก (ไม่ลบ)
          </button>
          <button
            onClick={remove.confirm}
            className="btn btn-primary btn-sm"
            disabled={loading}
            style={{ background: '#ef4444' }}
          >
            {loading ? 'กำลังลบถาวร...' : 'ลบแมตช์ถาวร'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
