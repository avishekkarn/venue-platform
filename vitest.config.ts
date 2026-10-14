import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for unit tests.
 *
 * Scope: unit tests only — pure functions in src/lib and src/domain with no
 * database and no HTTP. Integration tests (database + API) will use a separate
 * vitest.integration.config.ts that extends this one (Phase 2). End-to-end
 * tests use Playwright and are configured separately.
 *
 * The `@/*` alias mirrors tsconfig.json's "paths" so that test files import
 * the same module specifiers the application code does. Without this, a test
 * that imports `@/lib/utils` would fail to resolve at runtime even though it
 * type-checks, because Vitest does not read tsconfig's paths by default.
 *
 * The `include` pattern is deliberately scoped to tests/unit/lib for now.
 * The tests/unit/ folder already contains empty placeholder files for Phase 2
 * domain tests; widening the pattern before those files have content would
 * make this config's test run fail on missing imports. The task that fills
 * the placeholders widens the pattern in the same commit.
 *
 * Reference: BUILD.md §8.1 (the three levels of tests), ROADMAP.md §4
 * (Milestone 1.4 — shared utilities), DESIGN.md §4.15.7 (enforcement rules).
 */
export default defineConfig({
  test: {
    include: ["tests/unit/lib/**/*.test.ts"],
    environment: "node",
    globals: false,
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});