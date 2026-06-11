import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ customer_slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  const customer_slug = resolvedParams.customer_slug;
  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).isAdmin;

  try {
    const customer = await prisma.customer.findUnique({ where: { slug: customer_slug }, include: { users: { where: { userId } } } });
    if (!customer) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    if (!isAdmin && customer.users.length === 0) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const files = await prisma.file.findMany({ where: { customerId: customer.id }, select: { id: true, title: true, slug: true, tags: true, createdAt: true }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
