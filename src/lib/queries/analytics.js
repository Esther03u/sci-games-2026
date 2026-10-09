import { summarizePageViews } from '@/lib/analytics-summary';

const PAGE = 1000; // PostgREST returns at most 1000 rows per request

/**
 * Every spectator page view (admin / staff pages excluded in the query),
 * fetched in pages — a single select stops at 1000 rows, which made
 * /admin/analytics report "1000 ครั้ง" no matter how much traffic there was.
 * Only the columns the summary needs are read.
 */
export async function loadAnalytics(sb) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from('page_views')
      .select('page_path, device_type, visitor_hash, created_at')
      .not('page_path', 'like', '/admin%')
      .not('page_path', 'like', '/staff%')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return { summary: summarizePageViews(rows) };
}
