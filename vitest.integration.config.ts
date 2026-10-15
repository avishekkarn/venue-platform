import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for integration tests.
 *
 * Scope: integration tests against a real PostgreSQL test database.
 * Uses TEST_DATABASE_URL from .env.local if present, otherwise DATABASE_URL.
 * Runs setup file to ensure migrations are deployed once and transactions roll back.
 *
 * Reference: BUILD.md §8.1 (integration tests), PHASE_TESTS.md §4 Step 6.
 */

dotenv.config({ path: ".env.local" });

if (process.env["TEST_DATABASE_URL"]) {
  process.env["DATABASE_URL"] = process.env["TEST_DATABASE_URL"];
}

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["./tests/integration/setup.ts"],
    environment: "node",
    globals: false,
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
    passWithNoTests: true,
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
