'use client';
import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

/** false during SSR and hydration, true after — for client-only values like the clock. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
