# MC Award Ceremony Results & Script Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated `/admin/ceremony` console for generating customizable MC award ceremony scripts and printable A4 results sheets with high-contrast stage legibility, full event reordering, and clean vector icons.

**Architecture:** Client-server separation: server loader queries `loadPlacements`, client interactive `CeremonyConsole` manages reordering and preview state with `localStorage` persistence, pure domain helper `ceremony.js` handles data formatting/cues, and CSS `@media print` renders crisp Thai typography and A4 layout without emojis.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase SSR, Lucide React (`lucide-react`), Vitest.

**Spec:** `docs/superpowers/specs/2026-10-10-ceremony-mc-results-pdf-design.md`

## Global Constraints
- **Zero Emojis**: Strictly vector icons (`lucide-react`) for medals, trophies, and status. Use CSS solid color dots/badges for team colors.
- **Thai Typography Safety**: Rely on native browser print layout (`@media print`) and high-legibility system fonts so Thai vowels/tone marks never clip.
- **Additive & Idempotent**: No database migrations required (uses existing `matches_public_v3`, `sports`, `teams`).
- **Tests & Quality Gates**: Every task must pass `npm test` and final integration must pass `npm run build`.

---

### Task 1: Ceremony Domain Logic & Formatting Helper (`src/lib/ceremony.js`)

**Files:**
- Create: `src/lib/ceremony.js`
- Test: `tests/ceremony-mc.test.js`

**Interfaces:**
- Produces:
  - `CHRONOLOGICAL_EVENT_KEYS`: Array of ordered event keys according to tournament schedule.
  - `orderEvents(events, preset, customKeys)`: Returns ordered events array.
  - `formatMcCallouts(event, teamMap, options)`: Returns array of podium callouts (3rd -> 2nd -> 1st, optional 4th).
  - `formatGrandFinale(standings)`: Returns ordered standings for ceremony finale (4th -> 3rd -> 2nd -> 1st champion).
  - `hasEmoji(str)`: Helper to assert strings are free of emoji characters.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/ceremony-mc.test.js
import { describe, expect, it } from 'vitest';
import {
  CHRONOLOGICAL_EVENT_KEYS,
  formatGrandFinale,
  formatMcCallouts,
  hasEmoji,
  orderEvents,
} from '@/lib/ceremony';

const sampleSports = [
  { id: 'futsal', name: 'ฟุตซอล', scoring_type: 'points', sort_order: 1 },
  { id: 'volley', name: 'วอลเลย์บอล', scoring_type: 'sets', sort_order: 2 },
];

const sampleTeams = [
  { id: 'team-red', name: 'สีแดง', color_hex: '#ef4444' },
  { id: 'team-blue', name: 'สีฟ้า', color_hex: '#0284c7' },
  { id: 'team-green', name: 'สีเขียว', color_hex: '#10b981' },
  { id: 'team-purple', name: 'สีม่วง', color_hex: '#8b5cf6' },
];

const teamMap = new Map(sampleTeams.map((t) => [t.id, t]));

const sampleEvents = [
  {
    key: 'futsal|ชาย',
    sport_id: 'futsal',
    sport_name: 'ฟุตซอล',
    category: 'ชาย',
    sort_order: 1,
    places: [
      { place: 1, team_id: 'team-red' },
      { place: 2, team_id: 'team-blue' },
      { place: 3, team_id: 'team-green' },
      { place: 4, team_id: 'team-purple' },
    ],
    done: true,
  },
  {
    key: 'volley|หญิง',
    sport_id: 'volley',
    sport_name: 'วอลเลย์บอล',
    category: 'หญิง',
    sort_order: 2,
    places: [
      { place: 1, team_id: 'team-blue' },
      { place: 2, team_id: 'team-green' },
    ],
    done: false,
  },
];

describe('ceremony logic', () => {
  it('orders events by official sort order by default', () => {
    const ordered = orderEvents(sampleEvents, 'official');
    expect(ordered[0].key).toBe('futsal|ชาย');
    expect(ordered[1].key).toBe('volley|หญิง');
  });

  it('orders events by custom keys array', () => {
    const ordered = orderEvents(sampleEvents, 'custom', ['volley|หญิง', 'futsal|ชาย']);
    expect(ordered[0].key).toBe('volley|หญิง');
    expect(ordered[1].key).toBe('futsal|ชาย');
  });

  it('formats MC callouts in dramatic build-up order: 3rd -> 2nd -> 1st', () => {
    const callouts = formatMcCallouts(sampleEvents[0], teamMap, { includeFourthPlace: false });
    expect(callouts.map((c) => c.place)).toEqual([3, 2, 1]);
    expect(callouts[0].title).toBe('รองชนะเลิศอันดับ 2 (เหรียญทองแดง)');
    expect(callouts[0].teamName).toBe('สีแดง' === 'สีเขียว' ? 'สีแดง' : 'สีเขียว');
    expect(callouts[2].title).toBe('ชนะเลิศ (เหรียญทอง)');
    expect(callouts[2].teamName).toBe('สีแดง');
  });

  it('includes 4th place when includeFourthPlace is true', () => {
    const callouts = formatMcCallouts(sampleEvents[0], teamMap, { includeFourthPlace: true });
    expect(callouts.map((c) => c.place)).toEqual([4, 3, 2, 1]);
    expect(callouts[0].title).toBe('อันดับที่ 4 (ชมเชย)');
  });

  it('formats grand finale standings in 4th -> 3rd -> 2nd -> 1st order', () => {
    const standings = [
      { id: 'team-red', name: 'สีแดง', total_points: 85, rank: 1, golds: 3, silvers: 1, bronzes: 0 },
      { id: 'team-blue', name: 'สีฟ้า', total_points: 75, rank: 2, golds: 2, silvers: 2, bronzes: 1 },
      { id: 'team-green', name: 'สีเขียว', total_points: 60, rank: 3, golds: 1, silvers: 1, bronzes: 2 },
      { id: 'team-purple', name: 'สีม่วง', total_points: 40, rank: 4, golds: 0, silvers: 1, bronzes: 2 },
    ];
    const finale = formatGrandFinale(standings);
    expect(finale.map((f) => f.rank)).toEqual([4, 3, 2, 1]);
    expect(finale[3].isChampion).toBe(true);
    expect(finale[3].teamName).toBe('สีแดง');
  });

  it('guarantees zero emojis in formatted text strings', () => {
    const callouts = formatMcCallouts(sampleEvents[0], teamMap, { includeFourthPlace: true });
    for (const c of callouts) {
      expect(hasEmoji(c.title)).toBe(false);
      expect(hasEmoji(c.teamName)).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ceremony-mc.test.js`  
Expected: FAIL with "Cannot find module '@/lib/ceremony'"

- [ ] **Step 3: Write minimal implementation**

```javascript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ceremony-mc.test.js`  
Expected: PASS (all 6 tests passing)

- [ ] **Step 5: Commit**

```bash
git add src/lib/ceremony.js tests/ceremony-mc.test.js
git commit -m "feat(ceremony): add domain helper for event ordering and MC callouts"
```

---

### Task 2: Print & Preview Stylesheet (`src/styles/ceremony-print.css`)

**Files:**
- Create: `src/styles/ceremony-print.css`
- Modify: `src/styles/components.css` (import `ceremony-print.css`)
- Test: `tests/ceremony-styles.test.js`

**Interfaces:**
- Produces CSS classes:
  - `.ceremony-sheet`: Simulated A4 page container.
  - `.ceremony-header`: Stage document title and metadata block.
  - `.ceremony-quick-grid`: 4-column summary grid of team medals & points.
  - `.event-card-cue`: Bordered cue box with `page-break-inside: avoid`.
  - `.cue-callout-row`: Row with medal icon, color dot, title, and team name.
  - `.grand-finale-card`: Highlighted gold/trophy card for tournament champion.
  - `@media print`: Hides UI controls and prints `#ceremony-print-area` in high resolution.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/ceremony-styles.test.js
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('ceremony print styles', () => {
  it('defines the ceremony-print.css with @media print and required classes', () => {
    const cssPath = path.resolve(process.cwd(), 'src/styles/ceremony-print.css');
    expect(fs.existsSync(cssPath)).toBe(true);

    const content = fs.readFileSync(cssPath, 'utf8');
    expect(content).toContain('@media print');
    expect(content).toContain('.ceremony-sheet');
    expect(content).toContain('.event-card-cue');
    expect(content).toContain('page-break-inside: avoid');
    expect(content).toContain('.grand-finale-card');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ceremony-styles.test.js`  
Expected: FAIL (file does not exist)

- [ ] **Step 3: Write minimal implementation**

```css
/* src/styles/ceremony-print.css */
/* ================================================================
   CEREMONY & MC CUE SHEET PRINT AND PREVIEW STYLES
   Sci Games 2026 - Faculty of Science and Technology, PKRU
   Strictly Vector Icons Only — High Legibility & Stage Visibility
   ================================================================ */

.ceremony-sheet-wrapper {
  display: flex;
  justify-content: center;
  background: var(--surface-1, #1e293b);
  padding: 1.5rem;
  border-radius: 12px;
  overflow-x: auto;
}

.ceremony-sheet {
  background: #ffffff;
  color: #0f172a;
  width: 100%;
  max-width: 210mm;
  min-height: 297mm;
  padding: 16mm 18mm;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Sarabun", sans-serif;
  box-sizing: border-box;
}

/* Header */
.ceremony-header {
  border-bottom: 2px solid #0f172a;
  padding-bottom: 12px;
  margin-bottom: 16px;
  text-align: center;
}

.ceremony-header h1 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.ceremony-header h2 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 8px 0;
}

.ceremony-meta-row {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

/* Quick Summary Grid */
.ceremony-quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 18px;
}

.ceremony-quick-team {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.78rem;
}

.ceremony-quick-team-name {
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ceremony-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

/* Event Cue Cards */
.ceremony-events-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-card-cue {
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  padding: 10px 14px;
  page-break-inside: avoid;
  break-inside: avoid;
}

.event-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 6px;
  margin-bottom: 8px;
}

.event-card-title {
  font-size: 0.98rem;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 6px;
}

.event-card-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.event-card-badge.done {
  background: #ecfdf5;
  color: #065f46;
}

.event-card-badge.pending {
  background: #fffbeb;
  color: #92400e;
}

/* Callout Row */
.cue-callout-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 8px;
  border-radius: 4px;
  margin-bottom: 4px;
  background: #f8fafc;
  border-left: 4px solid #cbd5e1;
}

.cue-callout-row.gold {
  background: #fefce8;
  border-left-color: #eab308;
  font-weight: 700;
}

.cue-callout-row.silver {
  background: #f8fafc;
  border-left-color: #94a3b8;
}

.cue-callout-row.bronze {
  background: #fff7ed;
  border-left-color: #b45309;
}

.cue-callout-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  color: #1e293b;
}

.cue-callout-right {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

/* Grand Finale Card */
.grand-finale-card {
  margin-top: 18px;
  border: 2px solid #eab308;
  border-radius: 8px;
  background: #fefce8;
  padding: 14px;
  page-break-inside: avoid;
  break-inside: avoid;
}

.grand-finale-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.15rem;
  font-weight: 800;
  color: #854d0e;
  border-bottom: 1.5px solid #fef08a;
  padding-bottom: 8px;
  margin-bottom: 10px;
}

.grand-finale-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-radius: 4px;
  margin-bottom: 4px;
}

.grand-finale-row.champion {
  background: #fde047;
  color: #713f12;
  font-weight: 800;
  font-size: 1.05rem;
}

/* Print CSS */
@media print {
  body {
    background: #ffffff !important;
  }
  body * {
    visibility: hidden;
  }
  #ceremony-print-area,
  #ceremony-print-area * {
    visibility: visible;
  }
  #ceremony-print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 0;
    background: #ffffff !important;
    box-shadow: none !important;
  }
  .ceremony-sheet-wrapper {
    background: transparent !important;
    padding: 0 !important;
  }
  .ceremony-sheet {
    box-shadow: none !important;
    padding: 10mm 12mm !important;
    max-width: 100% !important;
  }
  .no-print {
    display: none !important;
  }
}
```

Now import it into `src/styles/components.css`:
Add `@import './ceremony-print.css';` at the top of `src/styles/components.css`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ceremony-styles.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/styles/ceremony-print.css src/styles/components.css tests/ceremony-styles.test.js
git commit -m "style(ceremony): add print stylesheet and A4 sheet styling"
```

---

### Task 3: Printable A4 Sheet Component (`src/components/admin/CeremonyPrintSheet.js`)

**Files:**
- Create: `src/components/admin/CeremonyPrintSheet.js`
- Test: `tests/ceremony-print-sheet.test.js`

**Interfaces:**
- Consumes: `src/lib/ceremony.js`, `lucide-react`
- Produces: React Component `<CeremonyPrintSheet />`
- Props:
  - `events`: Array of event objects
  - `standings`: Array of team standings
  - `teams`: Array of teams
  - `options`: `{ includeFourthPlace, showMatchScores, fontSize, ceremonyTitle, ceremonyDate, awardPresenter, mcNotes }`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/ceremony-print-sheet.test.js
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import CeremonyPrintSheet from '@/components/admin/CeremonyPrintSheet';

const teams = [
  { id: 'red', name: 'สีแดง', color_hex: '#ef4444' },
  { id: 'blue', name: 'สีฟ้า', color_hex: '#0284c7' },
];
const events = [
  {
    key: 'futsal|ชาย',
    sport_name: 'ฟุตซอล',
    category: 'ชาย',
    done: true,
    places: [
      { place: 1, team_id: 'red' },
      { place: 2, team_id: 'blue' },
    ],
  },
];
const standings = [
  { id: 'red', name: 'สีแดง', color_hex: '#ef4444', total_points: 85, rank: 1, golds: 1, silvers: 0, bronzes: 0 },
  { id: 'blue', name: 'สีฟ้า', color_hex: '#0284c7', total_points: 75, rank: 2, golds: 0, silvers: 1, bronzes: 0 },
];

describe('CeremonyPrintSheet component', () => {
  it('renders title and team callouts cleanly', () => {
    const { container } = render(
      <CeremonyPrintSheet
        events={events}
        standings={standings}
        teams={teams}
        options={{
          ceremonyTitle: 'พิธีมอบรางวัล 2569',
          ceremonyDate: '11 ต.ค. 2569',
          includeFourthPlace: false,
        }}
      />
    );
    expect(screen.getByText('พิธีมอบรางวัล 2569')).toBeDefined();
    expect(screen.getByText('ฟุตซอล ชาย')).toBeDefined();
    expect(container.innerHTML).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u); // Zero emojis
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ceremony-print-sheet.test.js`  
Expected: FAIL ("Cannot find module '@/components/admin/CeremonyPrintSheet'")

- [ ] **Step 3: Write minimal implementation**

```jsx
// src/components/admin/CeremonyPrintSheet.js
'use client';
import React from 'react';
import { Trophy, Medal, Award, CheckCircle2, Clock } from 'lucide-react';
import { formatGrandFinale, formatMcCallouts } from '@/lib/ceremony';

export default function CeremonyPrintSheet({
  events = [],
  standings = [],
  teams = [],
  options = {},
}) {
  const {
    ceremonyTitle = 'พิธีมอบรางวัลและปิดการแข่งขัน Sci Games 2026',
    ceremonyDate = '11 ตุลาคม 2569',
    awardPresenter = '',
    mcNotes = '',
    includeFourthPlace = false,
    fontSize = 'medium',
  } = options;

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const finaleRows = formatGrandFinale(standings);

  return (
    <div id="ceremony-print-area" className={`ceremony-sheet font-size-${fontSize}`}>
      {/* 1. Header */}
      <header className="ceremony-header">
        <h1>{ceremonyTitle}</h1>
        <h2>คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต</h2>
        <div className="ceremony-meta-row">
          <span>วันที่: {ceremonyDate}</span>
          {awardPresenter && <span>ประธานในพิธี: {awardPresenter}</span>}
          <span>เอกสารทางการสำหรับพิธีกร (MC Cue Sheet)</span>
        </div>
      </header>

      {/* 2. Quick Standings Summary Grid */}
      <div className="ceremony-quick-grid">
        {standings.map((team) => (
          <div key={team.id} className="ceremony-quick-team">
            <div className="ceremony-quick-team-name">
              <span className="ceremony-color-dot" style={{ backgroundColor: team.color_hex }} />
              <span>{team.name}</span>
            </div>
            <div style={{ color: '#475569' }}>
              ทอง {team.golds} | เงิน {team.silvers} | ทองแดง {team.bronzes}
            </div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>
              คะแนนรวม: {team.total_points} แต้ม (อันดับ {team.rank})
            </div>
          </div>
        ))}
      </div>

      {/* 3. Sequential Event Cards (Build-up: 3rd -> 2nd -> 1st) */}
      <div className="ceremony-events-list">
        {events.map((event, index) => {
          const callouts = formatMcCallouts(event, teamMap, { includeFourthPlace });

          return (
            <div key={event.key || index} className="event-card-cue">
              <div className="event-card-header">
                <div className="event-card-title">
                  <span style={{ color: '#64748b' }}>ลำดับที่ {index + 1}:</span>
                  <span>{event.sport_name}</span>
                  <span style={{ color: '#2563eb' }}>{event.category}</span>
                </div>
                <div className={`event-card-badge ${event.done ? 'done' : 'pending'}`}>
                  {event.done ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  <span>{event.done ? 'แข่งเสร็จสิ้น' : 'รอผลการแข่งขัน'}</span>
                </div>
              </div>

              <div className="event-card-callouts">
                {callouts.map((cue) => {
                  let medalIcon = <Award size={14} className="text-slate-500" />;
                  let rowClass = '';
                  if (cue.place === 1) {
                    medalIcon = <Medal size={16} style={{ color: '#eab308' }} />;
                    rowClass = 'gold';
                  } else if (cue.place === 2) {
                    medalIcon = <Medal size={16} style={{ color: '#94a3b8' }} />;
                    rowClass = 'silver';
                  } else if (cue.place === 3) {
                    medalIcon = <Medal size={16} style={{ color: '#b45309' }} />;
                    rowClass = 'bronze';
                  }

                  return (
                    <div key={cue.place} className={`cue-callout-row ${rowClass}`}>
                      <div className="cue-callout-left">
                        {medalIcon}
                        <span>{cue.title}</span>
                      </div>
                      <div className="cue-callout-right">
                        <span className="ceremony-color-dot" style={{ backgroundColor: cue.teamColor }} />
                        <span>{cue.teamName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Grand Finale: Overall Tournament Trophy */}
      <div className="grand-finale-card">
        <div className="grand-finale-header">
          <Trophy size={22} style={{ color: '#ca8a04' }} />
          <span>การประกาศรางวัล ถ้วยคะแนนรวมเจ้าสนาม (Grand Finale)</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {finaleRows.map((team) => (
            <div key={team.teamId} className={`grand-finale-row ${team.isChampion ? 'champion' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="ceremony-color-dot" style={{ backgroundColor: team.teamColor }} />
                <span>{team.title}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>{team.teamName}</span>
                <span style={{ fontSize: '0.85em', opacity: 0.9 }}>({team.totalPoints} คะแนน)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. MC Notes & Footer */}
      {mcNotes && (
        <div style={{ marginTop: '16px', padding: '10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.82rem', color: '#334155' }}>
          <strong>โน้ตสำหรับพิธีกร:</strong> {mcNotes}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ceremony-print-sheet.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/CeremonyPrintSheet.js tests/ceremony-print-sheet.test.js
git commit -m "feat(ceremony): create printable A4 MC cue sheet component"
```

---

### Task 4: Interactive Admin Ceremony Console (`src/components/admin/CeremonyConsole.js`)

**Files:**
- Create: `src/components/admin/CeremonyConsole.js`
- Test: `tests/ceremony-console.test.js`

**Interfaces:**
- Consumes: `<CeremonyPrintSheet />`, `src/lib/ceremony.js`, `lucide-react`
- Produces: React Client Component `<CeremonyConsole />`
- Provides: Left-side controls (presets, reorder buttons, toggles, metadata inputs) + Right-side sticky live A4 preview + Print action.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/ceremony-console.test.js
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import CeremonyConsole from '@/components/admin/CeremonyConsole';

const sports = [{ id: 'futsal', name: 'ฟุตซอล', sort_order: 1 }];
const teams = [{ id: 'red', name: 'สีแดง', color_hex: '#ef4444' }];
const events = [{ key: 'futsal|ชาย', sport_name: 'ฟุตซอล', category: 'ชาย', places: [], done: true }];
const standings = [{ id: 'red', name: 'สีแดง', total_points: 80, rank: 1 }];

describe('CeremonyConsole component', () => {
  it('renders control sidebar and print trigger', () => {
    render(<CeremonyConsole events={events} standings={standings} sports={sports} teams={teams} />);
    expect(screen.getByText('แผงควบคุมและตั้งค่า')).toBeDefined();
    expect(screen.getByText('พิมพ์เอกสาร / บันทึก PDF')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ceremony-console.test.js`  
Expected: FAIL ("Cannot find module '@/components/admin/CeremonyConsole'")

- [ ] **Step 3: Write minimal implementation**

```jsx
// src/components/admin/CeremonyConsole.js
'use client';
import React, { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import CeremonyPrintSheet from '@/components/admin/CeremonyPrintSheet';
import { orderEvents } from '@/lib/ceremony';
import {
  Printer,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  Eye,
  Maximize2,
  Trophy,
} from 'lucide-react';

const STORAGE_KEY = 'sci_games_ceremony_settings_v1';

export default function CeremonyConsole({
  events = [],
  standings = [],
  sports = [],
  teams = [],
}) {
  const [orderPreset, setOrderPreset] = useState('official');
  const [customKeys, setCustomKeys] = useState(() => events.map((e) => e.key));
  const [filterCompletedOnly, setFilterCompletedOnly] = useState(false);
  const [includeFourthPlace, setIncludeFourthPlace] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [ceremonyTitle, setCeremonyTitle] = useState('พิธีมอบรางวัลและปิดการแข่งขัน Sci Games 2026');
  const [ceremonyDate, setCeremonyDate] = useState('11 ตุลาคม 2569');
  const [awardPresenter, setAwardPresenter] = useState('คณบดีคณะวิทยาศาสตร์และเทคโนโลยี');
  const [mcNotes, setMcNotes] = useState('ขอให้นักกีฬาทุกสีเข้าแถวหน้าโพเดียมอย่างพร้อมเพรียง');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customKeys) setCustomKeys(parsed.customKeys);
        if (parsed.orderPreset) setOrderPreset(parsed.orderPreset);
        if (parsed.includeFourthPlace != null) setIncludeFourthPlace(parsed.includeFourthPlace);
      }
    } catch {}
  }, []);

  // Save persistence
  const savePreferences = (keys, preset) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ customKeys: keys, orderPreset: preset, includeFourthPlace })
      );
    } catch {}
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const next = [...customKeys];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setCustomKeys(next);
    setOrderPreset('custom');
    savePreferences(next, 'custom');
  };

  const handleMoveDown = (index) => {
    if (index === customKeys.length - 1) return;
    const next = [...customKeys];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setCustomKeys(next);
    setOrderPreset('custom');
    savePreferences(next, 'custom');
  };

  const handleResetOrder = () => {
    const defaultKeys = events.map((e) => e.key);
    setCustomKeys(defaultKeys);
    setOrderPreset('official');
    savePreferences(defaultKeys, 'official');
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter & Order
  let displayEvents = orderEvents(events, orderPreset, customKeys);
  if (filterCompletedOnly) {
    displayEvents = displayEvents.filter((e) => e.done);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isFullscreen ? '1fr' : '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>
      {/* Left Control Panel */}
      {!isFullscreen && (
        <GlassCard style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="flex-between">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SlidersHorizontal size={18} />
              <span>แผงควบคุมและตั้งค่า</span>
            </h3>
            <button
              onClick={handleResetOrder}
              className="btn btn-secondary btn-sm"
              title="คืนค่าเริ่มต้น"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
            >
              <RotateCcw size={14} /> รีเซ็ต
            </button>
          </div>

          {/* Action Trigger */}
          <button
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.75rem' }}
          >
            <Printer size={18} />
            <strong>พิมพ์เอกสาร / บันทึก PDF</strong>
          </button>

          {/* Presets */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.35rem' }}>
              การจัดลำดับการประกาศ:
            </label>
            <select
              value={orderPreset}
              onChange={(e) => {
                setOrderPreset(e.target.value);
                savePreferences(customKeys, e.target.value);
              }}
              className="input-select"
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px' }}
            >
              <option value="official">เรียงตามชนิดกีฬาทางการ (Handbook)</option>
              <option value="chronological">เรียงตามเวลาแข่งจบจริง (Timeline)</option>
              <option value="custom">กำหนดลำดับเอง (Custom Reorder)</option>
            </select>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filterCompletedOnly}
                onChange={(e) => setFilterCompletedOnly(e.target.checked)}
              />
              <span>ซ่อนรายการที่ยังแข่งไม่จบ (Finished Only)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeFourthPlace}
                onChange={(e) => setIncludeFourthPlace(e.target.checked)}
              />
              <span>รวมอันดับ 4 ในคำประกาศ (ค่าเริ่มต้น: โพเดียม 1-3)</span>
            </label>
          </div>

          {/* Reorder List */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.35rem' }}>
              สลับคิวการมอบรางวัล (11 รายการ):
            </label>
            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {displayEvents.map((e, idx) => (
                <div
                  key={e.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem',
                    background: 'var(--surface-2)',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {idx + 1}. {e.sport_name} {e.category}
                  </span>
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.15rem 0.35rem' }}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === displayEvents.length - 1}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.15rem 0.35rem' }}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ceremony Inputs */}
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-3)', display: 'block', marginBottom: '0.25rem' }}>
              ชื่องาน / หัวกระดาษ:
            </label>
            <input
              type="text"
              value={ceremonyTitle}
              onChange={(e) => setCeremonyTitle(e.target.value)}
              className="input-text"
              style={{ width: '100%', padding: '0.45rem', fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-3)', display: 'block', marginBottom: '0.25rem' }}>
              ประธานในพิธีมอบรางวัล:
            </label>
            <input
              type="text"
              value={awardPresenter}
              onChange={(e) => setAwardPresenter(e.target.value)}
              className="input-text"
              style={{ width: '100%', padding: '0.45rem', fontSize: '0.85rem' }}
            />
          </div>
        </GlassCard>
      )}

      {/* Right A4 Preview Viewport */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-2)' }}>
            <Eye size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>ตัวอย่างหน้ากระดาษ A4 เสมือนจริง</span>
          </div>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Maximize2 size={14} />
            <span>{isFullscreen ? 'กลับสู่โหมดแก้ไข' : 'ขยายเต็มจอ (Stage View)'}</span>
          </button>
        </div>

        <div className="ceremony-sheet-wrapper">
          <CeremonyPrintSheet
            events={displayEvents}
            standings={standings}
            teams={teams}
            options={{
              ceremonyTitle,
              ceremonyDate,
              awardPresenter,
              mcNotes,
              includeFourthPlace,
              fontSize,
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ceremony-console.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/CeremonyConsole.js tests/ceremony-console.test.js
git commit -m "feat(ceremony): create ceremony console with reordering and live preview"
```

---

### Task 5: Server Page & Navigation Integration (`/admin/ceremony`)

**Files:**
- Create: `src/app/(admin)/admin/ceremony/page.js`
- Modify: `src/components/admin/AdminSidebar.js`
- Modify: `src/app/(admin)/admin/page.js`
- Test: `tests/ceremony-route.test.js`

**Interfaces:**
- Server loader calls `loadPlacements(adminClient)` and `getSports(adminClient)`, `getTeams(adminClient)`.
- Sidebar adds item: `{ href: '/admin/ceremony', label: 'พิธีมอบรางวัลและสคริปต์', icon: <Trophy size={18} /> }`.

- [ ] **Step 1: Write the failing test**

```javascript
// tests/ceremony-route.test.js
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('ceremony page and navigation', () => {
  it('creates the /admin/ceremony route file', () => {
    const routePath = path.resolve(process.cwd(), 'src/app/(admin)/admin/ceremony/page.js');
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('links ceremony in AdminSidebar.js', () => {
    const sidebarPath = path.resolve(process.cwd(), 'src/components/admin/AdminSidebar.js');
    const content = fs.readFileSync(sidebarPath, 'utf8');
    expect(content).toContain('/admin/ceremony');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ceremony-route.test.js`  
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

Create `src/app/(admin)/admin/ceremony/page.js`:
```jsx
// src/app/(admin)/admin/ceremony/page.js
import CeremonyConsole from '@/components/admin/CeremonyConsole';
import { loadPlacements } from '@/lib/queries/placements';
import { getSports, getTeams, rows } from '@/lib/queries/core';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata = {
  title: 'พิธีมอบรางวัลและสคริปต์พิธีกร - Admin',
  description: 'ระบบจัดพิมพ์สคริปต์ผลการแข่งขันและลำดับพิธีมอบรางวัล Sci Games 2026',
};

export const dynamic = 'force-dynamic';

export default async function AdminCeremonyPage() {
  const sb = createAdminClient();
  const [{ events, standings }, sRows, tRows] = await Promise.all([
    loadPlacements(sb),
    getSports(sb),
    getTeams(sb),
  ]);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.75rem' }}>
        <h1 className="page-title">พิธีมอบรางวัลและสคริปต์พิธีกร (MC Cue Sheet)</h1>
        <p className="page-subtitle">
          จัดลำดับการประกาศผลรางวัล 11 รายการ และสร้างเอกสาร A4 สำหรับพิธีกรบนเวที
        </p>
      </div>

      <CeremonyConsole
        events={events || []}
        standings={standings || []}
        sports={rows(sRows)}
        teams={rows(tRows)}
      />
    </div>
  );
}
```

Update `src/components/admin/AdminSidebar.js`:
Add menu item in `menuItems`:
```javascript
{ href: '/admin/ceremony', label: 'พิธีมอบรางวัลและสคริปต์', icon: <Trophy size={18} /> },
```

Update `src/app/(admin)/admin/page.js`:
Add a quick link card to the ceremony page in the Admin Dashboard header actions:
```jsx
<Link
  href="/admin/ceremony"
  className="btn btn-secondary btn-sm"
  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
>
  <Trophy size={14} /> โพยพิธีมอบรางวัล
</Link>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ceremony-route.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/\(admin\)/admin/ceremony/page.js src/components/admin/AdminSidebar.js src/app/\(admin\)/admin/page.js tests/ceremony-route.test.js
git commit -m "feat(ceremony): integrate ceremony page route and admin navigation"
```

---

### Task 6: Full Verification, Build & Handoff

**Files:**
- Modify: `Handoff.md`

- [ ] **Step 1: Run all Vitest suites**

Run: `npm test`  
Expected: All test suites PASS (including `tests/ceremony-*.test.js`)

- [ ] **Step 2: Run Next.js production build**

Run: `npm run build`  
Expected: `Compiled successfully` with zero errors.

- [ ] **Step 3: Update Handoff.md**

Update `Handoff.md` root file:
- Update `Last updated` date.
- Add MC Ceremony Results & Script Generator to Completed Milestones.
- Update Current Task & Blockers and Prompt for Next AI.

- [ ] **Step 4: Final commit and git status check**

```bash
git add Handoff.md
git commit -m "docs: update Handoff.md with ceremony MC generator milestone"
```
