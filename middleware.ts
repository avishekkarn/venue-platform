import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/staff/:path*", "/kitchen/:path*", "/admin/:path*"],
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Let login pages load without restriction
  if (pathname.endsWith("/login")) {
    return NextResponse.next();
  }

  // Check for the presence of the venue_staff session cookie
  const staffCookie = request.cookies.get("venue_staff");
  if (staffCookie) {
    return NextResponse.next();
  }

  // Cookie is missing: redirect to the corresponding login page
  if (pathname.startsWith("/staff")) {
    return NextResponse.redirect(new URL("/staff/login", request.url));
  }

  if (pathname.startsWith("/kitchen")) {
    return NextResponse.redirect(new URL("/kitchen/login", request.url));
  }

  if (pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}
