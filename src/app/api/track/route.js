import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { detectDeviceType, generateVisitorHash } from '@/lib/analytics';

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';

    // Rate limit: max 60 hits per minute per IP
    const rl = await rateLimit({
      key: `track-${ip}`,
      limit: 60,
      windowMs: 60000,
    });

    if (!rl.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { page_path, screen_width } = body;

    if (!page_path || typeof page_path !== 'string') {
      return NextResponse.json({ error: 'Invalid page_path' }, { status: 400 });
    }

    const deviceType = detectDeviceType(userAgent, screen_width || 0);
    const visitorHash = generateVisitorHash(ip, userAgent);

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
