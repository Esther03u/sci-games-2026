# Hybrid / Smart Hash Real-Time Auto-Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement lightweight, battery-aware, real-time auto-refresh on spectator pages (`/schedule`, `/results`, `/`) using ETag / 304 Not Modified smart hashing without exceeding Supabase Free Tier quotas.

**Architecture:** Spectator pages perform conditional polling against `/api/live-summary` via Edge CDN cache with `If-None-Match: <etag>`. Unchanged data returns 0-byte 304 responses with zero re-renders; changed data triggers smart-diff state updates. Staff/Admin retain instant WebSocket Realtime.

**Tech Stack:** Next.js 16 App Router, JavaScript, React 19, Supabase (@supabase/ssr), Node.js crypto / web-crypto, Vitest.

**Spec:** [`docs/superpowers/specs/2026-10-07-hybrid-smart-hash-refresh-design.md`](file:///c:/Users/LENOVO/OneDrive%20-%20Phuket%20Rajabhat%20University/SMO/%E0%B9%81%E0%B8%9C%E0%B8%99%E0%B9%82%E0%B8%84%E0%B8%A3%E0%B8%87%E0%B8%81%E0%B8%B2%E0%B8%A3%20%E0%B8%9B%E0%B8%B5%202569/%E0%B8%81%E0%B8%B5%E0%B8%AC%E0%B8%B2%E0%B8%AA%E0%B8%B5/Webforsport/docs/superpowers/specs/2026-10-07-hybrid-smart-hash-refresh-design.md)

## Global Constraints
- Preserve Supabase Free Tier quotas (at most 1 database read per 30s window on spectator paths via Edge CDN).
- Never open direct spectator WebSocket connections (protect 200 connection limit).
- All tests must pass via `npm test` (baseline: 124 passed tests).
- Production build must compile cleanly via `npm run build` (25 routes).
- Follow project rules in `AGENTS.md`: Update `Handoff.md` and push to `main` upon completion.

---

### Task 1: Backend ETag & HTTP 304 Support on `/api/live-summary`

**Files:**
- Modify: `src/app/api/live-summary/route.js`
- Create: `src/lib/data-etag.js`
- Test: `tests/live-summary-etag.test.js`

**Interfaces:**
- Produces: `generateSummaryEtag(data)` -> returns deterministic `W/"<hash>"` string.
- Produces: `GET /api/live-summary` -> returns HTTP 304 when incoming `If-None-Match` matches current ETag; returns HTTP 200 with `ETag` header otherwise.

- [ ] **Step 1: Write failing test in `tests/live-summary-etag.test.js`**
  Write tests asserting deterministic ETag generation from sample match/sport/team data, and testing that matching hashes produce identical ETags while modified fields produce different ETags.

- [ ] **Step 2: Run test to verify failure**
  Run `npx vitest run tests/live-summary-etag.test.js` and verify it fails due to missing module.

- [ ] **Step 3: Implement `src/lib/data-etag.js` and modify `src/app/api/live-summary/route.js`**
  - Implement `generateSummaryEtag` using Node crypto hash on normalized JSON.
  - In `route.js`, compute ETag, compare against `request.headers.get('if-none-match')`. If match, return 304 empty response. If not, include `ETag` in headers.

- [ ] **Step 4: Run tests to verify pass**
  Run `npx vitest run tests/live-summary-etag.test.js` and confirm 100% pass.

- [ ] **Step 5: Commit**
  `git add src/lib/data-etag.js src/app/api/live-summary/route.js tests/live-summary-etag.test.js; git commit -m "feat(api): add etag and 304 not modified support to live-summary"`

---

### Task 2: Client Hook Smart ETag Polling & Diffing in `useLiveScores`

**Files:**
- Modify: `src/hooks/useLiveScores.js`
- Test: `tests/useLiveScores-smart-refresh.test.js`

**Interfaces:**
- Consumes: `/api/live-summary` with ETag.
- Produces: `useLiveScores(initial, { pollMs, realtime, publicView })` with `etagRef`, silent 304 handling, and smart match diffing.

- [ ] **Step 1: Write failing test in `tests/useLiveScores-smart-refresh.test.js`**
  Test match diffing logic (identifying whether incoming matches differ in status, score, time, court, or participants).

- [ ] **Step 2: Run test to verify failure**
  Run `npx vitest run tests/useLiveScores-smart-refresh.test.js`.

- [ ] **Step 3: Implement ETag check and smart diffing in `src/hooks/useLiveScores.js`**
  - In `refresh()`: add `If-None-Match` header using `etagRef.current`.
  - When status is 304, exit early without calling `setSports`, `setTeams`, or `setMatchMap`.
  - When status is 200, update `etagRef.current`, perform smart diff before updating `setMatchMap`.
  - Set default `pollMs = 12000` (12 seconds) for active tabs.
  - Pause polling on `visibilityState === 'hidden'`; resume and immediately refresh on `visibilityState === 'visible'` and `online`.

- [ ] **Step 4: Run tests to verify pass**
  Run `npx vitest run tests/useLiveScores-smart-refresh.test.js` and existing tests.

- [ ] **Step 5: Commit**
  `git add src/hooks/useLiveScores.js tests/useLiveScores-smart-refresh.test.js; git commit -m "feat(hook): add etag 304 smart polling and diffing to useLiveScores"`

---

### Task 3: Connect Auto-Refresh to Schedule Page (`/schedule`)

**Files:**
- Modify: `src/components/public/ScheduleGrid.js`
- Test: `tests/schedule-live-refresh.test.js`

**Interfaces:**
- Consumes: `useLiveScores` with `{ realtime: false, publicView: true, pollMs: 12000 }`.
- Produces: Dynamic `matches` in `ScheduleGrid` that updates without resetting user filter state (`selectedDay`, `selectedSport`, `selectedCategory`).

- [ ] **Step 1: Write failing test in `tests/schedule-live-refresh.test.js`**
  Test that schedule grouping updates match details when live data updates while retaining user filter selections.

- [ ] **Step 2: Run test to verify failure**
  Run `npx vitest run tests/schedule-live-refresh.test.js`.

- [ ] **Step 3: Update `src/components/public/ScheduleGrid.js`**
  Integrate `useLiveScores({ matches, sports, teams }, { realtime: false, publicView: true, pollMs: 12000 })` to drive the displayed matches.

- [ ] **Step 4: Run tests to verify pass**
  Run `npx vitest run tests/schedule-live-refresh.test.js` and all existing schedule tests.

- [ ] **Step 5: Commit**
  `git add src/components/public/ScheduleGrid.js tests/schedule-live-refresh.test.js; git commit -m "feat(schedule): connect schedule grid to smart live auto-refresh"`

---

### Task 4: Connect Auto-Refresh to Home Page Featured Matches (`/`)

**Files:**
- Create: `src/components/public/FeaturedMatchesLive.js`
- Modify: `src/app/(public)/page.js`
- Test: `tests/featured-matches-live.test.js`

**Interfaces:**
- Consumes: `useLiveScores` and `pickFeaturedMatches`.
- Produces: `<FeaturedMatchesLive initialMatches={matches} sports={sports} teams={teams} />` for homepage Section 3.

- [ ] **Step 1: Write failing test in `tests/featured-matches-live.test.js`**
  Test that `FeaturedMatchesLive` updates featured matches when live match data updates.

- [ ] **Step 2: Run test to verify failure**
  Run `npx vitest run tests/featured-matches-live.test.js`.

- [ ] **Step 3: Create `FeaturedMatchesLive.js` and integrate into `src/app/(public)/page.js`**
  Replace static mapping in Section 3 of `page.js` with `<FeaturedMatchesLive />`.

- [ ] **Step 4: Run tests to verify pass**
  Run `npx vitest run tests/featured-matches-live.test.js`.

- [ ] **Step 5: Commit**
  `git add src/components/public/FeaturedMatchesLive.js src/app/(public)/page.js tests/featured-matches-live.test.js; git commit -m "feat(home): add live auto-refresh to featured matches on homepage"`

---

### Task 5: Full Verification, Documentation & Push

**Files:**
- Modify: `Handoff.md`

- [ ] **Step 1: Run complete test suite**
  `npm test` -> verify all test suites pass.

- [ ] **Step 2: Run production build**
  `npm run build` -> verify 25 routes compile cleanly.

- [ ] **Step 3: Run linter**
  `npm run lint` -> 0 errors / 0 warnings.

- [ ] **Step 4: Update `Handoff.md`**
  Document the completion of the Hybrid / Smart Hash real-time auto-refresh milestone.

- [ ] **Step 5: Commit and push to `origin/main`**
  `git commit -m "docs(handoff): document hybrid smart hash auto-refresh implementation"; git push origin main`
