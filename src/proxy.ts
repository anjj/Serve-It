import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const response = NextResponse.next();

  let csrfToken = request.cookies.get('csrf_token')?.value;

  if (!csrfToken) {
    csrfToken = crypto.randomUUID();
    response.cookies.set('csrf_token', csrfToken, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: false, // Must be false for the client to read it for double submit pattern
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
