# Design Specification: Global Glassmorphism Toast Notification Subsystem

- **Date:** 2026-10-07
- **Status:** Approved
- **Target Audience:** Sci Games 2026 Spectators, Staff Scorers, and Administrators
- **Branch:** `main`

---

## 1. Executive Summary & Problem Statement

### 1.1 Context
In the Sci Games 2026 web application (tournament October 8–11, 2026), interactive actions occur across Public, Staff, and Admin zones:
- Referees recording scores, experiencing offline queues, syncing remote changes, or being kicked out by another device.
- Administrators creating/deleting PINs, scheduling matches, updating scores, and toggling settings.
- Spectators copying match links, checking athlete registration status, or viewing live updates.

### 1.2 The Problem
- The website currently relies almost exclusively (~85%) on **Inline Banners** (`<Banner kind="...">`) positioned inside individual page forms or card headers.
- While inline banners work well for static forms, they have noticeable drawbacks during dynamic actions:
  - They shift layout content up and down (causing layout shifts / CLS).
  - Users scrolled down the page often fail to see error/success messages appearing at the top of a card.
  - Temporary feedback (e.g. "คัดลอกลิงก์แล้ว", "คะแนนถูกอัปเดตจากเครื่องอื่น", "รหัส PIN ถูกเข้าสู่ระบบจากเครื่องอื่น") requires a non-intrusive floating alert that catches attention immediately without blocking interaction or breaking flow.
- The web app currently lacks any floating toast/notification system.

### 1.3 The Solution: Custom Motion Glass-Toast
- Build a lightweight, high-performance **Glassmorphism Toast Notification subsystem** tailored directly to Sci Games 2026 design tokens using `motion/react` (already bundled in the repo).
- **Zero new npm dependencies**: Completely native to the repo.
- **Universal access**: A singleton `toast` API callable from anywhere in the codebase (React components, event callbacks, utility functions, or API catch blocks), plus an optional `useToast()` hook.
- **Top-tier UX**:
  - **Desktop**: Top-Right (`top: 1.5rem; right: 1.5rem; max-width: 380px`).
  - **Mobile**: Top-Center (`top: 0.75rem; left: 1rem; right: 1rem; margin: 0 auto; max-width: calc(100vw - 2rem)`), safely clear of the bottom mobile navigation bar.
  - **Stacking physics**: Smooth spring stacking (max 3 visible cards, older cards scale down and shift behind, expanding smoothly on hover).
  - **Gestures**: Swipe/drag up or right to dismiss on touch devices.
  - **Countdown bar**: Subtle progress bar draining over 3.5s (pauses on hover).

---

## 2. Architecture & Data Flow

```
+-----------------------------------------------------------------------------------------+
|                                    CALLING LOCATIONS                                    |
|   • React Components: useToast() or toast.success(...)                                  |
|   • Event Callbacks: toast.error(...)                                                   |
|   • Scoring Pad / Queue: toast.warn('ออฟไลน์ — รอส่ง 2 รายการ')                         |
|   • Auth / Guards: toast.error('รหัส PIN ถูกเข้าสู่ระบบจากอุปกรณ์อื่นแล้ว')            |
+-----------------------------------------------------------------------------------------+
                                            │
                                            ▼
+-----------------------------------------------------------------------------------------+
|                           SINGLETON STORE (src/lib/toast.js)                            |
|   • State: List of active toast objects [ { id, type, title, message, duration, ... } ]|
|   • Methods: success(), error(), warn(), info(), custom(), dismiss(id)                  |
|   • Observer pattern: notifies registered subscribers on state changes                  |
+-----------------------------------------------------------------------------------------+
                                            │
                                            ▼ Event Broadcast
+-----------------------------------------------------------------------------------------+
|                  TOAST CONTAINER (src/components/ui/Toast/ToastContainer.js)            |
|   • Mounted once in RootLayout (src/app/layout.js)                                      |
|   • Subscribes to store via useSyncExternalStore or useEffect listener                 |
|   • Enforces stacking limits (max 3 visible cards)                                      |
|   • Handles hover pause & keyboard accessibility (Escape to dismiss)                    |
+-----------------------------------------------------------------------------------------+
                                            │
                                            ▼ Renders with AnimatePresence
+-----------------------------------------------------------------------------------------+
|                    TOAST ITEM (src/components/ui/Toast/ToastItem.js)                    |
|   • Spring entrance: y: -24 -> 0, scale: 0.94 -> 1 (motion/react)                       |
|   • Liquid Glass aesthetic: rgba(255,255,255,0.88) light / rgba(18,22,31,0.88) dark    |
|   • Colored status accents & glow (Green / Red / Gold / Blue)                           |
|   • Swipe / drag gestures for mobile dismissal                                          |
|   • Countdown timer progress line                                                       |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Component & Data Design

### 3.1 Toast Data Structure (`ToastItemData`)
```typescript
interface ToastItemData {
  id: string;               // Unique id (e.g., 'toast_1728283921_abc')
  type: 'success' | 'error' | 'warn' | 'info';
  title?: string;           // Optional bold title
  message: string;          // Main descriptive text
  duration?: number;        // Auto-dismiss milliseconds (default: 3500ms; error default: 4500ms)
  createdAt: number;        // Timestamp
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

### 3.2 Singleton Store API (`src/lib/toast.js`)
```javascript
// Usage:
toast.success('บันทึกคะแนนเรียบร้อย');
toast.error('รหัส PIN ไม่ถูกต้อง');
toast.warn('คุณกำลังออฟไลน์ ข้อมูลจะซิงค์เมื่อมีเน็ต');
toast.info('คะแนนถูกอัปเดตจากเครื่องอื่น');

// Advanced payload:
toast.error({
  title: 'เซสชันหมดอายุ',
  message: 'รหัส PIN นี้ถูกเข้าสู่ระบบจากอุปกรณ์อื่นแล้ว กรุณาเข้าสู่ระบบใหม่',
  duration: 5000,
});

// Dismiss specific or all:
toast.dismiss(id);
toast.dismiss(); // clears all
```

### 3.3 Visual & Motion Design
- **Glassmorphism CSS (`toast.css`)**:
  - Border: `1px solid var(--glass-border)`
  - Backdrop filter: `blur(16px) saturate(180%)`
  - Shadow: `0 12px 36px -8px rgba(0, 0, 0, 0.28), 0 4px 12px rgba(0, 0, 0, 0.12)`
  - Theme compatibility: Adapts dynamically via `[data-theme='dark']` and `[data-theme='light']`.
- **Motion Physics**:
  - Spring damping: 30, stiffness: 420 (snappy, responsive, no jarring bounces).
  - Stacking: Active card on top (`scale: 1, y: 0`), 2nd card (`scale: 0.95, y: 12, opacity: 0.85`), 3rd card (`scale: 0.90, y: 24, opacity: 0.65`).
  - Hover / Touch hold expands all cards into a vertical list.

---

## 4. Integration Points

1. **Root Layout (`src/app/layout.js`)**:
   - Import and mount `<ToastContainer />` directly inside `<body>` alongside `<PageTracker />`.
   - Accessible across all 3 zones (Public, Staff, Admin) without needing individual wrappers.

2. **Staff Scoring Flow (`ScoreInput/index.js` & `ScorePad.js`)**:
   - Kickout alert: Trigger `toast.error('รหัส PIN นี้ถูกเข้าสู่ระบบจากอุปกรณ์อื่นแล้ว กรุณาเข้าสู่ระบบใหม่')` immediately upon receiving `SESSION_REPLACED`.
   - Sync notice: Trigger `toast.info('คะแนนถูกอัปเดตจากเครื่องอื่น')` when `onRemoteChange` fires.
   - Offline / Online: Trigger `toast.warn('คุณกำลังออฟไลน์...')` and `toast.success('เชื่อมต่ออินเทอร์เน็ตแล้ว')`.

3. **Staff Login (`/staff/login`)**:
   - If user arrives with `?reason=kicked`, trigger a floating `toast.error` in addition to the inline card banner.

4. **Admin Management Pages**:
   - Can easily notify on CRUD actions (`toast.success('บันทึกข้อมูลเรียบร้อย')`).

---

## 5. Edge Cases & Resilience

1. **Multiple rapid toasts (Flood protection)**:
   - Cap maximum concurrent visible toasts to 3; queue older ones or drop duplicates within 500ms window.
2. **Tab backgrounding / Page visibility**:
   - Pause auto-dismiss timer while document is hidden (`document.visibilityState === 'hidden'`) so notifications aren't missed while switching tabs.
3. **Screen size changes & orientation**:
   - Fluid responsive styles using CSS media queries and `env(safe-area-inset-top)` for notched iPhones.
4. **SSR / Hydration safe**:
   - `ToastContainer` mounts strictly on client (`useEffect`), ensuring zero SSR hydration mismatch.

---

## 6. Testing & Quality Verification

- **Vitest Unit Tests (`tests/toast.test.js`)**:
  - Verify `toast.success`, `error`, `warn`, `info` add correctly formatted items to store.
  - Verify `toast.dismiss` removes targeted item or clears all items.
  - Verify subscription and listener notification on state changes.
  - Verify custom durations and title overrides.
- **Build & Quality Gates**:
  - `npm test`: all unit tests must pass.
  - `npm run lint`: 0 errors / 0 warnings.
  - `npm run build`: production build passes.
