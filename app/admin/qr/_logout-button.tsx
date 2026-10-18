"use client";

import { useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton(): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout(): Promise<void> {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
    }
  }

  return (
    <Button variant="secondary" size="sm" loading={loading} onClick={handleLogout}>
      Sign Out
    </Button>
  );
}
