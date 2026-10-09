'use client';
import { useEffect, useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import FormField from '@/components/ui/FormField';
import { apiRequest } from '@/lib/api/client';
import Banner from '@/components/ui/Banner';
import { DEFAULT_PODIUM_SETTINGS } from '@/lib/queries/podium';
import { normalizePlacementPoints } from '@/lib/placements';
import PodiumCountdown from '@/components/public/PodiumCountdown';
import { Zap, Trophy, Sparkles, Clock, RefreshCw, BookOpen, RotateCcw } from 'lucide-react';

function toDatetimeLocal(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(localStr) {
  if (!localStr) return new Date().toISOString();
  return new Date(localStr).toISOString();
}

export default function SettingsForm() {
  const [values, setValues] = useState(null);
  const [minutes, setMinutes] = useState(10);
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // Podium countdown states
  const [podiumConfig, setPodiumConfig] = useState(DEFAULT_PODIUM_SETTINGS);
  const [targetTimeInput, setTargetTimeInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [countdownEnabled, setCountdownEnabled] = useState(true);

  // Overall points per place (lib/placements) + home-page departments switch
  const [placePoints, setPlacePoints] = useState(['30', '25', '20', '15']);
  const [showDepartments, setShowDepartments] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest('/api/admin/settings', { method: 'GET' })
      .then((rows) => {
        if (!active) return;
        const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
        setValues(map);
        setMinutes(Number(map.score_edit_window_minutes ?? 10));
        setLiveEnabled(map.live_scoring_enabled !== false);

        const podiumData = { ...DEFAULT_PODIUM_SETTINGS, ...(map.podium_countdown || {}) };
        setPodiumConfig(podiumData);
        setTargetTimeInput(toDatetimeLocal(podiumData.target_time));
        setTitleInput(podiumData.title || DEFAULT_PODIUM_SETTINGS.title);
        setCountdownEnabled(podiumData.enabled !== false);
        setPlacePoints(normalizePlacementPoints(map.placement_points).map(String));
        setShowDepartments(map.show_departments_public === true);
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
      if (key === 'podium_countdown') {
        setPodiumConfig(value);
      }
      setMsg({ kind: 'ok', text: 'บันทึกแล้ว มีผลทันที' });
    } catch (err) {
      setMsg({ kind: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePodiumSettings = async () => {
    const updated = {
      ...podiumConfig,
      enabled: countdownEnabled,
      target_time: fromDatetimeLocal(targetTimeInput),
      title: titleInput.trim() || DEFAULT_PODIUM_SETTINGS.title,
    };
    await save('podium_countdown', updated);
  };

  const handleTriggerFastForward = async () => {
    const updated = {
      ...podiumConfig,
      status: 'fast_forward',
      fast_forward_at: new Date().toISOString(),
      revealed: false,
    };
    await save('podium_countdown', updated);
  };

  const handleInstantReveal = async () => {
    const updated = {
      ...podiumConfig,
      status: 'revealed',
      revealed: true,
      fast_forward_at: null,
    };
    await save('podium_countdown', updated);
  };

  const handleResetToMystery = async () => {
    const updated = {
      ...podiumConfig,
      status: 'countdown',
      revealed: false,
      fast_forward_at: null,
    };
    await save('podium_countdown', updated);
  };

  const isRevealed = Boolean(podiumConfig.revealed);
  const isFastForward = podiumConfig.status === 'fast_forward';

  return (
    <div style={{ maxWidth: 640 }}>
      <Banner kind={msg?.kind === 'ok' ? 'success' : msg?.kind || 'info'}>{msg?.text}</Banner>

      {/* 1. Countdown & Podium Reveal Management Section */}
      <GlassCard
        style={{
          padding: '1.4rem 1.5rem',
          marginBottom: '1.25rem',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          background: 'linear-gradient(180deg, var(--surface) 0%, rgba(245, 158, 11, 0.03) 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: '0.75rem',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Clock size={20} style={{ color: 'var(--accent-text)' }} />
              <span>ระบบนับถอยหลัง & เฉลยผลโพเดียม</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', margin: '0.2rem 0 0' }}>
              ควบคุมการนับเวลาถอยหลังและกดเฉลยผลคะแนนรวมพิธีปิดบนหน้าแรก
            </p>
          </div>

          <div>
            {isRevealed ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#16a34a',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                <Trophy size={14} /> เฉลยผลแล้ว
              </span>
            ) : isFastForward ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#dc2626',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <Zap size={14} /> กำลังเร่งเวลา
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--accent-text)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                <Clock size={14} /> กำลังนับถอยหลัง
              </span>
            )}
          </div>
        </div>

        {/* Live Action Buttons Box */}
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '1rem',
            margin: '1rem 0 1.25rem',
          }}
        >
          <div
            style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: '0.65rem' }}
          >
            ปุ่มคำสั่งเฉลยผลคะแนน (ส่งสัญญาณถ่ายทอดสดทันที):
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '0.6rem',
            }}
          >
            {/* 1. Fast-forward reveal */}
            <button
              type="button"
              className="btn"
              disabled={saving || !values}
              onClick={handleTriggerFastForward}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '0.65rem 0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
              }}
              title="เร่งเวลาอย่างรวดเร็วแล้วชะลอก่อนเฉลยผล"
            >
              <Zap size={16} />
              <span>เร่งเวลาแล้วเฉลย</span>
            </button>

            {/* 2. Instant reveal */}
            <button
              type="button"
              className="btn btn-secondary"
              disabled={saving || !values || isRevealed}
              onClick={handleInstantReveal}
              style={{
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '0.65rem 0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
              }}
              title="เปิดเผยผลคะแนนทันทีโดยไม่เร่งเวลา"
            >
              <Sparkles size={16} style={{ color: 'var(--accent-text)' }} />
              <span>เฉลยทันที</span>
            </button>

            {/* 3. Reset to mystery */}
            <button
              type="button"
              className="btn btn-secondary"
              disabled={saving || !values || (!isRevealed && !isFastForward)}
              onClick={handleResetToMystery}
              style={{
                fontWeight: 600,
                fontSize: '0.85rem',
                padding: '0.65rem 0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
              }}
              title="รีเซ็ตกลับเป็นโหมดปริศนา (?) และเริ่มนับถอยหลังใหม่"
            >
              <RefreshCw size={15} />
              <span>รีเซ็ตเป็นปริศนา</span>
            </button>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '0.65rem', lineHeight: 1.4 }}>
            💡 <strong>วิธีทำงาน:</strong> หากถึงเวลานับถอยหลัง นาฬิกาจะค้างที่ <code>00:00:00</code>{' '}
            รอจนกว่าแอดมินจะกดปุ่มเฉลย หรือหากกด <strong>&quot;เร่งเวลาแล้วเฉลย&quot;</strong>{' '}
            ระบบจะสั่งให้นาฬิกาวิ่งลดลงอย่างรวดเร็ว ชะลอจังหวะสุดท้าย แล้วเปิดเผยอันดับ 1, 2, 3
            พร้อมเอฟเฟกต์เฉลิมฉลองทันที
          </div>
        </div>

        {/* Settings Inputs Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={countdownEnabled}
              disabled={!values || saving}
              onChange={(e) => setCountdownEnabled(e.target.checked)}
            />
            <span>แสดงกล่องนับเวลาถอยหลังใต้โพเดียมบนหน้าแรก</span>
          </label>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <FormField label="วันและเวลานับถอยหลังเป้าหมาย" id="target_time">
              <input
                id="target_time"
                type="datetime-local"
                className="form-input"
                value={targetTimeInput}
                onChange={(e) => setTargetTimeInput(e.target.value)}
                disabled={!values}
              />
            </FormField>

            <FormField label="ข้อความหัวเรื่องนับถอยหลัง" id="countdown_title">
              <input
                id="countdown_title"
                type="text"
                className="form-input"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                disabled={!values}
                placeholder="เช่น นับถอยหลังสู่การประกาศผลคะแนนรวม"
              />
            </FormField>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving || !values}
              onClick={handleSavePodiumSettings}
              style={{ minWidth: 140, height: 42 }}
            >
              {saving ? 'กำลังบันทึก…' : 'บันทึกเวลา & หัวเรื่อง'}
            </button>
          </div>
        </div>

        {/* Live Admin Preview of the Countdown Component */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)' }}>
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--text-3)',
              marginBottom: '0.5rem',
              textAlign: 'center',
            }}
          >
            ตัวอย่างหน้าปัดนาฬิกา (React Bits &lt;Counter /&gt;):
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '0.5rem 0' }}>
            <PodiumCountdown initialSettings={podiumConfig} isRevealed={isRevealed} previewMode={true} />
          </div>
        </div>
      </GlassCard>

      {/* 2. Score Edit Window */}
      <GlassCard style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
          เวลาแก้ไขคะแนนหลังจบแมตช์
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', margin: '0.3rem 0 0.85rem' }}>
          กรรมการ (Staff/PIN) แก้คะแนนได้ภายในเวลานี้หลังกด &quot;จบแมตช์&quot; —
          หลังจากนั้นผู้ดูแลระบบเท่านั้น (ผู้ดูแลแก้ได้ตลอด)
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'end' }}>
          <FormField label="นาที" id="edit_window">
            <input
              id="edit_window"
              type="number"
              min="0"
              max="1440"
              className="form-input"
              style={{ width: 120 }}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
              disabled={!values}
            />
          </FormField>
          <button
            className="btn btn-primary"
            disabled={saving || !values || minutes === Number(values?.score_edit_window_minutes)}
            onClick={() => save('score_edit_window_minutes', minutes)}
            style={{ height: 44 }}
          >
            บันทึก
          </button>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
          ค่าปัจจุบัน: {values ? `${values.score_edit_window_minutes} นาที` : '…'}
        </div>
      </GlassCard>

      {/* Overall points per place - Official Handbook Criteria */}
      <GlassCard style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: '0.4rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Trophy size={18} style={{ color: 'var(--accent-text)' }} />
              <span>คะแนนรวมตามอันดับ (เกณฑ์สูจิบัตรทางการ)</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', margin: '0.25rem 0 0' }}>
              ใช้ตัดสินถ้วยรางวัลคะแนนรวมสูงสุด (ถ้วยเจ้าสนาม) คิดจากผลการแข่งขัน 11 รายการ รายการละ 30
              คะแนนดิบ (เต็ม 330)
            </p>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'var(--accent-surface)',
              color: 'var(--accent-text)',
              border: '1px solid var(--accent-border)',
              whiteSpace: 'nowrap',
            }}
          >
            คะแนนเต็ม 100 คะแนน
          </span>
        </div>

        {/* Formula breakdown card */}
        <div
          style={{
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            margin: '0.85rem 0 1rem',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>
            การแปลงเป็นคะแนนเต็ม 100 คะแนน:
          </div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--accent-text)',
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '0.02em',
            }}
          >
            คะแนนรวม = คะแนนดิบรวม × 100 ÷ 330
          </div>
          <div style={{ color: 'var(--text-2)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
            • คิดทศนิยม 2 ตำแหน่ง เช่น ได้คะแนนดิบ 245 คะแนน → 245 × 100 ÷ 330 = <strong>74.24</strong> คะแนน
            <br />• สีที่ลงแข่งขันครบทุกรายการจะได้คะแนนรวมไม่น้อยกว่า <strong>50.00</strong> คะแนน
            แม้ได้อันดับที่ 4 ทุกรายการ (165 × 100 ÷ 330)
            <br />• ผู้ชมเห็นคะแนนรวมหลังกดเปิดโพเดียมเท่านั้น (ระบบนับถอยหลังพิธีปิด)
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const nums = placePoints.map((v) => Number(v));
            if (nums.some((n) => !Number.isFinite(n) || n < 0 || n > 1000)) {
              setMsg({ kind: 'error', text: 'คะแนนต้องเป็นตัวเลข 0–1000' });
              return;
            }
            save('placement_points', nums);
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '0.75rem',
              alignItems: 'end',
              marginBottom: '1rem',
            }}
          >
            {[
              { label: '🥇 ชนะเลิศ', sub: 'อันดับที่ 1', std: 30 },
              { label: '🥈 รองฯ 1', sub: 'อันดับที่ 2', std: 25 },
              { label: '🥉 รองฯ 2', sub: 'อันดับที่ 3', std: 20 },
              { label: 'อันดับที่ 4', sub: 'อันดับที่ 4', std: 15 },
            ].map((item, i) => (
              <FormField key={item.label} label={item.label} id={`place_points_${i + 1}`}>
                <input
                  id={`place_points_${i + 1}`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="1000"
                  step="any"
                  className="form-input"
                  value={placePoints[i]}
                  onChange={(e) => setPlacePoints((p) => p.map((v, j) => (j === i ? e.target.value : v)))}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '2px' }}>
                  สูจิบัตร: {item.std} คะแนน
                </div>
              </FormField>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <button
              type="button"
              onClick={() => setPlacePoints(['30', '25', '20', '15'])}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
              }}
            >
              <RotateCcw size={14} /> คืนค่าตามสูจิบัตร (30 - 25 - 20 - 15)
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!values || saving}
              style={{ minHeight: 42, minWidth: 130 }}
            >
              {saving ? 'กำลังบันทึก…' : 'บันทึกคะแนน'}
            </button>
          </div>
        </form>

        {/* 11 sports & Forfeit criteria details collapsible */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)' }}>
          <details style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>
            <summary
              style={{
                cursor: 'pointer',
                fontWeight: 700,
                color: 'var(--text)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <BookOpen size={15} style={{ color: 'var(--accent-text)' }} />
              <span>ดูเกณฑ์ 11 รายการแข่งขัน & ผลคะแนนกรณีปรับแพ้ (ตามสูจิบัตร)</span>
            </summary>
            <div
              style={{
                marginTop: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                paddingLeft: '0.5rem',
              }}
            >
              <div>
                <strong style={{ color: 'var(--text)' }}>
                  11 รายการที่นำมาคิดคะแนน (คะแนนดิบเต็ม 330 คะแนน):
                </strong>
                <ul style={{ margin: '0.3rem 0 0 1.25rem', padding: 0, lineHeight: 1.6 }}>
                  <li>ฟุตซอล (2 รายการ): ชาย, หญิง — เต็ม 60 คะแนนดิบ</li>
                  <li>วอลเลย์บอล (2 รายการ): ชาย, หญิง — เต็ม 60 คะแนนดิบ</li>
                  <li>เซปักตะกร้อ (2 รายการ): ชาย, หญิง — เต็ม 60 คะแนนดิบ</li>
                  <li>บาสเกตบอล (2 รายการ): ชาย, หญิง — เต็ม 60 คะแนนดิบ</li>
                  <li>เปตอง (3 รายการ): คู่ชาย, คู่หญิง, คู่ผสม — เต็ม 90 คะแนนดิบ</li>
                </ul>
              </div>
              <div>
                <strong style={{ color: 'var(--text)' }}>ผลคะแนนกรณีปรับแพ้ (ทีมชนะ – ทีมแพ้):</strong>
                <ul style={{ margin: '0.3rem 0 0 1.25rem', padding: 0, lineHeight: 1.6 }}>
                  <li>
                    ฟุตซอล: <strong>3 – 0</strong> ประตู
                  </li>
                  <li>
                    วอลเลย์บอล: <strong>2 – 0</strong> เซต (25 – 0, 25 – 0)
                  </li>
                  <li>
                    เซปักตะกร้อ: <strong>2 – 0</strong> เซต (15 – 0, 15 – 0)
                  </li>
                  <li>
                    บาสเกตบอล: <strong>20 – 0</strong> คะแนน
                  </li>
                  <li>
                    เปตอง: <strong>11 – 0</strong> คะแนน (รอบชิงชนะเลิศ <strong>13 – 0</strong> คะแนน)
                  </li>
                </ul>
              </div>
              <div>
                <strong style={{ color: 'var(--text)' }}>
                  การตัดสินกรณีคะแนนสะสมเท่ากัน (สูจิบัตร ข้อ 3):
                </strong>
                <p style={{ margin: '0.2rem 0 0', lineHeight: 1.5 }}>
                  หากคะแนนรวมเท่ากัน ให้พิจารณาจำนวนถ้วยรางวัลชนะเลิศมากกว่าเป็นผู้ชนะ
                  หากยังเท่ากันให้พิจารณาจำนวนถ้วยรางวัลรองชนะเลิศอันดับที่ 1 และรองชนะเลิศอันดับที่ 2
                  ตามลำดับ
                </p>
              </div>
            </div>
          </details>
        </div>
      </GlassCard>

      {/* Departments on the home page */}
      <GlassCard style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
          แสดงสาขาในแต่ละสีบนหน้าแรก
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', margin: '0.3rem 0 0.85rem' }}>
          เปิดเมื่อจับคู่สาขา–สีในหน้า &ldquo;จับคู่สาขาและสี&rdquo; ถูกต้องครบแล้ว
        </p>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
            color: 'var(--text-2)',
            minHeight: 44,
          }}
        >
          <input
            type="checkbox"
            checked={showDepartments}
            disabled={!values || saving}
            onChange={(e) => {
              setShowDepartments(e.target.checked);
              save('show_departments_public', e.target.checked);
            }}
            style={{ width: 20, height: 20 }}
          />
          แสดงบนหน้าแรก
        </label>
      </GlassCard>

      {/* 3. Live Scoring Emergency Switch */}
      <GlassCard style={{ padding: '1.25rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>ระบบลงคะแนนสด</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', margin: '0.3rem 0 0.85rem' }}>
          สวิตช์ฉุกเฉิน: ปิดแล้วกรรมการและเจ้าหน้าที่จะลงคะแนนไม่ได้ทันที (ได้ข้อความแจ้งบนหน้าจอ)
          ส่วนผู้ดูแลระบบยังแก้ไขได้ตามปกติ — ถ้าต้องหยุดเฉพาะบางคน ให้ปิด PIN รายตัวในหน้า PIN กรรมการแทน
        </p>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
            color: 'var(--text-2)',
          }}
        >
          <input
            type="checkbox"
            checked={liveEnabled}
            disabled={!values || saving}
            onChange={(e) => {
              setLiveEnabled(e.target.checked);
              save('live_scoring_enabled', e.target.checked);
            }}
          />
          เปิดใช้งาน
        </label>
      </GlassCard>
    </div>
  );
}
