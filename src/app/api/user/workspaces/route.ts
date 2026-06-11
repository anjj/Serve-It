import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).isAdmin;

  try {
    let customers;
    if (isAdmin) {
      customers = await prisma.customer.findMany({
        where: { isActive: true }, select: { id: true, name: true, slug: true }, orderBy: { name: "asc" },
      });
    } else {
      const userCustomers = await prisma.userCustomer.findMany({
        where: { userId }, include: { customer: { select: { id: true, name: true, slug: true } } },
      });
      customers = userCustomers.map((uc) => uc.customer).filter((c) => c !== null).sort((a, b) => a.name.localeCompare(b.name));
    }
    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
