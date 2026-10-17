import type { JSX } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ForbiddenPage(): JSX.Element {
  return (
    <div
      data-world="staff"
      className="flex items-center justify-center px-4 min-h-dvh bg-staff-surface"
    >
      <main className="w-full max-w-sm flex flex-col gap-6 text-center">
        <header className="flex flex-col gap-2">
          <h1 className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
            403 — Forbidden
          </h1>
          <p className="text-[14px] leading-[20px] text-staff-text-muted">
            You do not have permission to access this area.
          </p>
        </header>
        <div>
          <Link
            href="/staff/login"
            className={buttonVariants({ variant: "secondary", size: "md" })}
          >
            Back to Sign In
          </Link>
        </div>
      </main>
    </div>
  );
}
