import { SignJWT, jwtVerify } from 'jose';

export const PIN_COOKIE = 'sg_pin';
const PIN_SESSION_HOURS = 14;

function secretKey() {
  const secret = process.env.PIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('PIN_SESSION_SECRET is missing or too short (min 16 chars)');
  }
  return new TextEncoder().encode(secret);
}

export function pinSessionConfigured() {
  return Boolean(process.env.PIN_SESSION_SECRET && process.env.PIN_SESSION_SECRET.length >= 16);
}

export async function signPinSession({ pinId, sportId, label }) {
  return new SignJWT({ pin_id: pinId, sport_id: sportId, label })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${PIN_SESSION_HOURS}h`)
    .sign(secretKey());
}

// Returns { pinId, sportId, label } or null for a missing/invalid/expired token.
export async function readPinSession(token) {
  if (!token || !pinSessionConfigured()) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    if (!payload.pin_id || !payload.sport_id) return null;
    return { pinId: payload.pin_id, sportId: payload.sport_id, label: payload.label || 'PIN' };
  } catch {
    return null;
  }
}

export function pinCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: PIN_SESSION_HOURS * 60 * 60,
  };
}
