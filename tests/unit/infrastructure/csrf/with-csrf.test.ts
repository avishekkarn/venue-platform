import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";
import { CSRF_HEADER_NAME } from "@/infrastructure/csrf/cookies";

// Mock getCsrfCookie from the csrf/cookies module. The wrapper imports it
// directly; mocking the module is the standard pattern in this project
// (pre-read P5: the existing tests mock next/headers, but withCsrf's
// dependency is getCsrfCookie, not next/headers).
const mockGetCsrfCookie = vi.fn<() => Promise<string | null>>();
vi.mock("@/infrastructure/csrf/cookies", async () => {
  const actual = await vi.importActual<typeof import("@/infrastructure/csrf/cookies")>(
    "@/infrastructure/csrf/cookies"
  );
  return {
    ...actual,
    getCsrfCookie: () => mockGetCsrfCookie(),
  };
});

// Mock the withAudit wrapper for the two composition tests. The mock is a
// pass-through that returns the wrapped handler unchanged; the test proves
// that the composition runs the CSRF check before the inner handler by
// asserting the audit spy sees a 403.
const mockAuditSpy = vi.fn();
vi.mock("@/infrastructure/audit/with-audit", () => ({
  withAudit: (_resolvers: unknown, _meta: unknown, handler: unknown) => {
    // Return a wrapper that runs the handler, then calls the spy with the
    // handler's response status. This is the minimum shape needed to prove
    // that withAudit sees the CSRF rejection's 403.
    return async (request: NextRequest) => {
      const response = await (handler as (r: NextRequest) => Promise<NextResponse>)(request);
      mockAuditSpy(response.status);
      return response;
    };
  },
}));

import { withAudit } from "@/infrastructure/audit/with-audit";

describe("withCsrf — the wrapper (7.7.4a)", () => {
  const validToken = "abc-123-def-456";
  const dummyResolvers = {} as never;
  const dummyMeta = { route: "/api/test", method: "POST" };

  function makeRequest(headerValue: string | null): NextRequest {
    const headers: Record<string, string> = {};
    if (headerValue !== null) {
      headers[CSRF_HEADER_NAME] = headerValue;
    }
    return new NextRequest("http://localhost/api/test", {
      method: "POST",
      headers,
    });
  }

  const okHandler = async () =>
    NextResponse.json({ data: { ok: true } }, { status: 200 });

  beforeEach(() => {
    mockGetCsrfCookie.mockReset();
    mockAuditSpy.mockReset();
  });

  it("calls the handler when the header matches the cookie", async () => {
    mockGetCsrfCookie.mockResolvedValue(validToken);
    const wrapped = withCsrf(okHandler);
    const response = await wrapped(makeRequest(validToken));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ data: { ok: true } });
  });

  it("returns 403 when the header does not match the cookie", async () => {
    mockGetCsrfCookie.mockResolvedValue(validToken);
    const wrapped = withCsrf(okHandler);
    const response = await wrapped(makeRequest("different-token"));
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 403 when the header is absent", async () => {
    mockGetCsrfCookie.mockResolvedValue(validToken);
    const wrapped = withCsrf(okHandler);
    const response = await wrapped(makeRequest(null));
    expect(response.status).toBe(403);
  });

  it("returns 403 when the cookie is absent", async () => {
    mockGetCsrfCookie.mockResolvedValue(null);
    const wrapped = withCsrf(okHandler);
    const response = await wrapped(makeRequest(validToken));
    expect(response.status).toBe(403);
  });

  it("returns 403 when both are absent", async () => {
    mockGetCsrfCookie.mockResolvedValue(null);
    const wrapped = withCsrf(okHandler);
    const response = await wrapped(makeRequest(null));
    expect(response.status).toBe(403);
  });

  it("does not call the handler when the CSRF check fails", async () => {
    let handlerCalls = 0;
    mockGetCsrfCookie.mockResolvedValue(validToken);
    const countingHandler = async () => {
      handlerCalls += 1;
      return NextResponse.json({ data: {} }, { status: 200 });
    };
    const wrapped = withCsrf(countingHandler);
    await wrapped(makeRequest("wrong-token"));
    expect(handlerCalls).toBe(0);
  });

  // ---------- The two composition tests (the load-bearing pair) ----------

  it("composition with withAudit: a CSRF rejection produces an audit line with status 403", async () => {
    mockGetCsrfCookie.mockResolvedValue(validToken);
    const composed = withAudit(dummyResolvers, dummyMeta, withCsrf(okHandler));
    const response = await composed(makeRequest("wrong-token"));
    expect(response.status).toBe(403);
    // The audit spy must have seen the 403 status.
    expect(mockAuditSpy).toHaveBeenCalledOnce();
    expect(mockAuditSpy).toHaveBeenCalledWith(403);
  });

  it("composition with withAudit: a successful request produces an audit line with the handler's status", async () => {
    mockGetCsrfCookie.mockResolvedValue(validToken);
    const composed = withAudit(dummyResolvers, dummyMeta, withCsrf(okHandler));
    const response = await composed(makeRequest(validToken));
    expect(response.status).toBe(200);
    expect(mockAuditSpy).toHaveBeenCalledOnce();
    expect(mockAuditSpy).toHaveBeenCalledWith(200);
  });
});
