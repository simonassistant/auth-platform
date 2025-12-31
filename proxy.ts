import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// We use 'jose' here because standard 'jsonwebtoken' doesn't work in Next.js Edge Runtime (Middleware)
export async function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // Paths that are publicly accessible
  if (
    request.nextUrl.pathname.startsWith('/api/login') ||
    request.nextUrl.pathname.startsWith('/api/signup') ||
    request.nextUrl.pathname.startsWith('/api/oauth') ||
    request.nextUrl.pathname.startsWith('/oauth') ||
    request.nextUrl.pathname.startsWith('/auth-provider') ||
    request.nextUrl.pathname === '/'
  ) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/api/protected/:path*', '/dashboard/:path*'],
};
