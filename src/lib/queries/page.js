import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Run a page's data loader with the cookie-scoped server client.
 * On any failure the error is logged and `fallback` is returned, so a
 * transient Supabase problem degrades to an empty page instead of a 500.
 *
 *   const { sports, teams } = await loadPage('admin/pins', async (sb) => ({
 *     sports: rows(await getSports(sb)),
 *   }), { sports: [] });
 */
export async function loadPage(name, loader, fallback) {
  try {
    const sb = await createServerSupabaseClient();
    return { ...fallback, ...(await loader(sb)) };
  } catch (err) {
    console.error(`Error loading ${name}:`, err);
    return fallback;
  }
}
