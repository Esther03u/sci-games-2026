// src/lib/ceremony.js
/**
 * Ceremony & MC Results Domain Helper
 * Strictly vector icons only, NO emojis in text outputs.
 */

// Timeline chronological order from official handbook schedule
export const CHRONOLOGICAL_EVENT_KEYS = [
  'sport-futsal|หญิง', // 8 Oct (รอบชิง)
  'sport-petanque|ชาย', // 9 Oct
  'sport-petanque|หญิง',
  'sport-petanque|คู่ชาย',
  'sport-petanque|คู่หญิง',
  'sport-petanque|คู่ผสม',
  'sport-takraw|ชาย',
  'sport-basketball|ชาย',
  'sport-futsal|ชาย',
  'sport-volleyball|หญิง', // 11 Oct
  'sport-volleyball|ชาย',
];

export function hasEmoji(str) {
  if (!str || typeof str !== 'string') return false;
  // Emoji Unicode range regex
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
  return emojiRegex.test(str);
}

/**
 * Orders event list based on preset: 'official', 'chronological', or 'custom'.
 */
export function orderEvents(events = [], preset = 'official', customKeys = []) {
  if (!Array.isArray(events)) return [];
  const list = [...events];

  if (preset === 'custom' && Array.isArray(customKeys) && customKeys.length > 0) {
    const rankMap = new Map(customKeys.map((k, i) => [k, i]));
    return list.sort((a, b) => {
      const rankA = rankMap.has(a.key) ? rankMap.get(a.key) : 999;
      const rankB = rankMap.has(b.key) ? rankMap.get(b.key) : 999;
      return rankA - rankB;
    });
  }

  if (preset === 'chronological') {
    const rankMap = new Map(CHRONOLOGICAL_EVENT_KEYS.map((k, i) => [k, i]));
    return list.sort((a, b) => {
      const rankA = rankMap.has(a.key) ? rankMap.get(a.key) : 999;
      const rankB = rankMap.has(b.key) ? rankMap.get(b.key) : 999;
      return rankA - rankB;
    });
  }

  // Default: official order (by sport sort_order then category rank)
  return list;
}

const PLACE_TITLES = {
  1: 'ชนะเลิศ (เหรียญทอง)',
  2: 'รองชนะเลิศอันดับ 1 (เหรียญเงิน)',
  3: 'รองชนะเลิศอันดับ 2 (เหรียญทองแดง)',
  4: 'อันดับที่ 4 (ชมเชย)',
};

/**
 * Formats podium callouts for an event in reverse order (4th -> 3rd -> 2nd -> 1st)
 * to build excitement during stage announcements.
 */
export function formatMcCallouts(event, teamMap = new Map(), options = {}) {
  if (!event || !Array.isArray(event.places)) return [];
  const { includeFourthPlace = false } = options;

  const placesMap = new Map(event.places.map((p) => [p.place, p.team_id]));

  const order = includeFourthPlace ? [4, 3, 2, 1] : [3, 2, 1];
  const callouts = [];

  for (const place of order) {
    const teamId = placesMap.get(place);
    const team = teamId ? teamMap.get(teamId) : null;
    callouts.push({
      place,
      title: PLACE_TITLES[place] || `อันดับที่ ${place}`,
      teamId: teamId || null,
      teamName: team?.name || (event.done ? 'ไม่มีข้อมูล' : 'รอผลการแข่งขัน'),
      teamColor: team?.color_hex || '#94a3b8',
      shortName: team?.shortName || team?.name || '-',
      isWinner: place === 1,
    });
  }

  return callouts;
}

/**
 * Formats overall standings for the ceremony grand finale in reverse order (4th -> 1st).
 */
export function formatGrandFinale(standings = []) {
  if (!Array.isArray(standings)) return [];
  // Reverse order so Champion is announced last
  return [...standings]
    .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
    .map((s) => ({
      rank: s.rank,
      teamId: s.id,
      teamName: s.name,
      teamColor: s.color_hex || '#94a3b8',
      totalPoints: s.total_points ?? 0,
      rawPoints: s.raw_points ?? 0,
      golds: s.golds ?? 0,
      silvers: s.silvers ?? 0,
      bronzes: s.bronzes ?? 0,
      isChampion: s.rank === 1,
      title:
        s.rank === 1
          ? 'ถ้วยรางวัลชนะเลิศ คะแนนรวมเจ้าสนาม'
          : s.rank === 2
            ? 'รองชนะเลิศอันดับ 1 คะแนนรวม'
            : s.rank === 3
              ? 'รองชนะเลิศอันดับ 2 คะแนนรวม'
              : 'อันดับที่ 4 คะแนนรวม',
    }));
}
