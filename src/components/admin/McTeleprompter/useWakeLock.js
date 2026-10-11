'use client';
import { useState, useEffect } from 'react';

/** Screen Wake Lock (keep the phone/tablet screen on during the ceremony); true while held. */
export function useWakeLock() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let released = false;
    let lock = null;

    const acquireLock = async () => {
      if (!('wakeLock' in navigator)) return;
      try {
        const next = await navigator.wakeLock.request('screen');
        if (released) {
          next.release().catch(() => {});
          return;
        }
        lock = next;
        setActive(true);
        next.addEventListener('release', () => setActive(false));
      } catch {
        setActive(false);
      }
    };

    acquireLock();

    // the browser drops the lock when the tab is hidden — take it again on return
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') acquireLock();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      released = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      lock?.release().catch(() => {});
    };
  }, []);

  return active;
}
