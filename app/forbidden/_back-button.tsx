"use client";

import type { JSX } from "react";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";

export function BackButton(): JSX.Element {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={buttonVariants({ variant: "secondary", size: "md" })}
    >
      Back
    </button>
  );
}

