// Admin "แก้ตาราง" form (MatchEditor) → PATCH body for /api/admin/matches.
// Only fields that actually changed are sent, so the audit log diff shows
// exactly what moved and an untouched form sends nothing.

/**
 * @param {import('@/lib/types').Match} match  the row as loaded
 * @param {{team_a_id: string, team_b_id: string, match_date: string, match_time: string, venue: string, court: string}} form
 *   form values as strings ('' = none); match_time as 'HH:MM' or 'HH:MM:SS'
 * @returns {{ error: string } | { patch: Record<string, unknown> }}
 */
export function schedulePatch(match, form) {
  if (form.team_a_id && form.team_b_id && form.team_a_id === form.team_b_id) {
    return { error: 'ทีมที่แข่งขันต้องไม่เป็นทีมเดียวกัน' };
  }
  const next = {
    team_a_id: form.team_a_id || null,
    team_b_id: form.team_b_id || null,
    match_date: form.match_date,
    match_time: form.match_time.length === 5 ? `${form.match_time}:00` : form.match_time,
    venue: form.venue.trim(),
    court: form.court.trim() || null,
  };
  if (!next.venue) return { error: 'กรุณาระบุสถานที่' };
  const patch = {};
  for (const [key, value] of Object.entries(next)) {
    const before = key === 'match_time' ? match.match_time?.slice(0, 8) : match[key];
    if ((before ?? null) !== value) patch[key] = value;
  }
  return { patch };
}
