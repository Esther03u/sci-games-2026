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
export function useActor(initialActor = null) {
  const [actor, setActor] = useState(initialActor);
  const [loading, setLoading] = useState(!initialActor);
  const [kicked, setKicked] = useState(false);

  const fetchActor = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const json = await res.json();
      return { actor: json.data ?? null, kicked: Boolean(json.kicked) };
    } catch {
      return { actor: null, kicked: false };
    }
  }, []);

  // Re-checks the session. Sets loading first so guards that redirect on
  // "!loading && !actor" wait for the answer instead of acting on stale state.
  const refresh = useCallback(async () => {
    setLoading(true);
    const { actor: next, kicked: isKicked } = await fetchActor();
    setActor(next);
    setKicked(isKicked);
    setLoading(false);
  }, [fetchActor]);

  useEffect(() => {
    let active = true;
    fetchActor().then(({ actor: next, kicked: isKicked }) => {
      if (!active) return;
      setActor(next);
      setKicked(isKicked);
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
    setKicked(false);
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
    kicked,
    refresh,
    signOut,
    canScoreSport,
    isAdmin: actor?.type === 'admin',
    isPin: actor?.type === 'pin',
  };
}
