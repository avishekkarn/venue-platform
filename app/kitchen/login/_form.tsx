"use client";

import { useState, type JSX, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { areaToRoute, AREA_TO_ROUTE } from "../../staff/login/_redirect-map";
import type { Area } from "@/domain/auth/can-access";

const GENERIC_ERROR_MESSAGE = "Incorrect username or password.";

function isArea(value: unknown): value is Area {
  return typeof value === "string" && value in AREA_TO_ROUTE;
}

export function LoginForm(): JSX.Element {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const body: unknown = await response.json();

      if (
        !response.ok ||
        !body ||
        typeof body !== "object" ||
        !("data" in body)
      ) {
        setError(GENERIC_ERROR_MESSAGE);
        setSubmitting(false);
        return;
      }

      const dataObj = (body as { data: unknown }).data;
      if (
        !dataObj ||
        typeof dataObj !== "object" ||
        !("allowedAreas" in dataObj)
      ) {
        setError(GENERIC_ERROR_MESSAGE);
        setSubmitting(false);
        return;
      }

      const allowedAreas = (dataObj as { allowedAreas: unknown }).allowedAreas;
      if (!Array.isArray(allowedAreas) || allowedAreas.length === 0) {
        setError(GENERIC_ERROR_MESSAGE);
        setSubmitting(false);
        return;
      }

      const firstArea = allowedAreas[0];
      if (!isArea(firstArea)) {
        setError(GENERIC_ERROR_MESSAGE);
        setSubmitting(false);
        return;
      }

      const targetRoute = areaToRoute(firstArea);
      router.push(targetRoute);
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Input
        id="username"
        name="username"
        type="text"
        autoComplete="username"
        required
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={submitting}
      />
      <Input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={submitting}
      />
      {error ? (
        <p role="alert" className="text-[13px] leading-[18px] text-status-cancelled">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={submitting}
      >
        Sign In
      </Button>
    </form>
  );
}
