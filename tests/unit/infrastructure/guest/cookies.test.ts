import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  setGuestCookie,
  getGuestCookie,
  clearGuestCookie,
} from "@/infrastructure/guest/cookies";

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

describe("Guest cookie helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("setGuestCookie calls cookieStore.set with correct attributes", async () => {
    await setGuestCookie("guest-session-token-xyz");

    expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "venue_guest",
      "guest-session-token-xyz",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      })
    );
  });

  it("getGuestCookie returns the token when present", async () => {
    mockCookieStore.get.mockReturnValueOnce({ value: "active-guest-token" });

    const token = await getGuestCookie();

    expect(mockCookieStore.get).toHaveBeenCalledWith("venue_guest");
    expect(token).toBe("active-guest-token");
  });

  it("getGuestCookie returns null when the cookie is absent", async () => {
    mockCookieStore.get.mockReturnValueOnce(undefined);

    const token = await getGuestCookie();

    expect(mockCookieStore.get).toHaveBeenCalledWith("venue_guest");
    expect(token).toBeNull();
  });

  it("clearGuestCookie calls cookieStore.delete for venue_guest", async () => {
    await clearGuestCookie();

    expect(mockCookieStore.delete).toHaveBeenCalledTimes(1);
    expect(mockCookieStore.delete).toHaveBeenCalledWith("venue_guest");
  });
});
