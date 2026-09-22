'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // one client per hook instance — stable, so it can be a real dependency below
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!isMounted) return;
        setUser(user);

        if (user) {
          const { data } = await supabase
            .from('admin_users')
            .select('*, staff_sport_assignments(sport_id)')
            .eq('auth_user_id', user.id)
            .single();

          if (isMounted) setAdminUser(data);
        } else {
          if (isMounted) setAdminUser(null);
        }
      } catch (err) {
        console.error('Error fetching user auth session:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data } = await supabase
          .from('admin_users')
          .select('*, staff_sport_assignments(sport_id)')
          .eq('auth_user_id', session.user.id)
          .single();
        if (isMounted) setAdminUser(data);
      } else {
        if (isMounted) setAdminUser(null);
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(
    async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAdminUser(null);
  }, [supabase]);

  return {
    user,
    adminUser,
    role: adminUser?.role || null,
    isAdmin: adminUser?.role === 'super_admin',
    isStaff: adminUser?.role === 'staff',
    assignedSports: adminUser?.staff_sport_assignments?.map((a) => a.sport_id) || [],
    loading,
    signIn,
    signOut,
  };
}
