import { createFileRoute } from "@tanstack/react-router";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  customerPortalSetCookieHeader,
  customerPortalClearCookieHeader,
  getCustomerPortalCookie,
  signCustomerPortalToken,
  verifyCustomerPortalToken,
} from "@/lib/customer-portal-auth";
import { parseJsonBody } from "@/lib/http";

export const POST = async ({ request }: { request: Request }) => {
  const data = (await parseJsonBody(request)) as { slug?: string; password?: string } | null;
  if (!data) return Response.json({ error: "Invalid JSON payload" }, { status: 400 });

  const { slug, password } = data;
  if (!slug || !password) {
    return Response.json({ error: "Missing slug or password" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { slug } });
  if (!customer || !customer.isActive || !customer.passwordHash) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, customer.passwordHash);
  if (!isValid) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signCustomerPortalToken(customer.id, customer.slug);
  return Response.json(
    { success: true, slug: customer.slug },
    { headers: { "Set-Cookie": customerPortalSetCookieHeader(token) } },
  );
};

export const GET = async ({ request }: { request: Request }) => {
  const token = getCustomerPortalCookie(request);
  const payload = verifyCustomerPortalToken(token);
  if (!payload) return Response.json({ session: null });

  try {
    const customer = await prisma.customer.findUnique({ where: { id: payload.customerId } });
    if (!customer || !customer.isActive) {
      return Response.json({ session: null });
    }
    return Response.json({ session: { customerId: payload.customerId, slug: payload.slug } });
  } catch (error) {
    console.error("GET customer-portal error:", error);
    return Response.json({ session: null });
  }
};

export const DELETE = async () => {
  return Response.json(
    { success: true },
    { headers: { "Set-Cookie": customerPortalClearCookieHeader() } },
  );
};

export const Route = createFileRoute("/api/auth/customer-portal")({
  server: { handlers: { GET, POST, DELETE } },
});
