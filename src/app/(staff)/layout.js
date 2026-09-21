'use client';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useActor } from '@/hooks/useActor';
import Link from 'next/link';
import { Timer, Shield } from '@/components/animate-ui/icons';
import ThemeToggle from '@/components/ui/ThemeToggle';

const ACTOR_TYPE_LABEL = {
  admin: 'ผู้ดูแลระบบ',
  staff: 'เจ้าหน้าที่',
  pin: 'กรรมการ (PIN)',
};

export default function StaffLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { actor, loading, refresh, signOut, isAdmin } = useActor();
  const isLoginPage = pathname === '/staff/login';

  // This layout is shared by /staff/login and /staff/scoring, so it does not
  // remount after a login. Re-resolve the actor whenever the route changes.
  const lastPathRef = useRef(pathname);
  useEffect(() => {
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      refresh();
    }
  }, [pathname, refresh]);

  useEffect(() => {
    if (!loading && !isLoginPage && !actor) {
      router.push('/staff/login');
    }
  }, [loading, actor, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || !actor) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gold-600)',
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
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--glass-border)',
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
          <Timer size={22} style={{ color: 'var(--gold-600)' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--gold-600)' }}>
              {ACTOR_TYPE_LABEL[actor.type] || 'เจ้าหน้าที่สนาม'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--mono-600)' }}>
              {actor.label || 'ผู้บันทึกคะแนน'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ThemeToggle size="sm" compact />
          {isAdmin && (
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
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', color: 'var(--danger-text)' }}
          >
            ออก
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1rem' }}>{children}</main>
    </div>
  );
}
