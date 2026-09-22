'use client';
import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
  const [theme, setThemeState] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let initialTheme = 'system';
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') {
        initialTheme = stored;
      }
    } catch {
      // ignore
    }
    setThemeState(initialTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateResolved = () => {
      const isDark = initialTheme === 'dark' || (initialTheme === 'system' && mediaQuery.matches);
      setResolvedTheme(isDark ? 'dark' : 'light');
    };
    updateResolved();

    const handleMediaChange = (e) => {
      let curTheme = 'system';
      try {
        const stored = localStorage.getItem('theme');
        if (stored === 'dark' || stored === 'light') curTheme = stored;
      } catch {
        // ignore
      }
      if (curTheme === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    try {
      if (newTheme === 'system') {
        localStorage.removeItem('theme');
        document.documentElement.removeAttribute('data-theme');
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(isDark ? 'dark' : 'light');
      } else {
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        setResolvedTheme(newTheme);
      }
    } catch {
      // ignore
    }
  }, []);

  return {
    theme,
    resolvedTheme,
    setTheme,
    mounted,
  };
}
