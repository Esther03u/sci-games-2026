'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Subscribe to postgres_changes on one table.
 *
 * The callback is kept in a ref so callers can pass an inline function
 * without re-subscribing on every render. Returns the channel status
 * ('SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED' | 'CONNECTING')
 * so pages can show a fallback/polling indicator.
 */
export function useRealtime(table, filter, callback, { enabled = true } = {}) {
  const callbackRef = useRef(callback);
  const [status, setStatus] = useState('CONNECTING');

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !table) return undefined;

    const supabase = createClient();
    const channelName = `realtime-${table}-${Math.random().toString(36).slice(2, 7)}`;
    const channelConfig = { event: '*', schema: 'public', table };
    if (filter) channelConfig.filter = filter;

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', channelConfig, (payload) => {
        callbackRef.current?.(payload);
      })
      .subscribe((s) => setStatus(s));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, enabled]);

  return status;
}
