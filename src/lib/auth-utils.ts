import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CUSTOMER_PORTAL_COOKIE, verifyCustomerPortalToken } from "@/lib/customer-portal-auth";

export type Actor =
  | { kind: "user"; userId: string; isAdmin: boolean; name: string | null; email: string }
  | { kind: "customer"; customerId: string; customerSlug: string };

function getCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

/**
 * Resolves the caller to exactly one of two independent grant paths:
 * a real User (via better-auth session) or a Customer Portal shared-password
 * login (via its own signed cookie). See docs/domains/auth.md for why these
 * are deliberately separate rather than unified into one session type.
 */
export async function resolveActor(req: Request): Promise<Actor | null> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (session) {
    return {
      kind: "user",
      userId: session.user.id,
      isAdmin: Boolean((session.user as any).isAdmin),
      name: session.user.name ?? null,
      email: session.user.email,
    };
  }

  const token = getCookie(req, CUSTOMER_PORTAL_COOKIE);
  const payload = verifyCustomerPortalToken(token);
  if (payload) {
    return { kind: "customer", customerId: payload.customerId, customerSlug: payload.slug };
  }

  return null;
}

type RouteHandler = (
  req: Request,
  context: any,
  actor: Actor
) => Promise<Response> | Response;

export function withAuth(handler: RouteHandler) {
  return async (req?: Request, context?: any) => {
    const request = req || new Request("http://localhost");
    const actor = await resolveActor(request);
    if (!actor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(request, context || {}, actor);
  };
}

export function withAdmin(handler: RouteHandler) {
  return async (req?: Request, context?: any) => {
    const request = req || new Request("http://localhost");
    const actor = await resolveActor(request);
    if (!actor || actor.kind !== "user" || !actor.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(request, context || {}, actor);
  };
}
