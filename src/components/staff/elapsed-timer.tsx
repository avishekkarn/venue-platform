"use client";

import { useEffect, useState, type JSX } from "react";

export interface ElapsedTimerProps {
  readonly placedAt: Date | string;
}

function computeElapsedMinutes(placedAt: Date | string): number {
  const time = new Date(placedAt).getTime();
  return Math.max(0, Math.floor((Date.now() - time) / 60000));
}

export function ElapsedTimer({ placedAt }: ElapsedTimerProps): JSX.Element {
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(() =>
    computeElapsedMinutes(placedAt)
  );

  useEffect(() => {
    setElapsedMinutes(computeElapsedMinutes(placedAt));

    const id = setInterval(() => {
      setElapsedMinutes(computeElapsedMinutes(placedAt));
    }, 60000);

    return () => clearInterval(id);
  }, [placedAt]);

  return (
    <span className="font-mono text-[14px] text-staff-text-muted">
      {elapsedMinutes} min
    </span>
  );
}

