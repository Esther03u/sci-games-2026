'use client';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeToggle({ size = 'md', compact = false, className = '', style = {} }) {
  const { theme, resolvedTheme, setTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div
        className={`theme-toggle-placeholder ${className}`}
        style={{
          width: compact ? (size === 'sm' ? '32px' : '36px') : '96px',
          height: size === 'sm' ? '30px' : '34px',
          borderRadius: '9999px',
          background: 'var(--surface-2, #f4f4f5)',
          ...style,
        }}
      />
    );
  }

  const iconSize = size === 'sm' ? 14 : 16;

  // Single button cycling if compact
  if (compact) {
    const cycleTheme = () => {
      if (theme === 'system') setTheme('light');
      else if (theme === 'light') setTheme('dark');
      else setTheme('system');
    };

    const label =
      theme === 'system'
        ? `ตามระบบ (${resolvedTheme === 'dark' ? 'มืด' : 'สว่าง'})`
        : theme === 'dark'
          ? 'โหมดมืด'
          : 'โหมดสว่าง';

    return (
      <button
        type="button"
        onClick={cycleTheme}
        className={`btn-theme-toggle-compact ${className}`}
        title={`สลับธีม: ${label}`}
        aria-label={`สลับธีม: ${label}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size === 'sm' ? '32px' : '36px',
          height: size === 'sm' ? '32px' : '36px',
          borderRadius: '9999px',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          cursor: 'pointer',
          padding: 0,
          transition: 'all 0.2s ease',
          ...style,
        }}
      >
        {theme === 'system' ? (
          <Monitor size={iconSize} />
        ) : theme === 'dark' ? (
          <Moon size={iconSize} />
        ) : (
          <Sun size={iconSize} />
        )}
      </button>
    );
  }

  // 3-button segmented control
  const options = [
    { key: 'system', icon: Monitor, label: 'ตามระบบ' },
    { key: 'light', icon: Sun, label: 'สว่าง' },
    { key: 'dark', icon: Moon, label: 'มืด' },
  ];

  return (
    <div
      role="group"
      aria-label="เลือกธีมการแสดงผล"
      className={`theme-toggle-segmented ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px',
        borderRadius: '9999px',
        background: 'var(--surface-2, #f4f4f5)',
        border: '1px solid var(--border, #e4e4e7)',
        gap: '2px',
        ...style,
      }}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => setTheme(opt.key)}
            aria-pressed={isActive}
            aria-label={opt.label}
            title={opt.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: size === 'sm' ? '4px 7px' : '5px 9px',
              borderRadius: '9999px',
              border: 'none',
              background: isActive ? 'var(--surface, #ffffff)' : 'transparent',
              color: isActive ? 'var(--text, #09090b)' : 'var(--text-3, #71717a)',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              lineHeight: 1,
            }}
          >
            <Icon size={iconSize} />
          </button>
        );
      })}
    </div>
  );
}
