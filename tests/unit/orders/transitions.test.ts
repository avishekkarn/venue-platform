import { describe, expect, it } from "vitest";
import { isTransitionAllowed, ALLOWED_TRANSITIONS } from "@/domain/orders/transitions";
import { OrderState } from "@/domain/orders/order.repository";
import { ok, fail, DomainErrorCode } from "@/domain/shared/result";

describe("smoke suite (Task 6.1.0.A)", () => {
  it("returns ok(true) for an allowed transition (PLACED -> APPROVED)", () => {
    const result = isTransitionAllowed(OrderState.PLACED, OrderState.APPROVED);
    expect(result).toEqual(ok(true));
  });

  it("returns fail(INVALID_STATE) for a forbidden transition (PLACED -> PREPARING)", () => {
    const result = isTransitionAllowed(OrderState.PLACED, OrderState.PREPARING);
    expect(result).toEqual(
      fail(
        DomainErrorCode.INVALID_STATE,
        "Transition from 'PLACED' to 'PREPARING' is not allowed"
      )
    );
  });

  it("forbids all outgoing transitions from CANCELLED (terminal state)", () => {
    for (const targetState of Object.values(OrderState)) {
      const result = isTransitionAllowed(OrderState.CANCELLED, targetState);
      expect(result).toEqual(
        fail(
          DomainErrorCode.INVALID_STATE,
          `Transition from 'CANCELLED' to '${targetState}' is not allowed`
        )
      );
    }
  });

  it("forbids all outgoing transitions from COMPLETED (terminal state)", () => {
    for (const targetState of Object.values(OrderState)) {
      const result = isTransitionAllowed(OrderState.COMPLETED, targetState);
      expect(result).toEqual(
        fail(
          DomainErrorCode.INVALID_STATE,
          `Transition from 'COMPLETED' to '${targetState}' is not allowed`
        )
      );
    }
  });
});

describe("exhaustive transition matrix (SYSTEM.md §9.2)", () => {
  const ALL_STATES = Object.values(OrderState);
  const allowedSet = new Set(
    ALLOWED_TRANSITIONS.map(({ from, to }) => `${from}::${to}`)
  );
  const isAllowedPair = (from: OrderState, to: OrderState): boolean =>
    allowedSet.has(`${from}::${to}`);

  it("returns ok(true) for every allowed transition", () => {
    for (const { from, to } of ALLOWED_TRANSITIONS) {
      expect(isTransitionAllowed(from, to)).toEqual(ok(true));
    }
  });

  it("returns fail(INVALID_STATE) for every pair not in ALLOWED_TRANSITIONS", () => {
    for (const from of ALL_STATES) {
      for (const to of ALL_STATES) {
        if (isAllowedPair(from, to)) continue;
        expect(isTransitionAllowed(from, to)).toEqual(
          fail(
            DomainErrorCode.INVALID_STATE,
            `Transition from '${from}' to '${to}' is not allowed`
          )
        );
      }
    }
  });

  it("has exactly 40 forbidden pairs in the 7x7 matrix", () => {
    let forbidden = 0;
    for (const from of ALL_STATES) {
      for (const to of ALL_STATES) {
        if (!isAllowedPair(from, to)) forbidden++;
      }
    }
    expect(forbidden).toBe(40);
    expect(ALLOWED_TRANSITIONS.length).toBe(9);
  });
});

describe("structural invariants of ALLOWED_TRANSITIONS", () => {
  it("has exactly 9 entries, no duplicates", () => {
    expect(ALLOWED_TRANSITIONS.length).toBe(9);
    const uniquePairs = new Set(
      ALLOWED_TRANSITIONS.map(({ from, to }) => `${from}::${to}`)
    );
    expect(uniquePairs.size).toBe(9);
  });

  it("contains no terminal state as a source", () => {
    expect(
      ALLOWED_TRANSITIONS.filter((e) => e.from === OrderState.CANCELLED)
    ).toEqual([]);
    expect(
      ALLOWED_TRANSITIONS.filter((e) => e.from === OrderState.COMPLETED)
    ).toEqual([]);
  });

  it("every non-terminal state appears as a source", () => {
    const nonTerminalStates = [
      OrderState.PLACED,
      OrderState.APPROVED,
      OrderState.PREPARING,
      OrderState.READY,
      OrderState.DELIVERED,
    ];
    for (const state of nonTerminalStates) {
      expect(ALLOWED_TRANSITIONS.some((e) => e.from === state)).toBe(true);
    }
  });
});
