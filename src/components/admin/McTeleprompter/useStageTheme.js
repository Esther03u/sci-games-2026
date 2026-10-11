'use client';
import { useState, useSyncExternalStore } from 'react';

// The saved stage theme is client-only: read it with useSyncExternalStore so SSR and
// hydration both render the light theme (no React error #418).
const THEME_KEY = 'sci_games_mc_theme';
const noopSubscribe = () => () => {};
const readSavedTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};
const serverTheme = () => 'light';

/** ['light' | 'dark', toggle] — default light (โหมดสว่าง อ่านง่ายชัดเจน); a toggle wins over the saved one. */
export function useStageTheme() {
  const savedTheme = useSyncExternalStore(noopSubscribe, readSavedTheme, serverTheme);
  const [themeOverride, setThemeOverride] = useState(null);
  const stageTheme = themeOverride || savedTheme;

  const toggle = () => {
    const next = stageTheme === 'light' ? 'dark' : 'light';
    setThemeOverride(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
  };
  return [stageTheme, toggle];
}
