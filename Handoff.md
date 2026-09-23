# 🔄 Project Hand-Off Summary
> Last updated: 2026-09-23 (ปรับปรุงข้อความสถานที่หน้า HeroSection และ Footer เป็น "มหาวิทยาลัยราชภัฏภูเก็ต" เอาคำว่า "ศูนย์" ออกตามความต้องการผู้ใช้; 54 tests ผ่าน, lint ผ่าน, build ผ่าน)

## 1. [Project Overview & Tech Stack]

**Sci Games 2026** — เว็บกีฬาสานสัมพันธ์ คณะวิทยาศาสตร์ฯ ม.ราชภัฏภูเก็ต (งานวันที่ 9–11 ต.ค. 2569 เหลือ ~19 วัน)
Repo: https://github.com/Esther03u/sci-games-2026 (branch `main`, clone อยู่ที่ `C:\SCI Game`)

- **Next.js 16.3.5** App Router, JavaScript (ไม่ใช่ TS), React 19, Vanilla CSS glassmorphism (แยกเป็น `src/styles/*.css`, ไม่ใช้ Tailwind — `clsx`/`tailwind-merge` ถอดออกแล้วใน P3-15)
- **Supabase** (PostgreSQL + Auth + Realtime) ผ่าน `@supabase/ssr` — anon key ฝั่ง client, service role ใน API routes
- Chart.js, jsPDF, JSZip, motion, lucide-react
- ไม่มี test เลย ไม่มี CI; `npm run build` ผ่าน (exit 0)
- ⚠️ Next 16 เปลี่ยน convention: `middleware.js` → `proxy.js` (build แจ้ง "ƒ Proxy (Middleware)"); ต้องอ่าน `node_modules/next/dist/docs/` ก่อนเขียนโค้ดตาม `AGENTS.md`

**3 โซน:** Public (`/`, `/schedule`, `/results`, `/news`, `/register`, `/check-status`) · Admin (`/admin/*` 9 หน้า, role `super_admin`) · Staff (`/staff/scoring`, role `staff`)

**เป้าหมายรอบนี้:** ทำระบบ 3 ส่วนให้สมบูรณ์ — (1) ผู้ชมดูสกอร์ Realtime (2) ผู้ลงคะแนนกด +1/−1 จากสนาม (3) Admin ดู/จัดการทุกอย่าง — โดย**ต่อยอดโค้ดเดิม** ไม่รื้อ

## 2. [Completed Milestones]

- ✅ **ปรับแก้สถานที่ใน HeroSection และ Footer (23 ก.ย.)** — เปลี่ยนข้อความจากเดิม "ณ ศูนย์กีฬามหาวิทยาลัยราชภัฏภูเก็ต" เป็น "ณ มหาวิทยาลัยราชภัฏภูเก็ต" (และใน Footer) ตัดคำว่า "ศูนย์" ออกตามความต้องการผู้ใช้
- ✅ **ระบบดูสูจิบัตร & กำหนดการ (`/handbook`) (23 ก.ย.)** — ปรับ `next.config.mjs` อนุญาต `X-Frame-Options: SAMEORIGIN` และ `Content-Disposition: inline` สำหรับ `/docs/*`; ปรับแต่งหน้า `/handbook` ให้กระชับ สวยงาม (เน้นการ์ดสูจิบัตร 20 หน้า และกำหนดการ 3 หน้าโดยตรง พร้อมปุ่มดาวน์โหลด/พรีวิว); หน้าต่าง `DocumentPreviewModal` แสดงผลไฟล์ PDF ทางการแบบเต็มพื้นที่ สะอาด เรียบหรู พร้อมปุ่มเปิดเต็มจอและดาวน์โหลด PDF ตรง
- ✅ **กันคะแนนสดระดับฐานข้อมูล (23 ก.ย., migration 007 + 008; ผู้ใช้อนุมัติ)** — เดิมซ่อนแค่ UI: `score_a/score_b` ของแมตช์ `live` ยังติดมากับ payload ของ `/results` และยิง Supabase ด้วย anon key อ่านได้ (พิสูจน์แล้วเห็น 77-33)
  - **007** `matches_public` view (NULL ให้ `score_a/score_b/sets_a/sets_b/current_set/last_score_at/last_scored_team` เมื่อ `status='live'`) + GRANT ให้ anon/authenticated — **ปลอดภัยกับเว็บที่รันอยู่**; **008** เปลี่ยน policy `public_read` → `staff_read` (`get_user_role() IS NOT NULL`) บน `matches`, `match_sets`, `score_events`
  - **ลำดับสำคัญ**: รัน 007 → deploy โค้ด → รัน 008 (ถ้าสลับลำดับ หน้าสาธารณะจะว่างหรือ view ไม่มี) — ทำครบทั้ง 3 ขั้นแล้ว
  - โค้ด: `/`, `/schedule`, `/results` (server+client) อ่าน view ผ่าน `getPublicMatches` / `loadLiveData({ publicView })` / `useLiveScores({ publicView })`; `/staff/scoring` อ่านด้วย **service role** หลัง `requireScorer()` (กรรมการ PIN เป็น anon ในสายตา Supabase); `/live` ต้องเป็นบัญชี staff/admin — PIN ถูกส่งไป `/staff/scoring`
  - ยืนยันบน production: anon อ่าน `matches`/`match_sets`/`score_events` ไม่ได้ (0 แถว), `matches_public` คืน `score_a=null` ตอน live, payload ของ `/results` ไม่มีคะแนน; **กรรมการ PIN เปิด `/staff/scoring` เห็นแมตช์+คะแนนปกติ**, แอดมินเห็น `/admin/live` และ `/live` ครบ; **smoke 52/52**, DB scenario 10/10, Vitest 54
  - ℹ️ ถ้า PostgREST ยังไม่เห็น view ใหม่ (`PGRST205`) ให้รัน `NOTIFY pgrst, 'reload schema';`
  - ⚠️ **บทเรียน**: `select(..., { head: true })` คืน 204 โดยไม่มี error แม้ relation ไม่มีอยู่ → ห้ามใช้เช็คว่ามีตาราง/view จริงไหม ให้ query จริง

- ⚠️ **ข้อจำกัด deploy (23 ก.ย.)** — Vercel โปรเจกต์อยู่บน **Hobby plan + repo private** → commit ที่ author เป็น `chokun555phaerngam` **ถูกบล็อก ไม่ trigger deploy** ("commit author did not have contributing access") และปุ่ม Redeploy ในแดชบอร์ดก็ใช้ไม่ได้ถ้าไม่ใช่เจ้าของบัญชี (`akarinnoochoo2005`) — **วิธีที่ใช้อยู่: ให้เพื่อน (Esther03u) push ตามหลัง** commit เปล่าก็ได้ (`git commit --allow-empty -m "chore: trigger deploy" && git push`) แล้วงานทั้งหมดจะขึ้นพร้อมกัน; ทางแก้ถาวร: เปลี่ยน repo เป็น public (ไม่มี secret ใน git) / ส่งงานเป็น branch ให้เพื่อน merge / อัป Pro

- ✅ **ระบบศูนย์ดาวน์โหลดสูจิบัตรและกำหนดการ (`/handbook`) เสร็จสมบูรณ์ (23 ก.ย.)** — วางไฟล์ทางการ `public/docs/sci-games-2026-handbook.pdf` (20 หน้า) และ `public/docs/sci-games-2026-schedule.pdf` (3 หน้า) จากไฟล์ต้นฉบับจริงในเครื่อง; `src/data/documents.js`; สร้างหน้า `/handbook` พร้อมการ์ด Glassmorphism, ข้อมูลสำคัญ 5 ชนิดกีฬา, `DocumentPreviewModal` รองรับพรีวิว PDF, ปุ่มดาวน์โหลดตรง, ปุ่มเปิดแท็บใหม่; เพิ่มเมนูใน Navbar, QuickLinks หน้าแรก และ Footer; vitest เพิ่ม `tests/documents.test.js` รวม 54 tests ผ่าน 100%, `npm run build` ผ่าน, ตรวจสอบผ่าน browser preview เรียบร้อย
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
| **ผู้ชมไม่เห็นคะแนนสด (ตัดสินใจ 22 ก.ย.)** | ผู้ชมดูที่ `/results` — แมตช์ที่กำลังแข่งขึ้นสถานะ "กำลังแข่ง" **โดยไม่แสดงคะแนน** จนกว่าจะจบ; ลิงก์ "ผลสด" ถูกถอดจาก Navbar/Bottom nav/หน้าแรกแล้ว (route `/live` **ต้องล็อกอิน** admin/staff/PIN ผ่าน `requireViewer()` — ใช้เป็นจอกรรมการ/จอสนาม; anon ถูกส่งไป `/staff/login?next=/live`) — **อย่าเพิ่มคะแนนสดกลับเข้าหน้าบ้าน** |
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

- ✅ **Phase 4 เสร็จ (21 ก.ย.)** — Admin; ทุกหน้าทดสอบกับ Supabase จริงใน browser (login admin จริง):
  - ธีมโซน admin แก้แล้ว (เนื้อหาใช้ `var(--mono-*)`; sidebar/header มือถือคง dark โดยตั้งใจ)
  - `src/lib/admin-api.js` `adminApi(path, {method, body})` — fetch wrapper โยน Error ข้อความไทย
  - `useLiveScores()` เพิ่ม `lastEvents[matchId]` (score_events ล่าสุดต่อแมตช์ จาก initial 300 แถว + realtime INSERT); `loadLiveData()` คืน `events` ด้วย; `Bracket` แยกเป็น `src/components/public/live/Bracket.js`
  - `/admin/live` `LiveMonitor` — แถวต่อแมตช์ (เรียง live → upcoming → finished ≤1 ชม.), ผู้ลงคะแนนล่าสุด + event + เวลา, เตือน "ไม่มีคะแนนมา 10 นาที+", ปุ่ม เริ่ม/จบแมตช์/เปิดใหม่/แก้คะแนน (modal → `POST /api/match/[id]/override`), แถว flash เขียวเมื่อมี bump
  - `/admin/audit` `AuditLog` — แท็บ "คะแนนจากสนาม" (score_events 500 ล่าสุด, filter กีฬา/แมตช์/ผู้กด, ปุ่ม ↶ ย้อน → `POST /api/score/undo {event_id}`, timeline 0–0 → 1–0 … เมื่อเลือกแมตช์) และ "การแก้ไขข้อมูล" (audit_logs + diff เฉพาะฟิลด์ที่เปลี่ยน)
  - `/admin/pins` `PinManager` — สร้าง (กีฬา/ชื่อ/หมดอายุ) → modal แสดง PIN ครั้งเดียว + **QR** (`qrcode` lib) ไป `/staff/login?sport=<id>` + ปุ่มคัดลอก; ตาราง เปิด/ปิด/ลบ, ใช้ล่าสุด
  - `/admin/bracket` `BracketBuilder` — เลือกกีฬา (เฉพาะที่ยังไม่มี bracket) + seed 4 สี + วัน/เวลา/สนาม → `POST /api/admin/bracket` → reload; แสดง bracket ทุกกีฬาที่มี
  - `/admin/settings` `SettingsForm` — `score_edit_window_minutes`, `live_scoring_enabled` (สวิตช์นี้ยังไม่มีผลกับ API — เขียนบอกไว้ในหน้าแล้ว)
  - `AdminSidebar` เพิ่มลิงก์ 5 หน้าใหม่ (Live Monitor มีจุดแดง)
  - deps ใหม่: `qrcode`

- ✅ **หน้าตารางแข่ง `/schedule` แยกตามกีฬา (21 ก.ย.)** — ผู้ใช้ทักว่าการ์ดโชว์ "กีฬา / ทีม A / ทีม B" และไม่แยกหมวด:
  - บั๊ก: หน้าใช้ `sports` จริงจาก DB (uuid) แต่ fallback แมตช์เป็น `OFFICIAL_MATCHES` (`sport_id: 'sport-futsal'`) → หา sport ไม่เจอ → แก้ให้ fallback **ทั้งชุด** (`useHandbook = matches.length === 0`) ใน `ScheduleGrid.js`, `schedule/page.js`, `(public)/page.js`
  - เพิ่ม `viewMode` ใน `ScheduleGrid`: **"ตามกีฬา"** (default: กีฬา → วัน → การ์ด, หัวข้อมีไอคอน/สนาม/จำนวน) และ "ตามเวลา" (แบบเดิม วัน → รอบเวลา); ตัวสลับอยู่ในแถบสรุปตัวกรอง
  - หมายเหตุ: ข้อมูลที่เห็นตอนนี้ยังเป็นสูจิบัตร 44 แมตช์ จนกว่าจะใส่แมตช์จริงลง DB (Phase 5 ข้อ 4)

- ✅ **หน้าลงคะแนน (step 2) ออกแบบใหม่ (21 ก.ย.)** — ผู้ใช้ขอให้สวยขึ้น ตรวจในมือถือ 375px แล้ว:
  - หัวการ์ด: `SportIcon` + ชื่อกีฬา/รอบ + สนาม/เวลา + ป้ายแดงแสดง**เวลาที่แข่งไป** (`started_at`) แทน LIVE
  - Scoreboard การ์ดเดียว: สองฝั่งไล่สี `team.color_hex`, ป้ายทีมมี `TeamIcon`, เส้นคั่น + "VS" (ทุก cell ต้องใส่ `gridRow: 1` ไม่งั้น VS ตกแถวใหม่), ตัวเลข 5rem เด้งด้วย `.live-score.is-bump` (key = score)
  - ปุ่ม `.score-btn` (globals.css) สีทีม gradient + เงาเรือง, `:active` ยุบ; `−1`/`+2`/`+3` เป็น `.score-btn-ghost`
  - `.score-actions` แถบล่าง `position: fixed` บนมือถือ (sticky card บน ≥640px) มี ยกเลิกล่าสุด / จบเซต / จบการแข่งขัน + จุดสถานะซิงค์; container มี `paddingBottom: 7.5rem` กันบัง
  - กีฬาเซต: แถบบน "เซตที่ N · sets" และ "เซตที่ผ่านมา: 25–20 | …" ด้านล่าง (อ่านจาก `match.match_sets` ถ้ามี — ตอนนี้ scoring page ไม่ได้ส่ง sets มา จึงแสดงเฉพาะหลัง re-sync จาก `GET /api/match/[id]`; ปรับ `loadMatches` ให้ `select('*, match_sets(*)')` ได้ถ้าต้องการ)

- ✅ **Refactor P1-1 Tooling (21 ก.ย.)** — `.gitattributes` (`* text=auto eol=lf`, renormalize = ไม่มีไฟล์เปลี่ยน), `.editorconfig`, `.prettierrc` + `.prettierignore` (ยัง**ไม่ได้** format ทั้ง repo — 104 ไฟล์จะเปลี่ยน ให้ทำเป็น commit เดี่ยวหลังนัดเพื่อน), scripts `format`/`format:check`, `lint` ครอบ `scripts tests`; ESLint **0 error** แล้ว: ปิด React-Compiler rules เฉพาะ `src/components/animate-ui/**` (โค้ด vendored) + แก้ `results/page.js` ให้ setState จาก `.then` ไม่ใช่ใน effect body; ติดตั้ง devDep `prettier`
  - แก้ความเข้าใจในแผน refactor: ไอคอน `animate-ui/icons/*.jsx` **ถูกใช้ผ่าน `icons/index.js`** (re-export) ไม่ใช่ไม่มีคนใช้ → P3 ข้อ 15 ต้องเช็คว่า export ตัวไหนไม่ถูก import จริงแล้วค่อยลบ

- ✅ **Refactor P1-2 ลบโค้ดตาย (21 ก.ย.)** — ลบ `AthletesClientView.js`, หน้า `/athletes` และ `/standings` (เป็นแค่ redirect; ลิงก์ใน admin dashboard → `/live`, README ปรับ), `BackgroundWaves.jsx` + `GradientWaves.jsx/.css` (WebGL ไม่ถูกใช้) + **ถอด dep `ogl`**, `useToast.js` + `Toast.js` + CSS `.toast*` (~50 บรรทัด); `AnalyticsCharts` default labels ใช้ `/live`

- ✅ **Refactor P1-3 `lib/format.js` + `lib/labels.js` (21 ก.ย.)** — `format.js`: `EVENT_DAYS` (วันงาน 3 วัน + ป้ายสั้น/ยาว/sub), `EVENT_START_DATE/END_DATE`, `fmtEventDay(Long)`, `fmtTime(Th)`, `formatDate/DateTime`, `fmtShortDateTime(Sec)`, `fmtClock`, `fmtRemaining`, `relativeTime` (null เมื่อ now=0); `labels.js`: `MATCH_STATUS`, `ROUND_LABEL`/`roundLabel`, `EVENT_LABEL`, `ACTOR_TYPE_LABEL`, `ACTION_LABEL`, `REGISTRATION_STATUS`, `SPORT_TYPE_LABEL`, `EVENT_INFO`; `lib/utils.js` และ `constants/index.js` เหลือเป็น re-export (ลบ `TEAM_COLORS`/`SPORTS_LIST` ที่ไม่ตรง DB); `useLiveScores` re-export จาก lib; เปลี่ยน caller 14 ไฟล์ (รวม `ScheduleGrid`, `MatchCard` ของเพื่อนแค่ตารางวันที่) — `'2026-10-09'` hardcode หมดไปจากโค้ด (เหลือใน `tournamentData`); tests เพิ่ม `tests/format.test.js` → **17 tests**

- ✅ **Refactor P1-4 `ui/Banner` + `ui/ConfirmDialog` (21 ก.ย.)** — `Banner` (`kind: error|warn|info|success`, render nothing เมื่อว่าง, `onClose` optional) แทน banner JSX ใน ScoreInput/staff login/admin login/LiveMonitor/AuditLog/PinManager/BracketBuilder/SettingsForm; `useConfirm()` → `[confirm, dialogEl]` (`await confirm({title,message,confirmLabel,danger})`) แทน `window.confirm` 4 จุด; admin manager เก่า 7 ตัว: `alert()` 22 จุด → state `pageError` + `<Banner kind="error">` บนสุดของหน้า; `(admin)/layout.js` หมดเวลา session → redirect `/admin/login?reason=timeout` แล้วหน้า login แสดง Banner (ไม่มี `alert`/`window.confirm` เหลือใน src)

- ✅ **Refactor P1-5 `ui/AdminTable` (21 ก.ย.)** — `AdminTable` (`columns`, `minWidth`) + `Td`, `TR`, `EmptyRow`, `TH/TD` styles; `AuditLog` (2 ตาราง) และ `PinManager` ใช้แล้ว ลบ `th/td` ซ้ำ; `DataTable.js` (column-config/sortable ใช้ใน AthleteManager) คงไว้เป็นอีกแบบ

- ✅ **Refactor P1-6 `lib/api/client.js` (21 ก.ย.)** — `apiRequest(path, {method, body, signal})` คืน `data`, โยน `ApiError` (`message` ไทย, `code`, `status`) หรือ `NetworkError`; แทน `lib/admin-api.js` (ลบแล้ว), `ScoreInput.api()`+`NetworkError` ส่วนตัว, และ `fetch` ดิบใน `UserManager`; ผู้ใช้: admin 6 ตัว + ScoreInput + UserManager; tests `tests/apiClient.test.js` → **21 tests**; ยังเหลือ `fetch` ดิบที่ `RegistrationForm`, `check-status`, `PageTracker`, staff login (public — ไม่รีบ)

- ✅ **Refactor P1-7 scripts (21 ก.ย.)** — `scripts/lib/env.mjs` (`loadEnv`, `adminClient`, `anonClient`, `projectRef`, `hasFlag`) ใช้ใน check-supabase / create-admin / smoke-test (smoke รับ BASE URL จาก argv ที่ขึ้นต้น http); **`scripts/seed-matches.mjs`** (`npm run seed:matches [--dry|--replace]`) นำเข้าตารางแข่ง 44 คู่จาก `tournamentData.js` เป็น `upcoming` (map กีฬา/ทีมด้วยชื่อ, ไม่เอาผลตัวอย่าง) — dry run ผ่าน; **migration `004_match_meta.sql`** เพิ่ม `matches.category`, `matches.match_number` (+index) ทดสอบผ่าน local; `apply-all.sql` regenerate แล้ว (1,416 บรรทัด)
  - **P1 ครบ 7 ข้อ** — ต้องรัน 004 บน Supabase จริงก่อน `npm run seed:matches` (ใช้ `apply-all.sql` วางซ้ำได้)

- ✅ **Dark Theme เสร็จสมบูรณ์ (21 ก.ย.)** — ตามแผน `docs/plans/2026-09-21-dark-theme.md`:
  - **ระบบโทเค็นและ Theme Engine**: Semantic tokens (`--bg`, `--surface`, `--surface-2`, `--text`, `--border`, `--accent-text`, ฯลฯ) ใน `src/app/globals.css`, Dark palette (`zinc-950` `#0b0b0e`), `prefers-color-scheme` media query, no-flash inline script ใน `src/app/layout.js`, hook `src/hooks/useTheme.js` (light/dark/system sync กับ localStorage + system), สวิตช์ `src/components/ui/ThemeToggle.js` (3-segment และ compact toggle) ติดตั้งบน Navbar (desktop + mobile drawer + mobile header), AdminSidebar, และ Staff header
  - **Codemod & UI Review**: รัน `scripts/codemod-theme.mjs` ปรับสีฮาร์ดโค้ด 42 ไฟล์ (351 จุด); ปรับแต่ง MatchDetailModal, MatchCard, ScheduleGrid, StandingsPodium, results/page.js, RegistrationForm, AnalyticsCharts (Chart.js dynamic options)
  - **Contrast Verification**: สร้าง `scripts/check-contrast.mjs` (`npm run check:contrast`) ตรวจสอบ WCAG 2.1 contrast ratio ครบทุกคู่สีทั้ง Light และ Dark mode (ผ่าน 18/18 checks, normal text ≥ 4.5:1, large/icons ≥ 3.0:1)
  - **Build & Tests**: `npm test` ผ่าน 21/21 tests, `npm run build` ผ่าน exit 0 (Next 16 Turbopack)

- ✅ **Refactor P2-8 แตก `ScoreInput.js` (21 ก.ย.)** — 695 บรรทัด → `staff/ScoreInput/{index (178, state+actions), MatchPicker (135), ScorePad (336), ConfirmFinish (134), scoring.js (57 pure: editDeadline/groupMatches/projectedSets/projectedWinner/winnerText)}` + `hooks/useScoreQueue.js` (optimistic queue/retry/online/beforeunload; export `applyOptimistic`, `mergeServerRow`) + `hooks/useMatchSync.js` (realtime list/selected merge + `useWakeLock`, export `hasScoreChange`); `tests/scoring.test.js` → **28 tests**; ทดสอบ flow จริง PIN → start → +1 ×4 → จบเซต ในเบราว์เซอร์ (dark mode ของเพื่อน)
  - **บั๊กแก้:** `(staff)/layout.js` guard race — effect refresh กับ effect redirect รันใน commit เดียวกัน เห็น `actor=null` เก่าแล้วเด้งกลับ login → ตอนนี้ redirect เฉพาะเมื่อ `verifiedPath === pathname` (refresh สำหรับ path นั้นเสร็จแล้ว)
  - **ธีม:** codemod ของเพื่อนแทน hex แต่ไม่แทน `var(--mono-*)` (182 จุด ไม่ flip ในโหมดมืด → ตัวหนังสือหาย) → map แล้วทั้ง src: mono-900/950→`--text`, 800/700→`--text-2`, 600/500→`--text-3`, 400→`--text-muted`, 300→`--border`, 200/100→`--surface-2` (31 ไฟล์) — **กฎ: ห้ามใช้ `--mono-*` ในโค้ด component อีก ใช้ semantic token เท่านั้น**
  - `constants/index.js`: ลบ `TEAM_COLORS`/`SPORTS_LIST` ที่กลับมาจาก merge ของเพื่อน (ไม่มีใครใช้, ข้อมูลไม่ตรง DB)

- ✅ **Refactor P2-9 แยก `globals.css` (21 ก.ย.)** — 2,188 บรรทัด → `src/styles/{tokens (241), base (109), components (740), responsive (60), public (896 — ส่วนของเพื่อน: app shell/bottom nav/podium), match-card (37), live (57), scoring (45)}.css`; `globals.css` เหลือ 16 บรรทัดเป็น entry `@import` ตามลำดับ cascade เดิม; bundle CSS ที่ build ออกมามีทุก section (ตรวจ class ครบ) และหน้า `/live` แสดงถูกต้องในโหมดมืด — **กฎ: แก้ไฟล์ที่เป็นเจ้าของ section ห้ามเพิ่ม rule ใน globals.css**

- ✅ **Refactor P2-10 `lib/queries/` (21 ก.ย.)** — `queries/core.js` (`getSports/getTeams/getMatches/getBracketMatches/getSets/getRecentEvents/getAnnouncements/getStandings`, `rows()`), `queries/page.js` **`loadPage(name, loader, fallback)`** (สร้าง server client + try/catch + log ที่เดียว), `queries/live.js` (`loadLiveData`, `EMPTY_LIVE` — ย้ายจาก `lib/live-data.js` ที่ลบแล้ว), `queries/staff.js` (`getEditWindowMinutes`, `loadScoringPage`), `queries/admin.js` (`loadAuditPage/loadBracketPage/loadMatchesPage/loadDashboard/loadSportsOnly`); page ทั้ง 18 ไฟล์ใช้ `loadPage` แล้ว (−222 บรรทัดสุทธิ, ไม่มี `createServerSupabaseClient()` ใน page ยกเว้น `generateMetadata` ของ `/live/[sportId]`); dev server ไม่มี error หลังโหลด `/`, `/news`, `/admin`

- ✅ **Refactor P2-11 admin เขียนผ่าน API เท่านั้น (21 ก.ย.)** — route ใหม่ **`/api/admin/[resource]`** (POST / PATCH `{id,…}` / DELETE `?id=`; service role + `createAuditLog` `insert_/update_/delete_<table>`; 23505→409, 23503→409) ใช้ whitelist ใน **`src/lib/api/adminResources.js`** (`RESOURCES`: matches, announcements, departments, sport_schedules, athletes (delete), registrations (update status → set `cancelled_at/by`); `pickColumns()` ตรวจชนิด/required/validate) — **ห้ามเขียนตารางนอก whitelist**; `MatchEditor` แก้คะแนน/สถานะผ่าน `/api/match/[id]/{start,override,finish}` (ได้ `score_event`) และ PATCH เฉพาะ upcoming⇄postponed; `NewsEditor/AthleteManager/DepartmentMapper/SportScheduleManager` เรียก `apiRequest` แล้ว — **ไม่มี `createClient()` ที่ insert/update/delete ใน `src/` อีก**; **migration `005_admin_via_api_only.sql`** ลบ policy `admin_write` ทุกตาราง + `admin_all` บน `app_settings` (เหลือ `admin_read` SELECT) → client (anon/authenticated) อ่านได้อย่างเดียว; เทส DB เพิ่ม assert "มีแต่ SELECT policy" ผ่าน; smoke test เพิ่มหมวด `[admin crud]` (9 checks) ผ่านกับ Supabase จริงรวม 42 checks; `apply-all.sql` regenerate แล้ว (รวม 005)
  - ⚠️ **004 และ 005 ยังไม่ได้รันบน Supabase จริง** — วาง `supabase/apply-all.sql` ใน SQL Editor (idempotent วางซ้ำได้) ก่อน deploy / ก่อน `npm run seed:matches`; ระหว่างนี้ dashboard ยังทำงานได้เพราะเขียนผ่าน service role อยู่แล้ว

- ✅ **Refactor P2-12 `lib/team-style.js` (21 ก.ย.)** — `getTeamStyle(team)` (table-driven `PALETTES` แดง/ฟ้า/เขียว/ม่วง จับด้วย hex, id, ชื่อไทย + fallback สี team/ทอง) ย้ายออกจาก `MatchCard.js` และ `MatchDetailModal.js` ที่เคยมีสำเนาเหมือนกัน 100% (−104 บรรทัด); `tests/team-style.test.js` 3 tests — **commit เดี่ยวแตะไฟล์เพื่อน 2 ไฟล์ (ui/MatchCard, ui/MatchDetailModal) แค่ลบฟังก์ชัน+เพิ่ม import** เพื่อนควร pull ก่อนแก้สองไฟล์นี้

- ✅ **Refactor P2-13 `/results` → ระบบ `/live` (21 ก.ย., `e9cbe45`; ผู้ใช้อนุมัติ)** — `results/page.js` 698 บรรทัด (client fetch 3 ตาราง + `useRealtime('matches')`) → server page 17 บรรทัด `loadPage('/results', loadLiveData)` + **`components/public/results/`**: `filters.js` (pure: `isSport/sportOf` (คง substring match สำหรับ id สูจิบัตร), `sortChrono`, `filterMatches`, `groupByStatus`, `nextUpcoming`, `statusCounts` — `tests/results-filters.test.js` 6 tests), `ResultsFilters.js` (แถบสถานะ + dropdown กีฬา/ประเภท สไตล์เดิมของเพื่อนทั้งหมด), `ResultsBoard.js` (`useLiveScores(initial)` + `ConnectionNote` จาก LiveBoard; การ์ดไฮไลต์ใช้ `bumps[id]` แทน timer เอง); พฤติกรรมเดิมครบ (ตัวกรอง, ลำดับ, คู่ถัดไปต่อกีฬา, fallback สูจิบัตรเมื่อ DB ว่าง) + ได้ SSR initial, realtime `match_sets`, polling fallback; −190 บรรทัด; **Vitest 48**; `useRealtime.js` ยังอยู่เพราะ `useMatchSync` ใช้ — ข้อเสนอเดิมที่คุยไว้: (1) `/results` เปลี่ยนจาก client fetch ทั้ง 3 ตาราง + `useRealtime('matches')` เป็นรับ `initial` จาก `loadPage('/results', loadLiveData, EMPTY_LIVE)` แล้วใช้ `useLiveScores(initial)` เหมือน `/live` (ได้ realtime ของ `match_sets` + ↑ indicator ฟรี, ไม่ต้อง fetch ซ้ำตอน mount) (2) ตัวกรอง กีฬา/สถานะ/ประเภท + การจัดกลุ่ม live/finished/upcoming เก็บไว้ที่ `/results` — ส่วนการ์ดใช้ `MatchCard` เดิม (3) ตัด `OFFICIAL_*` fallback ออกหลัง seed แมตช์จริง (P2-14 ข้อหลัง) — คาดลดได้ ~400 บรรทัด; ถ้าเพื่อนอยากคงหน้าเดิมทั้งหมดก็ปิดข้อนี้ได้เลย

- ✅ **Prettier ทั้ง repo (22 ก.ย., `b296ad1` + `1b10cf8`; ผู้ใช้อนุมัติ)** — `npm run format` 115 ไฟล์ (+3,471/−1,203 บรรทัด) **commit เดียว format ล้วน ไม่มีโค้ดเปลี่ยน** — build/lint/48 tests เหมือนเดิม; เพิ่ม `.git-blame-ignore-revs` (hash `b296ad1`) และตั้ง `git config blame.ignoreRevsFile .git-blame-ignore-revs` ในเครื่องนี้แล้ว (**เพื่อนต้องรันคำสั่งนี้เองครั้งเดียว** ไม่งั้น blame จะชี้ commit format); `npm run format:check` ผ่านทั้ง repo — **ต่อจากนี้ทุก commit ควรผ่าน `format:check`** (ยังไม่มี pre-commit hook/CI); **เพื่อนต้อง `git pull --rebase` ก่อนแก้โค้ดต่อ** ไม่งั้นจะ conflict เกือบทุกไฟล์

- ✅ **ซ้อมระบบจริงบน production + Free tier tuning (22 ก.ย.)** — **ผู้ใช้ตัดสินใจ: อยู่ Supabase Free tier ไม่อัป Pro**
  - ซ้อมเต็มวงจรกับ production (สคริปต์ชั่วคราวใน scratchpad ไม่ commit): สร้างแมตช์ชั่วคราว → `/results` เห็นเป็น upcoming → **start + ยิงคะแนน 2-1** → `/results` ขึ้น "กำลังแข่ง" **ไม่มีคะแนน** → `/live` anon ถูกกัน / admin เข้าได้เห็นบอร์ด → **finish** → `/results` โชว์สกอร์ → ลบข้อมูลทดสอบ เหลือ 44 แมตช์ — **ผ่านทุกข้อ**
  - **Realtime**: free tier จำกัด **200 connections พร้อมกัน** และ `/results` (หน้าที่คนทั้งคณะเปิด) ไม่ได้โชว์คะแนนสดอยู่แล้ว → `useLiveScores(initial, { realtime: false, pollMs })` ใหม่: `/results` **ไม่เปิด channel** รีเฟรชทุก 30 วิแทน (ยืนยันในเบราว์เซอร์ว่าไม่มี websocket); `/live` + `/admin/live` (คนไม่กี่คน) ยังใช้ Realtime; `ConnectionNote` เงียบเมื่อ status = `POLLING`
  - แก้ **flaky test** ที่บันทึกไว้เมื่อวาน: `tests/pinSession.test.js` ปลอมลายเซ็นด้วยการแทน 2 ตัวท้ายเป็น `'xx'` ซึ่งไม่เปลี่ยนอะไรถ้าลายเซ็นลงท้าย `xx` อยู่แล้ว (~1/4096) → เปลี่ยนเป็น flip ตัวท้าย รัน 5 รอบผ่าน
  - เพิ่ม **`docs/runbook-matchday.md`** — ใครเห็นอะไร, เตรียม PIN ก่อนงาน, ตารางอาการ/วิธีแก้หน้างาน, คำสั่งตรวจสุขภาพ, ข้อจำกัด free tier
  - ⚠️ **ยังค้าง (รอผู้ใช้ตัดสินใจ):** คะแนนสด**ซ่อนแค่ระดับ UI** — ค่า `score_a/score_b` ของแมตช์ `live` ยังติดอยู่ใน HTML/RSC payload ของ `/results` และอ่านตรงจาก Supabase ด้วย anon key ได้ (พิสูจน์แล้ว) ถ้าต้องการกันจริงต้องทำ migration 007 (view สาธารณะที่ null คะแนนของแมตช์ live + ตัด SELECT ตรงบน `matches` ของ anon) — ดูข้อเสนอใน §3
  - ⚠️ **Egress free tier 5 GB/เดือน**: ตอนนี้ `/results` ดึง matches+sports+teams+sets ทุก 30 วิ **ต่อผู้ชม 1 คน** (~30–60 KB/ครั้ง) → ผู้ชม 200 คน × 8 ชม. ≈ 10 GB เกินโควตา — ข้อเสนอ: endpoint สรุปเล็ก ๆ cache ที่ edge (s-maxage 15–30) ให้ทุกคนใช้ร่วมกัน = DB โดนยิงครั้งเดียวต่อ 30 วิ (ดู §3)

- ✅ **`/live` เฉพาะผู้ล็อกอิน (22 ก.ย.; ผู้ใช้อนุมัติ)** — `requireViewer(next)` ใน `lib/auth/resolveActor.js` (`resolveActor()` → ไม่มี actor → `redirect('/staff/login?next=…')`) ใช้ใน `/live` และ `/live/[sportId]`; หน้า login รับ `?next=` (เฉพาะ path same-site) หลังล็อกอิน account หรือ PIN; ชั้นแรกอยู่ใน **`proxy.js`** (matcher เพิ่ม `/live`, `/live/:path*` → ไม่มี session/PIN cookie = **307** ไป `/staff/login?next=…`) ชั้นสองคือ `requireViewer()` ในหน้า (ตรวจ PIN จริง; ถ้าหลุดชั้นแรกจะได้ 200 + meta refresh เพราะ `(public)/loading.js`) — smoke ตรวจทั้งสองแบบ + `/results` แทน `/live` ในหมวด public pages → **47 checks**; Realtime check เคย timeout 2 ครั้ง (listener ต่อหลัง SUBSCRIBED นิดหน่อย) → smoke รอ 1 วิ + retry ที่ 6 วิ + cap 15 วิ แล้วผ่าน 3/3; ℹ️ Vitest เคยล้ม 1 test ครั้งเดียวตอนรันต่อจาก `npm run build` ทันที (ไม่ได้จับชื่อ test) รันซ้ำ 4 รอบผ่าน 51/51 — ถ้าเจออีกให้จับ output ไว้

- ✅ **Phase 5 ข้อ 4 Deploy Vercel (22 ก.ย.)** — ผู้ใช้ deploy เองที่ **https://sci-games-2026.vercel.app** (env 4 ตัวตั้งแล้ว); ตรวจแล้ว: ทุกหน้า public/staff/admin login ตอบ 200, `/schedule` render 44 การ์ดจาก DB จริง, ISR ทำงาน (`X-Nextjs-Prerender: 1`, `X-Vercel-Cache: HIT`), `/api/register` validate ได้, **`node scripts/smoke-test.mjs https://sci-games-2026.vercel.app` ผ่าน 46/46** (auth, PIN login, permissions, ลงคะแนน points/sets, standings, Realtime ถึง anon subscriber, admin CRUD, public pages) และ cleanup แล้ว DB ยังมี 44 แมตช์ / 0 score_events; ตรวจ `.env.local` ในเครื่อง: anon key role=anon เขียนไม่ได้ (42501), service key role=service_role, `PIN_SESSION_SECRET` 64 ตัว ไม่ใช่ default; ℹ️ ใน DB มี PIN ชื่อ `test` (ฟุตซอล, สร้าง 22 ก.ย. 10:43) ที่ไม่ใช่ของ smoke — น่าจะมีคนลองสร้างจากแดชบอร์ด ปิดได้ก่อนงานจริง

- ✅ **Phase 5 ข้อ 1–3 (22 ก.ย.)** — (1) ผู้ใช้วาง `apply-all.sql` ใน SQL Editor แล้ว → ตรวจด้วย probe: `matches.category` มี, `register_athlete` เรียกได้ → **Supabase จริงมี migration 001–006 ครบ**; (2) `npm run seed:matches -- --replace` นำเข้า **44 แมตช์จริง** (ฟุตซอล 8, วอลเลย์ 8, ตะกร้อ 8, บาส 8, เปตอง 12; 9–11 ต.ค.; ทุกแถวมี `category`/`match_number`) — พบบั๊ก `--replace` ลบแถว `round IS NULL` ไม่ได้ (`NOT IN` กับ NULL) แก้เป็น `.or('round.is.null,round.not.in.(…)')` และลบแมตช์ทดสอบเก่า 1 แถวด้วยมือ → DB = 44 พอดี; (3) **ตัด `OFFICIAL_*` fallback** ออกจาก `/`, `/schedule`, `ScheduleGrid`, `ResultsBoard` (P2-14 ครึ่งหลัง) — ตารางว่างจะเห็น empty state แทน sample; `results/filters.js` `isSport` เหลือ exact match; `data/handbook.js` คงไว้เป็นแหล่ง seed; ตรวจในเบราว์เซอร์: `/schedule` 44 การ์ด, `/results` คู่ถัดไป 5 กีฬา, `/` 4 การ์ด ไม่มี console error

- ✅ **UI Dark Mode Contrast & ปลดผลสดหน้าบ้าน (22 ก.ย.; ผู้ใช้อนุมัติ)**:
  - แก้ไขสีฮาร์ดโค้ดที่กลืนกับพื้นหลังใน Dark Mode เป็น Semantic Tokens: การ์ดข่าว `/news` (`var(--accent-surface)` และ `var(--surface)` แทน `#ffffff/#fefce8`), `HeroSection` (การ์ด `.hero-card-white`, ข้อความวันที่, และปุ่มแคปซูล), `StandingsPodium` (การ์ด `.podium-card`, ชื่อทีม, ชิปคะแนน, แถบผู้นำ), `Modal` (`var(--surface)`), `QuickLinks`, `Footer`, `ScheduleGrid` (ปุ่มแท็บวันที่ที่ active), `RegistrationForm` (กล่องแจ้งเตือน error); ผ่าน WCAG AA 18/18 checks
  - นำลิงก์และปุ่ม **"ผลสด"** ออกจากหน้าบ้านทั้งหมด: `HeroSection` (เปลี่ยนปุ่มหลักเป็น `/schedule`, ปุ่มรองเป็น `/results` และ `/news`), `Navbar` (ถอดเมนูผลสด เหลือ 4 เมนู), `MobileBottomNav` (ถอดแท็บผลสด เหลือ 4 แท็บ)
  - รีเซ็ตแมตช์ทดสอบใน DB (`25dbe1c1-...` ฟุตซอล) จาก `live` กลับเป็น `upcoming` พร้อมลบ event ทดสอบ ทำให้หน้า `/results` ไม่มีเซกชัน "กำลังแข่งขันสด (LIVE MATCHES) (1 แมตช์)" ตกค้างอีก
  - ซิงค์ไฟล์ `supabase/apply-all.sql` ในเครื่องให้ตรงกับ `Downloads/apply-all (2).sql` (1,550 บรรทัด รวม 001–006 ครบ)
  - ทดสอบ Vitest 51/51 tests ผ่าน, Next build ผ่าน exit 0

- ✅ **lint warning 4 จุด (22 ก.ย.; ผู้ใช้อนุมัติ)** — `useAuth`: `supabase = useMemo(() => createClient(), [])` แล้วใส่เป็น dependency จริงของ effect/`signIn`/`signOut` (×3); `PinManager`: `<img>` แสดง QR ที่เป็น data: URL → คง `<img>` + `eslint-disable-next-line @next/next/no-img-element` พร้อมเหตุผล → **`npm run lint` = 0 error / 0 warning**

- ✅ **README (22 ก.ย.; ผู้ใช้อนุมัติ)** — แก้ "6 ชนิดกีฬา" → 5 (seed และ `data/handbook.js` มี 5 ตรงกันอยู่แล้ว), setup ระบุลำดับ migration 001→seed→002…006 + one-liner สร้าง `apply-all.sql` + `seed:matches` + `create-admin`, เพิ่ม `PIN_SESSION_SECRET` ใน env ของ Vercel, ตารางคำสั่งทดสอบ; แก้ข้อความ fallback ใน `/news` ("6 รายการ" → 5)

- ✅ **แก้ race condition ตอนสมัคร (22 ก.ย.; ผู้ใช้อนุมัติ)** — **migration `006_register_athlete.sql`**: ฟังก์ชัน `register_athlete(student_id, full_name, department_id, phone, sport_ids[])` SECURITY DEFINER ทำใน transaction เดียว: ตรวจ dept/sports → `pg_advisory_xact_lock` ต่อ (team, sport) → นับโควตาใหม่ → insert athlete + registrations; RAISE `DUPLICATE_REGISTRATION` (unique_violation) / `QUOTA_FULL: <กีฬา> (n/max)` / `INVALID_DEPARTMENT` / `INVALID_SPORT` / `INVALID_SPORT_COUNT` (check_violation); REVOKE EXECUTE จาก anon/authenticated; `/api/register` เรียก RPC แล้ว map error ด้วย **`lib/api/register.js`** `mapRegisterError()` (`tests/register.test.js` 3 tests); `lib/validation.js` เหลือเช็ค format/dept/sport/ตารางชน (ตัดเช็ค duplicate + quota ที่ racy ออก); DB scenario 9 ครอบ happy path/ซ้ำ/input ผิด/เต็มโควตา 14 แล้วคนที่ 15 ถูกปฏิเสธโดยไม่ทิ้งแถว/ยกเลิกแล้วสมัครใหม่ได้/anon เรียกไม่ได้ — `run-local.sh` ผ่าน 9/9; `apply-all.sql` regenerate แล้ว (รวม 006, 1,550 บรรทัด)
  - ⚠️ **ต้องรัน 006 บน Supabase จริงก่อน deploy** (วาง `supabase/apply-all.sql` — ตอนนี้ค้าง 004+005+006) ไม่งั้น `/api/register` จะตอบ 500 (function ไม่มี)

- ✅ **Refactor P3-20 JSDoc types (22 ก.ย.)** — `src/lib/types.js` typedef ตาม migration: `Sport/Team/Match/MatchSet/ScoreEvent/Announcement/Department/Athlete/Registration/AdminUser/SportPin` + enum (`MatchStatus/ScoringType/TeamSlot/ScoreEventType/ActorType/UserRole/RegistrationStatus`) + app shape (`Actor`, `LiveData`, `SetsByMatch`, `Bumps`, `ApiResult<T>`); ใช้ผ่าน `/** @typedef {import('@/lib/types').Match} Match */`; annotate แล้ว: `loadLiveData/EMPTY_LIVE`, `useLiveScores` (+`matchesForSport`, `matchWinner`), `resolveActor/resolvePinActor`, `getTeamStyle`, `results/filters.js`; ตรวจด้วย `tsc --checkJs` (tsconfig ชั่วคราว) — typedef resolve ครบ ไม่มี type error นอกจาก `process` global — **ยังเป็น JS ล้วน ไม่ย้าย TS** — **Refactor P1–P3 ครบทุกข้อแล้ว** (ยกเว้น P2-14 ครึ่งหลัง: ตัด `OFFICIAL_*` fallback หลัง seed จริง)

- ✅ **แก้ lint error `useTheme.js` (22 ก.ย.; ผู้ใช้อนุมัติ)** — เขียน `src/hooks/useTheme.js` ใหม่ด้วย `useSyncExternalStore` (snapshot จาก localStorage + `matchMedia`, server snapshot `'system'/'light'/mounted=false`) แทน `setState` ใน effect; `setTheme` เขียน storage + `data-theme` แล้ว `emit()`; ฟัง `prefers-color-scheme` change และ `storage` event (เปลี่ยนธีมข้ามแท็บ) — API เดิม `{ theme, resolvedTheme, setTheme, mounted }` ไม่เปลี่ยน (`ThemeToggle`, `AnalyticsCharts/Charts` ใช้ต่อได้); ทดสอบในเบราว์เซอร์ สว่าง/มืด/ตามระบบ + คงค่าเมื่อเปลี่ยนหน้า ไม่มี hydration warning → **ESLint 0 error** (เหลือ 4 warning เดิม: `useAuth` exhaustive-deps 3, `PinManager` `<img>` 1)

- ✅ **Refactor P2-14 `data/handbook.js` (21 ก.ย.)** — `git mv src/lib/tournamentData.js → src/data/handbook.js` (export เดิม `OFFICIAL_TEAMS/OFFICIAL_SPORTS/OFFICIAL_MATCHES`); อัปเดต import ใน `/`, `/schedule`, `/results`, `ScheduleGrid`, `scripts/seed-matches.mjs` (+ ignore list ใน `codemod-theme.mjs`); `npm run seed:matches --dry` ยังอ่านได้ 44 คู่; **ยังไม่ตัด fallback** — ทำหลังรัน 004/005 บน Supabase จริงและ `npm run seed:matches` สำเร็จ (เหลือ empty state ใน `/`, `/schedule`, `/results`, `ScheduleGrid`)
  - **P2 จบแล้ว (8, 9, 10, 11, 12, 14 ✅ / 13 ⏸)**

- ✅ **Refactor P3-15 ไอคอน (21 ก.ย., `e9d0ea5`)** — ตรวจแล้วว่าไอคอน Animate UI registry 16 ตัว (search/clock/map-pin/check/bell/chart-line/activity/trash-2/plus/x/menu/timer/sparkles/send/users/user) **ไม่มี caller ส่ง `animate*` prop เลย** จึง render เป็น svg นิ่งอยู่แล้ว → แทนด้วย lucide ตรง ๆ ใน `animate-ui/icons/index.js` (`export const Search = LucideIcons.Search` — ทุก caller ส่ง `size` เอง; ไม่เพิ่ม hover animation เพื่อไม่เปลี่ยนพฤติกรรม); ลบ `icons/*.jsx` 17 ไฟล์ + `icon.jsx` + `primitives/animate/slot.jsx` + `hooks/use-is-in-view.jsx` + `lib/utils.js` (มีแค่ `cn()` ที่ animate-ui ใช้ และ `validate*` ที่ไม่มีใครเรียก) + deps `clsx`/`tailwind-merge` + override ESLint `animate-ui/**` (−2,300 บรรทัด); `animate-ui/` เหลือ `icons/index.js` ไฟล์เดียว (108 บรรทัด) — วัดด้วย `next build`: shared icons chunk **198 KB → 143 KB**, รวม client chunks −33 KB; `components.json` ยังชี้ `utils: @/lib/utils` (config ของ shadcn CLI — ถ้ามีคนรัน `npx shadcn add` มันจะสร้างไฟล์ใหม่เอง)

- ✅ **Refactor P3-16 dynamic import (21 ก.ย., `a8c168e`)** — `PdfGenerator` เปลี่ยนเป็น `import('@/lib/pdf')` / `import('jszip')` ใน handler ตอนกดดาวน์โหลด (chunk jspdf+jszip 450 KB หายจาก client-reference manifest ของ `/admin/pdf` → โหลดตอนคลิกครั้งแรก); `AnalyticsCharts.js` → `AnalyticsCharts/{index,Charts}.js` โดย `index` เป็น `next/dynamic(() => import('./Charts'), { ssr:false, loading })` (chart.js ไม่เข้า server bundle) — **GradientWaves/ogl ในแผนไม่มีอยู่ในโค้ดแล้ว** (เพื่อนลบไปก่อนหน้า)

- ✅ **Refactor P3-17 `/live` payload (21 ก.ย., `f7f1f52`)** — `loadLiveData(sb, { withEvents })` และ `useLiveScores(initial, { withEvents })` ข้าม query `score_events` 300 แถวเว้นแต่ขอ; มีแค่ `LiveMonitor` (admin) ที่อ่าน `lastEvents` จึงเป็นตัวเดียวที่ส่ง `withEvents: true` — `/live`, `/live/[sportId]` และ polling fallback ไม่แบก events อีก (realtime INSERT ยังขับ ↑ indicator ตามเดิม); **ไม่ได้** narrow คอลัมน์ `matches` ตามแผน เพราะ realtime ส่ง full row และ `MatchDetailModal` ของเพื่อนอ่าน field เพิ่ม (`period_scores`) — ประหยัดไม่กี่ KB ไม่คุ้มกับ row 2 รูปแบบ

- ✅ **Refactor P3-18 ISR หน้า public (21 ก.ย., `3735c2d`)** — `/news`, `/schedule` เปลี่ยนจาก `force-dynamic` เป็น **`export const revalidate = 30`** (build แสดง `○ /news 30s`, `○ /schedule 30s`); ต้องไม่แตะ `cookies()` จึงเพิ่ม **`lib/supabase/public.js`** `createPublicSupabaseClient()` (supabase-js anon, ไม่มี cookie) + **`loadPublicPage()`** ใน `lib/queries/page.js` (แชร์ try/catch กับ `loadPage`); `/api/admin/[resource]` เรียก `revalidatePath()` หลังเขียนสำเร็จตาม `spec.revalidate` ใน `adminResources.js` (`matches → ['/schedule']`, `announcements → ['/news']`) → แก้ในแดชบอร์ดเห็นทันที; `/`, `/live` ยัง `force-dynamic` — **หมายเหตุ:** ตอน `npm run build` หน้าเหล่านี้ prerender โดยยิง Supabase จริง (ถ้าล้มจะได้ fallback แล้ว regenerate ใน 30 วิ) — บน Vercel ต้องตั้ง env ให้ครบก่อน build

- ✅ **Refactor P3-19 tests (21 ก.ย., `46c9c9d` + commit ถัดมา)**: `tests/live-helpers.test.js` (`matchesForSport`, `matchWinner`, `latestByMatch`, `groupSets` — 2 ตัวหลัง export ใหม่จาก `useLiveScores`) + `tests/adminResources.test.js` (`pickColumns` required/validate/trim, update patch, `registrations.onUpdate`) → **Vitest 42 tests**; section 8 ใน `supabase/tests/scenario_live_scoring.sql` ทดสอบ migration 004 (คอลัมน์ `category`/`match_number` + index + รอดผ่าน `start_match`/`apply_score_event`) — `run-local.sh` ผ่านทั้ง 8 scenario; หมวด `[public pages]` ใน `scripts/smoke-test.mjs` (GET `/`, `/live`, `/schedule`, `/news` → 200) — smoke **46 checks** ผ่าน 3 รอบ (รอบแรกมี 1 check flaky ล้ม ไม่ใช่หมวดใหม่)

- ✅ **ปรับจัดระเบียบ Hero Section ลดความแน่นบนมือถือ (22 ก.ย.)** — ตามที่ผู้ใช้ทักว่าแน่นเกินไปบนจอมือถือ:
  - แก้ไขปุ่ม Action ก้อนใหญ่ 3 อันที่ซ้อนกันแนวดิ่งจนกินพื้นที่จอ: จัดเป็นปุ่มหลักเต็มความกว้าง "📅 ดูตารางการแข่งขัน" (Primary CTA) และปุ่มรอง 2 คอลัมน์คู่กันในแถวเดียวด้านล่าง "🏆 สรุปผลการแข่งขัน" + "📢 ข่าวประชาสัมพันธ์" ทำให้ประหยัดความสูงแนวดิ่งลงได้กว่า 80px
  - ตัดข้อความซ้ำซ้อนในคำบรรยาย (เดิมมี "มหาวิทยาลัยราชภัฏภูเก็ต" 2 บรรทัดติดกัน) ให้เหลือเนื้อหากระชับ พร้อมแสดงสถานที่คู่กับไอคอน `MapPin` สวยงาม
  - ลด padding ด้านบน/ล่าง และ margins ของ Badge/Title/Subtitle บนจอมือถือ ทำให้เนื้อหาโปร่ง โล่ง สบายตา และผู้ใช้สามารถมองเห็นการ์ด "⚡ การแข่งขันที่น่าสนใจ" ได้ทันทีตั้งแต่เปิดหน้าเว็บโดยไม่ต้องเลื่อนจอ
- ✅ **Clean UI — ถอดไอคอนออกให้คลีน มินิมอล ตามคำขอผู้ใช้ (22 ก.ย.)**:
  - ถอดไอคอนออกจาก **Hero Section** ทั้งหมด: Badge วันที่ ("9 – 11 ตุลาคม 2569"), ปุ่ม Primary ("ดูตารางการแข่งขัน"), ปุ่ม Secondary ("สรุปผลการแข่งขัน", "ข่าวประชาสัมพันธ์") และสถานที่ ให้เป็น Pure Typography ที่มินิมอล คลีน และดูพรีเมียม
  - ถอดกล่องไอคอนกีฬาขนาด 38x38px สีเหลืองออกจากหัวข้อชนิดกีฬาในหน้า `/schedule` (`ScheduleGrid.js`) เหลือเพียงชื่อกีฬาตัวหนาและสถานที่ชัดเจน โปร่งสบายตา
  - ถอดไอคอนหน้าชื่อกีฬาและประเภทใน Dropdown Filters ทั้งหน้า `/schedule` (`ScheduleGrid.js`) และ `/results` (`ResultsFilters.js`) เหลือเฉพาะข้อความตัวเลือกคลีน ๆ พร้อมลูกศรขวา
  - ตรวจสอบความถูกต้อง: `npm test` 51 tests ผ่าน, `npm run lint` ผ่าน (0 error), `npm run format:check` ผ่าน (Prettier), `npm run build` ผ่าน (exit 0)
- ✅ **แก้ไข Header Spacing ให้มีระยะห่างจาก Navbar สบายตา (22 ก.ย.)**:
  - แก้บั๊กความสูงของ `--mobile-header-height` ใน `tokens.css` จากเดิม hardcode 56px ให้ตรงกับความสูงจริงของ Navbar (4.25rem = 68px)
  - ปรับ padding-top ของ `.public-app-main` บนมือถือเป็น `calc(var(--mobile-header-height) + var(--safe-top) + 1.35rem) !important` เพื่อให้มีระยะห่างอย่างน้อย 22–28px ใต้ Navbar (จากเดิมที่ชนขอบห่างเพียง 4px)
  - เพิ่ม padding-top ให้กับ `.page-header` ใน `components.css` และ `public.css` พร้อมใส่คลาส `page-header` ในทุกหน้าย่อย (`/schedule`, `/results`, `/news`) ทำให้หัวข้อหน้าไม่ชิดติดขอบ Navbar ด้านบนอีกต่อไป
  - ปรับ desktop `paddingTop: '6rem'` ใน `(public)/layout.js` เพื่อให้โปร่งสบายตาทั้งบนมือถือและคอมพิวเตอร์
  - ผ่านทั้ง `npm test` (51 tests), `npm run lint` (0 error), `npm run format:check` (Prettier), และ `npm run build`
- ✅ **ตั้งค่าโหมดสว่างเป็นค่าเริ่มต้น (Light Mode Default) (22 ก.ย.; ผู้ใช้อนุมัติ)**:
  - กำหนดให้ค่าเริ่มต้น (Default / Normal theme) ของทั้งระบบเป็น Light Mode (โหมดสว่าง)
  - แก้ไข media query ใน `tokens.css` และ `base.css` จาก `:root:not([data-theme='light'])` เป็น `:root[data-theme='system']` ป้องกันไม่ให้เว็บเปลี่ยนเป็นโหมดมืดอัตโนมัติตาม OS โดยที่ผู้ใช้ไม่ได้เลือก 'ตามระบบ' หรือ 'มืด'
  - ปรับปรุง `src/app/layout.js`: ระบุ `data-theme="light"` บนแท็ก `<html>`, ปรับ `viewport.themeColor` เป็น `#fafafa`, และ `THEME_SCRIPT` สำหรับอ่าน theme จาก localStorage โดยมี fallback เป็น `light` ไร้ปัญหา FOUC
  - ปรับปรุง `src/hooks/useTheme.js`: ให้ `readTheme` คืนค่า `'light'` เมื่อยังไม่มีการตั้งค่า, `serverTheme` และ `serverResolved` เป็น `'light'`, บันทึกค่าลง storage และ attribute เสมอ
  - ปรับปรุง `ThemeToggle.js`: จัดลำดับตัวเลือกเป็น 'สว่าง' -> 'มืด' -> 'ตามระบบ' และ cycle จากสว่างเป็นตัวแรก
  - ผ่านการทดสอบ Vitest (51/51 tests), ESLint (0 error), Prettier check, และ Next.js build ผ่าน (exit 0)
- ✅ **เพิ่ม migration `007_matches_public_view.sql` (23 ก.ย.)**:
  - นำเข้าไฟล์จาก `Downloads/007_matches_public_view.sql` เข้า repo ที่ `supabase/migrations/007_matches_public_view.sql` และต่อท้ายใน `supabase/apply-all.sql`
  - Step 1: เพิ่มวิว `matches_public` ซ่อน `score_a/b`, `sets_a/b`, `current_set`, `last_score_at`, `last_scored_team` ให้เป็น `NULL` เมื่อ `status = 'live'` (เปิดสิทธิ์ SELECT ให้ anon, authenticated) โดยยังไม่แตะสิทธิ์ตารางเดิม เพื่อความปลอดภัยและไม่กระทบหน้าเว็บปัจจุบัน
  - เพิ่ม probe ตรวจสอบวิว `matches_public` ใน `scripts/check-supabase.mjs`

## 3. [Current Task & Blockers]

**สถานะ:** **Refactor P3 — 15–19 ✅ push แล้ว**; 20 (JSDoc `lib/types.js`) ยังไม่เริ่ม
- ผู้ใช้สั่งแล้ว (21 ก.ย.) ให้ทำต่อ **ทีละอย่างและหยุดรอคำสั่งทุกครั้ง**: ✅ P2-13; ✅ prettier ทั้ง repo; ✅ lint error `useTheme.js`; ✅ P3-20 — **คิวใหม่ที่ผู้ใช้อนุมัติ (22 ก.ย.) ทำทีละอย่าง หยุดรอทุกครั้ง:** ✅ race condition ตอนสมัคร (006) ✅ README ✅ `supabase/message.txt` (ไม่มีไฟล์แล้ว — ลบ rule ใน AGENTS.md และอ้างอิงใน Handoff) ✅ lint warning 4 จุด — **Phase 5:** ✅ (1) migration บน Supabase จริง ✅ (2) seed 44 แมตช์ ✅ (3) ตัด fallback ✅ (4) Deploy Vercel → https://sci-games-2026.vercel.app (smoke 46/46) ⬜ (5) ซ้อมระบบจริง/ตัดสินใจ Realtime tier + ค่า default — **รอคำสั่ง**
- ℹ️ **Migration 007 (007_matches_public_view.sql)**: เพิ่มเข้าโปรเจกต์แล้ว ผู้ใช้สามารถนำไปวางรันใน Supabase SQL Editor (Step 1) ได้ทันทีเพื่อสร้าง view `matches_public` (ซ่อนคะแนนตอน live) โดยไม่กระทบสิทธิ์เดิม ตรวจสอบได้ด้วย `npm run check:supabase`
- หลังจากนั้น: P3-20, ตัด `OFFICIAL_*` fallback หลัง seed จริง, Phase 5 deploy
- Dark Theme: เพื่อนทำเสร็จแล้ว (`89ba195`) ตามแผน `docs/plans/2026-09-21-dark-theme.md`

**Blockers / คำถามค้าง:**
- ✅ (แก้แล้ว) 002 อัปเดต `sports` ด้วย `WHERE name = ...` จึงใช้ได้ไม่ว่า seed รันแล้วหรือยัง
- ❓ ใช้ default ไปก่อนใน 002 (ยังไม่ยืนยันกับผู้ใช้): N = 10 นาที (`app_settings.score_edit_window_minutes`); วอลเลย์ 2 ใน 3 เซตละ 25, ตะกร้อ 2 ใน 3 เซตละ 21, เปตอง เซตเดียว 13; bracket = รองฯ 2 คู่ + ชิงที่ 3 + ชิง (`generate_bracket`); บาส +2/+3 ยังไม่ตัดสิน
- ℹ️ เทส DB ใช้ PostgreSQL 16 ในเครื่อง (port 5432, user postgres — ผู้ใช้รู้รหัส ไม่เก็บใน repo): `PGPASSWORD=<รหัส> bash supabase/tests/run-local.sh` จะสร้าง/ลบ database `sci_games_test` เอง
- ⚠️ Supabase Free tier จำกัด Realtime **200 connections** — แผนมี polling fallback แต่ควรพิจารณา Pro เฉพาะเดือนงาน
- ⚠️ ปัญหารอง: lint เหลือ 1 error เดิมใน `src/hooks/useTheme.js` (ของเพื่อน `react-hooks/set-state-in-effect` — `npm run build` ไม่รัน lint จึงผ่าน)

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
supabase/migrations/001_initial_schema.sql … 006, seed.sql
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

**API routes (Phase 1) — ทุกตัวตอบ `{success, data}` หรือ `{success:false, error_code, message}`; ฝั่ง client เรียกผ่าน `apiRequest()` จาก `src/lib/api/client.js` เท่านั้น**
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

**Scripts:** `npm run seed:matches [-- --dry|--replace]` (นำเข้าตารางแข่งจาก handbook) · `node scripts/create-admin.mjs <email> <pw>` (สร้าง/รีเซ็ต super_admin) · `npm run check:supabase` (สถานะ DB จริง) · `npm run test:smoke` (E2E กับ dev server, ลบข้อมูลทดสอบเอง) · `npm run test:db` (Postgres local) · `npm test` (Vitest) · สร้าง `supabase/apply-all.sql` ใหม่: `{ for f in supabase/migrations/001_initial_schema.sql supabase/seed.sql supabase/migrations/002_live_scoring.sql supabase/migrations/003_staff_via_api_only.sql; do printf '
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
อ่านก่อนตามลำดับ: Handoff.md → docs/plans/2026-09-21-refactor.md → docs/plans/2026-09-20-live-scoring-v2.md → AGENTS.md (Next 16 เปลี่ยน API ต้องอ่าน node_modules/next/dist/docs/ ก่อนเขียนโค้ด)

สถานะปัจจุบัน:
- Phase 0 ถึง Phase 4 เสร็จสมบูรณ์
- Refactor P1 (Tooling, Dead code, format/labels, Banner/Confirm, AdminTable, apiRequest client, seed script, migration 004) เสร็จสมบูรณ์
- Refactor P2-8 (แตก ScoreInput + hooks), P2-9 (แยก globals.css → src/styles/*), P2-10 (lib/queries + loadPage), P2-11 (admin เขียนผ่าน /api/admin/[resource] + migration 005 ตัด admin_write), P2-12 (lib/team-style.js), P2-14 (src/data/handbook.js) เสร็จแล้ว — P2-13 (/results→/live) เลื่อน รอคุยเพื่อน
- Refactor P3-15 (ลบ Animate UI icon runtime → lucide), P3-16 (dynamic import jspdf/jszip/chart.js), P3-17 (/live ไม่ดึง score_events), P3-18 (ISR /news /schedule + revalidatePath) เสร็จและ push แล้ว
- Refactor P3-19 เสร็จ: DB scenario 8 ข้อผ่าน (`run-local.sh`), smoke 46 checks ผ่าน; P2-13 เสร็จ (/results ใช้ useLiveScores) — Vitest 48; Prettier ทั้ง repo แล้ว (`b296ad1`, อยู่ใน .git-blame-ignore-revs) — commit ใหม่ต้องผ่าน `npm run format:check`
- Refactor P3-20 (lib/types.js) เสร็จ — Refactor P1–P3 ครบ
- Supabase จริง: migration 001–006 ครบ, matches = 44 แมตช์จริง; เพิ่ม migration 007 (007_matches_public_view.sql) ใน repo แล้ว (รอวางรันบน Supabase SQL Editor); fallback สูจิบัตรถูกตัดออกจากโค้ดแล้ว
- Dark Theme ครอบทุกโซน (Public/Staff/Admin) พร้อม semantic tokens, ThemeToggle, และ WCAG AA contrast check เสร็จสมบูรณ์
- ระบบศูนย์ดาวน์โหลดสูจิบัตรและกำหนดการ (`/handbook`) พร้อมพรีวิว modal และโหลด PDF ทางการ 2 ฉบับ เสร็จสมบูรณ์
- Build ผ่าน (npm run build); ESLint 0 error / 0 warning; Vitest 54 tests ผ่าน 100%

งานต่อไป (ผู้ใช้อนุมัติแล้ว ทำทีละอย่าง หยุดรอคำสั่งหลังแต่ละอย่าง):
- Production: https://sci-games-2026.vercel.app (deploy จาก main อัตโนมัติ; smoke: `node scripts/smoke-test.mjs https://sci-games-2026.vercel.app`)
- **ค้างตัดสินใจ 2 ข้อ (สำคัญก่อนงาน 9 ต.ค.)**
  1. **กันคะแนนสดระดับข้อมูล?** ตอนนี้ UI ไม่โชว์ แต่เปิด view-source / ใช้ anon key อ่านได้ — (ก) ปล่อยไว้ (ข) ตัดคะแนนของแมตช์ live ออกจาก payload ฝั่ง server+client (ง่าย แต่ anon key ยังยิง DB ตรงได้) (ค) migration 007: view สาธารณะ null คะแนนเมื่อ `status='live'` + ตัด SELECT ตรงบน `matches` ของ anon (กันได้จริง, ต้องแก้ query ฝั่ง public ทั้งหมด)
  2. **Egress 5 GB/เดือน** ผู้ชมแต่ละคน poll ทุก 30 วิ — เสนอทำ `/api/live-summary` ส่ง JSON เล็ก ๆ (id, status, สกอร์เฉพาะที่จบแล้ว) cache `s-maxage=15–30` ที่ Vercel → DB โดน 1 ครั้ง/30 วิ ไม่ว่าคนดูกี่คน; ถ้าไม่ทำ ให้เฝ้า Usage ใน Supabase ระหว่างงานและเพิ่ม `SPECTATOR_POLL_MS`
- Phase 5 ที่เหลือ: ซ้อมกับอุปกรณ์จริง (มือถือกรรมการ + จอสนาม), ตัดสินใจค่า default ที่เหลือ (สร้าง PIN, ลงคะแนนจากมือถือ, เปิด /live หลายเครื่อง), ค่า default ที่ยังไม่ยืนยัน (edit window 10 นาที, กติกาเซต, บาส +2/+3) — **Supabase: ตัดสินใจแล้วว่าอยู่ Free tier**
- อัปเดต Handoff.md ทุกครั้งหลังจบแต่ละงาน แล้ว push ขึ้น main
```
