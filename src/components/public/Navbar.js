'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Menu, X } from '@/components/animate-ui/icons';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'หน้าแรก' },
    { href: '/schedule', label: 'ตารางแข่ง' },
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
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid #e4e4e7',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        className="container flex-between"
        style={{ height: '4.25rem', padding: '0 1.25rem' }}
      >
        {/* Brand */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            textDecoration: 'none',
            color: '#09090b',
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
              background: '#fef3c7',
              border: '1px solid #fde68a',
              flexShrink: 0,
            }}
          >
            <Trophy size={20} style={{ color: '#ca8a04' }} />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '1.2rem',
                lineHeight: 1.1,
                color: '#09090b',
                letterSpacing: '-0.01em',
              }}
            >
              Sci Games <span style={{ color: '#ca8a04' }}>2026</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#71717a' }}>
              คณะวิทยาศาสตร์และเทคโนโลยี PKRU
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav
          className="hide-mobile"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive ? '#b45309' : '#52525b',
                  background: isActive ? '#fef3c7' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  border: isActive ? '1px solid #fde68a' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile App Header Controls */}
        <div className="hide-desktop" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation menu"
            style={{ padding: '0.45rem 0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div
          className="hide-desktop"
          style={{
            background: 'rgba(255, 255, 255, 0.98)',
            borderBottom: '1px solid #e4e4e7',
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
                  color: isActive ? '#09090b' : '#52525b',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '1rem',
                  padding: '0.5rem 0',
                  textDecoration: 'none',
                  borderBottom: '1px solid #f4f4f5',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
