# Sci Games — Design Specification

> **Version:** 1.0  
> **Date:** 2026-09-19  
> **Status:** Draft — Pending Review

---

## 1. Overview

เว็บไซต์สำหรับงานกีฬาสานสัมพันธ์ภายในคณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต
- วันที่จัดงาน: 9-11 ตุลาคม 2569
- ผู้เข้าร่วม: ~160 คน, แบ่ง 4 สี
- กีฬา 6 รายการ: เปตอง, เซปักตะกร้อ, วอลเลย์บอล, บาสเกตบอลชาย, บาสเกตบอลหญิง, ฟุตซอล

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) |
| Styling | Vanilla CSS (Glassmorphism) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| Realtime | Supabase Realtime (WebSocket) |
| PDF | jsPDF + jspdf-autotable (client-side) |
| Deploy | Vercel + Supabase Cloud |

---

## 3. Database Schema

### 3.1 `teams` — 4 สี

| Column | Type | Constraint |
|--------|------|-----------|
| id | uuid | PK, default gen_random_uuid() |
| name | text | NOT NULL, UNIQUE |
| color_hex | text | NOT NULL |
| logo_emoji | text | nullable |
| sort_order | integer | default 0 |
| created_at | timestamptz | default now() |

> `total_points` คำนวณจาก view/function ไม่เก็บซ้ำในตาราง เพื่อป้องกันข้อมูลไม่ sync

### 3.2 `departments` — สาขาวิชา

| Column | Type | Constraint |
|--------|------|-----------|
| id | uuid | PK |
| name | text | NOT NULL, UNIQUE |
| team_id | uuid | FK → teams, NOT NULL |
| created_at | timestamptz | default now() |

### 3.3 `sports` — ชนิดกีฬา

| Column | Type | Constraint |
|--------|------|-----------|
| id | uuid | PK |
| name | text | NOT NULL, UNIQUE |
| sport_type | text | CHECK IN ('individual', 'team') |
| max_players_per_team | integer | nullable (null = ไม่จำกัด) |
| win_points | integer | default 3 |
| draw_points | integer | default 1 |
| lose_points | integer | default 0 |
| sort_order | integer | default 0 |
| created_at | timestamptz | default now() |

> คะแนนชนะ/เสมอ/แพ้ configurable ต่อกีฬา เพื่อรองรับกรณีที่กีฬาแต่ละประเภทให้คะแนนต่างกัน

### 3.4 `sport_schedules` — ตารางเวลากีฬา (ใช้เช็คตารางชน)

| Column | Type | Constraint |
|--------|------|-----------|
| id | uuid | PK |
| sport_id | uuid | FK → sports, NOT NULL |
| schedule_date | date | NOT NULL |
| start_time | time | NOT NULL |
| end_time | time | NOT NULL |
| created_at | timestamptz | default now() |

> กีฬาหนึ่งมีได้หลาย schedule (หลายวัน/หลายรอบ)  
> ใช้เช็คว่า 2 กีฬาที่นักศึกษาเลือกมีเวลาชนกันหรือไม่

### 3.5 `athletes` — นักกีฬา

| Column | Type | Constraint |
|--------|------|-----------|
| id | uuid | PK |
| student_id | text | NOT NULL, UNIQUE |
| full_name | text | NOT NULL |
| department_id | uuid | FK → departments, NOT NULL |
| team_id | uuid | FK → teams, NOT NULL |
| phone | text | NOT NULL |
| created_at | timestamptz | default now() |

> `team_id` ถูกกำหนดอัตโนมัติจาก department → team mapping  
> `phone` ไม่แสดงในหน้าสาธารณะ (RLS + API)

### 3.6 `registrations` — ใบสมัคร

| Column | Type | Constraint |
|--------|------|-----------|
| id | uuid | PK |
| athlete_id | uuid | FK → athletes, NOT NULL |
| sport_id | uuid | FK → sports, NOT NULL |
| status | text | CHECK IN ('registered', 'cancelled'), default 'registered' |
| created_at | timestamptz | default now() |
| cancelled_at | timestamptz | nullable |
| cancelled_by | uuid | FK → admin_users, nullable |

> UNIQUE constraint on (athlete_id, sport_id) — กัน register กีฬาเดิมซ้ำ  
> นักกีฬา 1 คนมีได้สูงสุด 2 registrations ที่ status = 'registered' (enforce ผ่าน DB function + API)

### 3.7 `matches` — แมตช์

| Column | Type | Constraint |
|--------|------|-----------|
| id | uuid | PK |
| sport_id | uuid | FK → sports, NOT NULL |
| team_a_id | uuid | FK → teams, NOT NULL |
| team_b_id | uuid | FK → teams, NOT NULL |
| match_date | date | NOT NULL |
| match_time | time | NOT NULL |
| venue | text | NOT NULL |
| status | text | CHECK IN ('upcoming', 'live', 'finished', 'postponed'), default 'upcoming' |
| score_a | integer | nullable |
| score_b | integer | nullable |
| points_a | integer | default 0 |
| points_b | integer | default 0 |
| updated_by | uuid | FK → admin_users, nullable |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

> เมื่อ status เปลี่ยนเป็น 'finished' → trigger คำนวณ points_a, points_b จาก score + sports.win/draw/lose_points

### 3.8 `admin_users` — ผู้ใช้งานหลังบ้าน

| Column | Type | Constraint |
|--------|------|-----------|
| id | uuid | PK |
| auth_user_id | uuid | FK → auth.users, UNIQUE |
| display_name | text | NOT NULL |
| role | text | CHECK IN ('super_admin', 'staff'), NOT NULL |
| created_at | timestamptz | default now() |

### 3.9 `staff_sport_assignments` — กีฬาที่เจ้าหน้าที่รับผิดชอบ

| Column | Type | Constraint |
|--------|------|-----------|
| id | uuid | PK |
| admin_user_id | uuid | FK → admin_users, NOT NULL |
| sport_id | uuid | FK → sports, NOT NULL |
| UNIQUE | | (admin_user_id, sport_id) |

### 3.10 `announcements` — ข่าวสาร

| Column | Type | Constraint |
|--------|------|-----------|
| id | uuid | PK |
| title | text | NOT NULL |
| content | text | NOT NULL |
| is_pinned | boolean | default false |
| created_by | uuid | FK → admin_users |
| published_at | timestamptz | default now() |
| created_at | timestamptz | default now() |

### 3.11 `page_views` — Log การเข้าชม

| Column | Type | Constraint |
|--------|------|-----------|
| id | uuid | PK |
| page_path | text | NOT NULL |
| device_type | text | NOT NULL ('mobile', 'tablet', 'desktop') |
| visitor_hash | text | NOT NULL |
| created_at | timestamptz | default now() |

> `visitor_hash` = hash ของ IP + User-Agent (ไม่เก็บ IP จริง ไม่ระบุตัวตน ตาม PDPA)  
> ใช้นับ unique visitors โดยไม่เก็บข้อมูลส่วนตัว

### 3.12 `audit_logs` — บันทึกการแก้ไข

| Column | Type | Constraint |
|--------|------|-----------|
| id | uuid | PK |
| admin_user_id | uuid | FK → admin_users, NOT NULL |
| action | text | NOT NULL |
| target_type | text | NOT NULL |
| target_id | uuid | NOT NULL |
| old_values | jsonb | nullable |
| new_values | jsonb | nullable |
| created_at | timestamptz | default now() |

### 3.13 Database View: `team_standings`

```sql
CREATE VIEW team_standings AS
SELECT
  t.id,
  t.name,
  t.color_hex,
  COALESCE(SUM(
    CASE WHEN m.team_a_id = t.id THEN m.points_a
         WHEN m.team_b_id = t.id THEN m.points_b
         ELSE 0 END
  ), 0) AS total_points,
  COUNT(CASE WHEN m.status = 'finished' THEN 1 END) AS matches_played,
  COUNT(CASE WHEN m.status = 'finished'
    AND ((m.team_a_id = t.id AND m.score_a > m.score_b)
      OR (m.team_b_id = t.id AND m.score_b > m.score_a))
    THEN 1 END) AS wins,
  COUNT(CASE WHEN m.status = 'finished'
    AND m.score_a = m.score_b THEN 1 END) AS draws,
  COUNT(CASE WHEN m.status = 'finished'
    AND ((m.team_a_id = t.id AND m.score_a < m.score_b)
      OR (m.team_b_id = t.id AND m.score_b < m.score_a))
    THEN 1 END) AS losses
FROM teams t
LEFT JOIN matches m ON (m.team_a_id = t.id OR m.team_b_id = t.id)
GROUP BY t.id, t.name, t.color_hex
ORDER BY total_points DESC;
```

---

## 4. Route Structure (Next.js App Router)

```
app/
├── (public)/
│   ├── layout.tsx                — Public layout (navbar + footer)
│   ├── page.tsx                  — หน้าแรก (hero, ข่าวเด่น, ลิงก์ลัด)
│   ├── schedule/
│   │   └── page.tsx              — ตารางแข่งขัน (filter by วัน/กีฬา)
│   ├── results/
│   │   └── page.tsx              — ผลการแข่งขัน + สกอร์สด (Realtime)
│   ├── standings/
│   │   └── page.tsx              — อันดับคะแนนรวม 4 สี
│   ├── athletes/
│   │   └── page.tsx              — รายชื่อนักกีฬา (filter by กีฬา/สี)
│   ├── news/
│   │   └── page.tsx              — ข่าวสาร/ประกาศ
│   ├── register/
│   │   └── page.tsx              — ฟอร์มสมัครนักกีฬา
│   └── check-status/
│       └── page.tsx              — เช็คสถานะ (รหัสนักศึกษา + เบอร์โทร)
│
├── (admin)/
│   ├── layout.tsx                — Admin layout (sidebar + auth guard)
│   └── admin/
│       ├── page.tsx              — Dashboard ภาพรวม
│       ├── login/
│       │   └── page.tsx          — Admin Login
│       ├── athletes/
│       │   └── page.tsx          — จัดการรายชื่อนักกีฬา/ใบสมัคร
│       ├── matches/
│       │   └── page.tsx          — จัดการตารางแข่งขัน + แมตช์
│       ├── sport-schedules/
│       │   └── page.tsx          — ตั้งค่าตารางเวลากีฬา (สำหรับเช็คชน)
│       ├── departments/
│       │   └── page.tsx          — จัดการสาขาวิชา + จับคู่สี
│       ├── users/
│       │   └── page.tsx          — จัดการผู้ใช้หลังบ้าน
│       ├── news/
│       │   └── page.tsx          — จัดการข่าวสาร
│       ├── pdf/
│       │   └── page.tsx          — สร้าง/ดาวน์โหลดใบรายชื่อ PDF
│       └── analytics/
│           └── page.tsx          — สถิติเว็บไซต์
│
├── (staff)/
│   ├── layout.tsx                — Staff layout (minimal, mobile-optimized)
│   └── staff/
│       ├── login/
│       │   └── page.tsx          — Staff Login
│       └── scoring/
│           └── page.tsx          — หน้ากรอกคะแนน (เลือกแมตช์ → กรอก → บันทึก)
│
├── api/
│   ├── register/
│   │   └── route.ts              — POST: สมัครนักกีฬา (server-side validation)
│   ├── check-status/
│   │   └── route.ts              — POST: เช็คสถานะ (student_id + phone)
│   └── track/
│       └── route.ts              — POST: บันทึก page view
│
├── layout.tsx                     — Root layout (fonts, meta, analytics tracker)
├── globals.css                    — Design system + Glassmorphism
└── not-found.tsx                  — 404 page
```

---

## 5. Registration Flow (Server-Side Validation)

### API: `POST /api/register`

```
Request Body:
{
  student_id: string,      // รหัสนักศึกษา
  full_name: string,       // ชื่อ-นามสกุล
  department_id: string,   // สาขาวิชา (UUID)
  sport_ids: string[],     // กีฬาที่เลือก (1-2 รายการ)
  phone: string            // เบอร์โทร
}
```

### Validation Chain (ทุกข้อ server-side, ตามลำดับ):

1. **Format Check**: รหัสนักศึกษาต้องตรงรูปแบบ (regex: `^\d{2}-\d{4}-\d{5}$` หรือตามที่ ม.ราชภัฏกำหนด)
2. **Duplicate Check**: `SELECT COUNT(*) FROM athletes WHERE student_id = ?` → ต้อง = 0
3. **Department Exists**: `SELECT * FROM departments WHERE id = ?` → ต้องเจอ
4. **Sport Count**: `sport_ids.length` ต้อง ≥ 1 และ ≤ 2
5. **Sports Exist**: ทุก sport_id ต้องมีอยู่ในตาราง `sports`
6. **Quota Check**: สำหรับแต่ละ sport → นับ registrations ที่ status='registered' ของสีนั้น → ต้อง < `max_players_per_team`
7. **Schedule Conflict**: ถ้าเลือก 2 กีฬา → ดึง `sport_schedules` ของทั้ง 2 กีฬา → เช็คว่ามีช่วงเวลาที่ overlap กันหรือไม่

### Conflict Detection Algorithm:

```
สำหรับแต่ละ schedule ของกีฬา A:
  สำหรับแต่ละ schedule ของกีฬา B:
    ถ้า schedule_date เดียวกัน:
      ถ้า start_time_A < end_time_B AND start_time_B < end_time_A:
        → ชนกัน! ปฏิเสธการสมัคร
```

### Success Flow:

1. สร้าง record ใน `athletes` (team_id = department.team_id)
2. สร้าง 1-2 records ใน `registrations` (status = 'registered')
3. Return success + athlete info + team color

### Error Response:
```json
{
  "success": false,
  "error_code": "SCHEDULE_CONFLICT",
  "message": "กีฬาที่เลือกมีตารางแข่งชนกัน: เซปักตะกร้อ (9 ต.ค. 09:00-12:00) กับ ฟุตซอล (9 ต.ค. 10:00-13:00)"
}
```

---

## 6. Check Status Flow

### API: `POST /api/check-status`

```
Request: { student_id, phone }
Response (ถ้าตรง):
{
  full_name, department_name, team_name, team_color,
  registrations: [
    { sport_name, status, registered_at }
  ]
}
```

### Rate Limiting:
- 10 requests per IP per 10 minutes
- ป้องกันการ brute-force เดาเบอร์โทร

---

## 7. Scoring Flow (Staff)

### Mobile-First UX — 3 ขั้นตอน:

1. **เลือกแมตช์**: แสดง list ของแมตช์ที่ status = 'upcoming' หรือ 'live' เฉพาะกีฬาที่ staff รับผิดชอบ
2. **กรอกผล**: แสดงชื่อสี vs สี, ช่องกรอก score_a / score_b, ปุ่ม "เริ่มแข่ง" (upcoming→live) หรือ "จบแมตช์" (live→finished)
3. **ยืนยัน**: กด confirm → บันทึก → แสดง ✅

### เมื่อ match status = 'finished':
1. คำนวณ points_a, points_b จาก score + sport's point config
2. บันทึกลง matches
3. สร้าง audit_log
4. **Supabase Realtime** broadcast → หน้าสาธารณะ (results + standings) อัปเดตทันที

---

## 8. PDF Generation

### ใช้ jsPDF + jspdf-autotable (client-side ใน admin browser):

**แยกไฟล์ตามคู่ (กีฬา × สี):**
- ชื่อไฟล์: `{กีฬา}_{สี}.pdf` เช่น `ฟุตซอล_สีแดง.pdf`

**Layout:**
- หัวกระดาษ: ชื่องาน, ชื่อกีฬา, สี, วันที่พิมพ์
- คอลัมน์: ลำดับ | ชื่อ-นามสกุล | รหัสนักศึกษา | สาขา | ลายเซ็น
- ใช้ Thai font (THSarabunNew) embed ใน jsPDF

**ปุ่มดาวน์โหลด:**
- แต่ละคู่ (กีฬา × สี) มีปุ่มดาวน์โหลดแยก
- ปุ่ม "ดาวน์โหลดทั้งหมด" → สร้างทุกไฟล์ → รวมเป็น zip (ใช้ JSZip)

---

## 9. Security & Privacy

### 9.1 Row Level Security (RLS)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| teams | public | super_admin | super_admin | super_admin |
| departments | public | super_admin | super_admin | super_admin |
| sports | public | super_admin | super_admin | super_admin |
| sport_schedules | public | super_admin | super_admin | super_admin |
| athletes | public (ไม่รวม phone) | via API only | super_admin | super_admin |
| registrations | public | via API only | super_admin | super_admin |
| matches | public | super_admin | super_admin + assigned staff | super_admin |
| admin_users | authenticated | super_admin | super_admin | super_admin |
| staff_sport_assignments | authenticated | super_admin | super_admin | super_admin |
| announcements | public | super_admin | super_admin | super_admin |
| page_views | super_admin | via API | — | super_admin |
| audit_logs | super_admin | system | — | — |

### 9.2 Athletes Phone Privacy

สร้าง Database View `athletes_public`:
```sql
CREATE VIEW athletes_public AS
SELECT id, student_id, full_name, department_id, team_id, created_at
FROM athletes;
-- ไม่รวม phone column
```

หน้า public ทั้งหมดใช้ view นี้เท่านั้น

### 9.3 Session & Auth

- Supabase Auth จัดการ session
- `inactivityTimeout: 30 นาที` — auto-logout
- Admin Layout component เช็ค session ทุกครั้งที่โหลดหน้า
- ถ้า session หมดอายุ → redirect ไป login

### 9.4 Rate Limiting

ใช้ in-memory rate limiter ใน Next.js middleware:

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/register | 5 requests | 10 min per IP |
| POST /api/check-status | 10 requests | 10 min per IP |
| POST /api/track | 60 requests | 1 min per IP |

### 9.5 PDPA Compliance

- ฟอร์มสมัคร: แสดงข้อความ "ข้อมูลของท่านจะถูกใช้เพื่อการจัดงานกีฬาสานสัมพันธ์เท่านั้น และจะถูกลบภายหลังจบกิจกรรม" + checkbox ยินยอม
- ไม่แสดงเบอร์โทรในหน้าสาธารณะ
- page_views ใช้ hash ไม่เก็บ IP จริง

### 9.6 Audit Trail

ทุกการกระทำที่สำคัญต้องบันทึก audit_log:
- แก้ไขคะแนนแมตช์
- ยกเลิกใบสมัคร
- ลบนักกีฬา
- เปลี่ยนตารางแข่ง
- สร้าง/ลบบัญชีผู้ใช้

### 9.7 HTTPS
- Vercel ให้ HTTPS โดย default
- Force HTTPS redirect ใน next.config.js

### 9.8 Backup
- Supabase มี automatic daily backup (Pro plan)
- เพิ่ม manual backup option: admin กดปุ่ม export ข้อมูลเป็น JSON ได้ตลอด

---

## 10. Realtime Architecture

### Supabase Realtime Subscriptions:

```
หน้า results/page.tsx:
  → subscribe to matches table (INSERT, UPDATE)
  → เมื่อ match อัปเดต → re-render card ของ match นั้น

หน้า standings/page.tsx:
  → subscribe to matches table (UPDATE where status = 'finished')
  → เมื่อ match จบ → re-query team_standings view → re-render ranking
```

### Flow:
```
Staff กรอกคะแนน → Supabase UPDATE matches
                         ↓
              Supabase Realtime broadcast
                         ↓
         ทุก client ที่ subscribe ได้รับ event
                         ↓
         React state update → UI re-render ทันที
```

---

## 11. Design System (Glassmorphism)

### 11.1 Color Palette

```css
/* Primary: Gold-Amber-Orange */
--gold-50: #fffbeb;     --gold-100: #fef3c7;
--gold-200: #fde68a;    --gold-300: #fcd34d;
--gold-400: #fbbf24;    --gold-500: #f59e0b;
--gold-600: #d97706;    --gold-700: #b45309;

/* Accent: Blue */
--blue-400: #60a5fa;    --blue-500: #3b82f6;
--blue-600: #2563eb;    --blue-700: #1d4ed8;

/* Secondary Accent: Green */
--green-400: #4ade80;   --green-500: #22c55e;

/* Neutrals */
--gray-50: #fafafa;     --gray-100: #f4f4f5;
--gray-800: #27272a;    --gray-900: #18181b;

/* Team Colors */
--team-red: #ef4444;
--team-blue: #3b82f6;
--team-green: #22c55e;
--team-yellow: #eab308;
```

### 11.2 Glass Card

```css
.glass-card {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}
```

### 11.3 Background

พื้นหลังใช้ gradient mesh:
```css
body {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 30%, #b45309 60%, #92400e 100%);
  background-attachment: fixed;
}
```

เพิ่ม animated gradient orbs เป็น decorative elements

### 11.4 Typography

ใช้ Google Fonts: **Inter** (หัวข้อ) + **Sarabun** (เนื้อหาภาษาไทย)

### 11.5 Responsive Breakpoints

```css
/* Mobile-first */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### 11.6 Animations

- Page transitions: fade-in + slide-up (CSS @keyframes)
- Card hover: subtle scale(1.02) + shadow increase
- Score update: pulse animation เมื่อมีการอัปเดตสกอร์
- Status badge: glow animation สำหรับ "กำลังแข่ง"
- Skeleton loading states

---

## 12. Analytics Dashboard (Built-in)

### Data Collection:

ทุกหน้า public มี invisible tracker:
```javascript
// ส่ง POST /api/track เมื่อโหลดหน้า
{
  page_path: window.location.pathname,
  device_type: detectDevice(), // mobile/tablet/desktop จาก screen width + UA
  visitor_hash: generateHash(ip + userAgent) // สร้างฝั่ง server
}
```

### Dashboard Widgets (Admin):

1. **ผู้เข้าชมรวม / ไม่ซ้ำ วันนี้** — card แสดงตัวเลข
2. **กราฟการเข้าชมตลอดงาน** — line chart (ใช้ Chart.js หรือ recharts)
3. **หน้าที่ถูกดูเยอะสุด** — bar chart / table
4. **สัดส่วนอุปกรณ์** — pie chart (mobile vs tablet vs desktop)

---

## 13. Component Architecture

### Shared Components:
- `Navbar` — responsive navigation, hamburger menu on mobile
- `Footer` — ข้อมูลผู้จัด, ลิงก์
- `GlassCard` — reusable glass card wrapper
- `TeamBadge` — แสดงชื่อสี + สัญลักษณ์สี
- `StatusBadge` — สถานะแมตช์ (upcoming/live/finished)
- `MatchCard` — แสดงข้อมูลแมตช์ + score
- `LoadingSkeleton` — skeleton loading
- `Modal` — reusable modal dialog
- `DataTable` — sortable, searchable table (admin)
- `Toast` — notification toast

### Page-Specific Components:
- `HeroSection` — หน้าแรก hero banner
- `QuickLinks` — ลิงก์ลัดหน้าแรก
- `RegistrationForm` — ฟอร์มสมัคร + validation UI
- `ScoreInput` — หน้ากรอกคะแนน (staff)
- `StandingsTable` — ตารางอันดับ
- `ScheduleGrid` — ตารางแข่งขัน (filter by day/sport)
- `PdfGenerator` — สร้าง/ดาวน์โหลด PDF

---

## 14. Error Handling

### Client-Side:
- Form validation errors แสดงใต้ field ที่ผิด (inline)
- API errors แสดงเป็น toast notification
- Network errors แสดง retry button

### Server-Side:
- ทุก API route มี try-catch wrapper
- Error responses เป็น JSON format เสมอ: `{ success: false, error_code, message }`
- 429 Too Many Requests สำหรับ rate limit exceeded
- 401/403 สำหรับ auth errors

### Error Codes:
| Code | Description |
|------|------------|
| INVALID_STUDENT_ID | รูปแบบรหัสนักศึกษาไม่ถูกต้อง |
| DUPLICATE_REGISTRATION | รหัสนักศึกษานี้สมัครแล้ว |
| INVALID_DEPARTMENT | สาขาวิชาไม่ถูกต้อง |
| QUOTA_FULL | โควตาของกีฬานี้เต็มแล้ว |
| SCHEDULE_CONFLICT | ตารางเวลากีฬาที่เลือกชนกัน |
| TOO_MANY_SPORTS | เลือกกีฬาเกิน 2 รายการ |
| RATE_LIMITED | ส่งคำขอบ่อยเกินไป กรุณารอสักครู่ |
| UNAUTHORIZED | ไม่มีสิทธิ์เข้าถึง |
| NOT_FOUND | ไม่พบข้อมูล |

---

## 15. Data Seeding

### Initial Data ที่ต้องมีก่อนเปิดระบบ:

1. **4 สี** (teams): แดง, น้ำเงิน, เขียว, เหลือง (ชื่อ + hex)
2. **สาขาวิชาทั้งหมด** (departments) + mapping ไปยัง team
3. **6 กีฬา** (sports) + max_players_per_team + point config
4. **ตารางเวลากีฬา** (sport_schedules) — ต้องตั้งก่อนเปิดรับสมัคร
5. **ตารางแข่งขัน** (matches) — แมตช์ทั้งหมด
6. **บัญชี super_admin** อย่างน้อย 1 บัญชี

### Seeding Strategy:
- สร้าง SQL seed script สำหรับข้อมูลเริ่มต้น (teams, sports)
- สาขาวิชา + mapping สี → ตั้งค่าผ่าน admin UI
- ตารางแข่งขัน → สร้างผ่าน admin UI

---

## 16. Project File Structure

```
Webforsport/
├── docs/
│   └── specs/
│       └── 2026-09-19-sci-games-design.md  ← (this file)
├── src/
│   ├── app/
│   │   ├── (public)/...
│   │   ├── (admin)/...
│   │   ├── (staff)/...
│   │   ├── api/...
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/              — Reusable UI components
│   │   ├── public/          — Public page components
│   │   ├── admin/           — Admin page components
│   │   └── staff/           — Staff page components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts    — Browser Supabase client
│   │   │   ├── server.ts    — Server Supabase client
│   │   │   └── middleware.ts — Auth middleware helper
│   │   ├── validation.ts    — Server-side validation functions
│   │   ├── rate-limit.ts    — Rate limiter
│   │   ├── pdf.ts           — PDF generation helpers
│   │   ├── analytics.ts     — Analytics tracking helpers
│   │   └── utils.ts         — General utilities
│   ├── hooks/
│   │   ├── useRealtime.ts   — Supabase realtime hook
│   │   └── useAuth.ts       — Auth state hook
│   └── types/
│       └── database.ts      — TypeScript types (auto-generated from Supabase)
├── supabase/
│   ├── migrations/          — Database migration files
│   ├── seed.sql             — Initial data
│   └── config.toml          — Supabase local config
├── public/
│   └── fonts/               — THSarabunNew for PDF
├── next.config.js
├── package.json
├── .env.local               — Supabase keys (gitignored)
└── README.md
```
