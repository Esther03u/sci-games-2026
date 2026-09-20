# Sci Games 2026 — ระบบเว็บไซต์กีฬาสานสัมพันธ์ภายใน
### คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต (PKRU)

เว็บไซต์สำหรับงานกีฬาสานสัมพันธ์ภายใน 9 - 11 ตุลาคม 2569 สร้างด้วย **Next.js (App Router)**, **Vanilla CSS (Glassmorphism)**, และ **Supabase (PostgreSQL + Auth + Realtime)**

---

## 🌟 จุดเด่นและฟังก์ชันการทำงานหลัก

1. **ระบบสาธารณะ (Public Spectators):**
   - 🏆 **หน้าแรก (Home):** ไฮไลต์การแข่งขัน, ประกาศปักหมุด, สรุปอันดับคะแนน 4 สี, ลิงก์ลัด
   - 📅 **ตารางแข่งขัน (Schedule):** กรองตามวันแข่ง (9, 10, 11 ต.ค.) และกรองตามชนิดกีฬา 6 รายการ
   - ⚡ **ผลการแข่งขันสด (Live Results):** อัปเดตคะแนนสดเรียลไทม์ผ่าน WebSocket (Supabase Realtime) พร้อมแอนิเมชันคะแนน
   - 🏆 **ตารางคะแนนรวม (Standings):** คำนวณแต้มสะสม ชนะ (+3) เสมอ (+1) แพ้ (+0) อัตโนมัติด้วย PostgreSQL Database Function & Triggers
   - 🏃 **ทำเนียบนักกีฬา (Athletes Roster):** ค้นหาและกรองตามชนิดกีฬา/สี (ไม่เปิดเผยเบอร์โทรศัพท์ตามหลัก PDPA)
   - 📢 **ข่าวประชาสัมพันธ์ (News):** ประกาศทางการ กฎกติกา และระเบียบการแข่งขัน
   - 📝 **ระบบลงทะเบียนนักกีฬา (Registration):** ตรวจสอบรหัสนักศึกษา, จับคู่สาขา ↔ สีอัตโนมัติ, ตรวจสอบโควตา และป้องกันตารางแข่งชนกัน
   - 🔍 **ตรวจสอบสถานะ (Check Status):** ค้นหาด้วยรหัสนักศึกษาและเบอร์โทรศัพท์ที่ใช้สมัคร

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
     2. กดปุ่ม +/- บันทึกผลคะแนนสด
     3. ตรวจสอบสรุปผลและกดยืนยันการจบแมตช์ (ระบบจะกระจายผลสู่หน้าเว็บทันทีแบบ Realtime)

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
2. คัดลอกเนื้อหาจาก [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql) แล้วกด **Run**
3. คัดลอกเนื้อหาจาก [`supabase/seed.sql`](./supabase/seed.sql) แล้วกด **Run** เพื่อนำเข้าข้อมูล 4 ทีมสี และ 6 ชนิดกีฬา

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
4. กด **Deploy**

---

© 2569 สโมสรนักศึกษาคณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต
