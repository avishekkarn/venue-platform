/**
 * The withAudit higher-order wrapper.
 *
 * Phase 7.7.1a. 7.7.1b adds the export route; 7.7.1c applies this wrapper to
 * the gold-standard route (`POST /api/admin/qr/generate`); 7.7.1d verifies
 * end-to-end and downloads the ZIP. Every Phase 8 admin route will use this
 * wrapper (WIRING.md W-0021).
 *
 * The wrapper's contract:
 *
 *   withAudit(resolvers, meta, handler) returns a handler with the same
 *   (request: NextRequest) => Promise<NextResponse> signature. Calling the
 *   wrapped handler:
 *     - records the start time,
 *     - resolves the actor from the two resolvers,
 *     - calls the original handler,
 *     - records the end time,
 *     - writes one audit line (`writeAudit`),
 *     - returns the handler's response unchanged.
 *
 * Failure discipline:
 *   If the handler throws, the wrapper catches the error, logs it to
 *   `console.error`, writes an audit line with status 500, and returns a
 *   standard `INTERNAL` envelope. This matches `SYSTEM.md §16.3` ("only
 *   true programming errors are caught, and they return a generic 500 with
 *   a server-side log").
 *
 *   If `writeAudit` fails (disk full, permissions), `writeAudit`'s own
 *   catch swallows the failure (see `logger.ts`). The wrapper does not
 *   re-catch; the handler's response is returned regardless.
 *
 * Trust boundary:
 *   The wrapper never trusts a client-supplied value for `actorId`,
 *   `actorRole`, or `venueId`. Those come from the resolvers, which are the
 *   real cookie accessors' wrappers. A client cannot forge an audit line
 *   (SYSTEM.md §15.1, §15.2).
 *
 * Reference: ROADMAP.md §11 (Milestone 7.7.1a), WIRING.md W-0021,
 * SYSTEM.md §15.1, SYSTEM.md §16.3.
 */

import type { NextRequest, NextResponse } from "next/server";
import { actorFromSession, writeAudit, type ActorResolvers, type AuditAudience, type AuditActorType } from "./logger";

/**
 * Resolves the audit log audience classification (D-9.17).
 */
export function resolveAuditAudience(route: string, actorType: AuditActorType): AuditAudience {
  if (actorType === "guest" || route.startsWith("/api/guest")) return "USER";
  if (route.startsWith("/api/admin")) return "ADMIN";
  if (route.startsWith("/api/staff") || route.startsWith("/api/kitchen")) return "STAFF";
  return "SYSTEM";
}

/**
 * The shape a wrapped route handler must have. Next.js's route handlers are
 * exactly `(request: NextRequest) => Promise<NextResponse>` for non-dynamic
 * routes. The variant `withAuditedDynamicRoute` was introduced at 8.3.0.F;
 * it is first used by POST /api/admin/menu/items/[id]/state; the variant's test
 * is in with-audit.test.ts. This wrapper covers the non-dynamic case.
 */
export type AuditedRouteHandler = (
  request: NextRequest
) => Promise<NextResponse>;

/**
 * The fixed metadata for a wrapped route. `route` is the audit log's path
 * string (e.g. "/api/admin/qr/generate"); `method` is the HTTP verb. These
 * are supplied by the caller because Next.js does not expose them to the
 * handler itself.
 */
export interface AuditMeta {
  readonly route: string;
  readonly method: string;
}

/**
 * The wrapper. Constructs the audited handler.
 *
 * The resolvers are supplied by the caller (the route file) so this module
 * does not import `next/headers`, `getSessionCookie`, `validateSession`, or
 * Prisma. The route file owns those imports. This keeps the wrapper free of
 * the auth and DB layers and testable with synthetic resolvers (which is
 * exactly how `with-audit.test.ts` proves it).
 *
 * The client IP is read from `x-forwarded-for` (first value) or
 * `x-real-ip`, or `null` if neither is present. `NextRequest` does not
 * expose `request.ip` in this Next.js version. The reading is best-effort;
 * an absent header is not an error.
 */
export function withAudit(
  resolvers: ActorResolvers,
  meta: AuditMeta,
  handler: AuditedRouteHandler
): AuditedRouteHandler {
  return async function auditedHandler(
    request: NextRequest
  ): Promise<NextResponse> {
    const start = Date.now();
    const actor = await actorFromSession(resolvers);

    let response: NextResponse;
    let caught: unknown = null;

    try {
      response = await handler(request);
    } catch (err) {
      caught = err;
      console.error(`[audit] ${meta.method} ${meta.route} threw`, err);
      response = new Response(
        JSON.stringify({
          error: {
            code: "INTERNAL",
            message: "An unexpected error occurred",
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      ) as unknown as NextResponse;
    }

    const latencyMs = Date.now() - start;

    writeAudit({
      timestamp: new Date(start).toISOString(),
      audience: resolveAuditAudience(meta.route, actor.actorType),
      actorType: actor.actorType,
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      venueId: actor.venueId,
      route: meta.route,
      method: meta.method,
      status: response.status,
      latencyMs,
      ip: extractClientIp(request),
    });

    // `caught` is read only for its side effect of console.error; the error
    // itself is not propagated. Reference its value so a future strict
    // "unused variable" rule does not flag it.
    if (caught !== null) {
      // Deliberate: the error has already been logged and the 500 response
      // returned. Nothing more to do.
    }

    return response;
  };
}

/**
 * The dynamic-route variant of `withAudit` (D-24.1).
 *
 * The non-dynamic wrapper above takes a one-argument handler. A dynamic
 * route's handler is two-argument: `(request, context: { params: Promise<TParams> })`.
 * This variant preserves that shape — it calls the handler with both
 * arguments, so `context.params` reaches the route — and writes the same
 * audit line. The existing `withAudit` is unchanged.
 *
 * The body mirrors `withAudit` exactly: start time, `actorFromSession`,
 * the handler call in try/catch (a throw → console.error + a 500 envelope),
 * `writeAudit`, the response returned unchanged. The two must stay in sync;
 * a future refactor may share the inner logic, but for now the duplication
 * is honest and both are proven by tests.
 *
 * Reference: DECISIONS.md D-24.1, BUILD.md §6.11, WIRING.md W-0021.
 * Introduced at 8.3.0.F; first used by POST /api/admin/menu/items/[id]/state.
 */
export type AuditedDynamicRouteHandler<TParams> = (
  request: NextRequest,
  context: { params: Promise<TParams> }
) => Promise<NextResponse>;

export function withAuditedDynamicRoute<TParams>(
  resolvers: ActorResolvers,
  meta: AuditMeta,
  handler: AuditedDynamicRouteHandler<TParams>
): AuditedDynamicRouteHandler<TParams> {
  return async function auditedDynamicHandler(
    request: NextRequest,
    context: { params: Promise<TParams> }
  ): Promise<NextResponse> {
    const start = Date.now();
    const actor = await actorFromSession(resolvers);

    let response: NextResponse;
    try {
      response = await handler(request, context);
    } catch (err) {
      console.error(`[audit] ${meta.method} ${meta.route} threw`, err);
      response = new Response(
        JSON.stringify({
          error: { code: "INTERNAL", message: "An unexpected error occurred" },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      ) as unknown as NextResponse;
    }

    const latencyMs = Date.now() - start;
    writeAudit({
      timestamp: new Date(start).toISOString(),
      audience: resolveAuditAudience(meta.route, actor.actorType),
      actorType: actor.actorType,
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      venueId: actor.venueId,
      route: meta.route,
      method: meta.method,
      status: response.status,
      latencyMs,
      ip: extractClientIp(request),
    });
    return response;
  };
}

/**
 * Best-effort client IP extraction. Returns the first `x-forwarded-for`
 * hop, else `x-real-ip`, else `null`. A proxy that strips both headers is
 * not an error — the audit line records `ip: null`.
 */
function extractClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0];
    if (first) {
      const trimmed = first.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  const real = request.headers.get("x-real-ip");
  if (real) {
    const trimmed = real.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return null;
}

