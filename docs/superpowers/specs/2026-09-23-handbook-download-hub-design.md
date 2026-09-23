# Design Spec: Sci Games 2026 Handbook & Schedule Download Hub

- **Status**: Draft / Under Review
- **Author**: Antigravity Assistant & Project Team
- **Date**: 2026-09-23
- **Topic**: Handbook, Rules, & Ceremony Schedule Download Hub (`/handbook`)

---

## 1. Overview & Objectives

Sci Games 2026 (กีฬาสานสัมพันธ์ คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต 9 - 11 ตุลาคม 2569) มีเอกสารทางการ 2 ฉบับหลัก:
1. **สูจิบัตรการแข่งขันฉบับสมบูรณ์ (Official Handbook)**: 20 หน้า บรรจุคำนำ, สารบัญ, ระเบียบและกติกา 5 ชนิดกีฬา (ฟุตซอล, วอลเลย์บอล, เซปักตะกร้อ, บาสเกตบอล, เปตอง), คุณสมบัตินักกีฬา, การแต่งกาย, การประท้วง และตารางเวลาแข่งขัน
2. **กำหนดการแข่งขันและพิธีการ (Official Schedule & Ceremony Program)**: 3 หน้า บรรจุไทม์ไลน์รายวัน ตั้งแต่วันศุกร์ที่ 9 ถึงวันอาทิตย์ที่ 11 ต.ค. 2569 รวมถึงพิธีเปิด, การจุดพลุ, กิจกรรมวอลเลย์บอลยักษ์อาจารย์+สโมสร, รอบชิงชนะเลิศ, พิธีมอบรางวัลและพิธีปิด

**วัตถุประสงค์:**
จัดทำระบบ "ศูนย์ดาวน์โหลดสูจิบัตรและกำหนดการ (Handbook & Schedule Hub)" บนเว็บไซต์ เพื่อให้นักศึกษา อาจารย์ เจ้าหน้าที่ และบุคคลทั่วไป สามารถเข้ามาอ่านสรุปข้อมูล, เปิดพรีวิวเอกสารตัวอย่างบนเบราว์เซอร์ได้ทันที และดาวน์โหลดไฟล์ PDF ต้นฉบับจริงได้อย่างสะดวกรวดเร็ว ทั้งบนคอมพิวเตอร์และโทรศัพท์มือถือ

---

## 2. File Assets & Data Structure

### 2.1 Static PDF Assets
จัดเก็บไฟล์ PDF ทางการไว้ที่โฟลเดอร์ `public/docs/`:
- `public/docs/sci-games-2026-handbook.pdf` (คัดลอกมาจากไฟล์ต้นฉบับ `สูจิบัตร69.pdf` ขนาด 20 หน้า)
- `public/docs/sci-games-2026-schedule.pdf` (คัดลอกมาจากไฟล์ต้นฉบับ `กำหนดการ69.pdf` ขนาด 3 หน้า)

การจัดเก็บใน `public/` ทำให้ผู้ใช้สามารถดาวน์โหลดไฟล์ได้แบบความเร็วสูง (Direct Download / Static file serving) ไม่ต้องเรียกผ่าน API หรือฐานข้อมูล

### 2.2 Document Metadata (`src/data/documents.js`)
สร้างโมดูลข้อมูลกลางเพื่อรวบรวมรายละเอียดเอกสาร:
```javascript
export const OFFICIAL_DOCUMENTS = [
  {
    id: 'handbook-2026',
    title: 'สูจิบัตรการแข่งขัน Sci Games 2026',
    titleEn: 'Official Tournament Handbook 2026',
    category: 'สูจิบัตรทางการ',
    badge: 'ฉบับสมบูรณ์',
    pages: 20,
    fileSize: '3.8 MB',
    format: 'PDF',
    updatedAt: '2026-10-01',
    downloadUrl: '/docs/sci-games-2026-handbook.pdf',
    fileName: 'SciGames2026-Handbook.pdf',
    description: 'รวบรวมระเบียบ กติกา และตารางการแข่งขันกีฬา 5 ชนิด พร้อมข้อกำหนดคุณสมบัตินักกีฬา',
    highlights: [
      'ระเบียบการแข่งขันฟุตซอล, วอลเลย์บอล, ตะกร้อ, บาสเกตบอล, เปตอง',
      'คุณสมบัติและจำนวนนักกีฬาแต่ละประเภท',
      'ข้อกำหนดการแต่งกายและอุปกรณ์ที่อนุญาต',
      'ขั้นตอนการรายงานตัวและการยื่นประท้วง',
    ],
  },
  {
    id: 'schedule-2026',
    title: 'กำหนดการแข่งขันและพิธีการ',
    titleEn: 'Schedule & Ceremony Program 2026',
    category: 'กำหนดการ',
    badge: 'ไทม์ไลน์ทางการ',
    pages: 3,
    fileSize: '650 KB',
    format: 'PDF',
    updatedAt: '2026-10-01',
    downloadUrl: '/docs/sci-games-2026-schedule.pdf',
    fileName: 'SciGames2026-Schedule.pdf',
    description: 'กำหนดการแข่งขันประจำวัน ลำดับพิธีเปิด-ปิด และกิจกรรมเชื่อมสัมพันธ์อาจารย์-นักศึกษา',
    highlights: [
      'วันศุกร์ 9 ต.ค.: เปตอง, ตะกร้อ, วอลเลย์บอล, บาส, ฟุตซอล (รอบแรก)',
      'วันเสาร์ 10 ต.ค.: การแข่งขันรอบแรกและรอบชิงอันดับ 3 ทุกชนิดกีฬา',
      'วันอาทิตย์ 11 ต.ค.: พิธีเปิด (09:00 น.), วอลเลย์บอลยักษ์, รอบชิงชนะเลิศ, พิธีปิดและมอบรางวัล',
    ],
  },
];
```

---

## 3. UI Components & Architecture

### 3.1 Routing & Navigation
- **New Page Route**: `src/app/(public)/handbook/page.js`
- **Navigation Integration**:
  - `src/components/public/Navbar.js`: เพิ่มเมนู "สูจิบัตร" (`/handbook`) ใน Desktop Navigation Bar
  - `src/components/public/QuickLinks.js`: ปรับการ์ดลิงก์หน้าแรกเพื่อเชื่อมโยงสู่หน้าสูจิบัตรและกำหนดการ
  - `src/components/public/Footer.js`: เพิ่มลิงก์ "สูจิบัตรและกำหนดการ"

### 3.2 Page Components
1. **`src/app/(public)/handbook/page.js`**
   - Server Component พร้อม SEO Metadata (`title: 'สูจิบัตรและกำหนดการแข่งขัน | Sci Games 2026'`)
   - เรียกใช้ `HandbookHub` (Client Component)
2. **`src/components/public/HandbookHub.js`**
   - Header Section: Icon, Title, Subtitle
   - Document Cards Grid: แสดงการ์ดทั้ง 2 ฉบับในสไตล์ Glassmorphism
   - Action Buttons:
     - ปุ่ม "ดาวน์โหลด PDF" (Primary Button พร้อม `download` attribute)
     - ปุ่ม "เปิดอ่านตัวอย่าง" (Secondary Button เปิด Preview Modal)
     - ปุ่ม "เปิดในแท็บใหม่" (External Link)
   - Quick Facts & Sports Summary Section: แสดงสรุป 5 ชนิดกีฬา สนามแข่งขัน และวันเวลา
3. **`src/components/public/DocumentPreviewModal.js`**
   - Modal หน้าต่างขนาดใหญ่แสดงตัวอย่างเอกสารผ่าน iframe/object
   - Header Bar: ชื่อเอกสาร, ปุ่มดาวน์โหลด, ปุ่มเปิดแท็บใหม่, ปุ่มปิด [X]
   - Fallback button สำหรับเบราว์เซอร์มือถือที่ไม่รองรับ inline PDF preview

---

## 4. Testing & Verification Plan

1. **Static Build & Lint**:
   - `npm run lint` — ผ่าน 0 error
   - `npm run build` — ตรวจสอบว่า route `/handbook` build สำเร็จแบบ SSG / ISR
2. **Responsive Design Verification**:
   - ตรวจสอบการแสดงผลบนขนาดหน้าจอมือถือ (375px) และ Desktop (1280px+)
   - ตรวจสอบปุ่มดาวน์โหลดว่า trigger file download ได้อย่างถูกต้อง
   - ตรวจสอบ Modal preview และการปิด modal (ปุ่มปิด / ESC key / Backdrop click)
3. **Existing Tests & Regressions**:
   - รัน `npm test` เพื่อให้มั่นใจว่าไม่กระทบ unit tests เดิม (51 tests)
