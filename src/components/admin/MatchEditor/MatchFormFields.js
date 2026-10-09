'use client';
import FormField from '@/components/ui/FormField';
import TimeInput from '@/components/ui/TimeInput';

/** Team A/B, date, time, venue and court inputs shared by the add and edit-schedule forms */
export default function MatchFormFields({ form, setField, teams, pendingLabel }) {
  const teamSelect = (label, key) => (
    <FormField label={label}>
      <select className="form-select" value={form[key]} onChange={setField(key)}>
        <option value="">{pendingLabel}</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </FormField>
  );

  return (
    <>
      <div className="me-grid-2">
        {teamSelect('ทีม A', 'team_a_id')}
        {teamSelect('ทีม B', 'team_b_id')}
      </div>

      <div className="me-grid-2">
        <FormField label="วันที่แข่ง" required>
          <input
            type="date"
            className="form-input"
            value={form.match_date}
            onChange={setField('match_date')}
            required
          />
        </FormField>
        <FormField label="เวลาแข่ง" required>
          <TimeInput
            className="form-input"
            value={form.match_time}
            onChange={setField('match_time')}
            required
          />
        </FormField>
      </div>

      <div className="me-grid-2-1">
        <FormField label="สถานที่ / สนาม" required>
          <input
            type="text"
            className="form-input"
            value={form.venue}
            onChange={setField('venue')}
            required
          />
        </FormField>
        <FormField label="สนามย่อย (ถ้ามี)">
          <input
            type="text"
            className="form-input"
            value={form.court}
            onChange={setField('court')}
            placeholder="เช่น สนาม 1"
          />
        </FormField>
      </div>
    </>
  );
}
