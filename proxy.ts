import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken, sessionSecret, SESSION_COOKIE } from "@/lib/auth/session-token";

// A quick redirect before anything renders (Phase 3, docs/plans/2026-11-10-fase-3-login.md):
// no cookie, or one that is forged or expired, gets a real 307 to the login page. It does
// not look at the database, so the full check is still requireUser()/requireAdmin() in
// every dashboard layout and page (a deactivated account or a changed password).
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (readSessionToken(sessionSecret(), token)) return NextResponse.next();
  const response = NextResponse.redirect(new URL("/login", request.url));
  if (token !== undefined) response.cookies.delete(SESSION_COOKIE);
  return response;
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
