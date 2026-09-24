// Pure helpers for the scoring pad (no React) — unit-tested in tests/scoring.test.js

/** When staff may no longer edit a finished match, or null while it is not finished. */
export function editDeadline(match, editWindowMinutes) {
  if (!match?.finished_at) return null;
  return new Date(new Date(match.finished_at).getTime() + editWindowMinutes * 60 * 1000);
}

/** Split the visible matches into the three groups shown on the picker. */
/** Replace a match in the list by id (or append it) — the referee's own latest row. */
export function upsertMatch(list, row) {
  if (!row) return list;
  const idx = list.findIndex((m) => m.id === row.id);
  if (idx === -1) return [...list, row];
  const next = list.slice();
  next[idx] = { ...list[idx], ...row };
  return next;
}

export function groupMatches(matches, { editWindowMinutes, now, isAdmin }) {
  const live = [];
  const upcoming = [];
  const recent = [];
  for (const m of matches) {
    if (m.status === 'live') live.push(m);
    else if (m.status === 'finished') {
      const dl = editDeadline(m, editWindowMinutes);
      if (isAdmin || (dl && dl.getTime() > now)) recent.push(m);
    } else upcoming.push(m);
  }
  recent.sort((a, b) => (b.finished_at || '').localeCompare(a.finished_at || ''));
  return { live, upcoming, recent };
}

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

/** 'a' | 'b' | null — who wins if the match were finished right now. */
export function projectedWinner(match, sport) {
  const isSets = sport?.scoring_type === 'sets';
  const a = isSets ? projectedSets(match).a : (match?.score_a ?? 0);
  const b = isSets ? projectedSets(match).b : (match?.score_b ?? 0);
  if (a > b) return 'a';
  if (b > a) return 'b';
  return null;
}

/**
 * Knockout sports that cannot end level: futsal goes to penalties and
 * basketball to overtime (สูจิบัตร 2569), so a tie on the pad means the
 * referee has not entered the decider yet. Returns a warning or null.
 */
export function drawWarning(match, sport) {
  if (!match || sport?.scoring_type === 'sets') return null;
  const a = match.score_a ?? 0;
  const b = match.score_b ?? 0;
  if (a !== b) return null;
  if (sport?.name === 'ฟุตซอล')
    return 'กติกาฟุตซอลให้ยิงจุดโทษ 3 คนเพื่อหาผู้ชนะ — บันทึกผลรวมจุดโทษแล้วค่อยจบแมตช์';
  if (sport?.name === 'บาสเกตบอล') return 'กติกาบาสเกตบอลให้ต่อเวลาครั้งละ 5 นาทีจนกว่าจะได้ผู้ชนะ';
  return 'การแข่งขันเป็นแบบแพ้คัดออก ผลเสมอจะไม่มีทีมผ่านเข้ารอบต่อไป';
}

// What this result means in the knockout (overall points come from the final
// placings — lib/placements — not from each match).
const OUTCOME = {
  ชิงชนะเลิศ: ['ได้ที่ 1', 'ได้ที่ 2'],
  final: ['ได้ที่ 1', 'ได้ที่ 2'],
  'ชิงอันดับ 3': ['ได้ที่ 3', 'ได้ที่ 4'],
  third: ['ได้ที่ 3', 'ได้ที่ 4'],
  รอบแรก: ['เข้าชิงชนะเลิศ', 'ไปชิงอันดับ 3'],
};

export function winnerText(match, sport, teamA, teamB) {
  if (!match) return '';
  const w = projectedWinner(match, sport);
  if (!w) return ' ผลเสมอ — ยังไม่มีผู้ชนะ';
  const [winner, loser] = w === 'a' ? [teamA, teamB] : [teamB, teamA];
  const [winText, loseText] = OUTCOME[match.round] || [null, null];
  if (!winText) return ` ทีม${winner?.name} ชนะ, ทีม${loser?.name} แพ้`;
  return ` ทีม${winner?.name} ชนะ (${winText}), ทีม${loser?.name} แพ้ (${loseText})`;
}
