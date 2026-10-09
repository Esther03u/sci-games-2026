// Pure helpers behind the admin match editor (components/admin/MatchEditor):
// form values for the score modal and the local list update after a reset.

/** number | null → value for an <input> ('' when empty) */
export const toInputValue = (v) => (v === null || v === undefined ? '' : String(v));

/**
 * One editable row per set for set-scored sports (volleyball, sepak takraw):
 * best-of-3 or best-of-5 slots, more if the match already has extra sets.
 * Points sports get [] (they edit score_a / score_b directly).
 * @returns {{ set_number: number, score_a: string, score_b: string }[]}
 */
export function buildEditSets(match, sport) {
  if (sport?.scoring_type !== 'sets') return [];
  const saved = Array.isArray(match.match_sets) ? [...match.match_sets] : [];
  saved.sort((a, b) => a.set_number - b.set_number);
  const setsToWin = sport.sets_to_win || 2;
  const slots = Math.max(setsToWin === 2 ? 3 : 5, saved.length);
  const rows = [];
  for (let i = 1; i <= slots; i++) {
    const existing = saved.find((x) => x.set_number === i);
    rows.push({
      set_number: i,
      score_a: toInputValue(existing?.score_a),
      score_b: toInputValue(existing?.score_b),
    });
  }
  return rows;
}

/**
 * Sets with both scores filled in, and how many each side won (ties count for nobody).
 * @param {{ score_a: string, score_b: string }[]} sets
 */
export function countSetWins(sets) {
  const filled = sets.filter((s) => s.score_a !== '' && s.score_b !== '');
  let setsA = 0;
  let setsB = 0;
  for (const s of filled) {
    const a = parseInt(s.score_a, 10);
    const b = parseInt(s.score_b, 10);
    if (a > b) setsA++;
    else if (b > a) setsB++;
  }
  return { filled, setsA, setsB };
}

const clearSlot = (m, slot) => ({
  ...m,
  team_a_id: slot === 'a' ? null : m.team_a_id,
  team_b_id: slot === 'b' ? null : m.team_b_id,
});

/**
 * Mirror POST /api/match/[id]/reset in the local list: the match goes back to
 * upcoming with no score, and the bracket slots it fed (winner → next match,
 * loser → third-place match) go back to "waiting for result".
 */
export function applyResetToList(matches, target, response) {
  return matches.map((m) => {
    if (m.id === target.id) {
      return {
        ...m,
        ...response,
        status: 'upcoming',
        score_a: null,
        score_b: null,
        sets_a: null,
        sets_b: null,
        points_a: null,
        points_b: null,
        is_walkover: false,
        match_sets: [],
      };
    }
    if (m.id === target.next_match_id) return clearSlot(m, target.next_match_slot);
    if (m.id === target.loser_next_match_id) return clearSlot(m, target.loser_next_match_slot);
    return m;
  });
}

/** Set scores as "25-20 | 18-25", in set order, skipping unfinished sets */
export function formatSetScores(matchSets) {
  return matchSets
    .filter((s) => s.score_a !== null && s.score_b !== null)
    .sort((a, b) => a.set_number - b.set_number)
    .map((s) => `${s.score_a}-${s.score_b}`)
    .join(' | ');
}
