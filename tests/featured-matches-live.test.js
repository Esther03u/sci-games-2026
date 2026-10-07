import { describe, it, expect } from 'vitest';
import { pickFeaturedMatches } from '@/lib/featured-matches';

describe('Featured matches live progression', () => {
  const sports = [{ id: 'futsal' }, { id: 'volley' }];

  it('automatically promotes newly live match to top priority', () => {
    const futsalUpcoming = {
      id: 'f1',
      sport_id: 'futsal',
      status: 'upcoming',
      match_date: '2026-10-09',
      match_time: '17:00:00',
    };
    const volleyUpcoming = {
      id: 'v1',
      sport_id: 'volley',
      status: 'upcoming',
      match_date: '2026-10-09',
      match_time: '17:00:00',
    };

    const initial = pickFeaturedMatches([futsalUpcoming, volleyUpcoming], sports);
    expect(initial[0].id).toBe('f1');

    // When volley becomes live
    const volleyLive = { ...volleyUpcoming, status: 'live' };
    const updated = pickFeaturedMatches([futsalUpcoming, volleyLive], sports);

    // Live matches are always ordered first
    expect(updated[0].id).toBe('v1');
    expect(updated[0].status).toBe('live');
  });
});
