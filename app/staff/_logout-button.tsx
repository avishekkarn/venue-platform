"use client";

import { useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCsrfToken } from "@/lib/csrf-client";

export function LogoutButton(): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout(): Promise<void> {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "X-CSRF-Token": getCsrfToken() },
      });
    } finally {
      router.push("/staff/login");
    }
  }

  return (
    <Button
      variant="secondary"
      size="md"
      loading={loading}
      onClick={handleLogout}
    >
      Sign Out
    </Button>
  );
}
