/**
 * Venue repository port.
 *
 * Defines the contract for reading and writing venue and module data.
 * Pure domain interface — uses domain types only, never imports @prisma/client,
 * never names the database or SQL.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §4 (organization module),
 * SYSTEM.md §5 (Result contract), BUILD.md §7.1 (money/tax as decimal strings).
 */

import { type Result } from "@/domain/shared/result";

export type VenueModule = "TABLE" | "ROOM" | "COUNTER" | "KITCHEN";

export type HotelService =
  | "ROOM_SERVICE_FOOD"
  | "HOUSEKEEPING"
  | "MAINTENANCE"
  | "CONCIERGE"
  | "LAUNDRY"
  | "SPA"
  | "LATE_CHECKOUT"
  | "WAKE_UP_CALL"
  | "DO_NOT_DISTURB";

export interface Venue {
  id: string;
  name: string;
  slug: string;
  brandColor: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  welcomeMessage: string;
  language: string;
  currency: string;
  taxRate: string; // Decimal representation as string
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VenueWithModules extends Venue {
  modules: VenueModule[];
  services: HotelService[];
}

export interface CreateVenueInput {
  name: string;
  slug: string;
  brandColor?: string;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  welcomeMessage?: string;
  language?: string;
  currency?: string;
  taxRate: string;
  isActive?: boolean;
  modules?: VenueModule[];
  services?: HotelService[];
}

export interface VenueRepository {
  /**
   * Reads a venue and its enabled modules and services by its internal ID.
   */
  findById(id: string): Promise<Result<VenueWithModules>>;

  /**
   * Reads a venue and its enabled modules and services by its unique slug.
   */
  findBySlug(slug: string): Promise<Result<VenueWithModules>>;

  /**
   * Persists a new venue with optional initial module and service toggles.
   */
  create(input: CreateVenueInput): Promise<Result<VenueWithModules>>;
}
