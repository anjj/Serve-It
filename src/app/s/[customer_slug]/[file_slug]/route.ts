import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadFile } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: Promise<{ customer_slug: string; file_slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.redirect(new URL("/auth/signin", req.url));

  const resolvedParams = await params;
  const { customer_slug, file_slug } = resolvedParams;
  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).isAdmin;

  try {
    const customer = await prisma.customer.findUnique({ where: { slug: customer_slug }, include: { users: { where: { userId } } } });
    if (!customer) return new NextResponse("Workspace not found", { status: 404 });
    if (!isAdmin && customer.users.length === 0) return new NextResponse("Access Denied to Workspace", { status: 403 });

    const file = await prisma.file.findUnique({ where: { customerId_slug: { customerId: customer.id, slug: file_slug } } });
    if (!file) return new NextResponse("File not found", { status: 404 });

    const blob = await downloadFile(file.storagePath);
    const htmlContent = await blob.text();

    return new NextResponse(htmlContent, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, max-age=0, must-revalidate", "X-Content-Type-Options": "nosniff" } });
  } catch (error: any) {
    return new NextResponse(`Error serving file: ${error.message}`, { status: 500 });
  }
}
