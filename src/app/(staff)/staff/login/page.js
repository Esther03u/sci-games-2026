'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import FormField from '@/components/ui/FormField';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Timer, AlertTriangle } from '@/components/animate-ui/icons';

export default function StaffLoginPage() {
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
        router.push('/staff/scoring');
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
        padding: '1.25rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Timer size={44} style={{ color: '#fbbf24' }} />
          </div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: '#fbbf24',
              marginBottom: '0.25rem',
            }}
          >
            ระบบลงคะแนนสนาม (Staff)
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem' }}>
            สำหรับกรรมการและผู้บันทึกคะแนนการแข่งขัน Sci Games 2026
          </p>
        </div>

        <GlassCard style={{ padding: '2rem 1.75rem' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#fca5a5',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertTriangle size={14} /> {error}
                </span>
              </div>
            )}

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
        </GlassCard>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.6)' }}>
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
