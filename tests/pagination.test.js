import { describe, expect, it } from 'vitest';
import { pageItems, paginate } from '@/lib/pagination';

const list = Array.from({ length: 406 }, (_, i) => i + 1);

describe('paginate', () => {
  it('20 per page with the shown range', () => {
    const p = paginate(list, 3, 20);
    expect(p.rows).toHaveLength(20);
    expect(p.rows[0]).toBe(41);
    expect(p).toMatchObject({ page: 3, totalPages: 21, total: 406, from: 41, to: 60 });
  });

  it('last page is partial; out-of-range pages are clamped', () => {
    expect(paginate(list, 21, 20)).toMatchObject({ from: 401, to: 406 });
    expect(paginate(list, 21, 20).rows).toHaveLength(6);
    expect(paginate(list, 99, 20).page).toBe(21);
    expect(paginate(list, 0, 20).page).toBe(1);
    expect(paginate(list, NaN, 20).page).toBe(1);
  });

  it('empty list → one empty page', () => {
    expect(paginate([], 1, 20)).toMatchObject({ rows: [], page: 1, totalPages: 1, total: 0, from: 0, to: 0 });
  });
});

describe('pageItems', () => {
  it('all pages when there are few', () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('first, last and around the current page with gaps', () => {
    expect(pageItems(1, 21)).toEqual([1, 2, 3, 4, '…', 21]);
    expect(pageItems(10, 21)).toEqual([1, '…', 9, 10, 11, '…', 21]);
    expect(pageItems(21, 21)).toEqual([1, '…', 18, 19, 20, 21]);
    expect(pageItems(4, 21)).toEqual([1, 2, 3, 4, 5, '…', 21]);
  });
});
