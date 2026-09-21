# แผน Dark Theme — Sci Games 2026

วันที่: 21 ก.ย. 2569 · สถานะ: รอผู้ใช้ยืนยันคำถาม 4 ข้อท้ายไฟล์ก่อนลงมือ

## 0. สภาพปัจจุบัน (สำรวจแล้ว)

| จุด | สถานะ |
|---|---|
| `globals.css` | มี token 89 ตัว (`--mono-0…950`, `--gold-*`, `--glass-*`, `--team-*`) เป็น **ค่า light อย่างเดียว** ไม่มี `prefers-color-scheme`/`data-theme`; ในไฟล์ยัง hardcode สีอีก 326 จุด (body, `.btn-*`, `.form-input`, `.filter-island-card`, mobile nav, ฯลฯ) |
| `src/app/layout.js` | `<html lang="th">` ไม่มี theme attribute / no-flash script |
| โซน public + ui (ของเพื่อน) | hardcode ~530 จุด — `MatchDetailModal` 130, `MatchCard` 84, `ScheduleGrid` 54, `StandingsPodium` 53, `results/page.js` 44, `RegistrationForm` 34; ส่วนใหญ่เป็นชุด zinc (`#09090b` ×61, `#71717a` ×59, `#e4e4e7`, `#f4f4f5`, `#f8fafc`) + gold `#ca8a04` ×47 |
| โซน staff / admin / live (ของเรา) | ใช้ `var(--mono-*)`, `var(--gold-*)`, `var(--glass-*)` เป็นหลัก (hardcode เหลือ ~140 จุด ส่วนใหญ่เป็นสี semantic: แดง/เขียว/น้ำเงิน) |
| สีทีม | `teams.color_hex` จาก DB + gradient ใน `MatchCard.getTeamStyle()` — เป็นสีแบรนด์ ต้องคงไว้ทั้งสองธีม |
| อื่น ๆ | Chart.js (`AnalyticsCharts`) ตั้งสีแกน/เส้นตายตัว; `body::before/after` วงกลม glow; `<style jsx global>` 2 ไฟล์; QR code (ต้องพื้นขาวเสมอ); jsPDF ไม่เกี่ยว |

## 1. หลักการ

1. **Semantic tokens ชั้นบน `--mono-*`** — component อ้าง "ความหมาย" (`--text`, `--surface`) ไม่ใช่ "เฉดสี" (`--mono-900`) เพราะ mono-900 ในธีมมืดต้องกลายเป็นสีอ่อน ถ้ายัง map ตรง ๆ จะกลับด้านผิด
2. **สลับที่ `<html data-theme>`** ค่าเดียว ทุกอย่างเปลี่ยนตาม CSS ไม่ต้องแตะ component
3. **codemod แทนแก้มือ** สำหรับ hex ชุด zinc/gold ที่ซ้ำ ๆ ของเพื่อน แล้วรีวิว diff เฉพาะจุดที่ context ต่าง (เช่น `#fff` ที่เป็นตัวหนังสือบนพื้นสีทีมต้องคงขาว)
4. **สีแบรนด์ไม่เปลี่ยน** (ทอง, สีทีม 4 สี, แดง LIVE) ปรับแค่ความสว่างเล็กน้อยให้ผ่าน contrast บนพื้นมืด
5. ทุกหน้าต้องผ่าน **contrast ≥ 4.5:1** (ข้อความปกติ) / 3:1 (ข้อความใหญ่, ขอบ) ทั้งสองธีม — มี script เช็ค

## 2. Token ใหม่ (globals.css)

```css
:root {
  color-scheme: light;
  /* พื้น */
  --bg: #fafafa;            /* body */
  --bg-elevated: #ffffff;   /* card, modal, nav */
  --surface: #ffffff;       /* กล่องบนพื้น */
  --surface-2: #f4f4f5;     /* แถบ/แท็บ/ช่อง input */
  --surface-3: #e4e4e7;     /* hover, divider เข้ม */
  --surface-rgb: 255 255 255;   /* สำหรับ rgba(var(--surface-rgb) / .9) ใน gradient ของ MatchCard */
  /* ตัวหนังสือ */
  --text: #09090b;
  --text-2: #52525b;
  --text-3: #71717a;
  --text-muted: #a1a1aa;
  --text-inverse: #ffffff;
  /* เส้น */
  --border: #e4e4e7;
  --border-strong: #d4d4d8;
  /* accent ทอง */
  --accent: #facc15;
  --accent-text: #a16207;       /* ทองที่อ่านออกบนพื้นสว่าง */
  --accent-surface: rgba(250, 204, 21, 0.10);
  --accent-border: rgba(250, 204, 21, 0.30);
  /* semantic */
  --danger: #ef4444;  --danger-text: #b91c1c;  --danger-surface: rgba(239,68,68,.10);
  --success: #22c55e; --success-text: #15803d; --success-surface: rgba(34,197,94,.10);
  --info: #3b82f6;    --info-text: #1d4ed8;    --info-surface: rgba(59,130,246,.10);
  /* glass (มีอยู่แล้ว — ให้ชี้ token ใหม่) */
  --glass-bg: rgba(255,255,255,.88);  --glass-border: rgba(228,228,231,.85);
  --glass-shadow: 0 8px 30px -4px rgba(0,0,0,.06);
  /* ปุ่มหลัก (ดำบนสว่าง → ขาวบนมืด) */
  --btn-primary-bg: var(--text);  --btn-primary-fg: var(--bg);
  --overlay: rgba(0,0,0,.45);
}

:root[data-theme="dark"],
:root:not([data-theme="light"]) { /* ใน @media (prefers-color-scheme: dark) */
  color-scheme: dark;
  --bg: #0b0b0e;  --bg-elevated: #141418;  --surface: #18181b;  --surface-2: #1f1f24;  --surface-3: #2a2a31;
  --surface-rgb: 24 24 27;
  --text: #fafafa;  --text-2: #d4d4d8;  --text-3: #a1a1aa;  --text-muted: #71717a;  --text-inverse: #09090b;
  --border: #27272a;  --border-strong: #3f3f46;
  --accent: #facc15;  --accent-text: #fde047;  --accent-surface: rgba(250,204,21,.12);  --accent-border: rgba(250,204,21,.35);
  --danger-text: #fca5a5;  --success-text: #86efac;  --info-text: #93c5fd;
  --glass-bg: rgba(24,24,27,.82);  --glass-border: rgba(255,255,255,.08);  --glass-shadow: 0 8px 30px -4px rgba(0,0,0,.5);
  --overlay: rgba(0,0,0,.65);
}
```

- `--mono-*` **คงไว้** เป็น raw scale (ไม่ flip) เพื่อไม่ทำโค้ดเดิมพัง แต่ codemod จะย้ายการใช้งานไป semantic token; หลังจบงาน `--mono-*` ควรเหลือใช้เฉพาะจุดที่ตั้งใจ (เช่น QR box)
- สีทีม 4 สี: เพิ่ม `--team-red-dark` ฯลฯ? **ไม่ต้อง** — ใช้ค่าเดิม แต่ในธีมมืด `MatchCard` เปลี่ยน alpha ของ ambient จาก `44`→`33` และพื้นกลางจาก `rgba(255,255,255,.98)` เป็น `rgb(var(--surface-rgb) / .95)`

## 3. กลไกสลับธีม

1. **No-flash script** ใน `<head>` (inline, ก่อน hydration):
   ```js
   (function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})();
   ```
   ไม่ตั้ง attribute = ตามระบบ (`prefers-color-scheme`)
2. `src/hooks/useTheme.js` — `{ theme: 'light'|'dark'|'system', resolved, setTheme }` เก็บ `localStorage.theme`, ฟัง `matchMedia('(prefers-color-scheme: dark)')`, ตั้ง `data-theme`
3. `src/components/ui/ThemeToggle.js` — ปุ่ม 3 สถานะ (ระบบ / สว่าง / มืด) ไอคอน Sun/Moon/Monitor จาก lucide; วางที่ **Navbar (desktop + เมนูมือถือ)**, **AdminSidebar ท้าย**, **staff header** (กรรมการในโรงยิมกลางคืนได้ประโยชน์มาก)
4. `<meta name="theme-color">` 2 ค่าตาม media ให้แถบเบราว์เซอร์มือถือเปลี่ยนตาม
5. `layout.js` ใส่ `suppressHydrationWarning` ที่ `<html>` (attribute ถูก script เปลี่ยนก่อน React)

## 4. Codemod `scripts/codemod-theme.mjs`

แทนที่ใน `src/**/*.js(x)` และ `globals.css` ตามตาราง (เรียงจากยาวไปสั้นกันแทนซ้อน):

| จาก | เป็น | หมายเหตุ |
|---|---|---|
| `#09090b`, `#18181b`, `var(--mono-900)`, `var(--mono-950)` | `var(--text)` | |
| `#52525b`, `var(--mono-700)`, `var(--mono-800)` | `var(--text-2)` | |
| `#71717a`, `var(--mono-600)`, `var(--mono-500)` | `var(--text-3)` | |
| `#a1a1aa`, `var(--mono-400)` | `var(--text-muted)` | |
| `#d4d4d8` | `var(--border-strong)` | |
| `#e4e4e7`, `var(--mono-300)`, `rgba(228, 228, 231, …)` | `var(--border)` | |
| `#f4f4f5`, `#f8fafc`, `var(--mono-100)`, `var(--mono-200)` | `var(--surface-2)` | |
| `#fafafa` (background) | `var(--bg)` | |
| `#ffffff` / `#fff` / `rgba(255, 255, 255, 0.9x)` **ใน `background`** | `var(--surface)` | ⚠ ต้องดู context |
| `#fff` **ใน `color`** | `var(--text-inverse)` เฉพาะที่พื้นเป็นสีทีม/ดำ → ส่วนใหญ่**คงขาว** | รีวิวมือ |
| `#ca8a04`, `#a16207`, `#b45309`, `var(--gold-600)`, `var(--gold-700)` | `var(--accent-text)` | |
| `#fbbf24`, `#facc15` (ไอคอน/เส้น) | `var(--accent)` | |
| `#fef3c7`, `#fde68a` (พื้น) | `var(--accent-surface)` | |
| `#b91c1c`, `#dc2626` | `var(--danger-text)` | |
| `#15803d`, `#16a34a` | `var(--success-text)` | |
| `#1d4ed8` | `var(--info-text)` | |
| `rgba(0,0,0,0.6)` overlay | `var(--overlay)` | |

- script มี `--dry` พิมพ์จำนวนแทนต่อไฟล์ และ **ข้าม** `tournamentData.js`, `SportIcon.js` (สีเป็นข้อมูล), `getTeamStyle()` block, ค่าสีทีม, QR
- หลังรัน: `git diff --stat` แล้วรีวิวมือ 6 ไฟล์หนัก (MatchDetailModal, MatchCard, ScheduleGrid, StandingsPodium, results/page, RegistrationForm) เน้นหา `color: '#fff'` บนพื้นสีทีมและ gradient ที่ผสมขาว

## 5. งานเฉพาะจุด (หลัง codemod)

| ที่ | ต้องทำ |
|---|---|
| `globals.css` | `body` ใช้ `--bg/--text`; `.btn-primary` → `--btn-primary-*`; `.btn-secondary`, `.form-input`, `.filter-island-card`, `.mobile-bottom-nav`, `.badge-*`, `.glass-card` hover; `body::before/after` glow ลด opacity 50% ในมืด; scrollbar `color-scheme` |
| `MatchCard` / `MatchDetailModal` | gradient กลางการ์ด `rgba(255,255,255,.98)` → `rgb(var(--surface-rgb) / .96)`; ambient ทีม alpha ลดในมืด; ตัวเลขผู้แพ้ (`#d4d4d8`) → `--text-muted` |
| `AdminSidebar` + `(admin)/layout.js` header | ตอนนี้ dark ตายตัว → ใช้ `--bg-elevated`/`--border` เพื่อให้ในธีมสว่างยังดำ (ตั้ง override `[data-theme=light] .admin-sidebar { --bg-elevated: #141418; --text: #fafafa … }`) — sidebar เป็น "dark island" ทั้งสองธีม |
| `AnalyticsCharts` | อ่านสีจาก `getComputedStyle(document.documentElement).getPropertyValue('--text-3')` ตอนสร้าง options + re-render เมื่อธีมเปลี่ยน (subscribe `useTheme`) |
| `ScoreInput` / `LiveMonitor` / `PinManager` | สีแดง/เขียว/น้ำเงิน text → `--danger-text` ฯลฯ; `.score-actions` bg → `rgb(var(--surface-rgb) / .92)`; QR `<img>` ครอบกล่องขาวเสมอ |
| `.live-*` CSS | `.live-indicator` bg/สี ใช้ `--success-surface/--success-text`; `.live-score` bump color `--success-text` |
| `Toast`, `Modal`, `LoadingSkeleton`, `StatusBadge`, `DataTable` | ตรวจ overlay/skeleton shimmer/ badge bg ให้ใช้ token |
| `<style jsx global>` ใน `(admin)/layout.js`, `LiveMonitor.js` | ไม่มีสี — ไม่ต้องแก้ |

## 6. ทดสอบ

1. `scripts/check-contrast.mjs` — อ่าน token คู่ (`--text` บน `--bg`, `--text-3` บน `--surface`, `--accent-text` บน `--surface`, `--danger-text` บน `--danger-surface` …) ทั้งสองธีม คำนวณ WCAG ratio; fail ถ้า < 4.5 (ข้อความ) / 3 (UI)
2. Screenshot matrix ใน browser preview: **light/dark × mobile 375/desktop 1280** ของ `/`, `/schedule`, `/live`, `/live/[sport]`, `/results`, `/register`, `/staff/login`, `/staff/scoring` (ต้องมี fixture), `/admin`, `/admin/live`, `/admin/pins` → 8 หน้า × 4 = 32 ภาพ เก็บใน `docs/qa/theme/` (gitignored) ดูด้วยตา
3. `npm run build` + `npm test` + `npx eslint src` (ห้ามเพิ่ม error)
4. ตรวจ no-flash: reload หน้าใดก็ได้ในโหมดมืด ต้องไม่กะพริบขาว
5. ตรวจ `prefers-reduced-motion` ไม่ถูกกระทบ; ปุ่ม toggle มี `aria-label` และ `aria-pressed`

## 7. ลำดับงาน / เวลา (≈ 2 วันคน)

| ขั้น | งาน | เวลา | ความเสี่ยง |
|---|---|---|---|
| 1 | token + `data-theme` + no-flash + `useTheme` + `ThemeToggle` + ปรับ `globals.css` base | 0.5 วัน | ต่ำ |
| 2 | codemod โซนเรา (staff/admin/live) + งานเฉพาะจุดของเรา | 0.25 วัน | ต่ำ |
| 3 | codemod โซนเพื่อน (public/ui) + รีวิวมือ 6 ไฟล์ + MatchCard gradient | 0.75 วัน | **สูง — ชนกับงานเพื่อน** (เพื่อนแก้ `results/page.js`, `ScheduleGrid`, `MatchCard` อยู่เรื่อย ๆ) |
| 4 | Charts, sidebar override, QA matrix, contrast script, แก้ที่เจอ | 0.5 วัน | กลาง |

**วิธีลดความเสี่ยงขั้น 3:** ทำใน branch `feat/dark-theme`, นัดเพื่อน push งานค้างก่อน แล้ว rebase → รัน codemod → push ภายในชั่วโมงเดียว แล้วแจ้งเพื่อนให้ pull ก่อนแก้ไฟล์เหล่านั้นต่อ (หรือส่ง `codemod-theme.mjs` ให้เพื่อนรันฝั่งตัวเองก็ได้ เพราะ idempotent)

## 8. คำถามที่ต้องตอบก่อนเริ่ม

1. **ค่าเริ่มต้น**: ตามระบบผู้ใช้ (แนะนำ) หรือบังคับ light จนกว่าจะกดสลับ?
2. **ครอบคลุมโซน admin/staff ด้วยไหม** (แนะนำ: ใช่ — กรรมการใช้กลางคืน) หรือทำเฉพาะ public ก่อน?
3. **สีพื้นมืด**: zinc-950 `#0b0b0e` (นุ่ม, แนะนำ) หรือดำสนิท `#000` (OLED)?
4. **ประสานเพื่อน**: ให้ผมรัน codemod กับไฟล์ของเพื่อนเลย (ต้องนัดช่วงที่เพื่อนไม่แก้) หรือส่ง script ให้เพื่อนรันเอง?
