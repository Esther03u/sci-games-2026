import { createClient } from '@supabase/supabase-js';

/**
 * Anon client with no cookie access, for pages that only read public data.
 * Not touching cookies() keeps the route statically cacheable (ISR) — the
 * cookie-scoped createServerSupabaseClient() forces dynamic rendering.
 */
export function createPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
