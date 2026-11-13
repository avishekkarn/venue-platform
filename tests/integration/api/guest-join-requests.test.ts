import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as postJoinRequest } from "@/../app/api/guest/join-requests/route";
import { POST as approveJoinRequest } from "@/../app/api/guest/join-requests/[id]/approve/route";
import { POST as declineJoinRequest } from "@/../app/api/guest/join-requests/[id]/decline/route";
import { POST as recoverJoinRequest } from "@/../app/api/guest/join-requests/recover/route";

vi.mock("@/infrastructure/csrf/cookies", async () => {
  const actual = await vi.importActual<typeof import("@/infrastructure/csrf/cookies")>(
    "@/infrastructure/csrf/cookies"
  );
  return {
    ...actual,
    getCsrfCookie: vi.fn(),
  };
});

import { getCsrfCookie } from "@/infrastructure/csrf/cookies";

describe("Guest Join Requests CSRF Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects POST /api/guest/join-requests without X-CSRF-Token header with 403 FORBIDDEN", async () => {
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");
    const request = new NextRequest("http://localhost/api/guest/join-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Alice",
        sessionId: "sess-123",
        deviceId: "dev-123",
      }),
    });
    const response = await postJoinRequest(request);
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error.code).toBe("FORBIDDEN");
    expect(json.error.message).toBe("CSRF token missing or invalid");
  });

  it("rejects POST /api/guest/join-requests/[id]/approve without X-CSRF-Token header with 403 FORBIDDEN", async () => {
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");
    const request = new NextRequest(
      "http://localhost/api/guest/join-requests/req-123/approve",
      {
        method: "POST",
      }
    );
    const response = await approveJoinRequest(request, {
      params: Promise.resolve({ id: "req-123" }),
    });
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error.code).toBe("FORBIDDEN");
    expect(json.error.message).toBe("CSRF token missing or invalid");
  });

  it("rejects POST /api/guest/join-requests/[id]/decline without X-CSRF-Token header with 403 FORBIDDEN", async () => {
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");
    const request = new NextRequest(
      "http://localhost/api/guest/join-requests/req-123/decline",
      {
        method: "POST",
      }
    );
    const response = await declineJoinRequest(request, {
      params: Promise.resolve({ id: "req-123" }),
    });
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error.code).toBe("FORBIDDEN");
    expect(json.error.message).toBe("CSRF token missing or invalid");
  });

  it("rejects POST /api/guest/join-requests/recover without X-CSRF-Token header with 403 FORBIDDEN", async () => {
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");
    const request = new NextRequest(
      "http://localhost/api/guest/join-requests/recover",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hostToken: "host-tok-123",
        }),
      }
    );
    const response = await recoverJoinRequest(request);
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error.code).toBe("FORBIDDEN");
    expect(json.error.message).toBe("CSRF token missing or invalid");
  });
});
