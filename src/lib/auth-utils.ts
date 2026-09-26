import { auth } from "@/lib/auth";
import { CUSTOMER_PORTAL_COOKIE, verifyCustomerPortalToken } from "@/lib/customer-portal-auth";

export type Actor =
  | { kind: "user"; userId: string; isAdmin: boolean; name: string | null; email: string }
  | { kind: "customer"; customerId: string; customerSlug: string };

function getCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get("cookie") || request.headers.get("Cookie") || "";
  return cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

/**
 * Resolves the caller to exactly one of two independent grant paths: a real
 * User (via better-auth session) or a Customer Portal shared-password login
 * (via its own signed cookie). See docs/domains/auth.md for why these are
 * deliberately separate rather than unified into one session type.
 */
export async function resolveActor(request: Request): Promise<Actor | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (session) {
    return {
      kind: "user",
      userId: session.user.id,
      isAdmin: Boolean(session.user.isAdmin),
      name: session.user.name ?? null,
      email: session.user.email,
    };
  }

  const token = getCookie(request, CUSTOMER_PORTAL_COOKIE);
  const payload = verifyCustomerPortalToken(token);
  if (payload) {
    return { kind: "customer", customerId: payload.customerId, customerSlug: payload.slug };
  }

  return null;
}

type ServerRouteCtx = { request: Request; params: unknown };
type RouteHandler<TCtx extends ServerRouteCtx> = (ctx: TCtx, actor: Actor) => Promise<Response> | Response;

/** Wraps a TanStack Start server route handler so it only runs for a resolved actor (user or customer portal). */
export function withAuth<TCtx extends ServerRouteCtx>(handler: RouteHandler<TCtx>) {
  return async (ctx: TCtx) => {
    const actor = await resolveActor(ctx.request);
    if (!actor) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(ctx, actor);
  };
}

/** Wraps a TanStack Start server route handler so it only runs for an authenticated admin user. */
export function withAdmin<TCtx extends ServerRouteCtx>(handler: RouteHandler<TCtx>) {
  return async (ctx: TCtx) => {
    const actor = await resolveActor(ctx.request);
    if (!actor || actor.kind !== "user" || !actor.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(ctx, actor);
  };
}
