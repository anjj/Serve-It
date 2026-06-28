import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

type RouteHandler = (
  req: Request,
  context: any,
  session: any
) => Promise<Response> | Response;

export function withAuth(handler: RouteHandler) {
  return async (req?: Request, context?: any) => {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const request = req || new Request("http://localhost");
    return handler(request, context || {}, session);
  };
}

export function withAdmin(handler: RouteHandler) {
  return async (req?: Request, context?: any) => {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const request = req || new Request("http://localhost");
    return handler(request, context || {}, session);
  };
}
