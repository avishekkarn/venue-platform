import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

/**
 * Unit tests for the cn helper.
 *
 * The cn helper is `twMerge(clsx(inputs))`. It does two things in sequence:
 *  1. clsx flattens its arguments into a single string, dropping falsy values
 *     and expanding arrays and objects.
 *  2. tailwind-merge resolves conflicts between Tailwind classes, keeping the
 *     last one in a conflicting group.
 *
 * Every component in src/components/ui/ composes class names through cn.
 * These tests lock in the four behaviours those components rely on, so a
 * future change to cn — or a swap of its underlying libraries — fails here
 * before it reaches a rendered component.
 *
 * Reference: DESIGN.md §4.15.7 (enforcement rule #3: no dynamic class name
 * construction; cn is the mechanism that makes that rule possible),
 * BUILD.md §8.2 (what the unit tests cover).
 */
describe("cn", () => {
  describe("merging", () => {
    it("joins multiple class names with a single space", () => {
      expect(cn("a", "b")).toBe("a b");
    });

    it("joins three or more class names in order", () => {
      expect(cn("a", "b", "c")).toBe("a b c");
    });

    it("returns an empty string when called with no arguments", () => {
      expect(cn()).toBe("");
    });
  });

  describe("conflict resolution", () => {
    it("keeps the last value when two classes share a Tailwind group", () => {
      expect(cn("p-2", "p-4")).toBe("p-4");
    });

    it("keeps the last value for conflicting colors", () => {
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("keeps non-conflicting classes from both sides", () => {
      expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    });

    it("resolves conflicts across separate arguments", () => {
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    });
  });

  describe("conditional and falsy inputs", () => {
    it("drops false, null, undefined, and empty-string values", () => {
      expect(cn("a", false, undefined, null, "", "b")).toBe("a b");
    });

    it("includes a class only when its condition is true", () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe(
        "base active"
      );
    });

    it("expands an object of booleans, including only truthy keys", () => {
      expect(cn({ a: true, b: false, c: true })).toBe("a c");
    });
  });

  describe("composition with arrays", () => {
    it("flattens a nested array of class names", () => {
      expect(cn(["a", "b"], "c")).toBe("a b c");
    });

    it("flattens arrays containing conditionals and objects", () => {
      expect(cn("base", ["nested", { active: true, hidden: false }])).toBe(
        "base nested active"
      );
    });

    it("resolves conflicts that arrive through an array", () => {
      expect(cn(["p-2"], "p-4")).toBe("p-4");
    });
  });
});