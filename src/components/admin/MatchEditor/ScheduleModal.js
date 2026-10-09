'use client';
import Modal from '@/components/ui/Modal';
import MatchFormFields from './MatchFormFields';

export default function ScheduleModal({ schedule, teams, loading }) {
  const { match, form } = schedule;
  return (
    <Modal isOpen={!!match} onClose={schedule.close} title="แก้ไขตารางแข่ง (ทีม / วัน / เวลา / สนาม)">
      {form && (
        <form onSubmit={schedule.submit} style={{ padding: '0.5rem 0' }}>
          {schedule.error && (
            <p style={{ color: 'var(--danger-text)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {schedule.error}
            </p>
          )}
          {match?.status !== 'upcoming' && match?.status !== 'postponed' && (
            <p style={{ color: 'var(--accent-text)', fontSize: '0.82rem', marginBottom: '1rem' }}>
              แมตช์นี้เริ่มหรือจบไปแล้ว — การเปลี่ยนทีมจะไม่ย้ายคะแนนหรือผลที่บันทึกไว้
            </p>
          )}

          <MatchFormFields
            form={form}
            setField={schedule.setField}
            teams={teams}
            pendingLabel="-- รอผลการแข่งขัน --"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={schedule.close} className="btn btn-secondary btn-sm">
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'บันทึกตาราง'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
