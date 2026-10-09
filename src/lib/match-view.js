// Display state shared by MatchCard and MatchDetailModal: which medal round a
// match is, who plays (with placeholders for unknown/undecided teams), and
// whether scores/winners should be shown. Keep the two views in step by
// changing it here.
import { roundLabel } from '@/lib/labels';

/** Placeholder colour + medal for a slot still waiting on an earlier result */
const PENDING_STYLE = {
  final: { color_hex: '#f59e0b', medal: 'gold' },
  third: { color_hex: '#ea580c', medal: 'bronze' },
  other: { color_hex: '#64748b', medal: null },
};

/** A team id that isn't in `teams` (stale data) still renders with a side colour */
const UNKNOWN_TEAM = {
  a: { name: 'ทีม A', color_hex: '#ef4444', logo_emoji: '🔴' },
  b: { name: 'ทีม B', color_hex: '#0284c7', logo_emoji: '🔵' },
};

/** @param {string | null | undefined} round */
export function medalRound(round) {
  const isFinal = Boolean(round?.includes('ชิงชนะเลิศ') || round === 'final');
  const isThird = Boolean(round?.includes('ชิงอันดับ 3') || round === 'third');
  return { isFinal, isThird, isMedalRound: isFinal || isThird };
}

function resolveTeam(teamId, teams, side, pendingStyle) {
  if (!teamId) {
    return { id: null, name: 'รอผลการแข่งขัน', ...pendingStyle, logo_emoji: '', isPending: true };
  }
  return teams.find((t) => t.id === teamId) || { id: teamId, ...UNKNOWN_TEAM[side] };
}

/**
 * @param {object} match  row from matches / matches_public_v3
 * @param {object[]} [teams]
 * @param {{ isScheduleView?: boolean, sport?: object }} [opts]  schedule view hides scores and
 *   live/finished state; for set-scored sports a finished match shows sets won (score_a/score_b
 *   hold the final set's points) and a live one the current set's points
 */
export function getMatchView(match, teams = [], { isScheduleView = false, sport } = {}) {
  const { isFinal, isThird, isMedalRound } = medalRound(match.round);
  const pendingStyle = PENDING_STYLE[isFinal ? 'final' : isThird ? 'third' : 'other'];

  const isLive = !isScheduleView && match.status === 'live';
  const isFinished = !isScheduleView && match.status === 'finished';
  // set sports: a live card shows the current set's points (sets won appear
  // beside "เซต N"), otherwise the result is sets won
  const showSets = sport?.scoring_type === 'sets' && match.status !== 'live';
  const scoreA = isScheduleView ? null : showSets ? match.sets_a : match.score_a;
  const scoreB = isScheduleView ? null : showSets ? match.sets_b : match.score_b;
  const hasBothScores = scoreA != null && scoreB != null;

  const roundText =
    roundLabel(match.round) || (isFinal ? 'รอบชิงชนะเลิศ' : isThird ? 'รอบชิงอันดับ 3' : 'รอบการแข่งขัน');
  const catText = match.category && !roundText.includes(match.category) ? ` (${match.category})` : '';

  return {
    isFinal,
    isThird,
    isMedalRound,
    isPendingA: !match.team_a_id,
    isPendingB: !match.team_b_id,
    teamA: resolveTeam(match.team_a_id, teams, 'a', pendingStyle),
    teamB: resolveTeam(match.team_b_id, teams, 'b', pendingStyle),
    isLive,
    isFinished,
    scoreA,
    scoreB,
    teamAWins: isFinished && hasBothScores && scoreA > scoreB,
    teamBWins: isFinished && hasBothScores && scoreB > scoreA,
    roundText,
    catText,
  };
}
