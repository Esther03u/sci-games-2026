'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import FormField from '@/components/ui/FormField';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Shield } from '@/components/animate-ui/icons';
import Banner from '@/components/ui/Banner';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLogin />
    </Suspense>
  );
}

function AdminLogin() {
  const timedOut = useSearchParams().get('reason') === 'timeout';
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await signIn(email.trim(), password);
      if (signInError) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (data?.user) {
        router.push('/admin');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg-page">
      <div className="lg-box">
        <div className="lg-head">
          <div className="lg-icon">
            <Shield size={44} style={{ color: 'var(--gold-600)' }} />
          </div>
          <h1 className="lg-title">Sci Games Admin</h1>
          <p className="lg-sub">เข้าสู่ระบบสำหรับคณะกรรมการและผู้ดูแลระบบ</p>
        </div>

        <GlassCard style={{ padding: '2rem 2.25rem' }}>
          <form onSubmit={handleSubmit}>
            <Banner kind="error">{error}</Banner>
            {timedOut && !error && (
              <Banner kind="warn">
                เซสชันหมดอายุเนื่องจากไม่มีการใช้งาน 30 นาที กรุณาเข้าสู่ระบบอีกครั้ง
              </Banner>
            )}

            <FormField label="อีเมลผู้ดูแลระบบ" required id="admin_email">
              <input
                id="admin_email"
                type="email"
                className="form-input"
                placeholder="admin@sci-games.pkru.ac.th"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </FormField>

            <FormField label="รหัสผ่าน" required id="admin_password">
              <input
                id="admin_password"
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
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </GlassCard>

        <div className="lg-foot">
          <Link href="/" style={{ color: 'var(--text-3)' }}>
            กลับสู่หน้าเว็บไซต์หลัก Sci Games
          </Link>
        </div>
      </div>
    </div>
  );
}
