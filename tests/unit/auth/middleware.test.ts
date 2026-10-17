import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../../../middleware";

describe("Edge Middleware Route Guards", () => {
  it("passes through request to /staff/login with no cookie", async () => {
    const request = new NextRequest(new URL("http://localhost:3000/staff/login"));
    const response = await middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects request to /staff/table with no cookie to /staff/login", async () => {
    const request = new NextRequest(new URL("http://localhost:3000/staff/table"));
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/staff/login");
  });

  it("redirects request to /admin with no cookie to /admin/login", async () => {
    const request = new NextRequest(new URL("http://localhost:3000/admin"));
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/admin/login");
  });

  it("redirects request to /kitchen/tickets with no cookie to /kitchen/login", async () => {
    const request = new NextRequest(new URL("http://localhost:3000/kitchen/tickets"));
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/kitchen/login");
  });

  it("passes through request to /admin with venue_staff cookie present", async () => {
    const request = new NextRequest(new URL("http://localhost:3000/admin"), {
      headers: {
        cookie: "venue_staff=valid-token-123",
      },
    });
    const response = await middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
