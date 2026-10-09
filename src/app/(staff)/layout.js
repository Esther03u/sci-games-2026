'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useActor } from '@/hooks/useActor';
import Link from 'next/link';
import { Shield } from '@/components/animate-ui/icons';
import ThemeToggle from '@/components/ui/ThemeToggle';

const ACTOR_TYPE_LABEL = {
  admin: 'ผู้ดูแลระบบ',
  staff: 'เจ้าหน้าที่',
  pin: 'กรรมการ (PIN)',
};

export default function StaffLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { actor, loading, kicked, refresh, signOut, isAdmin } = useActor();
  const isLoginPage = pathname === '/staff/login';

  // This layout is shared by /staff/login and /staff/scoring, so it does not
  // remount after a login. Re-resolve the actor on every route change and only
  // enforce the guard once that check has completed for the current path —
  // otherwise the redirect effect runs in the same commit with stale
  // actor=null and bounces a freshly logged-in user back to the login page.
  const [verifiedPath, setVerifiedPath] = useState(null);
  useEffect(() => {
    let active = true;
    refresh().then(() => {
      if (active) setVerifiedPath(pathname);
    });
    return () => {
      active = false;
    };
  }, [pathname, refresh]);

  useEffect(() => {
    if (verifiedPath === pathname && !loading && !isLoginPage && !actor) {
      if (kicked) {
        router.push('/staff/login?reason=kicked');
      } else {
        router.push('/staff/login');
      }
    }
  }, [verifiedPath, pathname, loading, actor, kicked, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || !actor) {
    return <div className="sl-loading">กำลังโหลด...</div>;
  }

  return (
    <div className="sl-shell">
      {/* Mobile Staff Header */}
      <header className="sl-header">
        <div>
          <div className="sl-brand">
            {actor.type === 'pin' && actor.sportName
              ? `กรรมการ${actor.sportName}`
              : ACTOR_TYPE_LABEL[actor.type] || 'เจ้าหน้าที่สนาม'}
          </div>
          <div className="sl-sub">{actor.label || 'ผู้บันทึกคะแนน'}</div>
        </div>

        <div className="sl-actions">
          <ThemeToggle size="sm" compact />
          {isAdmin && (
            <Link
              href="/admin"
              className="btn btn-secondary btn-sm"
              style={{
                padding: '0.3rem 0.6rem',
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
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

      <main className="staff-main-container">{children}</main>
    </div>
  );
}
