import { describe, expect, it } from 'vitest';
import { mapRegisterError } from '@/lib/api/register';

describe('mapRegisterError', () => {
  it('maps register_athlete RAISE codes to status + Thai message', () => {
    expect(mapRegisterError({ message: 'DUPLICATE_REGISTRATION' })).toMatchObject({
      status: 409,
      body: { success: false, error_code: 'DUPLICATE_REGISTRATION' },
    });
    expect(mapRegisterError({ message: 'INVALID_DEPARTMENT' }).status).toBe(400);
    expect(mapRegisterError({ message: 'INVALID_SPORT_COUNT' }).status).toBe(400);
  });

  it('QUOTA_FULL keeps the sport name and count from the DB message', () => {
    const r = mapRegisterError({ message: 'QUOTA_FULL: ฟุตซอล (12/12)' });
    expect(r.status).toBe(409);
    expect(r.body.message).toBe('โควตากีฬา ฟุตซอล ของสีนี้เต็มแล้ว (12/12 คน)');
  });

  it('unknown errors become a generic 500', () => {
    expect(mapRegisterError({ message: 'connection reset' })).toMatchObject({
      status: 500,
      body: { error_code: 'SERVER_ERROR' },
    });
    expect(mapRegisterError(null).status).toBe(500);
  });
});
