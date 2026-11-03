/**
 * Domain requests module barrel export.
 *
 * Reference: SYSTEM.md §4 (requests domain module).
 */

export {
  RequestState,
  HotelService,
  PlaceType,
  type ServiceRequestDetails,
  type RequestStateChange,
  type ServiceRequest,
  type CreateServiceRequestInput,
  type AdvanceRequestInput,
  type CancelRequestInput,
  type RequestFilter,
  type ServiceRequestRepository,
} from "./request.repository";

export {
  createRequest,
  type CreateRequestDeps,
  type CreateRequestInput,
} from "./create-request";

export {
  ALLOWED_TRANSITIONS,
  isTransitionAllowed,
} from "./transitions";

export {
  advanceRequest,
  type AdvanceRequestDeps,
  type AdvanceRequestDomainInput,
} from "./advance-request";

export {
  cancelRequest,
  type CancelRequestDeps,
  type CancelRequestDomainInput,
} from "./cancel-request";
