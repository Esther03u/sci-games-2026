'use client';
import { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Banner from '@/components/ui/Banner';
import FormField from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { formatDate, EVENT_START_DATE } from '@/lib/format';
import { Plus, Trash2, AlertTriangle } from '@/components/animate-ui/icons';

export default function SportScheduleManager({ initialSchedules = [], sports = [] }) {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [pageError, setPageError] = useState('');
  const [sportId, setSportId] = useState(sports[0]?.id || '');
  const [scheduleDate, setScheduleDate] = useState(EVENT_START_DATE);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scheduleToDelete, setScheduleToDelete] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');

    if (startTime >= endTime) {
      setError('เวลาเริ่มการแข่งขันต้องมาก่อนเวลาสิ้นสุด');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: insertError } = await supabase
        .from('sport_schedules')
        .insert({
          sport_id: sportId,
          schedule_date: scheduleDate,
          start_time: startTime + ':00',
          end_time: endTime + ':00',
        })
        .select('*, sports(name)')
        .single();

      if (insertError) {
        setError('เกิดข้อผิดพลาด: ' + insertError.message);
      } else if (data) {
        setSchedules((prev) => [...prev, data]);
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!scheduleToDelete) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: delError } = await supabase
        .from('sport_schedules')
        .delete()
        .eq('id', scheduleToDelete.id);

      if (!delError) {
        setSchedules((prev) => prev.filter((s) => s.id !== scheduleToDelete.id));
        setScheduleToDelete(null);
      } else {
        setPageError('เกิดข้อผิดพลาดในการลบ: ' + delError.message);
      }
    } catch (err) {
      setPageError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Banner kind="error" onClose={() => setPageError('')}>{pageError}</Banner>
      {/* Add Time Slot Form */}
      <GlassCard style={{ padding: '1.5rem 2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--gold-600)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> เพิ่มช่วงเวลากำหนดการแข่งขันกีฬา
        </h3>
        <form onSubmit={handleAdd}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <FormField label="ชนิดกีฬา" required>
              <select
                className="form-select"
                value={sportId}
                onChange={(e) => setSportId(e.target.value)}
                required
              >
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="วันที่แข่งขัน" required>
              <input
                type="date"
                className="form-input"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                required
              />
            </FormField>

            <FormField label="เวลาเริ่ม" required>
              <input
                type="time"
                className="form-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </FormField>

            <FormField label="เวลาสิ้นสุด" required>
              <input
                type="time"
                className="form-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </FormField>
          </div>

          {error && (
            <p style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={14} /> {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: '1rem', padding: '0.65rem 1.5rem' }}
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึกช่วงเวลา'}
          </button>
        </form>
      </GlassCard>

      {/* Schedules List */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>ชนิดกีฬา</th>
              <th>วันที่แข่ง</th>
              <th>ช่วงเวลา</th>
              <th style={{ width: '120px', textAlign: 'center' }}>การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {schedules.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--mono-500)' }}>
                  ยังไม่มีการกำหนดเวลาแข่งขัน
                </td>
              </tr>
            ) : (
              schedules.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong style={{ color: 'var(--mono-900)' }}>{item.sports?.name}</strong>
                  </td>
                  <td>{formatDate(item.schedule_date)}</td>
                  <td>
                    <span style={{ fontFamily: 'monospace', color: 'var(--gold-600)' }}>
                      {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)} น.
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => setScheduleToDelete(item)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#b91c1c', padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Trash2 size={13} /> ลบ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={!!scheduleToDelete}
        onClose={() => setScheduleToDelete(null)}
        title="ยืนยันการลบช่วงเวลาแข่งขัน"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--mono-900)', lineHeight: 1.6 }}>
            คุณต้องการลบช่วงเวลาแข่งกีฬา <strong>{scheduleToDelete?.sports?.name}</strong> วันที่ {scheduleToDelete?.schedule_date} ({scheduleToDelete?.start_time?.slice(0, 5)} - {scheduleToDelete?.end_time?.slice(0, 5)}) หรือไม่?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              onClick={() => setScheduleToDelete(null)}
              className="btn btn-secondary btn-sm"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-primary btn-sm"
              disabled={loading}
              style={{ background: '#ef4444' }}
            >
              {loading ? 'กำลังลบ...' : 'ยืนยันลบ'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
