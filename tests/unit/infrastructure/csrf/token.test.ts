import { describe, it, expect } from "vitest";
import {
  generateCsrfToken,
  safeCompareCsrfTokens,
} from "@/infrastructure/csrf/token";

describe("CSRF token helpers", () => {
  it("generateCsrfToken returns a UUID-shaped string", () => {
    const token = generateCsrfToken();
    expect(typeof token).toBe("string");
    expect(token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it("generateCsrfToken returns a different value on each call", () => {
    const a = generateCsrfToken();
    const b = generateCsrfToken();
    expect(a).not.toBe(b);
  });

  it("safeCompareCsrfTokens returns true for identical non-empty strings", () => {
    expect(safeCompareCsrfTokens("abc-123", "abc-123")).toBe(true);
  });

  it("safeCompareCsrfTokens returns false for different strings of the same length", () => {
    expect(safeCompareCsrfTokens("abc-123", "abc-124")).toBe(false);
  });

  it("safeCompareCsrfTokens returns false when lengths differ", () => {
    expect(safeCompareCsrfTokens("abc", "abcd")).toBe(false);
  });

  it("safeCompareCsrfTokens returns false for null or undefined arguments", () => {
    expect(safeCompareCsrfTokens(null, "abc")).toBe(false);
    expect(safeCompareCsrfTokens("abc", null)).toBe(false);
    expect(safeCompareCsrfTokens(undefined, undefined)).toBe(false);
  });

  it("safeCompareCsrfTokens returns false for empty strings", () => {
    expect(safeCompareCsrfTokens("", "")).toBe(false);
    expect(safeCompareCsrfTokens("", "abc")).toBe(false);
  });
});
