'use client';
import { useEffect } from 'react';

/**
 * Arrow / PageUp / PageDown (and a presenter clicker, which sends the same keys) turn
 * the page; ignored while typing in a form field. `stage` also takes Space as "next"
 * and stops the browser from scrolling on those keys.
 */
export function usePageKeys(setPage, totalPages, { stage = false } = {}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || (stage && e.key === ' ')) {
        if (stage) e.preventDefault();
        setPage((p) => Math.min(totalPages, p + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (stage) e.preventDefault();
        setPage((p) => Math.max(1, p - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setPage, totalPages, stage]);
}
