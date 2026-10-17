import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/infrastructure/auth/password";

/**
 * Unit tests for the password hashing service.
 *
 * Verifies that hashPassword produces valid Argon2id hash strings,
 * verifyPassword authenticates valid passwords, rejects invalid passwords,
 * salting ensures unique hashes for identical plaintexts, and malformed
 * hashes return false safely without throwing.
 *
 * Reference: DECISIONS.md D-3.9, SYSTEM.md §15.3, BUILD.md §8.8.
 */
describe("Password hashing service", () => {
  it("hashes a plaintext password into an Argon2id hash", async () => {
    const hash = await hashPassword("password123");
    expect(hash).not.toBe("password123");
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("verifies a valid plaintext password against its hash", async () => {
    const hash = await hashPassword("password123");
    expect(await verifyPassword("password123", hash)).toBe(true);
  });

  it("rejects an incorrect plaintext password against a hash", async () => {
    const hash = await hashPassword("password123");
    expect(await verifyPassword("wrongpassword", hash)).toBe(false);
  });

  it("uses random salts so two hashes of the same plaintext differ", async () => {
    const h1 = await hashPassword("same");
    const h2 = await hashPassword("same");
    expect(h1).not.toBe(h2);
    expect(await verifyPassword("same", h1)).toBe(true);
    expect(await verifyPassword("same", h2)).toBe(true);
  });

  it("returns false without throwing when verifying a malformed hash", async () => {
    expect(await verifyPassword("anything", "not-a-real-hash")).toBe(false);
  });
});
