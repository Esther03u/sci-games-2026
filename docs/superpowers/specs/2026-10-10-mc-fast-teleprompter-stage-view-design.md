# Design Specification: Instant MC Stage Teleprompter & QR Quick-Access (/mc)

**Date:** 2026-10-10  
**Status:** Approved by User  
**Target Route:** `/mc` (Public Standalone MC Teleprompter) & `/admin/ceremony` (Admin QR Code Modal)  
**Icon System:** Vector Icons Only (`lucide-react`), **STRICTLY ZERO EMOJIS**

---

## 1. Problem Statement & User Intent

During **Sci Games 2026**, the closing ceremony occurs immediately after the final matches finish. The Master of Ceremonies (MC / พิธีกร) on stage must announce results with zero delay.

### Current Friction:
1. **Authentication Barrier**: `/admin/ceremony` is located inside the admin area (`src/app/(admin)/*`), which redirects unauthenticated mobile devices to `/admin/login`. MCs do not and should not have super-admin accounts.
2. **Access Speed**: Typing long URLs or navigating complex menus takes too long under the pressure of stage announcements.
3. **Screen Timeout**: Mobile/iPad screens sleep after 30–60 seconds of inactivity when an MC holds the device while listening to a speech or music.
4. **Post-Match Sync**: When the volleyball or futsal final finishes, the MC needs the updated winner and overall championship trophy calculation to appear on their device immediately without frantic browser refreshes.

---

## 2. Core Solution Architecture

```
+-------------------------------------------------------------------------+
| Admin Console (/admin/ceremony)                                         |
| [ 📱 สแกน QR เข้าหน้าพิธีกร (/mc) ] -> Opens Glass Modal with:           |
|   1. Instant QR Code (250x250 via qrcode.toDataURL)                     |
|   2. Direct Link (https://.../mc) + Copy Link Button                    |
|   3. "เปิดในแท็บใหม่" Quick Launch Button                                |
+-------------------------------------------------------------------------+
                                    |
            MC Scans QR with Phone/iPad on Stage (2 seconds)
                                    v
+-------------------------------------------------------------------------+
| Standalone Route: /mc (src/app/mc/page.jsx)                             |
| - Dedicated Layout (Zero Navbar / Zero Footer distractions)              |
| - Screen Wake Lock (navigator.wakeLock.request('screen'))               |
| - Single-Page Slide Deck: Giant "หน้าถัดไป ▶" & "◀ หน้าก่อนหน้า"        |
| - Touch Swipe Navigation (Swipe Left/Right on Mobile/Tablet)            |
| - Keyboard / Pointer Clicker Shortcuts (ArrowRight / ArrowLeft / Space) |
| - High-Contrast Stage Dark & Clean Light Mode Toggle                    |
| - Auto Live-Sync (Polls /api/ceremony/live every 8s)                   |
| - Zero Emojis, 100% Kanit Vector Typography                             |
+-------------------------------------------------------------------------+
                                    ^
                                    | Polls every 8s
+-------------------------------------------------------------------------+
| API Route: /api/ceremony/live (src/app/api/ceremony/live/route.js)      |
| - Calls loadPlacements(sb) + getSports() + getTeams()                   |
| - Fast Edge/CDN Cache (s-maxage=5)                                      |
| - Returns { success: true, events, standings, lastUpdated }             |
+-------------------------------------------------------------------------+
```

---

## 3. Detailed Component & Route Design

### 3.1 Route `/mc` (`src/app/mc/page.jsx`)
- **Public & Unauthenticated**: Accessible immediately by any phone or tablet via `/mc`.
- **Standalone Layout**: Bypasses `src/app/(public)/layout.js` so there is NO public navbar, footer, or bottom navigation stealing viewport height.
- **Header Bar**:
  - Live pulse indicator: `● อัปเดตสด (Live)`
  - Screen Wake Lock badge: `🔆 จอเปิดค้าง` (with toggle if browser doesn't support or user prefers)
  - Theme switcher: Stage Dark (High contrast on stage) / Light Mode (matches paper preview)
  - Fullscreen toggle button (`Maximize2`)
- **Body**: Renders `CeremonyPrintSheet` in `single` mode with large high-legibility Kanit typography.
- **Controls**:
  - Big sticky bottom bar: `◀ ก่อนหน้า`, `หน้าที่ X จาก Y`, `หน้าถัดไป ▶`
  - Swipe gestures for touch screens (`onTouchStart`, `onTouchEnd`).
  - Keyboard listeners for remote presentation clickers.

### 3.2 Live Sync API (`src/app/api/ceremony/live/route.js`)
- `GET /api/ceremony/live`
- Reads tournament placements using `loadPlacements(sb)` with admin client.
- Computes overall standings (golds, silvers, bronzes, total_points, rank).
- Cache-Control: `public, max-age=0, s-maxage=5, stale-while-revalidate=10` (protects database from excessive polling).
- Returns timestamp and hash for efficient client updates.

### 3.3 QR Code Modal in `/admin/ceremony` (`CeremonyConsole.jsx`)
- Adds action button: `📱 สแกน QR สำหรับพิธีกร (/mc)` in the top action panel.
- On click: Opens modal showing:
  - High-resolution QR code pointing to `${window.location.origin}/mc`.
  - Copy URL button with toast feedback ("คัดลอกลิงก์สำเร็จ!").
  - Direct "เปิดดูหน้าจอพิธีกร" button.

---

## 4. Verification & Testing Strategy
1. **Unit & Component Tests**:
   - `tests/ceremony-mc-route.test.js`: Verify `/mc` page renders without crashing, no emojis, contains live indicator and slide navigation.
   - `tests/ceremony-live-api.test.js`: Verify `GET /api/ceremony/live` returns valid events and standings payload.
   - `tests/ceremony-qr.test.js`: Verify QR code generation for `/mc` produces valid Data URL.
2. **Quality Gates**:
   - `npm test` passes 100%.
   - `npm run build` succeeds with route `/mc` and `/api/ceremony/live`.
   - Update `Handoff.md` and push to `main`.
