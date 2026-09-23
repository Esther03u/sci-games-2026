# Handbook & Schedule Download Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated Handbook & Schedule Download Hub (`/handbook`) for Sci Games 2026 where visitors can view document summaries, preview PDFs in a modal, and download the official Handbook (20 pages) and Schedule (3 pages) directly.

**Architecture:** Static PDF assets served from `public/docs/`, structured metadata in `src/data/documents.js`, responsive Glassmorphism UI components (`HandbookHub.js` and `DocumentPreviewModal.js`), and navigation links added to Navbar, QuickLinks, and Footer.

**Tech Stack:** Next.js 16 (App Router), React 19, Vanilla CSS (Glassmorphism), Lucide icons, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-23-handbook-download-hub-design.md`

## Global Constraints

- Use Next.js 16 App Router conventions (JavaScript, React 19, no TypeScript).
- Styling must use existing Vanilla CSS tokens and Glassmorphism variables (`var(--glass-bg)`, `var(--surface)`, `var(--border)`, `var(--accent)`, `var(--text)`). No Tailwind classes.
- Zero placeholder code (no TODOs or mock stubs).
- Preserve existing tests; all unit tests must pass (`npm test`).
- Production build must succeed cleanly (`npm run build`).

---

### Task 1: Setup PDF Assets and Document Metadata

**Files:**
- Create: `public/docs/sci-games-2026-handbook.pdf` (copied from `C:\Users\LENOVO\Downloads\สูจิบัตร69.pdf`)
- Create: `public/docs/sci-games-2026-schedule.pdf` (copied from `C:\Users\LENOVO\Downloads\กำหนดการ69.pdf`)
- Create: `src/data/documents.js`
- Test: `tests/documents.test.js`

**Interfaces:**
- Produces: `OFFICIAL_DOCUMENTS` array exported from `src/data/documents.js`
  - Elements: `{ id, title, titleEn, category, badge, pages, fileSize, format, updatedAt, downloadUrl, fileName, description, highlights }`

- [ ] **Step 1: Write the failing test**

Create `tests/documents.test.js`:
```javascript
import { describe, it, expect } from 'vitest';
import { OFFICIAL_DOCUMENTS } from '../src/data/documents';
import fs from 'fs';
import path from 'path';

describe('Official Documents Metadata & Assets', () => {
  it('exports a valid list of official documents', () => {
    expect(Array.isArray(OFFICIAL_DOCUMENTS)).toBe(true);
    expect(OFFICIAL_DOCUMENTS.length).toBeGreaterThanOrEqual(2);
  });

  it('contains handbook and schedule with correct properties', () => {
    const ids = OFFICIAL_DOCUMENTS.map((d) => d.id);
    expect(ids).toContain('handbook-2026');
    expect(ids).toContain('schedule-2026');

    for (const doc of OFFICIAL_DOCUMENTS) {
      expect(doc.title).toBeTruthy();
      expect(doc.downloadUrl).toMatch(/^\/docs\//);
      expect(doc.fileName).toMatch(/\.pdf$/);
      expect(doc.highlights.length).toBeGreaterThan(0);
    }
  });

  it('has corresponding static PDF files in public/docs directory', () => {
    for (const doc of OFFICIAL_DOCUMENTS) {
      const publicPath = path.join(process.cwd(), 'public', doc.downloadUrl.replace(/^\//, ''));
      expect(fs.existsSync(publicPath)).toBe(true);
      const stat = fs.statSync(publicPath);
      expect(stat.size).toBeGreaterThan(1000); // verify file is not empty
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/documents.test.js`
Expected: FAIL (missing `src/data/documents.js` and public PDFs).

- [ ] **Step 3: Copy PDF files and implement `src/data/documents.js`**

1. Create `public/docs/` directory and copy files:
   - Source 1: `C:\Users\LENOVO\Downloads\สูจิบัตร69.pdf` -> `public/docs/sci-games-2026-handbook.pdf`
   - Source 2: `C:\Users\LENOVO\Downloads\กำหนดการ69.pdf` -> `public/docs/sci-games-2026-schedule.pdf`

2. Create `src/data/documents.js`:
```javascript
export const OFFICIAL_DOCUMENTS = [
  {
    id: 'handbook-2026',
    title: 'สูจิบัตรการแข่งขัน Sci Games 2026',
    titleEn: 'Official Tournament Handbook 2026',
    category: 'สูจิบัตรทางการ',
    badge: 'ฉบับสมบูรณ์ (20 หน้า)',
    pages: 20,
    fileSize: '3.8 MB',
    format: 'PDF',
    updatedAt: '2026-10-01',
    downloadUrl: '/docs/sci-games-2026-handbook.pdf',
    fileName: 'SciGames2026-Handbook.pdf',
    description:
      'สูจิบัตรทางการรวบรวมระเบียบและกติกาการแข่งขันกีฬา 5 ชนิด คุณสมบัตินักกีฬา การแต่งกาย การประท้วง และตารางแข่งขัน',
    highlights: [
      'ระเบียบการแข่งขันฟุตซอล, วอลเลย์บอล, เซปักตะกร้อ, บาสเกตบอล, เปตอง',
      'ข้อกำหนดคุณสมบัติและจำนวนนักกีฬาแต่ละประเภท',
      'เกณฑ์การแต่งกาย อุปกรณ์ และบทลงโทษทางวินัย',
      'ขั้นตอนการรายงานตัวและการยื่นประท้วงต่อคณะกรรมการ',
    ],
  },
  {
    id: 'schedule-2026',
    title: 'กำหนดการแข่งขันและพิธีการ',
    titleEn: 'Schedule & Ceremony Program 2026',
    category: 'กำหนดการ',
    badge: 'ไทม์ไลน์ทางการ (3 หน้า)',
    pages: 3,
    fileSize: '650 KB',
    format: 'PDF',
    updatedAt: '2026-10-01',
    downloadUrl: '/docs/sci-games-2026-schedule.pdf',
    fileName: 'SciGames2026-Schedule.pdf',
    description:
      'กำหนดการแข่งขันรายวัน ลำดับพิธีเปิด-ปิด กิจกรรมวอลเลย์บอลยักษ์ และพิธีมอบเหรียญรางวัล',
    highlights: [
      'วันศุกร์ 9 ต.ค. 2569: เปตอง, ตะกร้อ, วอลเลย์บอล, บาสเกตบอล, ฟุตซอล (รอบแรก)',
      'วันเสาร์ 10 ต.ค. 2569: การแข่งขันรอบแรกและรอบชิงอันดับ 3 ทุกชนิดกีฬา',
      'วันอาทิตย์ 11 ต.ค. 2569: พิธีเปิด (09:00 น.), วอลเลย์บอลยักษ์, รอบชิงชนะเลิศ และพิธีปิดมอบเหรียญรางวัล',
    ],
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/documents.test.js`
Expected: PASS (all 3 tests pass).

- [ ] **Step 5: Commit Task 1**

```bash
git add public/docs/ src/data/documents.js tests/documents.test.js
git commit -m "feat: add official pdf documents and metadata"
```

---

### Task 2: Create Document Preview Modal Component

**Files:**
- Create: `src/components/public/DocumentPreviewModal.js`

**Interfaces:**
- Consumes: `{ doc, isOpen, onClose }` props
  - `doc`: Document object from `OFFICIAL_DOCUMENTS`
  - `isOpen`: boolean
  - `onClose`: function callback

- [ ] **Step 1: Implement `DocumentPreviewModal.js`**

Handles:
- Escape key listener to close
- Scroll-lock on body when modal is open
- Top control bar: Document title, badges, Direct Download button (`<a download ...>`), Open in new tab button (`target="_blank"`), and Close button (`X` icon)
- Responsive iframe embed with responsive aspect ratio
- Fallback banner for mobile browsers that do not support inline PDF iframe viewer with direct download button

- [ ] **Step 2: Verify component with build / unit check**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Commit Task 2**

```bash
git add src/components/public/DocumentPreviewModal.js
git commit -m "feat: add DocumentPreviewModal component for pdf preview"
```

---

### Task 3: Implement HandbookHub Component & Public Route

**Files:**
- Create: `src/components/public/HandbookHub.js`
- Create: `src/app/(public)/handbook/page.js`

**Interfaces:**
- Consumes: `OFFICIAL_DOCUMENTS` from `src/data/documents.js`
- Produces: Public route at `/handbook`

- [ ] **Step 1: Implement `HandbookHub.js`**

Features:
- Page hero with title: "สูจิบัตรและกำหนดการแข่งขัน" and subtitle
- Two prominent Glassmorphism cards for Handbook and Schedule
- Card content:
  - Header with icon (BookOpen / Calendar), Title, TitleEn, category badge, and pages count
  - Description and highlight list with check icons
  - File info badge (Format: PDF, File Size)
  - Action buttons:
    - Primary Button: `📥 ดาวน์โหลด PDF` (triggers direct download)
    - Secondary Button: `👁️ เปิดอ่านตัวอย่าง` (opens preview modal)
    - External link: `↗️ เปิดในแท็บใหม่`
- Quick Facts summary box at bottom showing:
  - 5 official sports with icons
  - Event dates: 9 - 11 ตุลาคม 2569
  - Main venues: Gymnasium, Futsal Court, Basketball Court, Takraw Court, Petanque Ground

- [ ] **Step 2: Implement `src/app/(public)/handbook/page.js`**

Features:
- Metadata exports:
  - `title`: 'สูจิบัตรและกำหนดการแข่งขัน | Sci Games 2026'
  - `description`: 'ดาวน์โหลดและเปิดอ่านสูจิบัตร กติกา 5 ชนิดกีฬา และกำหนดการพิธีการ Sci Games 2026 คณะวิทยาศาสตร์และเทคโนโลยี ม.ราชภัฏภูเก็ต'
- Renders `HandbookHub`

- [ ] **Step 3: Run build check**

Run: `npm run build`
Expected: Build passes with `/handbook` route created.

- [ ] **Step 4: Commit Task 3**

```bash
git add src/components/public/HandbookHub.js src/app/(public)/handbook/page.js
git commit -m "feat: add HandbookHub component and /handbook public route"
```

---

### Task 4: Integrate Navigation (Navbar, QuickLinks, Footer)

**Files:**
- Modify: `src/components/public/Navbar.js`
- Modify: `src/components/public/QuickLinks.js`
- Modify: `src/components/public/Footer.js`

- [ ] **Step 1: Add `/handbook` to `Navbar.js`**

Add `{ href: '/handbook', label: 'สูจิบัตร' }` to `navLinks`.

- [ ] **Step 2: Update `QuickLinks.js`**

Add an entry or update existing links to highlight "สูจิบัตร & กำหนดการ" (`/handbook`) with BookOpen icon and "ดาวน์โหลด PDF ทางการ" badge.

- [ ] **Step 3: Update `Footer.js`**

Add a link to `/handbook` in the public quick links section.

- [ ] **Step 4: Verify lint and build**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 5: Commit Task 4**

```bash
git add src/components/public/Navbar.js src/components/public/QuickLinks.js src/components/public/Footer.js
git commit -m "feat: integrate handbook navigation across navbar, quicklinks, and footer"
```

---

### Task 5: Full Regression Testing & Verification

**Files:**
- Verify: All touched files

- [ ] **Step 1: Run unit tests**
Run: `npm test`
Expected: All tests pass (≥ 54 tests).

- [ ] **Step 2: Run linter**
Run: `npm run lint`
Expected: 0 warnings, 0 errors.

- [ ] **Step 3: Run production build**
Run: `npm run build`
Expected: Exit code 0, all routes including `/handbook` statically generated or ready.

- [ ] **Step 4: Update Handoff.md**
Update `Handoff.md` with completed handbook & schedule download hub feature, bump date, and commit.
