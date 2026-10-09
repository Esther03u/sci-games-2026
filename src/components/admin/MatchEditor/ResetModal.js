'use client';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';

/** Confirm POST /api/match/[id]/reset — clears the result but keeps the fixture */
export default function ResetModal({ reset, sportById, teamName, loading }) {
  const m = reset.match;
  return (
    <Modal isOpen={!!m} onClose={reset.close} title="🔄 ยืนยันการรีเซ็ตผลการแข่งขัน">
      {m && (
        <div style={{ padding: '0.5rem 0' }}>
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: '0.95rem',
                color: 'var(--text)',
                marginBottom: '0.35rem',
              }}
            >
              {sportById.get(m.sport_id)?.name}
              {m.category ? ` · ${m.category}` : ''}
              {m.round ? ` · รอบ ${m.round}` : ''}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>
              {teamName(m.team_a_id, 'รอผลการแข่งขัน')} vs {teamName(m.team_b_id, 'รอผลการแข่งขัน')}
            </div>
          </div>

          <ul
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-2)',
              lineHeight: 1.6,
              paddingLeft: '1.25rem',
              marginBottom: '1.25rem',
            }}
          >
            <li>
              ล้างคะแนน, รายการเซต, และสถานะกลับเป็น <strong>&quot;ยังไม่แข่ง (Upcoming)&quot;</strong>
            </li>
            <li>ล้างเวลาแข่งจริง และประวัติแต้มสดทั้งหมด</li>
            <li>
              <strong>คู่แข่งขัน วัน เวลา และสถานที่ จะยังคงอยู่ครบเหมือนเดิม 100%</strong> (แมตช์ไม่หาย)
            </li>
            {(m.next_match_id || m.loser_next_match_id) && (
              <li style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
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
