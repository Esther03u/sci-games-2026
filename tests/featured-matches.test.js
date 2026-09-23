import { describe, expect, it } from 'vitest';
import { pickFeaturedMatches } from '@/lib/featured-matches';

const sports = [{ id: 'futsal' }, { id: 'volley' }, { id: 'petanque' }];
let n = 0;
const m = (sport_id, status, match_date, match_time, extra = {}) => ({
  id: `m${++n}`,
  sport_id,
  status,
  match_date,
  match_time,
  ...extra,
});

describe('pickFeaturedMatches', () => {
  it('picks one match per sport: live, else next upcoming, else latest finished', () => {
    const live = m('futsal', 'live', '2026-10-09', '18:00:00');
    const futsalNext = m('futsal', 'upcoming', '2026-10-09', '17:30:00');
    const volleyFirst = m('volley', 'upcoming', '2026-10-09', '17:30:00');
    const volleyLater = m('volley', 'upcoming', '2026-10-10', '10:00:00');
    const petOld = m('petanque', 'finished', '2026-10-09', '17:30:00');
    const petNew = m('petanque', 'finished', '2026-10-10', '09:00:00');
    const picked = pickFeaturedMatches([volleyLater, petOld, futsalNext, live, volleyFirst, petNew], sports);
    expect(picked.map((x) => x.id)).toEqual([live.id, volleyFirst.id, petNew.id]);
  });

  it('orders live before upcoming before finished, then by sport order', () => {
    const a = m('futsal', 'finished', '2026-10-09', '17:30:00');
    const b = m('volley', 'upcoming', '2026-10-09', '17:30:00');
    const c = m('petanque', 'live', '2026-10-09', '17:30:00');
    expect(pickFeaturedMatches([a, b, c], sports).map((x) => x.id)).toEqual([c.id, b.id, a.id]);
  });

  it('covers every sport even when they all start at the same time (was limit(4))', () => {
    const five = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }));
    const matches = five.map((s) => m(s.id, 'upcoming', '2026-10-09', '17:30:00'));
    expect(pickFeaturedMatches(matches, five)).toHaveLength(5);
  });

  it('skips postponed-only sports and sports with no matches; tie on time → match_number', () => {
    const p = m('futsal', 'postponed', '2026-10-09', '17:30:00');
    const second = m('volley', 'upcoming', '2026-10-09', '17:30:00', { match_number: 2 });
    const first = m('volley', 'upcoming', '2026-10-09', '17:30:00', { match_number: 1 });
    expect(pickFeaturedMatches([p, second, first], sports).map((x) => x.id)).toEqual([first.id]);
    expect(pickFeaturedMatches([], sports)).toEqual([]);
  });
});
