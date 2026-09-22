// Shared bootstrap for the maintenance scripts: reads .env.local (never
// committed) and builds Supabase clients. Import from scripts/*.mjs only.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

export function loadEnv(file = resolve(process.cwd(), '.env.local')) {
  if (!existsSync(file)) {
    throw new Error(`${file} not found — copy .env.local.example and fill in the Supabase keys`);
  }
  const env = Object.fromEntries(
    readFileSync(file, 'utf8')
      .split('\n')
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
  for (const k of [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]) {
    if (!env[k]) throw new Error(`${k} missing in .env.local`);
  }
  return env;
}

export function projectRef(env) {
  return env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\./)?.[1] || '?';
}

/** Service-role client — bypasses RLS. */
export function adminClient(env = loadEnv()) {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Anon client — same rights as a spectator's browser. */
export function anonClient(env = loadEnv()) {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}
