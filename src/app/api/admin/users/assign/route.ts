import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId, customerId } = await req.json();
  try {
    await prisma.userCustomer.create({ data: { userId, customerId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
