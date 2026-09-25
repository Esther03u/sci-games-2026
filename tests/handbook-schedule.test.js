import { describe, expect, it } from 'vitest';
import {
  OFFICIAL_MATCHES,
  OFFICIAL_SPORTS,
  OFFICIAL_TEAMS,
  findHandbookSport,
  splitVenueCourt,
} from '@/data/handbook';

// Guards for the official fixtures (final/กำหนดการ69.pdf + สูจิบัตร69).
// Three takraw kick-offs were 30 minutes late once, which put a first-round
// match on the same court at the same time as a third-place match.

const byId = new Map(OFFICIAL_MATCHES.map((m) => [m.id, m]));
const place = (m) => m.court || m.venue;

describe('official fixtures', () => {
  it('has the 44 matches of the handbook, in the documented split', () => {
    expect(OFFICIAL_MATCHES).toHaveLength(44);
    const perSport = {};
    for (const m of OFFICIAL_MATCHES) perSport[m.sport_id] = (perSport[m.sport_id] || 0) + 1;
    expect(perSport).toEqual({
      'sport-futsal': 8,
      'sport-volleyball': 8,
      'sport-takraw': 8,
      'sport-basketball': 8,
      'sport-petanque': 12,
    });
    expect(OFFICIAL_SPORTS).toHaveLength(5);
    expect(OFFICIAL_TEAMS).toHaveLength(4);
  });

  it('runs on the four event days only', () => {
    const days = [...new Set(OFFICIAL_MATCHES.map((m) => m.match_date))].sort();
    expect(days).toEqual(['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']);
  });

  it('never books the same court twice at the same moment', () => {
    const seen = new Map();
    for (const m of OFFICIAL_MATCHES) {
      const key = `${m.match_date} ${m.match_time} @ ${place(m)}`;
      expect(seen.has(key), `${key} — ${m.id} ชนกับ ${seen.get(key)}`).toBe(false);
      seen.set(key, m.id);
    }
  });

  it('starts takraw at 17:30 and runs every 30 minutes', () => {
    const takraw = OFFICIAL_MATCHES.filter((m) => m.sport_id === 'sport-takraw').sort(
      (a, b) => a.match_number - b.match_number
    );
    expect(takraw.map((m) => m.match_time)).toEqual([
      '17:30:00',
      '18:00:00',
      '18:30:00',
      '19:00:00',
      '19:30:00',
      '20:00:00',
      '20:30:00',
      '21:00:00',
    ]);
  });

  it('gives every first-round match a winner and a loser destination', () => {
    const firstRound = OFFICIAL_MATCHES.filter((m) => m.round === 'รอบแรก');
    expect(firstRound).toHaveLength(22); // 4 ต่อกีฬา + เปตอง 6 (3 ประเภท)
    for (const m of firstRound) {
      expect(m.team_a_id, m.id).toBeTruthy();
      expect(m.team_b_id, m.id).toBeTruthy();
      for (const [link, slot] of [
        ['next_match_id', 'next_match_slot'],
        ['loser_next_match_id', 'loser_next_match_slot'],
      ]) {
        const target = byId.get(m[link]);
        expect(target, `${m.id}.${link} → ${m[link]}`).toBeTruthy();
        expect(['a', 'b']).toContain(m[slot]);
        expect(target.category, `${m.id} → ${target.id}`).toBe(m.category);
        expect(target.sport_id).toBe(m.sport_id);
      }
      expect(byId.get(m.next_match_id).round).toBe('ชิงชนะเลิศ');
      expect(byId.get(m.loser_next_match_id).round).toBe('ชิงอันดับ 3');
    }
  });

  it('leaves the final and third-place matches open for the winners', () => {
    const knockout = OFFICIAL_MATCHES.filter((m) => m.round !== 'รอบแรก');
    expect(knockout).toHaveLength(22); // ชิงที่ 1 + ชิงที่ 3 ของทุกประเภท
    for (const m of knockout) {
      expect(m.team_a_id, m.id).toBeNull();
      expect(m.team_b_id, m.id).toBeNull();
    }
  });

  it('fills both slots of every knockout match exactly once', () => {
    const slots = new Map();
    for (const m of OFFICIAL_MATCHES.filter((x) => x.round === 'รอบแรก')) {
      for (const [link, slot] of [
        ['next_match_id', 'next_match_slot'],
        ['loser_next_match_id', 'loser_next_match_slot'],
      ]) {
        const key = `${m[link]}.${m[slot]}`;
        expect(slots.has(key), `${key} ถูกกำหนดซ้ำโดย ${m.id} และ ${slots.get(key)}`).toBe(false);
        slots.set(key, m.id);
      }
    }
    expect(slots.size).toBe(44); // 22 knockout matches × 2 slots
  });
});

describe('splitVenueCourt (seeder → matches.venue / court, migration 010)', () => {
  it('splits petanque into the ground + court, leaves other sports without a court', () => {
    const pet = OFFICIAL_SPORTS.find((s) => s.name === 'เปตอง').id;
    for (const m of OFFICIAL_MATCHES) {
      const { venue, court } = splitVenueCourt(m);
      if (m.sport_id === pet) {
        expect(venue).toBe('สนามเปตอง');
        expect(court).toMatch(/^สนาม [1-4]$/);
      } else {
        expect(court).toBeNull();
        expect(venue).toBe(m.court);
      }
    }
  });

  it('falls back to venue, then TBA', () => {
    expect(splitVenueCourt({ venue: 'โรงยิม' })).toEqual({ venue: 'โรงยิม', court: null });
    expect(splitVenueCourt({})).toEqual({ venue: 'TBA', court: null });
  });
});

describe('findHandbookSport (rules shown in the match modal)', () => {
  it('finds a DB sport row by Thai name and a handbook row by id', () => {
    expect(findHandbookSport({ id: 'some-uuid', name: 'ฟุตซอล' })?.id).toBe('sport-futsal');
    expect(findHandbookSport({ id: 'sport-petanque' })?.name).toBe('เปตอง');
    expect(findHandbookSport({ id: 'x', name: 'ไม่มี' })).toBeNull();
    expect(findHandbookSport(null)).toBeNull();
  });

  it('every sport has a rules summary and a match duration', () => {
    for (const s of OFFICIAL_SPORTS) {
      expect(s.rulesSummary?.length, s.name).toBeGreaterThan(0);
      expect(s.matchDuration, s.name).toBeTruthy();
    }
  });
});
