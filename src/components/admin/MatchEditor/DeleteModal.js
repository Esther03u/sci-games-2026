'use client';
import Modal from '@/components/ui/Modal';
import { formatDate, fmtPlace } from '@/lib/format';

/** Confirm a hard delete — steers the admin to [รีเซ็ตผล] when that is what they meant */
export default function DeleteModal({ remove, sportById, teamName, loading }) {
  const m = remove.match;
  return (
    <Modal isOpen={!!m} onClose={remove.close} title="ยืนยันลบแมตช์ออกจากระบบถาวร">
      <div style={{ padding: '0.5rem 0' }}>
        {/* say exactly which match — the rows look alike on a phone */}
        {m && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              marginBottom: '0.85rem',
              fontSize: '0.9rem',
              color: 'var(--text)',
              lineHeight: 1.6,
            }}
          >
            <strong>
              {sportById.get(m.sport_id)?.name || 'กีฬา'}
              {m.category ? ` · ${m.category}` : ''}
              {m.round ? ` · ${m.round}` : ''}
              {m.match_number ? ` · คู่ที่ ${m.match_number}` : ''}
            </strong>
            <br />
            {teamName(m.team_a_id, 'รอผล')} vs {teamName(m.team_b_id, 'รอผล')}
            <br />
            <span style={{ color: 'var(--text-3)' }}>
              {formatDate(m.match_date)} · {m.match_time?.slice(0, 5)} น. · {fmtPlace(m)}
            </span>
          </div>
        )}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            marginBottom: '1rem',
          }}
        >
          <p
            style={{
              fontWeight: 800,
              color: 'var(--danger-text)',
              fontSize: '0.9rem',
              marginBottom: '0.4rem',
            }}
          >
            คำเตือน: นี่คือการลบคู่นี้ออกจากตารางถาวร (Hard Delete)
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
            แมตช์นี้จะ<strong>หายไปจากระบบ</strong> ทั้งหน้าตารางแข่ง ผลการแข่ง และผังสายแข่ง
          </p>
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--gold-700)',
              fontWeight: 700,
              marginTop: '0.5rem',
              marginBottom: 0,
            }}
          >
            หากท่านต้องการเพียงแค่ล้างผลคะแนนหรือเริ่มแข่งใหม่ กรุณากด &quot;ยกเลิก&quot; แล้วใช้ปุ่ม
            [รีเซ็ตผล] แทน
          </p>
        </div>

        {m?.match_number && (
          <p style={{ fontSize: '0.8rem', color: 'var(--accent-text)', marginBottom: '1rem' }}>
            * คู่นี้เป็นคู่แข่งขันทางการตามสูจิบัตร (คู่ที่ {m.match_number}) หากลบแล้วตารางสูจิบัตรจะไม่ครบ
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
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
