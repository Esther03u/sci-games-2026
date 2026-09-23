import { describe, expect, it } from 'vitest';
import { POST } from '@/app/api/register/route';

describe('POST /api/register (web registration closed 24 ก.ย.)', () => {
  it('answers 410 REGISTRATION_CLOSED whatever is sent', async () => {
    const res = await POST(new Request('http://x/api/register', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(410);
    expect(await res.json()).toMatchObject({ success: false, error_code: 'REGISTRATION_CLOSED' });
  });
});
