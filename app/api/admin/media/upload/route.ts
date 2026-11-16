/**
 * POST /api/admin/media/upload — process and store a catalog photo.
 *
 * Takes a multipart/form-data upload with a single "file" field, passes
 * it through sharp to convert to an 800px WebP (quality 80), writes the
 * result to public/uploads/catalog/{uuid}.webp, computes a 16px blur
 * placeholder data URL, and returns { data: { photoUrl, photoBlurData } }.
 *
 * Guarded by:
 *   - withAudit(resolvers, meta, withCsrf(routeHandler)) — audit-outer, CSRF-inner
 *     (D-20.1) so CSRF rejections are audited.
 *   - Session cookie (admin-only: MANAGER or OWNER; LEADER -> 403).
 *   - File size <= 5MB.
 *   - MIME in [image/jpeg, image/png, image/webp].
 *
 * Reference: DECISIONS.md D-20.1, D-21.1, D-22.1; SYSTEM.md §12.5;
 * PRODUCT.md §6.2, §8.9a; DESIGN.md §4.9.2, §4.10.8, §4.10.9.
 */

import { NextResponse, type NextRequest } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession } from "@/infrastructure/auth/session";
import { getVenueSlug } from "@/infrastructure/config/venue";
import { canAccess } from "@/domain/auth/can-access";
import { StaffState } from "@/domain/auth/staff.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import {
  withAudit,
  type AuditedRouteHandler,
  type AuditMeta,
} from "@/infrastructure/audit/with-audit";
import type { ActorResolvers } from "@/infrastructure/audit/logger";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "catalog");

const routeHandler: AuditedRouteHandler = async (request: NextRequest) => {
  const db = testDbClient ?? prisma;

  // 1. Session check
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

  // 2. Resolve venue
  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(getVenueSlug());
  if (!venueResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Venue not configured" } },
      { status: 500 }
    );
  }
  const venue = venueResult.value;

  // 3. Resolve staff & check role
  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(
    venue.id,
    session.staffMemberId
  );
  if (!staffResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "Staff not found" } },
      { status: 401 }
    );
  }
  const staff = staffResult.value;
  if (staff.state === StaffState.DEACTIVATED) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "Staff deactivated" } },
      { status: 401 }
    );
  }
  if (!canAccess(staff.roles, "admin")) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.FORBIDDEN, message: "Forbidden" } },
      { status: 403 }
    );
  }

  // 4. Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid form data" } },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || typeof file === "string" || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "File is required" } },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: `Invalid file type. Allowed: ${Array.from(ALLOWED_MIME).join(", ")}`,
        },
      },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "File exceeds 5MB limit",
        },
      },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "File exceeds 5MB limit",
        },
      },
      { status: 400 }
    );
  }

  // 5. Image processing via sharp (D-22.1)
  await mkdir(UPLOAD_DIR, { recursive: true });

  const id = randomUUID();
  const filename = `${id}.webp`;
  const filePath = join(UPLOAD_DIR, filename);

  let webpBuffer: Buffer;
  let blurBuffer: Buffer;
  try {
    webpBuffer = await sharp(buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    blurBuffer = await sharp(buffer)
      .resize({ width: 16 })
      .webp({ quality: 50 })
      .toBuffer();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "Failed to process image file",
        },
      },
      { status: 400 }
    );
  }

  await writeFile(filePath, webpBuffer);

  const photoBlurData = `data:image/webp;base64,${blurBuffer.toString("base64")}`;
  const photoUrl = `/uploads/catalog/${filename}`;

  return NextResponse.json(
    {
      data: {
        photoUrl,
        photoBlurData,
      },
    },
    { status: 200 }
  );
};

const meta: AuditMeta = {
  route: "/api/admin/media/upload",
  method: "POST",
};

const resolvers: ActorResolvers = {
  resolveStaff: async () => {
    const db = testDbClient ?? prisma;
    const token = await getSessionCookie();
    if (!token) return null;
    const session = await validateSession(db, token);
    if (!session) return null;
    const venueRepo = createPrismaVenueRepository(db);
    const venueResult = await venueRepo.findBySlug(getVenueSlug());
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
    return null;
  },
};

export const POST = withAudit(resolvers, meta, withCsrf(routeHandler));
