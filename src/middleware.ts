import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'script-review-agent-secret-key-2024',
  });

  const { pathname } = request.nextUrl;

  // Allow auth-related routes
  if (pathname.startsWith('/api/auth') || pathname === '/login' || pathname === '/register') {
    if (token && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protect dashboard and API routes
  if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/api/'))) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*', '/login', '/register'],
};
