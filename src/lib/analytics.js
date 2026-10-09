import { createHash } from 'node:crypto';

export function detectDeviceType(userAgent = '', screenWidth = 0) {
  if (/tablet|ipad/i.test(userAgent) || (screenWidth >= 768 && screenWidth < 1024)) {
    return 'tablet';
  }
  if (/mobile|android|iphone/i.test(userAgent) || screenWidth < 768) {
    return 'mobile';
  }
  return 'desktop';
}

export function generateVisitorHash(ip = '', userAgent = '') {
  // Simple non-identifiable hash — no personal data stored
  const str = `${ip}-${userAgent}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/** Random id PageTracker keeps in localStorage (crypto.randomUUID or a fallback). */
export const isValidVisitorId = (id) => typeof id === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(id);

/**
 * visitor_hash for a page view. A browser-kept id tells apart spectators who
 * share one Wi-Fi (same IP) and the same phone model (same user agent) — the
 * IP + user-agent hash counted them as one visitor. Without an id (storage
 * blocked) it falls back to that hash.
 */
export function visitorHashFor({ visitorId, ip, userAgent }) {
  if (isValidVisitorId(visitorId)) {
    return 'v' + createHash('sha256').update(visitorId).digest('hex').slice(0, 16);
  }
  return generateVisitorHash(ip, userAgent);
}
