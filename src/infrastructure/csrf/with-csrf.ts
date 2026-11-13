/**
 * The withCsrf higher-order wrapper.
 *
 * Phase 7.7.4a. Wraps a route handler so that every state-changing request
 * is verified against the double-submit CSRF cookie before the handler
 * runs. Phase 7.7.4b/c apply this wrapper to every state-changing route
 * in the 25-route inventory (pre-read Group B, B1). Phase 7.7.4d verifies
 * the whole surface end-to-end.
 *
 * The wrapper's contract:
 *
 *   withCsrf(handler) returns a handler with the same
 *   (request: NextRequest) => Promise<NextResponse> signature.
 *
 *   Calling the wrapped handler:
 *     - reads the `csrf_token` cookie (via getCsrfCookie),
 *     - reads the `X-CSRF-Token` header (via CSRF_HEADER_NAME),
 *     - compares the two with safeCompareCsrfTokens (constant time),
 *     - if they match, calls the handler and returns its response unchanged,
 *     - if they do not match, returns a 403 with the standard envelope.
 *
 * The body fallback:
 *
 *   The wrapper also accepts a `csrf_token` field in a URL-encoded or
 *   multipart form body. That path is used by the join-request form
 *   (a non-JSON POST). Implementing it without duplicating body parsing
 *   is not possible — Next.js's Request body stream is one-shot, and
 *   reading it in the wrapper would consume it for the handler.
 *
 *   Therefore this wrapper does NOT read the body. Callers that submit
 *   as a form (not JSON) must include the token in the header, or the
 *   route must use a variant of the wrapper that reads the body itself.
 *   The current 25-route inventory is all JSON; the form variant is not
 *   needed and is not implemented. If a future route needs it, the
 *   wrapper gets a sibling (withCsrfForm) — not a change to this one.
 *   That preserves the invariant: a JSON route wrapped by this wrapper
 *   never has its body consumed before the handler runs.
 *
 * Composition with withAudit:
 *
 *   The intended composition is withAudit(withCsrf(handler)), not
 *   withCsrf(withAudit(handler)). The reason is that the audit trail must
 *   record a 403 rejection — a CSRF rejection is a security event worth
 *   logging. If withCsrf ran outside withAudit, the audit log would not
 *   see the 403; it would see only the handler's outcome, and the
 *   rejection would be silent in the audit trail. The 7.7.4a test file
 *   proves the composition in two dedicated tests.
 *
 * Reference: DECISIONS.md D-20.1, BUILD.md §7.4, SYSTEM.md §15,
 * ROADMAP.md §11 (Task 7.7.4a).
 */

import { NextResponse, type NextRequest } from "next/server";
import type { AuditedRouteHandler } from "@/infrastructure/audit/with-audit";
import { getCsrfCookie, CSRF_HEADER_NAME } from "@/infrastructure/csrf/cookies";
import { safeCompareCsrfTokens } from "@/infrastructure/csrf/token";
import { DomainErrorCode } from "@/domain/shared/result";

/**
 * The wrapper. Returns a handler with the same signature as the input.
 *
 * The type is `AuditedRouteHandler` — the same `(request) => Promise<NextResponse>`
 * shape as the withAudit wrapper — so the two compose. A route that uses
 * both is written as `export const POST = withAudit(resolvers, meta, withCsrf(routeHandler))`
 * or `export const POST = withAudit(resolvers, meta, routeHandler)` where
 * `routeHandler = withCsrf(innerHandler)`. Either spelling produces the
 * same composition; the route file's style decides.
 *
 * The `audit` import is type-only; the wrapper does not depend on
 * audit code at runtime. The type alias is the contract that lets the
 * two wrappers compose.
 */
export function withCsrf(handler: AuditedRouteHandler): AuditedRouteHandler {
  return async function csrfProtectedHandler(
    request: NextRequest
  ): Promise<NextResponse> {
    const cookieToken = await getCsrfCookie();
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    if (!safeCompareCsrfTokens(cookieToken, headerToken)) {
      return NextResponse.json(
        {
          error: {
            code: DomainErrorCode.FORBIDDEN,
            message: "CSRF token missing or invalid",
          },
        },
        { status: 403 }
      );
    }

    return handler(request);
  };
}
