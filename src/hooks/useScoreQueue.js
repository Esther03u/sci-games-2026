'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest, NetworkError } from '@/lib/api/client';

export const RETRY_MS = 3000;
export const MAX_RETRIES = 40; // ~2 minutes of retrying before giving up on one tap

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Pure merge rule for applying a server row while optimistic taps may still
 * be in flight: when the queue has drained the server row wins outright;
 * otherwise keep the optimistic scores but pick up everything else
 * (status, sets, timestamps) from the server.
 */
export function mergeServerRow(prev, serverRow, pendingCount) {
  if (!serverRow) return prev;
  if (pendingCount === 0 || !prev) return serverRow;
  return { ...serverRow, score_a: prev.score_a, score_b: prev.score_b };
}

/** Pure optimistic increment (never below zero). */
export function applyOptimistic(prev, team, delta) {
  if (!prev) return prev;
  const key = team === 'a' ? 'score_a' : 'score_b';
  return { ...prev, [key]: Math.max(0, (prev[key] ?? 0) + delta) };
}

/**
 * Serialized, optimistic score queue for the scoring pad.
 *
 * - taps update `match` immediately and are POSTed one at a time in order
 * - NetworkError retries every RETRY_MS (up to MAX_RETRIES) and flips `online`
 * - other errors surface via `onError` and re-sync the row from GET /api/match/:id
 * - the server row is applied only when the queue drains, so a burst of taps
 *   never makes the number jump backwards
 *
 * Returns { pending, online, lastSync, score, run, pendingRef }
 *   score(team, delta)  → queue a +/- tap for `match`
 *   run(fn)             → await an API call, apply its match row, report errors
 */
export function useScoreQueue({ match, setMatch, onError }) {
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [saving, setSaving] = useState(false);
  const queueRef = useRef(Promise.resolve());
  const pendingRef = useRef(0);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // online / offline
  useEffect(() => {
    const update = () => setOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // warn before leaving with unsent taps
  useEffect(() => {
    const handler = (e) => {
      if (pendingRef.current > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const score = useCallback(
    (team, delta) => {
      if (!match) return;
      const matchId = match.id;
      setMatch((prev) => applyOptimistic(prev, team, delta));
      pendingRef.current += 1;
      setPending(pendingRef.current);

      queueRef.current = queueRef.current.then(async () => {
        let serverRow = null;
        let attempt = 0;
        for (;;) {
          try {
            serverRow = await apiRequest('/api/score', { body: { match_id: matchId, team, delta } });
            setLastSync(new Date());
            break;
          } catch (err) {
            if (err instanceof NetworkError && attempt < MAX_RETRIES) {
              attempt += 1;
              setOnline(false);
              await sleep(RETRY_MS);
              continue;
            }
            onErrorRef.current?.(err.message);
            serverRow = await apiRequest(`/api/match/${matchId}`, { method: 'GET' }).catch(() => null);
            break;
          }
        }
        setOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
        pendingRef.current = Math.max(0, pendingRef.current - 1);
        setPending(pendingRef.current);
        if (serverRow) setMatch((prev) => mergeServerRow(prev, serverRow, pendingRef.current));
      });
    },
    [match, setMatch]
  );

  const run = useCallback(
    async (fn) => {
      setSaving(true);
      try {
        const data = await fn();
        if (data) setMatch(data);
        setLastSync(new Date());
        return data;
      } catch (err) {
        onErrorRef.current?.(err.message);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [setMatch]
  );

  return { pending, pendingRef, online, lastSync, saving, score, run };
}
