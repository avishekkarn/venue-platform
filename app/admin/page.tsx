import type { JSX } from "react";
import { requireRole } from "@/lib/auth/require-role";
import { LogoutButton } from "./_logout-button";

export default async function AdminDashboardPage(): Promise<JSX.Element> {
  const staff = await requireRole(["admin"]);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 bg-staff-surface">
      <div className="w-full max-w-md flex flex-col items-center text-center gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
            Admin Dashboard
          </h1>
          <h2 className="text-[18px] leading-[24px] font-medium text-staff-text-primary">
            Welcome, {staff.name}
          </h2>
          <p className="text-[14px] leading-[20px] text-staff-text-muted">
            Roles: {staff.roles.join(", ")}
          </p>
        </header>
        <LogoutButton />
      </div>
    </main>
  );
}
