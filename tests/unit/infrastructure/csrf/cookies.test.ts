import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setCsrfCookie,
  getCsrfCookie,
  clearCsrfCookie,
  CSRF_COOKIE_NAME,
  CSRF_MAX_AGE_SECONDS,
} from "@/infrastructure/csrf/cookies";

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: async () => mockCookieStore,
}));

describe("CSRF cookie helpers", () => {
  beforeEach(() => {
    mockCookieStore.set.mockReset();
    mockCookieStore.get.mockReset();
    mockCookieStore.delete.mockReset();
  });

  it("setCsrfCookie sets a non-HttpOnly SameSite=Lax cookie with the correct name and lifetime", async () => {
    await setCsrfCookie("test-token-uuid");
    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const call = mockCookieStore.set.mock.calls[0];
    expect(call).toBeDefined();
    if (!call) return;
    const [name, value, options] = call;
    expect(name).toBe(CSRF_COOKIE_NAME);
    expect(value).toBe("test-token-uuid");
    expect(options).toMatchObject({
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: CSRF_MAX_AGE_SECONDS,
    });
  });

  it("getCsrfCookie returns the cookie value when present", async () => {
    mockCookieStore.get.mockReturnValue({ value: "abc-123" });
    const value = await getCsrfCookie();
    expect(value).toBe("abc-123");
    expect(mockCookieStore.get).toHaveBeenCalledWith(CSRF_COOKIE_NAME);
  });

  it("getCsrfCookie returns null when the cookie is absent", async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const value = await getCsrfCookie();
    expect(value).toBeNull();
  });

  it("clearCsrfCookie deletes the cookie", async () => {
    await clearCsrfCookie();
    expect(mockCookieStore.delete).toHaveBeenCalledWith(CSRF_COOKIE_NAME);
  });
});
