'use client';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createClient } from '@/lib/supabase/client';

/** @typedef {import('@/lib/types').LiveData} LiveData */
/** @typedef {import('@/lib/types').Match} Match */
/** @typedef {import('@/lib/types').Sport} Sport */

const BUMP_MS = 3000; // how long the ↑ indicator stays visible
const POLL_MS = 15000; // fallback polling when realtime is not connected
const SPECTATOR_POLL_MS = 30000; // { realtime: false } pages refresh on this interval
const REALTIME_GRACE_MS = 10000; // wait this long for SUBSCRIBED before polling

/**
 * Everything the spectator pages need, kept live.
 *
 * One realtime channel carries three subscriptions:
 *   matches      (INSERT/UPDATE/DELETE) → the scoreboard rows
 *   match_sets   (*)                    → per-set scores for set sports
 *   score_events (INSERT)               → drives the ↑ indicator; only
 *                                         delta > 0 is surfaced (a decrement
 *                                         must not be visible to spectators)
 *
 * If the channel never reaches SUBSCRIBED (free-tier connection cap, flaky
 * network) the hook polls instead, and it always refetches when the tab
 * becomes visible again — phones drop the socket while the screen is off.
 *
 * Returns { sports, teams, matches, setsByMatch, bumps, lastEvents, status, polling, refresh }
 *   bumps: { [matchId]: { team: 'a'|'b', at: epochMs } } for recent increments
 *   lastEvents: latest score_events row per match — only fetched when
 *   `withEvents` is set (admin monitor); realtime inserts still fill it in.
 *
 * @param {Partial<LiveData>} [initial]   server-rendered data; omit to fetch on mount
 * @param {{ withEvents?: boolean, realtime?: boolean, pollMs?: number, publicView?: boolean }} [opts]
 *   publicView: read `matches_public` (live scores masked, migration 007) and
 *   skip match_sets — that is all anon is allowed to see.
 *   realtime: false → no channel at all, just polling. Supabase's free tier
 *   allows 200 concurrent Realtime connections; /results is the page a whole
 *   faculty may open at once and it does not show live scores anyway, so it
 *   polls instead of spending a connection per spectator.
 * @returns {{
 *   sports: Sport[], teams: import('@/lib/types').Team[], matches: Match[],
 *   setsByMatch: import('@/lib/types').SetsByMatch, bumps: import('@/lib/types').Bumps,
 *   lastEvents: Record<string, import('@/lib/types').ScoreEvent>,
 *   status: string, polling: boolean, refresh: () => Promise<void>
 * }}
 */
export function useLiveScores(
  initial = {},
  { withEvents = false, realtime = true, pollMs = SPECTATOR_POLL_MS, publicView = false } = {}
) {
  const [sports, setSports] = useState(initial.sports || []);
  const [teams, setTeams] = useState(initial.teams || []);
  const [matchMap, setMatchMap] = useState(() => new Map((initial.matches || []).map((m) => [m.id, m])));
  const [setsByMatch, setSetsByMatch] = useState(() => groupSets(initial.sets || []));
  const [bumps, setBumps] = useState({});
  // latest score_events row per match (who touched it last) — admin monitor
  const [lastEvents, setLastEvents] = useState(() => latestByMatch(initial.events || []));
  const [status, setStatus] = useState(realtime ? 'CONNECTING' : 'POLLING');
  const [pollingSince, setPollingSince] = useState(null);
  const polling = realtime && status !== 'SUBSCRIBED' && pollingSince !== null;
  const supabaseRef = useRef(null);
  const getSupabase = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  };

  const refresh = useCallback(async () => {
    // Spectator pages read one cached feed instead of querying Supabase per
    // viewer — see /api/live-summary (free-tier egress).
    if (publicView) {
      try {
        // the CDN copy is what makes this cheap; never the browser's own
        const res = await fetch('/api/live-summary', { cache: 'no-store' });
        const json = await res.json();
        if (!json?.success) throw new Error(json?.message || 'live-summary failed');
        const { sports: sp, teams: tm, matches: mt } = json.data;
        if (sp) setSports(sp);
        if (tm) setTeams(tm);
        if (mt) setMatchMap(new Map(mt.map((m) => [m.id, m])));
      } catch (err) {
        console.error('useLiveScores refresh:', err);
      }
      return;
    }

    const supabase = getSupabase();
    try {
      const [sportsRes, teamsRes, matchesRes, setsRes, eventsRes] = await Promise.all([
        supabase.from('sports').select('*').order('sort_order'),
        supabase.from('teams').select('*').order('sort_order'),
        supabase
          .from(publicView ? 'matches_public' : 'matches')
          .select('*')
          .order('match_date')
          .order('match_time'),
        publicView ? null : supabase.from('match_sets').select('*').order('set_number'),
        withEvents
          ? supabase.from('score_events').select('*').order('created_at', { ascending: false }).limit(300)
          : null,
      ]);
      if (sportsRes.data) setSports(sportsRes.data);
      if (teamsRes.data) setTeams(teamsRes.data);
      if (matchesRes.data) setMatchMap(new Map(matchesRes.data.map((m) => [m.id, m])));
      if (setsRes?.data) setSetsByMatch(groupSets(setsRes.data));
      if (eventsRes?.data) setLastEvents(latestByMatch(eventsRes.data));
    } catch (err) {
      console.error('useLiveScores refresh:', err);
    }
  }, [withEvents, publicView]);

  // initial load (skipped when the server already provided data). The fetch
  // runs in a callback so the state lands asynchronously rather than in the
  // effect body itself.
  useEffect(() => {
    if (initial.matches) return undefined;
    let cancelled = false;
    const load = async () => {
      if (!cancelled) await refresh();
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // realtime channel (skipped on polling-only pages)
  useEffect(() => {
    if (!realtime) return undefined;
    const supabase = getSupabase();
    // In dev StrictMode this effect runs twice; the first channel's CLOSED
    // callback can arrive after the second channel is SUBSCRIBED. Every
    // callback checks `active` so a torn-down channel can't touch state.
    let active = true;
    const channel = supabase
      .channel(`live-scores-${Math.random().toString(36).slice(2, 7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (payload) => {
        if (!active) return;
        setMatchMap((prev) => {
          const next = new Map(prev);
          if (payload.eventType === 'DELETE') next.delete(payload.old.id);
          else next.set(payload.new.id, payload.new);
          return next;
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_sets' }, (payload) => {
        if (!active) return;
        setSetsByMatch((prev) => {
          const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
          const list = (prev[row.match_id] || []).filter((s) => s.id !== row.id);
          if (payload.eventType !== 'DELETE') list.push(row);
          list.sort((a, b) => a.set_number - b.set_number);
          return { ...prev, [row.match_id]: list };
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'score_events' }, (payload) => {
        if (!active) return;
        const ev = payload.new;
        setLastEvents((prev) => ({ ...prev, [ev.match_id]: ev }));
        if (ev.event_type !== 'score' || !(ev.delta > 0) || !ev.team) return;
        setBumps((prev) => ({ ...prev, [ev.match_id]: { team: ev.team, at: Date.now() } }));
      })
      .subscribe((s, err) => {
        if (!active) return;
        if (process.env.NODE_ENV !== 'production') console.log('[live] channel', s, err?.message || '');
        setStatus(s);
      });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [realtime]);

  // expire bumps
  useEffect(() => {
    const ids = Object.keys(bumps);
    if (ids.length === 0) return undefined;
    const t = setTimeout(() => {
      const cutoff = Date.now() - BUMP_MS;
      setBumps((prev) => {
        const next = {};
        for (const [id, b] of Object.entries(prev)) if (b.at > cutoff) next[id] = b;
        return next;
      });
    }, BUMP_MS + 50);
    return () => clearTimeout(t);
  }, [bumps]);

  // polling: the only update path when realtime is off, a fallback otherwise
  useEffect(() => {
    if (realtime && status === 'SUBSCRIBED') return undefined;
    let interval = null;
    const grace = setTimeout(
      () => {
        setPollingSince(Date.now());
        refresh();
        interval = setInterval(refresh, realtime ? POLL_MS : pollMs);
      },
      realtime ? REALTIME_GRACE_MS : 0
    );
    return () => {
      clearTimeout(grace);
      if (interval) clearInterval(interval);
    };
  }, [status, refresh, realtime, pollMs]);

  // refetch when the tab comes back
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

  const matches = useMemo(() => {
    const list = Array.from(matchMap.values());
    list.sort((a, b) => {
      const d = (a.match_date || '').localeCompare(b.match_date || '');
      if (d !== 0) return d;
      return (a.match_time || '').localeCompare(b.match_time || '');
    });
    return list;
  }, [matchMap]);

  return { sports, teams, matches, setsByMatch, bumps, lastEvents, status, polling, refresh };
}

// rows are newest-first; keep the first one seen per match
export function latestByMatch(rows) {
  const out = {};
  for (const e of rows) if (!out[e.match_id]) out[e.match_id] = e;
  return out;
}

export function groupSets(rows) {
  const out = {};
  for (const s of rows) {
    (out[s.match_id] ||= []).push(s);
  }
  for (const list of Object.values(out)) list.sort((a, b) => a.set_number - b.set_number);
  return out;
}

// Helpers shared by the live components ------------------------------------

// A 1-second clock that is 0 during SSR and the hydration render, so the
// server and client markup match; relative times appear after mount.
const clockSubscribers = new Set();
let clockTimer = null;
function subscribeClock(cb) {
  clockSubscribers.add(cb);
  if (!clockTimer) clockTimer = setInterval(() => clockSubscribers.forEach((fn) => fn()), 1000);
  return () => {
    clockSubscribers.delete(cb);
    if (clockSubscribers.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}
const clockNow = () => Math.floor(Date.now() / 1000) * 1000;
export function useClock() {
  return useSyncExternalStore(subscribeClock, clockNow, () => 0);
}

/**
 * Split one sport's matches into the three groups /live shows.
 * @param {Match[]} matches
 * @param {string} sportId
 * @returns {{ live: Match[], upcoming: Match[], finished: Match[] }}
 */
export function matchesForSport(matches, sportId) {
  const live = [];
  const upcoming = [];
  const finished = [];
  for (const m of matches) {
    if (m.sport_id !== sportId) continue;
    if (m.status === 'live') live.push(m);
    else if (m.status === 'finished') finished.push(m);
    else upcoming.push(m);
  }
  finished.sort((a, b) => (b.finished_at || '').localeCompare(a.finished_at || ''));
  return { live, upcoming, finished };
}

/**
 * 'a' | 'b' for a finished match (sets decide for sets sports), else null.
 * @param {Match|null|undefined} match
 * @param {Sport|undefined} sport
 * @returns {import('@/lib/types').TeamSlot|null}
 */
export function matchWinner(match, sport) {
  if (!match || match.status !== 'finished') return null;
  const a = sport?.scoring_type === 'sets' ? match.sets_a : match.score_a;
  const b = sport?.scoring_type === 'sets' ? match.sets_b : match.score_b;
  if (a > b) return 'a';
  if (b > a) return 'b';
  return null;
}

export { relativeTime, fmtRemaining } from '@/lib/format';
export { ROUND_LABEL } from '@/lib/labels';
