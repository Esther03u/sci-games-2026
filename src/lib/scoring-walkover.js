/**
 * Helper utilities for Walkover (ชนะบาย) scoring and formatting.
 * Used by scoring API routes, admin match editor, and referee ScorePad.
 */

/**
 * Calculates standard walkover scores based on sport scoring type.
 * - Set-based sports (วอลเลย์บอล, เซปักตะกร้อ): Winner gets winning sets (e.g. 2-0) and set points (e.g. 25-0 or 15-0).
 * - Point-based sports (ฟุตซอล, บาสเกตบอล, เปตอง): Winner gets standard 2-0 score.
 *
 * @param {Object} sport
 * @param {'a' | 'b'} winner
 * @returns {{ score_a: number, score_b: number, sets_a: number, sets_b: number }}
 */
export function calculateWalkoverScore(sport, winner) {
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

  // Standard walkover score for points-based sports (Futsal, Basketball, Petanque)
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
