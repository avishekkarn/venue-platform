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

const connectionString = process.env["DATABASE_URL"];

const pool = globalForPrisma.pool ?? new Pool({ connectionString });
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
