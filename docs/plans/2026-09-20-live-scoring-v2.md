# แผนพัฒนา Live Scoring v2 — Sci Games 2026

วันที่วางแผน: 20 ก.ย. 2569 · วันงาน: 9–11 ต.ค. 2569 (เหลือ ~19 วัน)
แนวทาง: **ต่อยอดโค้ดเดิม** ใน repo นี้ ไม่รื้อ schema 001 — เพิ่ม migration `002_live_scoring.sql` แบบ additive/idempotent เพื่อให้รันต่อจาก migration ของเพื่อนได้

---

## 0. สรุป Requirement ที่ตกลงกัน

| หัวข้อ | ตัดสินใจ |
|---|---|
| หน้าผู้ชม | 1 การ์ดต่อกีฬา = แมตช์ที่กำลังแข่ง, ตำแหน่งการ์ดคงที่ตาม `sports.sort_order`; กดเข้าไปเห็น "จบแล้ว (พร้อมสกอร์)" / "กำลังแข่ง" / "คู่ต่อไป" เรียงลำดับ |
| Indicator | ↑ เขียวมุมขวาการ์ดเมื่อ **คะแนนเพิ่ม** (ลดไม่แสดง แค่เปลี่ยนตัวเลขเงียบ ๆ) + ไฮไลต์ตัวเลขทีมที่ได้แต้ม + "อัปเดตล่าสุด X วินาทีที่แล้ว" |
| ผู้ลงคะแนน | ปุ่ม +1 / −1 ใหญ่ กดง่ายบนมือถือ, เข้าระบบได้ **2 แบบ**: บัญชี Staff (ผูกกีฬา) หรือ **PIN ต่อกีฬา** |
| กีฬาเซต | วอลเลย์บอล / ตะกร้อ / เปตอง **เก็บคะแนนรายเซต** |
| แก้หลังจบ | Staff แก้ได้ภายใน **N นาที** (ค่าเริ่มต้น 10 นาที, admin ปรับได้), หลังจากนั้น admin เท่านั้น |
| Admin เพิ่ม | Live Monitor ทุกสนาม, หน้า Audit / ประวัติแก้คะแนน + rollback, จัดการ PIN, สร้างสายแข่ง (Bracket) อัตโนมัติ |
| Infra | รอ migration จากเพื่อน → เขียน 002 แยกไฟล์ ไม่แตะ 001 |

---

## 1. สถาปัตยกรรมหลัก: "ทุกการเปลี่ยนคะแนนเป็น Event"

ปัจจุบัน `ScoreInput` เขียน `score_a/score_b` ลง `matches` ตรง ๆ จาก browser ผ่าน anon key + RLS ซึ่ง (1) ไม่มีประวัติ (2) รองรับ PIN ไม่ได้เพราะ RLS ไม่รู้จัก PIN user (3) กด 2 เครื่องพร้อมกันจะทับกัน

**เปลี่ยนเป็น:**

```
[Staff / PIN client]
      │  POST /api/score  {match_id, team:'a'|'b', delta:+1|-1, set_number}
      ▼
[Next.js Route Handler]  ← ตรวจ session Supabase หรือ PIN cookie
      │  service role
      ▼
[Postgres fn apply_score_event()]  ← atomic: ตรวจสถานะ/สิทธิ์/edit window
      │  INSERT score_events + UPDATE match_sets + UPDATE matches
      ▼
[Supabase Realtime]  → matches, match_sets, score_events
      │
      ▼
[Viewer / Admin Live Monitor]  ← ↑ indicator มาจาก score_events.delta > 0
```

ข้อดี: audit ครบทุกการกด, undo ทำได้ (insert event กลับด้าน), PIN กับ Staff ใช้ทางเดียวกัน, ป้องกัน race ด้วย transaction ใน DB, ผู้ชมแยกได้ว่า "เพิ่ม" หรือ "ลด" โดยไม่ต้องเดาจากตัวเลข

---

## 2. Migration `002_live_scoring.sql`

### 2.1 แก้ตาราง `sports`
```sql
ALTER TABLE sports
  ADD COLUMN IF NOT EXISTS scoring_type text NOT NULL DEFAULT 'points'
    CHECK (scoring_type IN ('points','sets')),
  ADD COLUMN IF NOT EXISTS sets_to_win integer DEFAULT 1,      -- วอลเลย์ 2 (best of 3), ตะกร้อ 2, เปตอง 1
  ADD COLUMN IF NOT EXISTS points_per_set integer,             -- 25 / 21 / 13 (แสดงเป็นคำแนะนำ ไม่บังคับ)
  ADD COLUMN IF NOT EXISTS icon text;
```
Seed update: ฟุตซอล/บาส = `points`; วอลเลย์/ตะกร้อ = `sets`, sets_to_win 2; เปตอง = `sets`, sets_to_win 1, points_per_set 13

### 2.2 แก้ตาราง `matches`
```sql
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS current_set integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sets_a integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sets_b integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_score_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_scored_team char(1) CHECK (last_scored_team IN ('a','b')),
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS finished_at timestamptz,
  ADD COLUMN IF NOT EXISTS round text,             -- 'semi_1','semi_2','third','final' หรือ NULL (แมตช์ธรรมดา)
  ADD COLUMN IF NOT EXISTS next_match_id uuid REFERENCES matches(id),
  ADD COLUMN IF NOT EXISTS next_match_slot char(1) CHECK (next_match_slot IN ('a','b')),
  ADD COLUMN IF NOT EXISTS loser_next_match_id uuid REFERENCES matches(id),  -- แพ้รอบรองไปชิงที่ 3
  ADD COLUMN IF NOT EXISTS loser_next_match_slot char(1);
ALTER TABLE matches ALTER COLUMN team_a_id DROP NOT NULL;  -- bracket: รอบชิงยังไม่รู้คู่
ALTER TABLE matches ALTER COLUMN team_b_id DROP NOT NULL;
```
> สำหรับกีฬา `points` ให้ `score_a/score_b` เป็นคะแนนรวมเหมือนเดิม; กีฬา `sets` ให้ `score_a/score_b` = คะแนนใน **เซตปัจจุบัน** (เพื่อให้หน้าเดิมยังแสดงผลได้) และ `sets_a/sets_b` = จำนวนเซตที่ชนะ; trigger คิดแต้ม `calculate_match_points()` ต้องแก้ให้ใช้ `sets_a/sets_b` เมื่อ `scoring_type='sets'`

### 2.3 ตารางใหม่
```sql
CREATE TABLE IF NOT EXISTS match_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  set_number integer NOT NULL,
  score_a integer NOT NULL DEFAULT 0,
  score_b integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'live' CHECK (status IN ('live','finished')),
  finished_at timestamptz,
  UNIQUE (match_id, set_number)
);

CREATE TABLE IF NOT EXISTS score_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  set_number integer,
  team char(1) CHECK (team IN ('a','b')),
  delta integer NOT NULL,                       -- +1, -1, +2, +3 (บาส) หรือ 0 สำหรับ event ประเภทอื่น
  event_type text NOT NULL DEFAULT 'score'
    CHECK (event_type IN ('score','start','finish_set','finish_match','reopen','override','undo')),
  actor_type text NOT NULL CHECK (actor_type IN ('staff','admin','pin')),
  actor_admin_user_id uuid REFERENCES admin_users(id),
  actor_label text NOT NULL,                    -- display_name หรือ PIN label เช่น "กรรมการเปตอง #2"
  undone_by uuid REFERENCES score_events(id),
  meta jsonb,                                   -- เช่น {"from":{"a":3,"b":2},"to":{"a":4,"b":2}}
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_score_events_match ON score_events(match_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sport_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id uuid NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  label text NOT NULL,                          -- "กรรมการฟุตซอล สนาม 1"
  pin_hash text NOT NULL,                       -- bcrypt/argon2 — ไม่เก็บ PIN ตรง ๆ
  is_active boolean DEFAULT true,
  expires_at timestamptz,                       -- ตั้งให้หมดอายุหลังจบงาน
  created_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);
INSERT INTO app_settings VALUES ('score_edit_window_minutes', '10') ON CONFLICT DO NOTHING;
```

### 2.4 Postgres Functions (SECURITY DEFINER, เรียกจาก service role เท่านั้น)

| ฟังก์ชัน | หน้าที่ |
|---|---|
| `apply_score_event(p_match uuid, p_team char, p_delta int, p_actor jsonb)` | ตรวจว่า match เป็น `live` **หรือ** `finished` และ `now() - finished_at < edit_window`; อัปเดต `match_sets` (ถ้า sets) + `matches.score_*`, `last_score_at`, `last_scored_team`; กันติดลบ; insert `score_events`; คืน row ใหม่ |
| `start_match(p_match, p_actor)` | `upcoming → live`, สร้าง `match_sets` เซต 1, `started_at` |
| `finish_set(p_match, p_actor)` | ปิดเซตปัจจุบัน, บวก `sets_a/sets_b`, เปิดเซตถัดไป (ถ้ายังไม่มีใครถึง `sets_to_win`) |
| `finish_match(p_match, p_actor)` | `live → finished`, `finished_at`, trigger คิดแต้ม, เรียก `advance_bracket()` |
| `reopen_match(p_match, p_actor)` | admin เท่านั้น: `finished → live` |
| `undo_score_event(p_event, p_actor)` | insert event กลับด้าน + mark `undone_by` |
| `advance_bracket()` (trigger AFTER UPDATE matches) | เมื่อ finished และมี `next_match_id` → ใส่ผู้ชนะลง slot; ผู้แพ้ลง `loser_next_match_id` |
| `generate_bracket(p_sport uuid, p_seeds uuid[4], p_dates ...)` | สร้าง 4 แมตช์ (รองฯ 1, รองฯ 2, ชิงที่ 3, ชิงชนะเลิศ) พร้อม link |

### 2.5 RLS / Realtime
- `match_sets`, `score_events`: public SELECT (ผู้ชมต้องอ่าน), **ไม่มี** policy INSERT/UPDATE สำหรับ anon/authenticated → เขียนได้ผ่าน service role เท่านั้น
- `sport_pins`, `app_settings`: super_admin เท่านั้น
- **ลบ** policy `staff_update` บน `matches` (staff ไม่เขียนตรงแล้ว) — ปิดช่องแก้ team/date/venue
- `ALTER PUBLICATION supabase_realtime ADD TABLE match_sets, score_events`

### 2.6 แก้ช่องโหว่จาก 001 (รวมใน 002)
- `DROP POLICY "public_read" ON athletes` → เหลือ admin; public ใช้ view `athletes_public` (ต้องมี `security_invoker = false` เพื่ออ่านข้าม RLS ได้)
- `ALTER TABLE registrations ADD FOREIGN KEY (cancelled_by) REFERENCES admin_users(id)`

---

## 3. API Layer (Next.js Route Handlers)

ไฟล์ใหม่ `src/lib/auth/resolveActor.js` — ฟังก์ชันเดียวใช้ทุก route:
```
resolveActor(request) →
  { type:'admin', adminUserId, label, sportIds:'*' }
  | { type:'staff', adminUserId, label, sportIds:[...] }
  | { type:'pin',   pinId, label, sportIds:[sportId] }
  | null
```
ลำดับ: อ่าน Supabase session cookie → ถ้าไม่มี อ่าน `sg_pin` cookie (JWT ลงนามด้วย `PIN_SESSION_SECRET`, อายุ 14 ชม.)

| Route | Method | ผู้ใช้ | หน้าที่ |
|---|---|---|---|
| `/api/score` | POST | staff/pin/admin | `{match_id, team, delta}` → `apply_score_event` ตรวจ `sportIds` ก่อน |
| `/api/score/undo` | POST | staff/pin/admin | undo event ล่าสุดของตัวเองใน match (staff/pin) หรือ event ใด ๆ (admin) |
| `/api/match/[id]/start` `/finish-set` `/finish` | POST | staff/pin/admin | เรียก fn ตามชื่อ |
| `/api/match/[id]/reopen` `/override` | POST | admin | reopen / ตั้งคะแนนตรง ๆ (บันทึกเป็น event `override`) |
| `/api/pin/login` | POST | public | `{sport_id, pin}` → bcrypt compare → set cookie; rate limit 5/10 นาที/IP |
| `/api/pin/logout` | POST | pin | ลบ cookie |
| `/api/admin/pins` | GET/POST/PATCH/DELETE | admin | CRUD PIN (สร้างแล้วโชว์ PIN ครั้งเดียว) |
| `/api/admin/bracket` | POST | admin | `generate_bracket` |
| `/api/admin/users` | * | **admin (แก้ช่องโหว่)** | เพิ่ม `resolveActor` + เช็ค `type==='admin'` |
| `/api/admin/settings` | PATCH | admin | `score_edit_window_minutes` |

Rate limit: ย้ายจาก in-memory Map ไปใช้ **Upstash Redis** (free tier) หรือตาราง `rate_limits` ใน Postgres — เพราะ Vercel serverless แต่ละ instance ไม่แชร์ memory

`src/middleware.js` → เปลี่ยนชื่อเป็น `src/proxy.js` ตาม Next 16 และเพิ่ม matcher `/api/admin/:path*`

---

## 4. ฝั่งผู้ชม (Public)

### 4.1 หน้า `/live` (ใหม่ — แทนที่/รวมกับ `/results`)
- Grid การ์ด **เรียงตาม `sports.sort_order` ตายตัว ไม่ re-sort** (CSS grid + `key=sport.id`)
- การ์ดแต่ละกีฬา (`SportLiveCard`):
  - หัว: ไอคอน + ชื่อกีฬา + badge สถานะ (`LIVE` / `รอแข่ง HH:MM` / `จบแล้ววันนี้`)
  - กลาง: ทีม A vs ทีม B (สี/emoji), ตัวเลขใหญ่; กีฬาเซต แสดง `เซต 1-0 · 25-23 | 12-9` (เซตปัจจุบันเด่น)
  - **มุมขวาบน**: `<ScoreUpdateIndicator />` — ↑ สีเขียว fade-in แล้วหายใน 3 วิ, แสดงเฉพาะเมื่อได้รับ `score_events` INSERT ที่ `delta > 0`
  - ตัวเลขทีมที่ได้แต้ม: class `.score-bump` (scale 1.25 → 1, สีเขียว → ขาว, 600ms)
  - ล่าง: "อัปเดตล่าสุด 12 วินาทีที่แล้ว" (relative time จาก `last_score_at`, tick ทุก 5 วิ)
  - ถ้ามี live มากกว่า 1 แมตช์ในกีฬาเดียวกัน: การ์ดโชว์อันแรก + ป้าย "+1 คู่กำลังแข่ง"
- กดการ์ด → `/live/[sportId]` (หรือ bottom sheet บนมือถือ)

### 4.2 หน้า `/live/[sportId]`
3 ส่วนเรียงบน-ล่าง:
1. **กำลังแข่ง** — การ์ดเดียวกับหน้าแรก ขนาดใหญ่ + ตารางรายเซต
2. **คู่ต่อไป** — เรียงตาม `match_date, match_time`; แสดง "รอผู้ชนะ รองฯ 1" ถ้าทีมยัง NULL (bracket)
3. **จบแล้ว** — เรียงล่าสุดก่อน, สกอร์สุดท้าย + รายเซต + ผู้ชนะเน้นสี
+ bracket view เล็ก ๆ (4 ทีม) ถ้ากีฬานั้นมี `round`

### 4.3 Realtime hook ใหม่ `useLiveScores()`
- 1 channel ต่อหน้า subscribe 3 ตาราง (`matches` UPDATE, `match_sets` *, `score_events` INSERT)
- state เก็บเป็น `Map<matchId, match>` → ผู้ชมทุกคนใช้ hook เดียวกัน
- **Polling fallback**: ถ้า channel status ≠ `SUBSCRIBED` เกิน 10 วิ → fetch ทุก 15 วิ + แสดง badge "โหมดสำรอง"
- `document.visibilitychange` → refetch เมื่อกลับมาหน้าจอ (มือถือพักหน้าจอแล้ว websocket หลุด)
- แก้บั๊กเดิม `useRealtime` ที่ re-subscribe ทุก render (callback ใน deps) → ใช้ `useRef` เก็บ callback

### 4.4 หน้าเดิมที่ต้องปรับ
- `/` HeroSection: ดึง 1–2 แมตช์ live มาโชว์ + ลิงก์ไป `/live`
- `/results` → redirect ไป `/live` (หรือเก็บไว้เป็น "ผลย้อนหลังทั้งหมด")
- `MatchCard` เดิม: รองรับ `sets_a/sets_b`
- `team_standings` view: ใช้ `sets_*` ตัดสินแพ้ชนะเมื่อ `scoring_type='sets'`

---

## 5. ฝั่งผู้ลงคะแนน (Staff / PIN)

### 5.1 เข้าระบบ `/staff/login`
2 แท็บ: **บัญชี Staff** (email/password เดิม) | **รหัส PIN** (เลือกกีฬา → กรอก PIN 6 หลัก)
PIN session เก็บใน httpOnly cookie, หมดอายุ 14 ชม. หรือ admin ปิด PIN

### 5.2 `/staff/scoring` (เขียนใหม่ทั้ง `ScoreInput`)
**ขั้น 1 เลือกแมตช์** — กรองเฉพาะ `sportIds` ของ actor (แก้บั๊กเดิมที่ไม่กรอง); กลุ่ม "กำลังแข่ง" ก่อน แล้ว "ถัดไป"; แมตช์ที่จบ < N นาที แสดงในกลุ่ม "เพิ่งจบ (แก้ได้อีก 7:32)"

**ขั้น 2 ลงคะแนน** — layout มือถือแนวตั้ง:
```
┌───────────────────────────────┐
│ ฟุตซอล · รอบรองฯ 1 · สนาม 1    LIVE ● │
│         เซต 2  (1-0)           │  ← เฉพาะกีฬาเซต
├───────────────┬───────────────┤
│   🔴 สีแดง     │   🔵 สีฟ้า     │
│      4        │      2        │  ← ตัวเลข 72px
│  ┌─────────┐  │  ┌─────────┐  │
│  │   +1    │  │  │   +1    │  │  ← สูง 96px กดง่าย
│  └─────────┘  │  └─────────┘  │
│  [+2] [+3]    │  [+2] [+3]    │  ← บาสเท่านั้น
│    [ −1 ]     │    [ −1 ]     │  ← เล็กกว่า สีเทา
├───────────────┴───────────────┤
│ ↶ ยกเลิกล่าสุด (+1 แดง 3 วิที่แล้ว) │
│ [ จบเซต ]        [ จบแมตช์ ]   │
│ ✓ ซิงค์แล้ว 14:32:07            │
└───────────────────────────────┘
```
- **Optimistic UI**: กดแล้วตัวเลขเปลี่ยนทันที, ยิง API, ถ้า fail → revert + toast
- **Queue กันกดรัว**: debounce 250ms ต่อปุ่ม + serialize request (ส่งทีละอัน) กัน out-of-order
- **Offline**: เก็บ queue ใน memory, retry ทุก 3 วิ, แถบเหลือง "ออฟไลน์ — รอส่ง 2 รายการ"
- `navigator.wakeLock` กันจอดับ; `beforeunload` เตือนถ้า queue ยังไม่ว่าง
- **จบแมตช์**: confirm dialog สรุปคะแนน + ผู้ชนะ; หลังจบโชว์ countdown "แก้ไขได้ถึง 14:45"
- Realtime ฟัง `matches` ของตัวเองด้วย → ถ้า admin override หรือเครื่องอื่นกด จะเห็นทันที + toast "คะแนนถูกอัปเดตจาก [admin]"

### 5.3 การกด −1
ไม่ต้อง confirm (ผู้ใช้ต้องการแก้เร็ว) แต่ปุ่มเล็กกว่า/สีเทา และมี "ยกเลิกล่าสุด" เป็นทางเลือกหลัก; ฝั่งผู้ชม **ไม่แสดง indicator** สำหรับ `delta < 0`

---

## 6. ฝั่ง Admin

| หน้า | Route | รายละเอียด |
|---|---|---|
| **Live Monitor** | `/admin/live` | ตารางทุกกีฬา × แมตช์ live/upcoming วันนี้; คอลัมน์: กีฬา, คู่, คะแนน (realtime), ผู้ลงคะแนนล่าสุด (`actor_label`), อัปเดตล่าสุด, สถานะ PIN/Staff online (จาก event ล่าสุด < 5 นาที); ปุ่ม override / reopen / finish ต่อแถว; แถวกระพริบเมื่อมี event |
| **Audit / ประวัติ** | `/admin/audit` | รวม `score_events` + `audit_logs`; filter กีฬา/แมตช์/ผู้กระทำ/ช่วงเวลา; แต่ละแถวมีปุ่ม **ย้อน** (`undo_score_event`); timeline ต่อแมตช์ (0-0 → 1-0 → 1-1 …) |
| **จัดการ PIN** | `/admin/pins` | สร้าง PIN ต่อกีฬา (สุ่ม 6 หลัก แสดงครั้งเดียว + QR ลิงก์ `/staff/login?sport=…`), เปิด/ปิด, ตั้งหมดอายุ, ดูว่า PIN ไหนใช้ล่าสุดเมื่อไหร่ |
| **สายแข่ง** | `/admin/bracket` | เลือกกีฬา → จัด seed 4 สี → ตั้งวัน/เวลา/สนาม 4 แมตช์ → กด "สร้างสายแข่ง"; แสดง bracket และอัปเดตอัตโนมัติเมื่อมีผู้ชนะ |
| **ตั้งค่า** | `/admin/settings` | `score_edit_window_minutes`, เปิด/ปิดโหมด live ทั้งระบบ |
| แก้ที่มี | `/admin/matches` | เพิ่มฟิลด์ round/sets; ปุ่ม "เปิดใน Live Monitor" |
| แก้ที่มี | `/admin/users` | เรียก API ที่มี auth แล้ว; ต่อสาย `createAuditLog` |
| Layout | `(admin)/layout.js` | เช็ค role ฝั่ง server ใน layout (Server Component wrapper) ไม่ใช่ client-only |

---

## 7. งาน Security ที่ต้องปิด (ทำใน Phase 0 ก่อนอย่างอื่น)

1. `/api/admin/users` — ใส่ `resolveActor` + admin check
2. `athletes` RLS — ลบ public_read
3. Staff กรองกีฬา — ได้จากการย้ายไป `/api/score` + ลบ `staff_update` policy
4. `middleware.js` → `proxy.js` + matcher `/api/admin/*`
5. Rate limit ย้ายออกจาก memory
6. `createAuditLog` ต่อสายเข้า MatchEditor / AthleteManager / UserManager / NewsEditor

---

## 8. ลำดับงานและเวลา (19 วัน)

| Phase | วัน | งาน | Deliverable |
|---|---|---|---|
| **0 Security + Schema** | 21–22 ก.ย. | ข้อ 7 ทั้งหมด, เขียน `002_live_scoring.sql` + functions, ทดสอบบน Supabase local (`supabase start`) | migration พร้อมส่งให้เพื่อนรันต่อจาก 001 |
| **1 Scoring Engine** | 23–25 ก.ย. | `resolveActor`, `/api/score*`, `/api/match/*`, `/api/pin/*`, unit test functions ด้วย pgTAP หรือ script | curl ได้ครบ, audit ครบ |
| **2 Staff UI** | 26–29 ก.ย. | login 2 แบบ, `ScoreInput` v2, optimistic/queue/offline, wake lock | ลงคะแนนจากมือถือได้จริง |
| **3 Viewer UI** | 30 ก.ย.–2 ต.ค. | `useLiveScores`, `/live`, `/live/[sport]`, indicator, polling fallback, ปรับหน้าแรก | ผู้ชมเห็น ↑ ภายใน < 1 วิหลังกด |
| **4 Admin** | 3–5 ต.ค. | Live Monitor, Audit+undo, PIN, Bracket, Settings | admin คุมทุกอย่างจากหน้าเดียว |
| **5 Test + Deploy** | 6–8 ต.ค. | โหลดเทส realtime (k6 / script เปิด 300 tab), ซ้อมจริงกับกรรมการ 1 กีฬา, deploy Vercel, ตั้ง PIN, สำรอง DB | พร้อมใช้ 9 ต.ค. |
| งานจริง | 9–11 ต.ค. | on-call; admin override ได้ตลอด | — |

Phase 2 กับ 3 ทำคู่ขนานได้ถ้ามี 2 คน

---

## 9. ความเสี่ยงที่ต้องรู้ก่อน

| ความเสี่ยง | ผลกระทบ | แผนรับมือ |
|---|---|---|
| **Supabase Free tier จำกัด Realtime 200 connections พร้อมกัน** | ผู้ชมคนที่ 201+ ไม่ได้ realtime | polling fallback 15 วิ (ข้อ 4.3) + พิจารณาอัป Pro ($25/เดือน, 500 conn) เฉพาะเดือนงาน; หรือรวม viewer ผ่าน 1 channel broadcast |
| สัญญาณมือถือในสนามไม่ดี | กรรมการกดแล้วไม่เข้า | offline queue + retry (ข้อ 5.2) + PIN ใช้ได้หลายเครื่อง |
| กรรมการ 2 คนกดแมตช์เดียวกัน | คะแนนเพี้ยน | DB function atomic + realtime sync ทั้ง 2 เครื่อง + audit ระบุคนกด |
| Migration ของเพื่อนชนกับ 002 | รันไม่ผ่าน | 002 ใช้ `IF NOT EXISTS` ทุกจุด, ไม่แก้ของ 001 นอกจาก policy/trigger ที่ระบุชัด; ขอ review migration ของเพื่อนก่อน merge |
| Next 16 API เปลี่ยนจาก training data | เขียนผิด convention | อ่าน `node_modules/next/dist/docs/` ก่อนแต่ละ phase ตาม AGENTS.md |
| ไม่มี test เลยใน repo | regression | เพิ่ม Vitest สำหรับ `resolveActor`, scoring reducer; Playwright 1 flow "PIN login → +1 → ผู้ชมเห็น ↑" |

---

## 10. คำถามที่ยังเปิด (ตอบได้ทีหลัง ไม่บล็อก Phase 0–1)

1. N นาทีสำหรับแก้หลังจบ — ใช้ 10 นาทีเป็นค่าเริ่มต้นไปก่อน?
2. บาสเกตบอลต้องมีปุ่ม +2/+3 ไหม (โค้ดเดิมมี +2) — ใส่ไว้เฉพาะบาส
3. เปตอง: best-of-1 ถึง 13 แต้ม ถูกไหม? ตะกร้อ: 2 ใน 3 เซต เซตละ 21?
4. ผู้ชมต้องมี "หน้าจอใหญ่/โปรเจกเตอร์" ด้วยไหม (ตอนแรกไม่เลือก) — ถ้าต้องการเพิ่ม `/live/board` fullscreen ใน Phase 3 ได้ +0.5 วัน
5. Bracket 4 ทีม = รองฯ 2 คู่ + ชิงที่ 3 + ชิง ใช่ไหม หรือบางกีฬาแข่งพบกันหมด (round robin)?
