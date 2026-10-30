import { describe, expect, it } from "vitest";
import { isTransitionAllowed } from "@/domain/orders/transitions";
import { OrderState } from "@/domain/orders/order.repository";
import { ok, fail, DomainErrorCode } from "@/domain/shared/result";

describe("isTransitionAllowed smoke suite (Task 6.1.0.A)", () => {
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

