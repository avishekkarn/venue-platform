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

export interface Room {
  id: string;
  venueId: string;
  number: string;
  state: RoomState;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoomInput {
  number: string;
  state?: RoomState;
}

export interface RoomRepository {
  findById(venueId: string, id: string): Promise<Result<Room>>;
  findByNumber(venueId: string, number: string): Promise<Result<Room>>;
  listForVenue(venueId: string): Promise<Result<Room[]>>;
  create(venueId: string, input: CreateRoomInput): Promise<Result<Room>>;
  setState(venueId: string, id: string, state: RoomState): Promise<Result<Room>>;
}
