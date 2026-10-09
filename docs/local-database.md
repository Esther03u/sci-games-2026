# ฐานข้อมูลทดสอบบนเครื่อง (Local Supabase)

ใช้ทดสอบระบบโดยไม่แตะข้อมูลจริงบน production — รัน Supabase ทั้งชุด (Postgres + Auth + REST + Realtime + Studio) ใน Docker แล้วคัดลอกข้อมูลจริงมาไว้

## ต้องมี
- Docker Desktop (เปิดไว้)
- PostgreSQL client (`psql`) — สคริปต์หา `C:\Program Files\PostgreSQL\17\bin\psql.exe` ให้เอง
- `.env.local` ของ production (ใช้ *อ่าน* ข้อมูลอย่างเดียว)

## ครั้งแรก
```bash
npm run db:local:start      # ดึง image + สร้าง DB จาก supabase/migrations + seed.sql
npm run db:local:clone      # คัดลอกข้อมูลจาก production → local (อ่าน prod อย่างเดียว)
```
แล้วสร้าง `.env.development.local` (gitignored) จากค่าที่ `npx supabase@2 status -o env` แสดง:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
PIN_SESSION_SECRET=<คัดลอกจาก .env.local ได้>
PIN_ENCRYPTION_KEY=<คัดลอกจาก .env.local — ให้ปุ่ม "ดู PIN" ถอดรหัส PIN ที่คัดลอกมาได้>
```
**`npm run dev` อ่าน `.env.development.local` ก่อน `.env.local`** → ตราบใดที่ไฟล์นี้อยู่ dev server จะใช้ฐานข้อมูลบนเครื่อง (ลบหรือเปลี่ยนชื่อไฟล์เมื่ออยากกลับไปใช้ production) · `npm run build` / `next start` ยังอ่าน `.env.local`

สร้างแอดมินสำหรับ local (บัญชีแอดมินจริงไม่ถูกคัดลอก):
```bash
ENV_FILE=.env.development.local node scripts/create-admin.mjs <email> <password>
```
สคริปต์ใน `scripts/` ทุกตัวใช้ `ENV_FILE=.env.development.local` ชี้ไป local ได้เหมือนกัน

## ใช้ประจำ
| คำสั่ง | ทำอะไร |
|---|---|
| `npm run db:local:clone` | ดึงข้อมูลล่าสุดจาก production มาทับ local (ข้อมูลทดสอบใน local หายหมด) |
| `npm run db:local:stop` | ปิด container (ข้อมูลยังอยู่) |
| `npx supabase@2 db reset` | ล้าง local แล้วสร้างใหม่จาก migrations + seed (จากนั้น clone ใหม่ได้) |
| http://127.0.0.1:54323 | Supabase Studio ของ local |

## สิ่งที่คัดลอก / ไม่คัดลอก
- ✅ teams, departments, sports, sport_schedules, athletes, registrations, matches, match_sets, score_events, sport_pins, announcements, app_settings
- ❌ admin_users, staff_sport_assignments, audit_logs (ผูกกับบัญชีใน Auth ของ production), page_views, rate_limits
- คอลัมน์ที่ชี้ไป admin_users ถูกตั้งเป็น `null`; `sport_pins.active_session_id` ถูกล้าง → PIN เดิมล็อกอินบน local ได้โดยไม่เตะเครื่องที่ใช้งานจริง
- ระหว่างโหลดใช้ `session_replication_role = replica` → trigger (audit, เลื่อนสายแข่ง, คิดแต้ม) ไม่ทำงานซ้ำกับข้อมูลที่คัดลอก
