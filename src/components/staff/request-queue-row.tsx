import type { JSX } from "react";
import type {
  ServiceRequest,
  ServiceRequestDetails,
} from "@/domain/requests/request.repository";
import { RequestState, HotelService } from "@/domain/requests/request.repository";

export interface RequestQueueRowProps {
  readonly request: ServiceRequest;
  readonly placeNumber: string;
  readonly placeTypeLabel: string; // "Room" | "Table" | "Counter"
}

export const SERVICE_LABELS: Record<HotelService, string> = {
  ROOM_SERVICE_FOOD: "Room Service",
  HOUSEKEEPING: "Housekeeping",
  MAINTENANCE: "Maintenance",
  CONCIERGE: "Concierge",
  LAUNDRY: "Laundry",
  SPA: "Spa",
  LATE_CHECKOUT: "Late Checkout",
  WAKE_UP_CALL: "Wake-up Call",
  DO_NOT_DISTURB: "Do Not Disturb",
  CALL_WAITER: "Call Waiter",
  REQUEST_BILL: "Request Bill",
};

function formatDetailsSummary(details?: ServiceRequestDetails): string {
  if (!details || typeof details !== "object") return "";
  const parts: string[] = [];
  for (const [key, val] of Object.entries(details)) {
    if (val === null || val === undefined || val === "") continue;
    if (Array.isArray(val)) {
      parts.push(`${key}: ${val.join(", ")}`);
    } else {
      parts.push(`${key}: ${val}`);
    }
  }
  return parts.join(" · ");
}

export function RequestQueueRow({
  request,
  placeNumber,
  placeTypeLabel,
}: RequestQueueRowProps): JSX.Element {
  const serviceLabel =
    SERVICE_LABELS[request.serviceType] ?? request.serviceType;

  let badgeClass =
    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  if (request.state === RequestState.SUBMITTED) {
    badgeClass += " bg-amber-100 text-amber-800";
  } else if (request.state === RequestState.ACKNOWLEDGED) {
    badgeClass += " bg-purple-100 text-purple-800";
  } else if (request.state === RequestState.IN_PROGRESS) {
    badgeClass += " bg-sky-100 text-sky-800";
  } else if (request.state === RequestState.COMPLETED) {
    badgeClass += " bg-status-done-bg text-status-done";
  } else {
    badgeClass += " bg-status-cancelled-bg text-status-cancelled";
  }

  const detailsSummary = formatDetailsSummary(request.details);

  return (
    <article
      data-request-id={request.id}
      data-request-state={request.state}
      data-place-number={placeNumber}
      className="bg-staff-surface-raised border border-staff-border-subtle rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-lg bg-staff-surface flex flex-col items-center justify-center border border-staff-border-subtle shrink-0">
          <span className="text-[11px] font-semibold text-staff-text-muted uppercase">
            {placeTypeLabel}
          </span>
          <span className="text-[20px] font-bold text-staff-text-primary">
            {placeNumber}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-staff-text-primary">
              #{request.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="text-sm font-medium text-staff-text-secondary">
              {serviceLabel}
            </span>
            <span className={badgeClass}>{request.state}</span>
          </div>
          {detailsSummary ? (
            <p className="text-sm text-staff-text-secondary mt-0.5 max-w-md line-clamp-2">
              {detailsSummary}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
        {request.state === RequestState.SUBMITTED && (
          <>
            <button
              type="button"
              data-action="request-decline"
              data-request-id={request.id}
              data-request-service={request.serviceType}
              className="inline-flex items-center justify-center rounded-md px-3 h-10 text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 cursor-pointer"
            >
              Decline
            </button>
            <button
              type="button"
              data-action="request-cancel"
              data-request-id={request.id}
              data-request-service={request.serviceType}
              className="inline-flex items-center justify-center rounded-md px-3 h-10 text-sm font-medium text-status-cancelled hover:bg-red-50 border border-status-cancelled/30 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              data-action="request-advance"
              data-request-id={request.id}
              data-to-state="ACKNOWLEDGED"
              className="inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-staff-brand text-staff-brand-contrast hover:brightness-95 cursor-pointer"
            >
              Acknowledge
            </button>
          </>
        )}

        {request.state === RequestState.ACKNOWLEDGED && (
          <>
            <button
              type="button"
              data-action="request-decline"
              data-request-id={request.id}
              data-request-service={request.serviceType}
              className="inline-flex items-center justify-center rounded-md px-3 h-10 text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 cursor-pointer"
            >
              Decline
            </button>
            <button
              type="button"
              data-action="request-cancel"
              data-request-id={request.id}
              data-request-service={request.serviceType}
              className="inline-flex items-center justify-center rounded-md px-3 h-10 text-sm font-medium text-status-cancelled hover:bg-red-50 border border-status-cancelled/30 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              data-action="request-advance"
              data-request-id={request.id}
              data-to-state="IN_PROGRESS"
              className="inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-staff-brand text-staff-brand-contrast hover:brightness-95 cursor-pointer"
            >
              Start
            </button>
          </>
        )}

        {request.state === RequestState.IN_PROGRESS && (
          <>
            <button
              type="button"
              data-action="request-cancel"
              data-request-id={request.id}
              data-request-service={request.serviceType}
              className="inline-flex items-center justify-center rounded-md px-3 h-10 text-sm font-medium text-status-cancelled hover:bg-red-50 border border-status-cancelled/30 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              data-action="request-advance"
              data-request-id={request.id}
              data-to-state="COMPLETED"
              className="inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-emerald-600 text-white hover:brightness-95 cursor-pointer"
            >
              Complete
            </button>
          </>
        )}

        {(request.state === RequestState.COMPLETED ||
          request.state === RequestState.CANCELLED ||
          request.state === RequestState.DECLINED) && (
          <span className="text-sm text-staff-text-muted">—</span>
        )}
      </div>
    </article>
  );
}

