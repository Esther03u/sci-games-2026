'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import FormField from '@/components/ui/FormField';
import Banner from '@/components/ui/Banner';
import { createClient } from '@/lib/supabase/client';
import { Timer } from '@/components/animate-ui/icons';

export default function StaffLoginPage() {
  return (
    <Suspense fallback={null}>
      <StaffLogin />
    </Suspense>
  );
}

function StaffLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetSport = searchParams.get('sport') || '';
  // ?next=/live (from requireViewer) — only same-site paths, never a full URL
  const rawNext = searchParams.get('next') || '';
  const nextPath = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/staff/scoring';

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // PIN login
  const [sports, setSports] = useState([]);
  const [sportId, setSportId] = useState(presetSport);
  const [pin, setPin] = useState('');

  useEffect(() => {
    let active = true;
    createClient()
      .from('sports')
      .select('id, name')
      .order('sort_order')
      .then(({ data }) => {
        if (active && data) setSports(data);
      });
    return () => {
      active = false;
    };
  }, []);

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!sportId) {
      setError('กรุณาเลือกกีฬา');
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError('PIN ต้องเป็นตัวเลข 6 หลัก');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/pin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport_id: sportId, pin }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setError(json.message || 'PIN ไม่ถูกต้อง');
        setPin('');
      } else {
        router.push(nextPath);
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Timer size={44} style={{ color: 'var(--gold-600)' }} />
          </div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--gold-600)',
              marginBottom: '0.25rem',
            }}
          >
            ระบบลงคะแนนสนาม (Staff)
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '0.88rem' }}>
            สำหรับกรรมการและผู้บันทึกคะแนนการแข่งขัน Sci Games 2026
          </p>
        </div>

        <GlassCard style={{ padding: '2rem 1.75rem' }}>
          <Banner kind="error">{error}</Banner>

          <form onSubmit={handlePinSubmit}>
            <FormField label="กีฬาที่ลงคะแนน" required id="pin_sport">
              <select
                id="pin_sport"
                className="form-input"
                value={sportId}
                onChange={(e) => setSportId(e.target.value)}
                required
              >
                <option value="">— เลือกกีฬา —</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="PIN 6 หลัก" required id="pin_code">
              <input
                id="pin_code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="one-time-code"
                className="form-input"
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{
                  fontSize: '1.6rem',
                  letterSpacing: '0.5rem',
                  textAlign: 'center',
                  fontWeight: 700,
                }}
                required
              />
            </FormField>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || pin.length !== 6 || !sportId}
              style={{ width: '100%', marginTop: '1rem', padding: '0.9rem', fontSize: '1.05rem' }}
            >
              {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบด้วย PIN'}
            </button>
            <p
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-3)',
                marginTop: '0.85rem',
                textAlign: 'center',
              }}
            >
              รับ PIN จากผู้ดูแลระบบ · ใช้ได้เฉพาะกีฬาที่ระบุ · หมดอายุอัตโนมัติ
            </p>
          </form>
        </GlassCard>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          <Link href="/" style={{ color: 'var(--text-3)' }}>
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
