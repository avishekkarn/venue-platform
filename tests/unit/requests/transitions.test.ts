import { describe, it, expect } from "vitest";
import { isTransitionAllowed, ALLOWED_TRANSITIONS } from "@/domain/requests/transitions";
import { RequestState } from "@/domain/requests/request.repository";
import { DomainErrorCode } from "@/domain/shared/result";

describe("Request state transitions (SYSTEM.md §10.2)", () => {
  const ALL_STATES: readonly RequestState[] = [
    RequestState.SUBMITTED,
    RequestState.ACKNOWLEDGED,
    RequestState.IN_PROGRESS,
    RequestState.COMPLETED,
    RequestState.CANCELLED,
    RequestState.DECLINED,
  ];

  it("Case 1 — transition table completeness has exactly 8 allowed transitions", () => {
    let totalAllowed = 0;
    for (const state of ALL_STATES) {
      totalAllowed += ALLOWED_TRANSITIONS[state].length;
    }
    expect(totalAllowed).toBe(8);
    expect(ALLOWED_TRANSITIONS[RequestState.SUBMITTED].length).toBe(3);
    expect(ALLOWED_TRANSITIONS[RequestState.ACKNOWLEDGED].length).toBe(3);
    expect(ALLOWED_TRANSITIONS[RequestState.IN_PROGRESS].length).toBe(2);
    expect(ALLOWED_TRANSITIONS[RequestState.COMPLETED].length).toBe(0);
    expect(ALLOWED_TRANSITIONS[RequestState.CANCELLED].length).toBe(0);
    expect(ALLOWED_TRANSITIONS[RequestState.DECLINED].length).toBe(0);
  });

  it("Case 2 — every allowed pair passes", () => {
    for (const from of ALL_STATES) {
      for (const to of ALLOWED_TRANSITIONS[from]) {
        const result = isTransitionAllowed(from, to);
        expect(result.ok).toBe(true);
      }
    }
  });

  it("Case 3 — every forbidden pair fails with INVALID_STATE", () => {
    let forbiddenCount = 0;
    for (const from of ALL_STATES) {
      const allowedTargets = ALLOWED_TRANSITIONS[from];
      for (const to of ALL_STATES) {
        if (allowedTargets.includes(to)) {
          continue;
        }
        forbiddenCount++;
        const result = isTransitionAllowed(from, to);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe(DomainErrorCode.INVALID_STATE);
        }
      }
    }
    expect(forbiddenCount).toBe(28);
  });

  it("Case 4 — terminal states reject all transitions", () => {
    const terminalStates: readonly RequestState[] = [
      RequestState.COMPLETED,
      RequestState.CANCELLED,
      RequestState.DECLINED,
    ];
    for (const terminal of terminalStates) {
      for (const to of ALL_STATES) {
        const result = isTransitionAllowed(terminal, to);
        expect(result.ok).toBe(false);
      }
    }
  });

  it("Case 5 — self-transitions are forbidden", () => {
    for (const state of ALL_STATES) {
      const result = isTransitionAllowed(state, state);
      expect(result.ok).toBe(false);
    }
  });

  it("Case 6 — error message format matches specification", () => {
    const result = isTransitionAllowed(
      RequestState.SUBMITTED,
      RequestState.COMPLETED
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe(
        "Transition from 'SUBMITTED' to 'COMPLETED' is not allowed"
      );
    }
  });
});

