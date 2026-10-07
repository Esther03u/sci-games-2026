import { describe, it, expect } from 'vitest';
import { generateSummaryEtag } from '../src/lib/data-etag';

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
