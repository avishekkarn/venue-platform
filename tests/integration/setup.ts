/**
 * Integration test setup file.
 *
 * Requirements:
 * - Runs against the dedicated test database (TEST_DATABASE_URL from .env.local).
 * - Migrates the test database once before tests run via `prisma migrate deploy`,
 *   and does not run it again during the test execution.
 * - Provides `withTransaction` helper that wraps test operations in a transaction
 *   and rolls back on completion, satisfying PHASE_TESTS.md §4 Step 6:
 *   "Each test opens a transaction against the test database, reads or writes a
 *   real record, and rolls back."
 * - Provides database cleanup utilities to ensure absolute test isolation.
 *
 * Reference: BUILD.md §8.8 (Integration tests), PHASE_TESTS.md §4 Step 6.
 */

import { execSync } from "node:child_process";
import * as dotenv from "dotenv";
import { beforeAll } from "vitest";
import { prisma } from "@/infrastructure/db/client";
import { type Prisma } from "@prisma/client";

// Ensure .env.local variables are loaded for integration tests
dotenv.config({ path: ".env.local" });

if (process.env["TEST_DATABASE_URL"]) {
  process.env["DATABASE_URL"] = process.env["TEST_DATABASE_URL"];
}

let isMigrated = false;

beforeAll(() => {
  if (!isMigrated) {
    // Run migration against test database once
    execSync("pnpm prisma migrate deploy", {
      stdio: "pipe",
      env: {
        ...process.env,
        DATABASE_URL: process.env["TEST_DATABASE_URL"] || process.env["DATABASE_URL"],
      },
    });
    isMigrated = true;
  }
});

/**
 * Executes a test block inside a real Prisma transaction that always rolls back.
 * No data written inside this block persists in the test database.
 */
export async function withTransaction(
  testFn: (tx: Prisma.TransactionClient) => Promise<void>
): Promise<void> {
  const ROLLBACK_SIGNAL = new Error("__ROLLBACK_TEST_TRANSACTION__");
  try {
    await prisma.$transaction(async (tx) => {
      await testFn(tx);
      throw ROLLBACK_SIGNAL;
    });
  } catch (error) {
    if (error !== ROLLBACK_SIGNAL) {
      throw error;
    }
  }
}

/**
 * Truncates all application tables in the test database to ensure a clean state
 * when tests require non-transactional or multiple-transaction testing.
 */
export async function cleanTestDatabase(): Promise<void> {
  const tableNames = [
    "receipts",
    "payment_tickets",
    "request_state_changes",
    "service_requests",
    "order_state_changes",
    "order_items",
    "orders",
    "guest_sessions",
    "modifier_options",
    "modifier_groups",
    "menu_items",
    "menu_categories",
    "staff_sessions",
    "staff_members",
    "qr_tokens",
    "counters",
    "rooms",
    "tables",
    "venue_service_toggles",
    "venue_module_toggles",
    "venues",
  ];

  for (const table of tableNames) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "${table}" CASCADE;`
    );
  }
}
