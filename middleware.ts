import { NextResponse, type NextRequest } from "next/server";
import {
  CSRF_COOKIE_NAME,
  CSRF_MAX_AGE_SECONDS,
} from "@/infrastructure/csrf/cookies";

export const config = {
  matcher: ["/staff/:path*", "/kitchen/:path*", "/admin/:path*"],
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Every response the middleware produces (including the login pages and
  // the authenticated pages) carries a csrf_token if the incoming request
  // does not already have one. This is the defensive bootstrap: the login
  // route also sets the cookie, but if a staff member is already logged in
  // from a previous session (or the cookie was cleared), the middleware
  // guarantees the cookie exists before the page's inline script fetches.
  //
  // The middleware runs on the login pages too, so a fresh visitor who
  // has never logged in gets a csrf_token before submitting the form.
  const ensureCsrfCookie = (response: NextResponse): NextResponse => {
    if (!request.cookies.get(CSRF_COOKIE_NAME)?.value) {
      response.cookies.set(CSRF_COOKIE_NAME, crypto.randomUUID(), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: CSRF_MAX_AGE_SECONDS,
      });
    }
    return response;
  };

  // Let login pages load without restriction.
  if (pathname.endsWith("/login")) {
    return ensureCsrfCookie(NextResponse.next());
  }

  const staffCookie = request.cookies.get("venue_staff");
  if (staffCookie) {
    return ensureCsrfCookie(NextResponse.next());
  }

  // No session: redirect to the corresponding login page. The redirect
  // response also carries the csrf_token, so the login page can use it.
  if (pathname.startsWith("/staff")) {
    return ensureCsrfCookie(
      NextResponse.redirect(new URL("/staff/login", request.url))
    );
  }
  if (pathname.startsWith("/kitchen")) {
    return ensureCsrfCookie(
      NextResponse.redirect(new URL("/kitchen/login", request.url))
    );
  }
  if (pathname.startsWith("/admin")) {
    return ensureCsrfCookie(
      NextResponse.redirect(new URL("/admin/login", request.url))
    );
  }
  return ensureCsrfCookie(NextResponse.next());
}
