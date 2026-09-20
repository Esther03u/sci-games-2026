'use client';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRealtime(table, filter, callback) {
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channelName = `realtime-${table}-${Math.random().toString(36).slice(2, 7)}`;
    const channelConfig = {
      event: '*',
      schema: 'public',
      table,
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', channelConfig, (payload) => {
        if (callback) callback(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, callback]);
}
