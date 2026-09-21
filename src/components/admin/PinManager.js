'use client';
import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import GlassCard from '@/components/ui/GlassCard';
import AdminTable, { Td, TR, EmptyRow } from '@/components/ui/AdminTable';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';
import { apiRequest } from '@/lib/api/client';
import Banner from '@/components/ui/Banner';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useClock } from '@/hooks/useLiveScores';
import { relativeTime, fmtShortDateTime as fmt } from '@/lib/format';

export default function PinManager({ sports }) {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const now = useClock();
  const [confirm, confirmDialog] = useConfirm();

  // create form
  const [sportId, setSportId] = useState(sports[0]?.id || '');
  const [label, setLabel] = useState('');
  const [expiresAt, setExpiresAt] = useState('2026-10-11T23:59');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null); // { pin, label, sport_id } shown once

  const load = useCallback(async () => {
    try {
      setPins(await apiRequest('/api/admin/pins', { method: 'GET' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest('/api/admin/pins', { method: 'GET' })
      .then((rows) => active && setPins(rows))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    if (!sportId || !label.trim()) {
      setError('กรุณาเลือกกีฬาและตั้งชื่อ PIN');
      return;
    }
    setCreating(true);
    try {
      const data = await apiRequest('/api/admin/pins', {
        body: { sport_id: sportId, label: label.trim(), expires_at: expiresAt ? new Date(expiresAt).toISOString() : null },
      });
      setCreated(data);
      setLabel('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (p) => {
    try {
      const data = await apiRequest('/api/admin/pins', { method: 'PATCH', body: { id: p.id, is_active: !p.is_active } });
      setPins((prev) => prev.map((x) => (x.id === p.id ? data : x)));
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (p) => {
    if (!(await confirm({ title: `ลบ PIN "${p.label}"?`, message: 'กรรมการที่ใช้ PIN นี้อยู่จะถูกตัดออกทันที', confirmLabel: 'ลบ', danger: true }))) return;
    try {
      await apiRequest(`/api/admin/pins?id=${p.id}`, { method: 'DELETE' });
      setPins((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const sportName = (id) => sports.find((s) => s.id === id)?.name || '—';

  return (
    <div>
      <Banner kind="error" onClose={() => setError('')}>{error}</Banner>

      <GlassCard style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.85rem' }}>สร้าง PIN ใหม่</h2>
        <form onSubmit={create} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
          <FormField label="กีฬา" required id="pin_sport">
            <select id="pin_sport" className="form-input" value={sportId} onChange={(e) => setSportId(e.target.value)}>
              {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="ชื่อ PIN (ใครใช้)" required id="pin_label">
            <input id="pin_label" className="form-input" placeholder='เช่น "กรรมการฟุตซอล สนาม 1"' value={label} onChange={(e) => setLabel(e.target.value)} />
          </FormField>
          <FormField label="หมดอายุ" id="pin_exp">
            <input id="pin_exp" type="datetime-local" className="form-input" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </FormField>
          <button type="submit" className="btn btn-primary" disabled={creating} style={{ height: 44 }}>
            {creating ? 'กำลังสร้าง...' : '+ สร้าง PIN'}
          </button>
        </form>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '0.6rem' }}>
          PIN จะแสดง<strong>ครั้งเดียว</strong>ตอนสร้าง (ระบบเก็บเฉพาะ hash) — ถ้าลืม ให้ปิดอันเก่าแล้วสร้างใหม่
        </p>
      </GlassCard>

      <AdminTable columns={['ชื่อ', 'กีฬา', 'สถานะ', 'ใช้ล่าสุด', 'หมดอายุ', '']} minWidth={640}>
            {loading ? (
              <EmptyRow colSpan={6}>กำลังโหลด...</EmptyRow>
            ) : pins.length === 0 ? (
              <EmptyRow colSpan={6}>ยังไม่มี PIN</EmptyRow>
            ) : (
              pins.map((p) => {
                const expired = p.expires_at && new Date(p.expires_at) < new Date();
                const state = !p.is_active ? ['ปิดแล้ว', 'var(--text-muted)'] : expired ? ['หมดอายุ', 'var(--danger-text)'] : ['ใช้งานได้', 'var(--success-text)'];
                return (
                  <tr key={p.id} style={{ ...TR, opacity: p.is_active && !expired ? 1 : 0.65 }}>
                    <Td style={{ fontWeight: 700, color: 'var(--text)' }}>{p.label}</Td>
                    <Td>{p.sports?.name || sportName(p.sport_id)}</Td>
                    <Td style={{ color: state[1], fontWeight: 700 }}>{state[0]}</Td>
                    <Td>{p.last_used_at ? (now ? relativeTime(p.last_used_at, now) : fmt(p.last_used_at)) : <span style={{ color: 'var(--text-muted)' }}>ยังไม่เคยใช้</span>}</Td>
                    <Td>{fmt(p.expires_at)}</Td>
                    <Td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => toggle(p)} style={{ marginRight: '0.35rem' }}>
                        {p.is_active ? 'ปิด' : 'เปิด'}
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => remove(p)} style={{ color: 'var(--danger-text)' }}>
                        ลบ
                      </button>
                    </Td>
                  </tr>
                );
              })
            )}
      </AdminTable>

      {created && <CreatedPinModal data={created} sportName={sportName(created.sport_id)} onClose={() => setCreated(null)} />}
      {confirmDialog}
    </div>
  );
}


function CreatedPinModal({ data, sportName, onClose }) {
  const [qr, setQr] = useState('');
  const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/staff/login?sport=${data.sport_id}` : '';

  useEffect(() => {
    if (!loginUrl) return;
    QRCode.toDataURL(loginUrl, { width: 220, margin: 1, color: { dark: 'var(--text)', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [loginUrl]);

  return (
    <Modal isOpen onClose={onClose} title="PIN ใหม่ — แสดงครั้งเดียว">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>{sportName} · {data.label}</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 900, letterSpacing: '0.35rem', color: 'var(--text)', margin: '0.5rem 0 1rem' }}>
          {data.pin}
        </div>
        {qr && <img src={qr} alt="QR ไปหน้า login" width={180} height={180} style={{ borderRadius: 12, border: '1px solid var(--glass-border)' }} />}
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '0.6rem', wordBreak: 'break-all' }}>{loginUrl}</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginTop: '0.85rem' }}>
          ให้กรรมการสแกน QR (เปิดหน้า login พร้อมเลือกกีฬาให้แล้ว) แล้วกรอก PIN — จดหรือถ่ายรูปไว้ ระบบจะไม่แสดงอีก
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigator.clipboard?.writeText(`${sportName} ${data.label}\nPIN: ${data.pin}\n${loginUrl}`)}>
            คัดลอก
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>
            บันทึกแล้ว ปิด
          </button>
        </div>
      </div>
    </Modal>
  );
}
