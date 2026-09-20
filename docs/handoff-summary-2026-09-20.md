# 🔄 Project Hand-Off Summary
> Generated: 2026-09-20

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

**สถานะ:** แผนเสร็จ ยังไม่ได้เริ่มเขียนโค้ดใด ๆ — งานถัดไปคือ **Phase 0** ตามแผน

**Phase 0 (ต้องทำก่อนทุกอย่าง — ช่องโหว่อยู่บน DB/โค้ดจริงแล้ว):**
1. `src/app/api/admin/users/route.js` **ไม่มี auth check เลย** — ใช้ service role, ใครก็ POST สร้าง `super_admin` หรือ DELETE admin ได้ (middleware matcher คุมแค่ `/admin/:path*`, `/staff/:path*` ไม่รวม `/api/admin`)
2. RLS `athletes` มี `public_read USING (true)` → **เบอร์โทรนักกีฬาเปิด public** ผ่าน anon key (spec บอกให้ใช้ view `athletes_public`)
3. `src/components/staff/ScoreInput.js` **ไม่กรองแมตช์ตาม `assignedSports`** (README เคลมว่ากรอง) + RLS `staff_update` ให้ staff แก้ได้ทุกคอลัมน์ของ matches
4. `src/lib/audit.js` → `createAuditLog` **ไม่มีใครเรียกเลย**
5. `src/lib/rate-limit.js` เป็น in-memory Map → บน Vercel serverless แทบไม่ทำงาน
6. `src/middleware.js` → rename เป็น `src/proxy.js` + เพิ่ม matcher `/api/admin/:path*`
7. ร่าง `supabase/migrations/002_live_scoring.sql` ตามแผน (additive, `IF NOT EXISTS` ทุกจุด)

**Blockers / คำถามค้าง:**
- ❓ เพื่อนรัน `supabase/seed.sql` แล้วหรือยัง (กระทบว่า 002 ต้อง UPDATE `sports` ด้วย id ที่ seed ไว้ไหม)
- ❓ `supabase/message.txt` เป็นไฟล์ซ้ำกับ 001 — ยังไม่ได้ commit, รอผู้ใช้ตัดสินใจลบ
- ❓ N นาทีแก้หลังจบ = 10 ใช่ไหม; กติกาเซต (ตะกร้อ 2 ใน 3 เซต เซตละ 21? เปตอง 13 แต้มเซตเดียว?); บาสต้องมี +2/+3 ไหม; bracket 4 ทีม = รองฯ 2 คู่ + ชิงที่ 3 + ชิง หรือบางกีฬาพบกันหมด
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
อ่านก่อนตามลำดับ: docs/handoff-summary-2026-09-20.md → docs/plans/2026-09-20-live-scoring-v2.md → AGENTS.md (Next 16 เปลี่ยน API ต้องอ่าน node_modules/next/dist/docs/ ก่อนเขียนโค้ด)

เริ่ม Phase 0 ตามแผน ทำตามลำดับนี้และ commit แยกแต่ละข้อ:
1. เพิ่ม auth check (super_admin เท่านั้น) ใน src/app/api/admin/users/route.js โดยสร้าง src/lib/auth/resolveActor.js ตามแผนข้อ 3
2. rename src/middleware.js → src/proxy.js และเพิ่ม matcher '/api/admin/:path*'
3. ร่าง supabase/migrations/002_live_scoring.sql ตามแผนข้อ 2 ทั้งหมด (additive, IF NOT EXISTS ทุกจุด, ห้ามแก้ 001) รวมการลบ policy public_read บน athletes และลบ staff_update บน matches
4. ต่อสาย createAuditLog ใน MatchEditor / AthleteManager / UserManager / NewsEditor
5. รัน npm run build ให้ผ่านทุกครั้งก่อน commit

ห้าม commit supabase/message.txt (ซ้ำกับ 001) ถ้ายังไม่ได้รับคำสั่งให้ลบ
ถ้าติดคำถามใน handoff ข้อ 3 (seed รันแล้วหรือยัง, กติกาเซต, N นาที) ให้ใช้ค่า default ตามแผนไปก่อนและระบุ assumption ไว้ใน commit message
```
