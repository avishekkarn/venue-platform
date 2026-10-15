/**
 * Prisma adapter for the ServiceRequestRepository port.
 *
 * Requirements:
 * - Exports createPrismaServiceRequestRepository(client: DbClient): ServiceRequestRepository (no default value).
 * - Only file in the requests module that imports @prisma/client.
 * - Enforces venue isolation on every query (DECISIONS.md D-10.2).
 * - create writes the request and its first RequestStateChange (SUBMITTED) in a transaction.
 * - cancel writes CANCELLED and a RequestStateChange with note = reason.
 * - decline writes DECLINED and a RequestStateChange with note = reason.
 * - detailsJson is serialized/deserialized as a domain ServiceRequestDetails shape.
 * - advanceState, cancel, decline, updateDetails verify venue ownership and return NOT_FOUND on missing/cross-venue.
 *
 * Reference: SYSTEM.md §2, §4, §10, §11.1, DECISIONS.md D-5.1 to D-5.7, D-10.2.
 */

import {
  type PrismaClient,
  type Prisma,
  RequestState as PrismaRequestState,
  HotelService as PrismaHotelService,
  type ServiceRequest as PrismaServiceRequest,
  type RequestStateChange as PrismaRequestStateChange,
} from "@prisma/client";
import {
  type ServiceRequestRepository,
  type ServiceRequest,
  type RequestStateChange,
  type ServiceRequestDetails,
  type CreateServiceRequestInput,
  type AdvanceRequestInput,
  type CancelRequestInput,
  type DeclineRequestInput,
  type RequestFilter,
  RequestState,
  HotelService,
} from "@/domain/requests/request.repository";
import { ok, fail, DomainErrorCode, type Result } from "@/domain/shared/result";

type DbClient = PrismaClient | Prisma.TransactionClient;

const PRISMA_TO_DOMAIN_REQUEST_STATE: Record<PrismaRequestState, RequestState> = {
  [PrismaRequestState.SUBMITTED]: RequestState.SUBMITTED,
  [PrismaRequestState.ACKNOWLEDGED]: RequestState.ACKNOWLEDGED,
  [PrismaRequestState.IN_PROGRESS]: RequestState.IN_PROGRESS,
  [PrismaRequestState.COMPLETED]: RequestState.COMPLETED,
  [PrismaRequestState.CANCELLED]: RequestState.CANCELLED,
  [PrismaRequestState.DECLINED]: RequestState.DECLINED,
};

const DOMAIN_TO_PRISMA_REQUEST_STATE: Record<RequestState, PrismaRequestState> = {
  [RequestState.SUBMITTED]: PrismaRequestState.SUBMITTED,
  [RequestState.ACKNOWLEDGED]: PrismaRequestState.ACKNOWLEDGED,
  [RequestState.IN_PROGRESS]: PrismaRequestState.IN_PROGRESS,
  [RequestState.COMPLETED]: PrismaRequestState.COMPLETED,
  [RequestState.CANCELLED]: PrismaRequestState.CANCELLED,
  [RequestState.DECLINED]: PrismaRequestState.DECLINED,
};

const PRISMA_TO_DOMAIN_HOTEL_SERVICE: Record<PrismaHotelService, HotelService> = {
  [PrismaHotelService.ROOM_SERVICE_FOOD]: HotelService.ROOM_SERVICE_FOOD,
  [PrismaHotelService.HOUSEKEEPING]: HotelService.HOUSEKEEPING,
  [PrismaHotelService.MAINTENANCE]: HotelService.MAINTENANCE,
  [PrismaHotelService.CONCIERGE]: HotelService.CONCIERGE,
  [PrismaHotelService.LAUNDRY]: HotelService.LAUNDRY,
  [PrismaHotelService.SPA]: HotelService.SPA,
  [PrismaHotelService.LATE_CHECKOUT]: HotelService.LATE_CHECKOUT,
  [PrismaHotelService.WAKE_UP_CALL]: HotelService.WAKE_UP_CALL,
  [PrismaHotelService.DO_NOT_DISTURB]: HotelService.DO_NOT_DISTURB,
};

const DOMAIN_TO_PRISMA_HOTEL_SERVICE: Record<HotelService, PrismaHotelService> = {
  [HotelService.ROOM_SERVICE_FOOD]: PrismaHotelService.ROOM_SERVICE_FOOD,
  [HotelService.HOUSEKEEPING]: PrismaHotelService.HOUSEKEEPING,
  [HotelService.MAINTENANCE]: PrismaHotelService.MAINTENANCE,
  [HotelService.CONCIERGE]: PrismaHotelService.CONCIERGE,
  [HotelService.LAUNDRY]: PrismaHotelService.LAUNDRY,
  [HotelService.SPA]: PrismaHotelService.SPA,
  [HotelService.LATE_CHECKOUT]: PrismaHotelService.LATE_CHECKOUT,
  [HotelService.WAKE_UP_CALL]: PrismaHotelService.WAKE_UP_CALL,
  [HotelService.DO_NOT_DISTURB]: PrismaHotelService.DO_NOT_DISTURB,
};

type RawServiceRequestWithRelations = PrismaServiceRequest & {
  stateChanges: PrismaRequestStateChange[];
};

const REQUEST_INCLUDE = {
  stateChanges: {
    orderBy: { occurredAt: "asc" as const },
  },
} as const;

function mapRequestStateChange(
  raw: PrismaRequestStateChange
): RequestStateChange {
  return {
    id: raw.id,
    requestId: raw.requestId,
    state: PRISMA_TO_DOMAIN_REQUEST_STATE[raw.state],
    staffMemberId: raw.staffMemberId,
    note: raw.note,
    occurredAt: raw.occurredAt,
  };
}

function mapServiceRequest(raw: RawServiceRequestWithRelations): ServiceRequest {
  const details: ServiceRequestDetails =
    raw.detailsJson &&
    typeof raw.detailsJson === "object" &&
    !Array.isArray(raw.detailsJson)
      ? (raw.detailsJson as ServiceRequestDetails)
      : {};

  return {
    id: raw.id,
    venueId: raw.venueId,
    roomId: raw.roomId,
    serviceType: PRISMA_TO_DOMAIN_HOTEL_SERVICE[raw.serviceType],
    state: PRISMA_TO_DOMAIN_REQUEST_STATE[raw.state],
    details,
    submittedAt: raw.submittedAt,
    updatedAt: raw.updatedAt,
    stateChanges: raw.stateChanges.map(mapRequestStateChange),
  };
}

export function createPrismaServiceRequestRepository(
  client: DbClient
): ServiceRequestRepository {
  async function findById(
    venueId: string,
    id: string
  ): Promise<Result<ServiceRequest>> {
    try {
      const raw = await client.serviceRequest.findFirst({
        where: { id, venueId },
        include: REQUEST_INCLUDE,
      });

      if (!raw) {
        return fail(
          DomainErrorCode.NOT_FOUND,
          `Service request '${id}' not found for venue '${venueId}'`
        );
      }

      return ok(mapServiceRequest(raw));
    } catch (error) {
      return fail(
        DomainErrorCode.INTERNAL,
        error instanceof Error ? error.message : "Failed to find service request"
      );
    }
  }

  return {
    create: async (
      input: CreateServiceRequestInput
    ): Promise<Result<ServiceRequest>> => {
      try {
        const createInTx = async (tx: DbClient): Promise<ServiceRequest> => {
          const raw = await tx.serviceRequest.create({
            data: {
              venueId: input.venueId,
              roomId: input.roomId ?? null,
              serviceType: DOMAIN_TO_PRISMA_HOTEL_SERVICE[input.serviceType],
              state: PrismaRequestState.SUBMITTED,
              detailsJson: (input.details ?? {}) as Prisma.InputJsonValue,
              stateChanges: {
                create: [
                  {
                    state: PrismaRequestState.SUBMITTED,
                    staffMemberId: null,
                    note: null,
                  },
                ],
              },
            },
            include: REQUEST_INCLUDE,
          });

          return mapServiceRequest(raw);
        };

        const resultRequest =
          "$transaction" in client && typeof client.$transaction === "function"
            ? await client.$transaction(async (tx) => createInTx(tx))
            : await createInTx(client);

        return ok(resultRequest);
      } catch (error) {
        return fail(
          DomainErrorCode.INTERNAL,
          error instanceof Error
            ? error.message
            : "Failed to create service request"
        );
      }
    },

    findById,

    listForVenue: async (
      venueId: string,
      filter?: RequestFilter
    ): Promise<Result<ServiceRequest[]>> => {
      try {
        const rawList = await client.serviceRequest.findMany({
          where: {
            venueId,
            ...(filter?.serviceType
              ? {
                  serviceType:
                    DOMAIN_TO_PRISMA_HOTEL_SERVICE[filter.serviceType],
                }
              : {}),
            ...(filter?.state
              ? {
                  state: DOMAIN_TO_PRISMA_REQUEST_STATE[filter.state],
                }
              : {}),
          },
          include: REQUEST_INCLUDE,
          orderBy: { submittedAt: "desc" },
        });

        return ok(rawList.map(mapServiceRequest));
      } catch (error) {
        return fail(
          DomainErrorCode.INTERNAL,
          error instanceof Error
            ? error.message
            : "Failed to list service requests for venue"
        );
      }
    },

    listForRoom: async (
      venueId: string,
      roomId: string
    ): Promise<Result<ServiceRequest[]>> => {
      try {
        const rawList = await client.serviceRequest.findMany({
          where: {
            venueId,
            roomId,
          },
          include: REQUEST_INCLUDE,
          orderBy: { submittedAt: "desc" },
        });

        return ok(rawList.map(mapServiceRequest));
      } catch (error) {
        return fail(
          DomainErrorCode.INTERNAL,
          error instanceof Error
            ? error.message
            : "Failed to list service requests for room"
        );
      }
    },

    advanceState: async (
      input: AdvanceRequestInput
    ): Promise<Result<ServiceRequest>> => {
      try {
        const existing = await client.serviceRequest.findFirst({
          where: { id: input.requestId, venueId: input.venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Service request '${input.requestId}' not found for venue '${input.venueId}'`
          );
        }

        const advanceInTx = async (tx: DbClient): Promise<ServiceRequest> => {
          const updated = await tx.serviceRequest.update({
            where: { id: input.requestId },
            data: {
              state: DOMAIN_TO_PRISMA_REQUEST_STATE[input.toState],
              stateChanges: {
                create: {
                  state: DOMAIN_TO_PRISMA_REQUEST_STATE[input.toState],
                  staffMemberId: input.staffMemberId ?? null,
                  note: null,
                },
              },
            },
            include: REQUEST_INCLUDE,
          });

          return mapServiceRequest(updated);
        };

        const resultRequest =
          "$transaction" in client && typeof client.$transaction === "function"
            ? await client.$transaction(async (tx) => advanceInTx(tx))
            : await advanceInTx(client);

        return ok(resultRequest);
      } catch (error) {
        return fail(
          DomainErrorCode.INTERNAL,
          error instanceof Error
            ? error.message
            : "Failed to advance service request state"
        );
      }
    },

    cancel: async (
      input: CancelRequestInput
    ): Promise<Result<ServiceRequest>> => {
      try {
        const existing = await client.serviceRequest.findFirst({
          where: { id: input.requestId, venueId: input.venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Service request '${input.requestId}' not found for venue '${input.venueId}'`
          );
        }

        const cancelInTx = async (tx: DbClient): Promise<ServiceRequest> => {
          const updated = await tx.serviceRequest.update({
            where: { id: input.requestId },
            data: {
              state: PrismaRequestState.CANCELLED,
              stateChanges: {
                create: {
                  state: PrismaRequestState.CANCELLED,
                  staffMemberId: input.staffMemberId ?? null,
                  note: input.reason,
                },
              },
            },
            include: REQUEST_INCLUDE,
          });

          return mapServiceRequest(updated);
        };

        const resultRequest =
          "$transaction" in client && typeof client.$transaction === "function"
            ? await client.$transaction(async (tx) => cancelInTx(tx))
            : await cancelInTx(client);

        return ok(resultRequest);
      } catch (error) {
        return fail(
          DomainErrorCode.INTERNAL,
          error instanceof Error
            ? error.message
            : "Failed to cancel service request"
        );
      }
    },

    decline: async (
      input: DeclineRequestInput
    ): Promise<Result<ServiceRequest>> => {
      try {
        const existing = await client.serviceRequest.findFirst({
          where: { id: input.requestId, venueId: input.venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Service request '${input.requestId}' not found for venue '${input.venueId}'`
          );
        }

        const declineInTx = async (tx: DbClient): Promise<ServiceRequest> => {
          const updated = await tx.serviceRequest.update({
            where: { id: input.requestId },
            data: {
              state: PrismaRequestState.DECLINED,
              stateChanges: {
                create: {
                  state: PrismaRequestState.DECLINED,
                  staffMemberId: input.staffMemberId ?? null,
                  note: input.reason,
                },
              },
            },
            include: REQUEST_INCLUDE,
          });

          return mapServiceRequest(updated);
        };

        const resultRequest =
          "$transaction" in client && typeof client.$transaction === "function"
            ? await client.$transaction(async (tx) => declineInTx(tx))
            : await declineInTx(client);

        return ok(resultRequest);
      } catch (error) {
        return fail(
          DomainErrorCode.INTERNAL,
          error instanceof Error
            ? error.message
            : "Failed to decline service request"
        );
      }
    },

    updateDetails: async (
      venueId: string,
      requestId: string,
      details: ServiceRequestDetails
    ): Promise<Result<ServiceRequest>> => {
      try {
        const existing = await client.serviceRequest.findFirst({
          where: { id: requestId, venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Service request '${requestId}' not found for venue '${venueId}'`
          );
        }

        const updated = await client.serviceRequest.update({
          where: { id: requestId },
          data: {
            detailsJson: details as Prisma.InputJsonValue,
          },
          include: REQUEST_INCLUDE,
        });

        return ok(mapServiceRequest(updated));
      } catch (error) {
        return fail(
          DomainErrorCode.INTERNAL,
          error instanceof Error
            ? error.message
            : "Failed to update service request details"
        );
      }
    },
  };
}
