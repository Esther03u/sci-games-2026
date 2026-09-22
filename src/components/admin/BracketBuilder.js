'use client';
import { useMemo, useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import FormField from '@/components/ui/FormField';
import Bracket from '@/components/public/live/Bracket';
import { apiRequest } from '@/lib/api/client';
import Banner from '@/components/ui/Banner';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { EVENT_DAYS, EVENT_END_DATE } from '@/lib/format';

export default function BracketBuilder({ sports, teams, initialMatches }) {
  const matches = initialMatches;
  const [sportId, setSportId] = useState('');
  const [seeds, setSeeds] = useState(teams.slice(0, 4).map((t) => t.id));
  const [form, setForm] = useState({
    semi_date: EVENT_DAYS[1]?.date || EVENT_END_DATE,
    semi_time_1: '10:00',
    semi_time_2: '11:00',
    final_date: EVENT_END_DATE,
    third_time: '13:00',
    final_time: '14:00',
    venue: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // { kind, text }
  const [confirm, confirmDialog] = useConfirm();

  const bySport = useMemo(() => {
    const out = {};
    for (const m of matches) (out[m.sport_id] ||= []).push(m);
    return out;
  }, [matches]);

  const sportsWithout = sports.filter((s) => !bySport[s.id]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setSeed = (i) => (e) => setSeeds((s) => s.map((v, j) => (j === i ? e.target.value : v)));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!sportId) return setMsg({ kind: 'error', text: 'กรุณาเลือกกีฬา' });
    if (new Set(seeds).size !== 4) return setMsg({ kind: 'error', text: 'ต้องเลือก 4 ทีมที่ไม่ซ้ำกัน' });
    const sport = sports.find((s) => s.id === sportId);
    if (
      !(await confirm({
        title: `สร้างสายแข่ง ${sport?.name}?`,
        message: 'จะสร้าง 4 แมตช์: รอบรองฯ 2 คู่, ชิงที่ 3 และชิงชนะเลิศ',
        confirmLabel: 'สร้าง',
      }))
    )
      return;
    setSaving(true);
    try {
      await apiRequest('/api/admin/bracket', {
        body: { sport_id: sportId, seeds, ...form, venue: form.venue || sport?.name },
      });
      // simplest way to pick up the four new rows with all columns
      window.location.reload();
    } catch (err) {
      setMsg({ kind: 'error', text: err.message });
      setSaving(false);
    }
  };

  const teamName = (id) => teams.find((t) => t.id === id)?.name || '?';

  return (
    <div>
      <Banner kind={msg?.kind || 'info'}>{msg?.text}</Banner>

      <GlassCard style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.85rem' }}>
          สร้างสายแข่งใหม่
        </h2>
        {sportsWithout.length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>
            ทุกกีฬามีสายแข่งแล้ว — ลบแมตช์รอบต่าง ๆ ใน &quot;จัดการผลการแข่ง&quot; ถ้าต้องการสร้างใหม่
          </p>
        ) : (
          <form onSubmit={submit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
              }}
            >
              <FormField label="กีฬา" required id="br_sport">
                <select
                  id="br_sport"
                  className="form-input"
                  value={sportId}
                  onChange={(e) => setSportId(e.target.value)}
                >
                  <option value="">— เลือกกีฬา —</option>
                  {sportsWithout.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="สนาม" id="br_venue">
                <input
                  id="br_venue"
                  className="form-input"
                  placeholder="ว่างไว้ = ใช้ชื่อกีฬา"
                  value={form.venue}
                  onChange={set('venue')}
                />
              </FormField>
            </div>

            <div
              style={{ marginTop: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-2)' }}
            >
              อันดับ (seed) — รองฯ 1: #1 vs #4, รองฯ 2: #2 vs #3
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.75rem',
                marginTop: '0.4rem',
              }}
            >
              {seeds.map((v, i) => (
                <FormField key={i} label={`Seed #${i + 1}`} id={`seed_${i}`}>
                  <select id={`seed_${i}`} className="form-input" value={v} onChange={setSeed(i)}>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.75rem',
                marginTop: '0.4rem',
              }}
            >
              <FormField label="วันรอบรองฯ" id="semi_date">
                <input
                  id="semi_date"
                  type="date"
                  className="form-input"
                  value={form.semi_date}
                  onChange={set('semi_date')}
                />
              </FormField>
              <FormField label="เวลารองฯ 1" id="semi_time_1">
                <input
                  id="semi_time_1"
                  type="time"
                  className="form-input"
                  value={form.semi_time_1}
                  onChange={set('semi_time_1')}
                />
              </FormField>
              <FormField label="เวลารองฯ 2" id="semi_time_2">
                <input
                  id="semi_time_2"
                  type="time"
                  className="form-input"
                  value={form.semi_time_2}
                  onChange={set('semi_time_2')}
                />
              </FormField>
              <FormField label="วันชิง" id="final_date">
                <input
                  id="final_date"
                  type="date"
                  className="form-input"
                  value={form.final_date}
                  onChange={set('final_date')}
                />
              </FormField>
              <FormField label="เวลาชิงที่ 3" id="third_time">
                <input
                  id="third_time"
                  type="time"
                  className="form-input"
                  value={form.third_time}
                  onChange={set('third_time')}
                />
              </FormField>
              <FormField label="เวลาชิงชนะเลิศ" id="final_time">
                <input
                  id="final_time"
                  type="time"
                  className="form-input"
                  value={form.final_time}
                  onChange={set('final_time')}
                />
              </FormField>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-3)', margin: '0.5rem 0 1rem' }}>
              ตัวอย่าง: รองฯ 1 <strong>{teamName(seeds[0])}</strong> vs <strong>{teamName(seeds[3])}</strong>{' '}
              · รองฯ 2 <strong>{teamName(seeds[1])}</strong> vs <strong>{teamName(seeds[2])}</strong>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'กำลังสร้าง...' : 'สร้างสายแข่ง 4 แมตช์'}
            </button>
          </form>
        )}
      </GlassCard>

      {sports
        .filter((s) => bySport[s.id])
        .map((s) => (
          <GlassCard key={s.id} style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem' }}>
              {s.name}
            </h3>
            <Bracket matches={bySport[s.id]} teams={teams} sport={s} />
          </GlassCard>
        ))}
      {confirmDialog}
    </div>
  );
}
