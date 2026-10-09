// Set-sport rules shared by the referee pad (client) and the scoring API.

/**
 * For set sports finish_match() auto-closes an open, non-tied set — this is
 * what the sets will look like after that.
 */
export function projectedSets(match) {
  let a = match?.sets_a ?? 0;
  let b = match?.sets_b ?? 0;
  const sa = match?.score_a ?? 0;
  const sb = match?.score_b ?? 0;
  if (sa > sb) a += 1;
  else if (sb > sa) b += 1;
  return { a, b };
}

/**
 * Which end-of-set / end-of-match control the referee pad offers, so there is
 * only ever one right button:
 *  - closing the open set would decide the match → only the finish slider
 *    (finish_match closes that last set itself)
 *  - the deciding set (both sides one set short) → never "จบเซต"; with a
 *    tied score there is nothing to press yet
 *  - otherwise → "จบเซต"
 * Points sports: finish slider only.
 * @returns {{ finishSet: boolean, finishMatch: boolean, hint: string | null }}
 */
export function setControls(match, sport) {
  if (sport?.scoring_type !== 'sets') return { finishSet: false, finishMatch: true, hint: null };
  const need = sport.sets_to_win || 2;
  const { a, b } = projectedSets(match);
  if (Math.max(a, b) >= need) return { finishSet: false, finishMatch: true, hint: null };
  const sa = match?.sets_a ?? 0;
  const sb = match?.sets_b ?? 0;
  if (sa >= need - 1 && sb >= need - 1) {
    return {
      finishSet: false,
      finishMatch: false,
      hint: `เซตตัดสิน (${sa}-${sb}) — เล่นจนมีผู้นำ แล้วเลื่อนเพื่อจบการแข่งขัน`,
    };
  }
  return { finishSet: true, finishMatch: false, hint: undecidedSetMatch(match, sport) };
}

/**
 * Why a set-sport match cannot be finished yet, or null when it can.
 * Referees used the "จบการแข่งขัน" slider at the end of set 1 (9 ต.ค.):
 * finish_match closed that set and then ended a best-of-3 at 1-0, and the
 * set they scored next was never counted. A match is only decided once one
 * side reaches sets_to_win (counting the open set's leader).
 */
export function undecidedSetMatch(match, sport) {
  if (sport?.scoring_type !== 'sets') return null;
  const need = sport.sets_to_win || 2;
  const { a, b } = projectedSets(match);
  if (Math.max(a, b) >= need) return null;
  return `ยังไม่ครบเซต (ตอนนี้ ${a}-${b} ต้องชนะ ${need} เซต) — จบเซตนี้ด้วยปุ่ม "จบเซต" แล้วแข่งเซตต่อไป`;
}
