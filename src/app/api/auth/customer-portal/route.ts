import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  CUSTOMER_PORTAL_COOKIE,
  customerPortalCookieOptions,
  signCustomerPortalToken,
  verifyCustomerPortalToken,
} from "@/lib/customer-portal-auth";

export async function POST(req: Request) {
  let data;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { slug, password } = data;
  if (!slug || !password) {
    return NextResponse.json({ error: "Missing slug or password" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { slug } });
  if (!customer || !customer.isActive || !customer.passwordHash) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, customer.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signCustomerPortalToken(customer.id, customer.slug);
  const response = NextResponse.json({ success: true, slug: customer.slug });
  response.cookies.set(CUSTOMER_PORTAL_COOKIE, token, customerPortalCookieOptions);
  return response;
}

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const token = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CUSTOMER_PORTAL_COOKIE}=`))
    ?.slice(CUSTOMER_PORTAL_COOKIE.length + 1);

  const payload = verifyCustomerPortalToken(token);
  if (!payload) return NextResponse.json({ session: null });
  return NextResponse.json({ session: { customerId: payload.customerId, slug: payload.slug } });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(CUSTOMER_PORTAL_COOKIE, "", { ...customerPortalCookieOptions, maxAge: 0 });
  return response;
}
