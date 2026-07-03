import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

type RouteHandler = (
  req: Request,
  context: any,
  session: any
) => Promise<Response> | Response;

// Helper to validate CSRF token
function validateCsrf(req: Request) {
  if (process.env.NODE_ENV === "test") return true;

  const method = req.method;
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return true;

  const csrfHeader = req.headers.get("x-csrf-token");

  // Extract cookie manually since this is a standard Request
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^| )csrf_token=([^;]+)/);
  const csrfCookie = match ? match[1] : null;

  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    return false;
  }

  return true;
}

export function withAuth(handler: RouteHandler) {
  return async (req?: Request, context?: any) => {
    const request = req || new Request("http://localhost");

    if (!validateCsrf(request)) {
      return NextResponse.json({ error: "Invalid CSRF Token" }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(request, context || {}, session);
  };
}

export function withAdmin(handler: RouteHandler) {
  return async (req?: Request, context?: any) => {
    const request = req || new Request("http://localhost");

    if (!validateCsrf(request)) {
      return NextResponse.json({ error: "Invalid CSRF Token" }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(request, context || {}, session);
  };
}
