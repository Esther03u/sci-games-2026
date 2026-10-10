# Design Specification: MC Award Ceremony Results & Script Generator (Sci Games 2026)

**Date:** 2026-10-10  
**Status:** Approved by User  
**Target URL:** `/admin/ceremony`  
**Icon System:** Vector Icons Only (via `lucide-react` / `@hugeicons/react`), **STRICTLY NO EMOJIS**

---

## 1. Problem Statement & Objectives

During the closing and award ceremony of **Sci Games 2026** (คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต), the Master of Ceremonies (MC / พิธีกร) must announce the winners across 11 official sports events and conclude with the Overall Tournament Championship Trophy (ถ้วยรวมเจ้าสนาม).

Previously, there was no centralized ceremony script or printable cue sheet in the backend. Match results were spread across brackets and public standings, requiring manual collation.

### Core Objectives:
1. **Dedicated Admin Console (`/admin/ceremony`)**: Provide a ceremony management and printing console in the admin area.
2. **Total Customizability**: Allow administrators to configure the presentation sequence (Official Sport order, Chronological order, or Custom reordering with Up/Down controls), toggle details (include 4th place, show scores, show MC reading cues), and adjust text sizes for stage legibility.
3. **MC-Optimized Script Layout (Build-Up Flow)**: Structure each award cue from **3rd Place (Bronze) → 2nd Place (Silver) → 1st Place (Gold)** to build stage excitement, ending with the **Overall Championship (ถ้วยรวมเจ้าสนาม)**.
4. **Professional Typography & Print Engine**: Render clean A4 pages via CSS `@media print` that print cleanly on any browser or save to PDF with zero Thai vowel/glyph distortion, preserving team colors and crisp contrast.
5. **Icon Standard**: Use clean, modern vector icons (`lucide-react`) for medals, sports, trophies, and status indicators. **Never use emojis.**

---

## 2. Architecture & Data Flow

```
+-------------------------------------------------------------+
| Supabase Database                                           |
| - matches_public_v3 (final & third-place matches)           |
| - sports (futsal, volleyball, takraw, basketball, petanque) |
| - teams (Red, Blue, Green, Purple with hex colors)          |
| - app_settings (placement_points, formula)                  |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| Server Loader: src/app/(admin)/admin/ceremony/page.js       |
| - loadPlacements() via src/lib/queries/placements.js        |
| - Aggregates 11 events + Overall Standings (computeStandings)|
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| Client Interactive Console: CeremonyConsole.js              |
| - State Management (Presets, Custom Order, Toggles, Notes)  |
| - LocalStorage Persistence for Custom Order                 |
| - Reorder controls (Move Up / Move Down)                    |
| - Live Dual-Pane View: Settings (Left) + A4 Sheet (Right)   |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| Printable Sheet: CeremonyPrintSheet.js + ceremony-print.css |
| - MC Cue Sheet Layout & Official Summary Matrix             |
| - Vector Icons for Medals (Medal, Trophy, Award, Shield)    |
| - High-Legibility Callouts (16-18pt names, team badges)     |
| - @media print styling (A4 portrait, page-break-inside avoid)
+-------------------------------------------------------------+
```

---

## 3. Detailed Component Specifications

### 3.1 Server Component (`src/app/(admin)/admin/ceremony/page.js`)
- Server-rendered page protected by Admin layout authentication.
- Fetches data using existing, tested helper `loadPlacements(adminClient)` from `src/lib/queries/placements.js`.
- Supplies `events`, `standings`, `sports`, `teams`, and `points` directly as props to `CeremonyConsole`.

### 3.2 Admin Console (`src/components/admin/CeremonyConsole.js`)
- Responsive two-column workspace:
  - **Left Sidebar (380px)**: Customization controls & settings.
  - **Right Viewport (Flex)**: Real-time A4 Live Preview and Print trigger.
- **State Properties**:
  - `mode`: `'script'` (MC Reading Cue Sheet) | `'table'` (Formal Results Matrix).
  - `orderPreset`: `'official'` | `'chronological'` | `'custom'`.
  - `orderedEventKeys`: Array of event keys (`${sport_id}|${category}`). Persisted in `localStorage`.
  - `filterCompletedOnly`: Boolean (hide unplayed matches vs show `[ รอผล ]` badge).
  - `includeFourthPlace`: Boolean (default: `false` — top 3 podium only).
  - `showMatchScores`: Boolean (default: `true` — display final set/score in brackets).
  - `fontSize`: `'normal'` | `'medium'` (default) | `'large'`.
  - `ceremonyTitle`: Text (default: "พิธีมอบรางวัลและปิดการแข่งขัน Sci Games 2026").
  - `ceremonyDate`: Text (default: "11 ตุลาคม 2569").
  - `awardPresenter`: Text (optional).
  - `mcNotes`: Text (stage announcements, reminder instructions).
- **Actions**:
  - `handleMoveUp(index)` / `handleMoveDown(index)`: Reorder events in custom mode.
  - `handleResetOrder(preset)`: Reset order to official handbook or chronological timeline.
  - `handlePrint()`: Triggers `window.print()` targeting `#ceremony-print-area`.
  - `handleToggleFullscreen()`: Expand preview to fullscreen for live stage reading on tablet/iPad.

### 3.3 Print Sheet Component (`src/components/admin/CeremonyPrintSheet.js`)
- Structured specifically for stage reading without eye strain or ambiguity:
  1. **Header Section**:
     - Tournament title and faculty metadata.
     - Date, venue, and presenter info.
     - **Quick Standings Summary Grid**: 4 teams showing current medals (Golds, Silvers, Bronzes) and Total Points (out of 100).
  2. **Sequential Event Cues (11 Official Events)**:
     - Header per event: Event sequence number, Sport icon (`Trophy`, `Activity`, `Flame`, etc.), Sport name, and Category.
     - Status flag: If not yet completed, renders an explicit warning badge (`Clock` icon + "รอผลการแข่งขัน").
     - **Podium Callouts** (displayed in bottom-to-top announcement order):
       - 🥉 **รองชนะเลิศอันดับ 2 (เหรียญทองแดง)**: Bronze medal icon + Team badge + Score.
       - 🥈 **รองชนะเลิศอันดับ 1 (เหรียญเงิน)**: Silver medal icon + Team badge + Score.
       - 🥇 **ชนะเลิศ (เหรียญทอง)**: Gold medal icon (highlighted) + Team badge + Score.
       - (Optional 4th place): `Award` icon + Team badge.
     - Shared ranks note: If tie-breaker results in equal place, displays "(ครองอันดับร่วมกัน)".
  3. **Grand Finale: Overall Championship (ถ้วยรางวัลคะแนนรวมเจ้าสนาม)**:
     - Distinct highlighted section at the end.
     - Places 4th → 3rd → 2nd → 1st (Overall Champion).
     - Renders Trophy icon (`Trophy`), Team badge, Total Points (`XX.XX / 100 คะแนน`), and Raw Points (`XXX / 330 คะแนนดิบ`).
  4. **Footer / MC Notes**:
     - Custom notes for the announcer (e.g., photo-op instructions, closing speech cues).
     - Page number indicator ("หน้าที่ 1 จาก X") and generation timestamp.

### 3.4 Vector Icons Strategy (Strictly No Emojis)
All visual indicators use `lucide-react` icons with appropriate semantic styling:
- **Trophy / Overall Cup**: `<Trophy size={20} className="text-amber-500" />`
- **Gold Medal (ชนะเลิศ)**: `<Medal size={18} className="text-yellow-500" />`
- **Silver Medal (รองอันดับ 1)**: `<Medal size={18} className="text-slate-400" />`
- **Bronze Medal (รองอันดับ 2)**: `<Medal size={18} className="text-amber-700" />`
- **Fourth Place / Commendation**: `<Award size={16} className="text-blue-400" />`
- **Team Color Badges**: Solid color dot / badge component (`<span style={{ backgroundColor: colorHex }} />`), **no color emojis**.
- **Pending Match**: `<Clock size={16} />`
- **Completed Match**: `<CheckCircle2 size={16} />`
- **Print Action**: `<Printer size={18} />`
- **Move Up / Down**: `<ChevronUp size={16} />`, `<ChevronDown size={16} />`

---

## 4. Styling & Print Specifications (`ceremony-print.css`)

### 4.1 Screen Preview Styles
- Background: Neutral dark admin theme (`var(--bg-main)`).
- Paper Simulation: Centered A4 container (`width: 210mm`, min-height `297mm`) with white background, high-contrast dark text (`#0f172a`), subtle paper drop-shadow.

### 4.2 Print Media Styles (`@media print`)
```css
@media print {
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
    color: #0f172a !important;
  }
  @page {
    size: A4 portrait;
    margin: 12mm 15mm;
  }
  .event-card-cue {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .grand-finale-section {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .no-print {
    display: none !important;
  }
}
```

---

## 5. Navigation & Admin Integration

1. **Admin Sidebar / Header**:
   - Add "พิธีมอบรางวัลและสคริปต์" (`/admin/ceremony`) with `<Trophy size={18} />` icon in the navigation structure.
2. **Admin Dashboard Quick Link (`src/app/(admin)/admin/page.js`)**:
   - Add a quick-access card to the dashboard so admins can jump directly to the ceremony sheet on tournament day.

---

## 6. Testing & Quality Assurance Plan

1. **Unit Tests (`tests/ceremony-mc.test.js`)**:
   - Verify `computeEventPlacements` maps all 11 official events correctly.
   - Verify event ordering presets (official handbook order vs custom array ordering).
   - Verify script cue text formatting (Bronze → Silver → Gold hierarchy).
   - Verify incomplete event handling (fallback formatting when matches are upcoming).
   - Verify 0-scale to 100-scale tournament point conversion formatting.
2. **Icon & Emoji Verification**:
   - Automated grep check to ensure zero emoji characters (`🔴`, `🥇`, `🏆`, etc.) are rendered in the generated script output.
3. **Build Validation**:
   - Execute `npm run build` to confirm zero Next.js App Router or bundling errors.
   - Run existing test suites (`npm run test`) to ensure zero regressions.

---

## 7. Spec Self-Review Checklist

- [x] **No TBD or TODO placeholders**: All requirements and file mappings are explicitly defined.
- [x] **Internal consistency**: Data source matches existing `src/lib/placements.js` and `matches_public_v3` views.
- [x] **Strict constraints observed**: Explicitly forbids emojis and defines `lucide-react` icon usage throughout.
- [x] **Clear file boundaries**: Components isolated into clean Single-Responsibility units.
