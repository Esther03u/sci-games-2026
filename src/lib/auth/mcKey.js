import crypto from 'node:crypto';

// The MC's secret link (/mc?k=…) shows the overall totals before the podium reveal
// without an admin login. The key is derived from PIN_SESSION_SECRET, so there is
// no new env var to set and rotating that secret also kills old links.
const MC_KEY_LABEL = 'sci-games-mc-totals-v1';

/** The current MC key, or null when PIN_SESSION_SECRET is not configured. */
export function mcAccessKey() {
  const secret = process.env.PIN_SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  return crypto.createHmac('sha256', secret).update(MC_KEY_LABEL).digest('base64url').slice(0, 24);
}

/** True when `key` is the MC key (constant-time compare). */
export function isValidMcKey(key) {
  const expected = mcAccessKey();
  if (!expected || typeof key !== 'string' || key.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(key), Buffer.from(expected));
}
