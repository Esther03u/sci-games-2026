# 🔄 Project Hand-Off Summary
> Last updated: 2026-09-20 (Phase 0 done) — ไฟล์นี้เป็น living document อัปเดตทับได้เรื่อย ๆ (สำเนาระบุวันที่เก็บไว้เฉพาะในเครื่องที่ docs/handoff-summary-YYYY-MM-DD.md ไม่ขึ้น git)

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

## 3. [Current Task & Blockers]

**สถานะ:** Phase 0 เสร็จและ commit แล้ว — งานถัดไปคือ **Phase 1: Scoring Engine (API layer)** ตามแผนข้อ 3

**⚠️ 002 ยังไม่ได้รันบน Supabase จริง** — ต้องให้เพื่อน/ผู้ใช้เอา `supabase/migrations/002_live_scoring.sql` ไปรันใน SQL Editor (รันซ้ำได้ ปลอดภัย) ก่อน Phase 1 จะทดสอบกับ DB จริงได้

**Phase 1 To-do:**
1. `resolveActor()` เพิ่ม branch PIN: อ่าน cookie `sg_pin` (JWT ลงนามด้วย env `PIN_SESSION_SECRET`) → `{type:'pin', pinId, label, sportIds:[sportId]}`
2. Route handlers (ทุกตัวใช้ service role + เช็ค `actorCanScoreSport`):
   - `POST /api/score` `{match_id, team, delta}` → rpc `apply_score_event`
   - `POST /api/score/undo` `{event_id}` → rpc `undo_score_event`
   - `POST /api/match/[id]/start|finish-set|finish` → rpc `start_match|finish_set|finish_match`
   - `POST /api/match/[id]/reopen|override` (admin) → rpc `reopen_match|override_score`
   - `POST /api/pin/login` `{sport_id, pin}` bcrypt compare กับ `sport_pins.pin_hash` → set cookie; rate limit 5/10 นาที; `POST /api/pin/logout`
   - `/api/admin/pins` CRUD, `/api/admin/bracket` → rpc `generate_bracket`, `/api/admin/settings`
3. แปลง error จาก rpc (`MATCH_NOT_LIVE`, `EDIT_WINDOW_CLOSED`, `SET_IS_TIED`, `ADMIN_ONLY`, …) เป็น JSON `{success:false, error_code, message}` ภาษาไทย
4. เปลี่ยน `ScoreInput.js` ให้เรียก API แทนเขียน `matches` ตรง → แล้วค่อยเขียน migration 003 ลบ policy `staff_update` + trigger `guard_staff_match_update`
5. เพิ่ม Vitest สำหรับ resolveActor + error mapping (ยังไม่มี test runner ใน repo)

**Blockers / คำถามค้าง:**
- ✅ (แก้แล้ว) 002 อัปเดต `sports` ด้วย `WHERE name = ...` จึงใช้ได้ไม่ว่า seed รันแล้วหรือยัง
- ❓ `supabase/message.txt` เป็นไฟล์ซ้ำกับ 001 — ยังไม่ได้ commit, รอผู้ใช้ตัดสินใจลบ
- ❓ ใช้ default ไปก่อนใน 002 (ยังไม่ยืนยันกับผู้ใช้): N = 10 นาที (`app_settings.score_edit_window_minutes`); วอลเลย์ 2 ใน 3 เซตละ 25, ตะกร้อ 2 ใน 3 เซตละ 21, เปตอง เซตเดียว 13; bracket = รองฯ 2 คู่ + ชิงที่ 3 + ชิง (`generate_bracket`); บาส +2/+3 ยังไม่ตัดสิน
- ⚠️ Postgres local ของเครื่องนี้ (port 5432) ไม่รู้รหัส → เทสใช้ cluster ชั่วคราว: `initdb -D <scratch>/pgtest -U postgres -A trust -E UTF8 --locale=C` แล้ว `pg_ctl -D <scratch>/pgtest -o "-p 5433 -c listen_addresses=127.0.0.1" -l pg.log start` (ใน Git Bash คำสั่ง `-w` จะค้าง ให้รัน background แล้วเช็ค `netstat -an | grep 5433`) จากนั้น `PGHOST=127.0.0.1 PGPORT=5433 PGUSER=postgres bash supabase/tests/run-local.sh`; จบแล้ว `pg_ctl -D ... -m fast stop`
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

Phase 0 เสร็จแล้ว (migration 002 + auth + proxy + rate limit) เริ่ม Phase 1: Scoring Engine ตาม To-do ใน Handoff ข้อ 3:
1. เพิ่ม PIN branch ใน src/lib/auth/resolveActor.js (cookie sg_pin, JWT ด้วย env PIN_SESSION_SECRET — ใช้ 'jose')
2. สร้าง route handlers: /api/score, /api/score/undo, /api/match/[id]/{start,finish-set,finish,reopen,override}, /api/pin/{login,logout}, /api/admin/{pins,bracket,settings}
   ทุกตัว: resolveActor → actorCanScoreSport → createAdminClient().rpc(...) → map error code จาก Postgres เป็น JSON ภาษาไทย
3. เปลี่ยน src/components/staff/ScoreInput.js ให้เรียก API แทนเขียน matches ตรง แล้วเขียน supabase/migrations/003 ลบ policy staff_update + trigger guard_staff_match_update
4. ทดสอบ DB ด้วย supabase/tests/run-local.sh (ดูวิธี start Postgres ชั่วคราว port 5433 ใน Handoff ข้อ 3); npm run build ต้องผ่านก่อน commit
commit แยกแต่ละข้อ, ห้าม commit supabase/message.txt
```
