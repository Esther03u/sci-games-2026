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
export function useMatchSync({
  match,
  setMatch,
  setMatches,
  pendingRef,
  busyRef,
  onRemoteChange,
  onRemoved,
}) {
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
        if (isStaleRow(row, prev[idx])) return prev;
        const next = prev.slice();
        next[idx] = row;
        return next;
      });
      const cur = matchRef.current;
      // our own taps / actions echo back too (anon can read matches since 015),
      // sometimes late: only a newer row that arrives while nothing of ours is
      // in flight came from elsewhere
      const ownInFlight = pendingRef.current > 0 || (busyRef?.current ?? 0) > 0;
      if (cur && cur.id === row.id && !ownInFlight && !isStaleRow(row, cur) && hasScoreChange(cur, row)) {
        setMatch(row);
        cbRef.current.onRemoteChange?.(row);
      }
    },
    [setMatch, setMatches, pendingRef, busyRef]
  );

  return useRealtime('matches', null, onChange);
}

/**
 * true when `row` is older than what we already show. matches.updated_at is
 * set by the trg_match_points BEFORE UPDATE trigger on every write, so a
 * late Realtime echo of an earlier state must not overwrite a newer one.
 */
export function isStaleRow(row, current) {
  if (!row?.updated_at || !current?.updated_at) return false;
  return new Date(row.updated_at).getTime() < new Date(current.updated_at).getTime();
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
