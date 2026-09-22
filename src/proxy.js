import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Next.js 16: "Proxy" is the new name for Middleware. Same behaviour.
// This is only an optimistic session check — role checks happen in layouts
// and in each Route Handler via resolveActor().
export async function proxy(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Admin API: JSON 401 instead of a redirect
  if (pathname.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json(
        { success: false, error_code: 'UNAUTHENTICATED', message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
    return supabaseResponse;
  }

  // Protect admin routes
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protect staff routes — a Supabase session or a PIN cookie may enter.
  // The PIN cookie is only checked for presence here; /api/auth/me and the
  // scoring routes verify it properly.
  if (pathname.startsWith('/staff') && !pathname.startsWith('/staff/login')) {
    const hasPinCookie = Boolean(request.cookies.get('sg_pin')?.value);
    if (!user && !hasPinCookie) {
      return NextResponse.redirect(new URL('/staff/login', request.url));
    }
  }

  // Live board is for signed-in referees/admins/venue screens only; spectators
  // see "กำลังแข่ง" on /results. A real 307 here (requireViewer() in the page
  // is the second line and validates the PIN cookie properly).
  if (pathname === '/live' || pathname.startsWith('/live/')) {
    const hasPinCookie = Boolean(request.cookies.get('sg_pin')?.value);
    if (!user && !hasPinCookie) {
      const login = new URL('/staff/login', request.url);
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*', '/staff/:path*', '/api/admin/:path*', '/live', '/live/:path*'],
};
