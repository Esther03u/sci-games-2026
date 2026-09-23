# Runbook วันแข่ง — Sci Games 2026 (9–11 ต.ค. 2569)

คู่มือหน้างานสำหรับคนคุมระบบ ใช้คู่กับ `Handoff.md` (สถานะโปรเจกต์) — อัปเดตเมื่อขั้นตอนเปลี่ยน

Production: **https://sci-games-2026.vercel.app** · Supabase project `iihkmdtawhosijuzbkwd` (**Free tier** — ดู §5 ข้อจำกัด)

## 1. ใครเห็นอะไร

| คน | หน้า | เห็นคะแนนสดไหม |
|---|---|---|
| ผู้ชมทั่วไป | `/results`, `/schedule`, `/news`, `/`, `/handbook` | **ไม่** — แมตช์ที่กำลังแข่งขึ้นแค่ "กำลังแข่ง" คะแนนโผล่เมื่อกดจบแมตช์ (กันถึงระดับฐานข้อมูลแล้ว: migration 007+008 — เปิด view-source หรือยิง API ด้วย anon key ก็ไม่เห็น) |
| กรรมการ (PIN) / เจ้าหน้าที่ / แอดมิน | `/live`, `/live/[กีฬา]` | เห็น (ต้องล็อกอินก่อน — ไม่ล็อกอินจะเด้งไป `/staff/login`) |
| กรรมการหน้าสนาม | `/staff/scoring` | เห็นเฉพาะกีฬาที่ได้รับมอบหมาย |
| แอดมิน | `/admin/live` (Live Monitor) | เห็นทุกสนาม + ใครกดคะแนนล่าสุด + แก้ไขได้ |

## 2. ก่อนวันงาน (ทำครั้งเดียว)

1. **สร้าง PIN ให้กรรมการรายกีฬา** — `/admin/pins` → เลือกกีฬา + ตั้งชื่อ (เช่น "ฟุตซอล สนาม 1") → ระบบ**แสดง PIN ครั้งเดียว** (เก็บเฉพาะ hash) จดหรือถ่ายรูปไว้ แจกพร้อม QR ในหน้าเดียวกัน
2. **ทดสอบ 1 คู่** — ให้กรรมการสแกน QR → กรอก PIN → `/staff/scoring` → กด +1 / −1 / undo ดูว่าคะแนนขึ้นที่ `/admin/live`
3. **ลบ PIN ทดสอบ** ที่ไม่ใช้ (ปุ่มปิดในหน้า `/admin/pins`)
4. ตรวจว่าตารางแข่งใน `/schedule` ตรงสูจิบัตร (44 คู่) — แก้ได้ที่ `/admin/matches`

## 3. ระหว่างวัน

**กรรมการ:** เปิด `/staff/scoring` → เลือกคู่ → **เริ่มแมตช์** → กด +1 ทุกครั้งที่ได้แต้ม → **จบแมตช์** (กีฬาเซตต้องกดจบเซตก่อน) — กดผิดกด undo ได้ทันที และยังแก้ได้ภายใน **10 นาที** หลังจบแมตช์

**คนคุมระบบ:** เปิด `/admin/live` ค้างไว้ 1 จอ

| อาการ | ทำอะไร |
|---|---|
| คะแนนไม่ขึ้นบนจอกรรมการ | ดูแถบสถานะบนหน้า — ถ้าขึ้น "โหมดสำรอง" แปลว่า Realtime หลุด ระบบรีเฟรชเองทุก 15 วิ ใช้งานต่อได้ |
| กรรมการลืม PIN | สร้างใหม่ที่ `/admin/pins` (ของเก่ากดปิด) — ดู PIN เดิมไม่ได้ |
| กดคะแนนผิดและเกิน 10 นาที | แอดมินแก้ที่ `/admin/live` → ปุ่มแก้ไขคะแนน (บันทึกลง audit log) |
| จบแมตช์ผิดคู่ | `/admin/live` → เปิดแมตช์ใหม่ (reopen) แล้วแก้ |
| ผู้ชมบอกว่าเห็นคะแนนก่อนจบ | ผิดปกติ — ดู §1 แล้วแจ้งทีมพัฒนา |
| หน้าเว็บล่ม / ขึ้น error | ดู Vercel → Deployments → Logs; DB ดูที่ Supabase → Logs |

**ผู้ชม** ดูที่ `/results` — หน้าอัปเดตเองทุก 30 วินาที (ไม่ต้องรีเฟรช)

## 4. ตรวจสุขภาพระบบ (จากเครื่องที่มี repo + `.env.local`)

```bash
npm run check:supabase                                   # ตาราง/ฟังก์ชัน/นโยบายครบไหม
node scripts/smoke-test.mjs https://sci-games-2026.vercel.app   # E2E 52 checks (สร้าง/ลบข้อมูลทดสอบเอง)
```

`smoke-test` ปลอดภัยกับข้อมูลจริง: สร้างแอดมิน/PIN/แมตช์ชั่วคราวแล้วลบทิ้งทั้งหมดเมื่อจบ

## 5. ข้อจำกัด Free tier ที่ต้องรู้

- **Realtime 200 connections พร้อมกัน** — `/results` (หน้าผู้ชม) จึงไม่ใช้ Realtime แล้ว ใช้การรีเฟรชทุก 30 วิแทน; Realtime เหลือไว้ให้ `/live` และ `/admin/live` (คนไม่กี่คน)
- **Egress 5 GB/เดือน** — ดูใน Supabase → Settings → Usage ระหว่างวันงาน ถ้าใกล้เต็มให้ลดความถี่ (ดู `SPECTATOR_POLL_MS` ใน `src/hooks/useLiveScores.js`)
- หน้า `/schedule` และ `/news` เป็น ISR (cache 30 วิที่ Vercel) — คนเข้าเยอะไม่กระทบ DB

## 6. เบอร์/ลิงก์ที่ต้องใช้

- Production: https://sci-games-2026.vercel.app · Admin: `/admin/login`
- Vercel: https://vercel.com (เจ้าของโปรเจกต์คือผู้ตั้งค่า deploy)
- Supabase: https://supabase.com/dashboard/project/iihkmdtawhosijuzbkwd
- Repo: https://github.com/Esther03u/sci-games-2026

## 7. การ deploy (Hobby plan)

Vercel อยู่บน Hobby + repo private → **commit ที่ผู้ช่วย AI เป็น author จะไม่ trigger deploy** ต้องให้เจ้าของ repo (Esther03u) push ตามหลัง (commit เปล่าก็พอ):

```bash
git pull && git commit --allow-empty -m "chore: trigger deploy" && git push
```
