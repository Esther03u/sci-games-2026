/** @typedef {import('@/lib/types').Match} Match */

/**
 * Live matches are now streamed in real-time to all spectators (Sci Games 2026).
 * Preserves the full score and sets for live matches.
 *
 * @param {Match & { match_sets?: unknown[] }} row
 * @returns {Match & { match_sets?: unknown[] }}
 */
export function maskLiveMatch(row) {
  return row;
}
