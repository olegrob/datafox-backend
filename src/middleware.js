import { NextResponse } from 'next/server';

export function middleware(request) {
  // Add dynamic route handling
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/api/:path*',
    '/api/clients/:path*',
    '/api/orders/:path*',
    '/api/attributes/:path*',
  ],
};
