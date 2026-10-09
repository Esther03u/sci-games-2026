import { describe, it, expect } from 'vitest';
import { calculateWalkoverScore, formatWalkoverLabel } from '@/lib/scoring-walkover';

describe('Walkover Scoring Logic (ชนะบาย)', () => {
  describe('calculateWalkoverScore', () => {
    it('calculates walkover for set sports (Volleyball: 2 sets, 25 pts)', () => {
      const sport = { scoring_type: 'sets', sets_to_win: 2, points_per_set: 25 };

      const winnerA = calculateWalkoverScore(sport, 'a');
      expect(winnerA).toEqual({
        score_a: 25,
        score_b: 0,
        sets_a: 2,
        sets_b: 0,
      });

      const winnerB = calculateWalkoverScore(sport, 'b');
      expect(winnerB).toEqual({
        score_a: 0,
        score_b: 25,
        sets_a: 0,
        sets_b: 2,
      });
    });

    it('calculates walkover for Takraw (sets sport: 2 sets, 15 pts)', () => {
      const sport = { scoring_type: 'sets', sets_to_win: 2, points_per_set: 15 };

      const winnerA = calculateWalkoverScore(sport, 'a');
      expect(winnerA).toEqual({
        score_a: 15,
        score_b: 0,
        sets_a: 2,
        sets_b: 0,
      });
    });

    it('calculates standard walkover for points sports (Futsal, Basketball, Petanque: 2-0)', () => {
      const futsal = { scoring_type: 'points' };

      const winnerA = calculateWalkoverScore(futsal, 'a');
      expect(winnerA).toEqual({
        score_a: 2,
        score_b: 0,
        sets_a: 0,
        sets_b: 0,
      });

      const winnerB = calculateWalkoverScore(futsal, 'b');
      expect(winnerB).toEqual({
        score_a: 0,
        score_b: 2,
        sets_a: 0,
        sets_b: 0,
      });
    });

    it('calculates official handbook walkovers per sport', () => {
      // 1. ฟุตซอล: 3 - 0 ประตู
      expect(calculateWalkoverScore({ name: 'ฟุตซอล' }, 'a')).toEqual({
        score_a: 3,
        score_b: 0,
        sets_a: 0,
        sets_b: 0,
      });

      // 2. วอลเลย์บอล: 2 - 0 เซต (25 - 0)
      expect(calculateWalkoverScore({ name: 'วอลเลย์บอล', scoring_type: 'sets' }, 'b')).toEqual({
        score_a: 0,
        score_b: 25,
        sets_a: 0,
        sets_b: 2,
      });

      // 3. เซปักตะกร้อ: 2 - 0 เซต (15 - 0)
      expect(calculateWalkoverScore({ name: 'เซปักตะกร้อ', scoring_type: 'sets' }, 'a')).toEqual({
        score_a: 15,
        score_b: 0,
        sets_a: 2,
        sets_b: 0,
      });

      // 4. บาสเกตบอล: 20 - 0 คะแนน
      expect(calculateWalkoverScore({ name: 'บาสเกตบอล' }, 'a')).toEqual({
        score_a: 20,
        score_b: 0,
        sets_a: 0,
        sets_b: 0,
      });

      // 5. เปตอง: 11 - 0 คะแนน (รอบชิงชนะเลิศ 13 - 0 คะแนน)
      expect(calculateWalkoverScore({ name: 'เปตอง' }, 'a', { round: 'รอบแรก' })).toEqual({
        score_a: 11,
        score_b: 0,
        sets_a: 0,
        sets_b: 0,
      });
      expect(calculateWalkoverScore({ name: 'เปตอง' }, 'b', { round: 'ชิงชนะเลิศ' })).toEqual({
        score_a: 0,
        score_b: 13,
        sets_a: 0,
        sets_b: 0,
      });
      expect(calculateWalkoverScore({ name: 'เปตอง' }, 'a', { isFinal: true })).toEqual({
        score_a: 13,
        score_b: 0,
        sets_a: 0,
        sets_b: 0,
      });
    });

    it('handles missing or undefined sport metadata with safe defaults', () => {
      const result = calculateWalkoverScore(null, 'a');
      expect(result).toEqual({
        score_a: 2,
        score_b: 0,
        sets_a: 0,
        sets_b: 0,
      });
    });
  });

  describe('formatWalkoverLabel', () => {
    it('returns empty string if match is not walkover', () => {
      const match = { is_walkover: false, score_a: 3, score_b: 1 };
      expect(formatWalkoverLabel(match)).toBe('');
    });

    it('formats winner label for team A walkover', () => {
      const match = { is_walkover: true, score_a: 2, score_b: 0 };
      const teamA = { name: 'สีม่วง' };
      const teamB = { name: 'สีเขียว' };
      expect(formatWalkoverLabel(match, teamA, teamB)).toBe('สีม่วง ชนะบาย');
    });

    it('formats winner label for team B walkover with sets', () => {
      const match = { is_walkover: true, sets_a: 0, sets_b: 2, score_a: 0, score_b: 25 };
      const teamA = { name: 'สีแดง' };
      const teamB = { name: 'สีฟ้า' };
      expect(formatWalkoverLabel(match, teamA, teamB)).toBe('สีฟ้า ชนะบาย');
    });
  });
});
