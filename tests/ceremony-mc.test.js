// tests/ceremony-mc.test.js
import { describe, expect, it } from 'vitest';
import {
  CHRONOLOGICAL_EVENT_KEYS,
  formatGrandFinale,
  formatMcCallouts,
  hasEmoji,
  orderEvents,
} from '@/lib/ceremony';

const sampleSports = [
  { id: 'futsal', name: 'ฟุตซอล', scoring_type: 'points', sort_order: 1 },
  { id: 'volley', name: 'วอลเลย์บอล', scoring_type: 'sets', sort_order: 2 },
];

const sampleTeams = [
  { id: 'team-red', name: 'สีแดง', color_hex: '#ef4444' },
  { id: 'team-blue', name: 'สีฟ้า', color_hex: '#0284c7' },
  { id: 'team-green', name: 'สีเขียว', color_hex: '#10b981' },
  { id: 'team-purple', name: 'สีม่วง', color_hex: '#8b5cf6' },
];

const teamMap = new Map(sampleTeams.map((t) => [t.id, t]));

const sampleEvents = [
  {
    key: 'futsal|ชาย',
    sport_id: 'futsal',
    sport_name: 'ฟุตซอล',
    category: 'ชาย',
    sort_order: 1,
    places: [
      { place: 1, team_id: 'team-red' },
      { place: 2, team_id: 'team-blue' },
      { place: 3, team_id: 'team-green' },
      { place: 4, team_id: 'team-purple' },
    ],
    done: true,
  },
  {
    key: 'volley|หญิง',
    sport_id: 'volley',
    sport_name: 'วอลเลย์บอล',
    category: 'หญิง',
    sort_order: 2,
    places: [
      { place: 1, team_id: 'team-blue' },
      { place: 2, team_id: 'team-green' },
    ],
    done: false,
  },
];

describe('ceremony logic', () => {
  it('orders events by official sort order by default', () => {
    const ordered = orderEvents(sampleEvents, 'official');
    expect(ordered[0].key).toBe('futsal|ชาย');
    expect(ordered[1].key).toBe('volley|หญิง');
  });

  it('orders events by custom keys array', () => {
    const ordered = orderEvents(sampleEvents, 'custom', ['volley|หญิง', 'futsal|ชาย']);
    expect(ordered[0].key).toBe('volley|หญิง');
    expect(ordered[1].key).toBe('futsal|ชาย');
  });

  it('formats MC callouts in dramatic build-up order: 3rd -> 2nd -> 1st', () => {
    const callouts = formatMcCallouts(sampleEvents[0], teamMap, { includeFourthPlace: false });
    expect(callouts.map((c) => c.place)).toEqual([3, 2, 1]);
    expect(callouts[0].title).toBe('รองชนะเลิศอันดับ 2 (เหรียญทองแดง)');
    expect(callouts[0].teamName).toBe('สีเขียว');
    expect(callouts[2].title).toBe('ชนะเลิศ (เหรียญทอง)');
    expect(callouts[2].teamName).toBe('สีแดง');
  });

  it('includes 4th place when includeFourthPlace is true', () => {
    const callouts = formatMcCallouts(sampleEvents[0], teamMap, { includeFourthPlace: true });
    expect(callouts.map((c) => c.place)).toEqual([4, 3, 2, 1]);
    expect(callouts[0].title).toBe('อันดับที่ 4 (ชมเชย)');
    expect(callouts[0].teamName).toBe('สีม่วง');
  });

  it('formats grand finale standings in 4th -> 3rd -> 2nd -> 1st order', () => {
    const standings = [
      { id: 'team-red', name: 'สีแดง', total_points: 85, rank: 1, golds: 3, silvers: 1, bronzes: 0 },
      { id: 'team-blue', name: 'สีฟ้า', total_points: 75, rank: 2, golds: 2, silvers: 2, bronzes: 1 },
      { id: 'team-green', name: 'สีเขียว', total_points: 60, rank: 3, golds: 1, silvers: 1, bronzes: 2 },
      { id: 'team-purple', name: 'สีม่วง', total_points: 40, rank: 4, golds: 0, silvers: 1, bronzes: 2 },
    ];
    const finale = formatGrandFinale(standings);
    expect(finale.map((f) => f.rank)).toEqual([4, 3, 2, 1]);
    expect(finale[3].isChampion).toBe(true);
    expect(finale[3].teamName).toBe('สีแดง');
  });

  it('guarantees zero emojis in formatted text strings', () => {
    const callouts = formatMcCallouts(sampleEvents[0], teamMap, { includeFourthPlace: true });
    for (const c of callouts) {
      expect(hasEmoji(c.title)).toBe(false);
      expect(hasEmoji(c.teamName)).toBe(false);
    }
  });
});
