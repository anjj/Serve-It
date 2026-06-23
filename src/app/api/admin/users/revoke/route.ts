import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-utils";

export const POST = withAdmin(async (req: Request) => {
  const { userId, customerId } = await req.json();
  try {
    await prisma.userCustomer.delete({ where: { userId_customerId: { userId, customerId } } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
