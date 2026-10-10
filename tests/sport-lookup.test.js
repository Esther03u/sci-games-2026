import { describe, expect, it } from 'vitest';
import { isMatchOfSport, sportOfMatch } from '@/lib/sport-lookup';
import { isSport, sportOf } from '@/components/public/results/filters';
import { findSportFor, sportMatches } from '@/lib/schedule-grid';

const sports = [{ id: 'futsal' }, { id: 'volley' }];

describe('sport-lookup', () => {
  it("exact id; 'all' matches everything; missing ids never match", () => {
    expect(isMatchOfSport({ sport_id: 'futsal' }, 'futsal')).toBe(true);
    expect(isMatchOfSport({ sport_id: 'futsal' }, 'all')).toBe(true);
    expect(isMatchOfSport({ sport_id: 'futsal' }, 'volley')).toBe(false);
    expect(isMatchOfSport({ sport_id: 'sport-futsal' }, 'futsal')).toBe(false);
    expect(isMatchOfSport({ sport_id: null }, 'futsal')).toBe(false);
    expect(isMatchOfSport(null, 'futsal')).toBe(false);
  });

  it('finds the sport row', () => {
    expect(sportOfMatch(sports, { sport_id: 'volley' })).toEqual({ id: 'volley' });
    expect(sportOfMatch(sports, { sport_id: 'x' })).toBeUndefined();
    expect(sportOfMatch(sports, null)).toBeUndefined();
  });

  it('the schedule grid and the results filters use the same rule', () => {
    for (const [m, id] of [
      [{ sport_id: 'futsal' }, 'futsal'],
      [{ sport_id: 'futsal' }, 'volley'],
      [{ sport_id: 'sport-futsal' }, 'futsal'],
    ]) {
      expect(isSport(m, id)).toBe(isMatchOfSport(m, id));
      expect(sportMatches(m, id)).toBe(isMatchOfSport(m, id));
    }
    expect(sportOf(sports, { sport_id: 'futsal' })).toBe(findSportFor({ sport_id: 'futsal' }, sports));
  });
});
