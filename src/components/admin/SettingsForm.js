'use client';
import { useEffect, useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import FormField from '@/components/ui/FormField';
import { apiRequest } from '@/lib/api/client';
import Banner from '@/components/ui/Banner';

export default function SettingsForm() {
  const [values, setValues] = useState(null);
  const [minutes, setMinutes] = useState(10);
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    let active = true;
    apiRequest('/api/admin/settings', { method: 'GET' })
      .then((rows) => {
        if (!active) return;
        const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
        setValues(map);
        setMinutes(Number(map.score_edit_window_minutes ?? 10));
        setLiveEnabled(map.live_scoring_enabled !== false);
      })
      .catch((err) => active && setMsg({ kind: 'error', text: err.message }));
    return () => {
      active = false;
    };
  }, []);

  const save = async (key, value) => {
    setSaving(true);
    setMsg(null);
    try {
      await apiRequest('/api/admin/settings', { method: 'PATCH', body: { key, value } });
      setValues((v) => ({ ...v, [key]: value }));
      setMsg({ kind: 'ok', text: 'บันทึกแล้ว มีผลทันที' });
    } catch (err) {
      setMsg({ kind: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <Banner kind={msg?.kind === 'ok' ? 'success' : msg?.kind || 'info'}>{msg?.text}</Banner>

      <GlassCard style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--mono-900)' }}>เวลาแก้ไขคะแนนหลังจบแมตช์</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--mono-600)', margin: '0.3rem 0 0.85rem' }}>
          กรรมการ (Staff/PIN) แก้คะแนนได้ภายในเวลานี้หลังกด &quot;จบแมตช์&quot; — หลังจากนั้นผู้ดูแลระบบเท่านั้น (ผู้ดูแลแก้ได้ตลอด)
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'end' }}>
          <FormField label="นาที" id="edit_window">
            <input id="edit_window" type="number" min="0" max="1440" className="form-input" style={{ width: 120 }} value={minutes} onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))} disabled={!values} />
          </FormField>
          <button className="btn btn-primary" disabled={saving || !values || minutes === Number(values?.score_edit_window_minutes)} onClick={() => save('score_edit_window_minutes', minutes)} style={{ height: 44 }}>
            บันทึก
          </button>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--mono-500)' }}>ค่าปัจจุบัน: {values ? `${values.score_edit_window_minutes} นาที` : '…'}</div>
      </GlassCard>

      <GlassCard style={{ padding: '1.25rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--mono-900)' }}>ระบบลงคะแนนสด</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--mono-600)', margin: '0.3rem 0 0.85rem' }}>
          เก็บไว้เป็นสวิตช์ฉุกเฉิน (ยังไม่มีผลกับ API ในเวอร์ชันนี้ — ใช้ปิด PIN รายตัวในหน้า PIN กรรมการแทนถ้าต้องหยุดใครทันที)
        </p>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--mono-800)' }}>
          <input type="checkbox" checked={liveEnabled} disabled={!values || saving} onChange={(e) => { setLiveEnabled(e.target.checked); save('live_scoring_enabled', e.target.checked); }} />
          เปิดใช้งาน
        </label>
      </GlassCard>
    </div>
  );
}
