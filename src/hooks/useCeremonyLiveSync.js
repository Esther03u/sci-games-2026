'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { haveCeremonyEventsChanged, haveStandingsChanged } from '@/lib/ceremony';

/**
 * Live placements + overall standings for the ceremony screens (/mc, /admin/ceremony).
 * Polls /api/ceremony/live with a conditional ETag and only swaps state when the data
 * really changed; refetches when the tab becomes visible or the device comes back online.
 * `accessKey` is the MC's secret link key — it rides in the query so the CDN never
 * shares that response.
 */
export function useCeremonyLiveSync({ initialEvents, initialStandings, accessKey, intervalMs }) {
  const [events, setEvents] = useState(initialEvents);
  const [standings, setStandings] = useState(initialStandings);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState(() => new Date());

  const etagRef = useRef(null);
  const eventsRef = useRef(events);
  const standingsRef = useRef(standings);

  useEffect(() => {
    eventsRef.current = events;
    standingsRef.current = standings;
  }, [events, standings]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const headers = {};
      if (etagRef.current) headers['If-None-Match'] = etagRef.current;
      const url = accessKey ? `/api/ceremony/live?k=${encodeURIComponent(accessKey)}` : '/api/ceremony/live';
      const res = await fetch(url, { cache: 'no-store', headers });
      if (res.status === 304) {
        // Data unchanged on CDN/server; skip re-render completely
        setLastSync(new Date());
        return;
      }
      const newEtag = res.headers.get('etag');
      if (newEtag) etagRef.current = newEtag;

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const nextEvents = json.data.events;
          const nextStandings = json.data.standings;
          if (nextEvents && haveCeremonyEventsChanged(eventsRef.current, nextEvents)) {
            setEvents(nextEvents);
          }
          if (nextStandings && haveStandingsChanged(standingsRef.current, nextStandings)) {
            setStandings(nextStandings);
          }
          setLastSync(new Date());
        }
      }
    } catch {
      // Ignore network errors gracefully
    } finally {
      setIsRefreshing(false);
    }
  }, [accessKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      refresh();
    }, intervalMs);
    return () => clearInterval(interval);
  }, [refresh, intervalMs]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', refresh);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', refresh);
    };
  }, [refresh]);

  return { events, standings, isRefreshing, lastSync, refresh };
}
