import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  GET as getServiceStates,
  setTestDbClient,
} from "@/../app/api/guest/services/states/route";
import { withTransaction } from "../setup";
import { PlaceType } from "@/domain/requests/request.repository";
import { MenuItemState } from "@/domain/menu/menu.repository";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";

vi.mock("@/infrastructure/guest/cookies", () => ({
  getGuestCookie: vi.fn(),
  setGuestCookie: vi.fn(),
  clearGuestCookie: vi.fn(),
}));

import { getGuestCookie } from "@/infrastructure/guest/cookies";

describe("Guest Services States Polling Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setTestDbClient(null);
  });

  it("Test 1: GET /api/guest/services/states returns 401 when no session cookie", async () => {
    vi.mocked(getGuestCookie).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/guest/services/states");
    const res = await getServiceStates(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("Test 2: GET /api/guest/services/states returns active items and signature for session venue", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Services State Polling Hotel",
          slug: `services-states-${Date.now()}`,
          taxRate: "0.1000",
        },
      });

      const room = await tx.room.create({
        data: {
          venueId: venue.id,
          number: "701",
        },
      });

      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        placeId: room.id,
      });
      if (!sessionResult.ok) throw new Error("Failed to create session");
      vi.mocked(getGuestCookie).mockResolvedValue(sessionResult.value.token);

      const category = await tx.serviceCategory.create({
        data: {
          venueId: venue.id,
          name: "Wellness",
          sortOrder: 0,
        },
      });

      const item = await tx.serviceItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Deep Tissue Massage",
          price: "700.00",
          state: MenuItemState.AVAILABLE,
          estimatedMinutes: 60,
        },
      });

      const req = new NextRequest("http://localhost/api/guest/services/states");
      const res = await getServiceStates(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      const massage = body.data.find((i: { id: string }) => i.id === item.id);
      expect(massage).toBeDefined();
      expect(massage.state).toBe(MenuItemState.AVAILABLE);
      expect(massage.price).toBe("700.00");
      expect(massage.estimatedMinutes).toBe(60);
      expect(typeof body.signature).toBe("string");
      expect(body.signature).toContain(category.id);
      expect(body.signature).toContain(item.id);
    });
  });
});
