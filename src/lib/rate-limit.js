const rateLimitMap = new Map();

export function rateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, []);
  }

  const timestamps = rateLimitMap.get(key).filter((ts) => ts > windowStart);
  rateLimitMap.set(key, timestamps);

  if (timestamps.length >= limit) {
    return { success: false, remaining: 0 };
  }

  timestamps.push(now);
  return { success: true, remaining: limit - timestamps.length };
}

// Clean up stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of rateLimitMap.entries()) {
      const filtered = timestamps.filter((ts) => ts > now - 600000);
      if (filtered.length === 0) rateLimitMap.delete(key);
      else rateLimitMap.set(key, filtered);
    }
  }, 300000);
}
