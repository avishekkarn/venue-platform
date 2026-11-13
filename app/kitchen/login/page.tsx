import type { JSX } from "react";
import { redirect } from "next/navigation";
import { getLandingRouteForRoles } from "@/lib/auth/landing-route";
import { getAuthenticatedStaff } from "@/lib/auth/validate-session";
import { LoginForm } from "./_form";

export default async function KitchenLoginPage(): Promise<JSX.Element> {
  const staff = await getAuthenticatedStaff();
  if (staff !== null) {
    redirect(getLandingRouteForRoles(staff.roles));
  }

  return (
    <main className="flex items-center justify-center px-4 min-h-dvh">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
            Sign In
          </h1>
          <p className="text-[14px] leading-[20px] text-staff-text-muted">
            Kitchen access
          </p>
        </header>
        <LoginForm />
      </div>
    </main>
  );
}
