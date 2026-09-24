import crypto from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128 bits auth tag

/**
 * Reads and decodes PIN_ENCRYPTION_KEY from environment.
 * Expects a base64-encoded 32-byte key (or raw 32-byte string).
 * Returns Buffer or null if not configured.
 */
function getEncryptionKey() {
  const rawKey = process.env.PIN_ENCRYPTION_KEY?.trim();
  if (!rawKey) return null;

  // Try base64 decoding first
  const buf = Buffer.from(rawKey, 'base64');
  if (buf.length === 32) return buf;

  // Raw 32 bytes UTF-8 fallback
  if (Buffer.byteLength(rawKey, 'utf8') === 32) {
    return Buffer.from(rawKey, 'utf8');
  }

  throw new Error(`PIN_ENCRYPTION_KEY must be 32 bytes (got ${buf.length} bytes from base64 decode)`);
}

/**
 * Returns true if PIN_ENCRYPTION_KEY is present and valid.
 */
export function isPinEncryptionConfigured() {
  try {
    return Boolean(getEncryptionKey());
  } catch {
    return false;
  }
}

/**
 * Encrypts a PIN string using AES-256-GCM.
 * Format: 'v1:<iv>:<tag>:<ciphertext>' in base64url.
 * If PIN_ENCRYPTION_KEY is not configured, returns null (graceful degradation).
 *
 * @param {string|number} pin
 * @returns {string|null}
 */
export function encryptPin(pin) {
  if (pin === null || pin === undefined) return null;
  const pinStr = String(pin).trim();
  if (!pinStr) return null;

  const key = getEncryptionKey();
  if (!key) return null;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(pinStr, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v1:${iv.toString('base64url')}:${tag.toString('base64url')}:${ciphertext.toString('base64url')}`;
}

/**
 * Decrypts a stored encrypted PIN string.
 * Throws Error if format is invalid, key is missing/wrong, or auth tag doesn't match.
 *
 * @param {string} stored
 * @returns {string} Plaintext PIN
 */
export function decryptPin(stored) {
  if (!stored || typeof stored !== 'string') {
    throw new Error('Encrypted PIN string is required');
  }

  const parts = stored.split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Invalid encrypted PIN format (expected v1:<iv>:<tag>:<ciphertext>)');
  }

  const key = getEncryptionKey();
  if (!key) {
    throw new Error('PIN_ENCRYPTION_KEY is not configured on this server');
  }

  const iv = Buffer.from(parts[1], 'base64url');
  const tag = Buffer.from(parts[2], 'base64url');
  const ciphertext = Buffer.from(parts[3], 'base64url');

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
  }
  if (tag.length !== AUTH_TAG_LENGTH) {
    throw new Error(`Invalid auth tag length: expected ${AUTH_TAG_LENGTH}, got ${tag.length}`);
  }

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}
