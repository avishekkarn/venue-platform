import type { JSX } from "react";
import { LoginForm } from "./_form";

export default function AdminLoginPage(): JSX.Element {
  return (
    <main className="flex items-center justify-center px-4 min-h-dvh">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
            Sign In
          </h1>
          <p className="text-[14px] leading-[20px] text-staff-text-muted">
            Manager access
          </p>
        </header>
        <LoginForm />
      </div>
    </main>
  );
}
