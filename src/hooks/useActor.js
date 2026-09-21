'use client';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Who is using the staff UI: admin / staff (Supabase session) or a PIN
 * referee (httpOnly cookie). Resolved server-side by /api/auth/me so the
 * client never sees the PIN token.
 *
 * actor: { type:'admin'|'staff'|'pin', label, sportIds: '*'|[uuid], adminUserId } | null
 */
export function useActor() {
  const [actor, setActor] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchActor = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const json = await res.json();
      return json.data ?? null;
    } catch {
      return null;
    }
  }, []);

  // Re-checks the session. Sets loading first so guards that redirect on
  // "!loading && !actor" wait for the answer instead of acting on stale state.
  const refresh = useCallback(async () => {
    setLoading(true);
    const next = await fetchActor();
    setActor(next);
    setLoading(false);
  }, [fetchActor]);

  useEffect(() => {
    let active = true;
    fetchActor().then((next) => {
      if (!active) return;
      setActor(next);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [fetchActor]);

  const signOut = useCallback(async () => {
    if (actor?.type === 'pin') {
      await fetch('/api/pin/logout', { method: 'POST' }).catch(() => {});
    } else {
      await createClient().auth.signOut();
    }
    setActor(null);
  }, [actor]);

  const canScoreSport = useCallback(
    (sportId) => {
      if (!actor) return false;
      if (actor.sportIds === '*') return true;
      return Array.isArray(actor.sportIds) && actor.sportIds.includes(sportId);
    },
    [actor]
  );

  return {
    actor,
    loading,
    refresh,
    signOut,
    canScoreSport,
    isAdmin: actor?.type === 'admin',
    isPin: actor?.type === 'pin',
  };
}
