# Design Specification: Hybrid / Smart Hash Real-Time Auto-Refresh

- **Date:** 2026-10-07
- **Status:** Approved
- **Target Audience:** Sci Games 2026 Spectators, Referees, and Administrators
- **Branch:** `main`

---

## 1. Executive Summary & Problem Statement

### 1.1 Context
In the Sci Games 2026 tournament (October 8–11, 2026), hundreds of spectators (students, faculty members, and guests) open the website on their smartphones. Simultaneously, referees and administrators update scores, match statuses, schedules, courts, and bracket progressions from tournament venues.

### 1.2 The Problem
- Currently, spectator pages such as `/schedule` (Schedule Grid) and `/` (Home Featured Matches) render data statically on the server (ISR 30s) and **do not automatically refresh** on the client when background tournament data changes. Spectators are forced to manually reload the entire browser page (F5 / pull-to-refresh), which re-downloads stylesheets, fonts, and scripts.
- The `/results` page does poll `/api/live-summary` every 30 seconds, but it triggers unconditional component re-renders even when no data has changed.
- Simply opening a direct Supabase Realtime WebSocket connection on every spectator's phone would **instantly exhaust Supabase Free Tier's 200 concurrent connection quota**, causing system collapse during the sports festival.

### 1.3 The Solution: Hybrid / Smart Hash Architecture
- **Spectator Pages (`/schedule`, `/results`, `/`):** Utilize **Smart Hash / ETag Polling** against `/api/live-summary` via Edge CDN cache.
  - Every 10–15 seconds (or immediately when the user switches tabs / wakes their phone), a lightweight condition check with `If-None-Match: <hash>` is dispatched.
  - If nothing changed: Server / CDN replies with **HTTP 304 Not Modified (0 bytes body)**. The client does zero DOM updates and zero re-renders.
  - If data changed: Server returns the updated JSON with a new ETag. The client performs a **Smart Diff** and updates only the affected match cards and schedules smoothly.
- **Admin / Staff Pages (`/staff/scoring`, `/admin/live`):** Maintain full **Supabase Realtime WebSockets** (< 1 second latency) because these users number only 10–20 scorers.

---

## 2. Architecture & Data Flow

```
+-------------------------------------------------------------------------+
|                              SUPABASE DB                                |
|  Tables: matches, match_sets, score_events, sports, teams, etc.         |
+-------------------------------------------------------------------------+
         |                                                 ^
         | Postgres Changes (WebSocket)                    | Service Role / Auth
         v                                                 |
+------------------------------+             +----------------------------+
| Staff / Admin Devices        |             | Staff Scoring & Admin APIs |
| (/staff/scoring, /admin/live)|             | (/api/score, /api/match/..) |
| Realtime Push (< 1s latency) |             +----------------------------+
+------------------------------+                           |
                                                           v
                                            +-----------------------------+
                                            |  GET /api/live-summary      |
                                            |  (Edge CDN Cached 30s)      |
                                            |  Generates ETag: "w/<hash>" |
                                            +-----------------------------+
                                                           |
                      +------------------------------------+------------------------------------+
                      | If-None-Match: "w/<hash>"                                               |
                      v                                                                         v
      [When Data Unchanged]                                                     [When Data Modified]
      HTTP 304 Not Modified                                                     HTTP 200 OK + Updated Data
      Payload: 0 Bytes                                                          Payload: Compressed JSON
      UI State: Zero re-renders                                                 UI State: Smart Diff update
                      |                                                                         |
                      v                                                                         v
+---------------------------------------------------------------------------------------------------------+
|                                        PUBLIC SPECTATOR CLIENTS                                         |
|                 /schedule (ScheduleGrid)  ·  /results (ResultsBoard)  ·  / (FeaturedMatches)            |
+---------------------------------------------------------------------------------------------------------+
```

---

## 3. Backend Specification (`/api/live-summary`)

### 3.1 Hash Generation & ETag Header
In [`src/app/api/live-summary/route.js`](file:///c:/Users/LENOVO/OneDrive%20-%20Phuket%20Rajabhat%20University/SMO/%E0%B9%81%E0%B8%9C%E0%B8%99%E0%B9%82%E0%B8%84%E0%B8%A3%E0%B8%87%E0%B8%81%E0%B8%B2%E0%B8%A3%20%E0%B8%9B%E0%B8%B5%202569/%E0%B8%81%E0%B8%B5%E0%B8%AC%E0%B8%B2%E0%B8%AA%E0%B8%B5/Webforsport/src/app/api/live-summary/route.js):
1. Compute a deterministic content fingerprint from the retrieved dataset (`matches`, `sports`, `teams`).
2. Construct a weak ETag string: `W/"<fingerprint>"`.
3. Inspect incoming `request.headers.get('if-none-match')`:
   - If the incoming ETag matches the current fingerprint:
     - Return `new NextResponse(null, { status: 304, headers: { ETag, 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' } })`.
   - Otherwise:
     - Return the full JSON payload with `status: 200` and `ETag` header attached.

### 3.2 Free Tier Egress & Connection Protection
- All public clients fetch through `/api/live-summary`. Because Vercel Edge CDN caches the response using `s-maxage=30, stale-while-revalidate=60`, Supabase PostgreSQL is queried at most once every 30 seconds.
- 304 Not Modified responses have a body size of 0 bytes, minimizing network bandwidth and eliminating cloud egress concerns.

---

## 4. Client-Side Specification (`useLiveScores`)

### 4.1 Change-Detection Lifecycle
In [`src/hooks/useLiveScores.js`](file:///c:/Users/LENOVO/OneDrive%20-%20Phuket%20Rajabhat%20University/SMO/%E0%B9%81%E0%B8%9C%E0%B8%99%E0%B9%82%E0%B8%84%E0%B8%A3%E0%B8%87%E0%B8%81%E0%B8%B2%E0%B8%A3%20%E0%B8%9B%E0%B8%B5%202569/%E0%B8%81%E0%B8%B5%E0%B8%AC%E0%B8%B2%E0%B8%AA%E0%B8%B5/Webforsport/src/hooks/useLiveScores.js):
1. Maintain `etagRef` storing the last successful ETag received.
2. In `refresh()`:
   - Make `fetch('/api/live-summary', { headers: { 'If-None-Match': etagRef.current || '' } })`.
   - If `res.status === 304`: Exit immediately. Do **not** call `setSports`, `setTeams`, or `setMatchMap`.
   - If `res.status === 200`:
     - Read new ETag: `etagRef.current = res.headers.get('etag')`.
     - Read `res.json()`.
     - Perform **Smart Diffing**: compare old and new matches by ID, status, score, winner, date, time, and court.
     - Only trigger state update if there is an actual difference.
3. Interval Polling:
   - Configurable `pollMs`: defaults to 12,000 ms (12 seconds) for active tabs.
4. Visibility Awareness:
   - When tab becomes hidden (`document.visibilityState === 'hidden'`), pause polling interval to preserve phone battery.
   - When tab becomes visible again (`visibilityState === 'visible'`), immediately fire an ETag check.
   - Listen for `window.addEventListener('online')` to fire an immediate check when connection recovers.

---

## 5. UI Component Integration

### 5.1 Schedule Page (`/schedule`)
- Component: [`src/components/public/ScheduleGrid.js`](file:///c:/Users/LENOVO/OneDrive%20-%20Phuket%20Rajabhat%20University/SMO/%E0%B9%81%E0%B8%9C%E0%B8%99%E0%B9%82%E0%B8%84%E0%B8%A3%E0%B8%87%E0%B8%81%E0%B8%B2%E0%B8%A3%20%E0%B8%9B%E0%B8%B5%202569/%E0%B8%81%E0%B8%B5%E0%B8%AC%E0%B8%B2%E0%B8%AA%E0%B8%B5/Webforsport/src/components/public/ScheduleGrid.js)
- Integration: Consume `useLiveScores(initial, { realtime: false, publicView: true, pollMs: 12000 })`.
- UX Preservation:
  - User's selected day (`selectedDay`), sport filter (`selectedSport`), and category (`selectedCategory`) remain completely preserved in local React state.
  - When matches update, the cards reflect new timings, courts, or qualified teams without scroll jumps or flicker.

### 5.2 Results Page (`/results`)
- Component: [`src/components/public/results/ResultsBoard.js`](file:///c:/Users/LENOVO/OneDrive%20-%20Phuket%20Rajabhat%20University/SMO/%E0%B9%81%E0%B8%9C%E0%B8%99%E0%B9%82%E0%B8%84%E0%B8%A3%E0%B8%87%E0%B8%81%E0%B8%B2%E0%B8%A3%20%E0%B8%9B%E0%B8%B5%202569/%E0%B8%81%E0%B8%B5%E0%B8%AC%E0%B8%B2%E0%B8%AA%E0%B8%B5/Webforsport/src/components/public/results/ResultsBoard.js)
- Integration: Leverages the updated `useLiveScores` with ETag support and 12s polling.
- UX Preservation:
  - Selected sport and status tab remain intact.
  - Newly completed matches transition smoothly to "จบแล้ว" with final scores.

### 5.3 Home Page (`/`)
- Component: Create client wrapper [`src/components/public/FeaturedMatchesLive.js`](file:///c:/Users/LENOVO/OneDrive%20-%20Phuket%20Rajabhat%20University/SMO/%E0%B9%81%E0%B8%9C%E0%B8%99%E0%B9%82%E0%B8%84%E0%B8%A3%E0%B8%87%E0%B8%81%E0%B8%B2%E0%B8%A3%20%E0%B8%9B%E0%B8%B5%202569/%E0%B8%81%E0%B8%B5%E0%B8%AC%E0%B8%B2%E0%B8%AA%E0%B8%B5/Webforsport/src/components/public/FeaturedMatchesLive.js) for Section 3 of [`src/app/(public)/page.js`](file:///c:/Users/LENOVO/OneDrive%20-%20Phuket%20Rajabhat%20University/SMO/%E0%B9%81%E0%B8%9C%E0%B8%99%E0%B9%82%E0%B8%84%E0%B8%A3%E0%B8%87%E0%B8%81%E0%B8%B2%E0%B8%A3%20%E0%B8%9B%E0%B8%B5%202569/%E0%B8%81%E0%B8%B5%E0%B8%AC%E0%B8%B2%E0%B8%AA%E0%B8%B5/Webforsport/src/app/%28public%29/page.js).
- Integration: Automatically re-computes `pickFeaturedMatches(liveMatches, sports)` whenever live matches change, keeping live/upcoming match cards on the homepage fresh without user reloads.

---

## 6. Resilience & Edge Cases

| Scenario | Behavior |
|---|---|
| **User switches to another app / turns screen off** | Polling interval pauses immediately via `visibilitychange` to conserve battery. |
| **User returns to web tab** | Immediate ETag check fires; if updates occurred while away, UI updates instantly. |
| **Network outage / Flaky 4G** | Silent graceful degradation. No invasive error modals. Existing cached data remains on screen. Re-checks immediately on `online` event. |
| **503 / 429 Server error** | Exponential backoff to 30s before retry to prevent request storms. |
| **High spectator volume (1,000+ users)** | Protected by CDN Edge caching and 0-byte 304 responses. Supabase DB connection count stays at baseline. |

---

## 7. Testing & Verification Plan

1. **Unit Tests (`tests/smart-refresh.test.js`)**:
   - Verify deterministic ETag calculation across sample payloads.
   - Verify 304 response when `If-None-Match` header matches.
   - Verify 200 response with new ETag when match payload differs.
   - Verify that client hook avoids state updates upon receiving 304.
2. **Regression Tests**:
   - Run Vitest suite: All 124 existing test cases must pass 100%.
3. **Build & Lint Verification**:
   - `npm run lint`: 0 errors / 0 warnings.
   - `npm run build`: All 25 routes compile cleanly with zero hydration warnings.
