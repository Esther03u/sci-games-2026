'use client';
import { usePathname } from 'next/navigation';

/**
 * When Vercel regenerates the ISR home page it renders with the route
 * segment "index", so usePathname() is "/index" on the server and "/" in
 * the browser. Anything rendered from the pathname (active nav item) then
 * fails hydration (React #418) and the whole page re-renders client-side.
 */
export const normalizePathname = (pathname) => (pathname === '/index' ? '/' : pathname);

export function useSitePathname() {
  return normalizePathname(usePathname());
}
