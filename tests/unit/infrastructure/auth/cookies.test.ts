import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  setSessionCookie,
  getSessionCookie,
  clearSessionCookie,
} from "@/infrastructure/auth/cookies";

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

describe("Session cookie helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("setSessionCookie calls cookieStore.set with correct attributes", async () => {
    await setSessionCookie("test-token-123");

    expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "venue_staff",
      "test-token-123",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      })
    );
  });

  it("getSessionCookie returns token if cookie exists and null if it does not", async () => {
    mockCookieStore.get.mockReturnValueOnce({ value: "existing-token" });
    const token = await getSessionCookie();
    expect(mockCookieStore.get).toHaveBeenCalledWith("venue_staff");
    expect(token).toBe("existing-token");

    mockCookieStore.get.mockReturnValueOnce(undefined);
    const missingToken = await getSessionCookie();
    expect(missingToken).toBeNull();
  });

  it("clearSessionCookie calls cookieStore.delete for venue_staff", async () => {
    await clearSessionCookie();

    expect(mockCookieStore.delete).toHaveBeenCalledTimes(1);
    expect(mockCookieStore.delete).toHaveBeenCalledWith("venue_staff");
  });
});
