import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-utils";

export const POST = withAdmin(async (req: Request) => {
  let data;
  try {
    const text = await req.text();
    data = JSON.parse(text);
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { userId, isAdmin } = data;
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isAdmin }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
