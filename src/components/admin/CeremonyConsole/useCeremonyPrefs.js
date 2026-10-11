'use client';
import { useMemo, useState, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'sci_games_ceremony_settings_v1';
const noopSubscribe = () => () => {};
const readSaved = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};
const serverSaved = () => null;

function parse(raw) {
  try {
    return raw ? JSON.parse(raw) || {} : {};
  } catch {
    return {};
  }
}

/**
 * The console's saved choices (order preset, custom order, 4th place, font size).
 * localStorage is read with useSyncExternalStore so SSR and hydration render the
 * defaults (no React error #418); changes made in this visit win over the saved ones.
 * `update(patch, { save })` — `save` writes all four choices back.
 */
export function useCeremonyPrefs(defaultKeys) {
  const raw = useSyncExternalStore(noopSubscribe, readSaved, serverSaved);
  const saved = useMemo(() => parse(raw), [raw]);
  const [edits, setEdits] = useState({});

  const prefs = {
    orderPreset: edits.orderPreset ?? (saved.orderPreset || 'official'),
    customKeys: edits.customKeys ?? (saved.customKeys || defaultKeys),
    includeFourthPlace: edits.includeFourthPlace ?? saved.includeFourthPlace ?? false,
    fontSize: edits.fontSize ?? (saved.fontSize || 'medium'),
  };

  const update = (patch, { save = false } = {}) => {
    setEdits((e) => ({ ...e, ...patch }));
    if (!save) return;
    const next = { ...prefs, ...patch };
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          customKeys: next.customKeys,
          orderPreset: next.orderPreset,
          includeFourthPlace: next.includeFourthPlace,
          fontSize: next.fontSize,
        })
      );
    } catch {}
  };

  return [prefs, update];
}
