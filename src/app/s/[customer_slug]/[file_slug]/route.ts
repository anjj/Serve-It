import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadFile } from "@/lib/storage";
import { validateTenantAccess } from "@/lib/tenant-auth";

export async function GET(req: Request, { params }: { params: Promise<{ customer_slug: string; file_slug: string }> }) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await params;
  const { customer_slug, file_slug } = resolvedParams;

  if (!session || !session.user) {
    const loginUrl = new URL("/auth/signin", req.url);
    loginUrl.searchParams.set("callbackUrl", `/s/${customer_slug}/${file_slug}`);
    return NextResponse.redirect(loginUrl);
  }

  const authResult = await validateTenantAccess(
    session.user as any,
    customer_slug,
    {
      ip: req.headers.get("x-forwarded-for") || "unknown",
      resource: `/s/${customer_slug}/${file_slug}`,
      action: "VIEW_DOCUMENT"
    }
  );

  if (!authResult.authorized) {
    return new NextResponse(authResult.error, { status: authResult.status });
  }

  const customer = authResult.customer!;

  try {
    const file = await prisma.file.findUnique({ where: { customerId_slug: { customerId: customer.id, slug: file_slug } } });
    if (!file) return new NextResponse("File not found", { status: 404 });

    const blob = await downloadFile(file.storagePath);
    const htmlContent = await blob.text();

    return new NextResponse(htmlContent, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, max-age=0, must-revalidate", "X-Content-Type-Options": "nosniff" } });
  } catch (error: any) {
    return new NextResponse(`Error serving file: ${error.message}`, { status: 500 });
  }
}
