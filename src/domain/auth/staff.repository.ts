/**
 * Staff repository port.
 *
 * Defines the contract for reading and writing staff member entities.
 * Pure domain interface — uses domain types only, never imports @prisma/client,
 * never names the database or SQL.
 *
 * Employs two shapes:
 * - StaffMember: public shape without credentials, returned by all general reads and writes.
 * - StaffMemberWithCredentials: adds passwordHash, returned only by findByUsername for login verification.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §4 (auth module),
 * SYSTEM.md §7 (role and permission model), SYSTEM.md §11.1 (Staff member entity),
 * SYSTEM.md §15.3 (least privilege for secrets), DECISIONS.md D-3.1 through D-3.8.
 */

import { type Result } from "@/domain/shared/result";

export enum StaffRole {
  OWNER = "OWNER",
  MANAGER = "MANAGER",
  CHEF = "CHEF",
  TABLE_SERVICE = "TABLE_SERVICE",
  ROOM_SERVICE = "ROOM_SERVICE",
  HOUSEKEEPING = "HOUSEKEEPING",
  MAINTENANCE = "MAINTENANCE",
  CONCIERGE = "CONCIERGE",
  LAUNDRY = "LAUNDRY",
  SPA = "SPA",
  FRONT_DESK = "FRONT_DESK",
}

export enum StaffState {
  ACTIVE = "ACTIVE",
  DEACTIVATED = "DEACTIVATED",
}

export interface StaffMember {
  readonly id: string;
  readonly venueId: string;
  readonly name: string;
  readonly username: string;
  readonly roles: readonly StaffRole[];
  readonly state: StaffState;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface StaffMemberWithCredentials extends StaffMember {
  readonly passwordHash: string;
}

export interface CreateStaffInput {
  readonly venueId: string;
  readonly name: string;
  readonly username: string;
  readonly passwordHash: string;
  readonly roles: readonly StaffRole[];
}

export interface ListStaffFilter {
  readonly state?: StaffState;
}

export interface StaffRepository {
  findById(venueId: string, id: string): Promise<Result<StaffMember>>;
  findByUsername(
    venueId: string,
    username: string
  ): Promise<Result<StaffMemberWithCredentials>>;
  listForVenue(
    venueId: string,
    filter?: ListStaffFilter
  ): Promise<Result<StaffMember[]>>;
  create(input: CreateStaffInput): Promise<Result<StaffMember>>;
  updatePasswordHash(
    venueId: string,
    id: string,
    hash: string
  ): Promise<Result<StaffMember>>;
  setState(
    venueId: string,
    id: string,
    state: StaffState
  ): Promise<Result<StaffMember>>;
}
