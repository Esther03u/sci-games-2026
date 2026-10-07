-- ============================================================================
-- 014_pin_single_session.sql — Sci Games 2026
--
-- Single-device active session enforcement per PIN.
-- When a new device logs in with a sport's PIN, active_session_id is updated.
-- Previous devices presenting an older session_id in their signed JWT will be
-- rejected (kicked out).
-- Additive and idempotent.
-- ============================================================================

ALTER TABLE sport_pins
  ADD COLUMN IF NOT EXISTS active_session_id text;
