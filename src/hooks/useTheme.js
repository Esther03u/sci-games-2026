'use client';
import { useCallback, useSyncExternalStore } from 'react';

// Theme preference lives in localStorage ('dark' | 'light', absent = system)
// and the root layout's inline script applies `data-theme` before paint.
// This hook reads that external state with useSyncExternalStore, so there is
// no setState-in-effect and SSR/hydration render the same 'system'/'light'.

const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
const mediaQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

function readTheme() {
  try {
    const stored = localStorage.getItem('theme');
    return stored === 'dark' || stored === 'light' ? stored : 'system';
  } catch {
    return 'system';
  }
}

function readResolved() {
  const theme = readTheme();
  const isDark = theme === 'dark' || (theme === 'system' && mediaQuery().matches);
  return isDark ? 'dark' : 'light';
}

function subscribe(callback) {
  listeners.add(callback);
  const mq = mediaQuery();
  mq.addEventListener('change', emit);
  window.addEventListener('storage', emit); // theme changed in another tab
  return () => {
    listeners.delete(callback);
    mq.removeEventListener('change', emit);
    window.removeEventListener('storage', emit);
  };
}

const serverTheme = () => 'system';
const serverResolved = () => 'light';
const clientMounted = () => true;
const serverMounted = () => false;

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);
  const resolvedTheme = useSyncExternalStore(subscribe, readResolved, serverResolved);
  // false during SSR + hydration, true after — lets ThemeToggle render a placeholder
  const mounted = useSyncExternalStore(subscribe, clientMounted, serverMounted);

  const setTheme = useCallback((newTheme) => {
    try {
      if (newTheme === 'system') {
        localStorage.removeItem('theme');
        document.documentElement.removeAttribute('data-theme');
      } else {
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    } catch {
      // storage blocked — attribute still applied for this page
    }
    emit();
  }, []);

  return { theme, resolvedTheme, setTheme, mounted };
}
