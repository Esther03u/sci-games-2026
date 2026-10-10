import { describe, it, expect } from 'vitest';
import { generateSummaryEtag, generateCeremonyEtag } from '../src/lib/data-etag';

describe('generateSummaryEtag', () => {
  const sampleData = {
    matches: [
      {
        id: 'm1',
        sport_id: 'futsal',
        status: 'upcoming',
        score_a: 0,
        score_b: 0,
        match_date: '2026-10-08',
        match_time: '17:00',
        court: '1',
      },
      {
        id: 'm2',
        sport_id: 'futsal',
        status: 'finished',
        score_a: 3,
        score_b: 2,
        match_date: '2026-10-08',
        match_time: '18:00',
        court: '1',
      },
    ],
    sports: [{ id: 'futsal', name: 'ฟุตซอล' }],
    teams: [{ id: 't1', name: 'สีแดง' }],
  };

  it('produces a deterministic weak ETag string', () => {
    const etag1 = generateSummaryEtag(sampleData);
    const etag2 = generateSummaryEtag(sampleData);

    expect(etag1).toMatch(/^W\/"[a-f0-9]+"$/);
    expect(etag1).toBe(etag2);
  });

  it('changes ETag when match score or status changes', () => {
    const originalEtag = generateSummaryEtag(sampleData);

    const modifiedData = {
      ...sampleData,
      matches: [
        {
          ...sampleData.matches[0],
          status: 'live',
          score_a: 1,
        },
        sampleData.matches[1],
      ],
    };

    const newEtag = generateSummaryEtag(modifiedData);
    expect(newEtag).not.toBe(originalEtag);
  });

  it('changes ETag when match court, time, or date changes', () => {
    const originalEtag = generateSummaryEtag(sampleData);

    const rescheduledData = {
      ...sampleData,
      matches: [
        {
          ...sampleData.matches[0],
          match_time: '17:30',
        },
        sampleData.matches[1],
      ],
    };

    const newEtag = generateSummaryEtag(rescheduledData);
    expect(newEtag).not.toBe(originalEtag);
  });
});

describe('generateCeremonyEtag', () => {
  const sampleCeremony = {
    events: [
      {
        key: 'futsal|ชาย',
        sport_id: 'futsal',
        category: 'ชาย',
        done: false,
        places: [],
      },
    ],
    standings: [
      {
        id: 'red',
        rank: 1,
        total_points: 100,
        raw_points: 100,
        golds: 2,
        silvers: 1,
        bronzes: 0,
      },
    ],
    sports: [{ id: 'futsal', name: 'ฟุตซอล', sort_order: 1 }],
    teams: [{ id: 'red', name: 'สีแดง', sort_order: 1 }],
  };

  it('produces a deterministic weak ETag string', () => {
    const etag1 = generateCeremonyEtag(sampleCeremony);
    const etag2 = generateCeremonyEtag(sampleCeremony);

    expect(etag1).toMatch(/^W\/"[a-f0-9]+"$/);
    expect(etag1).toBe(etag2);
  });

  it('changes ETag when an event places or done status changes', () => {
    const original = generateCeremonyEtag(sampleCeremony);
    const updated = {
      ...sampleCeremony,
      events: [
        {
          ...sampleCeremony.events[0],
          done: true,
          places: [{ place: 1, team_id: 'red' }],
        },
      ],
    };

    const newEtag = generateCeremonyEtag(updated);
    expect(newEtag).not.toBe(original);
  });

  it('changes ETag when standings points or medals change', () => {
    const original = generateCeremonyEtag(sampleCeremony);
    const updated = {
      ...sampleCeremony,
      standings: [
        {
          ...sampleCeremony.standings[0],
          total_points: 140,
          golds: 3,
        },
      ],
    };

    const newEtag = generateCeremonyEtag(updated);
    expect(newEtag).not.toBe(original);
  });

  it('returns empty weak ETag when data is null or empty', () => {
    expect(generateCeremonyEtag(null)).toBe('W/"empty"');
  });
});
