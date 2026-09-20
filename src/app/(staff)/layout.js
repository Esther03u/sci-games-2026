'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Timer, Shield } from '@/components/animate-ui/icons';

export default function StaffLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading, signOut, adminUser } = useAuth();
  const isLoginPage = pathname === '/staff/login';

  useEffect(() => {
    if (!loading && !isLoginPage) {
      if (!user) {
        router.push('/staff/login');
      } else if (role !== 'staff' && role !== 'super_admin') {
        router.push('/');
      }
    }
  }, [loading, user, role, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fbbf24',
        }}
      >
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Mobile Staff Header */}
      <header
        style={{
          height: '3.75rem',
          background: 'rgba(20, 20, 24, 0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.25rem',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Timer size={22} style={{ color: '#fbbf24' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fbbf24' }}>
              เจ้าหน้าที่สนาม (Staff)
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
              {adminUser?.display_name || 'ผู้บันทึกคะแนน'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {role === 'super_admin' && (
            <Link
              href="/admin"
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Shield size={13} /> Admin
            </Link>
          )}
          <button
            onClick={() => signOut().then(() => router.push('/staff/login'))}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', color: '#fca5a5' }}
          >
            ออก
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1rem' }}>{children}</main>
    </div>
  );
}
