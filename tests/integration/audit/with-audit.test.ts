import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, rmSync, existsSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { NextRequest, NextResponse } from "next/server";
import {
  auditFilePath,
  type AuditEvent,
} from "@/infrastructure/audit/logger";
import {
  withAudit,
  type AuditedRouteHandler,
} from "@/infrastructure/audit/with-audit";

/**
 * Integration test for the withAudit wrapper (Task 7.7.1a).
 *
 * The wrapper is proven in isolation here: the "route" it wraps is a
 * synthetic handler defined inside this file, not a real route. That way,
 * if the wrapper has a bug, the failure is caught before any working route
 * depends on it. This is the same discipline D-3.12 uses for the DB
 * transaction harness (`harness.test.ts`) and 6.1.0.B uses for the order
 * transitions table.
 *
 * Every test uses a fresh `mkdtempSync` directory via `AUDIT_LOG_DIR`, so
 * the real `./logs/audit/` is never touched.
 */

describe("withAudit — the wrapper (7.7.1a)", () => {
  let testDir: string;
  const originalEnv = process.env["AUDIT_LOG_DIR"];

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "audit-wrapper-test-"));
    process.env["AUDIT_LOG_DIR"] = testDir;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env["AUDIT_LOG_DIR"];
    } else {
      process.env["AUDIT_LOG_DIR"] = originalEnv;
    }
    rmSync(testDir, { recursive: true, force: true });
  });

  function readLines(now: Date = new Date()): AuditEvent[] {
    const filePath = auditFilePath(now);
    if (!existsSync(filePath)) return [];
    return readFileSync(filePath, "utf8")
      .split("\n")
      .filter((l) => l.length > 0)
      .map((l) => JSON.parse(l) as AuditEvent);
  }

  // ---------- Helpers for the synthetic route and the resolvers ----------

  function makeRequest(
    url: string,
    method: string = "POST",
    body?: unknown,
    headers?: Record<string, string>
  ): NextRequest {
    const init: ConstructorParameters<typeof NextRequest>[1] = { method };
    if (body !== undefined) {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(body);
    }
    if (headers !== undefined) {
      init.headers = { ...(init.headers as Record<string, string> | undefined), ...headers };
    }
    return new NextRequest(url, init);
  }

  // ---------- The wrapper preserves the handler's behaviour ----------

  it("returns the handler's response unchanged (status + body)", async () => {
    const handler: AuditedRouteHandler = async () =>
      NextResponse.json({ data: { ok: true } }, { status: 201 });

    const wrapped = withAudit(
      {
        resolveStaff: async () => null,
        resolveGuest: async () => null,
      },
      { route: "/api/test/synthetic", method: "POST" },
      handler
    );

    const response = await wrapped(makeRequest("http://localhost/api/test/synthetic"));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({ data: { ok: true } });
  });

  it("returns the handler's error response unchanged (status + body)", async () => {
    const handler: AuditedRouteHandler = async () =>
      NextResponse.json(
        { error: { code: "VALIDATION_FAILED", message: "bad" } },
        { status: 400 }
      );

    const wrapped = withAudit(
      {
        resolveStaff: async () => null,
        resolveGuest: async () => null,
      },
      { route: "/api/test/synthetic", method: "POST" },
      handler
    );

    const response = await wrapped(makeRequest("http://localhost/api/test/synthetic"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: { code: "VALIDATION_FAILED", message: "bad" } });
  });

  it("writes an audit line with the correct actor, route, method, status and non-negative latency", async () => {
    const handler: AuditedRouteHandler = async () =>
      NextResponse.json({ data: { ok: true } }, { status: 200 });

    const wrapped = withAudit(
      {
        resolveStaff: async () => ({
          actorId: "staff-1",
          actorRole: "MANAGER",
          venueId: "venue-1",
        }),
        resolveGuest: async () => null,
      },
      { route: "/api/test/synthetic", method: "POST" },
      handler
    );

    await wrapped(makeRequest("http://localhost/api/test/synthetic"));

    const lines = readLines();
    expect(lines).toHaveLength(1);
    const line = lines[0];
    expect(line).toBeDefined();
    if (!line) return;
    expect(line.actorType).toBe("staff");
    expect(line.actorId).toBe("staff-1");
    expect(line.actorRole).toBe("MANAGER");
    expect(line.venueId).toBe("venue-1");
    expect(line.route).toBe("/api/test/synthetic");
    expect(line.method).toBe("POST");
    expect(line.status).toBe(200);
    expect(line.latencyMs).toBeGreaterThanOrEqual(0);
    expect(line.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("writes an anonymous line when both resolvers return null", async () => {
    const handler: AuditedRouteHandler = async () =>
      NextResponse.json({ data: {} }, { status: 200 });

    const wrapped = withAudit(
      {
        resolveStaff: async () => null,
        resolveGuest: async () => null,
      },
      { route: "/api/test/synthetic", method: "GET" },
      handler
    );

    await wrapped(makeRequest("http://localhost/api/test/synthetic", "GET"));

    const lines = readLines();
    expect(lines).toHaveLength(1);
    const line = lines[0];
    expect(line).toBeDefined();
    if (!line) return;
    expect(line.actorType).toBe("anonymous");
    expect(line.actorId).toBeNull();
    expect(line.actorRole).toBeNull();
    expect(line.venueId).toBeNull();
  });

  // ---------- The wrapper's failure discipline ----------

  it("returns a 500 and still logs a line when the handler throws", async () => {
    const handler: AuditedRouteHandler = async () => {
      throw new Error("synthetic handler failure");
    };

    const wrapped = withAudit(
      {
        resolveStaff: async () => null,
        resolveGuest: async () => null,
      },
      { route: "/api/test/synthetic", method: "POST" },
      handler
    );

    const response = await wrapped(makeRequest("http://localhost/api/test/synthetic"));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: "INTERNAL",
        message: "An unexpected error occurred",
      },
    });

    // The audit line for the 500 is still written.
    const lines = readLines();
    expect(lines).toHaveLength(1);
    const line = lines[0];
    expect(line).toBeDefined();
    if (!line) return;
    expect(line.status).toBe(500);
    expect(line.actorType).toBe("anonymous");
  });

  it("calls the handler exactly once and calls both resolvers", async () => {
    let handlerCalls = 0;
    let staffCalls = 0;
    let guestCalls = 0;

    const handler: AuditedRouteHandler = async () => {
      handlerCalls += 1;
      return NextResponse.json({ data: {} }, { status: 200 });
    };

    const wrapped = withAudit(
      {
        resolveStaff: async () => {
          staffCalls += 1;
          return null;
        },
        resolveGuest: async () => {
          guestCalls += 1;
          return null;
        },
      },
      { route: "/api/test/synthetic", method: "POST" },
      handler
    );

    await wrapped(makeRequest("http://localhost/api/test/synthetic"));

    expect(handlerCalls).toBe(1);
    expect(staffCalls).toBe(1);
    // Guest is only called when staff returns null.
    expect(guestCalls).toBe(1);
  });

  it("does not call resolveGuest when resolveStaff returns a non-null actor", async () => {
    let guestCalls = 0;

    const handler: AuditedRouteHandler = async () =>
      NextResponse.json({ data: {} }, { status: 200 });

    const wrapped = withAudit(
      {
        resolveStaff: async () => ({
          actorId: "staff-1",
          actorRole: "MANAGER",
          venueId: "venue-1",
        }),
        resolveGuest: async () => {
          guestCalls += 1;
          return null;
        },
      },
      { route: "/api/test/synthetic", method: "POST" },
      handler
    );

    await wrapped(makeRequest("http://localhost/api/test/synthetic"));
    expect(guestCalls).toBe(0);
  });

  it("populates ip from x-forwarded-for when present (W-0025)", async () => {
    const handler: AuditedRouteHandler = async () =>
      NextResponse.json({ data: {} }, { status: 200 });

    const wrapped = withAudit(
      {
        resolveStaff: async () => null,
        resolveGuest: async () => null,
      },
      { route: "/api/test/synthetic", method: "POST" },
      handler
    );

    await wrapped(
      makeRequest(
        "http://localhost/api/test/synthetic",
        "POST",
        undefined,
        { "x-forwarded-for": "203.0.113.42, 10.0.0.1" }
      )
    );

    const lines = readLines();
    expect(lines).toHaveLength(1);
    const line = lines[0];
    expect(line).toBeDefined();
    if (!line) return;
    expect(line.ip).toBe("203.0.113.42");
  });

  it("records ip: null when neither x-forwarded-for nor x-real-ip is present (W-0025)", async () => {
    const handler: AuditedRouteHandler = async () =>
      NextResponse.json({ data: {} }, { status: 200 });

    const wrapped = withAudit(
      {
        resolveStaff: async () => null,
        resolveGuest: async () => null,
      },
      { route: "/api/test/synthetic", method: "POST" },
      handler
    );

    await wrapped(makeRequest("http://localhost/api/test/synthetic"));

    const lines = readLines();
    expect(lines).toHaveLength(1);
    const line = lines[0];
    expect(line).toBeDefined();
    if (!line) return;
    expect(line.ip).toBeNull();
  });
});

