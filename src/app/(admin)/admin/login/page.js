'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import FormField from '@/components/ui/FormField';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Shield, AlertTriangle } from '@/components/animate-ui/icons';

export default function AdminLoginPage() {
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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Shield size={44} style={{ color: 'var(--gold-600)' }} />
          </div>
          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              background: 'linear-gradient(90deg, var(--gold-600), #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.25rem',
            }}
          >
            Sci Games Admin
          </h1>
          <p style={{ color: 'var(--mono-700)', fontSize: '0.92rem' }}>
            เข้าสู่ระบบสำหรับคณะกรรมการและผู้ดูแลระบบ
          </p>
        </div>

        <GlassCard style={{ padding: '2rem 2.25rem' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#b91c1c',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  fontSize: '0.88rem',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertTriangle size={14} /> {error}
                </span>
              </div>
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

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          <Link href="/" style={{ color: 'var(--mono-600)' }}>
            กลับสู่หน้าเว็บไซต์หลัก Sci Games
          </Link>
        </div>
      </div>
    </div>
  );
}
