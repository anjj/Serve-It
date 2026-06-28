import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-utils";

export const GET = withAdmin(async () => {
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
});
