/**
 * Infrastructure-layer error helpers.
 *
 * The infrastructure layer is the only layer that talks to the database.
 * When a database operation fails, the error must be caught here and wrapped
 * into a DomainError before it crosses the boundary into the domain layer.
 * The domain layer and the presentation layer must never see a Prisma error.
 *
 * This file provides helpers to identify common Prisma error codes and turn
 * them into the correct DomainErrorCode. The callers (repositories) use these
 * helpers in their catch blocks.
 *
 * Prisma error codes referenced:
 *   P2000 — The provided value is too long for the column type.
 *   P2001 — The record searched for does not exist.
 *   P2002 — Unique constraint failed.
 *   P2003 — Foreign key constraint failed.
 *   P2025 — Record not found (generic).
 *
 * Reference: SYSTEM.md §5 (the Result contract), §16.4 (database failures).
 */

import { Prisma } from "@prisma/client";

/**
 * Returns true if the error is a Prisma error with the given code.
 * Used by repositories to identify specific database-level failures.
 */
export function isPrismaError(
  error: unknown,
  code: string
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === code
  );
}

/**
 * Returns true if the error is a Prisma unique-constraint violation (P2002).
 * Used by the order repository to detect an idempotency-key collision.
 */
export function isUniqueConstraintError(error: unknown): boolean {
  return isPrismaError(error, "P2002");
}

/**
 * Returns true if the error is a Prisma record-not-found error (P2025).
 * Used by repositories to distinguish "row missing" from other errors.
 */
export function isNotFoundError(error: unknown): boolean {
  return isPrismaError(error, "P2025") || isPrismaError(error, "P2001");
}
