import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE, verifyToken } from '@/lib/token';

/**
 * Gerbang route. Pemeriksaan kepemilikan data yang sebenarnya tetap
 * dilakukan di setiap halaman, server action, dan API route.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifyToken(token);

  const isAdminArea = pathname.startsWith('/kosku/admin');
  const isTenantArea = pathname.startsWith('/kosku/tenant');
  const isAuthPage = pathname === '/kosku/login' || pathname === '/kosku/register';

  if ((isAdminArea || isTenantArea) && !session) {
    const url = request.nextUrl.clone();
    url.pathname = '/kosku/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (isAdminArea && session?.role !== 'ADMIN') {
    const url = request.nextUrl.clone();
    url.pathname = '/kosku/tenant';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (isTenantArea && session?.role !== 'TENANT') {
    const url = request.nextUrl.clone();
    url.pathname = '/kosku/admin';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (isAuthPage && session) {
    const url = request.nextUrl.clone();
    url.pathname = session.role === 'ADMIN' ? '/kosku/admin' : '/kosku/tenant';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/kosku/admin/:path*', '/kosku/tenant/:path*', '/kosku/login', '/kosku/register'],
};
