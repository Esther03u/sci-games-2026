import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createPublicSupabaseClient } from '@/lib/supabase/public';

async function run(name, makeClient, loader, fallback) {
  try {
    const sb = await makeClient();
    return { ...fallback, ...(await loader(sb)) };
  } catch (err) {
    console.error(`Error loading ${name}:`, err);
    return fallback;
  }
}

/**
 * Run a page's data loader with the cookie-scoped server client.
 * On any failure the error is logged and `fallback` is returned, so a
 * transient Supabase problem degrades to an empty page instead of a 500.
 *
 *   const { sports, teams } = await loadPage('admin/pins', async (sb) => ({
 *     sports: rows(await getSports(sb)),
 *   }), { sports: [] });
 */
export const loadPage = (name, loader, fallback) => run(name, createServerSupabaseClient, loader, fallback);

/**
 * Same, with the cookie-less anon client — for public pages that use
 * `export const revalidate = N` (ISR). Reading cookies would make them dynamic.
 */
export const loadPublicPage = (name, loader, fallback) =>
  run(name, createPublicSupabaseClient, loader, fallback);
