# Instant MC Stage Teleprompter & QR Quick-Access (/mc) Implementation Plan

> **Goal:** Enable event MCs (พิธีกร) on stage to open the ceremony script instantly within 2 seconds via QR code or direct `/mc` route, with live auto-refresh when matches finish, screen wake-lock, touch swipe, and zero login barriers.

---

## User Review Required

> [!IMPORTANT]
> The route `/mc` is intentionally accessible without admin login so MCs on stage/podium can access the cue sheet immediately on mobile/tablet without friction. All placement scores and standings are calculated server-side from official match results.

---

## Proposed Changes

### 1. API Route: `GET /api/ceremony/live`
- File: `src/app/api/ceremony/live/route.js`
- Serves live placement & standings data for the MC teleprompter.
- Uses `loadPlacements(sb)`, `getSports(sb)`, `getTeams(sb)`.
- Edge caching (`s-maxage=5`) to protect database from rapid polling.

### 2. QR Code Generator Helper
- File: `src/lib/ceremony-qr.js`
- Uses `qrcode` library to generate crisp black-and-white Data URL for the `/mc` URL.

### 3. Admin QR Code Modal & Trigger
- File: `src/components/admin/CeremonyConsole.jsx`
- Adds `[ 📱 สแกน QR เข้าหน้าพิธีกร (/mc) ]` button in the admin console.
- Displays modal with QR code, clickable URL, copy-to-clipboard button, and preview link.

### 4. Standalone MC Teleprompter Page & Component
- File: `src/app/mc/page.jsx` & `src/components/admin/McTeleprompter.jsx`
- Standalone layout (zero public navbar / zero footer distraction).
- Stage-optimized teleprompter:
  - Screen Wake Lock (`navigator.wakeLock`) so device screen never dims or turns off.
  - Live Realtime Sync (polls `/api/ceremony/live` every 8 seconds, flashes update beacon).
  - Touch swipe left/right & giant Next/Previous buttons.
  - Stage Dark / Light theme toggle.
  - Fullscreen toggle.
  - Zero emojis, 100% Kanit typography.

---

## Verification Plan

### Automated Tests
- `tests/ceremony-live-api.test.js`: Verify API returns `{ success: true, events, standings, sports, teams }`.
- `tests/ceremony-qr.test.js`: Verify QR code generation for `/mc`.
- `tests/ceremony-mc-page.test.js`: Verify `/mc` teleprompter renders without crashing and contains zero emojis.
- Full suite: `npm test` (all 47+ test suites pass).
- Production build: `npm run build` (Next.js production build succeeds with `/mc` and `/api/ceremony/live`).
