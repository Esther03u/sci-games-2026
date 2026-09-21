import { describe, it, expect } from 'vitest';
import { getTeamStyle } from '@/lib/team-style';

describe('getTeamStyle', () => {
  it('matches by colour hex (case-insensitive)', () => {
    expect(getTeamStyle({ color_hex: '#EF4444' }).hex).toBe('#ef4444');
    expect(getTeamStyle({ color_hex: '#3b82f6' }).hex).toBe('#0284c7');
  });

  it('matches by id or Thai name when hex is unknown', () => {
    expect(getTeamStyle({ id: 'team-green', color_hex: '#000000' }).hex).toBe('#10b981');
    expect(getTeamStyle({ name: 'สีม่วง' }).hex).toBe('#8b5cf6');
    expect(getTeamStyle({ name: 'ทีมน้ำเงิน' }).hex).toBe('#0284c7');
  });

  it('falls back to the team colour, then gold', () => {
    const s = getTeamStyle({ color_hex: '#123456', bg_gradient: 'g' });
    expect(s).toEqual({ hex: '#123456', gradient: 'g', glow: '#12345655', ambient: '#12345614', ring: '#12345635' });
    expect(getTeamStyle(null).hex).toBe('#ca8a04');
    expect(getTeamStyle(undefined).gradient).toContain('#ca8a04');
  });
});
