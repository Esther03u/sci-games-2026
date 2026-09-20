import { createAdminClient } from '@/lib/supabase/admin';

// In-memory fallback. On Vercel each serverless instance has its own Map, so
// this only throttles within one instance — the Postgres path below is the
// one that actually works in production (see check_rate_limit() in 002).
const rateLimitMap = new Map();

function memoryRateLimit({ key, limit, windowMs }) {
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

export async function rateLimit({ key, limit, windowMs }) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_key: key,
        p_limit: limit,
        p_window_seconds: Math.ceil(windowMs / 1000),
      });
      if (!error && data && typeof data === 'object') {
        return { success: data.allowed === true, remaining: data.remaining ?? 0 };
      }
      if (error) console.error('check_rate_limit rpc error, falling back to memory:', error.message);
    } catch (err) {
      console.error('check_rate_limit failed, falling back to memory:', err);
    }
  }
  return memoryRateLimit({ key, limit, windowMs });
}

// First hop of x-forwarded-for is the client; later hops are proxies.
export function getClientIp(request) {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

// Clean up stale in-memory entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of rateLimitMap.entries()) {
      const filtered = timestamps.filter((ts) => ts > now - 600000);
      if (filtered.length === 0) rateLimitMap.delete(key);
      else rateLimitMap.set(key, filtered);
    }
  }, 300000);
  if (typeof timer.unref === 'function') timer.unref();
}
