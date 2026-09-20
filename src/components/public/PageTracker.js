'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track public and user facing pages, ignore API routes
    if (!pathname || pathname.startsWith('/api')) return;

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page_path: pathname,
        screen_width: typeof window !== 'undefined' ? window.innerWidth : 0,
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
