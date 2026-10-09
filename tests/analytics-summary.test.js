import { describe, expect, it } from 'vitest';
import { isInternalPath, summarizePageViews, thaiDate } from '@/lib/analytics-summary';
import { loadAnalytics } from '@/lib/queries/analytics';

const view = (page_path, created_at, visitor_hash = 'v1', device_type = 'mobile') => ({
  page_path,
  created_at,
  visitor_hash,
  device_type,
});

describe('isInternalPath', () => {
  it('flags admin, staff and api paths only', () => {
    expect(isInternalPath('/admin')).toBe(true);
    expect(isInternalPath('/admin/matches')).toBe(true);
    expect(isInternalPath('/staff/scoring')).toBe(true);
    expect(isInternalPath('/api/track')).toBe(true);
    expect(isInternalPath('/')).toBe(false);
    expect(isInternalPath('/results')).toBe(false);
    expect(isInternalPath('/administration-news')).toBe(false);
  });
});

describe('thaiDate', () => {
  it('uses Thai time (UTC+7): 17:30Z is already the next day', () => {
    expect(thaiDate('2026-10-08T16:59:59Z')).toBe('2026-10-08');
    expect(thaiDate('2026-10-08T17:00:00Z')).toBe('2026-10-09');
    expect(thaiDate('2026-10-09T02:00:00+07:00')).toBe('2026-10-09');
    expect(thaiDate('nope')).toBe(null);
  });
});

describe('summarizePageViews', () => {
  it('counts spectator views only, with Thai-time days, top pages and devices', () => {
    const s = summarizePageViews([
      view('/', '2026-10-08T01:00:00Z', 'a', 'mobile'),
      view('/', '2026-10-08T18:00:00Z', 'b', 'desktop'), // 01:00 on 9 Oct in Thailand
      view('/results', '2026-10-09T03:00:00Z', 'a', 'mobile'),
      view('/admin/matches', '2026-10-09T03:00:00Z', 'admin', 'desktop'),
      view('/staff/scoring', '2026-10-09T03:00:00Z', 'ref', 'mobile'),
      view('/schedule', '2026-10-09T04:00:00Z', 'c', 'weird'),
    ]);
    expect(s.totalViews).toBe(4);
    expect(s.excludedInternal).toBe(2);
    expect(s.uniqueVisitors).toBe(3);
    expect(s.devices).toEqual({ mobile: 2, desktop: 2, tablet: 0 });
    expect(s.mobileShare).toBe(50);
    expect(s.daily).toEqual([
      { date: '2026-10-08', count: 1 },
      { date: '2026-10-09', count: 3 },
    ]);
    expect(s.topPages[0]).toEqual({ path: '/', count: 2 });
  });

  it('is empty (no made-up numbers) when there is no data', () => {
    expect(summarizePageViews([])).toMatchObject({
      totalViews: 0,
      uniqueVisitors: 0,
      mobileShare: 0,
      daily: [],
      topPages: [],
      devices: { mobile: 0, desktop: 0, tablet: 0 },
    });
  });
});

describe('loadAnalytics', () => {
  it('pages past the 1000-row limit and excludes admin / staff in the query', async () => {
    const all = Array.from({ length: 2345 }, (_, i) =>
      view('/', `2026-10-09T0${i % 10}:00:00Z`, `v${i % 300}`)
    );
    const calls = [];
    const sb = {
      from: () => {
        const q = { filters: [] };
        const chain = {
          select: () => chain,
          not: (col, op, val) => (q.filters.push(`${col} not ${op} ${val}`), chain),
          order: () => chain,
          range: async (from, to) => {
            calls.push({ from, to, filters: q.filters });
            return { data: all.slice(from, to + 1), error: null };
          },
        };
        return chain;
      },
    };
    const { summary } = await loadAnalytics(sb);
    expect(summary.totalViews).toBe(2345);
    expect(summary.uniqueVisitors).toBe(300);
    expect(calls.map((c) => c.from)).toEqual([0, 1000, 2000]);
    expect(calls[0].filters).toEqual(['page_path not like /admin%', 'page_path not like /staff%']);
  });
});
