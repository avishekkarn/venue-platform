/**
 * The Prisma database client — the single instance for the entire application.
 *
 * Rules:
 * - This file is the only place PrismaClient is instantiated.
 * - This file is the only place the database client is exported.
 * - This file may only be imported inside the infrastructure layer
 *   (src/infrastructure/). Importing it in a page, a component, or a domain
 *   function is forbidden (SYSTEM.md §2, BUILD.md §7.3).
 *
 * Driver Adapter (Prisma 7):
 *   Prisma 7 requires a driver adapter for direct database connections.
 *   We use @prisma/adapter-pg with pg Pool to connect directly to PostgreSQL.
 *
 * The global singleton pattern (dev only):
 *   In development, Next.js hot-reloads modules when code changes. Without the
 *   global singleton, each reload creates a new PrismaClient and Pool instance,
 *   which quickly exhausts the database's connection pool. The global pattern keeps
 *   one instance alive across reloads in development while creating a clean
 *   instance in production (where there are no reloads).
 *
 * Reference: SYSTEM.md §2 (infrastructure layer), BUILD.md §7.3 (one client).
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

/**
 * Resolves the production guard for the audit connection.
 *
 * In production RUNTIME, DATABASE_URL MUST contain `sslmode=require`. A
 * production process that can reach the database over plaintext is a
 * security incident waiting to happen. The guard runs at module load, so
 * a misconfigured deployment refuses to boot rather than serving requests
 * over a plaintext connection.
 *
 * The guard is intentionally skipped during `next build`. Next.js CLI sets
 * `NODE_ENV=production` and `NEXT_PHASE="phase-production-build"` while it
 * imports page and route modules to collect their config. Without the
 * NEXT_PHASE skip, a developer's local build against a plaintext `.env.local`
 * would fail even though the build is not the production runtime. The
 * production runtime is `next start` (or the deployed Node process), where
 * NEXT_PHASE is unset — the guard fires there, exactly as intended.
 *
 * Development (`next dev`) is exempt because NODE_ENV !== "production".
 * Test (`NODE_ENV=test` or unset) is exempt for the same reason.
 *
 * Reference: SYSTEM.md §15.4.1 (production DB user and SSL requirement),
 * BUILD.md §7.4 (security rules), ROADMAP.md §11 (Task 7.7.2).
 */
function assertProductionSsl(url: string | undefined): void {
  if (process.env["NODE_ENV"] !== "production") return;
  if (process.env["NEXT_PHASE"] === "phase-production-build") return;
  if (!url) {
    throw new Error(
      "[db] DATABASE_URL is required in production but is not set."
    );
  }
  if (!url.includes("sslmode=require")) {
    throw new Error(
      "[db] DATABASE_URL must include sslmode=require in production. " +
        "A production process must not connect to PostgreSQL over plaintext. " +
        "See docs/SYSTEM.md §15.4.1 and .env.production.example."
    );
  }
}

/**
 * Resolves the pg.Pool connection limit.
 *
 * Per D-15.4 (up to 20 staff logged in at once), the venue's staff count
 * sets the practical ceiling on concurrent DB work. A pool of 20 is a safe
 * default. A malformed DB_POOL_MAX falls back to 20 with a one-time
 * server-side log — a broken environment variable must not take the venue
 * offline.
 */
function readPoolMax(): number {
  const DEFAULT_POOL_MAX = 20;
  const raw = process.env["DB_POOL_MAX"];
  if (!raw) return DEFAULT_POOL_MAX;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    console.warn(
      `[db] DB_POOL_MAX="${raw}" is not a positive integer; falling back to ${DEFAULT_POOL_MAX}.`
    );
    return DEFAULT_POOL_MAX;
  }
  return parsed;
}

const connectionString = process.env["DATABASE_URL"];
assertProductionSsl(connectionString);

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    max: readPoolMax(),
  });
const adapter = new PrismaPg(pool);

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env["NODE_ENV"] === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
