import { describe, it, expect } from 'vitest';
import { getTeamStyle, PENDING_STYLE } from '@/lib/team-style';
import { OFFICIAL_MATCHES } from '@/data/handbook';

describe('Tournament Bracket & Progression', () => {
  it('returns PENDING_STYLE for pending/TBD teams', () => {
    const pendingTeam = {
      id: null,
      name: 'รอผลการแข่งขัน',
      color_hex: '#64748b',
      isPending: true,
    };
    const style = getTeamStyle(pendingTeam);
    expect(style.hex).toBe(PENDING_STYLE.hex);
    expect(style.hex).toBe('#64748b');

    // Also handles team name with รอผล
    const styleByName = getTeamStyle({ name: 'รอผลการแข่งขัน (คู่ 1)' });
    expect(styleByName.hex).toBe('#64748b');
  });

  it('verifies all 44 handbook matches exist and finals/3rd-place have null team IDs', () => {
    expect(OFFICIAL_MATCHES.length).toBe(44);

    const finalsAndThirds = OFFICIAL_MATCHES.filter(
      (m) => m.round === 'ชิงชนะเลิศ' || m.round === 'ชิงอันดับ 3'
    );

    // 5 sports * 2 categories (M/F) = 10 finals + 10 third-place + 2 petanque mixed = 22 medal matches
    expect(finalsAndThirds.length).toBe(22);

    for (const match of finalsAndThirds) {
      expect(match.team_a_id).toBeNull();
      expect(match.team_b_id).toBeNull();
    }
  });

  it('verifies semi-finals have next_match_id and loser_next_match_id linked', () => {
    const semiFinals = OFFICIAL_MATCHES.filter((m) => m.next_match_id != null);
    expect(semiFinals.length).toBe(22);

    for (const semi of semiFinals) {
      expect(semi.next_match_id).toBeTruthy();
      expect(semi.loser_next_match_id).toBeTruthy();
      expect(['a', 'b']).toContain(semi.next_match_slot);
      expect(['a', 'b']).toContain(semi.loser_next_match_slot);

      // Verify the target matches exist in handbook
      const finalMatch = OFFICIAL_MATCHES.find((m) => m.id === semi.next_match_id);
      const thirdMatch = OFFICIAL_MATCHES.find((m) => m.id === semi.loser_next_match_id);
      expect(finalMatch).toBeDefined();
      expect(thirdMatch).toBeDefined();
      expect(finalMatch.round).toBe('ชิงชนะเลิศ');
      expect(thirdMatch.round).toBe('ชิงอันดับ 3');
    }
  });
});
