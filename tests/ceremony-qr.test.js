// tests/ceremony-qr.test.js
import { describe, expect, it } from 'vitest';
import { generateMcQr, MC_QR_OPTIONS } from '@/lib/ceremony-qr';

describe('generateMcQr', () => {
  it('generates a valid data:image/png base64 QR code for /mc', async () => {
    const dataUrl = await generateMcQr('https://scigames2026.example/mc');
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(MC_QR_OPTIONS.width).toBeGreaterThanOrEqual(200);
  });
});
