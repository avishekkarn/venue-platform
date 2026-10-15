/**
 * Port: ServiceRequestRepository
 *
 * Requirements:
 * - Pure domain interface and types; zero @prisma/client imports.
 * - Module is requests (SYSTEM.md §4).
 * - RequestState domain enum: SUBMITTED, ACKNOWLEDGED, IN_PROGRESS, COMPLETED, CANCELLED, DECLINED.
 * - HotelService domain enum (nine services per SYSTEM.md §10.4):
 *   ROOM_SERVICE_FOOD, HOUSEKEEPING, MAINTENANCE, CONCIERGE, LAUNDRY, SPA,
 *   LATE_CHECKOUT, WAKE_UP_CALL, DO_NOT_DISTURB.
 * - details is a domain shape (ServiceRequestDetails), not any.
 * - Methods: create, findById, listForVenue, listForRoom, advanceState, cancel, decline, updateDetails.
 *
 * Reference: SYSTEM.md §2, §4, §10, §11.1, DECISIONS.md D-5.1 to D-5.7, D-10.2.
 */

import { type Result } from "@/domain/shared/result";

export enum RequestState {
  SUBMITTED = "SUBMITTED",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  DECLINED = "DECLINED",
}

export enum HotelService {
  ROOM_SERVICE_FOOD = "ROOM_SERVICE_FOOD",
  HOUSEKEEPING = "HOUSEKEEPING",
  MAINTENANCE = "MAINTENANCE",
  CONCIERGE = "CONCIERGE",
  LAUNDRY = "LAUNDRY",
  SPA = "SPA",
  LATE_CHECKOUT = "LATE_CHECKOUT",
  WAKE_UP_CALL = "WAKE_UP_CALL",
  DO_NOT_DISTURB = "DO_NOT_DISTURB",
}

export type ServiceRequestDetails = Record<
  string,
  string | number | boolean | null | string[]
>;

export interface RequestStateChange {
  readonly id: string;
  readonly requestId: string;
  readonly state: RequestState;
  readonly staffMemberId: string | null;
  readonly note: string | null;
  readonly occurredAt: Date;
}

export interface ServiceRequest {
  readonly id: string;
  readonly venueId: string;
  readonly roomId: string | null;
  readonly serviceType: HotelService;
  readonly state: RequestState;
  readonly details: ServiceRequestDetails;
  readonly submittedAt: Date;
  readonly updatedAt: Date;
  readonly stateChanges: readonly RequestStateChange[];
}

export interface CreateServiceRequestInput {
  readonly venueId: string;
  readonly roomId?: string | null;
  readonly serviceType: HotelService;
  readonly details?: ServiceRequestDetails;
}

export interface AdvanceRequestInput {
  readonly venueId: string;
  readonly requestId: string;
  readonly toState: RequestState;
  readonly staffMemberId?: string | null;
}

export interface CancelRequestInput {
  readonly venueId: string;
  readonly requestId: string;
  readonly reason: string;
  readonly staffMemberId?: string | null;
}

export interface DeclineRequestInput {
  readonly venueId: string;
  readonly requestId: string;
  readonly reason: string;
  readonly staffMemberId?: string | null;
}

export interface RequestFilter {
  readonly serviceType?: HotelService;
  readonly state?: RequestState;
}

export interface ServiceRequestRepository {
  create(input: CreateServiceRequestInput): Promise<Result<ServiceRequest>>;
  findById(venueId: string, id: string): Promise<Result<ServiceRequest>>;
  listForVenue(
    venueId: string,
    filter?: RequestFilter
  ): Promise<Result<ServiceRequest[]>>;
  listForRoom(
    venueId: string,
    roomId: string
  ): Promise<Result<ServiceRequest[]>>;
  advanceState(input: AdvanceRequestInput): Promise<Result<ServiceRequest>>;
  cancel(input: CancelRequestInput): Promise<Result<ServiceRequest>>;
  decline(input: DeclineRequestInput): Promise<Result<ServiceRequest>>;
  updateDetails(
    venueId: string,
    requestId: string,
    details: ServiceRequestDetails
  ): Promise<Result<ServiceRequest>>;
}
