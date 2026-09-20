# 🔄 Project Hand-Off Summary
> Last updated: 2026-09-21 (Phase 1 done) — ไฟล์นี้เป็น living document อัปเดตทับได้เรื่อย ๆ (สำเนาระบุวันที่เก็บไว้เฉพาะในเครื่องที่ docs/handoff-summary-YYYY-MM-DD.md ไม่ขึ้น git)

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

## 3. [Current Task & Blockers]

**สถานะ:** Phase 1 เสร็จและ push แล้ว — งานถัดไปคือ **Phase 2: Staff UI** ตามแผนข้อ 5

**⚠️ ยังไม่ได้รันบน Supabase จริง:** `002_live_scoring.sql` และ `003_staff_via_api_only.sql` (รันตามลำดับใน SQL Editor, รันซ้ำได้) + ตั้ง env `PIN_SESSION_SECRET` — ก่อนหน้านั้น `/api/score` จะ error เพราะไม่มี function/ตาราง และ `/api/pin/login` ตอบ 503
**⚠️ API routes ยังไม่เคยถูกยิงกับ Supabase จริง** (ทดสอบแค่ DB functions บน Postgres local + unit test ของ JS) — สิ่งแรกของ Phase 2 คือ smoke test: สร้าง PIN ผ่าน `POST /api/admin/pins` → login → `/api/score`

**Phase 2 To-do (Staff UI):**
1. `/staff/login` เพิ่มแท็บ **PIN**: เลือกกีฬา (dropdown จาก `sports`) + ช่อง PIN 6 หลัก → `POST /api/pin/login` → redirect `/staff/scoring`; รองรับ `?sport=<uuid>` จาก QR
2. `ScoreInput` step 1: แยกกลุ่ม "กำลังแข่ง" / "ถัดไป" / "เพิ่งจบ (แก้ได้อีก mm:ss)" — ตอนนี้ server page กรอง `neq('status','finished')` ที่ `(staff)/staff/scoring/page.js` ต้องเปลี่ยนให้รวม finished ภายใน edit window
3. Realtime ฟัง `matches` ของแมตช์ที่เลือก → ถ้าเครื่องอื่น/admin แก้ให้ toast + อัปเดต (ใช้ `useRealtime` แต่แก้บั๊ก callback ใน deps ก่อน — ใช้ useRef)
4. Offline queue: retry ทุก 3 วิ + แถบ "ออฟไลน์ — รอส่ง N รายการ", `navigator.wakeLock`, `beforeunload` เตือนถ้า queue ไม่ว่าง
5. ปุ่ม +1 สูง ≥96px, −1 เล็ก/เทา (ทำแล้วบางส่วน), countdown แก้ได้ถึง HH:MM หลังจบ (อ่าน `app_settings` ผ่าน GET ใหม่ `/api/settings/public` หรือฝังใน page)
6. ลบ `useAuth` ออกจากโซน staff ให้หมด (เหลือใช้ในโซน admin)

**Blockers / คำถามค้าง:**
- ✅ (แก้แล้ว) 002 อัปเดต `sports` ด้วย `WHERE name = ...` จึงใช้ได้ไม่ว่า seed รันแล้วหรือยัง
- ❓ `supabase/message.txt` เป็นไฟล์ซ้ำกับ 001 — ยังไม่ได้ commit, รอผู้ใช้ตัดสินใจลบ
- ❓ ใช้ default ไปก่อนใน 002 (ยังไม่ยืนยันกับผู้ใช้): N = 10 นาที (`app_settings.score_edit_window_minutes`); วอลเลย์ 2 ใน 3 เซตละ 25, ตะกร้อ 2 ใน 3 เซตละ 21, เปตอง เซตเดียว 13; bracket = รองฯ 2 คู่ + ชิงที่ 3 + ชิง (`generate_bracket`); บาส +2/+3 ยังไม่ตัดสิน
- ℹ️ เทส DB ใช้ PostgreSQL 16 ในเครื่อง (port 5432, user postgres — ผู้ใช้รู้รหัส ไม่เก็บใน repo): `PGPASSWORD=<รหัส> bash supabase/tests/run-local.sh` จะสร้าง/ลบ database `sci_games_test` เอง
- ⚠️ Supabase Free tier จำกัด Realtime **200 connections** — แผนมี polling fallback แต่ควรพิจารณา Pro เฉพาะเดือนงาน
- ⚠️ ปัญหารอง: `/athletes` และ `/standings` เป็นแค่ `redirect('/schedule')` ทั้งที่ README เคลม; `useRealtime` re-subscribe ทุก render (callback ใน deps); race condition ตอนสมัคร (validate กับ insert คนละ transaction); seed มี 5 กีฬาแต่ README/`tournamentData.js` บอก 6

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

Phase 0–1 เสร็จแล้ว (migration 002/003, API layer, ScoreInput เรียก API) เริ่ม Phase 2: Staff UI ตาม To-do ใน Handoff ข้อ 3:
1. ถามผู้ใช้ก่อนว่า 002/003 รันบน Supabase แล้วหรือยัง และมี PIN_SESSION_SECRET ใน .env.local ไหม — ถ้ามี ให้ smoke test API ด้วย curl/fetch ก่อน
2. /staff/login เพิ่มแท็บ PIN (เลือกกีฬา + PIN 6 หลัก → POST /api/pin/login)
3. staff/scoring/page.js รวมแมตช์ที่ finished ภายใน edit window; ScoreInput แยกกลุ่ม กำลังแข่ง/ถัดไป/เพิ่งจบ + countdown
4. Realtime sync แมตช์ที่เลือก (แก้ useRealtime ให้ใช้ useRef สำหรับ callback ก่อน), offline queue + wakeLock
5. npm test, npm run build (และ npm run test:db ถ้าแตะ SQL) ต้องผ่านก่อน commit; commit แยกแต่ละข้อ; อัปเดต Handoff.md แล้ว push ทุกครั้ง
```
