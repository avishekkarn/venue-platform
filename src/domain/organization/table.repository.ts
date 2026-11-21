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

export { TableState as TableStatus };

export interface Table {
  id: string;
  venueId: string;
  categoryId?: string | null;
  number: string;
  state: TableState;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableCategory {
  id: string;
  venueId: string;
  name: string;
  description: string | null;
  isReserved: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTableCategoryInput {
  name: string;
  description?: string | null;
  isReserved?: boolean;
  sortOrder?: number;
}

export interface UpdateTableCategoryInput {
  name?: string;
  description?: string | null;
  isReserved?: boolean;
  sortOrder?: number;
}

export interface TableView extends Table {
  category: TableCategory | null;
  activeSession?: {
    id: string;
    startedAt: Date;
    ordersCount: number;
    totalAmount: string;
  } | null;
}

export interface CreateTableInput {
  number: string;
  categoryId?: string | null;
  state?: TableState;
}

export interface UpdateTableInput {
  number?: string;
  categoryId?: string | null;
  state?: TableState;
}

export interface TableRepository {
  findById(venueId: string, id: string): Promise<Result<Table>>;
  findByNumber(venueId: string, number: string): Promise<Result<Table>>;
  listForVenue(venueId: string): Promise<Result<Table[]>>;
  listTablesWithDetails(venueId: string): Promise<Result<TableView[]>>;
  create(venueId: string, input: CreateTableInput): Promise<Result<Table>>;
  update(venueId: string, id: string, input: UpdateTableInput): Promise<Result<Table>>;
  delete(venueId: string, id: string): Promise<Result<void>>;
  setState(venueId: string, id: string, state: TableState): Promise<Result<Table>>;
  setStatus(venueId: string, tableId: string, status: TableState): Promise<Result<void>>;
  endSession(venueId: string, id: string): Promise<Result<void>>;

  // Categories
  listCategories(venueId: string): Promise<Result<TableCategory[]>>;
  findCategoryById(venueId: string, id: string): Promise<Result<TableCategory>>;
  createCategory(venueId: string, input: CreateTableCategoryInput): Promise<Result<TableCategory>>;
  updateCategory(venueId: string, id: string, input: UpdateTableCategoryInput): Promise<Result<TableCategory>>;
  deleteCategory(venueId: string, id: string): Promise<Result<void>>;
}
