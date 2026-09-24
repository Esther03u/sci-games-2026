# 🔄 Project Hand-Off Summary
> Last updated: 2026-09-25 (**"ดู PIN" กดจริงบนมือถือผ่าน** · ⚠️ **แมตช์จริงหายไป 3 คู่** (ฟุตซอลหญิง #1, ฟุตซอลชาย #2, เปตองคู่ผสม #6) ถูกลบจากบัญชี Admin — รอผู้ใช้ตัดสินใจกู้คืน)

## 1. [Project Overview & Tech Stack]

**Sci Games 2026** — เว็บกีฬาสานสัมพันธ์ คณะวิทยาศาสตร์ฯ ม.ราชภัฏภูเก็ต (งานวันที่ 9–11 ต.ค. 2569 เหลือ ~19 วัน)
Repo: https://github.com/Esther03u/sci-games-2026 (branch `main`, clone อยู่ที่ `C:\SCI Game`)

- **Next.js 16.3.5** App Router, JavaScript (ไม่ใช่ TS), React 19, Vanilla CSS glassmorphism (แยกเป็น `src/styles/*.css`, ไม่ใช้ Tailwind — `clsx`/`tailwind-merge` ถอดออกแล้วใน P3-15)
- **Supabase** (PostgreSQL + Auth + Realtime) ผ่าน `@supabase/ssr` — anon key ฝั่ง client, service role ใน API routes
- Chart.js, jsPDF, JSZip, motion, lucide-react
- ทดสอบ: Vitest (`npm test`) · DB scenario (`npm run test:db`) · smoke (`npm run test:smoke`) · **CI บน GitHub Actions** (`.github/workflows/ci.yml`) + **pre-commit hook** (`.githooks/pre-commit`)
- ⚠️ Next 16 เปลี่ยน convention: `middleware.js` → `proxy.js` (build แจ้ง "ƒ Proxy (Middleware)"); ต้องอ่าน `node_modules/next/dist/docs/` ก่อนเขียนโค้ดตาม `AGENTS.md`

**3 โซน:** Public (`/`, `/schedule`, `/results`, `/news`, `/register`, `/check-status`) · Admin (`/admin/*` 9 หน้า, role `super_admin`) · Staff (`/staff/scoring`, role `staff`)

**เป้าหมายรอบนี้:** ทำระบบ 3 ส่วนให้สมบูรณ์ — (1) ผู้ชมดูสกอร์ Realtime (2) ผู้ลงคะแนนกด +1/−1 จากสนาม (3) Admin ดู/จัดการทุกอย่าง — โดย**ต่อยอดโค้ดเดิม** ไม่รื้อ

## 2. [Completed Milestones]

- ✅ **ยืนยัน "ดู PIN" บน production ด้วยการกดจริงบนมือถือ (25 ก.ย.)** — สร้าง PIN `[TEST] ดู PIN` → QR แสดง (ตัวแก้ QR ใช้ได้) → ปิด → กด "ดู PIN" ในตาราง → ได้เลขเดิม 015596 + QR → audit มี `create_pin` และ `reveal_pin` (ไม่มีตัวเลข) → ลบ PIN; permission matrix 42/42 · smoke ผ่าน · CI เขียว
  - P2: หัว sheet ตอนสร้างยังเขียน "PIN ใหม่ — แสดงครั้งเดียว" ทั้งที่ดูซ้ำได้แล้ว
  - ⚠️ **พบว่าแมตช์จริงหายจาก DB 3 คู่ (เหลือ 41/44)** — audit `delete_matches` โดยบัญชี **Admin**: เปตองคู่ผสม รอบแรก #6 (ศ. 9 ต.ค. 19:30, ลบ 24 ก.ย. 04:01 น.), ฟุตซอลหญิง รอบแรก #1 ม่วง–เขียว (ศ. 17:30) และฟุตซอลชาย รอบแรก #2 ฟ้า–ม่วง (ศ. 18:30) (ลบ 24 ก.ย. 15:04 น.) — **ไม่ใช่ AI ลบ**; รอบแรกที่หายทำให้ผู้ชนะไม่เลื่อนเข้ารอบชิงของสายนั้น; มี PIN `kim` (ฟุตซอล) สร้างโดย Admin 24 ก.ย. 14:59 น. ยังเปิดอยู่ — รอผู้ใช้ยืนยันว่าตั้งใจไหม / ให้กู้คืนจาก `handbook.js` หรือไม่

- ✅ **ปุ่ม "ดู PIN" + แก้ CI แดง (25 ก.ย.)** — ผู้ใช้เลือกทางเลือก ก (แอดมินทุกคนดูได้), ผู้ใช้ตั้ง `PIN_ENCRYPTION_KEY` ใน Vercel/`.env.local` และรัน SQL บน production แล้ว
  - **เพื่อนกับผมทำฟีเจอร์เดียวกันซ้อนกัน** (ทั้งคู่จากแผน `docs/plans/2026-09-24-pin-reveal.md`, format ข้อมูลเหมือนกัน `v1:<iv>:<tag>:<ct>`): ใช้ของเพื่อน `a8880d3` (`lib/auth/pinCrypto.js`, `POST /api/admin/pins/[id]/reveal`, `PinManager`, **`012_pin_encrypted.sql`**) — ของผมเก็บไว้ในเครื่องที่ branch `backup/pin-reveal-mine` (ไม่ได้ push)
  - **CI job DB แดงตั้งแต่ `011_match_walkover.sql`**: 011 ต่อคอลัมน์ `is_walkover` ท้าย `matches_public_v2` → รัน 010 ซ้ำไม่ได้ → **`013_public_view_v3.sql`** คืน v2 เป็นรูปแบบ 010 + สร้าง `matches_public_v3` (= v2 + `is_walkover`); แอปอ่าน v3 (`getPublicMatches`, `useLiveScores`, `/api/live-summary` ซึ่ง fallback ไป v2) — **กติกา: คอลัมน์ใหม่ให้ผู้ชม → สร้าง view ใหม่ (v4…) ห้ามต่อท้าย view เดิม**
  - เพิ่มจากของผม: permission matrix เช็ค reveal (401/401/403/200, ได้เลขเดิม, no-store, list ไม่มี hash/ciphertext, audit `reveal_pin`), `check:supabase` เช็ค `PIN_ENCRYPTION_KEY`, `.env.local.example`, runbook (กรรมการลืม PIN → กด "ดู PIN"), DB scenario 12b (v3)
  - ⚠️ ทั้งคู่ทำงานซ้ำกันเพราะไม่รู้ว่าอีกฝ่ายกำลังทำ — **ก่อนเริ่มฟีเจอร์ให้ `git pull` และดู Handoff ว่าใครทำอะไรอยู่**

- ✅ **ระบบปุ่ม "ดู PIN" อีกครั้ง (Reveal PIN via AES-256-GCM) (25 ก.ย.)**:
  - พัฒนาตามความต้องการของผู้ใช้และแผน `docs/plans/2026-09-24-pin-reveal.md` (ทางเลือก ก):
  - **ระบบเข้ารหัส & ถอดรหัสปลอดภัย (`src/lib/auth/pinCrypto.js`):**
    - เข้ารหัสด้วยมาตรฐานสากล **AES-256-GCM**
    - คีย์ 32 bytes เก็บใน Environment Variable **`PIN_ENCRYPTION_KEY`** (นอก DB เพื่อความปลอดภัย)
    - สุ่ม IV 12 bytes ทุกครั้งที่เข้ารหัส (PIN เดียวกัน ผลลัพธ์ ciphertext จะไม่ซ้ำกัน) พร้อม Auth Tag 16 bytes กันการดัดแปลงข้อมูล
    - ฟอร์แมต: `v1:<iv>:<tag>:<ciphertext>` ใน base64url
  - **ฐานข้อมูล (Migration 012 `supabase/migrations/012_pin_encrypted.sql`):**
    - เพิ่มคอลัมน์ `pin_encrypted text` ให้ตาราง `sport_pins` (additive & idempotent)
  - **API หลังบ้าน:**
    - `POST /api/admin/pins`: จัดเก็บ `pin_encrypted` ควบคู่กับ `pin_hash`
    - `GET /api/admin/pins`: ส่งเฉพาะ `can_reveal: Boolean(pin_encrypted)` ไปยัง frontend (ไม่ส่ง ciphertext หรือ hash)
    - `POST /api/admin/pins/[id]/reveal`: สิทธิ์ `requireAdmin()`, ถอดรหัส PIN, บันทึกประวัติ `audit_logs` action `reveal_pin` (ระบุผู้เปิดดูและ PIN ที่ถูกดู โดยไม่บันทึกตัวเลข PIN), Rate limit 20 ครั้ง/10 นาที, `Cache-Control: no-store`
  - **หน้าจัดการแอดมิน (`src/components/admin/PinManager.js`):**
    - เพิ่มปุ่ม **"ดู PIN"** ในตาราง PIN ทุกแถว
    - หน้าต่าง `PinDisplayModal` แสดงตัวเลข 6 หลักขนาดใหญ่, ป้ายกีฬา, QR Code สำหรับกรรมการสแกนล็อกอินทันที และปุ่มคัดลอกข้อมูล
  - **ระบบตรวจสอบ & การทดสอบ:**
    - เพิ่ม `reveal_pin: 'ดู PIN'` ใน `src/lib/labels.js`
    - เพิ่ม Unit Tests ใน `tests/pin-crypto.test.js` รวม 8 เคส
    - เพิ่ม Scenario 13 ใน `supabase/tests/scenario_live_scoring.sql`
    - เพิ่ม matrix test ใน `scripts/permission-matrix.mjs`
    - Vitest **111 tests ผ่าน 100%**, ESLint ผ่าน 0 errors, Prettier ผ่าน 100%, `npm run build` ผ่าน 100%

- ✅ **ระบบนับเวลาถอยหลัง & ควบคุมการเฉลยโพเดียม (Podium Countdown & Reveal) (24 ก.ย.)**:
  - ตามความต้องการของผู้ใช้: ติดตั้งระบบนับถอยหลังพร้อมจัดการจากหลังบ้าน Admin, ค้างเวลาที่ `00:00:00` รอจนกว่าแอดมินจะกดแสดง, และปุ่มกดแสดงก่อนถึงเวลาให้นาฬิกาวิ่งเร่งอย่างรวดเร็วแล้วชะลอจังหวะสุดท้ายก่อนเฉลยผล
  - **บูรณาการคอมโพเนนต์ `<Counter />` จาก React Bits (`src/components/ui/Counter.js` & `Counter.css`):**
    - พัฒนาด้วย `motion/react` (`useSpring`, `useTransform`, `motion`)
    - รองรับตัวเลขหมุนแบบ Odometer/Slot Machine ที่นุ่มนวลและเป็นธรรมชาติ
    - แยกแสดงผล 4 หน่วย: **วัน, ชั่วโมง, นาที, วินาที** ด้วยการ์ด Glassmorphism สวยหรู
  - **ระบบควบคุมหลังบ้าน (`/admin/settings` & `SettingsForm.js`):**
    - กล่องควบคุม **"ระบบนับถอยหลัง & เฉลยผลโพเดียม"** พร้อมป้ายบอกสถานะสด (`กำลังนับถอยหลัง`, `กำลังเร่งเวลา`, `เฉลยผลแล้ว`)
    - **ปุ่ม "⚡ เร่งเวลาแล้วเฉลย" (Fast-Forward Reveal):** สั่งให้นาฬิกาบนหน้าเว็บของผู้ชมทุกคนวิ่งหมุนลดลงอย่างรวดเร็ว (Phase 1) แล้วชะลอจังหวะ 5.. 4.. 3.. 2.. 1.. 0 (Phase 2) ก่อนเฉลยผลทันที (Phase 3)
    - **ปุ่ม "✨ เฉลยทันที" (Instant Reveal):** ใช้สำหรับเปิดเผยผลทันทีเมื่อถึงเวลาหรือเวลาค้างที่ 00:00:00
    - **ปุ่ม "🔄 รีเซ็ตเป็นปริศนา" (Reset to Mystery):** คืนสถานะโพเดียมเป็นเครื่องหมาย `?` และเริ่มนับถอยหลังใหม่ เพื่อความสะดวกในการทดสอบ
    - ตั้งค่าวัน-เวลานับถอยหลังเป้าหมายผ่าน `datetime-local` และตั้งข้อความหัวเรื่องได้อิสระ
    - มีหน้าปัด Live Preview ของนาฬิกาให้ทดสอบดูได้สด ๆ ในหน้าแอดมิน
  - **การทำงานฝั่งผู้ชมสาธารณะ (`src/components/public/PodiumCountdown.js` & `StandingsPodium.js`):**
    - ติดตั้งอยู่ใต้โพเดียม 3 อันดับแรกบนหน้าแรก (`/`) พอดีกับตำแหน่งที่ผู้ใช้กำหนด
    - ซิงก์คำสั่งเฉลยผลแบบ Realtime ผ่าน Supabase Broadcast channel `podium-sync` พร้อม Polling fallback ทุก 8 วินาที
    - เมื่อถึงเวลา 00:00:00 นาฬิกาจะค้างเวลาไว้และแสดงป้ายแจ้งเตือนรอสัญญาณถ่ายทอดสด โดยยังไม่เฉลยผลจนกว่าจะมีคำสั่งจากแอดมิน
    - เมื่อเฉลยผล: มีเอฟเฟกต์พลุกระดาษเฉลิมฉลอง Canvas Confetti (`Confetti.js`) และการ์ดอันดับ 1, 2, 3 พลิกตัวแบบ 3D Card Flip เผยสีประจำทีมและแต้มสะสมจริง พร้อมรายชื่ออันดับถัดไป (#4 เป็นต้นไป)
    - นำกล่องแบนเนอร์ข้อความ "ประกาศผลคะแนนรวมอย่างเป็นทางการแล้ว!" ออกตามความต้องการของผู้ใช้ เพื่อให้หน้าจอหลังเฉลยผลคลีน เรียบหรู ไม่รกตา โฟกัสที่ตัวโพเดียมเต็มที่
    - **นำไอคอนมาสคอต (Flame, Shield, Zap, Sparkles) ออกจากกล่องสีของโพเดียมอันดับ 1, 2, 3** ตามความต้องการของผู้ใช้ ปรับเป็นกล่องสีสไตล์ glossy 3D คลีนมินิมอล มีมิติแสงเงาหรูหรา สบายตา คมชัด 100%
  - **API & การทดสอบ:**
    - API สาธารณะ `GET /api/public/podium-settings`
    - API จัดการ `PATCH /api/admin/settings` (รองรับ key `podium_countdown` พร้อม Broadcast & Audit Log)
    - เพิ่ม Unit Tests ใน `tests/podium-countdown.test.js` รวม 5 เคส: Vitest **103 tests ผ่าน 100%**, ESLint ผ่าน 0 errors, Prettier ผ่าน 100%

- ✅ **นำไอคอนชนิดกีฬาและไอคอน Timer ออกจาก `/staff/scoring` ทั้งหมด (24 ก.ย.)**:
  - ตามความต้องการของผู้ใช้งานที่ต้องการให้หน้าจอบันทึกคะแนนสนามไม่รกตาและตัดไอคอนที่ซ้ำซ้อนออก
  - ถอดกล่องไอคอนชนิดกีฬาขนาดใหญ่ออกจากกล่องแบนเนอร์ด้านบน (`.sport-scope-header`)
  - ถอดไอคอนกีฬาออกจากหัวการ์ดแมตช์ทุกคู่ในรายการแข่งขัน ให้เหลือเฉพาะข้อความชื่อกีฬาและรอบแข่งขันที่อ่านง่าย คมชัด
  - ถอดกล่องไอคอนออกจากหน้าการ์ดเลือกชนิดกีฬาสำหรับแอดมิน (`.sport-select-card`) และปุ่มตัวกรองภาพรวม
  - ถอดไอคอน `<Timer />` ออกจากแถบ Navigation Bar ด้านบนของ StaffLayout ให้หัวข้อ `กรรมการ[ชื่อกีฬา]` คลีน เรียบหรู
  - **หน้ากระดานลงคะแนน ScorePad (`ScorePad.js`):** ถอดไอคอนชนิดกีฬาออกจากกล่องหัวแมตช์ด้านบน และถอดไอคอน TeamIcon (โล่, มงกุฎ, เปลวไฟ) ออกจากป้ายชื่อทีม โดยแทนที่ด้วยจุดสีเรียบหรูเรืองแสง (glowing color dot 10px) สไตล์เดียวกับ TeamBadge ดูสบายตา ตัวหนังสือเด่นชัด ไม่รก
  - ตรวจสอบใน Browser จริง: หน้าจอบันทึกคะแนนดูโปร่ง โฟกัสที่ชื่อทีม สกอร์ และปุ่มลงคะแนนได้อย่างชัดเจน 100%

- ✅ **แยกระบบแสดงผลตามชนิดกีฬาเดี่ยวสำหรับกรรมการสนามและผู้ลงคะแนน ("ใครได้กีฬาอะไรเห็นแค่กีฬานั้น") (24 ก.ย.)**:
  - **แก้ไขปัญหาต้นเหตุ (Root Cause Bug in `resolveActor.js`):**
    - เดิม `resolveActor()` ตรวจสอบเซสชัน Supabase ก่อน หากผู้พัฒนา/แอดมินล็อกอินค้างไว้ แล้วทดสอบใส่ PIN กรรมการฟุตซอล ระบบจะนำสิทธิ์ Admin ทับ PIN เสมอ ทำให้เห็นทั้ง 44 แมตช์ของทุกกีฬา
    - ปรับให้ `resolvePinActor()` ทำงานก่อนสำหรับการลงคะแนน เพื่อให้กรรมการที่ถือคุกกี้ PIN ได้สิทธิ์เฉพาะกีฬานั้นจริง ๆ (`sportIds: [pin.sport_id]`)
    - เพิ่ม `resolveAdminActor()` และป้องกัน `requireAdmin()` เพื่อให้แอดมินที่ทดสอบ PIN ยังสามารถเข้าใช้งานหน้าจัดการ `/admin/*` ได้โดยไม่ถูก 403
    - ดึงชื่อกีฬา (`sportName`) แนบใน `actorPublicView` ทำให้แถบเมนูด้านบนแสดงเป็น **`กรรมการฟุตซอล`** (แทนที่จะเป็นแค่ `กรรมการ (PIN)`)
  - **กรรมการสนาม (PIN Referee หรือ Staff ประจำกีฬาเดี่ยว):**
    - เข้าสู่หน้า `/staff/scoring` แล้วจะเห็น **เฉพาะแมตช์ของกีฬาตนเองเท่านั้น 100%** (เช่น กรรมการฟุตซอลเห็นเฉพาะ 8 แมตช์ของฟุตซอล)
    - ไม่มีแท็บกีฬาอื่น ไม่มีแมตช์กีฬาอื่นมาปะปนให้สับสน
    - แสดงป้ายหัวเรื่องเด่นชัด: `⚽ ฟุตซอล · กรรมการ PIN (test) · ลงคะแนนเฉพาะกีฬาฟุตซอล · ทั้งหมด 8 แมตช์`
    - กรองวันแข่งขันเฉพาะวันที่มีการแข่งกีฬานั้น ๆ และค้นหาเฉพาะในกีฬานั้น ๆ
  - **โหมดผู้ดูแลระบบ (Admin Sport Selection Screen):**
    - เมื่อผู้ดูแลระบบที่มีสิทธิ์ทุกกีฬาเข้ามาที่ `/staff/scoring` ระบบจะไม่เท 44 แมตช์รวมกันจนลายตาและใช้งานยาก
    - แสดงหน้าจอการ์ดเลือกชนิดกีฬา **"เลือกชนิดกีฬาที่จะลงคะแนน"** แยกตามกีฬา (ฟุตซอล, วอลเลย์บอล, บาสเกตบอล, แบดมินตัน, เปตอง) พร้อมแสดงจำนวนแมตช์และป้ายบอกว่ามีคู่กำลังแข่งอยู่กี่คู่
    - เมื่อแตะเลือกกีฬาใด จะเข้าสู่มุมมองเดี่ยวของกีฬานั้นทันที พร้อมปุ่ม **`🔄 สลับกีฬา`** ที่มุมขวาบน เพื่อสลับไปดูกีฬาอื่นได้ตลอดเวลา
    - บันทึกการเลือกกีฬาไว้ใน `localStorage` (`staff_selected_sport`) เพื่อความต่อเนื่องในการใช้งาน
    - มีปุ่มทางเลือกสำหรับดูภาพรวมทุกกีฬาพร้อมกันหากต้องการ
  - **การทดสอบ:**
    - Vitest **98 tests ผ่าน 100%**, ESLint ผ่าน 0 errors, Prettier ตรวจสอบผ่าน 100%, Next.js production build (`npm run build`) สำเร็จ 24 routes ครบถ้วน
    - ตรวจสอบใน Browser จริง: กรรมการฟุตซอลเห็นเฉพาะ 8 แมตช์ฟุตซอล โฟกัสและใช้งานง่าย สะอาดตา 100%
  - แก้ไขปัญหาเดิมที่มี 44 แมตช์ทุกกีฬารวมกันเป็นรายการยาวถึง 7,800px บนมือถือ โดยไม่มีตัวกรอง
  - **แถบกรองชนิดกีฬา (Sport Filter Pills):** แสดงไอคอนกีฬา `SportIcon` พร้อม Badge จำนวนแมตช์ เลื่อนในแนวนอนได้บนมือถือ สลับดูเฉพาะฟุตซอล, วอลเลย์บอล, เปตอง ฯลฯ ได้ใน 1 คลิก
  - **แถบกรองวันแข่งขัน (Date Filter Pills):** `[ทุกวัน]` `[ศ. 9 ต.ค.]` `[ส. 10 ต.ค.]` `[อา. 11 ต.ค.]` เลือกวันแข่งขันที่ลงสนามได้ทันที
  - **ช่องค้นหาด่วน (Quick Search):** ค้นหาตามชื่อทีม (เช่น "สีม่วง", "สีเขียว"), รอบการแข่งขัน, หรือสนามแข่ง แสดงผลแบบเรียลไทม์พร้อมปุ่มล้างการค้นหา
  - **การ์ดแมตช์โฉมใหม่ (Mobile-First Match Cards):** แสดงแท็กชนิดกีฬาและรอบเด่นชัด, ผลคะแนนตัวใหญ่คมชัด, ข้อมูลวัน-เวลาและสนามแข่ง, พร้อมปุ่ม callout **"แตะเพื่อลงคะแนน →"** (หรือ **"⚡ กำลังแข่ง · แตะลงคะแนน"**) เพิ่มความชัดเจนว่ากดได้
  - **แถบอธิบายสิทธิ์ Super Admin:** อธิบายสาเหตุที่แอดมินเห็นทุกกีฬา (เพราะมีสิทธิ์ Super Admin) พร้อมแนะนำให้แตะปุ่มกีฬาเพื่อกรองดู หรือกดปุ่ม "ออก" (มุมขวาบน) เพื่อทดสอบล็อกอินด้วย PIN 6 หลักของกรรมการสนาม
  - **Badge ระบุกีฬาของกรรมการ PIN:** หากเป็นกรรมการที่ล็อกอินด้วย PIN จะแสดงป้ายระบุกีฬาประจำตัวชัดเจน เช่น `⚽ กรรมการประจำกีฬา: ฟุตซอล (PIN)`

- ✅ **ปรับปรุง UI ฟอร์มสร้าง PIN กรรมการ (`/admin/pins`) (24 ก.ย.)**:
  - แก้ไขปัญหาปุ่ม `+ สร้าง PIN` หลุดระนาบ (baseline) จมต่ำกว่ากล่องอินพุต 24px เนื่องจาก `.form-group` มี margin-bottom
  - กำหนดคลาสเฉพาะ `.pin-create-form` และ `.pin-create-btn` ใน `components.css`: ลบ margin ส่วนเกินออก และล็อกความสูงให้เสมอกันที่ 46px ทุกช่อง
  - ปรับสัดส่วน Grid บนเดสก์ท็อปให้พอดี (`minmax(140px, 1.2fr) minmax(200px, 2fr) minmax(180px, 1.4fr) auto`) โดยปุ่มมีขนาดกะทัดรัดตามเนื้อหา ไม่ยืดแบนเต็ม 1fr
  - นำเข้าไอคอน `<Plus size={16} />` แบบ SVG มาตรฐานเดียวกับปุ่ม `+ เพิ่มผู้ใช้งานใหม่` และ `+ สร้างแมตช์แข่งขันใหม่`
  - แก้ไขการตัดคำและการซ้อนทับของข้อความ "จะแสดง ครั้งเดียว ตอนสร้าง" ใต้ฟอร์ม
  - รองรับหน้าจอแท็บเล็ตและมือถืออย่างเป็นระเบียบ (ซ่อน label spacer เมื่อ wrap เป็น 2 คอลัมน์ หรือ 1 คอลัมน์)

- ✅ **ระบบตัดสินชนะบาย (Walkover) & การปรับตารางแข่ง (24 ก.ย.)** — รองรับกรณีทีมไม่มารายงานตัวตามเวลา หรือบางสาขาไม่ได้ส่งนักกีฬาเข้าแข่งขันในประเภทนั้น ๆ:
  - **ตรรกะคะแนนชนะบายตามประเภทกีฬา (`src/lib/scoring-walkover.js`):**
    - กีฬาที่นับแต้ม (ฟุตซอล, บาสเกตบอล, เปตอง): ให้ผู้ชนะได้คะแนน **2 - 0** ตามมาตรฐานกีฬาสากล
    - กีฬาที่นับเซต (วอลเลย์บอล, เซปักตะกร้อ): ให้ผู้ชนะได้เซตเต็มที่ต้องชนะ (เช่น 2 - 0 เซต) และแต้มเซตเต็ม (เช่น 25-0 หรือ 15-0)
  - **API `POST /api/match/[id]/walkover` (`src/app/api/match/[id]/[action]/route.js`):**
    - รองรับสิทธิ์ Admin, Staff, และกรรมการ PIN ประจำกีฬานั้น ๆ
    - หากแมตช์ยังไม่เริ่ม (upcoming) ระบบจะเปิดแมตช์ (start) ให้ก่อนโดยอัตโนมัติ
    - ปรับคะแนนเป็นคะแนนชนะบาย และสั่งจบการแข่งขัน (finish)
    - **Trigger อัตโนมัติในฐานข้อมูลทำงานทันที:**
      - Trigger `trg_advance_bracket`: ส่งทีมผู้ชนะบายเข้าสู่รอบชิงชนะเลิศ (`next_match_id`) และทีมผู้แพ้ไปรอบชิงอันดับ 3 (`loser_next_match_id`) โดยอัตโนมัติ
      - Trigger `trg_match_points`: บันทึก 3 แต้มลีกให้ทีมชนะ และ 0 แต้มให้ทีมแพ้
    - บันทึกธง `is_walkover: true` ในตาราง `matches` และ revalidate หน้าเว็บแบบ Realtime
    - หาก Admin สั่ง Reopen แมตช์ ระบบจะรีเซ็ต `is_walkover: false` ให้อัตโนมัติ
  - **หน้าแอดมิน (`src/components/admin/MatchEditor.js`):**
    - ในหน้าต่างบันทึกผลการแข่งขัน เพิ่มกล่อง **"★ ตัดสินชนะบาย (Walkover)"** พร้อมปุ่มให้ `[ ทีม A ชนะบาย ]` หรือ `[ ทีม B ชนะบาย ]` พร้อมกล่องยืนยันก่อนบันทึก
    - ในตารางรายการแมตช์ แสดงป้ายกำกับ **`★ ชนะบาย`** โทนสีทองอำพัน เด่นชัดข้างสถานะแมตช์
    - Admin สามารถใช้ปุ่ม **"แก้ตาราง"** เพื่อปรับสายแข่งล่วงหน้าได้ทันที หากประเภทไหนมีทีมแข่งเพียง 2 หรือ 3 ทีม
  - **หน้ากรรมการ (`src/components/staff/ScoreInput/ScorePad.js` & `ConfirmFinish.js`):**
    - เพิ่มปุ่ม **"★ ตัดสินชนะบาย (Walkover)"** ทั้งในหน้าก่อนเริ่มแข่ง และในแถบเครื่องมือด่วนตอนกำลังแข่ง
    - หน้าต่างป๊อปอัปให้กรรมการเลือกว่าทีมใดชนะบาย (เนื่องจากคู่แข่งสละสิทธิ์หรือไม่มารายงานตัว)
    - หน้ายืนยันและหน้ารายงานผล แสดงข้อความชัดเจน: `★ [ชื่อทีม] ชนะบาย`
  - **หน้าการ์ดและป๊อปอัปสาธารณะ (`MatchCard.js` & `MatchDetailModal.js`):**
    - บนการ์ดแมตช์ที่จบด้วยชนะบาย แสดงป้าย **`★ ชนะบาย`** ชัดเจน สื่อสารโปร่งใสแก่ผู้ชม
    - ในหน้าต่างป๊อปอัป `MatchDetailModal`: แสดงป้ายสถานะ `★ ชนะบาย (Walkover)` และข้อความระบุชัดเจนใต้ผลคะแนน
  - **Migration `011_match_walkover.sql`:**
    - เพิ่มคอลัมน์ `is_walkover boolean NOT NULL DEFAULT false;` ใน `matches`
    - อัปเดต View `matches_public_v2` ให้มี `is_walkover` ต่อท้ายคอลัมน์เดิมแบบ Idempotent
    - **รันบน Production Supabase เรียบร้อยแล้ว** (ตรวจพบ 31 คอลัมน์บน `matches` และอ่านค่าผ่าน anon ได้สมบูรณ์)
  - **การทดสอบ:**
    - เพิ่ม Unit Tests ใน `tests/walkover.test.js` รวม 7 เคส (กีฬาเซต, กีฬาแต้ม, ข้อมูลขาดหาย, ฟอร์แมตป้ายภาษาไทย)
    - Vitest **98 tests ผ่าน 100%**, ESLint ผ่าน 0 errors/warnings, Prettier ผ่าน 100%, `npm run build` ผ่าน 100%

- ✅ **นำไอคอนหน้าหัวข้อทุกหน้าออกทั้งหมด (24 ก.ย.)** — ตามความต้องการของผู้ใช้:
  - **ฝั่ง Public:**
    - `/schedule`: ถอดไอคอน `Calendar` ออกจาก `ตารางการแข่งขัน`
    - `ScheduleGrid`: ถอดไอคอน `Calendar` และจุดสีนำหน้าวันที่ในมุมมองรายวัน
    - `/results` (`ResultsBoard`): ถอดไอคอน `Trophy` ออกจาก `ผลการแข่งขัน`
    - `/news`: ถอดไอคอน `Megaphone` ออกจาก `ข่าวสารและประกาศ`
    - หน้าแรก `/` (`page.js`): ถอดไอคอนออกจากหัวข้อส่วนต่าง ๆ (`ข่าวประชาสัมพันธ์ล่าสุด`, `การแข่งขันที่น่าสนใจ`, `อันดับคะแนน`)
    - `/handbook` (`HandbookHub`): ถอดไอคอน `Sparkles` ออกจากแถบเอกสารทางการ
  - **ฝั่ง Admin (ทุกหน้า):**
    - ถอดไอคอนนำหน้า `<h1>` ของทุกหน้าใน `/admin/*` (`/admin`, `/analytics`, `/athletes`, `/audit`, `/bracket`, `/departments`, `/live`, `/matches`, `/news`, `/pdf`, `/pins`, `/settings`, `/sport-schedules`, `/users`)
  - คลีน unused imports ของ icons ทั้งหมด
  - Vitest 91 tests ผ่าน 100%, ESLint ผ่าน 0 errors, `npm run build` ผ่าน 100%
- ✅ **เปลี่ยนปุ่มใน HeroSection หน้าแรกเป็น "สูจิบัตร" (24 ก.ย.)** — ตามความต้องการของผู้ใช้:
  - แก้ไขใน `HeroSection.js`: เปลี่ยนปุ่มรองด้านขวาจากเดิม `ข่าวประชาสัมพันธ์` (`/news`) เป็น `สูจิบัตร` (`/handbook`)
  - ทำให้ผู้ใช้งานหน้าแรกสามารถกดเข้าดูสูจิบัตร กติกา และตารางแข่งขันฉบับเต็มได้อย่างรวดเร็ว
  - Vitest 91 tests ผ่าน 100%, ESLint ผ่าน, `npm run build` ผ่าน 100%
- ✅ **แก้ปัญหากล่องคะแนน/เวลาในป๊อปอัปรายละเอียดแมตช์หลุดขอบจอ (MatchDetailModal) (24 ก.ย.)** — ตามความต้องการของผู้ใช้:
  - แก้ไขใน `MatchDetailModal.js`: ปรับ Grid เป็น `minmax(0, 1fr) auto minmax(0, 1fr)` พร้อม `gap: 0.4rem` และ `minWidth: 0` ทุกคอลัมน์
  - ปรับขนาดฟอนต์และแพดดิ้งของแคปซูล "รอผลการแข่งขัน" ด้วย `clamp()` และ `textOverflow: ellipsis` ป้องกันกล่องทีมล้นจอ
  - ปรับเวลา/สกอร์ตรงกลางเป็น `clamp(1.25rem, 4vw, 1.65rem)` และตัด `minWidth: 130px` ที่ดันจอออก
  - ใส่ `overflowX: hidden` ที่กล่องโมดอลและกล่องสกอร์บอร์ด ป้องกันการเกิดแนวนอนล้นขอบบนมือถือความกว้าง 360px–394px
  - Vitest 91 tests ผ่าน 100%, ESLint ผ่าน, `npm run build` ผ่าน 100%
- ✅ **แสดงประเภท (ชาย/หญิง) ในรอบชิงชนะเลิศและชิงอันดับ 3 (24 ก.ย.)** — ตามความต้องการของผู้ใช้:
  - แก้ไขการ์ดแข่งขัน `MatchCard.js` และหน้าต่างรายละเอียด `MatchDetailModal.js` รวมถึงคอมโพเนนต์อื่น ๆ (`SportLiveCard.js`, `SportLiveDetail.js`, `MatchPicker.js`, `ScorePad.js`, `LiveMonitor.js`, `AuditLog.js`):
  - ป้ายเหรียญรางวัลรอบชิงชนะเลิศจะแสดงประเภทกำกับอย่างชัดเจน เช่น `★ ชิงชนะเลิศ (ชาย)` / `★ ชิงชนะเลิศ (หญิง)`
  - ป้ายชิงอันดับ 3 แสดงประเภทกำกับอย่างชัดเจน เช่น `★ ชิงอันดับ 3 (ชาย)` / `★ ชิงอันดับ 3 (หญิง)`
  - ตรวจสอบความถูกต้องรอบด้าน: Vitest 91 tests ผ่าน 100%, ESLint ผ่าน, `npm run build` ผ่าน 100%
- 📝 **แผนปุ่ม "ดู PIN" อีกครั้ง (24 ก.ย., ยังไม่ลงมือ)** — `docs/plans/2026-09-24-pin-reveal.md`: ตอนนี้เก็บแค่ bcrypt hash จึงดูซ้ำไม่ได้; เสนอ (ก) เก็บเพิ่ม `pin_encrypted` AES-256-GCM คีย์ใน env ใหม่ `PIN_ENCRYPTION_KEY` + `POST /api/admin/pins/[id]/reveal` บันทึก audit `reveal_pin` ทุกครั้ง (migration 011, ลำดับ: ตั้ง env → รัน 011 → deploy) และ/หรือ (ค) ปุ่ม "ตั้ง PIN ใหม่" — รอผู้ใช้เลือก
- ✅ **แยกสีเหรียญรางวัลชัดเจน: รอบชิงชนะเลิศ (สีทอง Gold) vs ชิงอันดับ 3 (สีทองแดง Bronze) (24 ก.ย.)** — ตามความต้องการของผู้ใช้:
  - **รอบชิงชนะเลิศ (Final):** สีทองอร่ามพรีเมียม (Gold `#f59e0b`) ขอบการ์ดทองหนา 2px, แถบชิมเมอร์ทองด้านบน 4px, ป้าย `★ รอบชิงชนะเลิศ`, แคปซูลและกล่องเวลาโทนสีทองอำพันสว่าง
  - **รอบชิงอันดับ 3 (3rd Place):** สีทองแดง/บรอนซ์เข้มขลัง (Bronze `#ea580c` / `#c2410c`) ขอบการ์ดทองแดง 2px, แถบชิมเมอร์ทองแดงด้านบน 4px, ป้าย `★ รอบชิงอันดับ 3`, แคปซูลและกล่องเวลาโทนสีทองแดงเข้ม สื่อถึงการชิงเหรียญทองแดงชัดเจน ไม่ซ้ำกับรอบชิงชนะเลิศ
  - ปรับใช้ทั้งใน `MatchCard.js` และ `MatchDetailModal.js`
  - Vitest 91 tests ผ่าน 100%, `npm run build` ผ่าน 100%
- ✅ **ตรวจระบบรอบ 3–4: สิทธิ์ + แอดมิน + หน้ากรรมการ กดจริงบนมือถือ (24 ก.ย.)** — ผลเต็มใน §9 ข้อ 14–25 ของแผนตรวจ
  - ใหม่: `scripts/permission-matrix.mjs` (`npm run test:perm [url]`) — API 16 route + หน้าที่ถูกกัน × anon/PIN/staff/admin + คะแนนสดรั่วไหม 36 checks (สร้าง/ลบบัญชี+PIN+แมตช์ชั่วคราวเอง)
  - **P0 แก้แล้ว**: (1) ตารางใน `/admin/matches` `users` `departments` `sport-schedules` ครอบด้วย `overflow:hidden` → ปุ่มหลุดจอมือถือกดไม่ได้ → `overflowX:auto` (2) `/staff/scoring` รายการคู่ **ไม่อัปเดตเลยสำหรับกรรมการ PIN** (พึ่ง Realtime แต่ PIN = anon ถูก RLS 008 บัง) → `upsertMatch` ตอนกลับ + `router.refresh()` ทุก 20 วิ/ตอนเปิดจอ
  - P1 แก้แล้ว: QR ใน `/admin/pins` ไม่เคยแสดง (สี `var(--text)` จาก theme codemod → qrcode throw) → `lib/pin-qr.js`; analytics/Live Monitor/grid ล้นจอ 360px → ทุกหน้า 22 หน้าผ่านที่ 360px
  - กดจริงครบ: แมตช์ (สร้าง/แก้ตาราง/บันทึกผล/override/จบ/เปิดใหม่/ลบ), หน้ากรรมการ (+1/−1/ยกเลิกล่าสุด/จบ), ข่าว (สร้าง/ปักหมุด/แก้/ลบ), PIN (สร้าง/ปิด/ลบ), ตั้งค่า, audit, Live Monitor — **ข้อมูลทดสอบลบหมด** ตรวจแล้ว 44 คู่ upcoming, score_events 0, PIN 0, ข่าว 0, สวิตช์ลงคะแนนเปิดอยู่
  - Vitest **91** · permission matrix 36/36 · smoke ผ่าน
- ✅ **แก้ผลตรวจรอบ 2 + เทสต์ (24 ก.ย.)** — ดูข้อ 4–10 ใน §9 ของแผนตรวจ
  - `/news` ไม่มีข่าวตัวอย่างปลอมแล้ว (เดิมโชว์ "ประกาศสำคัญ (ปักหมุด)" ชวนสมัครออนไลน์) → ขึ้น "ยังไม่มีประกาศ"
  - หน้าแรก: `force-dynamic` → **ISR 30 วิ** (`loadPublicPage`); "การแข่งขันที่น่าสนใจ" ใช้ `lib/featured-matches.js` `pickFeaturedMatches()` = 1 คู่ต่อกีฬา (live → upcoming ถัดไป → finished ล่าสุด, live ขึ้นก่อน) แทน `limit(4)`; แอดมินเขียน matches/announcements revalidate `/` ด้วย
  - modal แมตช์: วันที่ `fmtEventDay`, แท็บกติกาใช้ `rulesSummary`/`matchDuration` จริงจาก handbook ผ่าน `findHandbookSport()` (DB `sports` ไม่มีกติกา) + ลิงก์ไป `/handbook`; ตัดข้อความ "ปรับแพ้ทันที" ที่ยืนยันกับ PDF ไม่ได้ (PDF สูจิบัตร extract ข้อความไทยไม่ได้ — ฟอนต์ไม่มี ToUnicode)
  - footer เมนูลัดสูง 44px; ธีมไม่แตะ (ค่าเริ่มต้นสว่างเป็นการตัดสินใจเดิม)
  - แยก logic ให้เทสต์ได้: `lib/schedule-patch.js` (ฟอร์ม "แก้ตาราง"), `splitVenueCourt()` ใน `data/handbook.js` (seeder ใช้แทน `placeOf`)
  - เทสต์ใหม่ 15 ข้อ: `featured-matches`, `schedule-patch`, `register-closed` (410), handbook `splitVenueCourt`/`findHandbookSport`, revalidate `/` → **Vitest 87**
  - ปรับใช้ทั้งใน `MatchCard` บนหน้า `/schedule`, `/results`, `/` และในหน้าต่างป๊อปอัป `MatchDetailModal`
  - Vitest 72 tests ผ่าน 100%, Prettier & Lint ผ่าน
- ✅ **แสดงสีตามเหรียญรางวัลในรอบชิงฯ และชิงอันดับ 3 (24 ก.ย.)** — ปรับปรุง UI ใน `MatchCard.js`, `MatchDetailModal.js`, `team-style.js` ให้แสดงสีตามเหรียญรางวัล: รอบชิงชนะเลิศใช้ **สีเหรียญทอง (Gold `#f59e0b`)** และรอบชิงอันดับ 3 ใช้ **สีเหรียญทองแดง (Bronze `#ea580c`)** ทั้งเส้นแถบขอบการ์ด, แสงเรือง ambient glow, เส้นขอบการ์ด และข้อความ "รอผลการแข่งขัน"; พร้อมเพิ่ม unit tests ใน `bracket-progression.test.js` รวม 72 tests ผ่าน 100%
- ✅ **ปิดรับสมัครที่ API + แก้ตารางแมตช์จากหน้าแอดมิน (24 ก.ย.)** — ข้อ 1 และ 4 ใน §7 ของแผนตรวจ
  - `POST /api/register` ตอบ **410 `REGISTRATION_CLOSED`** ทุกคำขอ (เดิมหน้าเว็บ redirect แล้วแต่ API ยังเพิ่มนักกีฬาได้) + smoke check ใหม่; โค้ดสมัครเดิม (`RegistrationForm`, `validateRegistration`, `lib/api/register`) ยังอยู่ ไม่มีใครเรียก — handler เต็มอยู่ใน git history ถ้าจะเปิดอีก
  - `/admin/matches` ปุ่ม **"แก้ตาราง"** → modal แก้ทีม A/B, วัน, เวลา, สถานที่, สนามย่อย; PATCH เฉพาะช่องที่เปลี่ยน (audit log อ่านง่าย); เตือนถ้าแมตช์เริ่ม/จบแล้วว่าการเปลี่ยนทีมไม่ย้ายคะแนน; แก้แมตช์แล้ว revalidate ทั้ง `/schedule` และ `/results`
- ✅ **แผนตรวจทุกหน้าทุกระบบ (24 ก.ย.)** — `docs/plans/2026-09-24-full-system-check.md`: กติกาการตรวจบน DB production ตัวเดียว (ใช้ข้อมูล `[TEST]` แล้วลบ), checklist หน้าผู้ชม 10 · กรรมการ · แอดมิน 15 หน้า · 16 API × 4 บทบาท · คะแนนสดรั่ว · bracket 5 กีฬา · หลายเครื่อง · โหลด Free tier · อุปกรณ์จริง · ข้อมูลจริง; แบ่ง 7 รอบพร้อมผู้รับผิดชอบและกำหนดเวลา (รอบ 1–5 ภายใน 30 ก.ย., ซ้อมจริงก่อน 5 ต.ค., ล้างข้อมูล 8 ต.ค.)
  - เจอระหว่างเขียนแผน (§7 ของแผน รอผู้ใช้ตัดสินใจ): **`POST /api/register` ยังรับสมัครได้** ทั้งที่หน้า `/register` redirect แล้ว (P1) · `/admin/matches` แก้วัน/เวลา/สนามของแมตช์เดิมไม่ได้ ทั้งที่ runbook บอกให้แก้ที่นั่น (P1) · ข้อความตัวอย่าง `/news` พูดถึง "เปิดรับสมัคร" (P2)
- ✅ **คอลัมน์ `court` + pre-commit hook + CI (24 ก.ย.)**
  - **migration 010** `matches.court` (สนามย่อยในสถานที่; ใช้กับเปตอง "สนาม 1–4" กีฬาอื่นเป็น NULL) + ย้ายข้อมูลเปตอง 12 คู่เดิมจาก venue "สนาม N" → venue "สนามเปตอง" + court "สนาม N" (**รันบน production แล้ว**, ตรวจครบ 12 คู่)
  - view ใหม่ **`matches_public_v2`** (= การซ่อนคะแนนสดของ 007 + `court`) — หน้าเว็บทั้งหมดอ่านตัวนี้แทน `matches_public`; ที่ไม่แก้ view เดิมเพราะ `CREATE OR REPLACE VIEW` ลดคอลัมน์ไม่ได้ → รัน 007 ซ้ำหลังเพิ่มคอลัมน์จะ error (view เก่ายังอยู่ ไม่มีใครอ่าน)
  - `fmtPlace(match, fallback)` ใน `lib/format.js` → แสดง "สนามเปตอง · สนาม 1" ทุกหน้า (MatchCard, MatchDetailModal, live card/detail, MatchPicker, ScorePad, LiveMonitor, MatchEditor); ฟอร์มสร้างแมตช์มีช่อง "สนามย่อย (ถ้ามี)"; `adminResources` รับ `court`; seeder แยก venue/court (`placeOf()`)
  - **CI** `.github/workflows/ci.yml`: job `app` (npm ci → lint → format:check → test → build ไม่ใช้ secret — client ใช้ placeholder) + job `db` (Postgres 16 service → `run-local.sh` ทุก migration + scenario) — รันทุก push เข้า main และทุก PR; ❌ ไม่บล็อก deploy ของ Vercel
  - **pre-commit hook** `.githooks/pre-commit`: prettier + eslint (`--max-warnings 0`) เฉพาะไฟล์ที่ stage + vitest; ติดตั้งอัตโนมัติผ่าน `npm install` (`prepare` → `scripts/install-hooks.mjs` ตั้ง `core.hooksPath`); ข้ามฉุกเฉินได้ด้วย `git commit --no-verify`
  - ผู้ใช้ตัดสินใจ: **ไม่เปิดรับสมัครผ่านเว็บ** และ **กติกาให้โหลด PDF อย่างเดียว** (ไม่ทำหน้ากติกาบนเว็บ)
  - เกณฑ์: build ✅ · lint ✅ · format ✅ · Vitest 71 ✅ · DB scenario 12/12 ✅
- ✅ **เอาไอคอน ⏳ ออกจากการ์ด "รอผลการแข่งขัน" (24 ก.ย.)** — ปรับปรุง UI ใน `MatchCard.js` และ `MatchDetailModal.js` ตามความต้องการของผู้ใช้ โดยตัดไอคอน `⏳` ที่แสดงข้างข้อความ "รอผลการแข่งขัน" ออกทั้งหมด และปรับขนาดตัวอักษรให้อ่านง่ายพอดี ไม่บีบตัวหนังสือให้ตัดบรรทัดย่อย; `npm run build` และ Vitest 70 tests ผ่าน 100%
- ✅ **สลับไปใช้ข้อมูลจริงจากเอกสารทางการ (23 ก.ย.)** — อ่าน `final/กำหนดการ69.pdf` + `final/สูจิบัตร69 (3).pdf` แล้วเทียบ 3 ชั้น (PDF ↔ `data/handbook.js` ↔ แถวจริงบน Supabase) บันทึกผลไว้ใน **`docs/plans/2026-09-23-real-data-switch.md`**
  - **เวลาเซปักตะกร้อคู่ 2/3/4 ผิด** (ช้าไป 30 นาที ทำให้คู่ 4 ชนกับชิงที่ 3 ชาย 19:30) → แก้เป็น 18:00 / 18:30 / 19:00
  - **`seed-matches.mjs` ไม่เคยเขียน `next_match_id` / `loser_next_match_id`** → ผู้ชนะจะไม่เลื่อนเข้ารอบชิงเลย (ฟีเจอร์ bracket ของเพื่อนใช้ไม่ได้กับข้อมูลจริง) → เพิ่ม second pass แปลง handbook id → uuid (จับคู่ด้วยค่าจริง ไม่เชื่อลำดับที่ PostgREST คืน) + ธง `--force` สำหรับ seed ซ้ำ
  - **migration 009** กติกาตามสูจิบัตร: ตะกร้อ 21 → **15** ต่อเซต · เปตองจาก sets/13 → **points ถึง 11** (เซตตัดสิน 15/8 และชิงเปตอง 13 ไม่ใส่ใน schema — กรรมการคุมเอง ตามที่ผู้ใช้เลือก)
  - **เตือนเมื่อคะแนนเสมอ** ตอนยืนยันจบแมตช์ (ฟุตซอล = ยิงจุดโทษ, บาส = ต่อเวลา, อื่น ๆ = แพ้คัดออกไม่มีทีมผ่าน) — ยังกดจบได้ตามที่สั่ง
  - **กำหนดการวันอาทิตย์** (ลงทะเบียน/พิธีเปิด/วอลเลย์บอลยักษ์/พักเที่ยง/ประกาศผล+พิธีปิด) แสดงบน `/schedule` ผ่าน `CEREMONY_PROGRAMME` + `components/public/CeremonyProgramme.js`
  - **สูจิบัตรบนเว็บเป็นคนละฉบับ** กับ `final/` → เปลี่ยนไฟล์ + แก้ขนาด/วันที่ใน `data/documents.js`
  - **Seed ของจริงบน production แล้ว**: 44 คู่ (8/8/8/8/12) สถานะ upcoming ทั้งหมด · รอบแรก 22 คู่มีทีมครบ + links ครบ · รอบชิง 22 คู่เป็น "รอผลการแข่งขัน" · ไม่มีคู่ไหนชนสนาม/เวลากัน · ลบข้อมูลทดสอบเดิมหมด (score_events 0)
  - **ทดสอบ progression จริงบน production**: จบฟุตซอลหญิงคู่แรก 3-1 → สีม่วงเข้าชิงชนะเลิศ, สีเขียวไปชิงที่ 3 อัตโนมัติ แล้วรีเซ็ตคืนเรียบร้อย
  - เทสต์ใหม่: `tests/handbook-schedule.test.js` (7 เคส — จำนวนคู่, 3 วันงาน, ไม่ชนสนาม/เวลา, ตะกร้อทุก 30 นาที, bracket links ครบและไม่ซ้ำช่อง) + `drawWarning` ใน `tests/scoring.test.js` + scenario 009 ใน DB suite → **Vitest 70 · DB 11/11**
  - ℹ️ Vercel deploy commit ของ AI ได้แล้วในรอบนี้ (production เสิร์ฟ build ใหม่ + PDF ใหม่) — ถ้าพบว่าไม่ขึ้นอีก ให้กลับไปใช้วิธีให้เพื่อน push ตาม


- ✅ **ระบบสายการแข่งขันและส่งต่อทีมผู้ชนะ (Tournament Bracket & Winner Progression) (23 ก.ย.)** — แก้ไขปัญหาการล็อกสีคู่แข่งในรอบชิงชนะเลิศและชิงอันดับ 3 ล่วงหน้า โดยปรับให้แสดงสถานะ **"รอผลการแข่งขัน"** ในโทนสีกลางโมเดิร์น (Slate Glass `#64748b` ไม่แสดงสีแดง/ฟ้าหลอกตา) พร้อมไอคอน `⏳`; อัปเดต `MatchCard`, `MatchDetailModal`, `team-style.js`; เชื่อมโยงสายแข่งใน `handbook.js` (22 แมตช์ชิงเหรียญเริ่มต้น `null` และผูก `next_match_id` / `loser_next_match_id`); ปรับ `MatchEditor.js` และ `adminResources.js` ให้แอดมินแก้ไขหรือ override แมตช์ที่ยังไม่มีทีมได้อย่างอิสระ; ปรับ `seed-matches.mjs`; เพิ่ม unit tests ครบถ้วน (`tests/bracket-progression.test.js`) รวม 61 tests ผ่าน 100%, lint ผ่าน, build ผ่าน
- ✅ **ปรับแก้สถานที่ใน HeroSection และ Footer (23 ก.ย.)** — เปลี่ยนข้อความจากเดิม "ณ ศูนย์กีฬามหาวิทยาลัยราชภัฏภูเก็ต" เป็น "ณ มหาวิทยาลัยราชภัฏภูเก็ต" (และใน Footer) ตัดคำว่า "ศูนย์" ออกตามความต้องการผู้ใช้
- ✅ **ระบบดูสูจิบัตร & กำหนดการ (`/handbook`) (23 ก.ย.)** — ปรับ `next.config.mjs` อนุญาต `X-Frame-Options: SAMEORIGIN` และ `Content-Disposition: inline` สำหรับ `/docs/*`; ปรับแต่งหน้า `/handbook` ให้กระชับ สวยงาม (เน้นการ์ดสูจิบัตร 20 หน้า และกำหนดการ 3 หน้าโดยตรง พร้อมปุ่มดาวน์โหลด/พรีวิว); หน้าต่าง `DocumentPreviewModal` แสดงผลไฟล์ PDF ทางการแบบเต็มพื้นที่ สะอาด เรียบหรู พร้อมปุ่มเปิดเต็มจอและดาวน์โหลด PDF ตรง
- ✅ **กันคะแนนสดระดับฐานข้อมูล (23 ก.ย., migration 007 + 008; ผู้ใช้อนุมัติ)** — เดิมซ่อนแค่ UI: `score_a/score_b` ของแมตช์ `live` ยังติดมากับ payload ของ `/results` และยิง Supabase ด้วย anon key อ่านได้ (พิสูจน์แล้วเห็น 77-33)
  - **007** `matches_public` view (NULL ให้ `score_a/score_b/sets_a/sets_b/current_set/last_score_at/last_scored_team` เมื่อ `status='live'`) + GRANT ให้ anon/authenticated — **ปลอดภัยกับเว็บที่รันอยู่**; **008** เปลี่ยน policy `public_read` → `staff_read` (`get_user_role() IS NOT NULL`) บน `matches`, `match_sets`, `score_events`
  - **ลำดับสำคัญ**: รัน 007 → deploy โค้ด → รัน 008 (ถ้าสลับลำดับ หน้าสาธารณะจะว่างหรือ view ไม่มี) — ทำครบทั้ง 3 ขั้นแล้ว
  - โค้ด: `/`, `/schedule`, `/results` (server+client) อ่าน view ผ่าน `getPublicMatches` / `loadLiveData({ publicView })` / `useLiveScores({ publicView })`; `/staff/scoring` อ่านด้วย **service role** หลัง `requireScorer()` (กรรมการ PIN เป็น anon ในสายตา Supabase); `/live` ต้องเป็นบัญชี staff/admin — PIN ถูกส่งไป `/staff/scoring`
  - ยืนยันบน production: anon อ่าน `matches`/`match_sets`/`score_events` ไม่ได้ (0 แถว), `matches_public` คืน `score_a=null` ตอน live, payload ของ `/results` ไม่มีคะแนน; **กรรมการ PIN เปิด `/staff/scoring` เห็นแมตช์+คะแนนปกติ**, แอดมินเห็น `/admin/live` และ `/live` ครบ; **smoke 52/52**, DB scenario 10/10, Vitest 54
  - ℹ️ ถ้า PostgREST ยังไม่เห็น view ใหม่ (`PGRST205`) ให้รัน `NOTIFY pgrst, 'reload schema';`
  - ⚠️ **บทเรียน**: `select(..., { head: true })` คืน 204 โดยไม่มี error แม้ relation ไม่มีอยู่ → ห้ามใช้เช็คว่ามีตาราง/view จริงไหม ให้ query จริง

- ⚠️ **ข้อจำกัด deploy (23 ก.ย.)** — Vercel โปรเจกต์อยู่บน **Hobby plan + repo private** → commit ที่ author เป็น `chokun555phaerngam` **ถูกบล็อก ไม่ trigger deploy** ("commit author did not have contributing access") และปุ่ม Redeploy ในแดชบอร์ดก็ใช้ไม่ได้ถ้าไม่ใช่เจ้าของบัญชี (`akarinnoochoo2005`) — **วิธีที่ใช้อยู่: ให้เพื่อน (Esther03u) push ตามหลัง** commit เปล่าก็ได้ (`git commit --allow-empty -m "chore: trigger deploy" && git push`) แล้วงานทั้งหมดจะขึ้นพร้อมกัน; ทางแก้ถาวร: เปลี่ยน repo เป็น public (ไม่มี secret ใน git) / ส่งงานเป็น branch ให้เพื่อน merge / อัป Pro

- ✅ **ระบบศูนย์ดาวน์โหลดสูจิบัตรและกำหนดการ (`/handbook`) เสร็จสมบูรณ์ (23 ก.ย.)** — วางไฟล์ทางการ `public/docs/sci-games-2026-handbook.pdf` (20 หน้า) และ `public/docs/sci-games-2026-schedule.pdf` (3 หน้า) จากไฟล์ต้นฉบับจริงในเครื่อง; `src/data/documents.js`; สร้างหน้า `/handbook` พร้อมการ์ด Glassmorphism, ข้อมูลสำคัญ 5 ชนิดกีฬา, `DocumentPreviewModal` รองรับพรีวิว PDF, ปุ่มดาวน์โหลดตรง, ปุ่มเปิดแท็บใหม่; เพิ่มเมนูใน Navbar, QuickLinks หน้าแรก และ Footer; vitest เพิ่ม `tests/documents.test.js` รวม 54 tests ผ่าน 100%, `npm run build` ผ่าน, ตรวจสอบผ่าน browser preview เรียบร้อย
- ✅ Clone repo + `npm install` + `next build` ผ่าน
- ✅ วิเคราะห์โค้ดทั้งหมด พบช่องโหว่/ปัญหา (ดูข้อ 3)
- ✅ Pull commit ล่าสุด `5c8ba1b` "modernize schedule & results filter controls…" (แตะเฉพาะ UI public 16 ไฟล์: `results/page.js`, `ScheduleGrid`, `MatchCard`, `MatchDetailModal` เขียนใหม่, เพิ่ม `SportIcon.js`, `check-status/page.js` ถูกตัดจาก 180 บรรทัดเหลือน้อยมาก — ยังไม่ได้ยืนยันว่าเพื่อนตั้งใจ)
- ✅ ยืนยันแล้วว่า DB จริงบน Supabase = `supabase/migrations/001_initial_schema.sql` เป๊ะ (เพื่อนส่งไฟล์ `supabase/message.txt` มา diff แล้ว IDENTICAL) → migration ใหม่ต่อจาก 001 ได้เลย
- ✅ เก็บ requirement ครบและเขียนแผนเต็มไว้ที่ **`docs/plans/2026-09-20-live-scoring-v2.md`** (ต้องอ่านไฟล์นี้ก่อนลงมือ)
- ✅ **Phase 0 เสร็จ (20 ก.ย.)** — build + lint ผ่าน, migration ทดสอบผ่านบน Postgres local:
  - `src/lib/auth/resolveActor.js` ใหม่: `resolveActor()` → admin/staff/null, `requireAdmin()`, `actorCanScoreSport()` (PIN actor เพิ่มใน Phase 1)
  - `/api/admin/users` มี auth แล้ว (requireAdmin + validate role/password + กันลบตัวเอง + `createAuditLog`)
  - `src/middleware.js` → `src/proxy.js` (Next 16 convention) + matcher `/api/admin/:path*` ตอบ 401 JSON
  - `src/lib/rate-limit.js` เป็น async ใช้ Postgres fn `check_rate_limit()` ผ่าน service role, fallback in-memory; เพิ่ม `getClientIp()`; 3 API routes เปลี่ยนเป็น `await rateLimit(...)`
  - `ScoreInput.js` กรองแมตช์ตาม `assignedSports` (admin เห็นทั้งหมด)
  - **`supabase/migrations/002_live_scoring.sql`** (~930 บรรทัด, idempotent) — ดูสรุป section ในข้อ 4
  - `supabase/tests/` — `00_supabase_stubs.sql` (stub auth.uid/roles/publication), `scenario_live_scoring.sql` (7 scenario, ROLLBACK ท้าย), `run-local.sh`

**Requirement ที่ผู้ใช้ตัดสินใจแล้ว:**

| หัวข้อ | ตัดสินใจ |
|---|---|
| แนวทาง | ต่อยอดโค้ดเดิม |
| หน้าผู้ชม | 1 การ์ดต่อกีฬา = แมตช์ที่กำลังแข่ง, ตำแหน่งการ์ดคงที่ (ไม่ re-sort); กดเข้าไปดู "จบแล้ว+สกอร์ / กำลังแข่ง / คู่ต่อไป" เรียงลำดับ |
| **ผู้ชมไม่เห็นคะแนนสด (ตัดสินใจ 22 ก.ย.)** | ผู้ชมดูที่ `/results` — แมตช์ที่กำลังแข่งขึ้นสถานะ "กำลังแข่ง" **โดยไม่แสดงคะแนน** จนกว่าจะจบ; ลิงก์ "ผลสด" ถูกถอดจาก Navbar/Bottom nav/หน้าแรกแล้ว (route `/live` **ต้องล็อกอิน** admin/staff/PIN ผ่าน `requireViewer()` — ใช้เป็นจอกรรมการ/จอสนาม; anon ถูกส่งไป `/staff/login?next=/live`) — **อย่าเพิ่มคะแนนสดกลับเข้าหน้าบ้าน** |
| Indicator | ↑ เขียวมุมขวาการ์ดเมื่อ**คะแนนเพิ่ม**เท่านั้น (ลดไม่แสดง เพื่อไม่ให้คนดูรู้ว่ากดผิด) + ไฮไลต์ตัวเลขทีมที่ได้แต้ม + "อัปเดตล่าสุด X วิที่แล้ว" |
| ผู้ลงคะแนน | ปุ่ม +1/−1 ใหญ่กดง่าย; เข้าระบบได้ **2 แบบ**: บัญชี Staff (ผูกกีฬา) และ **PIN ต่อกีฬา** |
| กีฬาเซต | วอลเลย์บอล/ตะกร้อ/เปตอง **เก็บคะแนนรายเซต** |
| แก้หลังจบ | Staff แก้ได้ภายใน N นาที (default 10, admin ปรับได้) หลังนั้น admin เท่านั้น |
| Admin เพิ่ม | Live Monitor ทุกสนาม, หน้า Audit + rollback, จัดการ PIN, สร้าง Bracket อัตโนมัติ |

- ✅ **Phase 1 เสร็จ (21 ก.ย.)** — Scoring Engine / API layer; build ผ่าน, `npm test` 11 tests ผ่าน, `npm run test:db` ผ่าน (001→002→003 รันซ้ำได้):
  - `src/lib/auth/pinSession.js` — JWT (jose, HS256) ใน cookie `sg_pin` อายุ 14 ชม. ลงนามด้วย env **`PIN_SESSION_SECRET`** (ใหม่ ต้องตั้งใน Vercel/.env.local ≥16 ตัว)
  - `resolveActor()` รองรับ `{type:'pin'}` แล้ว (เช็ค `sport_pins.is_active/expires_at` ทุก request → admin revoke ได้ทันที); เพิ่ม `requireScorer()`, `requireScorerForSport()`, `actorToRpc()`, `actorPublicView()`
  - `src/lib/api/scoring.js` — `mapRpcError()` แปลง RAISE code จาก Postgres → HTTP status + ข้อความไทย, `callScoringRpc()`, `isUuid()`, `badRequest()/notFound()`
  - Routes ใหม่ 11 ตัว (ดูตารางข้อ 4)
  - `src/hooks/useActor.js` — client hook เรียก `/api/auth/me` (ใช้แทน `useAuth` ในโซน staff)
  - `(staff)/layout.js` ใช้ `useActor` → PIN user เข้าได้; `proxy.js` ปล่อย `/staff/*` ถ้ามี cookie `sg_pin`
  - **`ScoreInput.js` เขียนใหม่** เรียก API ทั้งหมด: optimistic +/− พร้อม queue ส่งทีละรายการ (ตัวเลขไม่กระโดดถอยหลัง), ปุ่ม "ยกเลิกคะแนนล่าสุดของฉัน", กีฬาเซตมีแถบเซต + ปุ่ม "จบเซต", บาสมี +2/+3, แสดง "ซิงค์แล้ว HH:MM:SS", error banner ภาษาไทย
  - `supabase/migrations/003_staff_via_api_only.sql` — ลบ policy `staff_update` + trigger guard (staff ไม่มีทางเขียน `matches` ตรงอีกแล้ว)
  - Vitest: `vitest.config.mjs`, `tests/{pinSession,scoringErrors,resolveActor}.test.js`; scripts `npm test`, `npm run test:db`
  - deps ใหม่: `jose`, `bcryptjs`, devDep `vitest`

- ✅ **Phase 2 เสร็จ (21 ก.ย.)** — Staff UI; build/lint/test ผ่าน, หน้า login ตรวจด้วย browser preview แล้ว (มือถือ 375px):
  - `/staff/login` มี 2 แท็บ: **PIN กรรมการ** (dropdown กีฬา + ช่อง 6 หลัก inputMode numeric → `POST /api/pin/login`) และ **บัญชี Staff**; `?sport=<uuid>` เลือกกีฬาให้และเปิดแท็บ PIN อัตโนมัติ (สำหรับ QR)
  - `staff/scoring/page.js` ดึงแมตช์ที่ finished ภายใน edit window ด้วย (`.or('status.neq.finished,finished_at.gte.<since>')`) และอ่าน `app_settings.score_edit_window_minutes` ผ่าน service role ส่งเป็น prop `editWindowMinutes`
  - `ScoreInput` step 1 แยก 3 กลุ่ม: **กำลังแข่ง / ถัดไป / เพิ่งจบ — ยังแก้ได้** (มี countdown `mm:ss` ต่อการ์ด, tick ทุก 1 วิ); step 2 มีแถบ "แก้ได้อีก mm:ss (ถึง HH:MM)" และล็อกปุ่มเมื่อหมดเวลา (admin ไม่ล็อก)
  - Realtime: `useRealtime` แก้แล้ว (callback ใน `useRef`, คืน channel status, option `enabled`); ScoreInput subscribe `matches` ทั้งตาราง → list อัปเดตเอง, แมตช์ที่กำลังลงคะแนนถ้าถูกแก้จากเครื่องอื่น/admin จะ merge + แจ้ง "คะแนนถูกอัปเดตจากเครื่องอื่น" (เฉพาะตอน queue ว่าง)
  - Offline: `NetworkError` → retry ทุก 3 วิ (สูงสุด 40 ครั้ง) + แถบ "ออฟไลน์ — รอส่ง N รายการ"; `beforeunload` เตือนถ้า queue ไม่ว่าง; `navigator.wakeLock` ระหว่าง step 2 (ขอใหม่เมื่อกลับมาหน้าจอ)
  - ปุ่ม +1 สูง 96px, −1/+2/+3/undo/จบเซต สูง ≥44px, `touchAction: manipulation`
  - `useAuth` ถูกถอดออกจากโซน staff ทั้งหมด (login ใช้ `createClient().auth.signInWithPassword` ตรง)
  - **ธีม:** commit `5c8ba1b` ของเพื่อนเปลี่ยนเว็บเป็น light theme แต่โซน staff/admin ยัง hardcode สีขาว → แก้โซน staff แล้ว (map เป็น `var(--mono-*)`, `var(--gold-600/700)`, `var(--glass-*)`) **โซน admin ยังไม่แก้** (ดู Blockers)
  - `.claude/launch.json` (gitignored) สำหรับ `preview_start` dev server

- ✅ **ทดสอบกับ Supabase จริงแล้ว (21 ก.ย.)** — ผู้ใช้วาง `.env.local` (3 key) + รัน `supabase/apply-all.sql` (001→seed→002→003 รวมไฟล์เดียว, gitignored, สร้างใหม่ได้ด้วยคำสั่งใน Handoff ข้อ 4); ผมเพิ่ม `PIN_SESSION_SECRET` ให้ใน `.env.local`
  - `npm run check:supabase` → `scripts/check-supabase.mjs` ตรวจว่า migration/seed อยู่ครบ + `athletes` ไม่ public
  - `npm run test:smoke` → `scripts/smoke-test.mjs` (ต้อง `npm run dev` ก่อน) สร้าง admin/PIN/แมตช์ชั่วคราว ยิง API ครบ 33 checks (auth guard, PIN lifecycle, สิทธิ์ข้ามกีฬา, futsal, volleyball รายเซต, undo, edit window, standings, **Realtime `score_events` ถึง anon subscriber**, revoke PIN) แล้วลบทิ้ง — **ผ่านทั้งหมด**
  - ทดสอบผ่าน UI จริงบน browser 375px: PIN login → เห็นเฉพาะกีฬาตัวเอง → start → +1 → undo → จบเซต → หน้ายืนยัน
  - **บั๊กที่เจอและแก้แล้ว:** (1) `(staff)/layout.js` ใช้ร่วมกับ `/staff/login` จึงไม่ remount หลัง login → `useActor` ค้าง null → เด้งกลับ login; แก้ให้ `refresh()` เมื่อ pathname เปลี่ยน และ `refresh` ตั้ง loading ก่อน (2) หน้ายืนยันกีฬาเซตแสดงเซตก่อน auto-close ทำให้บอกผู้ชนะผิด → ใช้ `projectedSets()` + เตือนแดงถ้ายังไม่มีทีมชนะครบ `sets_to_win` (3) ปุ่ม undo ยาวเกินจอ → "↶ ยกเลิกล่าสุด"
  - DB ตอนนี้ว่าง (0 matches / 0 admin_users / 0 auth users) — **ยังไม่มีบัญชี admin จริง** ต้องสร้าง (ดู Blockers)
- ✅ **UI Fixes (21 ก.ย.)** — แก้ไขแถบสถานะ Segmented bar ใน `results/page.js` และ `ScheduleGrid.js` ให้สมมาตร 4 ช่องกว้าง 25% เท่ากันเป๊ะ จัดกึ่งกลางพอดี ไม่ล้นกรอบบนมือถือ, คำนวณ `statusCounts` แยกจาก `statusFilter` ทำให้จำนวนนับถูกต้องและแท็บ "กำลังแข่ง" ไม่หายไปเมื่อเลือกแท็บอื่น, รวมฟอนต์ Kanit สม่ำเสมอทั้งเว็บ

- ✅ **บัญชี super_admin จริงสร้างแล้ว** — `Kobayachikoby@gmail.com` (รหัสที่ผู้ใช้กำหนด, ไม่เก็บใน repo) ผ่าน `scripts/create-admin.mjs <email> <password> [name]` (idempotent: รันซ้ำ = รีเซ็ตรหัส)
- ✅ **Phase 3 เสร็จ (21 ก.ย.)** — Viewer UI ทดสอบกับ Supabase จริงใน browser แล้ว (realtime +1 → การ์ดเปลี่ยนทันที + ↑ เขียว 3 วิ):
  - `src/hooks/useLiveScores.js` — 1 channel subscribe `matches` (*), `match_sets` (*), `score_events` (INSERT, เฉพาะ `delta > 0` → `bumps[matchId]`); polling fallback 15 วิ ถ้าไม่ SUBSCRIBED ใน 10 วิ; refetch เมื่อ `visibilitychange`/`online`; helper `matchesForSport`, `matchWinner`, `relativeTime`, `ROUND_LABEL`, `useClock()` (useSyncExternalStore, 0 ตอน SSR กัน hydration mismatch)
  - `src/lib/live-data.js` `loadLiveData(supabase)` — initial data ฝั่ง server (page.js export helper ไม่ได้ใน Next)
  - `/live` (`LiveBoard` + `SportLiveCard`) — grid การ์ดต่อกีฬาเรียง `sort_order` ตายตัว; การ์ดโชว์แมตช์ live ตัวแรก (+ป้าย "LIVE +N"), ไม่มี live → ผลล่าสุด หรือคู่ถัดไป; `.live-indicator` ↑ มุมขวาบน 3 วิ, `.live-score.is-bump` ตัวเลขเด้ง, "อัปเดตล่าสุด X วินาทีที่แล้ว"; กีฬาเซตแสดง "เซตที่ 2: 15–10 | 25–20"
  - `/live/[sportId]` (`SportLiveDetail`) — กำลังแข่ง (ใหญ่ + ตารางรายเซต) / คู่ต่อไป / จบแล้ว (ผู้ชนะเข้ม ผู้แพ้จาง) + `Bracket` 4 ทีมเมื่อมี `round`
  - CSS ใน `globals.css` ท้ายไฟล์ (`live-*`, `prefers-reduced-motion`); ธีม light ตั้งแต่แรก
  - Nav: `Navbar` เพิ่ม "ผลสด", `MobileBottomNav` เพิ่มแท็บ (ไอคอน `Radio`, active ที่ `/live*`), `HeroSection` ปุ่มหลักเป็น "ผลสด"
  - **บั๊กที่เจอและแก้:** (1) hydration mismatch จาก `Date.now()` ใน SSR → `useClock()` (2) React StrictMode mount effect 2 ครั้ง → callback `CLOSED` ของ channel แรกมาทีหลัง `SUBSCRIBED` ของอันที่สอง ทำให้ status ค้าง → ใส่ `active` flag ใน effect (3) `animate-ui/icons/activity.jsx` path SVG ของเพื่อนขาด arc flag → แก้เป็น path ของ lucide
  - **ข้อควรระวังตอน dev:** Browser pane ของ Claude เก็บ console/HMR state ค้างข้าม reload — ถ้าเห็นอาการแปลก ให้เปิดแท็บใหม่ (`tabs_create`) ก่อนสรุปว่าเป็นบั๊ก

- ✅ **Phase 4 เสร็จ (21 ก.ย.)** — Admin; ทุกหน้าทดสอบกับ Supabase จริงใน browser (login admin จริง):
  - ธีมโซน admin แก้แล้ว (เนื้อหาใช้ `var(--mono-*)`; sidebar/header มือถือคง dark โดยตั้งใจ)
  - `src/lib/admin-api.js` `adminApi(path, {method, body})` — fetch wrapper โยน Error ข้อความไทย
  - `useLiveScores()` เพิ่ม `lastEvents[matchId]` (score_events ล่าสุดต่อแมตช์ จาก initial 300 แถว + realtime INSERT); `loadLiveData()` คืน `events` ด้วย; `Bracket` แยกเป็น `src/components/public/live/Bracket.js`
  - `/admin/live` `LiveMonitor` — แถวต่อแมตช์ (เรียง live → upcoming → finished ≤1 ชม.), ผู้ลงคะแนนล่าสุด + event + เวลา, เตือน "ไม่มีคะแนนมา 10 นาที+", ปุ่ม เริ่ม/จบแมตช์/เปิดใหม่/แก้คะแนน (modal → `POST /api/match/[id]/override`), แถว flash เขียวเมื่อมี bump
  - `/admin/audit` `AuditLog` — แท็บ "คะแนนจากสนาม" (score_events 500 ล่าสุด, filter กีฬา/แมตช์/ผู้กด, ปุ่ม ↶ ย้อน → `POST /api/score/undo {event_id}`, timeline 0–0 → 1–0 … เมื่อเลือกแมตช์) และ "การแก้ไขข้อมูล" (audit_logs + diff เฉพาะฟิลด์ที่เปลี่ยน)
  - `/admin/pins` `PinManager` — สร้าง (กีฬา/ชื่อ/หมดอายุ) → modal แสดง PIN ครั้งเดียว + **QR** (`qrcode` lib) ไป `/staff/login?sport=<id>` + ปุ่มคัดลอก; ตาราง เปิด/ปิด/ลบ, ใช้ล่าสุด
  - `/admin/bracket` `BracketBuilder` — เลือกกีฬา (เฉพาะที่ยังไม่มี bracket) + seed 4 สี + วัน/เวลา/สนาม → `POST /api/admin/bracket` → reload; แสดง bracket ทุกกีฬาที่มี
  - `/admin/settings` `SettingsForm` — `score_edit_window_minutes`, `live_scoring_enabled` (สวิตช์นี้ยังไม่มีผลกับ API — เขียนบอกไว้ในหน้าแล้ว)
  - `AdminSidebar` เพิ่มลิงก์ 5 หน้าใหม่ (Live Monitor มีจุดแดง)
  - deps ใหม่: `qrcode`

- ✅ **หน้าตารางแข่ง `/schedule` แยกตามกีฬา (21 ก.ย.)** — ผู้ใช้ทักว่าการ์ดโชว์ "กีฬา / ทีม A / ทีม B" และไม่แยกหมวด:
  - บั๊ก: หน้าใช้ `sports` จริงจาก DB (uuid) แต่ fallback แมตช์เป็น `OFFICIAL_MATCHES` (`sport_id: 'sport-futsal'`) → หา sport ไม่เจอ → แก้ให้ fallback **ทั้งชุด** (`useHandbook = matches.length === 0`) ใน `ScheduleGrid.js`, `schedule/page.js`, `(public)/page.js`
  - เพิ่ม `viewMode` ใน `ScheduleGrid`: **"ตามกีฬา"** (default: กีฬา → วัน → การ์ด, หัวข้อมีไอคอน/สนาม/จำนวน) และ "ตามเวลา" (แบบเดิม วัน → รอบเวลา); ตัวสลับอยู่ในแถบสรุปตัวกรอง
  - หมายเหตุ: ข้อมูลที่เห็นตอนนี้ยังเป็นสูจิบัตร 44 แมตช์ จนกว่าจะใส่แมตช์จริงลง DB (Phase 5 ข้อ 4)

- ✅ **หน้าลงคะแนน (step 2) ออกแบบใหม่ (21 ก.ย.)** — ผู้ใช้ขอให้สวยขึ้น ตรวจในมือถือ 375px แล้ว:
  - หัวการ์ด: `SportIcon` + ชื่อกีฬา/รอบ + สนาม/เวลา + ป้ายแดงแสดง**เวลาที่แข่งไป** (`started_at`) แทน LIVE
  - Scoreboard การ์ดเดียว: สองฝั่งไล่สี `team.color_hex`, ป้ายทีมมี `TeamIcon`, เส้นคั่น + "VS" (ทุก cell ต้องใส่ `gridRow: 1` ไม่งั้น VS ตกแถวใหม่), ตัวเลข 5rem เด้งด้วย `.live-score.is-bump` (key = score)
  - ปุ่ม `.score-btn` (globals.css) สีทีม gradient + เงาเรือง, `:active` ยุบ; `−1`/`+2`/`+3` เป็น `.score-btn-ghost`
  - `.score-actions` แถบล่าง `position: fixed` บนมือถือ (sticky card บน ≥640px) มี ยกเลิกล่าสุด / จบเซต / จบการแข่งขัน + จุดสถานะซิงค์; container มี `paddingBottom: 7.5rem` กันบัง
  - กีฬาเซต: แถบบน "เซตที่ N · sets" และ "เซตที่ผ่านมา: 25–20 | …" ด้านล่าง (อ่านจาก `match.match_sets` ถ้ามี — ตอนนี้ scoring page ไม่ได้ส่ง sets มา จึงแสดงเฉพาะหลัง re-sync จาก `GET /api/match/[id]`; ปรับ `loadMatches` ให้ `select('*, match_sets(*)')` ได้ถ้าต้องการ)

- ✅ **Refactor P1-1 Tooling (21 ก.ย.)** — `.gitattributes` (`* text=auto eol=lf`, renormalize = ไม่มีไฟล์เปลี่ยน), `.editorconfig`, `.prettierrc` + `.prettierignore` (ยัง**ไม่ได้** format ทั้ง repo — 104 ไฟล์จะเปลี่ยน ให้ทำเป็น commit เดี่ยวหลังนัดเพื่อน), scripts `format`/`format:check`, `lint` ครอบ `scripts tests`; ESLint **0 error** แล้ว: ปิด React-Compiler rules เฉพาะ `src/components/animate-ui/**` (โค้ด vendored) + แก้ `results/page.js` ให้ setState จาก `.then` ไม่ใช่ใน effect body; ติดตั้ง devDep `prettier`
  - แก้ความเข้าใจในแผน refactor: ไอคอน `animate-ui/icons/*.jsx` **ถูกใช้ผ่าน `icons/index.js`** (re-export) ไม่ใช่ไม่มีคนใช้ → P3 ข้อ 15 ต้องเช็คว่า export ตัวไหนไม่ถูก import จริงแล้วค่อยลบ

- ✅ **Refactor P1-2 ลบโค้ดตาย (21 ก.ย.)** — ลบ `AthletesClientView.js`, หน้า `/athletes` และ `/standings` (เป็นแค่ redirect; ลิงก์ใน admin dashboard → `/live`, README ปรับ), `BackgroundWaves.jsx` + `GradientWaves.jsx/.css` (WebGL ไม่ถูกใช้) + **ถอด dep `ogl`**, `useToast.js` + `Toast.js` + CSS `.toast*` (~50 บรรทัด); `AnalyticsCharts` default labels ใช้ `/live`

- ✅ **Refactor P1-3 `lib/format.js` + `lib/labels.js` (21 ก.ย.)** — `format.js`: `EVENT_DAYS` (วันงาน 3 วัน + ป้ายสั้น/ยาว/sub), `EVENT_START_DATE/END_DATE`, `fmtEventDay(Long)`, `fmtTime(Th)`, `formatDate/DateTime`, `fmtShortDateTime(Sec)`, `fmtClock`, `fmtRemaining`, `relativeTime` (null เมื่อ now=0); `labels.js`: `MATCH_STATUS`, `ROUND_LABEL`/`roundLabel`, `EVENT_LABEL`, `ACTOR_TYPE_LABEL`, `ACTION_LABEL`, `REGISTRATION_STATUS`, `SPORT_TYPE_LABEL`, `EVENT_INFO`; `lib/utils.js` และ `constants/index.js` เหลือเป็น re-export (ลบ `TEAM_COLORS`/`SPORTS_LIST` ที่ไม่ตรง DB); `useLiveScores` re-export จาก lib; เปลี่ยน caller 14 ไฟล์ (รวม `ScheduleGrid`, `MatchCard` ของเพื่อนแค่ตารางวันที่) — `'2026-10-09'` hardcode หมดไปจากโค้ด (เหลือใน `tournamentData`); tests เพิ่ม `tests/format.test.js` → **17 tests**

- ✅ **Refactor P1-4 `ui/Banner` + `ui/ConfirmDialog` (21 ก.ย.)** — `Banner` (`kind: error|warn|info|success`, render nothing เมื่อว่าง, `onClose` optional) แทน banner JSX ใน ScoreInput/staff login/admin login/LiveMonitor/AuditLog/PinManager/BracketBuilder/SettingsForm; `useConfirm()` → `[confirm, dialogEl]` (`await confirm({title,message,confirmLabel,danger})`) แทน `window.confirm` 4 จุด; admin manager เก่า 7 ตัว: `alert()` 22 จุด → state `pageError` + `<Banner kind="error">` บนสุดของหน้า; `(admin)/layout.js` หมดเวลา session → redirect `/admin/login?reason=timeout` แล้วหน้า login แสดง Banner (ไม่มี `alert`/`window.confirm` เหลือใน src)

- ✅ **Refactor P1-5 `ui/AdminTable` (21 ก.ย.)** — `AdminTable` (`columns`, `minWidth`) + `Td`, `TR`, `EmptyRow`, `TH/TD` styles; `AuditLog` (2 ตาราง) และ `PinManager` ใช้แล้ว ลบ `th/td` ซ้ำ; `DataTable.js` (column-config/sortable ใช้ใน AthleteManager) คงไว้เป็นอีกแบบ

- ✅ **Refactor P1-6 `lib/api/client.js` (21 ก.ย.)** — `apiRequest(path, {method, body, signal})` คืน `data`, โยน `ApiError` (`message` ไทย, `code`, `status`) หรือ `NetworkError`; แทน `lib/admin-api.js` (ลบแล้ว), `ScoreInput.api()`+`NetworkError` ส่วนตัว, และ `fetch` ดิบใน `UserManager`; ผู้ใช้: admin 6 ตัว + ScoreInput + UserManager; tests `tests/apiClient.test.js` → **21 tests**; ยังเหลือ `fetch` ดิบที่ `RegistrationForm`, `check-status`, `PageTracker`, staff login (public — ไม่รีบ)

- ✅ **Refactor P1-7 scripts (21 ก.ย.)** — `scripts/lib/env.mjs` (`loadEnv`, `adminClient`, `anonClient`, `projectRef`, `hasFlag`) ใช้ใน check-supabase / create-admin / smoke-test (smoke รับ BASE URL จาก argv ที่ขึ้นต้น http); **`scripts/seed-matches.mjs`** (`npm run seed:matches [--dry|--replace]`) นำเข้าตารางแข่ง 44 คู่จาก `tournamentData.js` เป็น `upcoming` (map กีฬา/ทีมด้วยชื่อ, ไม่เอาผลตัวอย่าง) — dry run ผ่าน; **migration `004_match_meta.sql`** เพิ่ม `matches.category`, `matches.match_number` (+index) ทดสอบผ่าน local; `apply-all.sql` regenerate แล้ว (1,416 บรรทัด)
  - **P1 ครบ 7 ข้อ** — ต้องรัน 004 บน Supabase จริงก่อน `npm run seed:matches` (ใช้ `apply-all.sql` วางซ้ำได้)

- ✅ **Dark Theme เสร็จสมบูรณ์ (21 ก.ย.)** — ตามแผน `docs/plans/2026-09-21-dark-theme.md`:
  - **ระบบโทเค็นและ Theme Engine**: Semantic tokens (`--bg`, `--surface`, `--surface-2`, `--text`, `--border`, `--accent-text`, ฯลฯ) ใน `src/app/globals.css`, Dark palette (`zinc-950` `#0b0b0e`), `prefers-color-scheme` media query, no-flash inline script ใน `src/app/layout.js`, hook `src/hooks/useTheme.js` (light/dark/system sync กับ localStorage + system), สวิตช์ `src/components/ui/ThemeToggle.js` (3-segment และ compact toggle) ติดตั้งบน Navbar (desktop + mobile drawer + mobile header), AdminSidebar, และ Staff header
  - **Codemod & UI Review**: รัน `scripts/codemod-theme.mjs` ปรับสีฮาร์ดโค้ด 42 ไฟล์ (351 จุด); ปรับแต่ง MatchDetailModal, MatchCard, ScheduleGrid, StandingsPodium, results/page.js, RegistrationForm, AnalyticsCharts (Chart.js dynamic options)
  - **Contrast Verification**: สร้าง `scripts/check-contrast.mjs` (`npm run check:contrast`) ตรวจสอบ WCAG 2.1 contrast ratio ครบทุกคู่สีทั้ง Light และ Dark mode (ผ่าน 18/18 checks, normal text ≥ 4.5:1, large/icons ≥ 3.0:1)
  - **Build & Tests**: `npm test` ผ่าน 21/21 tests, `npm run build` ผ่าน exit 0 (Next 16 Turbopack)

- ✅ **Refactor P2-8 แตก `ScoreInput.js` (21 ก.ย.)** — 695 บรรทัด → `staff/ScoreInput/{index (178, state+actions), MatchPicker (135), ScorePad (336), ConfirmFinish (134), scoring.js (57 pure: editDeadline/groupMatches/projectedSets/projectedWinner/winnerText)}` + `hooks/useScoreQueue.js` (optimistic queue/retry/online/beforeunload; export `applyOptimistic`, `mergeServerRow`) + `hooks/useMatchSync.js` (realtime list/selected merge + `useWakeLock`, export `hasScoreChange`); `tests/scoring.test.js` → **28 tests**; ทดสอบ flow จริง PIN → start → +1 ×4 → จบเซต ในเบราว์เซอร์ (dark mode ของเพื่อน)
  - **บั๊กแก้:** `(staff)/layout.js` guard race — effect refresh กับ effect redirect รันใน commit เดียวกัน เห็น `actor=null` เก่าแล้วเด้งกลับ login → ตอนนี้ redirect เฉพาะเมื่อ `verifiedPath === pathname` (refresh สำหรับ path นั้นเสร็จแล้ว)
  - **ธีม:** codemod ของเพื่อนแทน hex แต่ไม่แทน `var(--mono-*)` (182 จุด ไม่ flip ในโหมดมืด → ตัวหนังสือหาย) → map แล้วทั้ง src: mono-900/950→`--text`, 800/700→`--text-2`, 600/500→`--text-3`, 400→`--text-muted`, 300→`--border`, 200/100→`--surface-2` (31 ไฟล์) — **กฎ: ห้ามใช้ `--mono-*` ในโค้ด component อีก ใช้ semantic token เท่านั้น**
  - `constants/index.js`: ลบ `TEAM_COLORS`/`SPORTS_LIST` ที่กลับมาจาก merge ของเพื่อน (ไม่มีใครใช้, ข้อมูลไม่ตรง DB)

- ✅ **Refactor P2-9 แยก `globals.css` (21 ก.ย.)** — 2,188 บรรทัด → `src/styles/{tokens (241), base (109), components (740), responsive (60), public (896 — ส่วนของเพื่อน: app shell/bottom nav/podium), match-card (37), live (57), scoring (45)}.css`; `globals.css` เหลือ 16 บรรทัดเป็น entry `@import` ตามลำดับ cascade เดิม; bundle CSS ที่ build ออกมามีทุก section (ตรวจ class ครบ) และหน้า `/live` แสดงถูกต้องในโหมดมืด — **กฎ: แก้ไฟล์ที่เป็นเจ้าของ section ห้ามเพิ่ม rule ใน globals.css**

- ✅ **Refactor P2-10 `lib/queries/` (21 ก.ย.)** — `queries/core.js` (`getSports/getTeams/getMatches/getBracketMatches/getSets/getRecentEvents/getAnnouncements/getStandings`, `rows()`), `queries/page.js` **`loadPage(name, loader, fallback)`** (สร้าง server client + try/catch + log ที่เดียว), `queries/live.js` (`loadLiveData`, `EMPTY_LIVE` — ย้ายจาก `lib/live-data.js` ที่ลบแล้ว), `queries/staff.js` (`getEditWindowMinutes`, `loadScoringPage`), `queries/admin.js` (`loadAuditPage/loadBracketPage/loadMatchesPage/loadDashboard/loadSportsOnly`); page ทั้ง 18 ไฟล์ใช้ `loadPage` แล้ว (−222 บรรทัดสุทธิ, ไม่มี `createServerSupabaseClient()` ใน page ยกเว้น `generateMetadata` ของ `/live/[sportId]`); dev server ไม่มี error หลังโหลด `/`, `/news`, `/admin`

- ✅ **Refactor P2-11 admin เขียนผ่าน API เท่านั้น (21 ก.ย.)** — route ใหม่ **`/api/admin/[resource]`** (POST / PATCH `{id,…}` / DELETE `?id=`; service role + `createAuditLog` `insert_/update_/delete_<table>`; 23505→409, 23503→409) ใช้ whitelist ใน **`src/lib/api/adminResources.js`** (`RESOURCES`: matches, announcements, departments, sport_schedules, athletes (delete), registrations (update status → set `cancelled_at/by`); `pickColumns()` ตรวจชนิด/required/validate) — **ห้ามเขียนตารางนอก whitelist**; `MatchEditor` แก้คะแนน/สถานะผ่าน `/api/match/[id]/{start,override,finish}` (ได้ `score_event`) และ PATCH เฉพาะ upcoming⇄postponed; `NewsEditor/AthleteManager/DepartmentMapper/SportScheduleManager` เรียก `apiRequest` แล้ว — **ไม่มี `createClient()` ที่ insert/update/delete ใน `src/` อีก**; **migration `005_admin_via_api_only.sql`** ลบ policy `admin_write` ทุกตาราง + `admin_all` บน `app_settings` (เหลือ `admin_read` SELECT) → client (anon/authenticated) อ่านได้อย่างเดียว; เทส DB เพิ่ม assert "มีแต่ SELECT policy" ผ่าน; smoke test เพิ่มหมวด `[admin crud]` (9 checks) ผ่านกับ Supabase จริงรวม 42 checks; `apply-all.sql` regenerate แล้ว (รวม 005)
  - ⚠️ **004 และ 005 ยังไม่ได้รันบน Supabase จริง** — วาง `supabase/apply-all.sql` ใน SQL Editor (idempotent วางซ้ำได้) ก่อน deploy / ก่อน `npm run seed:matches`; ระหว่างนี้ dashboard ยังทำงานได้เพราะเขียนผ่าน service role อยู่แล้ว

- ✅ **Refactor P2-12 `lib/team-style.js` (21 ก.ย.)** — `getTeamStyle(team)` (table-driven `PALETTES` แดง/ฟ้า/เขียว/ม่วง จับด้วย hex, id, ชื่อไทย + fallback สี team/ทอง) ย้ายออกจาก `MatchCard.js` และ `MatchDetailModal.js` ที่เคยมีสำเนาเหมือนกัน 100% (−104 บรรทัด); `tests/team-style.test.js` 3 tests — **commit เดี่ยวแตะไฟล์เพื่อน 2 ไฟล์ (ui/MatchCard, ui/MatchDetailModal) แค่ลบฟังก์ชัน+เพิ่ม import** เพื่อนควร pull ก่อนแก้สองไฟล์นี้

- ✅ **Refactor P2-13 `/results` → ระบบ `/live` (21 ก.ย., `e9cbe45`; ผู้ใช้อนุมัติ)** — `results/page.js` 698 บรรทัด (client fetch 3 ตาราง + `useRealtime('matches')`) → server page 17 บรรทัด `loadPage('/results', loadLiveData)` + **`components/public/results/`**: `filters.js` (pure: `isSport/sportOf` (คง substring match สำหรับ id สูจิบัตร), `sortChrono`, `filterMatches`, `groupByStatus`, `nextUpcoming`, `statusCounts` — `tests/results-filters.test.js` 6 tests), `ResultsFilters.js` (แถบสถานะ + dropdown กีฬา/ประเภท สไตล์เดิมของเพื่อนทั้งหมด), `ResultsBoard.js` (`useLiveScores(initial)` + `ConnectionNote` จาก LiveBoard; การ์ดไฮไลต์ใช้ `bumps[id]` แทน timer เอง); พฤติกรรมเดิมครบ (ตัวกรอง, ลำดับ, คู่ถัดไปต่อกีฬา, fallback สูจิบัตรเมื่อ DB ว่าง) + ได้ SSR initial, realtime `match_sets`, polling fallback; −190 บรรทัด; **Vitest 48**; `useRealtime.js` ยังอยู่เพราะ `useMatchSync` ใช้ — ข้อเสนอเดิมที่คุยไว้: (1) `/results` เปลี่ยนจาก client fetch ทั้ง 3 ตาราง + `useRealtime('matches')` เป็นรับ `initial` จาก `loadPage('/results', loadLiveData, EMPTY_LIVE)` แล้วใช้ `useLiveScores(initial)` เหมือน `/live` (ได้ realtime ของ `match_sets` + ↑ indicator ฟรี, ไม่ต้อง fetch ซ้ำตอน mount) (2) ตัวกรอง กีฬา/สถานะ/ประเภท + การจัดกลุ่ม live/finished/upcoming เก็บไว้ที่ `/results` — ส่วนการ์ดใช้ `MatchCard` เดิม (3) ตัด `OFFICIAL_*` fallback ออกหลัง seed แมตช์จริง (P2-14 ข้อหลัง) — คาดลดได้ ~400 บรรทัด; ถ้าเพื่อนอยากคงหน้าเดิมทั้งหมดก็ปิดข้อนี้ได้เลย

- ✅ **Prettier ทั้ง repo (22 ก.ย., `b296ad1` + `1b10cf8`; ผู้ใช้อนุมัติ)** — `npm run format` 115 ไฟล์ (+3,471/−1,203 บรรทัด) **commit เดียว format ล้วน ไม่มีโค้ดเปลี่ยน** — build/lint/48 tests เหมือนเดิม; เพิ่ม `.git-blame-ignore-revs` (hash `b296ad1`) และตั้ง `git config blame.ignoreRevsFile .git-blame-ignore-revs` ในเครื่องนี้แล้ว (**เพื่อนต้องรันคำสั่งนี้เองครั้งเดียว** ไม่งั้น blame จะชี้ commit format); `npm run format:check` ผ่านทั้ง repo — **ต่อจากนี้ทุก commit ควรผ่าน `format:check`** (ยังไม่มี pre-commit hook/CI); **เพื่อนต้อง `git pull --rebase` ก่อนแก้โค้ดต่อ** ไม่งั้นจะ conflict เกือบทุกไฟล์

- ✅ **ซ้อมระบบจริงบน production + Free tier tuning (22 ก.ย.)** — **ผู้ใช้ตัดสินใจ: อยู่ Supabase Free tier ไม่อัป Pro**
  - ซ้อมเต็มวงจรกับ production (สคริปต์ชั่วคราวใน scratchpad ไม่ commit): สร้างแมตช์ชั่วคราว → `/results` เห็นเป็น upcoming → **start + ยิงคะแนน 2-1** → `/results` ขึ้น "กำลังแข่ง" **ไม่มีคะแนน** → `/live` anon ถูกกัน / admin เข้าได้เห็นบอร์ด → **finish** → `/results` โชว์สกอร์ → ลบข้อมูลทดสอบ เหลือ 44 แมตช์ — **ผ่านทุกข้อ**
  - **Realtime**: free tier จำกัด **200 connections พร้อมกัน** และ `/results` (หน้าที่คนทั้งคณะเปิด) ไม่ได้โชว์คะแนนสดอยู่แล้ว → `useLiveScores(initial, { realtime: false, pollMs })` ใหม่: `/results` **ไม่เปิด channel** รีเฟรชทุก 30 วิแทน (ยืนยันในเบราว์เซอร์ว่าไม่มี websocket); `/live` + `/admin/live` (คนไม่กี่คน) ยังใช้ Realtime; `ConnectionNote` เงียบเมื่อ status = `POLLING`
  - แก้ **flaky test** ที่บันทึกไว้เมื่อวาน: `tests/pinSession.test.js` ปลอมลายเซ็นด้วยการแทน 2 ตัวท้ายเป็น `'xx'` ซึ่งไม่เปลี่ยนอะไรถ้าลายเซ็นลงท้าย `xx` อยู่แล้ว (~1/4096) → เปลี่ยนเป็น flip ตัวท้าย รัน 5 รอบผ่าน
  - เพิ่ม **`docs/runbook-matchday.md`** — ใครเห็นอะไร, เตรียม PIN ก่อนงาน, ตารางอาการ/วิธีแก้หน้างาน, คำสั่งตรวจสุขภาพ, ข้อจำกัด free tier
  - ⚠️ **ยังค้าง (รอผู้ใช้ตัดสินใจ):** คะแนนสด**ซ่อนแค่ระดับ UI** — ค่า `score_a/score_b` ของแมตช์ `live` ยังติดอยู่ใน HTML/RSC payload ของ `/results` และอ่านตรงจาก Supabase ด้วย anon key ได้ (พิสูจน์แล้ว) ถ้าต้องการกันจริงต้องทำ migration 007 (view สาธารณะที่ null คะแนนของแมตช์ live + ตัด SELECT ตรงบน `matches` ของ anon) — ดูข้อเสนอใน §3
  - ⚠️ **Egress free tier 5 GB/เดือน**: ตอนนี้ `/results` ดึง matches+sports+teams+sets ทุก 30 วิ **ต่อผู้ชม 1 คน** (~30–60 KB/ครั้ง) → ผู้ชม 200 คน × 8 ชม. ≈ 10 GB เกินโควตา — ข้อเสนอ: endpoint สรุปเล็ก ๆ cache ที่ edge (s-maxage 15–30) ให้ทุกคนใช้ร่วมกัน = DB โดนยิงครั้งเดียวต่อ 30 วิ (ดู §3)

- ✅ **`/live` เฉพาะผู้ล็อกอิน (22 ก.ย.; ผู้ใช้อนุมัติ)** — `requireViewer(next)` ใน `lib/auth/resolveActor.js` (`resolveActor()` → ไม่มี actor → `redirect('/staff/login?next=…')`) ใช้ใน `/live` และ `/live/[sportId]`; หน้า login รับ `?next=` (เฉพาะ path same-site) หลังล็อกอิน account หรือ PIN; ชั้นแรกอยู่ใน **`proxy.js`** (matcher เพิ่ม `/live`, `/live/:path*` → ไม่มี session/PIN cookie = **307** ไป `/staff/login?next=…`) ชั้นสองคือ `requireViewer()` ในหน้า (ตรวจ PIN จริง; ถ้าหลุดชั้นแรกจะได้ 200 + meta refresh เพราะ `(public)/loading.js`) — smoke ตรวจทั้งสองแบบ + `/results` แทน `/live` ในหมวด public pages → **47 checks**; Realtime check เคย timeout 2 ครั้ง (listener ต่อหลัง SUBSCRIBED นิดหน่อย) → smoke รอ 1 วิ + retry ที่ 6 วิ + cap 15 วิ แล้วผ่าน 3/3; ℹ️ Vitest เคยล้ม 1 test ครั้งเดียวตอนรันต่อจาก `npm run build` ทันที (ไม่ได้จับชื่อ test) รันซ้ำ 4 รอบผ่าน 51/51 — ถ้าเจออีกให้จับ output ไว้

- ✅ **Phase 5 ข้อ 4 Deploy Vercel (22 ก.ย.)** — ผู้ใช้ deploy เองที่ **https://sci-games-2026.vercel.app** (env 4 ตัวตั้งแล้ว); ตรวจแล้ว: ทุกหน้า public/staff/admin login ตอบ 200, `/schedule` render 44 การ์ดจาก DB จริง, ISR ทำงาน (`X-Nextjs-Prerender: 1`, `X-Vercel-Cache: HIT`), `/api/register` validate ได้, **`node scripts/smoke-test.mjs https://sci-games-2026.vercel.app` ผ่าน 46/46** (auth, PIN login, permissions, ลงคะแนน points/sets, standings, Realtime ถึง anon subscriber, admin CRUD, public pages) และ cleanup แล้ว DB ยังมี 44 แมตช์ / 0 score_events; ตรวจ `.env.local` ในเครื่อง: anon key role=anon เขียนไม่ได้ (42501), service key role=service_role, `PIN_SESSION_SECRET` 64 ตัว ไม่ใช่ default; ℹ️ ใน DB มี PIN ชื่อ `test` (ฟุตซอล, สร้าง 22 ก.ย. 10:43) ที่ไม่ใช่ของ smoke — น่าจะมีคนลองสร้างจากแดชบอร์ด ปิดได้ก่อนงานจริง

- ✅ **Phase 5 ข้อ 1–3 (22 ก.ย.)** — (1) ผู้ใช้วาง `apply-all.sql` ใน SQL Editor แล้ว → ตรวจด้วย probe: `matches.category` มี, `register_athlete` เรียกได้ → **Supabase จริงมี migration 001–006 ครบ**; (2) `npm run seed:matches -- --replace` นำเข้า **44 แมตช์จริง** (ฟุตซอล 8, วอลเลย์ 8, ตะกร้อ 8, บาส 8, เปตอง 12; 9–11 ต.ค.; ทุกแถวมี `category`/`match_number`) — พบบั๊ก `--replace` ลบแถว `round IS NULL` ไม่ได้ (`NOT IN` กับ NULL) แก้เป็น `.or('round.is.null,round.not.in.(…)')` และลบแมตช์ทดสอบเก่า 1 แถวด้วยมือ → DB = 44 พอดี; (3) **ตัด `OFFICIAL_*` fallback** ออกจาก `/`, `/schedule`, `ScheduleGrid`, `ResultsBoard` (P2-14 ครึ่งหลัง) — ตารางว่างจะเห็น empty state แทน sample; `results/filters.js` `isSport` เหลือ exact match; `data/handbook.js` คงไว้เป็นแหล่ง seed; ตรวจในเบราว์เซอร์: `/schedule` 44 การ์ด, `/results` คู่ถัดไป 5 กีฬา, `/` 4 การ์ด ไม่มี console error

- ✅ **UI Dark Mode Contrast & ปลดผลสดหน้าบ้าน (22 ก.ย.; ผู้ใช้อนุมัติ)**:
  - แก้ไขสีฮาร์ดโค้ดที่กลืนกับพื้นหลังใน Dark Mode เป็น Semantic Tokens: การ์ดข่าว `/news` (`var(--accent-surface)` และ `var(--surface)` แทน `#ffffff/#fefce8`), `HeroSection` (การ์ด `.hero-card-white`, ข้อความวันที่, และปุ่มแคปซูล), `StandingsPodium` (การ์ด `.podium-card`, ชื่อทีม, ชิปคะแนน, แถบผู้นำ), `Modal` (`var(--surface)`), `QuickLinks`, `Footer`, `ScheduleGrid` (ปุ่มแท็บวันที่ที่ active), `RegistrationForm` (กล่องแจ้งเตือน error); ผ่าน WCAG AA 18/18 checks
  - นำลิงก์และปุ่ม **"ผลสด"** ออกจากหน้าบ้านทั้งหมด: `HeroSection` (เปลี่ยนปุ่มหลักเป็น `/schedule`, ปุ่มรองเป็น `/results` และ `/news`), `Navbar` (ถอดเมนูผลสด เหลือ 4 เมนู), `MobileBottomNav` (ถอดแท็บผลสด เหลือ 4 แท็บ)
  - รีเซ็ตแมตช์ทดสอบใน DB (`25dbe1c1-...` ฟุตซอล) จาก `live` กลับเป็น `upcoming` พร้อมลบ event ทดสอบ ทำให้หน้า `/results` ไม่มีเซกชัน "กำลังแข่งขันสด (LIVE MATCHES) (1 แมตช์)" ตกค้างอีก
  - ซิงค์ไฟล์ `supabase/apply-all.sql` ในเครื่องให้ตรงกับ `Downloads/apply-all (2).sql` (1,550 บรรทัด รวม 001–006 ครบ)
  - ทดสอบ Vitest 51/51 tests ผ่าน, Next build ผ่าน exit 0

- ✅ **lint warning 4 จุด (22 ก.ย.; ผู้ใช้อนุมัติ)** — `useAuth`: `supabase = useMemo(() => createClient(), [])` แล้วใส่เป็น dependency จริงของ effect/`signIn`/`signOut` (×3); `PinManager`: `<img>` แสดง QR ที่เป็น data: URL → คง `<img>` + `eslint-disable-next-line @next/next/no-img-element` พร้อมเหตุผล → **`npm run lint` = 0 error / 0 warning**

- ✅ **README (22 ก.ย.; ผู้ใช้อนุมัติ)** — แก้ "6 ชนิดกีฬา" → 5 (seed และ `data/handbook.js` มี 5 ตรงกันอยู่แล้ว), setup ระบุลำดับ migration 001→seed→002…006 + one-liner สร้าง `apply-all.sql` + `seed:matches` + `create-admin`, เพิ่ม `PIN_SESSION_SECRET` ใน env ของ Vercel, ตารางคำสั่งทดสอบ; แก้ข้อความ fallback ใน `/news` ("6 รายการ" → 5)

- ✅ **แก้ race condition ตอนสมัคร (22 ก.ย.; ผู้ใช้อนุมัติ)** — **migration `006_register_athlete.sql`**: ฟังก์ชัน `register_athlete(student_id, full_name, department_id, phone, sport_ids[])` SECURITY DEFINER ทำใน transaction เดียว: ตรวจ dept/sports → `pg_advisory_xact_lock` ต่อ (team, sport) → นับโควตาใหม่ → insert athlete + registrations; RAISE `DUPLICATE_REGISTRATION` (unique_violation) / `QUOTA_FULL: <กีฬา> (n/max)` / `INVALID_DEPARTMENT` / `INVALID_SPORT` / `INVALID_SPORT_COUNT` (check_violation); REVOKE EXECUTE จาก anon/authenticated; `/api/register` เรียก RPC แล้ว map error ด้วย **`lib/api/register.js`** `mapRegisterError()` (`tests/register.test.js` 3 tests); `lib/validation.js` เหลือเช็ค format/dept/sport/ตารางชน (ตัดเช็ค duplicate + quota ที่ racy ออก); DB scenario 9 ครอบ happy path/ซ้ำ/input ผิด/เต็มโควตา 14 แล้วคนที่ 15 ถูกปฏิเสธโดยไม่ทิ้งแถว/ยกเลิกแล้วสมัครใหม่ได้/anon เรียกไม่ได้ — `run-local.sh` ผ่าน 9/9; `apply-all.sql` regenerate แล้ว (รวม 006, 1,550 บรรทัด)
  - ⚠️ **ต้องรัน 006 บน Supabase จริงก่อน deploy** (วาง `supabase/apply-all.sql` — ตอนนี้ค้าง 004+005+006) ไม่งั้น `/api/register` จะตอบ 500 (function ไม่มี)

- ✅ **Refactor P3-20 JSDoc types (22 ก.ย.)** — `src/lib/types.js` typedef ตาม migration: `Sport/Team/Match/MatchSet/ScoreEvent/Announcement/Department/Athlete/Registration/AdminUser/SportPin` + enum (`MatchStatus/ScoringType/TeamSlot/ScoreEventType/ActorType/UserRole/RegistrationStatus`) + app shape (`Actor`, `LiveData`, `SetsByMatch`, `Bumps`, `ApiResult<T>`); ใช้ผ่าน `/** @typedef {import('@/lib/types').Match} Match */`; annotate แล้ว: `loadLiveData/EMPTY_LIVE`, `useLiveScores` (+`matchesForSport`, `matchWinner`), `resolveActor/resolvePinActor`, `getTeamStyle`, `results/filters.js`; ตรวจด้วย `tsc --checkJs` (tsconfig ชั่วคราว) — typedef resolve ครบ ไม่มี type error นอกจาก `process` global — **ยังเป็น JS ล้วน ไม่ย้าย TS** — **Refactor P1–P3 ครบทุกข้อแล้ว** (ยกเว้น P2-14 ครึ่งหลัง: ตัด `OFFICIAL_*` fallback หลัง seed จริง)

- ✅ **แก้ lint error `useTheme.js` (22 ก.ย.; ผู้ใช้อนุมัติ)** — เขียน `src/hooks/useTheme.js` ใหม่ด้วย `useSyncExternalStore` (snapshot จาก localStorage + `matchMedia`, server snapshot `'system'/'light'/mounted=false`) แทน `setState` ใน effect; `setTheme` เขียน storage + `data-theme` แล้ว `emit()`; ฟัง `prefers-color-scheme` change และ `storage` event (เปลี่ยนธีมข้ามแท็บ) — API เดิม `{ theme, resolvedTheme, setTheme, mounted }` ไม่เปลี่ยน (`ThemeToggle`, `AnalyticsCharts/Charts` ใช้ต่อได้); ทดสอบในเบราว์เซอร์ สว่าง/มืด/ตามระบบ + คงค่าเมื่อเปลี่ยนหน้า ไม่มี hydration warning → **ESLint 0 error** (เหลือ 4 warning เดิม: `useAuth` exhaustive-deps 3, `PinManager` `<img>` 1)

- ✅ **Refactor P2-14 `data/handbook.js` (21 ก.ย.)** — `git mv src/lib/tournamentData.js → src/data/handbook.js` (export เดิม `OFFICIAL_TEAMS/OFFICIAL_SPORTS/OFFICIAL_MATCHES`); อัปเดต import ใน `/`, `/schedule`, `/results`, `ScheduleGrid`, `scripts/seed-matches.mjs` (+ ignore list ใน `codemod-theme.mjs`); `npm run seed:matches --dry` ยังอ่านได้ 44 คู่; **ยังไม่ตัด fallback** — ทำหลังรัน 004/005 บน Supabase จริงและ `npm run seed:matches` สำเร็จ (เหลือ empty state ใน `/`, `/schedule`, `/results`, `ScheduleGrid`)
  - **P2 จบแล้ว (8, 9, 10, 11, 12, 14 ✅ / 13 ⏸)**

- ✅ **Refactor P3-15 ไอคอน (21 ก.ย., `e9d0ea5`)** — ตรวจแล้วว่าไอคอน Animate UI registry 16 ตัว (search/clock/map-pin/check/bell/chart-line/activity/trash-2/plus/x/menu/timer/sparkles/send/users/user) **ไม่มี caller ส่ง `animate*` prop เลย** จึง render เป็น svg นิ่งอยู่แล้ว → แทนด้วย lucide ตรง ๆ ใน `animate-ui/icons/index.js` (`export const Search = LucideIcons.Search` — ทุก caller ส่ง `size` เอง; ไม่เพิ่ม hover animation เพื่อไม่เปลี่ยนพฤติกรรม); ลบ `icons/*.jsx` 17 ไฟล์ + `icon.jsx` + `primitives/animate/slot.jsx` + `hooks/use-is-in-view.jsx` + `lib/utils.js` (มีแค่ `cn()` ที่ animate-ui ใช้ และ `validate*` ที่ไม่มีใครเรียก) + deps `clsx`/`tailwind-merge` + override ESLint `animate-ui/**` (−2,300 บรรทัด); `animate-ui/` เหลือ `icons/index.js` ไฟล์เดียว (108 บรรทัด) — วัดด้วย `next build`: shared icons chunk **198 KB → 143 KB**, รวม client chunks −33 KB; `components.json` ยังชี้ `utils: @/lib/utils` (config ของ shadcn CLI — ถ้ามีคนรัน `npx shadcn add` มันจะสร้างไฟล์ใหม่เอง)

- ✅ **Refactor P3-16 dynamic import (21 ก.ย., `a8c168e`)** — `PdfGenerator` เปลี่ยนเป็น `import('@/lib/pdf')` / `import('jszip')` ใน handler ตอนกดดาวน์โหลด (chunk jspdf+jszip 450 KB หายจาก client-reference manifest ของ `/admin/pdf` → โหลดตอนคลิกครั้งแรก); `AnalyticsCharts.js` → `AnalyticsCharts/{index,Charts}.js` โดย `index` เป็น `next/dynamic(() => import('./Charts'), { ssr:false, loading })` (chart.js ไม่เข้า server bundle) — **GradientWaves/ogl ในแผนไม่มีอยู่ในโค้ดแล้ว** (เพื่อนลบไปก่อนหน้า)

- ✅ **Refactor P3-17 `/live` payload (21 ก.ย., `f7f1f52`)** — `loadLiveData(sb, { withEvents })` และ `useLiveScores(initial, { withEvents })` ข้าม query `score_events` 300 แถวเว้นแต่ขอ; มีแค่ `LiveMonitor` (admin) ที่อ่าน `lastEvents` จึงเป็นตัวเดียวที่ส่ง `withEvents: true` — `/live`, `/live/[sportId]` และ polling fallback ไม่แบก events อีก (realtime INSERT ยังขับ ↑ indicator ตามเดิม); **ไม่ได้** narrow คอลัมน์ `matches` ตามแผน เพราะ realtime ส่ง full row และ `MatchDetailModal` ของเพื่อนอ่าน field เพิ่ม (`period_scores`) — ประหยัดไม่กี่ KB ไม่คุ้มกับ row 2 รูปแบบ

- ✅ **Refactor P3-18 ISR หน้า public (21 ก.ย., `3735c2d`)** — `/news`, `/schedule` เปลี่ยนจาก `force-dynamic` เป็น **`export const revalidate = 30`** (build แสดง `○ /news 30s`, `○ /schedule 30s`); ต้องไม่แตะ `cookies()` จึงเพิ่ม **`lib/supabase/public.js`** `createPublicSupabaseClient()` (supabase-js anon, ไม่มี cookie) + **`loadPublicPage()`** ใน `lib/queries/page.js` (แชร์ try/catch กับ `loadPage`); `/api/admin/[resource]` เรียก `revalidatePath()` หลังเขียนสำเร็จตาม `spec.revalidate` ใน `adminResources.js` (`matches → ['/schedule']`, `announcements → ['/news']`) → แก้ในแดชบอร์ดเห็นทันที; `/`, `/live` ยัง `force-dynamic` — **หมายเหตุ:** ตอน `npm run build` หน้าเหล่านี้ prerender โดยยิง Supabase จริง (ถ้าล้มจะได้ fallback แล้ว regenerate ใน 30 วิ) — บน Vercel ต้องตั้ง env ให้ครบก่อน build

- ✅ **Refactor P3-19 tests (21 ก.ย., `46c9c9d` + commit ถัดมา)**: `tests/live-helpers.test.js` (`matchesForSport`, `matchWinner`, `latestByMatch`, `groupSets` — 2 ตัวหลัง export ใหม่จาก `useLiveScores`) + `tests/adminResources.test.js` (`pickColumns` required/validate/trim, update patch, `registrations.onUpdate`) → **Vitest 42 tests**; section 8 ใน `supabase/tests/scenario_live_scoring.sql` ทดสอบ migration 004 (คอลัมน์ `category`/`match_number` + index + รอดผ่าน `start_match`/`apply_score_event`) — `run-local.sh` ผ่านทั้ง 8 scenario; หมวด `[public pages]` ใน `scripts/smoke-test.mjs` (GET `/`, `/live`, `/schedule`, `/news` → 200) — smoke **46 checks** ผ่าน 3 รอบ (รอบแรกมี 1 check flaky ล้ม ไม่ใช่หมวดใหม่)

- ✅ **ปรับจัดระเบียบ Hero Section ลดความแน่นบนมือถือ (22 ก.ย.)** — ตามที่ผู้ใช้ทักว่าแน่นเกินไปบนจอมือถือ:
  - แก้ไขปุ่ม Action ก้อนใหญ่ 3 อันที่ซ้อนกันแนวดิ่งจนกินพื้นที่จอ: จัดเป็นปุ่มหลักเต็มความกว้าง "📅 ดูตารางการแข่งขัน" (Primary CTA) และปุ่มรอง 2 คอลัมน์คู่กันในแถวเดียวด้านล่าง "🏆 สรุปผลการแข่งขัน" + "📢 ข่าวประชาสัมพันธ์" ทำให้ประหยัดความสูงแนวดิ่งลงได้กว่า 80px
  - ตัดข้อความซ้ำซ้อนในคำบรรยาย (เดิมมี "มหาวิทยาลัยราชภัฏภูเก็ต" 2 บรรทัดติดกัน) ให้เหลือเนื้อหากระชับ พร้อมแสดงสถานที่คู่กับไอคอน `MapPin` สวยงาม
  - ลด padding ด้านบน/ล่าง และ margins ของ Badge/Title/Subtitle บนจอมือถือ ทำให้เนื้อหาโปร่ง โล่ง สบายตา และผู้ใช้สามารถมองเห็นการ์ด "⚡ การแข่งขันที่น่าสนใจ" ได้ทันทีตั้งแต่เปิดหน้าเว็บโดยไม่ต้องเลื่อนจอ
- ✅ **Clean UI — ถอดไอคอนออกให้คลีน มินิมอล ตามคำขอผู้ใช้ (22 ก.ย.)**:
  - ถอดไอคอนออกจาก **Hero Section** ทั้งหมด: Badge วันที่ ("9 – 11 ตุลาคม 2569"), ปุ่ม Primary ("ดูตารางการแข่งขัน"), ปุ่ม Secondary ("สรุปผลการแข่งขัน", "ข่าวประชาสัมพันธ์") และสถานที่ ให้เป็น Pure Typography ที่มินิมอล คลีน และดูพรีเมียม
  - ถอดกล่องไอคอนกีฬาขนาด 38x38px สีเหลืองออกจากหัวข้อชนิดกีฬาในหน้า `/schedule` (`ScheduleGrid.js`) เหลือเพียงชื่อกีฬาตัวหนาและสถานที่ชัดเจน โปร่งสบายตา
  - ถอดไอคอนหน้าชื่อกีฬาและประเภทใน Dropdown Filters ทั้งหน้า `/schedule` (`ScheduleGrid.js`) และ `/results` (`ResultsFilters.js`) เหลือเฉพาะข้อความตัวเลือกคลีน ๆ พร้อมลูกศรขวา
  - ตรวจสอบความถูกต้อง: `npm test` 51 tests ผ่าน, `npm run lint` ผ่าน (0 error), `npm run format:check` ผ่าน (Prettier), `npm run build` ผ่าน (exit 0)
- ✅ **แก้ไข Header Spacing ให้มีระยะห่างจาก Navbar สบายตา (22 ก.ย.)**:
  - แก้บั๊กความสูงของ `--mobile-header-height` ใน `tokens.css` จากเดิม hardcode 56px ให้ตรงกับความสูงจริงของ Navbar (4.25rem = 68px)
  - ปรับ padding-top ของ `.public-app-main` บนมือถือเป็น `calc(var(--mobile-header-height) + var(--safe-top) + 1.35rem) !important` เพื่อให้มีระยะห่างอย่างน้อย 22–28px ใต้ Navbar (จากเดิมที่ชนขอบห่างเพียง 4px)
  - เพิ่ม padding-top ให้กับ `.page-header` ใน `components.css` และ `public.css` พร้อมใส่คลาส `page-header` ในทุกหน้าย่อย (`/schedule`, `/results`, `/news`) ทำให้หัวข้อหน้าไม่ชิดติดขอบ Navbar ด้านบนอีกต่อไป
  - ปรับ desktop `paddingTop: '6rem'` ใน `(public)/layout.js` เพื่อให้โปร่งสบายตาทั้งบนมือถือและคอมพิวเตอร์
  - ผ่านทั้ง `npm test` (51 tests), `npm run lint` (0 error), `npm run format:check` (Prettier), และ `npm run build`
- ✅ **ตั้งค่าโหมดสว่างเป็นค่าเริ่มต้น (Light Mode Default) (22 ก.ย.; ผู้ใช้อนุมัติ)**:
  - กำหนดให้ค่าเริ่มต้น (Default / Normal theme) ของทั้งระบบเป็น Light Mode (โหมดสว่าง)
  - แก้ไข media query ใน `tokens.css` และ `base.css` จาก `:root:not([data-theme='light'])` เป็น `:root[data-theme='system']` ป้องกันไม่ให้เว็บเปลี่ยนเป็นโหมดมืดอัตโนมัติตาม OS โดยที่ผู้ใช้ไม่ได้เลือก 'ตามระบบ' หรือ 'มืด'
  - ปรับปรุง `src/app/layout.js`: ระบุ `data-theme="light"` บนแท็ก `<html>`, ปรับ `viewport.themeColor` เป็น `#fafafa`, และ `THEME_SCRIPT` สำหรับอ่าน theme จาก localStorage โดยมี fallback เป็น `light` ไร้ปัญหา FOUC
  - ปรับปรุง `src/hooks/useTheme.js`: ให้ `readTheme` คืนค่า `'light'` เมื่อยังไม่มีการตั้งค่า, `serverTheme` และ `serverResolved` เป็น `'light'`, บันทึกค่าลง storage และ attribute เสมอ
  - ปรับปรุง `ThemeToggle.js`: จัดลำดับตัวเลือกเป็น 'สว่าง' -> 'มืด' -> 'ตามระบบ' และ cycle จากสว่างเป็นตัวแรก
  - ผ่านการทดสอบ Vitest (51/51 tests), ESLint (0 error), Prettier check, และ Next.js build ผ่าน (exit 0)
- ✅ **เพิ่ม migration `007_matches_public_view.sql` (23 ก.ย.)**:
  - นำเข้าไฟล์จาก `Downloads/007_matches_public_view.sql` เข้า repo ที่ `supabase/migrations/007_matches_public_view.sql` และต่อท้ายใน `supabase/apply-all.sql`
  - Step 1: เพิ่มวิว `matches_public` ซ่อน `score_a/b`, `sets_a/b`, `current_set`, `last_score_at`, `last_scored_team` ให้เป็น `NULL` เมื่อ `status = 'live'` (เปิดสิทธิ์ SELECT ให้ anon, authenticated) โดยยังไม่แตะสิทธิ์ตารางเดิม เพื่อความปลอดภัยและไม่กระทบหน้าเว็บปัจจุบัน
  - เพิ่ม probe ตรวจสอบวิว `matches_public` ใน `scripts/check-supabase.mjs`

## 3. [Current Task & Blockers]

**สถานะ (24 ก.ย.):** เพิ่มคอลัมน์ `court` (migration 010 รันบน production แล้ว) + CI + pre-commit hook · **สถานะเดิม (23 ก.ย.):** ระบบขึ้น production ใช้งานได้จริงแล้ว — Refactor P1–P3 ครบ, Phase 5 ข้อ 1–4 เสร็จ (migration 001–008 รันบน Supabase จริง, 44 แมตช์จากสูจิบัตร, deploy บน Vercel), คะแนนสดถูกกันถึงระดับฐานข้อมูล, `/results` และ `/api/live-summary` แคชที่ edge
**เกณฑ์ที่ผ่านล่าสุด:** `npm run build` ✅ · `npm run lint` 0 error/0 warning ✅ · Vitest 58 ✅ · `npm run test:db` 10 scenario ✅ · `node scripts/smoke-test.mjs <prod|local>` 57 checks ✅

**งานที่เหลือ**

| ลำดับ | งาน | หมายเหตุ |
|---|---|---|
| 1 | ซ้อมกับอุปกรณ์จริง | มือถือกรรมการ + จอสนาม + หลายเครื่องพร้อมกัน (ซ้อมผ่าน API อัตโนมัติผ่านแล้ว) |
| 2 | ลบ PIN `test` (ฟุตซอล) + สร้าง PIN จริงรายกีฬา/รายสนาม | `/admin/pins` — PIN เดิมดูย้อนหลังไม่ได้ |
| 3 | ~~ยืนยันค่ากติกา~~ ✅ ตัดสินแล้ว 23 ก.ย. | edit window 10 นาที · วอลเลย์ 25 (ตัดสิน 15) · ตะกร้อ 15 (ตัดสิน 8) · เปตอง 11 (ชิง 13) · เสมอ = เตือนแต่กดจบได้ · โควตาสมัครไม่แตะ · ประเภทเปตองคงเดิม |
| 4 | ~~pre-commit hook / CI~~ ✅ 24 ก.ย. | ดู §2 — เพื่อนต้องรัน `npm install` หนึ่งครั้งให้ hook ติดตั้ง |
| 6 | **ตรวจทุกหน้าทุกระบบ** ตาม `docs/plans/2026-09-24-full-system-check.md` (7 รอบ) | รอผู้ใช้สั่งเริ่ม + ตัดสินใจ §7 ของแผน |
| 5 | เพิ่มข่าวจริงที่ `/admin/news` | `announcements` ยังว่าง หน้า `/news` โชว์ข้อความตัวอย่าง |
| — | ~~เปิดรับสมัครผ่านเว็บ~~ · ~~หน้ากติกาบนเว็บ~~ | ผู้ใช้ตัดสินใจไม่ทำ (24 ก.ย.) |

**Blockers / ข้อจำกัดที่ต้องรู้**

- ⚠️ **Deploy**: Vercel = Hobby + repo private → commit ที่ author เป็น `chokun555phaerngam` **ไม่ trigger deploy** ("commit author did not have contributing access") ปุ่ม Redeploy ก็ใช้ไม่ได้ถ้าไม่ใช่เจ้าของบัญชี (`akarinnoochoo2005`) — **ให้เพื่อน (Esther03u) push ตามหลัง** (`git commit --allow-empty -m "chore: trigger deploy" && git push`) หรือเปลี่ยน repo เป็น public / ส่งงานเป็น branch ให้ merge
- ⚠️ **Supabase Free tier**: Realtime 200 connections (หน้าผู้ชมจึงไม่ใช้ Realtime แล้ว) · egress 5 GB/เดือน (ดู Usage ระหว่างงาน; ปรับ `SPECTATOR_POLL_MS` ใน `useLiveScores` หรือ `revalidate` ของ `/api/live-summary` ถ้าใกล้เต็ม) — **ตัดสินใจแล้วว่าไม่อัป Pro**
- ⚠️ **ลำดับ migration 007 → deploy → 008** ห้ามสลับ (008 ตัดสิทธิ์ anon อ่าน `matches`; โค้ดเก่าที่ยังอ่านตารางตรงจะได้หน้าว่าง)
- ℹ️ PostgREST ไม่เห็น view/ตารางใหม่ → `NOTIFY pgrst, 'reload schema';`
- ℹ️ **ห้ามใช้ `select(..., { head: true })` เช็คว่ามี relation จริงไหม** — คืน 204 ไม่มี error แม้ relation ไม่มีอยู่ (เคยทำให้รายงานผิด)
- ℹ️ เทส DB ใช้ PostgreSQL 16 ในเครื่อง (port 5432, user `postgres` — ขอรหัสจากผู้ใช้ ไม่เก็บใน repo)
- ℹ️ Browser pane ของ Claude ค้าง HMR ข้าม reload — ถ้าทดสอบแล้วผลแปลก ให้เปิดแท็บใหม่ก่อนสรุปว่าเป็นบั๊ก

## 4. [Key Context & Code Snippets]

**โครงสร้างไฟล์ (ปัจจุบัน)**
```
src/
  proxy.js                      ← Next 16 middleware: กัน /admin, /staff, /api/admin, /live
  app/(public)/{page,schedule,results,news,handbook,register,check-status}/   ← ผู้ชม (results, schedule, news = ISR 30s)
  app/(public)/live/{page,[sportId]}/                                        ← บอร์ดสด เฉพาะบัญชี staff/admin
  app/(staff)/staff/{login,scoring}/    ← login: แท็บ PIN + แท็บบัญชี; scoring อ่านด้วย service role
  app/(admin)/admin/{live,audit,pins,bracket,matches,news,athletes,departments,sport-schedules,users,settings,analytics,pdf}/
  app/api/{score,score/undo,match/[id],match/[id]/[action],live-summary,pin/*,auth/me,register,check-status,track,admin/*}/
  components/{public/{results,live,...},staff/ScoreInput/,admin/,ui/}
  hooks/{useLiveScores,useScoreQueue,useMatchSync,useActor,useAuth,useRealtime,useTheme}.js
  lib/{api/{client,scoring,adminResources,register,publicMatch},auth/{resolveActor,pinSession},
       queries/{core,page,live,staff,admin},supabase/{client,server,admin,public},
       format,labels,team-style,types,audit,validation,rate-limit,pdf}.js
  data/handbook.js · styles/*.css
supabase/migrations/001…013 · seed.sql · tests/{00_supabase_stubs,scenario_live_scoring}.sql + run-local.sh
scripts/{smoke-test,check-supabase,create-admin,seed-matches,check-contrast,install-hooks}.mjs + lib/env.mjs
.github/workflows/ci.yml · .githooks/pre-commit
docs/{runbook-matchday.md, plans/*, specs/*}
```

**ใครอ่านคะแนนสดได้ (หลัง 007 + 008)**

| ช่องทาง | anon (ผู้ชม) | PIN / staff / admin |
|---|---|---|
| ตาราง `matches`, `match_sets`, `score_events` | ❌ RLS `staff_read` | ✅ (staff/admin ที่ล็อกอิน Supabase) |
| view `matches_public_v2` (010; `matches_public` ของ 007 ยังอยู่แต่ไม่มีใครอ่าน) | ✅ แต่คะแนนเป็น `null` ตอน `status='live'` | ✅ |
| `GET /api/match/[id]` | ✅ ผ่าน `maskLiveMatch()` (ไม่มีคะแนนตอน live) | ✅ เต็ม |
| `GET /api/live-summary` | ✅ อ่านจาก view (แคช edge 30 วิ) | ✅ |
| `/staff/scoring` | — | ✅ อ่านด้วย service role หลัง `requireScorer()` (PIN เป็น anon จึงอ่านตารางตรงไม่ได้) |

**Env ที่ต้องมี** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PIN_SESSION_SECRET` (ทั้งใน `.env.local` และ Vercel)

**Generic admin route** `src/app/api/admin/[resource]/route.js` — POST / PATCH `{id,…}` / DELETE `?id=`; whitelist ตาราง+คอลัมน์ใน `lib/api/adminResources.js`; ทุกการเขียนลง `audit_logs` และ `revalidatePath()` หน้า ISR ที่เกี่ยวข้อง; **คะแนน/สถานะของ `matches` ต้องไป `/api/match/[id]/{start,finish-set,finish,reopen,override}` เท่านั้น** (เพื่อให้เกิด `score_event`)

**สวิตช์ฉุกเฉิน** `app_settings.live_scoring_enabled = false` → `/api/score`, `/api/score/undo`, `/api/match/[id]/[action]` ตอบ 503 `SCORING_PAUSED` กับ PIN/staff (admin ยังทำได้) — ตั้งจาก `/admin/settings`

**คำสั่งที่ใช้บ่อย**
```bash
npm run dev                                   # หรือ preview ผ่าน .claude/launch.json ชื่อ next-dev
npm test                                      # Vitest 91
npm run test:perm -- https://sci-games-2026.vercel.app   # สิทธิ์ 36 checks
npm run lint · npm run format:check           # ต้องผ่านทั้งคู่ก่อน commit
npm run build
PGPASSWORD=<รหัส> bash supabase/tests/run-local.sh          # DB scenario 12 ชุด
node scripts/smoke-test.mjs                                 # local (ต้องเปิด dev server)
node scripts/smoke-test.mjs https://sci-games-2026.vercel.app   # production, 57 checks
npm run seed:matches -- --dry|--replace       # นำเข้า 44 คู่จาก data/handbook.js
node scripts/create-admin.mjs <email> <pw>    # สร้าง/รีเซ็ต super_admin
# รวมไฟล์ SQL ให้วางทีเดียว (gitignored):
{ for f in supabase/migrations/001_initial_schema.sql supabase/seed.sql supabase/migrations/00[2-9]_*.sql supabase/migrations/01[0-9]_*.sql; do printf '\n-- >>>>>>>>>> %s\n' "$f"; cat "$f"; done; } > supabase/apply-all.sql
```

**เอกสารอื่น** `docs/runbook-matchday.md` (คู่มือหน้างาน: ใครเห็นอะไร, เตรียม PIN, ตารางอาการ/วิธีแก้) · `docs/plans/2026-09-20-live-scoring-v2.md` (แผนเต็ม) · `docs/plans/2026-09-21-refactor.md`

## 5. [Prompt for the Next AI]

```
โปรเจกต์ Sci Games 2026 อยู่ที่ C:\SCI Game (Next.js 16 App Router + Supabase, JavaScript)
Production: https://sci-games-2026.vercel.app · งานแข่งจริง 9–11 ต.ค. 2569
อ่านก่อนตามลำดับ: Handoff.md (ไฟล์นี้) → docs/runbook-matchday.md → AGENTS.md
(Next 16 เปลี่ยน API — ต้องอ่าน node_modules/next/dist/docs/ ก่อนเขียนโค้ด)

สถานะ (25 ก.ย.): ระบบใช้งานได้จริงครบวงจรแล้ว
- ล่าสุด: ระบบปุ่ม "ดู PIN" อีกครั้ง (Reveal PIN via AES-256-GCM) — เข้ารหัส PIN ด้วย AES-256-GCM คีย์ใน env `PIN_ENCRYPTION_KEY`, migration 012 `sport_pins.pin_encrypted`, API `POST /api/admin/pins/[id]/reveal` พร้อม audit log `reveal_pin`, UI ตาราง PIN มีปุ่ม "ดู PIN" พร้อม modal แสดงเลขและ QR ซ้ำได้
- ระบบนับเวลาถอยหลัง & ควบคุมการเฉลยโพเดียม (Podium Countdown & Reveal) โดยบูรณาการ React Bits <Counter /> ด้วย Motion Spring Animation, ควบคุมวัน-เวลาและกดเฉลยผลจาก /admin/settings, ฟังก์ชันค้างเวลาที่ 00:00:00 จนกว่าจะกดเฉลย, ปุ่ม "⚡ เร่งเวลาแล้วเฉลย" หมุนตัวเลขเร็วแล้วชะลอก่อนเฉลยผล, เอฟเฟกต์พลุ Confetti + 3D Card Flip บนโพเดียม 3 อันดับแรก
- ปรับปรุงระบบลงคะแนนสนาม (/staff/scoring) แยกระบบตามชนิดกีฬาเดี่ยว ใครได้กีฬาอะไรเห็นแค่กีฬานั้น 100% (กรรมการ PIN ฟุตซอลเห็นเฉพาะฟุตซอล 8 แมตช์ ไม่มีกีฬาอื่นปน, Admin เลือกกีฬาที่ต้องการลงคะแนนทีละกีฬาพร้อมปุ่ม "🔄 สลับกีฬา")
- ฟีเจอร์ตัดสินชนะบาย (Walkover) + migration 011 (matches.is_walkover + view matches_public_v2)
  CI (.github/workflows/ci.yml) + pre-commit hook (.githooks/pre-commit)
- Phase 0–5 ข้อ 1–4 เสร็จ: migration 001–012, 44 แมตช์จากสูจิบัตร, deploy แล้ว
- Refactor P1–P3 ครบทุกข้อ; Prettier ทั้ง repo (hash อยู่ใน .git-blame-ignore-revs)
- ผู้ชมไม่เห็นคะแนนสด: กันถึงระดับ DB (view matches_public_v2 + RLS staff_read) และที่ API
  (GET /api/match/[id] ผ่าน maskLiveMatch) — ดูตารางสรุปใน §4
- /results + /schedule + /news เป็น ISR 30 วิ, ผู้ชม poll /api/live-summary ที่แคชที่ edge
  (Supabase โดนอ่านครั้งเดียวต่อ 30 วิ ไม่ว่าคนดูกี่คน — จำเป็นเพราะอยู่ Free tier)
- เกณฑ์ล่าสุด: build ✅ · lint 0/0 ✅ · Vitest 111 ✅ · Prettier ✅ · CI ✅

งานที่เหลือ (เรียงตามลำดับที่แนะนำ):
1. ซ้อมกับอุปกรณ์จริง — มือถือกรรมการ, จอสนาม, หลายเครื่องพร้อมกัน
2. ปิด PIN ทดสอบ `song` (ฟุตซอล) แล้วสร้าง PIN จริงรายกีฬา/รายสนามที่ /admin/pins
3. เพิ่มข่าวจริงที่ /admin/news (announcements ยังว่าง)
4. ตรวจทุกหน้าทุกระบบตาม docs/plans/2026-09-24-full-system-check.md (7 รอบ; §7 มีเรื่องรอผู้ใช้ตัดสินใจ:
   ปิด POST /api/register, ฟอร์มแก้วัน/เวลา/สนามใน /admin/matches)
(ไม่ทำแล้ว ตามที่ผู้ใช้ตัดสินใจ: เปิดรับสมัครผ่านเว็บ, หน้ากติกาบนเว็บ — ให้โหลด PDF อย่างเดียว)

กฎการทำงาน:
- ทำทีละอย่าง หยุดรอคำสั่งหลังจบแต่ละอย่าง
- ก่อน commit: npm run build + npm run lint + npm test ต้องผ่าน (ดู exit code จริง อย่า grep กลบ)
  ถ้าแตะ DB ต้องผ่าน bash supabase/tests/run-local.sh (ขอ PGPASSWORD จากผู้ใช้)
- อัปเดต Handoff.md ทุกครั้งที่จบงาน แล้ว push ขึ้น main
- commit ของ AI deploy ได้เองแล้ว (23–24 ก.ย.); ถ้า Vercel บล็อกอีก ("commit author did not have
  contributing access") ให้เพื่อน Esther03u push ตาม: git commit --allow-empty -m "chore: trigger deploy" && git push
- migration ที่หน้าเว็บต้องใช้ ให้ผู้ใช้รันใน Supabase SQL Editor *ก่อน* push (main deploy อัตโนมัติ)
- migration ใหม่ต้อง additive + idempotent และห้ามแก้ไฟล์ที่รันไปแล้ว
- ห้าม commit secret (.env.local, apply-all.sql เป็น gitignored อยู่แล้ว)
```
