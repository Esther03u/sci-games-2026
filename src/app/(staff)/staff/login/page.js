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

  // A QR code / link with ?sport=<uuid> lands referees on the PIN tab.
  const [tab, setTab] = useState(presetSport ? 'pin' : 'account');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Account tab
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // PIN tab
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

  const switchTab = (next) => {
    setTab(next);
    setError('');
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setLoading(true);
    try {
      const { data, error: signInError } = await createClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (data?.user) {
        router.push('/staff/scoring');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

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
        router.push('/staff/scoring');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const tabButton = (key, label) => (
    <button
      type="button"
      onClick={() => switchTab(key)}
      style={{
        flex: 1,
        padding: '0.65rem 0.5rem',
        background: tab === key ? 'rgba(251,191,36,0.18)' : 'transparent',
        border: 'none',
        borderBottom: tab === key ? '2px solid var(--gold-600)' : '2px solid var(--glass-border)',
        color: tab === key ? 'var(--gold-600)' : 'var(--mono-600)',
        fontWeight: 700,
        fontSize: '0.95rem',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

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
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--gold-600)', marginBottom: '0.25rem' }}>
            ระบบลงคะแนนสนาม (Staff)
          </h1>
          <p style={{ color: 'var(--mono-700)', fontSize: '0.88rem' }}>
            สำหรับกรรมการและผู้บันทึกคะแนนการแข่งขัน Sci Games 2026
          </p>
        </div>

        <GlassCard style={{ padding: '0 0 2rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', marginBottom: '1.5rem' }}>
            {tabButton('pin', 'รหัส PIN กรรมการ')}
            {tabButton('account', 'บัญชี Staff')}
          </div>

          <div style={{ padding: '0 1.75rem' }}>
            <Banner kind="error">{error}</Banner>

            {tab === 'pin' ? (
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
                    style={{ fontSize: '1.6rem', letterSpacing: '0.5rem', textAlign: 'center', fontWeight: 700 }}
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
                <p style={{ fontSize: '0.78rem', color: 'var(--mono-500)', marginTop: '0.85rem', textAlign: 'center' }}>
                  รับ PIN จากผู้ดูแลระบบ · ใช้ได้เฉพาะกีฬาที่ระบุ · หมดอายุอัตโนมัติ
                </p>
              </form>
            ) : (
              <form onSubmit={handleAccountSubmit}>
                <FormField label="อีเมล Staff" required id="staff_email">
                  <input
                    id="staff_email"
                    type="email"
                    className="form-input"
                    placeholder="staff@sci-games.pkru.ac.th"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </FormField>

                <FormField label="รหัสผ่าน" required id="staff_password">
                  <input
                    id="staff_password"
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </FormField>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }}
                >
                  {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบบันทึกคะแนน'}
                </button>
              </form>
            )}
          </div>
        </GlassCard>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          <Link href="/" style={{ color: 'var(--mono-600)' }}>
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
