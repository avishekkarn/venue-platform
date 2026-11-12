/**
 * GET /api/admin/audit/export — download every audit log file as one ZIP.
 *
 * Phase 7.7.1b. The route is:
 *   - admin-only (MANAGER or OWNER; LEADER and every focused role -> 403),
 *   - audited itself (an admin downloading the audit log is an auditable
 *     event per WIRING.md W-0021 — that is why the handler is wrapped),
 *   - streamed (the ZIP is assembled on the fly; a fresh install with no
 *     audit files returns an empty ZIP, not a 404).
 *
 * Uses `archiver@^7.0.1` (default export). `archiver@8` changed the API
 * (named `ZipArchive` class, no default export); this route pins to 7.
 *
 * Reference: ROADMAP.md §11 (Milestone 7.7.1b), WIRING.md W-0021,
 * SYSTEM.md §12.5 (the canonical API surface), SYSTEM.md §15.4, SYSTEM.md §16.3.
 */

import { NextResponse } from "next/server";
import archiver from "archiver";
import { PassThrough, Readable } from "node:stream";
import { createReadStream } from "node:fs";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession } from "@/infrastructure/auth/session";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { canAccess } from "@/domain/auth/can-access";
import { StaffState } from "@/domain/auth/staff.repository";
import { listAuditFiles } from "@/infrastructure/audit/collect";
import {
  withAudit,
  type AuditedRouteHandler,
  type AuditMeta,
} from "@/infrastructure/audit/with-audit";
import type { ActorResolvers } from "@/infrastructure/audit/logger";
import { DomainErrorCode } from "@/domain/shared/result";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const meta: AuditMeta = {
  route: "/api/admin/audit/export",
  method: "GET",
};

const routeHandler: AuditedRouteHandler = async () => {
  const db = testDbClient ?? prisma;

  // 1. Auth.
  const sessionToken = await getSessionCookie();
  if (!sessionToken) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }

  const session = await validateSession(db, sessionToken);
  if (!session) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }

  // 2. Venue.
  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(
    process.env["VENUE_SLUG"] ?? "juniper-house"
  );
  if (!venueResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Venue not configured" } },
      { status: 500 }
    );
  }
  const venue = venueResult.value;

  // 3. Staff + role (MANAGER or OWNER only — canAccess(roles, "admin")
  //    returns true for those two and false for LEADER per D-18.2).
  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }
  const staff = staffResult.value;
  if (staff.state === StaffState.DEACTIVATED) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }
  if (!canAccess(staff.roles, "admin")) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" } },
      { status: 403 }
    );
  }

  // 4. Enumerate audit files. Empty is a legitimate state (fresh install).
  const files = listAuditFiles();

  // 5. Assemble the ZIP. `archiver` streams; `PassThrough` bridges it to a
  //    Readable the Response can consume. The response is returned while
  //    the archive is still being built — that is what "streaming" means.
  const archive = archiver("zip", { zlib: { level: 9 } });
  const bridge = new PassThrough();

  archive.on("error", (err: Error) => {
    console.error("[audit/export] archiver error", err);
    bridge.destroy(err);
  });

  archive.pipe(bridge);

  for (const file of files) {
    archive.append(createReadStream(file.path), { name: file.name });
  }
  void archive.finalize();

  // 6. Return the response.
  const now = new Date();
  const stamp =
    `${now.getUTCFullYear()}` +
    `-${String(now.getUTCMonth() + 1).padStart(2, "0")}` +
    `-${String(now.getUTCDate()).padStart(2, "0")}`;
  return new NextResponse(Readable.toWeb(bridge) as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="audit-${stamp}.zip"`,
      "Cache-Control": "no-store",
    },
  });
};

const resolvers: ActorResolvers = {
  resolveStaff: async () => {
    const db = testDbClient ?? prisma;
    const token = await getSessionCookie();
    if (!token) return null;
    const session = await validateSession(db, token);
    if (!session) return null;
    const venueRepo = createPrismaVenueRepository(db);
    const venueResult = await venueRepo.findBySlug(
      process.env["VENUE_SLUG"] ?? "juniper-house"
    );
    if (!venueResult.ok) return null;
    const staffRepo = createPrismaStaffRepository(db);
    const staffResult = await staffRepo.findById(
      venueResult.value.id,
      session.staffMemberId
    );
    if (!staffResult.ok) return null;
    const staff = staffResult.value;
    if (staff.state === StaffState.DEACTIVATED) return null;
    return {
      actorId: staff.id,
      actorRole: staff.roles[0] ?? "UNKNOWN",
      venueId: venueResult.value.id,
    };
  },
  resolveGuest: async () => {
    const db = testDbClient ?? prisma;
    const token = await getGuestCookie();
    if (!token) return null;
    const sessionRepo = createPrismaGuestSessionRepository(db);
    const sessionResult = await sessionRepo.findByToken(token);
    // findByToken returns Result<GuestSession | null>: `ok` is true when the
    // query succeeded, `value` is null when no row matched. Both guards are
    // required — the second is the F2 fix from the prior blocked session.
    if (!sessionResult.ok) return null;
    if (!sessionResult.value) return null;
    const session = sessionResult.value;
    if (session.endedAt) return null;
    return {
      actorId: session.id,
      venueId: session.venueId,
    };
  },
};

export const GET = withAudit(resolvers, meta, routeHandler);

