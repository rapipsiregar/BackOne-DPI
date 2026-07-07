import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login');
  
  // Protect all pages except /login and static assets/api
  // The actual API routes inside /api are protected by Express backend (or Next.js API routes)
  // We don't intercept /api requests here to avoid breaking them, but we protect the UI pages
  
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname === '/favicon.ico' || pathname.endsWith('.svg') || pathname.endsWith('.png')) {
    return NextResponse.next();
  }

  if (!token && !isAuthPage) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isAuthPage) {
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
