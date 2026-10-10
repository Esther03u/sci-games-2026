import { describe, expect, it } from 'vitest';
import { computeStandings } from '@/lib/placements';
import {
  barHeight,
  buildRevealTimeline,
  buildTeaser,
  displayScore,
  maskScore,
  eventLabel,
  mockEvents,
  MOCK_EVENT_NAMES,
  teamBreakdown,
} from '@/lib/podium-reveal';

const teams = [
  { id: 'red', name: 'สีแดง', sort_order: 1 },
  { id: 'blue', name: 'สีฟ้า', sort_order: 2 },
  { id: 'green', name: 'สีเขียว', sort_order: 3 },
  { id: 'purple', name: 'สีม่วง', sort_order: 4 },
];
const ev = (key, sport_name, category, order, done = true) => ({
  key,
  sport_id: key,
  sport_name,
  category,
  places: order.map((team_id, i) => ({ place: i + 1, team_id })),
  done,
});
const events = [
  ev('f-m', 'ฟุตซอล', 'ชาย', ['purple', 'green', 'blue', 'red']),
  ev('f-w', 'ฟุตซอล', 'หญิง', ['green', 'purple', 'red', 'blue']),
  ev('v-m', 'วอลเลย์บอล', 'ชาย', ['purple', 'blue'], false), // third-place match not played yet
  ev('b-m', 'บาสเกตบอล', 'ชาย', [], false), // final not played
];

describe('buildRevealTimeline', () => {
  const t = buildRevealTimeline(events, teams);

  it('one step per event with placements, in event order, gains sorted by place', () => {
    expect(t.steps.map((s) => s.label)).toEqual(['ฟุตซอล ชาย', 'ฟุตซอล หญิง', 'วอลเลย์บอล ชาย']);
    expect(t.steps.map((s) => s.index)).toEqual([1, 2, 3]);
    expect(t.steps[0].gains).toEqual([
      { team_id: 'purple', place: 1, points: 30 },
      { team_id: 'green', place: 2, points: 25 },
      { team_id: 'blue', place: 3, points: 20 },
      { team_id: 'red', place: 4, points: 15 },
    ]);
    expect(t.steps[2].gains.map((g) => g.team_id)).toEqual(['purple', 'blue']);
  });

  it('running totals after each step and final totals match computeStandings', () => {
    expect(t.steps[0].totals).toEqual({ red: 15, blue: 20, green: 25, purple: 30 });
    expect(t.steps[1].totals).toEqual({ red: 35, blue: 35, green: 55, purple: 55 });
    expect(t.final).toEqual({ red: 35, blue: 60, green: 55, purple: 85 });
    const standings = computeStandings(events, teams);
    for (const row of standings) expect(t.final[row.id]).toBe(row.raw_points);
    expect(t.eventsDone).toBe(2);
    expect(t.eventsTotal).toBe(11);
  });

  it('custom placement points are used', () => {
    expect(buildRevealTimeline(events, teams, [10, 5, 3, 1]).final.purple).toBe(10 + 5 + 10);
  });

  it('ignores teams that are not in the list and handles no events', () => {
    const odd = [ev('x', 'ฟุตซอล', 'ชาย', ['ghost', 'red'])];
    expect(buildRevealTimeline(odd, teams).steps[0].gains).toEqual([
      { team_id: 'red', place: 2, points: 25 },
    ]);
    expect(buildRevealTimeline([], teams)).toMatchObject({ steps: [], final: { red: 0, purple: 0 } });
  });
});

describe('teamBreakdown', () => {
  it('lists where the points come from and works out the shown total like computeStandings', () => {
    const b = teamBreakdown('purple', events);
    expect(b.rows).toEqual([
      { key: 'f-m', label: 'ฟุตซอล ชาย', place: 1, points: 30 },
      { key: 'f-w', label: 'ฟุตซอล หญิง', place: 2, points: 25 },
      { key: 'v-m', label: 'วอลเลย์บอล ชาย', place: 1, points: 30 },
    ]);
    expect(b.medals).toEqual({ 1: 2, 2: 1, 3: 0, 4: 0 });
    expect(b.raw).toBe(85);
    expect(b.formula).toBe('85 × 100 ÷ 330');
    const row = computeStandings(events, teams).find((r) => r.id === 'purple');
    expect(b.total).toBe(row.total_points);
  });

  it('custom points: shows raw total, no ×100÷330', () => {
    const b = teamBreakdown('purple', events, [10, 5, 3, 1]);
    expect(b.scaled).toBe(false);
    expect(b.total).toBe(25);
    expect(b.formula).toBe(null);
  });

  it('a colour with no placements', () => {
    expect(teamBreakdown('nobody', events)).toMatchObject({ rows: [], raw: 0, total: 0 });
  });
});

describe('barHeight / displayScore / eventLabel', () => {
  it('every bar starts at the same base and the full 330 reaches the top', () => {
    expect(barHeight(0)).toBe(35);
    expect(barHeight(330)).toBe(100);
    expect(barHeight(165)).toBe(67.5);
    expect(barHeight(9999)).toBe(100);
    expect(barHeight(-5)).toBe(35);
  });

  it('scores out of 100 with the handbook points', () => {
    expect(displayScore(85)).toBe(25.76);
    expect(displayScore(25, [10, 5, 3, 1])).toBe(25);
    expect(eventLabel({ sport_name: 'เปตอง', category: 'คู่ผสม' })).toBe('เปตอง คู่ผสม');
  });
});

describe('mockEvents', () => {
  it('11 handbook events, each a full 1st–4th of the four colours; same seed → same result', () => {
    const a = mockEvents(teams, 42);
    expect(a).toHaveLength(MOCK_EVENT_NAMES.length);
    for (const e of a) {
      expect(e.places.map((p) => p.place)).toEqual([1, 2, 3, 4]);
      expect(new Set(e.places.map((p) => p.team_id))).toEqual(new Set(teams.map((t) => t.id)));
    }
    expect(mockEvents(teams, 42)).toEqual(a);
    expect(mockEvents(teams, 7)).not.toEqual(a);
    const sum = Object.values(buildRevealTimeline(a, teams).final).reduce((s, n) => s + n, 0);
    expect(sum).toBe(11 * (30 + 25 + 20 + 15));
  });
});

describe('maskScore / buildTeaser', () => {
  it('hides only the first digit, as ?', () => {
    expect(maskScore(72.36)).toBe('?2.36');
    expect(maskScore(9.09)).toBe('?9.09');
    expect(maskScore(0)).toBe('?0.00');
    expect(maskScore(100)).toBe('?00.00');
    expect(maskScore(245, false)).toBe('?45');
    expect(maskScore(7, false)).toBe('?');
  });

  it('never contains the hidden digit', () => {
    const [row] = buildTeaser([{ id: 'red', total_points: 81.82 }]);
    expect(row).toEqual({ team_id: 'red', masked: '?1.82' });
    expect(buildTeaser([{ id: 'red', total_points: 210 }], [10, 5, 3, 1])[0].masked).toBe('?10');
  });
});
