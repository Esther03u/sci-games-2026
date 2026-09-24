'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { Home, Medal, Calendar, Megaphone, BookOpen } from '@/components/animate-ui/icons';

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Don't render inside admin or staff routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/staff')) {
    return null;
  }

  const navItems = [
    {
      href: '/',
      label: 'หน้าแรก',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      href: '/schedule',
      label: 'ตารางแข่ง',
      icon: Calendar,
      isActive: pathname === '/schedule',
    },
    {
      href: '/results',
      label: 'ผลการแข่งขัน',
      icon: Medal,
      isActive: pathname === '/results',
    },
    {
      href: '/handbook',
      label: 'สูจิบัตร',
      icon: BookOpen,
      isActive: pathname === '/handbook',
    },
    {
      href: '/news',
      label: 'ข่าวสาร',
      icon: Megaphone,
      isActive: pathname === '/news',
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="เมนูหลักสำหรับมือถือ">
      <div className="mobile-bottom-nav-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-tab-item ${active ? 'active' : ''}`}
              aria-label={item.label}
              title={item.label}
            >
              <motion.div
                className="mobile-tab-icon-wrap"
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                {/* Active elevated pill background */}
                {active && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="mobile-tab-active-pill"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}

                <Icon
                  size={23}
                  className="mobile-tab-icon"
                  style={{
                    color: active ? 'var(--text)' : 'var(--text-muted)',
                    transform: active ? 'scale(1.08)' : 'scale(1)',
                  }}
                />
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
