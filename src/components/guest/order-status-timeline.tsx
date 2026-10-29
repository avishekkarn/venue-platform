import type { JSX } from "react";
import {
  OrderState,
  type OrderStateChange,
  PlaceType,
} from "@/domain/orders/order.repository";
import { formatTime } from "@/lib/date";

export interface OrderStatusTimelineProps {
  currentState: OrderState;
  stateChanges?: readonly OrderStateChange[];
  placeType?: PlaceType;
  locale?: string;
}

interface TimelineStepDef {
  state: OrderState;
  label: string;
  getCopy: (placeType?: PlaceType) => string;
}

const ORDER_FLOW: readonly TimelineStepDef[] = [
  {
    state: OrderState.PLACED,
    label: "Placed",
    getCopy: () => "We have your order.",
  },
  {
    state: OrderState.APPROVED,
    label: "Approved",
    getCopy: () => "The kitchen has accepted it.",
  },
  {
    state: OrderState.PREPARING,
    label: "Preparing",
    getCopy: () => "The kitchen is on it.",
  },
  {
    state: OrderState.READY,
    label: "Ready",
    getCopy: (pt) => {
      if (pt === PlaceType.ROOM) return "Ready for your room.";
      if (pt === PlaceType.COUNTER) return "Ready for pickup.";
      return "Ready for your table.";
    },
  },
  {
    state: OrderState.DELIVERED,
    label: "Delivered",
    getCopy: (pt) => {
      if (pt === PlaceType.COUNTER) return "Order picked up.";
      return "Delivered.";
    },
  },
  {
    state: OrderState.COMPLETED,
    label: "Completed",
    getCopy: () => "Enjoy.",
  },
];

const ORDER_FLOW_INDEX: Record<OrderState, number> = {
  [OrderState.PLACED]: 0,
  [OrderState.APPROVED]: 1,
  [OrderState.PREPARING]: 2,
  [OrderState.READY]: 3,
  [OrderState.DELIVERED]: 4,
  [OrderState.COMPLETED]: 5,
  [OrderState.CANCELLED]: -1,
};

type StepStatus = "completed" | "current" | "future" | "cancelled";

interface DisplayStep {
  state: OrderState;
  label: string;
  copy: string;
  status: StepStatus;
  timeStr: string | null;
}

export function OrderStatusTimeline({
  currentState,
  stateChanges = [],
  placeType,
  locale = "en-US",
}: OrderStatusTimelineProps): JSX.Element {
  // Map timestamps from state changes
  const stateTimeMap = new Map<OrderState, Date>();
  for (const sc of stateChanges) {
    stateTimeMap.set(sc.state, new Date(sc.occurredAt));
  }

  const steps: DisplayStep[] = [];

  if (currentState === OrderState.CANCELLED) {
    // Collect completed steps before cancellation
    for (const item of ORDER_FLOW) {
      const time = stateTimeMap.get(item.state);
      if (time) {
        steps.push({
          state: item.state,
          label: item.label,
          copy: item.getCopy(placeType),
          status: "completed",
          timeStr: formatTime(time, locale),
        });
      }
    }

    const cancelTime = stateTimeMap.get(OrderState.CANCELLED);
    steps.push({
      state: OrderState.CANCELLED,
      label: "Cancelled",
      copy: "Order was cancelled.",
      status: "cancelled",
      timeStr: cancelTime ? formatTime(cancelTime, locale) : null,
    });
  } else {
    const currentIndex = ORDER_FLOW_INDEX[currentState] ?? 0;

    for (let i = 0; i < ORDER_FLOW.length; i++) {
      const item = ORDER_FLOW[i];
      if (!item) continue;

      let status: StepStatus = "future";
      if (i < currentIndex) {
        status = "completed";
      } else if (i === currentIndex) {
        status = "current";
      }

      const time = stateTimeMap.get(item.state);
      const timeStr = time ? formatTime(time, locale) : null;

      steps.push({
        state: item.state,
        label: item.label,
        copy: item.getCopy(placeType),
        status,
        timeStr,
      });
    }
  }

  return (
    <div className="w-full">
      <style>{`
        @keyframes currentDotPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(var(--guest-brand-rgb, 26, 26, 26), 0.4);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(var(--guest-brand-rgb, 26, 26, 26), 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(var(--guest-brand-rgb, 26, 26, 26), 0);
          }
        }
        .timeline-dot-current {
          animation: currentDotPulse 600ms ease-out 1 forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .timeline-dot-current {
            animation: none !important;
          }
        }
      `}</style>

      <div className="space-y-0" role="list">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <div
              key={step.state}
              className="relative flex items-start gap-4"
              role="listitem"
            >
              {/* Connector Line */}
              {!isLast && (
                <div
                  className={`absolute left-[15px] top-[28px] bottom-[-4px] w-[2px] ${
                    step.status === "completed"
                      ? "bg-guest-brand"
                      : "bg-guest-border-subtle"
                  }`}
                  aria-hidden="true"
                />
              )}

              {/* Step Dot */}
              <div className="relative z-10 flex size-8 shrink-0 items-center justify-center">
                {step.status === "completed" && (
                  <div className="size-6 rounded-full bg-guest-brand text-guest-brand-contrast flex items-center justify-center transition-colors duration-guest-base">
                    <svg
                      className="size-3.5"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
                    </svg>
                  </div>
                )}
                {step.status === "current" && (
                  <div className="timeline-dot-current size-6 rounded-full bg-guest-brand text-guest-brand-contrast flex items-center justify-center ring-4 ring-guest-brand/20">
                    <div className="size-2 rounded-full bg-guest-brand-contrast" />
                  </div>
                )}
                {step.status === "future" && (
                  <div className="size-6 rounded-full border-2 border-guest-border-subtle bg-guest-surface-sunken" />
                )}
                {step.status === "cancelled" && (
                  <div className="size-6 rounded-full bg-status-cancelled text-status-cancelled-contrast flex items-center justify-center">
                    <svg
                      className="size-3.5"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 4L12 12M12 4L4 12" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0 pb-6">
                <div className="flex items-baseline justify-between gap-2">
                  <h3
                    className={`text-sm font-medium ${
                      step.status === "current"
                        ? "text-guest-brand font-semibold"
                        : step.status === "completed"
                        ? "text-guest-text-primary"
                        : step.status === "cancelled"
                        ? "text-status-cancelled font-semibold"
                        : "text-guest-text-muted"
                    }`}
                  >
                    {step.label}
                  </h3>
                  {step.timeStr && (
                    <span className="font-mono text-xs text-guest-text-secondary shrink-0">
                      {step.timeStr}
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs mt-0.5 ${
                    step.status === "current"
                      ? "text-guest-text-primary"
                      : step.status === "future"
                      ? "text-guest-text-muted/60"
                      : "text-guest-text-secondary"
                  }`}
                >
                  {step.copy}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

