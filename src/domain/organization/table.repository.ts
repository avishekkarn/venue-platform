/**
 * Table repository port.
 *
 * Defines the contract for reading and writing table entities.
 * Pure domain interface — uses domain types only, never imports @prisma/client,
 * never names the database or SQL.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §4 (organization module),
 * SYSTEM.md §11.1 (the Table entity), DECISIONS.md D-10.2 (venue isolation).
 */

import { type Result } from "@/domain/shared/result";

export enum TableState {
  FREE = "FREE",
  OCCUPIED = "OCCUPIED",
  OUT_OF_SERVICE = "OUT_OF_SERVICE",
}

export interface Table {
  id: string;
  venueId: string;
  number: string;
  state: TableState;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTableInput {
  number: string;
  state?: TableState;
}

export interface TableRepository {
  findById(venueId: string, id: string): Promise<Result<Table>>;
  findByNumber(venueId: string, number: string): Promise<Result<Table>>;
  listForVenue(venueId: string): Promise<Result<Table[]>>;
  create(venueId: string, input: CreateTableInput): Promise<Result<Table>>;
  setState(venueId: string, id: string, state: TableState): Promise<Result<Table>>;
}
