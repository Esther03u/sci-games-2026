import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { detectDeviceType, visitorHashFor } from '@/lib/analytics';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';

    const body = await request.json().catch(() => ({}));
    const { page_path, screen_width, visitor_id } = body;

    if (!page_path || typeof page_path !== 'string') {
      return NextResponse.json({ error: 'Invalid page_path' }, { status: 400 });
    }

    const deviceType = detectDeviceType(userAgent, screen_width || 0);
    const visitorHash = visitorHashFor({ visitorId: visitor_id, ip, userAgent });

    // Rate limit per visitor (60/min) so spectators sharing one Wi-Fi are not
    // throttled as one; the per-IP cap only stops a flood.
    const perVisitor = await rateLimit({ key: `track-v-${visitorHash}`, limit: 60, windowMs: 60000 });
    const perIp = perVisitor.success
      ? await rateLimit({ key: `track-${ip}`, limit: 1500, windowMs: 60000 })
      : perVisitor;

    if (!perIp.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Save view to Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createAdminClient();
      await supabase.from('page_views').insert({
        page_path: page_path.slice(0, 255),
        device_type: deviceType,
        visitor_hash: visitorHash,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in /api/track:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
