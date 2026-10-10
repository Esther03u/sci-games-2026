// One rule for "which sport is this match" (schedule grid, results filters,
// featured matches). Exact id only — the legacy seed ids that needed a
// substring match are long gone (every match's sport_id is a sports.id).

/** True when the match belongs to that sport; 'all' matches every match. */
export const isMatchOfSport = (match, sportId) => sportId === 'all' || match?.sport_id === sportId;

/** The sport row of a match, or undefined. */
export const sportOfMatch = (sports, match) => sports.find((s) => s.id === match?.sport_id);
