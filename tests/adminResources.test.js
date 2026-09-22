import { describe, expect, it } from 'vitest';
import { RESOURCES, pickColumns } from '@/lib/api/adminResources';

const U1 = '11111111-1111-1111-1111-111111111111';
const U2 = '22222222-2222-2222-2222-222222222222';
const U3 = '33333333-3333-3333-3333-333333333333';

describe('adminResources.pickColumns', () => {
  const insert = RESOURCES.matches.insert;
  const valid = {
    sport_id: U1,
    team_a_id: U2,
    team_b_id: U3,
    match_date: '2026-10-09',
    match_time: '09:00',
    venue: ' สนาม 1 ',
  };

  it('accepts a full valid insert, trims strings, drops unknown columns', () => {
    const { values, error } = pickColumns(
      insert,
      { ...valid, status: 'live', score_a: 99 },
      { requireAll: true }
    );
    expect(error).toBeUndefined();
    expect(values.venue).toBe('สนาม 1');
    expect(values).not.toHaveProperty('status'); // never writable here
    expect(values).not.toHaveProperty('score_a');
  });

  it('rejects missing required and invalid values', () => {
    const { venue, ...noVenue } = valid;
    expect(pickColumns(insert, noVenue, { requireAll: true }).error).toMatch(/venue/);
    expect(pickColumns(insert, { ...valid, sport_id: 'abc' }, { requireAll: true }).error).toMatch(
      /sport_id/
    );
    expect(pickColumns(insert, { ...valid, match_time: '9am' }, { requireAll: true }).error).toMatch(
      /match_time/
    );
    expect(pickColumns(insert, { ...valid, match_number: 1.5 }, { requireAll: true }).error).toMatch(
      /match_number/
    );
  });

  it('runs the resource validate() hook (same team twice)', () => {
    expect(pickColumns(insert, { ...valid, team_b_id: U2 }, { requireAll: true }).error).toMatch(
      /ทีมเดียวกัน/
    );
  });

  it('update: partial patch ok, empty patch rejected, required not enforced', () => {
    const update = RESOURCES.matches.update;
    expect(pickColumns(update, { venue: 'สนาม 2' })).toEqual({ values: { venue: 'สนาม 2' } });
    expect(pickColumns(update, { id: U1 }).error).toBeTruthy();
    expect(pickColumns(update, {}).error).toBeTruthy();
  });

  it('announcements: is_pinned must be a boolean', () => {
    const spec = RESOURCES.announcements.insert;
    expect(
      pickColumns(spec, { title: 'a', content: 'b', is_pinned: 'yes' }, { requireAll: true }).error
    ).toMatch(/is_pinned/);
    expect(
      pickColumns(spec, { title: 'a', content: 'b', is_pinned: true }, { requireAll: true }).values.is_pinned
    ).toBe(true);
  });

  it('registrations: onUpdate stamps cancellation fields', () => {
    const { update } = RESOURCES.registrations;
    const actor = { adminUserId: U1 };
    const cancelled = update.onUpdate({ status: 'cancelled' }, actor);
    expect(cancelled.cancelled_by).toBe(U1);
    expect(typeof cancelled.cancelled_at).toBe('string');
    expect(update.onUpdate({ status: 'registered' }, actor)).toEqual({
      status: 'registered',
      cancelled_at: null,
      cancelled_by: null,
    });
  });

  it('every resource declares a table and only whitelisted ops', () => {
    for (const [name, spec] of Object.entries(RESOURCES)) {
      expect(spec.table, name).toBeTruthy();
      expect(spec.select, name).toBeTruthy();
    }
    expect(RESOURCES.athletes.insert).toBeUndefined();
    expect(RESOURCES.registrations.delete).toBeUndefined();
  });
});
