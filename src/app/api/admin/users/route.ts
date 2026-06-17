import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    include: {
      customers: {
        include: {
          customer: {
            select: { id: true, name: true }
          }
        }
      },
      apiKeys: {
        select: {
          id: true
        }
      }
    }
  });
  return NextResponse.json({ users });
}
