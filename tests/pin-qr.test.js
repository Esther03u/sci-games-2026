import { describe, expect, it } from 'vitest';
import { PIN_QR_OPTIONS, pinLoginQr } from '@/lib/pin-qr';

describe('PIN login QR (/admin/pins)', () => {
  it('renders a PNG data URL for the login link', async () => {
    const url = await pinLoginQr('https://sci-games-2026.vercel.app/staff/login?sport=abc');
    expect(url).toMatch(/^data:image\/png;base64,/);
  });

  it('uses hex colours (CSS variables made the library throw and the QR vanish)', () => {
    expect(PIN_QR_OPTIONS.color.dark).toMatch(/^#[0-9a-f]{6}$/i);
    expect(PIN_QR_OPTIONS.color.light).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
