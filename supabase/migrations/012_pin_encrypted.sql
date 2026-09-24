-- ============================================================================
-- 012_pin_encrypted.sql — Sci Games 2026
--
-- Store AES-256-GCM encrypted PIN so admins can reveal it again.
-- Key is stored in PIN_ENCRYPTION_KEY environment variable (outside DB).
-- Format: 'v1:<iv>:<tag>:<ciphertext>' in base64url.
-- Existing rows default to NULL (legacy PINs that cannot be decrypted).
-- Additive and idempotent.
-- ============================================================================

ALTER TABLE sport_pins
  ADD COLUMN IF NOT EXISTS pin_encrypted text;
