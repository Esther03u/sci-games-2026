'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Clock, Menu } from '@/components/animate-ui/icons';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, loading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If on login page, render bare layout
  const isLoginPage = pathname === '/admin/login';

  // Inactivity timeout: 30 minutes
  useEffect(() => {
    if (isLoginPage || !user) return;

    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(
        () => {
          signOut().then(() => router.push('/admin/login?reason=timeout'));
        },
        30 * 60 * 1000
      );
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [isLoginPage, user, signOut, router]);

  // Auth Guard
  useEffect(() => {
    if (!loading && !isLoginPage) {
      if (!user) {
        router.push('/admin/login');
      } else if (!isAdmin) {
        // If logged in as staff trying to access admin
        router.push('/staff/scoring');
      }
    }
  }, [loading, user, isAdmin, isLoginPage, router]);

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
          color: 'var(--gold-600)',
          fontSize: '1.2rem',
        }}
      >
        <div className="animate-spin" style={{ marginBottom: '1rem' }}>
          <Clock size={36} />
        </div>
        <div>กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
        className="admin-main-wrapper"
      >
        {/* Top bar for mobile toggle */}
        <header
          className="hide-desktop"
          style={{
            height: '3.75rem',
            background: 'rgba(20, 20, 24, 0.9)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.25rem',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Menu size={16} /> เมนูจัดการ
          </button>
          <span style={{ fontWeight: 700, color: 'var(--accent)' }}>Sci Admin</span>
        </header>

        <main
          style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}
        >
          {children}
        </main>
      </div>

      <style jsx global>{`
        @media (min-width: 769px) {
          .admin-main-wrapper {
            margin-left: 260px;
          }
        }
      `}</style>
    </div>
  );
}
