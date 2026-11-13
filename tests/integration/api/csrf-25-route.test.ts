import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

import { POST as adminMenuItemStatePOST } from "@/../app/api/admin/menu/items/[id]/state/route";
import { POST as adminQrRevokePOST } from "@/../app/api/admin/qr/[id]/revoke/route";
import { POST as adminQrGeneratePOST } from "@/../app/api/admin/qr/generate/route";
import { POST as loginPOST } from "@/../app/api/auth/login/route";
import { POST as logoutPOST } from "@/../app/api/auth/logout/route";
import { POST as guestCallPOST } from "@/../app/api/guest/call/route";
import { POST as guestJoinRequestPOST } from "@/../app/api/guest/join-requests/route";
import { POST as guestJoinApprovePOST } from "@/../app/api/guest/join-requests/[id]/approve/route";
import { POST as guestJoinDeclinePOST } from "@/../app/api/guest/join-requests/[id]/decline/route";
import { POST as guestJoinRecoverPOST } from "@/../app/api/guest/join-requests/recover/route";
import { POST as guestOrdersPOST } from "@/../app/api/guest/orders/route";
import { POST as guestRequestsPOST } from "@/../app/api/guest/requests/route";
import { PATCH as guestRequestPatchPATCH } from "@/../app/api/guest/requests/[id]/route";
import { POST as guestRequestCancelPOST } from "@/../app/api/guest/requests/[id]/cancel/route";
import { POST as kitchenReadyPOST } from "@/../app/api/kitchen/orders/[id]/ready/route";
import { POST as kitchenStartPOST } from "@/../app/api/kitchen/orders/[id]/start/route";
import { POST as staffOrderApprovePOST } from "@/../app/api/staff/orders/[id]/approve/route";
import { POST as staffOrderCancelPOST } from "@/../app/api/staff/orders/[id]/cancel/route";
import { POST as staffOrderCompletePOST } from "@/../app/api/staff/orders/[id]/complete/route";
import { POST as staffOrderDeliverPOST } from "@/../app/api/staff/orders/[id]/deliver/route";
import { POST as staffRequestAdvancePOST } from "@/../app/api/staff/requests/[id]/advance/route";
import { POST as staffRequestCancelPOST } from "@/../app/api/staff/requests/[id]/cancel/route";
import { POST as staffRequestDeclinePOST } from "@/../app/api/staff/requests/[id]/decline/route";
import { POST as staffRoomCheckoutPOST } from "@/../app/api/staff/rooms/[id]/checkout/route";
import { POST as staffTableClosePOST } from "@/../app/api/staff/tables/[id]/close/route";

vi.mock("@/infrastructure/auth/cookies", () => ({
  getSessionCookie: vi.fn(),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock("@/infrastructure/csrf/cookies", async () => {
  const actual = await vi.importActual<typeof import("@/infrastructure/csrf/cookies")>(
    "@/infrastructure/csrf/cookies"
  );
  return {
    ...actual,
    getCsrfCookie: vi.fn(),
  };
});

import { getCsrfCookie } from "@/infrastructure/csrf/cookies";

const CSRF_FORBIDDEN = {
  status: 403,
  code: "FORBIDDEN",
  message: "CSRF token missing or invalid",
} as const;

async function expectCsrfRejection(response: Response): Promise<void> {
  expect(response.status).toBe(CSRF_FORBIDDEN.status);
  const json = (await response.json()) as { error: { code: string; message: string } };
  expect(json.error.code).toBe(CSRF_FORBIDDEN.code);
  expect(json.error.message).toBe(CSRF_FORBIDDEN.message);
}

describe("CSRF enforcement on the 25-route state-changing surface (D-20.1, 7.7.4d)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");
  });

  // 1
  it("admin/menu/items/[id]/state rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest(`http://localhost/api/admin/menu/items/${id}/state`, { method: "POST" });
    const res = await adminMenuItemStatePOST(req, { params: Promise.resolve({ id }) });
    await expectCsrfRejection(res);
  });

  // 2
  it("admin/qr/[id]/revoke rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest(`http://localhost/api/admin/qr/${id}/revoke`, { method: "POST" });
    const res = await adminQrRevokePOST(req, { params: Promise.resolve({ id }) });
    await expectCsrfRejection(res);
  });

  // 3
  it("admin/qr/generate rejects without X-CSRF-Token", async () => {
    const req = new NextRequest("http://localhost/api/admin/qr/generate", { method: "POST" });
    const res = await adminQrGeneratePOST(req);
    await expectCsrfRejection(res);
  });

  // 4
  it("auth/login rejects without X-CSRF-Token", async () => {
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "x", password: "y" }),
    });
    const res = await loginPOST(req);
    await expectCsrfRejection(res);
  });

  // 5
  it("auth/logout rejects without X-CSRF-Token", async () => {
    const req = new NextRequest("http://localhost/api/auth/logout", { method: "POST" });
    const res = await logoutPOST(req);
    await expectCsrfRejection(res);
  });

  // 6
  it("guest/call rejects without X-CSRF-Token", async () => {
    const req = new NextRequest("http://localhost/api/guest/call", { method: "POST" });
    const res = await guestCallPOST(req);
    await expectCsrfRejection(res);
  });

  // 7
  it("guest/join-requests rejects without X-CSRF-Token", async () => {
    const req = new NextRequest("http://localhost/api/guest/join-requests", { method: "POST" });
    const res = await guestJoinRequestPOST(req);
    await expectCsrfRejection(res);
  });

  // 8
  it("guest/join-requests/[id]/approve rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest(`http://localhost/api/guest/join-requests/${id}/approve`, { method: "POST" });
    const res = await guestJoinApprovePOST(req, { params: Promise.resolve({ id }) });
    await expectCsrfRejection(res);
  });

  // 9
  it("guest/join-requests/[id]/decline rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest(`http://localhost/api/guest/join-requests/${id}/decline`, { method: "POST" });
    const res = await guestJoinDeclinePOST(req, { params: Promise.resolve({ id }) });
    await expectCsrfRejection(res);
  });

  // 10
  it("guest/join-requests/recover rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest("http://localhost/api/guest/join-requests/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: id, hostToken: "test-host-token" }),
    });
    const res = await guestJoinRecoverPOST(req);
    await expectCsrfRejection(res);
  });

  // 11
  it("guest/orders rejects without X-CSRF-Token", async () => {
    const req = new NextRequest("http://localhost/api/guest/orders", { method: "POST" });
    const res = await guestOrdersPOST(req);
    await expectCsrfRejection(res);
  });

  // 12
  it("guest/requests rejects without X-CSRF-Token", async () => {
    const req = new NextRequest("http://localhost/api/guest/requests", { method: "POST" });
    const res = await guestRequestsPOST(req);
    await expectCsrfRejection(res);
  });

  // 13
  it("guest/requests/[id] rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest(`http://localhost/api/guest/requests/${id}`, { method: "PATCH" });
    const res = await guestRequestPatchPATCH(req, { params: Promise.resolve({ id }) });
    await expectCsrfRejection(res);
  });

  // 14
  it("guest/requests/[id]/cancel rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest(`http://localhost/api/guest/requests/${id}/cancel`, { method: "POST" });
    const res = await guestRequestCancelPOST(req, { params: Promise.resolve({ id }) });
    await expectCsrfRejection(res);
  });

  // 15
  it("kitchen/orders/[id]/ready rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest(`http://localhost/api/kitchen/orders/${id}/ready`, { method: "POST" });
    const res = await kitchenReadyPOST(req, { params: Promise.resolve({ id }) });
    await expectCsrfRejection(res);
  });

  // 16
  it("kitchen/orders/[id]/start rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest(`http://localhost/api/kitchen/orders/${id}/start`, { method: "POST" });
    const res = await kitchenStartPOST(req, { params: Promise.resolve({ id }) });
    await expectCsrfRejection(res);
  });

  // 17
  it("staff/orders/[id]/approve rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest(`http://localhost/api/staff/orders/${id}/approve`, { method: "POST" });
    const res = await staffOrderApprovePOST(req, { params: Promise.resolve({ id }) });
    await expectCsrfRejection(res);
  });

  // 18
  it("staff/orders/[id]/cancel rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest(`http://localhost/api/staff/orders/${id}/cancel`, { method: "POST" });
    const res = await staffOrderCancelPOST(req, { params: Promise.resolve({ id }) });
    await expectCsrfRejection(res);
  });

  // 19
  it("staff/orders/[id]/complete rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest(`http://localhost/api/staff/orders/${id}/complete`, { method: "POST" });
    const res = await staffOrderCompletePOST(req, { params: Promise.resolve({ id }) });
    await expectCsrfRejection(res);
  });

  // 20
  it("staff/orders/[id]/deliver rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest(`http://localhost/api/staff/orders/${id}/deliver`, { method: "POST" });
    const res = await staffOrderDeliverPOST(req, { params: Promise.resolve({ id }) });
    await expectCsrfRejection(res);
  });

  // 21
  it("staff/requests/[id]/advance rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest(`http://localhost/api/staff/requests/${id}/advance`, { method: "POST" });
    const res = await staffRequestAdvancePOST(req, { params: Promise.resolve({ id }) });
    await expectCsrfRejection(res);
  });

  // 22
  it("staff/requests/[id]/cancel rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest(`http://localhost/api/staff/requests/${id}/cancel`, { method: "POST" });
    const res = await staffRequestCancelPOST(req, { params: Promise.resolve({ id }) });
    await expectCsrfRejection(res);
  });

  // 23
  it("staff/requests/[id]/decline rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest(`http://localhost/api/staff/requests/${id}/decline`, { method: "POST" });
    const res = await staffRequestDeclinePOST(req, { params: Promise.resolve({ id }) });
    await expectCsrfRejection(res);
  });

  // 24
  it("staff/rooms/[id]/checkout rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest(`http://localhost/api/staff/rooms/${id}/checkout`, { method: "POST" });
    const res = await staffRoomCheckoutPOST(req, { params: Promise.resolve({ id }) });
    await expectCsrfRejection(res);
  });

  // 25
  it("staff/tables/[id]/close rejects without X-CSRF-Token", async () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const req = new NextRequest(`http://localhost/api/staff/tables/${id}/close`, { method: "POST" });
    const res = await staffTableClosePOST(req, { params: Promise.resolve({ id }) });
    await expectCsrfRejection(res);
  });
});
