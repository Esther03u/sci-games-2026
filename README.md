# Sci Games 2026 — ระบบเว็บไซต์กีฬาสานสัมพันธ์ภายใน
### คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต (PKRU)

เว็บไซต์สำหรับงานกีฬาสานสัมพันธ์ภายใน 9 - 11 ตุลาคม 2569 สร้างด้วย **Next.js (App Router)**, **Vanilla CSS (Glassmorphism)**, และ **Supabase (PostgreSQL + Auth + Realtime)**

---

## 🌟 จุดเด่นและฟังก์ชันการทำงานหลัก

1. **ระบบสาธารณะ (Public Spectators):**
   - 🏆 **หน้าแรก (Home):** ไฮไลต์การแข่งขัน, ประกาศปักหมุด, สรุปอันดับคะแนน 4 สี, ลิงก์ลัด
   - 📅 **ตารางแข่งขัน (Schedule):** กรองตามวันแข่ง (9, 10, 11 ต.ค.) และกรองตามชนิดกีฬา 5 รายการ (ฟุตซอล, วอลเลย์บอล, เซปักตะกร้อ, บาสเกตบอล, เปตอง)
   - 🏁 **ผลการแข่งขัน (Results):** ตัวกรองกีฬา/สถานะ/ประเภท — แมตช์ที่กำลังแข่งแสดงเพียงสถานะ "กำลังแข่ง" **ไม่เปิดเผยคะแนนจนกว่าจะจบแมตช์** (บังคับถึงระดับฐานข้อมูล: view `matches_public` + RLS ใน migration 007/008) หน้าอัปเดตเองทุก 30 วินาทีผ่าน `/api/live-summary` ที่แคชไว้ที่ edge
   - 📕 **สูจิบัตรและกำหนดการ (`/handbook`):** ดาวน์โหลด/พรีวิวไฟล์ PDF ทางการ (`public/docs/`)
   - 🔴 **ผลสด (`/live`) — เฉพาะผู้ล็อกอิน:** บอร์ดคะแนนสดทุกสนามสำหรับกรรมการ/เจ้าหน้าที่/ผู้ดูแล (Supabase Realtime + ลูกศรแจ้งเมื่อได้แต้ม); ผู้ชมทั่วไปจะถูกส่งไปหน้าเข้าสู่ระบบ
   - 🏆 **คะแนนรวม:** คำนวณแต้มสะสม ชนะ (+3) เสมอ (+1) แพ้ (+0) อัตโนมัติด้วย PostgreSQL Function & Triggers (view `team_standings` แสดงบนหน้าแรก)
   - 📢 **ข่าวประชาสัมพันธ์ (News):** ประกาศทางการ กฎกติกา และระเบียบการแข่งขัน
   - 📝 **ระบบลงทะเบียนนักกีฬา (Registration):** ตรวจสอบรหัสนักศึกษา, จับคู่สาขา ↔ สีอัตโนมัติ, ตรวจสอบโควตา และป้องกันตารางแข่งชนกัน
   - 🔍 **ตรวจสอบสถานะ (Check Status):** ค้นหาด้วยรหัสนักศึกษาและเบอร์โทรศัพท์ที่ใช้สมัคร
   - 🔑 **ทางเข้าผู้ลงคะแนน:** ลิงก์ "เข้าสู่ระบบกรรมการ" ที่ footer → `/staff/login` (เข้าด้วย PIN 6 หลักรายกีฬา หรือบัญชี staff/admin)

2. **ระบบผู้ดูแลระบบ (Admin Dashboard):**
   - 🛡️ **เข้าสู่ระบบผู้ดูแล (Admin Login):** ระบบตรวจสิทธิ์และตัดเซสชันอัตโนมัติหากไม่มีการใช้งาน 30 นาที
   - 📊 **แดชบอร์ดสรุปสถิติ (Dashboard):** การนับผู้สมัคร, แมตช์วันนี้, ความคืบหน้าการแข่งขัน
   - 🏃 **จัดการนักกีฬา (Athletes Management):** ดูรายละเอียด, ยกเลิกการสมัคร, ลบข้อมูล
   - ⚽ **จัดการแมตช์แข่งขัน (Match Management):** สร้างแมตช์, บันทึกผลคะแนน, กำหนดสถานะ
   - ⏰ **กำหนดเวลาแข่งขัน (Sport Schedules):** กำหนดช่วงเวลาแข่งของแต่ละกีฬาเพื่อตรวจตารางชน
   - 🏫 **จับคู่สาขาวิชา ↔ ทีมสี (Department Mapper):** เพิ่ม/แก้ไข/ลบ สาขาวิชาและสีที่สังกัด
   - 📢 **จัดการข่าวสาร (News Management):** สร้าง/แก้ไข/ปักหมุด ข่าวประชาสัมพันธ์
   - 👥 **จัดการผู้ใช้งาน (User Management):** สร้างบัญชี Super Admin และ Staff พร้อมกำหนดชนิดกีฬาที่ได้รับมอบหมาย
   - 📄 **ส่งออกใบรายชื่อ (PDF Generation):** ดาวน์โหลด PDF รายการเดี่ยว หรือดาวน์โหลดรวมทุกรายการเป็นไฟล์ ZIP มาตรฐาน A4 พร้อมช่องลงชื่อ
   - 📈 **สถิติผู้เข้าชมเว็บไซต์ (Website Analytics):** กราฟแนวโน้มการเข้าชม, สัดส่วนอุปกรณ์ (Mobile/Desktop), และหน้ายอดนิยม (Chart.js)

3. **ระบบเจ้าหน้าที่ลงคะแนนในสนาม (Staff Scoring):**
   - ⏱️ **Mobile-first Scoring Flow (3 ขั้นตอน):**
     1. เลือกแมตช์ที่เปิดให้ลงคะแนน (แสดงเฉพาะชนิดกีฬาที่ได้รับมอบหมาย)
     2. กดปุ่ม +/- บันทึกผลคะแนนสด (คิวแบบ optimistic + undo; แก้ย้อนหลังได้ภายในเวลาที่ตั้งใน `/admin/settings`)
     3. ตรวจสอบสรุปผลและกดยืนยันการจบแมตช์ — คะแนนจึงจะเผยแพร่สู่หน้าผู้ชม
   - 🔐 **เข้าระบบ 2 ทาง:** PIN 6 หลักรายกีฬา (สแกน QR จาก `/admin/pins` — เซสชัน 14 ชม.) หรือบัญชี staff/admin
   - 🛑 **สวิตช์ฉุกเฉิน:** ปิด `live_scoring_enabled` ใน `/admin/settings` แล้วกรรมการ/เจ้าหน้าที่จะลงคะแนนไม่ได้ทันที (ผู้ดูแลยังแก้ได้)

---

## 🛠️ ขั้นตอนการติดตั้งและเริ่มต้นใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. กำหนดค่าตัวแปรสภาพแวดล้อม (.env.local)
คัดลอกไฟล์ตัวอย่าง `.env.local.example` เป็น `.env.local`:
```bash
cp .env.local.example .env.local
```
ระบุค่าจาก Supabase Project Settings:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. รันฐานข้อมูลใน Supabase SQL Editor
1. เข้าไปที่ **Supabase Dashboard** → **SQL Editor**
2. รันไฟล์ใน [`supabase/`](./supabase) ตามลำดับ: `migrations/001_initial_schema.sql` → `seed.sql` (4 ทีมสี, 5 ชนิดกีฬา, สาขา, ช่วงเวลาแข่ง) → `migrations/002…008` ทุกไฟล์เป็น idempotent รันซ้ำได้ (007 = view `matches_public`, 008 = ตัดสิทธิ์ anon อ่านคะแนนสด — **รัน 008 หลัง deploy โค้ดที่อ่าน view แล้วเท่านั้น**)
   - หรือรวมเป็นไฟล์เดียวแล้ววางครั้งเดียว (ไฟล์นี้ gitignored):
     ```bash
     { for f in supabase/migrations/001_initial_schema.sql supabase/seed.sql supabase/migrations/00[2-9]_*.sql; do printf '\n-- >>>>>>>>>> %s\n' "$f"; cat "$f"; done; } > supabase/apply-all.sql
     ```
3. นำเข้าตารางแข่ง 44 คู่จากสูจิบัตร: `npm run seed:matches` (ลอง `-- --dry` ก่อน)
4. สร้างบัญชีผู้ดูแล: `node scripts/create-admin.mjs <email> <password>`

### 4. รันโปรเจกต์ในโหมดพัฒนา (Development)
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่: [http://localhost:3000](http://localhost:3000)

### 5. บิลด์สำหรับ Production
```bash
npm run build
npm run start
```

---

## 🚀 การ Deploy บน Vercel
1. นำโค้ดขึ้น GitHub Repository
2. เข้าสู่ระบบ [Vercel](https://vercel.com) แล้วกด **Add New Project**
3. ใส่ Environment Variables ใน Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PIN_SESSION_SECRET` (สุ่มยาว ๆ ใช้เซ็น cookie ของกรรมการที่ล็อกอินด้วย PIN)
4. กด **Deploy**

---

## 🧪 การทดสอบ
| คำสั่ง | ทดสอบอะไร |
|---|---|
| `npm test` | Vitest — helper ล้วน (format, labels, scoring queue, filters, API mappers) |
| `npm run test:db` | รัน migration + seed + scenario ทั้งหมดบน PostgreSQL ในเครื่อง (ต้องมี `PGPASSWORD`) |
| `npm run test:smoke` | ยิง API จริงผ่าน dev server ที่ :3000 กับ Supabase จริง (สร้าง/ลบข้อมูลทดสอบเอง) |
| `npm run lint` / `npm run format:check` | ESLint / Prettier ทั้ง repo |

---

© 2569 สโมสรนักศึกษาคณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต
