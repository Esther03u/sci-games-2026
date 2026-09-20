export function detectDeviceType(userAgent = '', screenWidth = 0) {
  if (
    /tablet|ipad/i.test(userAgent) ||
    (screenWidth >= 768 && screenWidth < 1024)
  ) {
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
