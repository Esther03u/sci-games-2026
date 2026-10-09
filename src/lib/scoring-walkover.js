/**
 * Helper utilities for Walkover (ชนะบาย) scoring and formatting.
 * Used by scoring API routes, admin match editor, and referee ScorePad.
 */

/**
 * Calculates standard walkover (ปรับแพ้ / ชนะบาย) scores based on official handbook rules (สูจิบัตร ข้อ 2):
 * - ฟุตซอล: 3 – 0 ประตู
 * - วอลเลย์บอล: 2 – 0 เซต (25 – 0, 25 – 0)
 * - เซปักตะกร้อ: 2 – 0 เซต (15 – 0, 15 – 0)
 * - บาสเกตบอล: 20 – 0 คะแนน
 * - เปตอง: 11 – 0 คะแนน (รอบชิงชนะเลิศ 13 – 0 คะแนน)
 *
 * @param {Object} sport
 * @param {'a' | 'b'} winner
 * @param {Object} [options]
 * @param {string} [options.round]
 * @param {boolean} [options.isFinal]
 * @returns {{ score_a: number, score_b: number, sets_a: number, sets_b: number }}
 */
export function calculateWalkoverScore(sport, winner, options = {}) {
  const sportName = sport?.name || '';
  const isFinal = Boolean(options?.isFinal) || options?.round === 'ชิงชนะเลิศ' || options?.round === 'final';

  // 1. ฟุตซอล: 3 – 0 ประตู
  if (sportName.includes('ฟุตซอล')) {
    return {
      score_a: winner === 'a' ? 3 : 0,
      score_b: winner === 'b' ? 3 : 0,
      sets_a: 0,
      sets_b: 0,
    };
  }

  // 2. วอลเลย์บอล: 2 – 0 เซต (25 – 0, 25 – 0)
  if (sportName.includes('วอลเลย์บอล')) {
    return {
      score_a: winner === 'a' ? 25 : 0,
      score_b: winner === 'b' ? 25 : 0,
      sets_a: winner === 'a' ? 2 : 0,
      sets_b: winner === 'b' ? 2 : 0,
    };
  }

  // 3. เซปักตะกร้อ: 2 – 0 เซต (15 – 0, 15 – 0)
  if (sportName.includes('ตะกร้อ')) {
    return {
      score_a: winner === 'a' ? 15 : 0,
      score_b: winner === 'b' ? 15 : 0,
      sets_a: winner === 'a' ? 2 : 0,
      sets_b: winner === 'b' ? 2 : 0,
    };
  }

  // 4. บาสเกตบอล: 20 – 0 คะแนน
  if (sportName.includes('บาสเกตบอล') || sportName.includes('บาส')) {
    return {
      score_a: winner === 'a' ? 20 : 0,
      score_b: winner === 'b' ? 20 : 0,
      sets_a: 0,
      sets_b: 0,
    };
  }

  // 5. เปตอง: 11 – 0 คะแนน (รอบชิงชนะเลิศ 13 – 0 คะแนน)
  if (sportName.includes('เปตอง')) {
    const pts = isFinal ? 13 : 11;
    return {
      score_a: winner === 'a' ? pts : 0,
      score_b: winner === 'b' ? pts : 0,
      sets_a: 0,
      sets_b: 0,
    };
  }

  // Fallback for set-based sports by metadata
  const isSetSport = sport?.scoring_type === 'sets';
  if (isSetSport) {
    const setsToWin = Number.isInteger(sport?.sets_to_win) && sport.sets_to_win > 0 ? sport.sets_to_win : 2;
    const pointsPerSet =
      Number.isInteger(sport?.points_per_set) && sport.points_per_set > 0 ? sport.points_per_set : 25;

    return {
      score_a: winner === 'a' ? pointsPerSet : 0,
      score_b: winner === 'b' ? pointsPerSet : 0,
      sets_a: winner === 'a' ? setsToWin : 0,
      sets_b: winner === 'b' ? setsToWin : 0,
    };
  }

  // Standard generic walkover fallback for points-based sports
  return {
    score_a: winner === 'a' ? 2 : 0,
    score_b: winner === 'b' ? 2 : 0,
    sets_a: 0,
    sets_b: 0,
  };
}

/**
 * Formats a user-friendly walkover label in Thai.
 *
 * @param {Object} match
 * @param {Object} [teamA]
 * @param {Object} [teamB]
 * @returns {string}
 */
export function formatWalkoverLabel(match, teamA, teamB) {
  if (!match?.is_walkover) return '';
  const winner =
    match.sets_a != null && match.sets_b != null && match.sets_a !== match.sets_b
      ? match.sets_a > match.sets_b
        ? 'a'
        : 'b'
      : (match.score_a ?? 0) > (match.score_b ?? 0)
        ? 'a'
        : 'b';

  const winnerTeam = winner === 'a' ? teamA?.name || 'ทีม A' : teamB?.name || 'ทีม B';
  return `${winnerTeam} ชนะบาย`;
}
