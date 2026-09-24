'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from '@/components/ui/ThemeToggle';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Clock,
  Building2,
  Megaphone,
  Shield,
  FileText,
  ChartLine,
  X,
  ExternalLink,
  LogOut,
  Radio,
  SlidersHorizontal,
  HardDriveDownload,
} from '@/components/animate-ui/icons';

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { adminUser, signOut } = useAuth();

  const menuItems = [
    { href: '/admin', label: 'ภาพรวมระบบ', icon: <LayoutDashboard size={18} /> },
    { href: '/admin/live', label: 'Live Monitor', icon: <Radio size={18} />, live: true },
    { href: '/admin/audit', label: 'ประวัติการแก้ไข', icon: <FileText size={18} /> },
    { href: '/admin/pins', label: 'PIN กรรมการ', icon: <Shield size={18} /> },
    { href: '/admin/bracket', label: 'สายการแข่งขัน', icon: <Trophy size={18} /> },
    { href: '/admin/athletes', label: 'จัดการนักกีฬา', icon: <Users size={18} /> },
    { href: '/admin/matches', label: 'จัดการผลการแข่ง', icon: <Trophy size={18} /> },
    { href: '/admin/sport-schedules', label: 'กำหนดเวลาแข่ง', icon: <Clock size={18} /> },
    { href: '/admin/departments', label: 'จับคู่สาขาและสี', icon: <Building2 size={18} /> },
    { href: '/admin/news', label: 'ข่าวประชาสัมพันธ์', icon: <Megaphone size={18} /> },
    { href: '/admin/users', label: 'จัดการผู้ดูแล & Staff', icon: <Shield size={18} /> },
    { href: '/admin/pdf', label: 'ส่งออกรายงาน PDF', icon: <FileText size={18} /> },
    { href: '/admin/analytics', label: 'สถิติการเข้าชมเว็บ', icon: <ChartLine size={18} /> },
    { href: '/admin/backup', label: 'สำรองข้อมูล', icon: <HardDriveDownload size={18} /> },
    { href: '/admin/settings', label: 'ตั้งค่าระบบ', icon: <SlidersHorizontal size={18} /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            background: 'var(--overlay)',
            backdropFilter: 'blur(4px)',
          }}
          className="hide-desktop"
        />
      )}

      <aside
        style={{
          width: '260px',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 45,
          background: 'rgba(20, 20, 24, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s ease',
          transform: isOpen ? 'translateX(0)' : undefined,
        }}
        className={isOpen ? '' : 'admin-sidebar-desktop-only'}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Shield size={24} style={{ color: 'var(--accent)' }} />
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: 'var(--accent)',
                }}
              >
                Sci Admin
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>Sci Games Management</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hide-desktop btn btn-secondary btn-sm"
            style={{
              padding: '0.2rem 0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav list */}
        <nav
          style={{
            padding: '1rem 0.75rem',
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  fontSize: '0.92rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--accent)' : 'rgba(255, 255, 255, 0.8)',
                  background: isActive ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.live && <span className="live-dot" style={{ marginLeft: 'auto' }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>
              {adminUser?.display_name || 'ผู้ดูแลระบบ'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#4ade80' }}>
              ● {adminUser?.role === 'super_admin' ? 'Super Admin' : 'Staff'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.65rem' }}>
            <ThemeToggle size="sm" style={{ width: '100%', justifyContent: 'center' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              href="/"
              target="_blank"
              className="btn btn-secondary btn-sm"
              style={{
                flex: 1,
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
              }}
            >
              <ExternalLink size={13} />
              <span>หน้าเว็บ</span>
            </Link>
            <button
              onClick={signOut}
              className="btn btn-secondary btn-sm"
              style={{
                color: '#fca5a5',
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <LogOut size={13} />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
