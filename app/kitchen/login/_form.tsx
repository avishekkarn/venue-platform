"use client";

import type { JSX, FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** The server's success response: the staff member's allowed areas and landing route. */
interface LoginResponse {
  data: {
    staff: {
      id: string;
      name: string;
      username: string;
      roles: string[];
    };
    allowedAreas: string[];
    landingRoute: string;
  };
}

/** The server's error response: the standard envelope. */
interface LoginErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]+)/);
  return match && match[1] ? decodeURIComponent(match[1]) : "";
}

export function LoginForm(): JSX.Element {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const csrfToken = getCsrfToken();
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ username, password }),
      });

      const body = (await response.json()) as LoginResponse | LoginErrorResponse;

      if (!response.ok) {
        const errorBody = body as LoginErrorResponse;
        if (errorBody.error?.code === "RATE_LIMITED") {
          setError(
            errorBody.error.message ||
              "Too many login attempts. Please try again later."
          );
        } else {
          setError("Incorrect username or password.");
        }
        setSubmitting(false);
        return;
      }

      const successBody = body as LoginResponse;
      if (
        !successBody.data ||
        !Array.isArray(successBody.data.allowedAreas) ||
        successBody.data.allowedAreas.length === 0
      ) {
        setError("No area available for this account.");
        setSubmitting(false);
        return;
      }

      const target = successBody.data.landingRoute;
      if (typeof target !== "string" || !target.startsWith("/")) {
        setError("No area available for this account.");
        setSubmitting(false);
        return;
      }

      // Hard navigation. The session and csrf_token cookies were set on
      // the login response. A hard navigation (not soft router push) forces
      // the browser to commit those cookies to the jar before the next
      // request, so the middleware sees the new session. Soft navigation
      // fires an RSC fetch too fast and reads the previous session's
      // cookie, causing the "logged in as X but landed on Y's page" bug
      // (7.7.5b.FIX.2 — Phase 7.7.5 manual verification, 2026-11-14).
      window.location.href = target;
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6"
    >
      <Input
        id="username"
        name="username"
        type="text"
        autoComplete="username"
        required
        label="Username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
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
        onChange={(event) => setPassword(event.target.value)}
        disabled={submitting}
      />
      {error ? (
        <p
          role="alert"
          className="text-[13px] leading-[18px] text-status-cancelled"
        >
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={submitting}
      >
        {submitting ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
