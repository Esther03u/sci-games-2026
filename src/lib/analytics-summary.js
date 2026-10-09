// Aggregates page_views rows for /admin/analytics. Pure, so the counting
// rules are unit-tested (tests/analytics-summary.test.js).

/** Pages the organisers / referees use — not spectator traffic. */
export const isInternalPath = (path = '') => /^\/(admin|staff)(\/|$)/.test(path) || path.startsWith('/api');

/** Calendar day in Thai time (UTC+7, no DST) for an ISO timestamp → 'YYYY-MM-DD' */
export function thaiDate(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * @param {{ page_path?: string, device_type?: string, visitor_hash?: string, created_at?: string }[]} rows
 * @param {{ topN?: number }} [opts]
 */
export function summarizePageViews(rows, { topN = 5 } = {}) {
  const visitors = new Set();
  const devices = { mobile: 0, desktop: 0, tablet: 0 };
  const byDay = new Map();
  const byPath = new Map();
  let totalViews = 0;
  let excluded = 0;

  for (const r of rows || []) {
    const path = r.page_path || '/';
    if (isInternalPath(path)) {
      excluded += 1;
      continue;
    }
    totalViews += 1;
    if (r.visitor_hash) visitors.add(r.visitor_hash);
    const dev = r.device_type in devices ? r.device_type : 'desktop';
    devices[dev] += 1;
    const day = thaiDate(r.created_at);
    if (day) byDay.set(day, (byDay.get(day) || 0) + 1);
    byPath.set(path, (byPath.get(path) || 0) + 1);
  }

  return {
    totalViews,
    uniqueVisitors: visitors.size,
    excludedInternal: excluded,
    devices,
    mobileShare: totalViews ? Math.round((devices.mobile / totalViews) * 100) : 0,
    daily: [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count })),
    topPages: [...byPath.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, topN)
      .map(([path, count]) => ({ path, count })),
  };
}
