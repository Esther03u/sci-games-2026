import { describe, expect, it } from 'vitest';
import { pickFeaturedMatches, thaiToday } from '@/lib/featured-matches';

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
const ids = (list) => list.map((x) => x.id);
const TODAY = '2026-10-10';

describe('pickFeaturedMatches', () => {
  it('shows every live match (several per sport) then the rest of today in time order', () => {
    const liveFutsal1 = m('futsal', 'live', TODAY, '09:00');
    const liveFutsal2 = m('futsal', 'live', TODAY, '09:00', { match_number: 2 });
    const livePet = m('petanque', 'live', TODAY, '08:00');
    const volley11 = m('volley', 'upcoming', TODAY, '11:00');
    const futsal10 = m('futsal', 'upcoming', TODAY, '10:00');
    const tomorrow = m('volley', 'upcoming', '2026-10-11', '09:00');
    const doneToday = m('futsal', 'finished', TODAY, '08:00');
    const picked = pickFeaturedMatches(
      [tomorrow, volley11, liveFutsal2, doneToday, futsal10, livePet, liveFutsal1],
      sports,
      TODAY
    );
    expect(ids(picked)).toEqual(ids([livePet, liveFutsal1, liveFutsal2, futsal10, volley11]));
  });

  it("never shows yesterday's matches still marked upcoming", () => {
    const stale = m('futsal', 'upcoming', '2026-10-09', '18:30');
    const live = m('volley', 'live', TODAY, '10:00');
    expect(ids(pickFeaturedMatches([stale, live], sports, TODAY))).toEqual([live.id]);
  });

  it('same start time → sport order, then match_number', () => {
    const p = m('petanque', 'upcoming', TODAY, '09:00');
    const f2 = m('futsal', 'upcoming', TODAY, '09:00', { match_number: 2 });
    const f1 = m('futsal', 'upcoming', TODAY, '09:00', { match_number: 1 });
    expect(ids(pickFeaturedMatches([p, f2, f1], sports, TODAY))).toEqual([f1.id, f2.id, p.id]);
  });

  it("nothing live and today done → the next match day's programme only", () => {
    const done = m('futsal', 'finished', TODAY, '09:00');
    const d11a = m('volley', 'upcoming', '2026-10-11', '13:00');
    const d11b = m('futsal', 'upcoming', '2026-10-11', '10:00');
    const d12 = m('futsal', 'upcoming', '2026-10-12', '10:00');
    expect(ids(pickFeaturedMatches([d12, d11a, done, d11b], sports, TODAY))).toEqual([d11b.id, d11a.id]);
  });

  it('nothing left to play → latest result of each sport; empty input → empty', () => {
    const old = m('futsal', 'finished', '2026-10-08', '09:00');
    const latest = m('futsal', 'finished', '2026-10-09', '09:00');
    const volley = m('volley', 'finished', '2026-10-09', '10:00');
    const postponed = m('petanque', 'postponed', '2026-10-09', '10:00');
    expect(ids(pickFeaturedMatches([volley, latest, old, postponed], sports, TODAY))).toEqual([
      latest.id,
      volley.id,
    ]);
    expect(pickFeaturedMatches([], sports, TODAY)).toEqual([]);
  });

  it('thaiToday rolls over at 17:00 UTC', () => {
    expect(thaiToday(Date.parse('2026-10-09T16:59:59Z'))).toBe('2026-10-09');
    expect(thaiToday(Date.parse('2026-10-09T17:00:00Z'))).toBe('2026-10-10');
  });
});
