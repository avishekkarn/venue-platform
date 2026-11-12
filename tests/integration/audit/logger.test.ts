import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, rmSync, existsSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  writeAudit,
  auditFilePath,
  actorFromSession,
  type AuditEvent,
} from "@/infrastructure/audit/logger";

/**
 * Integration test for the file-based audit logger (Task 7.7.1).
 *
 * These are integration tests, not unit tests, because the logger's job is
 * to produce a real file on disk. A test that mocks `fs` would prove the
 * call shape, not the disk state; the whole point of 7.7.1 is the disk state.
 *
 * Isolation: `AUDIT_LOG_DIR` is set to a fresh `mkdtempSync` directory for
 * every test. The real `./logs/audit/` is never touched. This is the same
 * isolation discipline as the DB transaction harness (`withTransaction`) in
 * `tests/integration/setup.ts`, translated to the filesystem.
 */

describe("Audit logger — file-based JSON-lines (7.7.1)", () => {
  let testDir: string;
  const originalEnv = process.env["AUDIT_LOG_DIR"];

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "audit-test-"));
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

  it("writes exactly one JSON line, one file per UTC day", () => {
    const now = new Date("2026-11-12T14:30:00.000Z");
    const event: AuditEvent = {
      timestamp: now.toISOString(),
      actorType: "staff",
      actorId: "staff-1",
      actorRole: "MANAGER",
      venueId: "venue-1",
      route: "/api/admin/qr/generate",
      method: "POST",
      status: 201,
      latencyMs: 12,
      ip: "127.0.0.1",
    };

    writeAudit(event);

    const filePath = auditFilePath(now);
    expect(existsSync(filePath)).toBe(true);

    const contents = readFileSync(filePath, "utf8");
    const lines = contents.split("\n").filter((l) => l.length > 0);
    expect(lines).toHaveLength(1);

    const parsed = JSON.parse(lines[0] as string) as AuditEvent;
    expect(parsed).toEqual(event);
  });

  it("appends a second line to the same file for the same UTC day", () => {
    const now = new Date("2026-11-12T09:00:00.000Z");
    const baseEvent: Omit<AuditEvent, "status"> = {
      timestamp: now.toISOString(),
      actorType: "staff",
      actorId: "staff-1",
      actorRole: "MANAGER",
      venueId: "venue-1",
      route: "/api/admin/qr/generate",
      method: "POST",
      latencyMs: 12,
      ip: "127.0.0.1",
    };

    writeAudit({ ...baseEvent, status: 201 });
    writeAudit({ ...baseEvent, status: 400 });

    const lines = readFileSync(auditFilePath(now), "utf8")
      .split("\n")
      .filter((l) => l.length > 0);
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0] as string).status).toBe(201);
    expect(JSON.parse(lines[1] as string).status).toBe(400);
  });

  it("writes to a different file for a different UTC day", () => {
    const day1 = new Date("2026-11-12T23:59:59.000Z");
    const day2 = new Date("2026-11-13T00:00:01.000Z");
    const baseEvent: Omit<AuditEvent, "timestamp"> = {
      actorType: "staff",
      actorId: "staff-1",
      actorRole: "MANAGER",
      venueId: "venue-1",
      route: "/api/admin/qr/generate",
      method: "POST",
      status: 201,
      latencyMs: 12,
      ip: null,
    };

    writeAudit({ ...baseEvent, timestamp: day1.toISOString() });
    writeAudit({ ...baseEvent, timestamp: day2.toISOString() });

    const file1 = auditFilePath(day1);
    const file2 = auditFilePath(day2);
    expect(file1).not.toBe(file2);
    expect(existsSync(file1)).toBe(true);
    expect(existsSync(file2)).toBe(true);
    expect(readFileSync(file1, "utf8").trim().length > 0).toBe(true);
    expect(readFileSync(file2, "utf8").trim().length > 0).toBe(true);
  });

  it("does not throw when the audit directory cannot be created", () => {
    // Force an impossible directory: a path that starts with a NUL byte.
    process.env["AUDIT_LOG_DIR"] = "\u0000impossible";
    const event: AuditEvent = {
      timestamp: new Date("2026-11-12T10:00:00.000Z").toISOString(),
      actorType: "anonymous",
      actorId: null,
      actorRole: null,
      venueId: null,
      route: "/api/anything",
      method: "GET",
      status: 200,
      latencyMs: 5,
      ip: null,
    };

    expect(() => writeAudit(event)).not.toThrow();
  });

  it("actorFromSession returns the staff actor when the resolver returns one", async () => {
    const actor = await actorFromSession(async () => ({
      actorId: "staff-1",
      actorRole: "MANAGER",
      venueId: "venue-1",
    }));
    expect(actor).toEqual({
      actorType: "staff",
      actorId: "staff-1",
      actorRole: "MANAGER",
      venueId: "venue-1",
    });
  });

  it("actorFromSession returns the anonymous actor when the resolver returns null", async () => {
    const actor = await actorFromSession(async () => null);
    expect(actor).toEqual({
      actorType: "anonymous",
      actorId: null,
      actorRole: null,
      venueId: null,
    });
  });
});

