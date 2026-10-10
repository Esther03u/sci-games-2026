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
  1: 'ชนะเลิศ',
  2: 'รองชนะเลิศอันดับ 1',
  3: 'รองชนะเลิศอันดับ 2',
  4: 'อันดับที่ 4',
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

/**
 * Paginates ceremony events cleanly into realistic A4 chunks.
 *
 * Page 1: Main Header + Quick Standings Grid (4 teams) + 4 Events + Footer.
 * Page 2: Compact Running Header + 4 Events + Footer.
 * Page 3: Compact Running Header + 3 Events + Grand Finale Trophy Card + MC Notes + Footer.
 *
 * For smaller sets (e.g. filtered):
 * <= 3 events -> 1 page (fits all + Grand Finale)
 * <= 7 events -> 2 pages (4 on page 1, rest on page 2)
 * 11 events -> 3 pages (4 + 4 + 3)
 */
export function paginateCeremonyEvents(events = []) {
  if (!Array.isArray(events) || events.length === 0) {
    return [
      {
        pageNumber: 1,
        totalPages: 1,
        events: [],
        startIndex: 0,
        isFirstPage: true,
        isLastPage: true,
      },
    ];
  }

  const n = events.length;
  let chunks = [];
  if (n <= 3) {
    chunks = [events];
  } else if (n <= 7) {
    chunks = [events.slice(0, 4), events.slice(4)];
  } else if (n <= 11) {
    chunks = [events.slice(0, 4), events.slice(4, 8), events.slice(8)];
  } else {
    chunks.push(events.slice(0, 4));
    let remaining = events.slice(4);
    while (remaining.length > 3) {
      if (remaining.length === 4) {
        chunks.push(remaining.slice(0, 2));
        chunks.push(remaining.slice(2));
        remaining = [];
      } else {
        chunks.push(remaining.slice(0, 4));
        remaining = remaining.slice(4);
      }
    }
    if (remaining.length > 0) {
      chunks.push(remaining);
    }
  }

  let cur = 0;
  return chunks.map((chunk, idx) => {
    const pageNumber = idx + 1;
    const startIndex = cur;
    cur += chunk.length;
    return {
      pageNumber,
      totalPages: chunks.length,
      events: chunk,
      startIndex,
      isFirstPage: idx === 0,
      isLastPage: idx === chunks.length - 1,
    };
  });
}

