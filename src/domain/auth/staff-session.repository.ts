/**
 * Staff session repository port.
 *
 * Defines the contract for reading, writing, and ending staff session entities.
 * Pure domain interface — uses domain types only, never imports @prisma/client,
 * never names the database or SQL.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §4 (auth module),
 * SYSTEM.md §6.3 (the staff session), SYSTEM.md §11.1 (the Staff session entity),
 * DECISIONS.md D-3.2, D-3.3, D-3.4.
 */

import { type Result } from "@/domain/shared/result";

export interface StaffSession {
  readonly id: string;
  readonly staffMemberId: string;
  readonly token: string;
  readonly createdAt: Date;
  readonly expiresAt: Date | null;
  readonly endedAt: Date | null;
}

export interface CreateStaffSessionInput {
  readonly staffMemberId: string;
  readonly token: string;
  readonly expiresAt?: Date | null;
}

export interface StaffSessionRepository {
  findByToken(token: string): Promise<Result<StaffSession>>;
  listActiveForStaff(staffMemberId: string): Promise<Result<StaffSession[]>>;
  create(input: CreateStaffSessionInput): Promise<Result<StaffSession>>;
  endById(id: string): Promise<Result<StaffSession>>;
  endAllForStaff(staffMemberId: string): Promise<Result<number>>;
}
