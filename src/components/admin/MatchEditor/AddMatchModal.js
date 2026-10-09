'use client';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';
import { AlertTriangle } from '@/components/animate-ui/icons';
import MatchFormFields from './MatchFormFields';

export default function AddMatchModal({ add, sports, teams, loading }) {
  return (
    <Modal isOpen={add.isOpen} onClose={add.close} title="เพิ่มแมตช์แข่งขันใหม่">
      <form onSubmit={add.submit} className="me-modal-body">
        {add.error && (
          <p className="me-error">
            <AlertTriangle size={15} />
            <span>{add.error}</span>
          </p>
        )}

        <FormField label="ชนิดกีฬา" required>
          <select
            className="form-select"
            value={add.form.sport_id}
            onChange={add.setField('sport_id')}
            required
          >
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </FormField>

        <MatchFormFields
          form={add.form}
          setField={add.setField}
          teams={teams}
          pendingLabel="-- รอผลการแข่งขัน (ยังไม่ระบุ) --"
        />

        <div className="me-modal-actions">
          <button type="button" onClick={add.close} className="btn btn-secondary btn-sm">
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? 'กำลังสร้าง...' : 'สร้างแมตช์'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
