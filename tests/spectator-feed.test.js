import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SPECTATOR_FEED, haveMatchesChanged, haveSetsChanged, scoreBumps } from '@/hooks/useLiveScores';
import { generateSummaryEtag } from '@/lib/data-etag';

const map = (rows) => new Map(rows.map((m) => [m.id, m]));

describe('spectator pages do not open Supabase Realtime', () => {
  it('SPECTATOR_FEED polls the cached feed', () => {
    expect(SPECTATOR_FEED).toEqual({ realtime: false, publicView: true, pollMs: 8000 });
  });

  it.each([
    'src/components/public/FeaturedMatchesLive.js',
    'src/components/public/results/ResultsBoard.js',
    'src/components/public/ScheduleGrid/index.js',
    'src/components/public/PodiumCountdown.js',
  ])('%s never asks for realtime: true', (file) => {
    expect(readFileSync(file, 'utf8')).not.toMatch(/realtime:\s*true|\.channel\(/);
  });

  it('/live boards only get a channel for a signed-in viewer', () => {
    for (const file of ['src/app/(public)/live/page.js', 'src/app/(public)/live/[sportId]/page.js']) {
      expect(readFileSync(file, 'utf8')).toMatch(/realtime=\{Boolean\(actor\)\}/);
    }
  });
});

describe('scoreBumps', () => {
  it('flags the side whose score went up in a live match', () => {
    const prev = map([{ id: 'm1', status: 'live', score_a: 3, score_b: 2, current_set: 1 }]);
    expect(
      scoreBumps(prev, [{ id: 'm1', status: 'live', score_a: 4, score_b: 2, current_set: 1 }], 1)
    ).toEqual({
      m1: { team: 'a', at: 1 },
    });
    expect(
      scoreBumps(prev, [{ id: 'm1', status: 'live', score_a: 3, score_b: 3, current_set: 1 }], 1)
    ).toEqual({
      m1: { team: 'b', at: 1 },
    });
  });

  it('ignores undo, a new set resetting points, finished and unknown matches', () => {
    const prev = map([{ id: 'm1', status: 'live', score_a: 3, score_b: 2, current_set: 1 }]);
    expect(scoreBumps(prev, [{ id: 'm1', status: 'live', score_a: 2, score_b: 2, current_set: 1 }])).toEqual(
      {}
    );
    expect(scoreBumps(prev, [{ id: 'm1', status: 'live', score_a: 4, score_b: 0, current_set: 2 }])).toEqual(
      {}
    );
    expect(
      scoreBumps(prev, [{ id: 'm1', status: 'finished', score_a: 4, score_b: 2, current_set: 1 }])
    ).toEqual({});
    expect(scoreBumps(prev, [{ id: 'm2', status: 'live', score_a: 1, score_b: 0 }])).toEqual({});
  });
});

describe('haveSetsChanged', () => {
  const byMatch = { m1: [{ id: 's1', match_id: 'm1', score_a: 25, score_b: 20, status: 'finished' }] };
  it('detects new, removed and changed set rows', () => {
    expect(
      haveSetsChanged(byMatch, [{ id: 's1', match_id: 'm1', score_a: 25, score_b: 20, status: 'finished' }])
    ).toBe(false);
    expect(
      haveSetsChanged(byMatch, [{ id: 's1', match_id: 'm1', score_a: 25, score_b: 21, status: 'finished' }])
    ).toBe(true);
    expect(haveSetsChanged(byMatch, [])).toBe(true);
    expect(
      haveSetsChanged(byMatch, [
        { id: 's1', match_id: 'm1', score_a: 25, score_b: 20, status: 'finished' },
        { id: 's2', match_id: 'm1', score_a: 0, score_b: 0, status: 'live' },
      ])
    ).toBe(true);
  });
});

describe('current_set in the polling diff and ETag', () => {
  const m = { id: 'm1', status: 'live', score_a: 0, score_b: 0, current_set: 1 };
  it('a new set with 0-0 points counts as a change', () => {
    expect(haveMatchesChanged(map([m]), [{ ...m, current_set: 2 }])).toBe(true);
    expect(generateSummaryEtag({ matches: [m] })).not.toBe(
      generateSummaryEtag({ matches: [{ ...m, current_set: 2 }] })
    );
  });

  it('set scores change the ETag', () => {
    const sets = [{ id: 's1', score_a: 25, score_b: 20, status: 'finished' }];
    expect(generateSummaryEtag({ matches: [m], sets })).not.toBe(
      generateSummaryEtag({ matches: [m], sets: [{ ...sets[0], score_b: 23 }] })
    );
  });
});
