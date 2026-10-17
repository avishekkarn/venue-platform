/**
 * Password hashing service.
 *
 * Provides functions to hash passwords using Argon2id and to verify
 * plaintext passwords against existing Argon2 hashes.
 *
 * Rules:
 * - Uses the Argon2id variant per DECISIONS.md D-3.9.
 * - Uses library default parameters; parameters are fixed and not toggled via config.
 * - Infrastructure layer only: does not import domain, React, or @prisma/client.
 * - Plaintext passwords are never stored, logged, or transmitted (SYSTEM.md §15.3).
 *
 * Reference: DECISIONS.md D-3.9, SYSTEM.md §15.3, BUILD.md §2, §5, §7.4.
 */

import argon2 from "argon2";

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
