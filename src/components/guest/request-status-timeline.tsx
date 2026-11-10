"use client";

import type { JSX } from "react";
import {
  RequestState,
  type RequestStateChange,
  type HotelService,
} from "@/domain/requests/request.repository";
import { formatTime } from "@/lib/date";

/**
 * RequestStatusTimeline Component.
 *
 * Presentational Server Component displaying the lifecycle of a guest service request:
 *   SUBMITTED → ACKNOWLEDGED → IN_PROGRESS → COMPLETED
 * With CANCELLED and DECLINED as terminal branches.
 *
 * Mirrors the structure, styling tokens, pulse animation, and accessibility of OrderStatusTimeline.
 * Note: serviceType is reserved for future per-service copy; not consumed today.
 *
 * Reference: Task 7.5.8.A.1, DESIGN.md §4.6.17.7, §4.13.1 (guest voice).
 */

export interface RequestStatusTimelineProps {
  currentState: RequestState;
  stateChanges?: readonly RequestStateChange[];
  serviceType?: HotelService;
  locale?: string;
}

interface TimelineStepDef {
  state: RequestState;
  label: string;
  getCopy: () => string;
}

const REQUEST_FLOW: readonly TimelineStepDef[] = [
  {
    state: RequestState.SUBMITTED,
    label: "Submitted",
    getCopy: () => "We have your request.",
  },
  {
    state: RequestState.ACKNOWLEDGED,
    label: "Acknowledged",
    getCopy: () => "Staff have seen it.",
  },
  {
    state: RequestState.IN_PROGRESS,
    label: "In progress",
    getCopy: () => "Staff are on it.",
  },
  {
    state: RequestState.COMPLETED,
    label: "Completed",
    getCopy: () => "Done.",
  },
];

const REQUEST_FLOW_INDEX: Record<RequestState, number> = {
  [RequestState.SUBMITTED]: 0,
  [RequestState.ACKNOWLEDGED]: 1,
  [RequestState.IN_PROGRESS]: 2,
  [RequestState.COMPLETED]: 3,
  [RequestState.CANCELLED]: -1,
  [RequestState.DECLINED]: -1,
};

type StepStatus = "completed" | "current" | "future" | "cancelled" | "declined";

interface DisplayStep {
  state: RequestState;
  label: string;
  copy: string;
  status: StepStatus;
  timeStr: string | null;
}

export function RequestStatusTimeline({
  currentState,
  stateChanges = [],
  // serviceType is reserved for future per-service copy; not consumed today.
  locale = "en-US",
}: RequestStatusTimelineProps): JSX.Element {
  // Map timestamps from state changes
  const stateTimeMap = new Map<RequestState, Date>();
  for (const sc of stateChanges) {
    stateTimeMap.set(sc.state, new Date(sc.occurredAt));
  }

  const steps: DisplayStep[] = [];

  if (
    currentState === RequestState.CANCELLED ||
    currentState === RequestState.DECLINED
  ) {
    // Collect completed steps before the terminal state
    for (const item of REQUEST_FLOW) {
      const time = stateTimeMap.get(item.state);
      if (time) {
        steps.push({
          state: item.state,
          label: item.label,
          copy: item.getCopy(),
          status: "completed",
          timeStr: formatTime(time, locale),
        });
      }
    }

    const terminalTime = stateTimeMap.get(currentState);
    const isCancelled = currentState === RequestState.CANCELLED;
    steps.push({
      state: currentState,
      label: isCancelled ? "Cancelled" : "Declined",
      copy: isCancelled
        ? "Request was cancelled."
        : "Staff could not fulfil the request.",
      status: isCancelled ? "cancelled" : "declined",
      timeStr: terminalTime ? formatTime(terminalTime, locale) : null,
    });
  } else {
    const currentIndex = REQUEST_FLOW_INDEX[currentState] ?? 0;

    for (let i = 0; i < REQUEST_FLOW.length; i++) {
      const item = REQUEST_FLOW[i];
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
        copy: item.getCopy(),
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
                {step.status === "declined" && (
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
                      <line x1="4" y1="8" x2="12" y2="8" />
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
                        : step.status === "cancelled" || step.status === "declined"
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

