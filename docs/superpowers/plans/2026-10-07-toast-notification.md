# Global Glassmorphism Toast Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and integrate a high-performance, glassmorphism floating Toast Notification subsystem with `motion/react` across all zones (Public, Staff, Admin) of Sci Games 2026.

**Architecture:** A lightweight singleton store (`src/lib/toast.js`) broadcasting to a client-rendered `<ToastContainer />` mounted at `RootLayout`. Uses `motion/react` spring physics for entrance, stacking (max 3 visible), touch swipe-to-dismiss, and auto-dismiss countdown.

**Tech Stack:** Next.js 16.3.5 App Router, React 19, `motion/react` (Framer Motion v12), Vanilla CSS glassmorphism.

**Spec:** `docs/superpowers/specs/2026-10-07-toast-notification-design.md`

## Global Constraints
- Zero new npm dependencies: use existing React 19 and `motion/react`.
- Desktop positioning: Top-Right (`top: 1.5rem; right: 1.5rem`).
- Mobile positioning: Top-Center (`top: 0.75rem; left: 1rem; right: 1rem; margin: 0 auto`), respecting `env(safe-area-inset-top)`.
- Max 3 stacked visible cards with smooth auto-scale.
- Default durations: 3500ms for info/success/warn; 4500ms for errors.
- SSR safe: Must not produce Next.js hydration mismatches.

---

### Task 1: Core Toast Store & Dispatcher (`src/lib/toast.js`)

**Files:**
- Create: `src/lib/toast.js`
- Test: `tests/toast.test.js`

**Interfaces:**
- Produces: 
  - `toast.success(messageOrOpts, opts)`
  - `toast.error(messageOrOpts, opts)`
  - `toast.warn(messageOrOpts, opts)`
  - `toast.info(messageOrOpts, opts)`
  - `toast.dismiss(id)` (or dismiss all if no id passed)
  - `toast.subscribe(callback)` -> returns unsubscribe function
  - `toast.getSnapshot()` -> returns active toasts array
  - `useToast()` hook

- [ ] **Step 1: Write the failing tests**

Write `tests/toast.test.js`:
```javascript
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Toast Store', () => {
  let toast;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/lib/toast');
    toast = mod.toast;
    toast.dismiss();
  });

  it('adds success, error, warn, and info toasts with defaults', () => {
    const id = toast.success('บันทึกสำเร็จ');
    expect(typeof id).toBe('string');
    const items = toast.getSnapshot();
    expect(items.length).toBe(1);
    expect(items[0].message).toBe('บันทึกสำเร็จ');
    expect(items[0].type).toBe('success');
    expect(items[0].duration).toBe(3500);
  });

  it('supports options with title, custom duration, and action', () => {
    const actionFn = vi.fn();
    toast.error('มีข้อผิดพลาด', {
      title: 'ล้มเหลว',
      duration: 6000,
      action: { label: 'ลองใหม่', onClick: actionFn },
    });

    const items = toast.getSnapshot();
    expect(items.length).toBe(1);
    expect(items[0].type).toBe('error');
    expect(items[0].title).toBe('ล้มเหลว');
    expect(items[0].duration).toBe(6000);
    expect(items[0].action.label).toBe('ลองใหม่');
  });

  it('supports object as first argument', () => {
    toast.info({ title: 'อัปเดต', message: 'มีคะแนนใหม่' });
    const items = toast.getSnapshot();
    expect(items[0].title).toBe('อัปเดต');
    expect(items[0].message).toBe('มีคะแนนใหม่');
    expect(items[0].type).toBe('info');
  });

  it('notifies subscribers on add and dismiss', () => {
    const listener = vi.fn();
    const unsubscribe = toast.subscribe(listener);

    const id1 = toast.success('ข้อความ 1');
    expect(listener).toHaveBeenCalledTimes(1);

    const id2 = toast.warn('ข้อความ 2');
    expect(listener).toHaveBeenCalledTimes(2);

    toast.dismiss(id1);
    expect(listener).toHaveBeenCalledTimes(3);
    expect(toast.getSnapshot().map((t) => t.id)).toEqual([id2]);

    toast.dismiss(); // dismiss all
    expect(listener).toHaveBeenCalledTimes(4);
    expect(toast.getSnapshot()).toEqual([]);

    unsubscribe();
    toast.info('ข้อความ 3');
    expect(listener).toHaveBeenCalledTimes(4); // not called after unsub
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/toast.test.js`
Expected: FAIL (Cannot find module `@/lib/toast`)

- [ ] **Step 3: Implement `src/lib/toast.js`**

Create `src/lib/toast.js`:
```javascript
import { useEffect, useState } from 'react';

/**
 * @typedef {Object} ToastItem
 * @property {string} id
 * @property {'success' | 'error' | 'warn' | 'info'} type
 * @property {string} [title]
 * @property {string} message
 * @property {number} duration
 * @property {number} createdAt
 * @property {{ label: string, onClick: () => void }} [action]
 */

class ToastStore {
  constructor() {
    /** @type {ToastItem[]} */
    this.toasts = [];
    /** @type {Set<(toasts: ToastItem[]) => void>} */
    this.listeners = new Set();
  }

  getSnapshot = () => this.toasts;

  subscribe = (listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  notify = () => {
    const copy = [...this.toasts];
    this.listeners.forEach((listener) => listener(copy));
  };

  /**
   * @param {'success' | 'error' | 'warn' | 'info'} type
   * @param {string | Partial<ToastItem>} messageOrOpts
   * @param {Partial<ToastItem>} [opts]
   * @returns {string} Toast ID
   */
  add = (type, messageOrOpts, opts = {}) => {
    const defaults = {
      duration: type === 'error' ? 4500 : 3500,
    };

    let item;
    if (typeof messageOrOpts === 'string') {
      item = {
        id: opts.id || `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type,
        message: messageOrOpts,
        title: opts.title,
        duration: opts.duration ?? defaults.duration,
        action: opts.action,
        createdAt: Date.now(),
      };
    } else {
      const merged = { ...defaults, ...messageOrOpts };
      item = {
        id: merged.id || `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type,
        message: merged.message || '',
        title: merged.title,
        duration: merged.duration,
        action: merged.action,
        createdAt: Date.now(),
      };
    }

    // Limit to latest 10 in memory queue
    this.toasts = [item, ...this.toasts.filter((t) => t.id !== item.id)].slice(0, 10);
    this.notify();
    return item.id;
  };

  success = (msg, opts) => this.add('success', msg, opts);
  error = (msg, opts) => this.add('error', msg, opts);
  warn = (msg, opts) => this.add('warn', msg, opts);
  info = (msg, opts) => this.add('info', msg, opts);

  dismiss = (id) => {
    if (!id) {
      if (this.toasts.length === 0) return;
      this.toasts = [];
      this.notify();
      return;
    }
    const next = this.toasts.filter((t) => t.id !== id);
    if (next.length !== this.toasts.length) {
      this.toasts = next;
      this.notify();
    }
  };
}

export const toast = new ToastStore();

/** React hook for subscribing to toasts inside components */
export function useToast() {
  const [toasts, setToasts] = useState(toast.getSnapshot());

  useEffect(() => {
    setToasts(toast.getSnapshot());
    return toast.subscribe(setToasts);
  }, []);

  return { toasts, toast };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/toast.test.js`
Expected: PASS (4 passed)

- [ ] **Step 5: Commit Task 1**

```bash
git add src/lib/toast.js tests/toast.test.js
git commit -m "feat(toast): implement singleton toast store and dispatcher"
```

---

### Task 2: Toast UI Components & Glassmorphism Styling (`src/components/ui/Toast/*`)

**Files:**
- Create: `src/components/ui/Toast/toast.css`
- Create: `src/components/ui/Toast/ToastItem.js`
- Create: `src/components/ui/Toast/ToastContainer.js`

**Interfaces:**
- Consumes: `toast.subscribe()`, `toast.dismiss()`, `toast.getSnapshot()` from `@/lib/toast`
- Produces: `<ToastContainer />` exportable React component

- [ ] **Step 1: Create `src/components/ui/Toast/toast.css`**

Create CSS with glassmorphism styles, color indicators, responsive top-right & top-center positioning, and stacking transforms:
```css
/* Toast Notification System — Sci Games 2026 */
.sg-toast-viewport {
  position: fixed;
  z-index: 99999;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  top: 1.25rem;
  right: 1.25rem;
  width: 100%;
  max-width: 380px;
}

@media (max-width: 640px) {
  .sg-toast-viewport {
    top: max(0.75rem, env(safe-area-inset-top, 0.75rem));
    left: 0.85rem;
    right: 0.85rem;
    width: auto;
    max-width: none;
  }
}

.sg-toast-card {
  pointer-events: auto;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: var(--radius-lg, 14px);
  background: var(--glass-bg, rgba(255, 255, 255, 0.88));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.3));
  box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.22), 0 4px 12px rgba(0, 0, 0, 0.08);
  color: var(--text, #111827);
  overflow: hidden;
  user-select: none;
  cursor: pointer;
}

[data-theme='dark'] .sg-toast-card {
  background: rgba(22, 27, 38, 0.92);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 36px -8px rgba(0, 0, 0, 0.6), 0 4px 14px rgba(0, 0, 0, 0.3);
}

/* Status variants */
.sg-toast-card.is-success {
  border-left: 4px solid #10b981;
}
.sg-toast-card.is-error {
  border-left: 4px solid #ef4444;
}
.sg-toast-card.is-warn {
  border-left: 4px solid #f59e0b;
}
.sg-toast-card.is-info {
  border-left: 4px solid #3b82f6;
}

.sg-toast-icon {
  flex-shrink: 0;
  margin-top: 0.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sg-toast-icon.is-success { color: #10b981; }
.sg-toast-icon.is-error   { color: #ef4444; }
.sg-toast-icon.is-warn    { color: #f59e0b; }
.sg-toast-icon.is-info    { color: #3b82f6; }

.sg-toast-content {
  flex: 1;
  min-width: 0;
}
.sg-toast-title {
  font-weight: 700;
  font-size: 0.88rem;
  line-height: 1.35;
  margin-bottom: 0.15rem;
  color: var(--text);
}
.sg-toast-message {
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--text-2, #4b5563);
  word-break: break-word;
}
[data-theme='dark'] .sg-toast-message {
  color: var(--text-2, #9ca3af);
}

.sg-toast-close {
  background: transparent;
  border: none;
  color: var(--text-3, #9ca3af);
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease;
}
.sg-toast-close:hover {
  color: var(--text, #111827);
}

.sg-toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  background: rgba(0, 0, 0, 0.08);
}
[data-theme='dark'] .sg-toast-progress {
  background: rgba(255, 255, 255, 0.1);
}
.sg-toast-progress-bar {
  height: 100%;
  width: 100%;
  transform-origin: left;
}
.sg-toast-progress-bar.is-success { background: #10b981; }
.sg-toast-progress-bar.is-error   { background: #ef4444; }
.sg-toast-progress-bar.is-warn    { background: #f59e0b; }
.sg-toast-progress-bar.is-info    { background: #3b82f6; }
```

- [ ] **Step 2: Create `src/components/ui/Toast/ToastItem.js`**

Create `ToastItem.js` with `motion/react` spring physics, gesture drag-to-dismiss, and auto-dismiss countdown:
```javascript
'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, AlertTriangle, X, Info } from '@/components/animate-ui/icons';

const ICON_MAP = {
  success: Check,
  error: AlertTriangle,
  warn: AlertTriangle,
  info: Info,
};

export default function ToastItem({ toast: item, onDismiss, index, isHovered }) {
  const { id, type, title, message, duration, action } = item;
  const Icon = ICON_MAP[type] || Info;

  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(duration);
  const startRef = useRef(Date.now());

  // Countdown timer
  useEffect(() => {
    if (paused || isHovered) return undefined;

    const timer = setTimeout(() => {
      onDismiss(id);
    }, remainingRef.current);

    startRef.current = Date.now();

    return () => {
      clearTimeout(timer);
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startRef.current));
    };
  }, [id, duration, paused, isHovered, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -24, scale: 0.94 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{ opacity: 0, scale: 0.9, y: -16, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', damping: 30, stiffness: 420 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.4}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 400) {
          onDismiss(id);
        }
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`sg-toast-card is-${type}`}
      role="alert"
    >
      <div className={`sg-toast-icon is-${type}`}>
        <Icon size={18} />
      </div>

      <div className="sg-toast-content">
        {title && <div className="sg-toast-title">{title}</div>}
        <div className="sg-toast-message">{message}</div>
        {action && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              action.onClick?.();
              onDismiss(id);
            }}
            style={{ marginTop: '0.45rem', padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        className="sg-toast-close"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(id);
        }}
        aria-label="ปิดการแจ้งเตือน"
      >
        <X size={14} />
      </button>

      {/* Progress countdown bar */}
      <div className="sg-toast-progress">
        <motion.div
          className={`sg-toast-progress-bar is-${type}`}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: paused || isHovered ? undefined : 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 3: Create `src/components/ui/Toast/ToastContainer.js`**

Create `ToastContainer.js`:
```javascript
'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { toast, useToast } from '@/lib/toast';
import ToastItem from './ToastItem';
import './toast.css';

export default function ToastContainer() {
  const [mounted, setMounted] = useState(false);
  const { toasts } = useToast();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || toasts.length === 0) return null;

  // Show up to 3 visible toasts
  const visible = toasts.slice(0, 3);

  return (
    <div
      className="sg-toast-viewport"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {visible.map((item, index) => (
          <ToastItem
            key={item.id}
            toast={item}
            index={index}
            isHovered={isHovered}
            onDismiss={toast.dismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 4: Run `npm test` & `npm run lint`**

Run: `npm test && npm run lint`
Expected: PASS

- [ ] **Step 5: Commit Task 2**

```bash
git add src/components/ui/Toast/
git commit -m "feat(toast): add ToastContainer and ToastItem components with motion spring physics"
```

---

### Task 3: Root Layout Integration (`src/app/layout.js`)

**Files:**
- Modify: `src/app/layout.js`

**Interfaces:**
- Mount `<ToastContainer />` inside `<body>` of `RootLayout`

- [ ] **Step 1: Mount ToastContainer in `src/app/layout.js`**

Import and add `<ToastContainer />` after `<PageTracker />`:
```javascript
import ToastContainer from '@/components/ui/Toast/ToastContainer';
...
      <body className={kanit.className}>
        <PageTracker />
        <ToastContainer />
        <div className="app-content-root" ...>
```

- [ ] **Step 2: Run `npm test` and `npm run build`**

Run: `npm test && npm run build`
Expected: PASS with 0 build errors and clean routes.

- [ ] **Step 3: Commit Task 3**

```bash
git add src/app/layout.js
git commit -m "feat(toast): mount global ToastContainer in root layout"
```

---

### Task 4: Connect Critical Flows to Toast Notification

**Files:**
- Modify: `src/components/staff/ScoreInput/index.js`
- Modify: `src/app/(staff)/staff/login/page.js`
- Modify: `src/components/admin/PinManager.js`

**Interfaces:**
- Calls: `toast.error()`, `toast.success()`, `toast.info()`, `toast.warn()`

- [ ] **Step 1: Connect Staff scoring kickout and sync notifications**

In `src/components/staff/ScoreInput/index.js`:
- Import `toast` from `@/lib/toast`
- In `handleScoreError`: trigger `toast.error(msg)`
- In `onRemoteChange`: trigger `toast.info('คะแนนถูกอัปเดตจากเครื่องอื่น')`
- In network change: trigger `toast.warn('ออฟไลน์ — คะแนนจะถูกส่งเมื่อมีสัญญาณ')`

- [ ] **Step 2: Connect Staff Login kickout notification**

In `src/app/(staff)/staff/login/page.js`:
- When `reason === 'kicked'`, also call `toast.error('รหัส PIN นี้ถูกเข้าสู่ระบบจากอุปกรณ์อื่นแล้ว กรุณาเข้าสู่ระบบใหม่')` so referee sees both floating toast and inline banner.

- [ ] **Step 3: Connect Admin PinManager copy / action toast**

In `src/components/admin/PinManager.js`:
- Import `toast` from `@/lib/toast`
- When admin copies PIN or creates PIN, trigger `toast.success('คัดลอกรหัส PIN แล้ว')` / `toast.success('สร้าง PIN สำเร็จ')`.

- [ ] **Step 4: Run tests and build**

Run: `npm test && npm run lint && npm run build`
Expected: 100% tests passing, clean build.

- [ ] **Step 5: Commit Task 4**

```bash
git add src/components/staff/ScoreInput/index.js src/app/(staff)/staff/login/page.js src/components/admin/PinManager.js
git commit -m "feat(toast): integrate toast alerts into staff scoring, login kickout, and admin PIN management"
```

---

### Task 5: Final Verification, Handoff & Push

- [ ] **Step 1: Verify all tests passing**
Run: `npm test` (all tests passing)
- [ ] **Step 2: Verify linting and build**
Run: `npm run lint && npm run build`
- [ ] **Step 3: Update `Handoff.md`**
Update `Last updated` header, Completed Milestones, and next prompt.
- [ ] **Step 4: Push to origin/main**
Run: `git push origin main`
