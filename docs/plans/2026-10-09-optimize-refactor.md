# แผน Optimize & Refactor รอบ 2 — Sci Games 2026

วันที่: 9 ต.ค. 2569 (ระหว่างงานแข่ง 8–11 ต.ค.) · branch: `refactor/optimize-structure`
หลัก: **ไม่เปลี่ยนพฤติกรรมที่ผู้ใช้เห็น** · ไม่แตะ flow ลงคะแนน (`/staff/scoring`, `/api/score*`, `/api/match/*`) ระหว่างงาน · ไม่ push `main` จนกว่าผู้ใช้สั่ง

ต่อจากแผนรอบแรก `2026-09-21-refactor.md` (P1–P3 ทำไปแล้ว: lib/format, labels, team-style, queries/, api/client, Banner, แยก styles/, แตก ScoreInput)

## 0. สภาพปัจจุบัน (วัดจริง 9 ต.ค.)

| หัวข้อ | ที่พบ |
|---|---|
| ขนาด | ~29,700 บรรทัดใน `src/` · 1,295 บล็อก `style={{…}}` inline |
| ไฟล์ใหญ่เกิน | `admin/MatchEditor.js` **1,466** (component เดียว, `useState` 25 ตัว, modal 5 อันในไฟล์เดียว) · `ui/MatchDetailModal.js` 1,012 · `staff/ScoreInput/MatchPicker.js` 736 · `ui/MatchCard.js` 697 · `public/ScheduleGrid.js` 695 · `staff/ScoreInput/ScorePad.js` 627 · `ui/FolderFloat.js` 621 |
| โค้ดตาย (ไม่มีใคร import) | `public/QuickLinks.js` 157, `public/RegistrationForm.js` 447, `public/results/PlacementBoard.js` 149, `ui/MatchCard.module.css` 60, `ui/TextLoop.js` 235, `constants/index.js`, `lib/validation.js` 103, `lib/api/register.js` (ใช้แค่ใน test; ปิดรับสมัครแล้ว) — รวม ~1,400 บรรทัด |
| โค้ดซ้ำ | การหาทีม/ป้ายรอบชิง (`isFinal`, `isThird`, ทีม "รอผลการแข่งขัน", สีสำรอง) ซ้ำ **~60 บรรทัดเหมือนกันทุกตัวอักษร** ใน `MatchCard` + `MatchDetailModal` · `teams.find()` 16 ครั้ง / `sports.find()` 7 ครั้งใน `MatchEditor` (บางจุดอยู่ใน loop ของตาราง) |
| Bundle หน้า public (gzip) | `/` 192 KB · `/schedule` 158 KB · `/results` 158 KB — ในนั้นมี **supabase-js + realtime 59.5 KB** (ผู้ชมใช้แค่ `fetch('/api/live-summary')`), **matter-js 31 KB** (FolderFloat), **ข้อมูลสูจิบัตร `data/handbook.js` 12.3 KB** (ติดมากับ `MatchDetailModal` ทั้งที่ modal เปิดเมื่อกดเท่านั้น) |
| บั๊กเล็ก | `lib/toast.js` `getServerSnapshot` คืน `[]` ใหม่ทุกครั้ง → React เตือน "should be cached to avoid an infinite loop" ทุกหน้า |
| ความเสี่ยงช่วงงาน | `PodiumCountdown` (หน้าแรก) เปิด **Supabase Realtime websocket ต่อผู้ชม 1 คน** + poll `/api/public/podium-settings` (no-store, ยิง Supabase ทุกครั้ง) ทุก 8 วิ — ขัดกับหลัก "ผู้ชมไม่ใช้ Realtime" (Free tier 200 connections) และช่วงเฉลยโพเดียม 11 ต.ค. 16:30 คือช่วงคนเปิดหน้าแรกมากที่สุด |

## 1. รอบนี้ทำเลย (ความเสี่ยงต่ำ ไม่เปลี่ยนพฤติกรรม)

| # | งาน | ผล |
|---|---|---|
| R1 | ลบโค้ดตาย 8 ไฟล์ (+ test ของ `lib/api/register.js`) | −~1,500 บรรทัด, ค้นโค้ดเจอง่ายขึ้น |
| R2 | แก้ `toast.getServerSnapshot` ให้คืน array คงที่ | ไม่มี warning, กัน re-render loop |
| R3 | `lib/match-view.js` — `getMatchView(match, teams, { isScheduleView })` รวม logic ทีม/รอบชิง/สกอร์/ผู้ชนะ ใช้ใน `MatchCard` + `MatchDetailModal` + unit test | ลบโค้ดซ้ำ ~60 บรรทัด, แก้ที่เดียว |
| R4 | `MatchCard` โหลด `MatchDetailModal` แบบ `next/dynamic` (โหลดตอนกดครั้งแรก) | modal 1,000 บรรทัด + ข้อมูลสูจิบัตรออกจาก bundle แรกของ `/`, `/schedule`, `/results` |
| R5 | `useLiveScores` + `PodiumCountdown` โหลด `@/lib/supabase/client` ด้วย `import()` ตอนต้องใช้จริง | supabase-js ออกจาก bundle แรกของ `/schedule`, `/results` (ผู้ชมใช้ fetch อย่างเดียว) และโหลดหลังหน้าแสดงผลบน `/` |
| R6 | แตก `admin/MatchEditor.js` → โฟลเดอร์ `admin/MatchEditor/` (`index`, `MatchRow`, `AddMatchModal`, `ScoreModal`, `ScheduleModal`, `ResetModal`, `DeleteModal`) + logic ล้วนใน `lib/match-editor.js` (`buildEditSets`, `countSetWins`, `applyResetToList`) + unit test · lookup ทีม/กีฬาด้วย `Map` แทน `find()` | ไฟล์ละ ≤ ~300 บรรทัด, logic คำนวณเซต/รีเซ็ตสายแข่งทดสอบได้ |

ทุกขั้น: `npm run lint` + `npm test` + `npm run build` ผ่าน, วัด bundle ก่อน/หลัง, เปิดหน้าใน browser ดูว่าเหมือนเดิม

### ผล (9 ต.ค.) — R1–R6 ✅ บน branch `refactor/optimize-structure`

JS ฝั่ง client ต่อหน้า (gzip, รวม chunk ใน `page_client-reference-manifest` ของ `next build`):

| หน้า | ก่อน | หลัง | ลดลง |
|---|---|---|---|
| `/` | 192.1 KB | 118.6 KB | −38% |
| `/schedule` | 158.2 KB | 89.2 KB | −44% |
| `/results` | 157.8 KB | 83.7 KB | −47% |
| `/live` | 144.6 KB | 77.9 KB | −46% |
| `/live/[sportId]` | 146.3 KB | 79.5 KB | −46% |
| `/admin` | 163.7 KB | 156.5 KB | −4% |

- Vitest 142 → 157 (เพิ่ม `match-view`, `match-editor`, toast snapshot; ลบ test ของ `lib/api/register.js` ที่ลบไป) · lint 0/0 · build ✅
- ทดสอบใน browser: `/schedule` เปิด/ปิด modal รายละเอียด (แท็บกติกาโหลดข้อมูลสูจิบัตรได้, ปิดด้วย Esc ~170 ms เท่าเดิม), `/` นับถอยหลัง + แมตช์ไฮไลท์ + poll ทำงาน, `/results` การ์ดผล/ผู้ชนะแสดงถูก, console ไม่มี error
- ยังไม่ได้ทดสอบหน้า `/admin/matches` ใน browser — ต้องล็อกอินแอดมิน และ dev server ต่อฐานข้อมูล production

## 2. ต้องให้ผู้ใช้ตัดสินใจก่อน (เปลี่ยนพฤติกรรม)

| # | ข้อเสนอ | ได้ | เสีย |
|---|---|---|---|
| D1 | `PodiumCountdown` เลิกใช้ Realtime สำหรับผู้ชม เหลือ poll อย่างเดียว (ขยายหน้าต่างเล่นแอนิเมชัน fast-forward จาก 8 → 15 วิ) | ไม่กินโควตา 200 connections ตอนคนดูเยอะ, ไม่ต้องโหลด supabase-js บนหน้าแรกเลย | ผู้ชมเห็นการเฉลยช้ากว่าแอดมินกดได้สูงสุด ~8 วิ |
| D2 | `/api/public/podium-settings` ใส่ `s-maxage=5` | Supabase โดนอ่าน ≤ 1 ครั้ง/5 วิ ไม่ว่าคนดูกี่คน | ค่าที่แอดมินเปลี่ยนเห็นช้าขึ้น ≤ 5 วิ |
| D3 | `MatchEditor` เปลี่ยน `window.confirm` 3 จุดเป็น `ConfirmDialog` ที่มีอยู่แล้ว | UI เดียวกันทั้งระบบ | หน้าตาการยืนยันเปลี่ยน |
| D4 | ข้อความ "หากลบแล้วตารางสูจิบัตรจะไม่ครบ 44 คู่" ใน modal ลบแมตช์ — ปัจจุบันมี 33 คู่ | ข้อความถูกต้อง | — |

### ผู้ใช้ตัดสินใจแล้ว (9 ต.ค.): D1 = B, D2 ✅, D3 ✅, D4 ✅ — ทำครบ + ทดสอบบน DB บนเครื่อง (`docs/local-database.md`)

ระหว่างทดสอบพบบั๊กเดิม (มีก่อน refactor) แล้วแก้ไปด้วย:

| บั๊ก | ผลกระทบ | แก้ |
|---|---|---|
| ปุ่ม "เร่งเวลาแล้วเฉลย" ของโพเดียม | ผู้ชมเห็นแอนิเมชันแล้ว**เด้งกลับไปนับถอยหลัง ไม่เฉลยจริง** (ยืนยันกับโค้ดเดิมแล้ว) | `lib/podium.js` `isPodiumRevealed()` ใช้ร่วม client/server; effect sync เฉพาะตอนค่าจาก server เปลี่ยน |
| `/admin/matches` เลือก "จบการแข่งขัน" กับแมตช์ที่ยังไม่เริ่ม | บันทึกคะแนนแล้วแต่ `/finish` 409 สถานะค้าง | `statusSteps()` สั่ง start ก่อน (และ reopen เมื่อ finished → live) |
| บันทึกผลรายเซต (วอลเลย์/ตะกร้อ) | เซตที่ 1 ถูกทับด้วยจำนวนเซตที่ชนะ (เช่น 2-1); เปิด modal ซ้ำแล้วกดบันทึก → ผลกลายเป็น 0-0 | ส่ง score = แต้มเซตสุดท้าย (ตาม `finish_set`), route เขียน match_sets หลัง RPC + ตั้ง current_set, อัปเดต match_sets ในหน้าหลังบันทึก |
| การ์ดผลแข่ง (`/`, `/results`) กีฬาแบบเซต | แสดงแต้มเซตสุดท้าย (เช่น 15-10) แทนผลเซต 2-1 | `getMatchView({ sport })` ใช้ sets_a/sets_b |
| `scripts/lib/env.mjs` `projectRef` | smoke/permission test ใช้กับ local ไม่ได้ | ใช้ hostname แบบ supabase-js |

ผลทดสอบสุดท้าย: Vitest 171/171 · lint 0/0 · build ✅ · smoke (local) ALL PASSED · permission matrix (local) 44/44 · ทดสอบในเบราว์เซอร์: บันทึกผล/เริ่ม/แข่งต่อ/ชนะบาย/รีเซ็ต/แก้ตาราง, โพเดียม เร่งเวลา→เฉลยค้างอยู่, รีเซ็ตเป็นปริศนา, เฉลยทันที, เปิดหน้าหลังเฉลยแล้ว
หมายเหตุ: ไฟล์ 9 ไฟล์ใน `main` (page.js, schedule/page.js, live-summary, FeaturedMatchesLive, toast.css, documents.js, handbook.js, 2 tests) ยังไม่ผ่าน `prettier --check` ตั้งแต่ก่อนรอบนี้ — ไม่ได้แตะ

## 3. หลังงานจบ (12 ต.ค. เป็นต้นไป)

1. แตก `staff/ScoreInput/MatchPicker.js` / `ScorePad.js` / `public/ScheduleGrid.js` / `ui/MatchDetailModal.js` (แยกแท็บเป็นไฟล์) — ไม่ทำระหว่างงานเพราะเป็นหน้าที่กรรมการใช้อยู่
2. ย้าย inline style ซ้ำ ๆ (1,295 บล็อก) เป็น class ใน `src/styles/*.css` ทีละหน้า พร้อม screenshot เทียบ
3. `FolderFloat`: โหลด matter-js ด้วย `import()` เมื่อเปิด folder ครั้งแรก (−31 KB gzip จากหน้าแรก) — ต้องทดสอบแอนิเมชันบนมือถือจริง
4. `npm audit` (1 critical, 7 high) — อัปเดต dependency แล้วรัน build/test เต็มชุด
5. Feature-first folders (`src/features/*`) ตามระดับ B ของแผนรอบแรก
