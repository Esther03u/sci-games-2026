# Design Document: Tournament Bracket & Winner Progression (ระบบสายการแข่งขันและส่งต่อทีมผู้ชนะเข้ารอบชิง)

**Date:** 2026-09-23  
**Status:** Approved  
**Topic:** Tournament Progression, TBD Match Placeholders, and Automated Bracket Advancement  

---

## 1. Background & Problem Statement

ในการแข่งขัน **Sci Games 2026** (คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต 9 - 11 ตุลาคม 2569) มีการแข่งขันกีฬา 5 ชนิดหลัก (ฟุตซอล, วอลเลย์บอล, เซปักตะกร้อ, บาสเกตบอล, เปตอง) โดยแข่งขันแบบ 4 สีสัมพันธ์ (แดง, ฟ้า, เขียว, ม่วง)

### ปัญหาเดิม:
1. ในหน้ากำหนดการ/ตารางแข่งขัน (`/schedule`) และข้อมูลสูจิบัตรเดิม แมตช์ที่เป็นรอบชิงชนะเลิศ (Final) และรอบชิงอันดับ 3 (Third-Place) มีการระบุสีคู่แข่งขันไว้ล่วงหน้า (เช่น สีม่วง vs สีแดง) ทั้งที่รอบคัดเลือก/รอบรองชนะเลิศยังไม่ได้แข่งขัน
2. เมื่อ `team_a_id` หรือ `team_b_id` เป็นค่าว่าง (`null`) คอมโพเนนต์ `MatchCard` และ `MatchDetailModal` จะ fallback เป็นสีแดงและสีฟ้าเสมอ ทำให้แสดงผลหลอกตาเสมือนว่ามีทีมถูกวางไว้แล้ว

---

## 2. Requirements & Goals

1. **TBD / Placeholder ในหน้ากำหนดการและตารางแข่งขัน:**
   - สำหรับแมตช์ที่ยังไม่รู้คู่แข่งขัน (รอบชิงชนะเลิศ / รอบชิงอันดับ 3) ให้แสดงชื่อคู่แข่งเป็น **"รอผลการแข่งขัน"**
   - รูปแบบดีไซน์ใช้โทนสีกลางโมเดิร์น (Slate / Steel Gray Glass `#64748b` หรือ `#94a3b8`) พร้อมไอคอนรอผล `⏳` (Pending) ไม่ใช้สีแดงหรือสีฟ้า
   - หากมีทีมหนึ่งรู้ผลแล้ว (เช่น ชนะรอบรองฯ 1) ให้แสดงสีของทีมนั้นจริง ส่วนอีกฝั่งที่ยังแข่งไม่จบให้แสดง "รอผลการแข่งขัน"
2. **ระบบส่งทีมอัตโนมัติ (Automated Progression Trigger):**
   - เชื่อมโยงสายแข่งด้วย `next_match_id` และ `loser_next_match_id` ในระดับฐานข้อมูล (PostgreSQL Trigger `advance_bracket`)
   - เมื่อแมตช์รอบรองฯ บันทึกผลเสร็จสิ้น (`status = 'finished'`) ไม่ว่าจะผ่านแอปกรรมการสนาม (`/staff/scoring`) หรือแอดมิน:
     - ผู้ชนะ (`winner`) ถูกส่งเข้าเป็น `team_a` หรือ `team_b` ในรอบชิงชนะเลิศทันที
     - ผู้แพ้ (`loser`) ถูกส่งเข้าเป็น `team_a` หรือ `team_b` ในรอบชิงอันดับ 3 ทันที
3. **ระบบผู้ดูแล (Admin Control & Override):**
   - ในหน้า `/admin/matches` สามารถเลือกหรือแก้ไขทีมในรอบชิงเป็น "รอผลการแข่งขัน (ยังไม่ระบุ)" หรือกำหนดทีมด้วยมือได้ตลอดเวลา
4. **ชุดข้อมูลทางการและการนำเข้า (Handbook & Seed):**
   - อัปเดต `src/data/handbook.js` ให้รอบชิงชนะเลิศและชิงอันดับ 3 เริ่มต้นเป็น `null` พร้อมเชื่อมโยง `next_match_id` / `loser_next_match_id`
   - ปรับปรุง `scripts/seed-matches.mjs` ให้นำเข้าแมตช์ที่ยังไม่มีทีม (`null`) ได้อย่างถูกต้อง

---

## 3. Architecture & Data Model

### 3.1 Bracket Slot Structure (4 Teams / 4 Matches per category)
```text
[ Semi-Final 1 ] ───── Winner ─────► [ Final (รอบชิงชนะเลิศ) ]
(Team A vs Team B) ─── Loser  ─────┐ (Winner SF1 vs Winner SF2)
                                  │
[ Semi-Final 2 ] ───── Winner ─────┘
(Team C vs Team D) ─── Loser  ─────► [ Third-Place (รอบชิงอันดับ 3) ]
                                    (Loser SF1 vs Loser SF2)
```

### 3.2 Database Schema (Matches Table)
คอลัมน์ที่มีอยู่แล้วจาก `supabase/migrations/002_live_scoring.sql`:
- `round`: `'semi_1'` | `'semi_2'` | `'third'` | `'final'`
- `next_match_id`: UUID ชี้ไปยังรอบชิงชนะเลิศ (`final`)
- `next_match_slot`: `'a'` หรือ `'b'`
- `loser_next_match_id`: UUID ชี้ไปยังรอบชิงอันดับ 3 (`third`)
- `loser_next_match_slot`: `'a'` หรือ `'b'`

PostgreSQL Function & Trigger:
- Trigger: `trg_advance_bracket` on `matches`
- Function: `advance_bracket()` ดึงผู้ชนะและผู้แพ้ผ่าน `match_winner(NEW)` และอัปเดตแมตช์ปลายทางโดยอัตโนมัติ

---

## 4. Component Changes

### 4.1 `src/components/ui/MatchCard.js`
- ตรวจสอบ `match.team_a_id` และ `match.team_b_id`
- หากเป็น `null`:
  - สร้าง object เสมือนสำหรับทีมที่รอผล:
    ```javascript
    const PENDING_TEAM = {
      id: null,
      name: 'รอผลการแข่งขัน',
      color_hex: '#64748b',
      logo_emoji: '⏳',
      isPending: true,
    };
    ```
  - สไตล์ Neutral: ปรับ background gradient, border และ accent glow ให้เป็นสีเทาโปร่งแสงโมเดิร์น ไม่แสดงแถบแดง/ฟ้า

### 4.2 `src/components/ui/MatchDetailModal.js`
- รองรับการแสดงผล "รอผลการแข่งขัน" ทั้งในส่วนหัว Head-to-Head และแท็บข้อมูล
- ป้องกันการแสดงผลคะแนนผิดพลาดเมื่อทีมยังไม่ถูกกำหนด

### 4.3 `src/components/admin/MatchEditor.js`
- เพิ่มตัวเลือก `value=""` -> "รอผลการแข่งขัน (ยังไม่ระบุ)" ในดรอปดาวน์เลือกทีม A และทีม B
- รองรับการบันทึกแมตช์ที่มี `team_a_id: null` หรือ `team_b_id: null`

### 4.4 `src/data/handbook.js`
- ในแมตช์รอบชิงชนะเลิศ และรอบชิงอันดับ 3 ของทุกกีฬา (ฟุตซอล, วอลเลย์บอล, ตะกร้อ, บาสเกตบอล, เปตอง):
  - เปลี่ยน `team_a_id: null` และ `team_b_id: null`
- ในแมตช์รอบรองชนะเลิศ:
  - ระบุ `next_match_id`, `next_match_slot`, `loser_next_match_id`, `loser_next_match_slot`

### 4.5 `scripts/seed-matches.mjs`
- ผ่อนปรนเงื่อนไข `!team_a_id || !team_b_id` ให้ยอมรับแมตช์รอบชิงที่เป็น `null` ได้ พร้อมทั้งส่งคอลัมน์การเชื่อมโยงสายแข่งลงตาราง `matches`

---

## 5. Verification & Testing

1. **Unit Tests (`tests/bracket-progression.test.js`):**
   - ทดสอบ `MatchCard` และการ fallback ของทีมรอผล "รอผลการแข่งขัน"
   - ทดสอบตรรกะการคำนวณผู้ชนะและส่งต่อ ID ทีม
2. **Regression Tests:**
   - รัน `npm test` (54+ tests ต้องผ่านทั้งหมด)
   - รัน `npm run lint` (0 error, 0 warning)
   - รัน `npm run build` (Next.js build สำเร็จ)
3. **Manual Verification:**
   - เปิดหน้า `/schedule` ตรวจสอบว่ารอบชิงชนะเลิศและชิงอันดับ 3 แสดงคำว่า "รอผลการแข่งขัน" โทนสีเทาสวยงาม ไม่ขึ้นสีแดง/ฟ้า
