"use client";

import { useEffect, type JSX } from "react";

export function PrintTrigger({ shouldPrint }: { shouldPrint: boolean }): JSX.Element | null {
  useEffect(() => {
    if (!shouldPrint) return undefined;

    let timer: NodeJS.Timeout | undefined;

    const handlePrint = (): void => {
      timer = setTimeout(() => {
        window.print();
      }, 800);
    };

    if (document.readyState === "complete") {
      handlePrint();
    } else {
      window.addEventListener("load", handlePrint);
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("load", handlePrint);
    };
  }, [shouldPrint]);

  return null;
}
