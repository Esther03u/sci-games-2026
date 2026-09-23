# แผน: ปุ่ม "ดู PIN" อีกครั้ง — Sci Games 2026

> เขียน 24 ก.ย. 2569 · สถานะ: **รอผู้ใช้อนุมัติ** (ยังไม่ได้ลงมือ)
> ที่มา: ผู้ใช้ขอให้แอดมินดูรหัส PIN ของกรรมการซ้ำได้ ไม่ใช่เห็นครั้งเดียวตอนสร้าง

---

## 1. ทำไมตอนนี้ดูซ้ำไม่ได้

- `sport_pins` เก็บแค่ `pin_hash` (bcrypt, migration 002) — hash **ย้อนกลับเป็นตัวเลขไม่ได้** จึงแสดง PIN ได้ครั้งเดียวใน response ของ `POST /api/admin/pins`
- ถ้าจะดูซ้ำ ต้องเก็บ PIN ในรูปที่ **ถอดกลับได้** เพิ่มอีกช่อง — hash เดิมยังใช้ตรวจตอน login เหมือนเดิม

## 2. ทางเลือก

| | วิธี | ข้อดี | ข้อเสีย |
|---|---|---|---|
| **ก (แนะนำ)** | เก็บ PIN **เข้ารหัส AES-256-GCM** ในคอลัมน์ใหม่ `pin_encrypted` คีย์อยู่ใน env ใหม่ `PIN_ENCRYPTION_KEY` (ไม่อยู่ใน DB) + ปุ่ม "ดู PIN" ที่บันทึก audit ทุกครั้ง | ตรงกับที่ขอ; DB หลุดอย่างเดียวยังอ่าน PIN ไม่ได้ (ต้องได้คีย์ด้วย); รู้ว่าใครเปิดดูเมื่อไร | เพิ่ม env 1 ตัวที่ต้องตั้งทั้ง Vercel และ `.env.local`; ถ้าทั้ง DB และคีย์หลุดพร้อมกัน PIN ทั้งหมดถูกอ่านได้ |
| ข | เก็บ PIN เป็นข้อความธรรมดา | ง่ายสุด | ใครอ่านตาราง (super_admin ผ่าน RLS `admin_read`, backup, SQL Editor) เห็น PIN ทันที — **ไม่แนะนำ** |
| ค | ไม่เก็บ แต่มีปุ่ม **"ตั้ง PIN ใหม่"** ให้แถวเดิม (สุ่มเลขใหม่ แสดงครั้งเดียว) | ไม่ต้องเก็บอะไรเพิ่ม; กรรมการที่ล็อกอินอยู่แล้วไม่หลุด (session ผูกกับ `pin_id` ไม่ใช่ตัวเลข) | ไม่ใช่ "ดูของเดิม" — ต้องแจ้งเลขใหม่ให้กรรมการที่ยังไม่ล็อกอิน |

**ข้อเสนอ:** ทำ **ก** เป็นหลัก และ (ถ้าต้องการ) เพิ่ม **ค** เป็นปุ่มรองสำหรับกรณี PIN หลุดไปถึงคนที่ไม่ควรรู้

> ความเสี่ยงที่ยอมรับได้: PIN เป็นรหัสชั่วคราว 6 หลัก ใช้แค่ 3 วัน, ล็อกอินมี rate limit, แอดมินปิด PIN ได้ทันที และตอนนี้ hash bcrypt ก็ถูกเดาแบบ offline ได้อยู่แล้วถ้า DB หลุด (มีแค่ 1 ล้านค่า) — การเข้ารหัสด้วยคีย์ที่อยู่นอก DB จึงไม่ได้ทำให้แย่ลง

## 3. รายละเอียดทางเลือก ก

### 3.1 ฐานข้อมูล — migration `011_pin_encrypted.sql` (additive, idempotent)
```sql
ALTER TABLE sport_pins ADD COLUMN IF NOT EXISTS pin_encrypted text;  -- 'v1:<iv>:<tag>:<ciphertext>' base64url
```
- ไม่ต้อง backfill: ตอนนี้ `sport_pins` ว่าง (ลบ PIN ทดสอบหมดแล้ว 24 ก.ย.) — PIN ที่สร้างก่อน deploy จะขึ้น "ดูไม่ได้ (สร้างก่อนมีฟีเจอร์นี้)"
- ไม่แตะ `pin_hash` / RLS เดิม

### 3.2 โค้ด
| ไฟล์ | สิ่งที่ทำ |
|---|---|
| `src/lib/auth/pinCrypto.js` (ใหม่) | `encryptPin(pin)` / `decryptPin(stored)` ด้วย `node:crypto` AES-256-GCM, IV สุ่ม 12 byte ต่อครั้ง, คีย์จาก `PIN_ENCRYPTION_KEY` (base64 32 byte); มีเลขเวอร์ชัน `v1:` เผื่อเปลี่ยนคีย์; ถ้าไม่มีคีย์ → สร้าง PIN ได้ตามเดิมแต่ไม่เก็บ `pin_encrypted` (ปุ่มดูจะบอกว่าไม่ได้ตั้งคีย์) |
| `POST /api/admin/pins` | เก็บ `pin_encrypted: encryptPin(pin)` คู่กับ `pin_hash` |
| `POST /api/admin/pins/[id]/reveal` (ใหม่) | `requireAdmin()` → อ่านแถวด้วย service role → `decryptPin` → บันทึก `audit_logs` action `reveal_pin` (ใคร/PIN ไหน/เมื่อไร — **ไม่บันทึกตัวเลข**) → ตอบ `{ pin }` พร้อม `Cache-Control: no-store`; rate limit 20 ครั้ง/10 นาที/แอดมิน; ใช้ POST ไม่ใช่ GET เพื่อไม่ให้ถูกแคช/prefetch |
| `GET /api/admin/pins` | เพิ่มฟิลด์ `can_reveal: pin_encrypted IS NOT NULL` (ไม่ส่ง ciphertext ออกไป) |
| `src/components/admin/PinManager.js` | ปุ่ม **"ดู PIN"** ในแต่ละแถว (สูง ≥ 40px บนมือถือ) → เรียก reveal → เปิด sheet เดิม `CreatedPinModal` (ตัวเลขใหญ่ + QR + คัดลอก) หัวข้อ "PIN ของ …"; แถวที่ `can_reveal = false` ปุ่มเป็นสีเทาพร้อมคำอธิบาย; ข้อความใต้ฟอร์มเปลี่ยนจาก "แสดงครั้งเดียว" เป็น "ดูซ้ำได้ที่ปุ่ม ดู PIN (บันทึกทุกครั้งที่เปิดดู)" |
| `/admin/audit` | แสดง `reveal_pin` เป็น "ดู PIN" ในแท็บการแก้ไขข้อมูล |

### 3.3 Env ใหม่
```env
PIN_ENCRYPTION_KEY=<base64 ของ 32 byte สุ่ม>   # node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
- ต้องตั้ง **ทั้ง Vercel (Production) และ `.env.local`** ก่อน deploy — ผู้ใช้เป็นคนตั้งใน Vercel (ผมไม่แตะ secret)
- ห้าม commit; ถ้าคีย์หาย PIN ที่เก็บไว้ดูไม่ได้อีก (แต่ login ยังใช้ได้เพราะใช้ hash) → แก้ด้วยการสร้าง PIN ใหม่

### 3.4 เทสต์
- **Vitest** `pinCrypto`: เข้า-ถอดได้ตรง, IV ไม่ซ้ำ (เข้ารหัส PIN เดิม 2 ครั้งได้คนละค่า), คีย์ผิด/ข้อมูลถูกแก้ → throw, ไม่มีคีย์ → คืน `null`
- **DB scenario** ข้อ 13: คอลัมน์ `pin_encrypted` มีอยู่, anon/staff อ่าน `sport_pins` ไม่ได้
- **permission matrix**: `POST /api/admin/pins/[id]/reveal` → anon 401 · PIN 401 · staff 403 · admin 200 และตัวเลขที่ได้ = ตัวที่ได้ตอนสร้าง; `GET /api/admin/pins` ไม่มี `pin_encrypted`/`pin_hash`
- **smoke**: สร้าง PIN → reveal ได้เลขเดิม → มีแถว `reveal_pin` ใน audit_logs
- **กดจริงบนมือถือ** (production): สร้าง PIN → ปิด sheet → กด "ดู PIN" → เห็นเลขเดิม + QR → ลบ PIN

### 3.5 ลำดับ deploy (ห้ามสลับ)
1. ผู้ใช้เพิ่ม `PIN_ENCRYPTION_KEY` ใน Vercel + `.env.local`
2. ผู้ใช้รัน `011_pin_encrypted.sql` ใน Supabase SQL Editor (โค้ดใหม่ insert คอลัมน์นี้ — ถ้ายังไม่มีคอลัมน์ การสร้าง PIN จะพัง)
3. push → Vercel deploy → ตรวจตาม 3.4

## 4. ทางเลือก ค (ถ้าเอาด้วย) — ปุ่ม "ตั้ง PIN ใหม่"
- `POST /api/admin/pins/[id]/rotate` สุ่มเลขใหม่ → อัปเดต `pin_hash` (+ `pin_encrypted`) → คืนเลขใหม่ → audit `rotate_pin`
- กรรมการที่ล็อกอินค้างไว้ยังใช้ต่อได้ (cookie ผูก `pin_id`); คนที่ยังไม่ล็อกอินต้องใช้เลขใหม่
- เพิ่มงาน ~30 นาที

## 5. ประมาณเวลา
| งาน | เวลา |
|---|---|
| migration + pinCrypto + เทสต์ | 30 นาที |
| API reveal + list + audit label | 30 นาที |
| UI ปุ่ม/sheet บนมือถือ | 30 นาที |
| permission matrix + smoke + DB scenario + กดจริง | 30 นาที |
| (ทางเลือก ค) | +30 นาที |

## 6. ต้องให้ผู้ใช้ตัดสินใจ
1. เลือก **ก** (เก็บแบบเข้ารหัส ดูซ้ำได้) / **ค** (ตั้ง PIN ใหม่แทน) / **ก + ค**
2. ใครกดดูได้ — super_admin ทุกคน (แนะนำ, ตอนนี้มีแต่ super_admin) หรือจำกัดเฉพาะคนที่สร้าง PIN นั้น
3. ยืนยันว่าจะเป็นคนตั้ง `PIN_ENCRYPTION_KEY` ใน Vercel เอง (ผมเตรียมคำสั่งสร้างคีย์ให้)
