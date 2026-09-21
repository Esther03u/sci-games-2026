'use client';
import { useCallback, useEffect, useRef } from 'react';
import { useRealtime } from '@/hooks/useRealtime';

/**
 * Keeps the staff match list fresh and mirrors changes made elsewhere
 * (another device, an admin override) into the match currently being scored.
 *
 * - list: INSERT/UPDATE upsert, DELETE removes
 * - selected match: replaced only when nothing is queued locally, and only
 *   when score/set/status fields actually differ → `onRemoteChange()`
 * - if the selected match is deleted → `onRemoved()`
 *
 * Returns the realtime channel status.
 */
export function useMatchSync({ match, setMatch, setMatches, pendingRef, onRemoteChange, onRemoved }) {
  const matchRef = useRef(match);
  useEffect(() => {
    matchRef.current = match;
  }, [match]);
  const cbRef = useRef({ onRemoteChange, onRemoved });
  useEffect(() => {
    cbRef.current = { onRemoteChange, onRemoved };
  }, [onRemoteChange, onRemoved]);

  const onChange = useCallback(
    (payload) => {
      if (payload.eventType === 'DELETE') {
        setMatches((prev) => prev.filter((m) => m.id !== payload.old.id));
        if (matchRef.current?.id === payload.old.id) cbRef.current.onRemoved?.();
        return;
      }
      const row = payload.new;
      setMatches((prev) => {
        const idx = prev.findIndex((m) => m.id === row.id);
        if (idx === -1) return [...prev, row];
        const next = prev.slice();
        next[idx] = row;
        return next;
      });
      const cur = matchRef.current;
      if (cur && cur.id === row.id && pendingRef.current === 0 && hasScoreChange(cur, row)) {
        setMatch(row);
        cbRef.current.onRemoteChange?.(row);
      }
    },
    [setMatch, setMatches, pendingRef]
  );

  return useRealtime('matches', null, onChange);
}

export function hasScoreChange(a, b) {
  return (
    a.score_a !== b.score_a ||
    a.score_b !== b.score_b ||
    a.sets_a !== b.sets_a ||
    a.sets_b !== b.sets_b ||
    a.status !== b.status ||
    a.current_set !== b.current_set
  );
}

/** Keep the phone screen on while `active` (Wake Lock API; silently no-op elsewhere). */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !navigator.wakeLock) return undefined;
    let lock = null;
    let cancelled = false;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        /* not granted (e.g. low battery) — nothing to do */
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !cancelled) request();
    };
    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
