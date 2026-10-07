# New Schedule & Downloadable PDF Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the official tournament schedule and fixtures across the application and update the downloadable schedule PDF to match the newly approved official 3-page schedule document (Sci Games 2026, 8–11 October 2569).

**Architecture:** Replace the static PDF file `public/docs/sci-games-2026-schedule.pdf` with the latest official file (`กำหนดการ69 (3).pdf`, 134 KB), update document metadata in `src/data/documents.js`, update the fallback fixture dataset in `src/data/handbook.js` from 44 to 36 matches (reflecting the removal of women's Takraw and women's Basketball, and the consolidation of Basketball to Friday evening), update public schedule copy/metadata in `src/app/(public)/schedule/page.js`, and adjust unit tests in `tests/handbook-schedule.test.js` and `tests/bracket-progression.test.js`.

**Tech Stack:** Next.js 16 (App Router), React 19, Vanilla CSS Glassmorphism, Vitest, Node.js FS.

**Spec:** The official 3-page schedule document provided by the user:
- Page 1: Thursday 8 Oct (Futsal 4 matches), Friday 9 Oct (Petanque 12 matches)
- Page 2: Friday 9 Oct (Takraw Men 4 matches, Volleyball 2 matches, Basketball Men 4 matches, Futsal 4 medal matches); Saturday 10 Oct (Volleyball 4 matches)
- Page 3: Sunday 11 Oct (Opening ceremony, Giant Volleyball, Volleyball women's final, Volleyball men's final, Closing/Awards ceremony)

## Global Constraints

- Preserve all existing styling tokens and design standards (Vanilla CSS Glassmorphism, no Tailwind).
- Maintain 100% test coverage; all Vitest tests must pass (`npm test`).
- Production build must succeed cleanly without errors or warnings (`npm run build`).
- Do not touch database migration files or secrets.
- Update `Handoff.md` upon completion as required by project rules.

---

### Task 1: Replace Schedule PDF Asset and Update Document Metadata

**Files:**
- Modify: `public/docs/sci-games-2026-schedule.pdf` (copied from `C:\Users\LENOVO\Downloads\กำหนดการ69 (3).pdf`)
- Modify: `src/data/documents.js`
- Test: `tests/documents.test.js`

**Interfaces:**
- Consumes: `C:\Users\LENOVO\Downloads\กำหนดการ69 (3).pdf` (134,042 bytes, modified 2026-10-06)
- Produces: Updated `public/docs/sci-games-2026-schedule.pdf` and updated `OFFICIAL_DOCUMENTS` in `src/data/documents.js`

- [ ] **Step 1: Check existing document tests**

Run: `npx vitest run tests/documents.test.js`
Expected: PASS (baseline check)

- [ ] **Step 2: Copy the new official PDF to `public/docs/sci-games-2026-schedule.pdf`**

Copy `C:\Users\LENOVO\Downloads\กำหนดการ69 (3).pdf` to `public/docs/sci-games-2026-schedule.pdf`.
Verify file size: 134,042 bytes (131 KB).

- [ ] **Step 3: Update metadata in `src/data/documents.js`**

In `src/data/documents.js`, update `schedule-2026`:
- `fileSize: '131 KB'` (was `141 KB`)
- `updatedAt: '2026-10-07'`
- `highlights`:
  - `'วันพฤหัสบดี 8 ต.ค. 2569: ฟุตซอลรอบแรก ชาย-หญิง (4 แมตช์ 17:30 - 21:30 น.)'`
  - `'วันศุกร์ 9 ต.ค. 2569: เปตอง (12 แมตช์), ตะกร้อชาย (4 แมตช์ จบชิงชนะเลิศ), วอลเลย์บอล, บาสเกตบอลชาย (4 แมตช์ จบชิงชนะเลิศ), ฟุตซอล (ชิงที่ 3 & ชิงชนะเลิศ)'`
  - `'วันเสาร์ 10 ต.ค. 2569: วอลเลย์บอลรอบแรก และรอบชิงอันดับ 3 ชาย-หญิง (4 แมตช์ 10:00 - 15:00 น.)'`
  - `'วันอาทิตย์ 11 ต.ค. 2569: พิธีเปิด (09:00 น.), วอลเลย์บอลยักษ์, วอลเลย์บอลรอบชิงชนะเลิศ หญิง-ชาย และพิธีมอบรางวัล/พิธีปิด (14:30 - 16:30 น.)'`

- [ ] **Step 4: Verify test passes**

Run: `npx vitest run tests/documents.test.js`
Expected: PASS

---

### Task 2: Update Match Fixtures Dataset in `src/data/handbook.js`

**Files:**
- Modify: `src/data/handbook.js`
- Test: `tests/handbook-schedule.test.js`

**Interfaces:**
- Consumes: Official 3-page schedule document
- Produces: `OFFICIAL_MATCHES` (36 matches total: Futsal 8, Petanque 12, Takraw 4, Volleyball 8, Basketball 4)

- [ ] **Step 1: Update Takraw fixtures in `RAW_MATCHES`**

Keep 4 Men's matches on Friday 9 Oct:
- `takraw-m1`: match_number 1, 17:30-18:00 น., รอบแรก ชาย, สีเขียว vs สีแดง, next_match_id: 'takraw-m8' (slot 'a'), loser_next_match_id: 'takraw-m5' (slot 'a')
- `takraw-m2`: match_number 2, 18:00-18:30 น., รอบแรก ชาย, สีม่วง vs สีฟ้า, next_match_id: 'takraw-m8' (slot 'b'), loser_next_match_id: 'takraw-m5' (slot 'b')
- `takraw-m5`: match_number 5, 18:30-19:00 น., ชิงอันดับ 3 ชาย (Losers m1 & m2)
- `takraw-m8`: match_number 8, 19:00-19:30 น., ชิงชนะเลิศ ชาย (Winners m1 & m2)
Remove `takraw-m3`, `takraw-m4`, `takraw-m6`, `takraw-m7` (women's category removed in new schedule).

- [ ] **Step 2: Update Basketball fixtures in `RAW_MATCHES`**

Keep 4 Men's matches on Friday 9 Oct:
- `basketball-m1`: match_number 1, 17:30-18:30 น., รอบแรก ชาย, สีเขียว vs สีม่วง, next_match_id: 'basketball-m3' (slot 'a'), loser_next_match_id: 'basketball-m4' (slot 'a')
- `basketball-m2`: match_number 2, 18:30-19:30 น., รอบแรก ชาย, สีฟ้า vs สีแดง, next_match_id: 'basketball-m3' (slot 'b'), loser_next_match_id: 'basketball-m4' (slot 'b')
- `basketball-m3`: match_number 3, 19:30-20:30 น., ชิงชนะเลิศ (ชิงที่ 1) ชาย (Winners m1 & m2)
- `basketball-m4`: match_number 4, 20:30-21:30 น., ชิงอันดับ 3 (ชิงที่ 3) ชาย (Losers m1 & m2)
Remove `basketball-m5`, `basketball-m6`, `basketball-m7`, `basketball-m8` (women's category and Saturday fixtures removed).

- [ ] **Step 3: Verify Futsal, Petanque, Volleyball, and Ceremonies remain aligned**

Ensure:
- Futsal: 8 matches (m1 to m8) intact
- Petanque: 12 matches (m1 to m12) intact
- Volleyball: 8 matches (m1 to m8) intact
- Ceremonies: Sunday 11 Oct program intact

---

### Task 3: Update Unit Tests for 36-Match Schedule and Bracket Progression

**Files:**
- Modify: `tests/handbook-schedule.test.js`
- Modify: `tests/bracket-progression.test.js`

**Interfaces:**
- Consumes: `src/data/handbook.js` (36 matches)
- Produces: Passing test assertions for 36 matches, sports split, time slots, and knockout bracket wiring

- [ ] **Step 1: Update `tests/handbook-schedule.test.js`**

Update assertions:
- `expect(OFFICIAL_MATCHES).toHaveLength(36);`
- `perSport`:
  ```javascript
  expect(perSport).toEqual({
    'sport-futsal': 8,
    'sport-volleyball': 8,
    'sport-takraw': 4,
    'sport-basketball': 4,
    'sport-petanque': 12,
  });
  ```
- Takraw match times (4 matches):
  ```javascript
  expect(takraw.map((m) => m.match_time)).toEqual([
    '17:30:00',
    '18:00:00',
    '18:30:00',
    '19:00:00',
  ]);
  ```
- `firstRound` length: 18 (Futsal 4 + Petanque 6 + Takraw 2 + Volleyball 4 + Basketball 2)
- `knockout` length: 18
- `slots.size`: 36 (18 knockout matches × 2 slots)

- [ ] **Step 2: Update `tests/bracket-progression.test.js`**

Update assertions:
- `expect(OFFICIAL_MATCHES.length).toBe(36);`
- `finalsAndThirds.length`: 18
- `semiFinals.length`: 18

- [ ] **Step 3: Run Vitest tests**

Run: `npx vitest run tests/handbook-schedule.test.js tests/bracket-progression.test.js`
Expected: PASS

---

### Task 4: Update UI Copy and Page Presentation

**Files:**
- Modify: `src/app/(public)/schedule/page.js`

**Interfaces:**
- Consumes: Schedule count (36 matches)
- Produces: Updated metadata description and hero subtitle

- [ ] **Step 1: Update `src/app/(public)/schedule/page.js`**

Change text references from 44 matches to 36 matches:
- Metadata description: `'ตารางเวลาและสถานที่แข่งขันกีฬา 5 ชนิด 36 แมตช์ ในงาน Sci Games 2026 ตามสูจิบัตรและกำหนดการทางการ'`
- Page subtitle: `'ตารางเวลาและสถานที่แข่งขันครบทุก 5 ชนิดกีฬา รวม 36 แมตช์ ระหว่างวันที่ 8 – 11 ตุลาคม 2569'`

- [ ] **Step 2: Run full test suite and production build**

Run: `npm test`
Expected: 124 passed (all tests green)
Run: `npm run build`
Expected: Next.js build succeeds with 0 errors

---

### Task 5: Update Hand-Off Summary and Git Commit

**Files:**
- Modify: `Handoff.md`

- [ ] **Step 1: Update `Handoff.md`**

Add completed milestone detailing:
- Schedule update according to the new official 3-page schedule (`กำหนดการ69 (3).pdf`, 134 KB)
- Match count updated to 36 matches (Takraw Men 4 matches, Basketball Men 4 matches)
- PDF asset replaced at `public/docs/sci-games-2026-schedule.pdf`
- Document metadata, schedule page copy, and bracket progression tests updated
- Vitest and build verification results

- [ ] **Step 2: Commit and push changes**

```bash
git add public/docs/sci-games-2026-schedule.pdf src/data/documents.js src/data/handbook.js src/app/\(public\)/schedule/page.js tests/handbook-schedule.test.js tests/bracket-progression.test.js docs/superpowers/plans/2026-10-07-schedule-and-pdf-update.md Handoff.md
git commit -m "feat(schedule): update tournament schedule to 36 matches and replace official PDF asset"
git push origin main
```
