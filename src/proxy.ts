import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "wms_session";

/**
 * Optimistic redirects only — checks cookie *presence*, not validity.
 * Real authentication/authorization happens server-side in layouts, pages,
 * and server actions via src/lib/auth.ts (DB-backed).
 */
export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (!hasSessionCookie && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasSessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/pending",
    "/admin/:path*",
    "/catalog/:path*",
  ],
};
