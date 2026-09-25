'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Menu, X } from '@/components/animate-ui/icons';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'หน้าแรก' },
    { href: '/schedule', label: 'ตารางแข่ง' },
    { href: '/handbook', label: 'สูจิบัตร' },
    { href: '/results', label: 'ผลการแข่งขัน' },
    { href: '/news', label: 'ข่าวสาร' },
  ];

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div className="container flex-between" style={{ height: '4.25rem', padding: '0 1.25rem' }}>
        {/* Brand */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              textDecoration: 'none',
              color: 'var(--text)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--accent-surface)',
                border: '1px solid var(--accent-border)',
                flexShrink: 0,
              }}
            >
              <Trophy size={20} style={{ color: 'var(--accent-text)' }} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-brand)',
                  fontWeight: 'normal',
                  fontSize: '1.25rem',
                  lineHeight: 1.1,
                  color: 'var(--text)',
                  letterSpacing: '0.03em',
                }}
              >
                Sci Games <span style={{ color: 'var(--accent-text)' }}>2026</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                คณะวิทยาศาสตร์และเทคโนโลยี PKRU
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Desktop Nav */}
        <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  position: 'relative',
                  color: isActive ? 'var(--accent-text)' : 'var(--text-2)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s ease',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbarDesktopActivePill"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '9999px',
                      background: 'var(--accent-surface)',
                      border: '1px solid var(--accent-border)',
                      zIndex: 0,
                    }}
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{link.label}</span>
              </Link>
            );
          })}
          <div style={{ marginLeft: '0.5rem', display: 'flex', alignItems: 'center' }}>
            <ThemeToggle size="sm" />
          </div>
        </nav>

        {/* Mobile App Header Controls */}
        <div className="hide-desktop" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ThemeToggle size="sm" compact />
          <motion.button
            whileTap={{ scale: 0.92 }}
            className="btn btn-secondary btn-sm"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation menu"
            style={{
              padding: '0.45rem 0.65rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isOpen ? <X size={19} /> : <Menu size={19} />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Drawer with smooth slide/fade */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="hide-desktop"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              overflow: 'hidden',
              background: 'var(--bg-elevated)',
              borderBottom: '1px solid var(--border)',
              padding: '1rem 1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  style={{
                    color: isActive ? 'var(--accent-text)' : 'var(--text)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '1rem',
                    padding: '0.5rem 0',
                    textDecoration: 'none',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
            <div
              style={{
                paddingTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>ธีมการแสดงผล</span>
              <ThemeToggle size="sm" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
