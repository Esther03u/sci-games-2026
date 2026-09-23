-- ============================================================================
-- 009_official_sport_rules.sql — Sci Games 2026
--
-- Align the scoring configuration with the official handbook
-- (final/สูจิบัตร69, compared 23 ก.ย. 2569):
--
--   เซปักตะกร้อ  ชนะ 2 ใน 3 เซต · เซต 1–2 ถึง 15 (เซตตัดสิน 8)
--                → points_per_set was 21, which is not this tournament's rule
--   เปตอง        เกมเดียวถึง 11 คะแนน (รอบชิงชนะเลิศ 13)
--                → was modelled as a one-set "sets" sport worth 13, so the
--                  scoring pad showed set controls for a game that has none
--   วอลเลย์บอล   ชนะ 2 ใน 3 เซต · เซต 1–2 ถึง 25 (เซตตัดสิน 15) — already right
--
-- The deciding-set totals (วอลเลย์ 15, ตะกร้อ 8) and petanque's 13-point final
-- are deliberately NOT modelled: `sports` holds one number per sport and the
-- referees close each set and each match by hand anyway (decision 23 ก.ย.).
-- Additive, idempotent — plain UPDATEs on seeded rows.
-- ============================================================================

UPDATE sports SET points_per_set = 15 WHERE name = 'เซปักตะกร้อ';

UPDATE sports
   SET scoring_type = 'points',
       sets_to_win = 1,
       points_per_set = 11
 WHERE name = 'เปตอง';
