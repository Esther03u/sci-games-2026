import { beforeEach, describe, expect, it } from 'vitest';
import { encryptPin, decryptPin, isPinEncryptionConfigured } from '@/lib/auth/pinCrypto';

const VALID_KEY = 'G+B2LvlpOonNnfXc+rwMgVONbINNvV3EpbOoQJY3/LE=';

describe('pinCrypto', () => {
  beforeEach(() => {
    process.env.PIN_ENCRYPTION_KEY = VALID_KEY;
  });

  it('round-trips encryption and decryption of a 6-digit PIN', () => {
    const originalPin = '123456';
    const encrypted = encryptPin(originalPin);
    expect(encrypted).toMatch(/^v1:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/);

    const decrypted = decryptPin(encrypted);
    expect(decrypted).toBe(originalPin);
  });

  it('generates different ciphertexts for the same PIN (unique IV)', () => {
    const pin = '654321';
    const enc1 = encryptPin(pin);
    const enc2 = encryptPin(pin);
    expect(enc1).not.toBe(enc2);

    expect(decryptPin(enc1)).toBe(pin);
    expect(decryptPin(enc2)).toBe(pin);
  });

  it('rejects tampered ciphertext', () => {
    const pin = '999888';
    const encrypted = encryptPin(pin);
    const parts = encrypted.split(':');

    // Tamper ciphertext part
    const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:tampered_${parts[3].slice(9)}`;
    expect(() => decryptPin(tampered)).toThrow();
  });

  it('rejects tampered auth tag', () => {
    const pin = '999888';
    const encrypted = encryptPin(pin);
    const parts = encrypted.split(':');

    // Tamper tag
    const tamperedTag = parts[2][0] === 'A' ? 'B' + parts[2].slice(1) : 'A' + parts[2].slice(1);
    const tampered = `${parts[0]}:${parts[1]}:${tamperedTag}:${parts[3]}`;
    expect(() => decryptPin(tampered)).toThrow();
  });

  it('fails decryption when decrypted with a different key', () => {
    const encrypted = encryptPin('777111');
    process.env.PIN_ENCRYPTION_KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='; // different 32 bytes
    expect(() => decryptPin(encrypted)).toThrow();
  });

  it('returns null when encrypting without a key configured', () => {
    delete process.env.PIN_ENCRYPTION_KEY;
    expect(isPinEncryptionConfigured()).toBe(false);
    expect(encryptPin('123456')).toBeNull();
  });

  it('throws when decrypting without a key configured', () => {
    const encrypted = encryptPin('123456');
    delete process.env.PIN_ENCRYPTION_KEY;
    expect(() => decryptPin(encrypted)).toThrow(/PIN_ENCRYPTION_KEY is not configured/);
  });

  it('throws when key length is invalid', () => {
    process.env.PIN_ENCRYPTION_KEY = 'dG9vLXNob3J0'; // "too-short" base64
    expect(isPinEncryptionConfigured()).toBe(false);
    expect(() => encryptPin('123456')).toThrow(/must be 32 bytes/);
  });
});
