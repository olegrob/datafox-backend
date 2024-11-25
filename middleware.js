import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // If the user is authenticated, allow the request
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/",
    },
  }
);

// Configure which routes to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - / (home page)
     * - /api/auth/* (auth endpoints)
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico (favicon file)
     * - /images/* (images directory)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
