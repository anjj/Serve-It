import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downloadFile } from "@/lib/storage";
import { resolveActor } from "@/lib/auth-utils";

export async function GET(req: Request, { params }: { params: Promise<{ customer_slug: string; file_slug: string }> }) {
  const resolvedParams = await params;
  const { customer_slug, file_slug } = resolvedParams;

  const actor = await resolveActor(req);
  if (!actor) {
    const baseUrl = process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL || req.url;
    const loginUrl = new URL("/auth/signin", baseUrl);
    loginUrl.searchParams.set("callbackUrl", `/s/${customer_slug}/${file_slug}`);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { slug: customer_slug },
      include: actor.kind === "user" ? { users: { where: { userId: actor.userId } } } : undefined,
    });
    if (!customer) return new NextResponse("Workspace not found", { status: 404 });

    if (actor.kind === "customer") {
      if (actor.customerSlug !== customer_slug) return new NextResponse("Access Denied to Workspace", { status: 403 });
    } else {
      const hasMembership = (customer as any).users?.length > 0;
      if (!actor.isAdmin && !hasMembership) return new NextResponse("Access Denied to Workspace", { status: 403 });
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
