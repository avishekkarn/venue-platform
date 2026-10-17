import { describe, it, expect } from "vitest";
import { areaToRoute, AREA_TO_ROUTE } from "../../../app/staff/login/_redirect-map";
import type { Area } from "@/domain/auth/can-access";

describe("areaToRoute and AREA_TO_ROUTE", () => {
  it("maps every Area to a non-empty string starting with /", () => {
    for (const key of Object.keys(AREA_TO_ROUTE) as Area[]) {
      const route = AREA_TO_ROUTE[key];
      expect(typeof route).toBe("string");
      expect(route.length).toBeGreaterThan(0);
      expect(route.startsWith("/")).toBe(true);
    }
  });

  it("is exhaustive across all 10 Area union members", () => {
    const keys = Object.keys(AREA_TO_ROUTE);
    expect(keys.length).toBe(10);
    expect(keys).toEqual(
      expect.arrayContaining([
        "admin",
        "kitchen",
        "table-service",
        "room-service",
        "housekeeping",
        "maintenance",
        "concierge",
        "laundry",
        "spa",
        "front-desk",
      ])
    );
  });

  it("ensures the areaToRoute function agrees with the AREA_TO_ROUTE map for every key", () => {
    for (const key of Object.keys(AREA_TO_ROUTE) as Area[]) {
      expect(areaToRoute(key)).toBe(AREA_TO_ROUTE[key]);
    }
  });

  it("routes admin and kitchen exactly", () => {
    expect(areaToRoute("admin")).toBe("/admin");
    expect(areaToRoute("kitchen")).toBe("/kitchen");
  });

  it("routes all service areas under /staff/", () => {
    expect(areaToRoute("table-service")).toBe("/staff/table");
    expect(areaToRoute("room-service")).toBe("/staff/room");
    expect(areaToRoute("housekeeping")).toBe("/staff/housekeeping");
    expect(areaToRoute("maintenance")).toBe("/staff/maintenance");
    expect(areaToRoute("concierge")).toBe("/staff/concierge");
    expect(areaToRoute("laundry")).toBe("/staff/laundry");
    expect(areaToRoute("spa")).toBe("/staff/spa");
    expect(areaToRoute("front-desk")).toBe("/staff/front-desk");
  });
});
