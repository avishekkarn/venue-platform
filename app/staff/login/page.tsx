import type { JSX } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLandingRouteForRoles } from "@/lib/auth/landing-route";
import { getAuthenticatedStaff } from "@/lib/auth/validate-session";
import {
  CSRF_COOKIE_NAME,
  CSRF_MAX_AGE_SECONDS,
  getCsrfCookie,
} from "@/infrastructure/csrf/cookies";
import { generateCsrfToken } from "@/infrastructure/csrf/token";
import { LoginForm } from "./_form";

export default async function StaffLoginPage(): Promise<JSX.Element> {
  const staff = await getAuthenticatedStaff();
  if (staff !== null) {
    redirect(getLandingRouteForRoles(staff.roles));
  }

  // Issue the CSRF cookie if absent, so the login form's fetch() can
  // send the X-CSRF-Token header. A rotation happens when the cookie
  // expires (30 days) or the browser clears it.
  const existingCsrf = await getCsrfCookie();
  if (!existingCsrf) {
    const cookieStore = await cookies();
    cookieStore.set(CSRF_COOKIE_NAME, generateCsrfToken(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CSRF_MAX_AGE_SECONDS,
    });
  }

  return (
    <main className="flex items-center justify-center px-4 min-h-dvh">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
            Sign In
          </h1>
          <p className="text-[14px] leading-[20px] text-staff-text-muted">
            Staff access
          </p>
        </header>
        <LoginForm />
      </div>
    </main>
  );
}
