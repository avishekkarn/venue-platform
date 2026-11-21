/**
 * Room repository port.
 *
 * Defines the contract for reading and writing room entities.
 * Pure domain interface — uses domain types only, never imports @prisma/client,
 * never names the database or SQL.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §4 (organization module),
 * SYSTEM.md §11.1 (the Room entity), DECISIONS.md D-10.2 (venue isolation).
 */

import { type Result } from "@/domain/shared/result";

export enum RoomState {
  OCCUPIED = "OCCUPIED",
  VACANT = "VACANT",
  CLEANING = "CLEANING",
  OUT_OF_SERVICE = "OUT_OF_SERVICE",
}

export { RoomState as RoomStatus };

export interface Room {
  id: string;
  venueId: string;
  categoryId?: string | null;
  number: string;
  state: RoomState;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomCategory {
  id: string;
  venueId: string;
  name: string;
  description: string | null;
  basePrice: string; // Decimal representation as string in NPR
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoomCategoryInput {
  name: string;
  description?: string | null;
  basePrice?: string | number;
  sortOrder?: number;
}

export interface UpdateRoomCategoryInput {
  name?: string;
  description?: string | null;
  basePrice?: string | number;
  sortOrder?: number;
}

export interface RoomView extends Room {
  category: RoomCategory | null;
  activeSession?: {
    id: string;
    startedAt: Date;
    ordersCount: number;
    requestsCount: number;
    roomRate: string;
    totalAmount: string;
    dndActive: boolean;
  } | null;
}

export interface CreateRoomInput {
  number: string;
  categoryId?: string | null;
  state?: RoomState;
}

export interface UpdateRoomInput {
  number?: string;
  categoryId?: string | null;
  state?: RoomState;
}

export interface RoomRepository {
  findById(venueId: string, id: string): Promise<Result<Room>>;
  findByNumber(venueId: string, number: string): Promise<Result<Room>>;
  listForVenue(venueId: string): Promise<Result<Room[]>>;
  listRoomsWithDetails(venueId: string): Promise<Result<RoomView[]>>;
  create(venueId: string, input: CreateRoomInput): Promise<Result<Room>>;
  update(venueId: string, id: string, input: UpdateRoomInput): Promise<Result<Room>>;
  delete(venueId: string, id: string): Promise<Result<void>>;
  setState(venueId: string, id: string, state: RoomState): Promise<Result<Room>>;
  setStatus(venueId: string, roomId: string, status: RoomState): Promise<Result<void>>;
  endSession(venueId: string, id: string): Promise<Result<void>>;

  // Categories
  listCategories(venueId: string): Promise<Result<RoomCategory[]>>;
  findCategoryById(venueId: string, id: string): Promise<Result<RoomCategory>>;
  createCategory(venueId: string, input: CreateRoomCategoryInput): Promise<Result<RoomCategory>>;
  updateCategory(venueId: string, id: string, input: UpdateRoomCategoryInput): Promise<Result<RoomCategory>>;
  deleteCategory(venueId: string, id: string): Promise<Result<void>>;
}
