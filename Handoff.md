# 🔄 Project Hand-Off Summary
> Last updated: 2026-09-21 (Phase 3 done; friend's UI segmented-bar fixes merged) — ไฟล์นี้เป็น living document อัปเดตทับได้เรื่อย ๆ (สำเนาระบุวันที่เก็บไว้เฉพาะในเครื่องที่ docs/handoff-summary-YYYY-MM-DD.md ไม่ขึ้น git)

## 1. [Project Overview & Tech Stack]

**Sci Games 2026** — เว็บกีฬาสานสัมพันธ์ คณะวิทยาศาสตร์ฯ ม.ราชภัฏภูเก็ต (งานวันที่ 9–11 ต.ค. 2569 เหลือ ~19 วัน)
Repo: https://github.com/Esther03u/sci-games-2026 (branch `main`, clone อยู่ที่ `C:\SCI Game`)

- **Next.js 16.3.5** App Router, JavaScript (ไม่ใช่ TS), React 19, Vanilla CSS glassmorphism (`globals.css` ~1,900 บรรทัด, ไม่ใช้ Tailwind แม้จะมี `tailwind-merge`)
- **Supabase** (PostgreSQL + Auth + Realtime) ผ่าน `@supabase/ssr` — anon key ฝั่ง client, service role ใน API routes
- Chart.js, jsPDF, JSZip, motion, lucide-react
- ไม่มี test เลย ไม่มี CI; `npm run build` ผ่าน (exit 0)
- ⚠️ Next 16 เปลี่ยน convention: `middleware.js` → `proxy.js` (build แจ้ง "ƒ Proxy (Middleware)"); ต้องอ่าน `node_modules/next/dist/docs/` ก่อนเขียนโค้ดตาม `AGENTS.md`

**3 โซน:** Public (`/`, `/schedule`, `/results`, `/news`, `/register`, `/check-status`) · Admin (`/admin/*` 9 หน้า, role `super_admin`) · Staff (`/staff/scoring`, role `staff`)

**เป้าหมายรอบนี้:** ทำระบบ 3 ส่วนให้สมบูรณ์ — (1) ผู้ชมดูสกอร์ Realtime (2) ผู้ลงคะแนนกด +1/−1 จากสนาม (3) Admin ดู/จัดการทุกอย่าง — โดย**ต่อยอดโค้ดเดิม** ไม่รื้อ

## 2. [Completed Milestones]

- ✅ Clone repo + `npm install` + `next build` ผ่าน
- ✅ วิเคราะห์โค้ดทั้งหมด พบช่องโหว่/ปัญหา (ดูข้อ 3)
- ✅ Pull commit ล่าสุด `5c8ba1b` "modernize schedule & results filter controls…" (แตะเฉพาะ UI public 16 ไฟล์: `results/page.js`, `ScheduleGrid`, `MatchCard`, `MatchDetailModal` เขียนใหม่, เพิ่ม `SportIcon.js`, `check-status/page.js` ถูกตัดจาก 180 บรรทัดเหลือน้อยมาก — ยังไม่ได้ยืนยันว่าเพื่อนตั้งใจ)
- ✅ ยืนยันแล้วว่า DB จริงบน Supabase = `supabase/migrations/001_initial_schema.sql` เป๊ะ (เพื่อนส่งไฟล์ `supabase/message.txt` มา diff แล้ว IDENTICAL) → migration ใหม่ต่อจาก 001 ได้เลย
- ✅ เก็บ requirement ครบและเขียนแผนเต็มไว้ที่ **`docs/plans/2026-09-20-live-scoring-v2.md`** (ต้องอ่านไฟล์นี้ก่อนลงมือ)
- ✅ **Phase 0 เสร็จ (20 ก.ย.)** — build + lint ผ่าน, migration ทดสอบผ่านบน Postgres local:
  - `src/lib/auth/resolveActor.js` ใหม่: `resolveActor()` → admin/staff/null, `requireAdmin()`, `actorCanScoreSport()` (PIN actor เพิ่มใน Phase 1)
  - `/api/admin/users` มี auth แล้ว (requireAdmin + validate role/password + กันลบตัวเอง + `createAuditLog`)
  - `src/middleware.js` → `src/proxy.js` (Next 16 convention) + matcher `/api/admin/:path*` ตอบ 401 JSON
  - `src/lib/rate-limit.js` เป็น async ใช้ Postgres fn `check_rate_limit()` ผ่าน service role, fallback in-memory; เพิ่ม `getClientIp()`; 3 API routes เปลี่ยนเป็น `await rateLimit(...)`
  - `ScoreInput.js` กรองแมตช์ตาม `assignedSports` (admin เห็นทั้งหมด)
  - **`supabase/migrations/002_live_scoring.sql`** (~930 บรรทัด, idempotent) — ดูสรุป section ในข้อ 4
  - `supabase/tests/` — `00_supabase_stubs.sql` (stub auth.uid/roles/publication), `scenario_live_scoring.sql` (7 scenario, ROLLBACK ท้าย), `run-local.sh`

**Requirement ที่ผู้ใช้ตัดสินใจแล้ว:**

| หัวข้อ | ตัดสินใจ |
|---|---|
| แนวทาง | ต่อยอดโค้ดเดิม |
| หน้าผู้ชม | 1 การ์ดต่อกีฬา = แมตช์ที่กำลังแข่ง, ตำแหน่งการ์ดคงที่ (ไม่ re-sort); กดเข้าไปดู "จบแล้ว+สกอร์ / กำลังแข่ง / คู่ต่อไป" เรียงลำดับ |
| Indicator | ↑ เขียวมุมขวาการ์ดเมื่อ**คะแนนเพิ่ม**เท่านั้น (ลดไม่แสดง เพื่อไม่ให้คนดูรู้ว่ากดผิด) + ไฮไลต์ตัวเลขทีมที่ได้แต้ม + "อัปเดตล่าสุด X วิที่แล้ว" |
| ผู้ลงคะแนน | ปุ่ม +1/−1 ใหญ่กดง่าย; เข้าระบบได้ **2 แบบ**: บัญชี Staff (ผูกกีฬา) และ **PIN ต่อกีฬา** |
| กีฬาเซต | วอลเลย์บอล/ตะกร้อ/เปตอง **เก็บคะแนนรายเซต** |
| แก้หลังจบ | Staff แก้ได้ภายใน N นาที (default 10, admin ปรับได้) หลังนั้น admin เท่านั้น |
| Admin เพิ่ม | Live Monitor ทุกสนาม, หน้า Audit + rollback, จัดการ PIN, สร้าง Bracket อัตโนมัติ |

- ✅ **Phase 1 เสร็จ (21 ก.ย.)** — Scoring Engine / API layer; build ผ่าน, `npm test` 11 tests ผ่าน, `npm run test:db` ผ่าน (001→002→003 รันซ้ำได้):
  - `src/lib/auth/pinSession.js` — JWT (jose, HS256) ใน cookie `sg_pin` อายุ 14 ชม. ลงนามด้วย env **`PIN_SESSION_SECRET`** (ใหม่ ต้องตั้งใน Vercel/.env.local ≥16 ตัว)
  - `resolveActor()` รองรับ `{type:'pin'}` แล้ว (เช็ค `sport_pins.is_active/expires_at` ทุก request → admin revoke ได้ทันที); เพิ่ม `requireScorer()`, `requireScorerForSport()`, `actorToRpc()`, `actorPublicView()`
  - `src/lib/api/scoring.js` — `mapRpcError()` แปลง RAISE code จาก Postgres → HTTP status + ข้อความไทย, `callScoringRpc()`, `isUuid()`, `badRequest()/notFound()`
  - Routes ใหม่ 11 ตัว (ดูตารางข้อ 4)
  - `src/hooks/useActor.js` — client hook เรียก `/api/auth/me` (ใช้แทน `useAuth` ในโซน staff)
  - `(staff)/layout.js` ใช้ `useActor` → PIN user เข้าได้; `proxy.js` ปล่อย `/staff/*` ถ้ามี cookie `sg_pin`
  - **`ScoreInput.js` เขียนใหม่** เรียก API ทั้งหมด: optimistic +/− พร้อม queue ส่งทีละรายการ (ตัวเลขไม่กระโดดถอยหลัง), ปุ่ม "ยกเลิกคะแนนล่าสุดของฉัน", กีฬาเซตมีแถบเซต + ปุ่ม "จบเซต", บาสมี +2/+3, แสดง "ซิงค์แล้ว HH:MM:SS", error banner ภาษาไทย
  - `supabase/migrations/003_staff_via_api_only.sql` — ลบ policy `staff_update` + trigger guard (staff ไม่มีทางเขียน `matches` ตรงอีกแล้ว)
  - Vitest: `vitest.config.mjs`, `tests/{pinSession,scoringErrors,resolveActor}.test.js`; scripts `npm test`, `npm run test:db`
  - deps ใหม่: `jose`, `bcryptjs`, devDep `vitest`

- ✅ **Phase 2 เสร็จ (21 ก.ย.)** — Staff UI; build/lint/test ผ่าน, หน้า login ตรวจด้วย browser preview แล้ว (มือถือ 375px):
  - `/staff/login` มี 2 แท็บ: **PIN กรรมการ** (dropdown กีฬา + ช่อง 6 หลัก inputMode numeric → `POST /api/pin/login`) และ **บัญชี Staff**; `?sport=<uuid>` เลือกกีฬาให้และเปิดแท็บ PIN อัตโนมัติ (สำหรับ QR)
  - `staff/scoring/page.js` ดึงแมตช์ที่ finished ภายใน edit window ด้วย (`.or('status.neq.finished,finished_at.gte.<since>')`) และอ่าน `app_settings.score_edit_window_minutes` ผ่าน service role ส่งเป็น prop `editWindowMinutes`
  - `ScoreInput` step 1 แยก 3 กลุ่ม: **กำลังแข่ง / ถัดไป / เพิ่งจบ — ยังแก้ได้** (มี countdown `mm:ss` ต่อการ์ด, tick ทุก 1 วิ); step 2 มีแถบ "แก้ได้อีก mm:ss (ถึง HH:MM)" และล็อกปุ่มเมื่อหมดเวลา (admin ไม่ล็อก)
  - Realtime: `useRealtime` แก้แล้ว (callback ใน `useRef`, คืน channel status, option `enabled`); ScoreInput subscribe `matches` ทั้งตาราง → list อัปเดตเอง, แมตช์ที่กำลังลงคะแนนถ้าถูกแก้จากเครื่องอื่น/admin จะ merge + แจ้ง "คะแนนถูกอัปเดตจากเครื่องอื่น" (เฉพาะตอน queue ว่าง)
  - Offline: `NetworkError` → retry ทุก 3 วิ (สูงสุด 40 ครั้ง) + แถบ "ออฟไลน์ — รอส่ง N รายการ"; `beforeunload` เตือนถ้า queue ไม่ว่าง; `navigator.wakeLock` ระหว่าง step 2 (ขอใหม่เมื่อกลับมาหน้าจอ)
  - ปุ่ม +1 สูง 96px, −1/+2/+3/undo/จบเซต สูง ≥44px, `touchAction: manipulation`
  - `useAuth` ถูกถอดออกจากโซน staff ทั้งหมด (login ใช้ `createClient().auth.signInWithPassword` ตรง)
  - **ธีม:** commit `5c8ba1b` ของเพื่อนเปลี่ยนเว็บเป็น light theme แต่โซน staff/admin ยัง hardcode สีขาว → แก้โซน staff แล้ว (map เป็น `var(--mono-*)`, `var(--gold-600/700)`, `var(--glass-*)`) **โซน admin ยังไม่แก้** (ดู Blockers)
  - `.claude/launch.json` (gitignored) สำหรับ `preview_start` dev server

- ✅ **ทดสอบกับ Supabase จริงแล้ว (21 ก.ย.)** — ผู้ใช้วาง `.env.local` (3 key) + รัน `supabase/apply-all.sql` (001→seed→002→003 รวมไฟล์เดียว, gitignored, สร้างใหม่ได้ด้วยคำสั่งใน Handoff ข้อ 4); ผมเพิ่ม `PIN_SESSION_SECRET` ให้ใน `.env.local`
  - `npm run check:supabase` → `scripts/check-supabase.mjs` ตรวจว่า migration/seed อยู่ครบ + `athletes` ไม่ public
  - `npm run test:smoke` → `scripts/smoke-test.mjs` (ต้อง `npm run dev` ก่อน) สร้าง admin/PIN/แมตช์ชั่วคราว ยิง API ครบ 33 checks (auth guard, PIN lifecycle, สิทธิ์ข้ามกีฬา, futsal, volleyball รายเซต, undo, edit window, standings, **Realtime `score_events` ถึง anon subscriber**, revoke PIN) แล้วลบทิ้ง — **ผ่านทั้งหมด**
  - ทดสอบผ่าน UI จริงบน browser 375px: PIN login → เห็นเฉพาะกีฬาตัวเอง → start → +1 → undo → จบเซต → หน้ายืนยัน
  - **บั๊กที่เจอและแก้แล้ว:** (1) `(staff)/layout.js` ใช้ร่วมกับ `/staff/login` จึงไม่ remount หลัง login → `useActor` ค้าง null → เด้งกลับ login; แก้ให้ `refresh()` เมื่อ pathname เปลี่ยน และ `refresh` ตั้ง loading ก่อน (2) หน้ายืนยันกีฬาเซตแสดงเซตก่อน auto-close ทำให้บอกผู้ชนะผิด → ใช้ `projectedSets()` + เตือนแดงถ้ายังไม่มีทีมชนะครบ `sets_to_win` (3) ปุ่ม undo ยาวเกินจอ → "↶ ยกเลิกล่าสุด"
  - DB ตอนนี้ว่าง (0 matches / 0 admin_users / 0 auth users) — **ยังไม่มีบัญชี admin จริง** ต้องสร้าง (ดู Blockers)
- ✅ **UI Fixes (21 ก.ย.)** — แก้ไขแถบสถานะ Segmented bar ใน `results/page.js` และ `ScheduleGrid.js` ให้สมมาตร 4 ช่องกว้าง 25% เท่ากันเป๊ะ จัดกึ่งกลางพอดี ไม่ล้นกรอบบนมือถือ, คำนวณ `statusCounts` แยกจาก `statusFilter` ทำให้จำนวนนับถูกต้องและแท็บ "กำลังแข่ง" ไม่หายไปเมื่อเลือกแท็บอื่น, รวมฟอนต์ Kanit สม่ำเสมอทั้งเว็บ

- ✅ **บัญชี super_admin จริงสร้างแล้ว** — `Kobayachikoby@gmail.com` (รหัสที่ผู้ใช้กำหนด, ไม่เก็บใน repo) ผ่าน `scripts/create-admin.mjs <email> <password> [name]` (idempotent: รันซ้ำ = รีเซ็ตรหัส)
- ✅ **Phase 3 เสร็จ (21 ก.ย.)** — Viewer UI ทดสอบกับ Supabase จริงใน browser แล้ว (realtime +1 → การ์ดเปลี่ยนทันที + ↑ เขียว 3 วิ):
  - `src/hooks/useLiveScores.js` — 1 channel subscribe `matches` (*), `match_sets` (*), `score_events` (INSERT, เฉพาะ `delta > 0` → `bumps[matchId]`); polling fallback 15 วิ ถ้าไม่ SUBSCRIBED ใน 10 วิ; refetch เมื่อ `visibilitychange`/`online`; helper `matchesForSport`, `matchWinner`, `relativeTime`, `ROUND_LABEL`, `useClock()` (useSyncExternalStore, 0 ตอน SSR กัน hydration mismatch)
  - `src/lib/live-data.js` `loadLiveData(supabase)` — initial data ฝั่ง server (page.js export helper ไม่ได้ใน Next)
  - `/live` (`LiveBoard` + `SportLiveCard`) — grid การ์ดต่อกีฬาเรียง `sort_order` ตายตัว; การ์ดโชว์แมตช์ live ตัวแรก (+ป้าย "LIVE +N"), ไม่มี live → ผลล่าสุด หรือคู่ถัดไป; `.live-indicator` ↑ มุมขวาบน 3 วิ, `.live-score.is-bump` ตัวเลขเด้ง, "อัปเดตล่าสุด X วินาทีที่แล้ว"; กีฬาเซตแสดง "เซตที่ 2: 15–10 | 25–20"
  - `/live/[sportId]` (`SportLiveDetail`) — กำลังแข่ง (ใหญ่ + ตารางรายเซต) / คู่ต่อไป / จบแล้ว (ผู้ชนะเข้ม ผู้แพ้จาง) + `Bracket` 4 ทีมเมื่อมี `round`
  - CSS ใน `globals.css` ท้ายไฟล์ (`live-*`, `prefers-reduced-motion`); ธีม light ตั้งแต่แรก
  - Nav: `Navbar` เพิ่ม "ผลสด", `MobileBottomNav` เพิ่มแท็บ (ไอคอน `Radio`, active ที่ `/live*`), `HeroSection` ปุ่มหลักเป็น "ผลสด"
  - **บั๊กที่เจอและแก้:** (1) hydration mismatch จาก `Date.now()` ใน SSR → `useClock()` (2) React StrictMode mount effect 2 ครั้ง → callback `CLOSED` ของ channel แรกมาทีหลัง `SUBSCRIBED` ของอันที่สอง ทำให้ status ค้าง → ใส่ `active` flag ใน effect (3) `animate-ui/icons/activity.jsx` path SVG ของเพื่อนขาด arc flag → แก้เป็น path ของ lucide
  - **ข้อควรระวังตอน dev:** Browser pane ของ Claude เก็บ console/HMR state ค้างข้าม reload — ถ้าเห็นอาการแปลก ให้เปิดแท็บใหม่ (`tabs_create`) ก่อนสรุปว่าเป็นบั๊ก

## 3. [Current Task & Blockers]

**สถานะ:** Phase 3 เสร็จและ push แล้ว — งานถัดไปคือ **Phase 4: Admin** ตามแผนข้อ 6

**Phase 4 To-do (Admin):**
0. **แก้ธีมโซน admin ก่อน** — `(admin)/layout.js`, `AdminSidebar.js`, `/admin/login`, ทุกหน้า/ component ใน `src/components/admin/*` ยัง hardcode `rgba(255,255,255,…)`/`#fff`/`#fbbf24`/header `rgba(20,20,24)` → map เป็น `var(--mono-*)`, `var(--gold-600/700)`, `var(--glass-*)` แบบเดียวกับที่ทำโซน staff (ดู commit `a8d9245`)
1. `/admin/live` Live Monitor — ใช้ `useLiveScores()` เดิม + ตาราง: กีฬา / คู่ / คะแนน / ผู้ลงคะแนนล่าสุด (`score_events.actor_label` ล่าสุดต่อแมตช์ — ต้อง fetch เพิ่ม) / อัปเดตล่าสุด; ปุ่ม override (`POST /api/match/[id]/override`), reopen, finish; แถวกระพริบเมื่อมี bump
2. `/admin/audit` — รวม `score_events` + `audit_logs` (admin อ่านได้ผ่าน RLS `admin_read`); filter กีฬา/แมตช์/ผู้กระทำ/เวลา; ปุ่ม "ย้อน" → `POST /api/score/undo {event_id}`; timeline ต่อแมตช์
3. `/admin/pins` — CRUD ผ่าน `/api/admin/pins` (POST คืน `pin` ครั้งเดียว → แสดง + QR ลิงก์ `/staff/login?sport=<id>` ใช้ lib `qrcode` หรือ SVG เอง), เปิด/ปิด, หมดอายุ, `last_used_at`
4. `/admin/bracket` — เลือกกีฬา → seed 4 สี → วัน/เวลา/สนาม → `POST /api/admin/bracket`; แสดง bracket (reuse `Bracket` จาก `SportLiveDetail` — ย้ายออกเป็น component แยก)
5. `/admin/settings` — `GET/PATCH /api/admin/settings` (`score_edit_window_minutes`, `live_scoring_enabled`)
6. `/admin/matches` (`MatchEditor`) เพิ่มฟิลด์ `round`, แสดง `sets_a/b`; ปุ่ม "เปิดใน Live Monitor"; `/admin/users` เรียก API ที่มี auth แล้ว (OK) — ต่อ `AdminSidebar` ลิงก์หน้าใหม่ทั้งหมด
7. `(admin)/layout.js` เช็ค role ฝั่ง server (Server Component wrapper) แทน client-only

**Blockers / คำถามค้าง:**
- ✅ (แก้แล้ว) 002 อัปเดต `sports` ด้วย `WHERE name = ...` จึงใช้ได้ไม่ว่า seed รันแล้วหรือยัง
- ❓ `supabase/message.txt` เป็นไฟล์ซ้ำกับ 001 — ยังไม่ได้ commit, รอผู้ใช้ตัดสินใจลบ
- ❓ ใช้ default ไปก่อนใน 002 (ยังไม่ยืนยันกับผู้ใช้): N = 10 นาที (`app_settings.score_edit_window_minutes`); วอลเลย์ 2 ใน 3 เซตละ 25, ตะกร้อ 2 ใน 3 เซตละ 21, เปตอง เซตเดียว 13; bracket = รองฯ 2 คู่ + ชิงที่ 3 + ชิง (`generate_bracket`); บาส +2/+3 ยังไม่ตัดสิน
- ℹ️ เทส DB ใช้ PostgreSQL 16 ในเครื่อง (port 5432, user postgres — ผู้ใช้รู้รหัส ไม่เก็บใน repo): `PGPASSWORD=<รหัส> bash supabase/tests/run-local.sh` จะสร้าง/ลบ database `sci_games_test` เอง
- ⚠️ Supabase Free tier จำกัด Realtime **200 connections** — แผนมี polling fallback แต่ควรพิจารณา Pro เฉพาะเดือนงาน
- ⚠️ **โซน admin ยังใช้สี dark theme** (`rgba(255,255,255,…)`, `#fff`, header `rgba(20,20,24)`) ทั้งที่เว็บเป็น light theme ตั้งแต่ `5c8ba1b` → ตัวหนังสือมองไม่เห็นใน `/admin/login`, `AdminSidebar`, `(admin)/layout.js`, ทุกหน้า admin — แก้ใน Phase 4 ด้วยวิธีเดียวกับโซน staff (map เป็น `var(--mono-*)`)
- ⚠️ ปัญหารอง: `/athletes` และ `/standings` เป็นแค่ `redirect('/schedule')` ทั้งที่ README เคลม; race condition ตอนสมัคร (validate กับ insert คนละ transaction); seed มี 5 กีฬาแต่ README/`tournamentData.js` บอก 6; lint มี 8 error เดิมใน `results/page.js`, `animate-ui/icons/icon.jsx`, `slot.jsx` (ของเพื่อน ไม่ได้แตะ)

## 4. [Key Context & Code Snippets]

**โครงสร้างไฟล์สำคัญ**
```
src/
  middleware.js                 ← ต้อง rename เป็น proxy.js
  app/api/register|check-status|track|admin/users/route.js
  app/(public)/results/page.js  ← client, realtime, fallback OFFICIAL_MATCHES (เพิ่งถูกเขียนใหม่ใน 5c8ba1b)
  app/(staff)/staff/scoring/page.js + components/staff/ScoreInput.js  ← เขียน score ลง matches ตรง ๆ ผ่าน anon client
  app/(admin)/admin/{analytics,athletes,departments,login,matches,news,pdf,sport-schedules,users}/page.js
  components/admin/*Manager.js, MatchEditor.js, NewsEditor.js
  components/ui/MatchCard.js, MatchDetailModal.js, SportIcon.js
  hooks/useAuth.js, useRealtime.js
  lib/supabase/{client,server,admin}.js, validation.js, rate-limit.js, audit.js, tournamentData.js (1,064 บรรทัด mock สูจิบัตร)
supabase/migrations/001_initial_schema.sql, seed.sql, message.txt (ซ้ำ 001)
docs/plans/2026-09-20-live-scoring-v2.md   ← แผนเต็ม
docs/specs/2026-09-19-sci-games-design.md  ← spec เดิมของเจ้าของ repo
```

**Env (`.env.local.example`)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
แผนต้องเพิ่ม `PIN_SESSION_SECRET` (สำหรับ JWT ของ PIN cookie)

**ช่องโหว่ #1 — `src/app/api/admin/users/route.js` (ปัจจุบัน ไม่มี auth)**
```js
export async function POST(request) {
  try {
    const supabase = createAdminClient();   // service role — ไม่มีการเช็ค session/role ใด ๆ ก่อนหน้านี้
    const body = await request.json().catch(() => null);
    ...
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim(), password, email_confirm: true, ...
    });
```

**ช่องโหว่ #2 — `supabase/migrations/001_initial_schema.sql` (อยู่บน DB จริง)**
```sql
-- Athletes & Registrations: public read
DROP POLICY IF EXISTS "public_read" ON athletes;
CREATE POLICY "public_read" ON athletes FOR SELECT USING (true);   -- เปิด phone ให้ทุกคน

DROP POLICY IF EXISTS "staff_update" ON matches;
CREATE POLICY "staff_update" ON matches FOR UPDATE
  USING (get_user_role() = 'staff' AND is_staff_for_sport(sport_id));  -- ไม่จำกัดคอลัมน์
```

**Middleware matcher ปัจจุบัน — `src/middleware.js`**
```js
export const config = {
  matcher: ['/admin/:path*', '/staff/:path*'],   // ไม่ครอบ /api/admin
};
```

**Schema ปัจจุบันของ `matches` (001)**
```sql
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id uuid NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
  team_a_id uuid NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  team_b_id uuid NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  match_date date NOT NULL,
  match_time time NOT NULL,
  venue text NOT NULL,
  status match_status DEFAULT 'upcoming',   -- enum: upcoming|live|finished|postponed
  score_a integer,
  score_b integer,
  points_a integer DEFAULT 0,
  points_b integer DEFAULT 0,
  updated_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (team_a_id != team_b_id)
);
```
Trigger `trg_match_points` (BEFORE UPDATE) คิด `points_a/b` จาก `score_a/b` เมื่อ `status='finished'`; view `team_standings` รวมแต้ม

**`supabase/migrations/002_live_scoring.sql` — sections**
```
A. Security: DROP athletes.public_read; FK registrations.cancelled_by; trigger guard_staff_match_update (staff แก้ได้แค่ score/status)
B. Audit: fn log_admin_change() + trigger บน matches/athletes/registrations/announcements/departments/sport_schedules
   (บันทึกเฉพาะเมื่อ auth.uid() ไม่ null → service role ต้อง log เองผ่าน createAuditLog)
C. rate_limits table + check_rate_limit(p_key, p_limit, p_window_seconds) → {"allowed","remaining"}
D. sports +scoring_type('points'|'sets'), sets_to_win, points_per_set, icon
   matches +current_set, sets_a/b, last_score_at, last_scored_team, started_at, finished_at, round,
           next_match_id/slot, loser_next_match_id/slot; team_a_id/team_b_id DROP NOT NULL
   ใหม่: match_sets, score_events, sport_pins, app_settings
E. fn (SECURITY DEFINER, REVOKE จาก anon/authenticated — เรียกผ่าน service role เท่านั้น), ทุกตัวรับ p_actor jsonb
   {"type":"admin|staff|pin","admin_user_id":uuid|null,"pin_id":uuid|null,"label":text}:
   start_match(id, actor) · apply_score_event(id, team 'a'|'b', delta, actor) · finish_set(id, actor)
   finish_match(id, actor) · reopen_match(id, actor)[admin] · override_score(id, a, b, sets_a, sets_b, actor)[admin]
   undo_score_event(event_id, actor) · generate_bracket(sport_id, opts jsonb, actor)[admin]
   error codes ใน RAISE: MATCH_NOT_LIVE, EDIT_WINDOW_CLOSED, MATCH_TEAMS_NOT_SET, SET_IS_TIED, NOT_A_SET_SPORT,
   ADMIN_ONLY, CANNOT_UNDO_OTHERS_EVENT, EVENT_ALREADY_UNDONE, BRACKET_ALREADY_EXISTS, BRACKET_NEEDS_4_DISTINCT_SEEDS
F. trigger advance_bracket (AFTER UPDATE OF status) ใส่ผู้ชนะ/ผู้แพ้ลง next match
G. calculate_match_points() + view team_standings รองรับ sets
H. RLS: match_sets/score_events public SELECT; sport_pins admin SELECT; app_settings admin ALL; realtime publication + match_sets, score_events
```
พฤติกรรมสำคัญ: กีฬา `sets` ใช้ `matches.score_a/b` = คะแนน**เซตปัจจุบัน** (หน้าเดิมยังแสดงได้), `sets_a/b` = เซตที่ชนะ; `-1` ที่ 0 ไม่สร้าง event; `last_scored_team` เปลี่ยนเฉพาะ delta > 0 (ผู้ชมใช้แสดง ↑)

**`src/lib/auth/resolveActor.js` (ใช้ในทุก route handler)**
```js
export async function resolveActor()            // → {type:'admin', adminUserId, authUserId, label, sportIds:'*'}
                                                //   | {type:'staff', ..., sportIds:[uuid]} | null
export function actorCanScoreSport(actor, sportId)
export async function requireAdmin()            // → { actor } | { response: NextResponse 401/403 }
```

**API routes (Phase 1) — ทุกตัวตอบ `{success, data}` หรือ `{success:false, error_code, message}`**
| Route | ใคร | ทำอะไร |
|---|---|---|
| `GET /api/auth/me` | ทุกคน | `{type,label,sportIds,adminUserId}` หรือ `null` |
| `POST /api/score` `{match_id, team:'a'|'b', delta}` | staff/pin/admin ของกีฬานั้น | rpc `apply_score_event` → คืน match row |
| `POST /api/score/undo` `{match_id}` หรือ `{event_id}` | เดียวกัน | ยกเลิก event ล่าสุดของตัวเอง (admin ยกเลิกของใครก็ได้) |
| `GET /api/match/[id]` | public | match + `match_sets` |
| `POST /api/match/[id]/start|finish-set|finish` | staff/pin/admin | rpc ตามชื่อ |
| `POST /api/match/[id]/reopen|override` | admin | override body `{score_a,score_b,sets_a,sets_b}` |
| `POST /api/pin/login` `{sport_id, pin}` | public (rate limit 5/10 นาที) | bcrypt compare → set cookie `sg_pin` |
| `POST /api/pin/logout` | pin | ลบ cookie |
| `GET/POST/PATCH/DELETE /api/admin/pins` | admin | POST คืน `pin` ตัวจริง**ครั้งเดียว**; PATCH `{id,is_active,label,expires_at}`; DELETE `?id=` |
| `POST /api/admin/bracket` `{sport_id, seeds[4], semi_date, semi_time_1, semi_time_2, final_date, third_time, final_time, venue}` | admin | rpc `generate_bracket` |
| `GET/PATCH /api/admin/settings` `{key,value}` | admin | key ที่อนุญาต: `score_edit_window_minutes`, `live_scoring_enabled` |
| `POST/DELETE /api/admin/users` | admin | (Phase 0) |

Error codes ที่ map แล้วใน `src/lib/api/scoring.js`: MATCH_NOT_FOUND 404, MATCH_NOT_LIVE 409, EDIT_WINDOW_CLOSED 409, SET_IS_TIED 409, ADMIN_ONLY 403, CANNOT_UNDO_OTHERS_EVENT 403, EVENT_ALREADY_UNDONE 409, BRACKET_ALREADY_EXISTS 409, … (ไม่รู้จัก → 500 RPC_ERROR)

**Env ที่ต้องมี:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, **`PIN_SESSION_SECRET`** (ใหม่)

**Scripts:** `node scripts/create-admin.mjs <email> <pw>` (สร้าง/รีเซ็ต super_admin) · `npm run check:supabase` (สถานะ DB จริง) · `npm run test:smoke` (E2E กับ dev server, ลบข้อมูลทดสอบเอง) · `npm run test:db` (Postgres local) · `npm test` (Vitest) · สร้าง `supabase/apply-all.sql` ใหม่: `{ for f in supabase/migrations/001_initial_schema.sql supabase/seed.sql supabase/migrations/002_live_scoring.sql supabase/migrations/003_staff_via_api_only.sql; do printf '
-- >>> %s
' "$f"; cat "$f"; done; } > supabase/apply-all.sql`

**สถาปัตยกรรมที่วางไว้ (สรุปจากแผน — รายละเอียดเต็มในไฟล์แผน)**
```
Staff/PIN client → POST /api/score {match_id, team:'a'|'b', delta}
  → resolveActor(request)  // admin | staff(sportIds) | pin(sportId) | null
  → service role → Postgres fn apply_score_event()  // atomic, ตรวจ live/edit-window
  → INSERT score_events + UPDATE match_sets + UPDATE matches(last_score_at, last_scored_team)
  → Realtime (matches, match_sets, score_events) → viewer แสดง ↑ เมื่อ score_events.delta > 0
```
ตารางใหม่ใน 002: `match_sets`, `score_events`, `sport_pins`, `app_settings` + คอลัมน์ใน `sports` (`scoring_type`, `sets_to_win`, `points_per_set`) และ `matches` (`current_set`, `sets_a/b`, `last_score_at`, `last_scored_team`, `started_at`, `finished_at`, `round`, `next_match_id`, `next_match_slot`, `loser_next_match_id/slot`; `team_a_id/team_b_id` DROP NOT NULL เพื่อ bracket) — SQL ร่างเต็มอยู่ในแผนข้อ 2

**Timeline (จากแผน):** Phase 0 security+schema 21–22 ก.ย. → 1 engine 23–25 → 2 staff UI 26–29 → 3 viewer 30 ก.ย.–2 ต.ค. → 4 admin 3–5 ต.ค. → 5 test+deploy 6–8 ต.ค.

## 5. [Prompt for the Next AI]

```
โปรเจกต์ Sci Games 2026 อยู่ที่ C:\SCI Game (Next.js 16 App Router + Supabase, JavaScript)
อ่านก่อนตามลำดับ: Handoff.md → docs/plans/2026-09-20-live-scoring-v2.md → AGENTS.md (Next 16 เปลี่ยน API ต้องอ่าน node_modules/next/dist/docs/ ก่อนเขียนโค้ด)

Phase 0–3 เสร็จแล้ว (DB, API, Staff UI, Viewer /live) ทดสอบกับ Supabase จริงแล้ว เริ่ม Phase 4: Admin ตาม To-do ใน Handoff ข้อ 3:
1. รัน npm run check:supabase ยืนยัน DB; .env.local อยู่ในเครื่องนี้แล้ว; admin login = Kobayachikoby@gmail.com (ถามรหัสจากผู้ใช้ถ้าต้องใช้)
2. ข้อ 0 ก่อน: แก้สีโซน admin ให้เข้ากับ light theme (ดูวิธีจาก commit a8d9245 ที่ทำโซน staff)
3. สร้าง /admin/live, /admin/audit, /admin/pins, /admin/bracket, /admin/settings ตามลำดับ — reuse useLiveScores() และ API ที่มีแล้ว (ดูตาราง routes ใน Handoff ข้อ 4) ห้ามเขียน Supabase ตรงจาก client สำหรับคะแนน
4. ตรวจทุกหน้าใน browser preview (.claude/launch.json name next-dev) ทั้ง desktop และ mobile; ถ้า console/HMR ค้าง ให้เปิดแท็บใหม่
5. npm test, npm run build ต้องผ่านก่อน commit; commit แยกแต่ละหน้า; อัปเดต Handoff.md แล้ว push ทุกครั้ง
```
