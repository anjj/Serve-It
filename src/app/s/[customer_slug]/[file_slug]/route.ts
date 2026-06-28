import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadFile } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: Promise<{ customer_slug: string; file_slug: string }> }) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await params;
  const { customer_slug, file_slug } = resolvedParams;

  if (!session || !session.user) {
    const baseUrl = process.env.NEXTAUTH_URL || req.url;
    const loginUrl = new URL("/auth/signin", baseUrl);
    loginUrl.searchParams.set("callbackUrl", `/s/${customer_slug}/${file_slug}`);
    return NextResponse.redirect(loginUrl);
  }

  const role = (session.user as any).role;
  const userCustomerSlug = (session.user as any).customer_slug;
  const userId = (session.user as any).id;
  const isAdmin = (session.user as any).isAdmin;

  try {
    const customer = await prisma.customer.findUnique({ where: { slug: customer_slug }, include: { users: { where: { userId } } } });
    if (!customer) return new NextResponse("Workspace not found", { status: 404 });

    if (role === "CUSTOMER") {
      if (userCustomerSlug !== customer_slug) return new NextResponse("Access Denied to Workspace", { status: 403 });
    } else {
      if (!isAdmin && customer.users.length === 0) return new NextResponse("Access Denied to Workspace", { status: 403 });
    }

    const file = await prisma.file.findUnique({ where: { customerId_slug: { customerId: customer.id, slug: file_slug } } });
    if (!file) return new NextResponse("File not found", { status: 404 });

    const blob = await downloadFile(file.storagePath);
    const htmlContent = await blob.text();

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, max-age=0, must-revalidate",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox allow-scripts"
      }
    });
  } catch (error: any) {
    console.error("API error:", error);
    return new NextResponse("Error serving file", { status: 500 });
  }
}
