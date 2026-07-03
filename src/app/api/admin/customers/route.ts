import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { withAdmin } from "@/lib/auth-utils";

export const GET = withAdmin(async () => {
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ customers });
});

export const POST = withAdmin(async (req: Request) => {
  let body;
  try {
    const text = await req.text();
    body = JSON.parse(text);
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { name, slug, password } = body;
  if (!name || !slug || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
    return NextResponse.json({ error: "Invalid slug format. Only alphanumeric characters, dashes, and underscores are allowed." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await prisma.customer.create({ data: { name, slug, passwordHash } });
    return NextResponse.json({ customer });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
