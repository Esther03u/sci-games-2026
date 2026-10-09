'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { claimPageView, getVisitorId } from '@/lib/page-tracking';

function storageOrNull(name) {
  try {
    return window[name];
  } catch {
    return null;
  }
}

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track public and user facing pages, ignore API routes
    if (!pathname || pathname.startsWith('/api')) return;

    // Refreshing or coming back to a page within 30 min in the same tab is not a new view.
    const session = storageOrNull('sessionStorage');
    if (session && !claimPageView(session, pathname)) return;

    const local = storageOrNull('localStorage');
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page_path: pathname,
        screen_width: window.innerWidth,
        visitor_id: local ? getVisitorId(local) : null,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
