import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadHtmlFile } from "@/lib/storage";

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

export async function POST(req: Request, { params }: { params: Promise<{ customer_slug: string }> }) {
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

    const data = await req.json();
    const { title, slug, file, tags, metadata } = data;
    if (!title || !slug || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingFile = await prisma.file.findUnique({
      where: {
        customerId_slug: {
          customerId: customer.id,
          slug: slug
        }
      }
    });
    if (existingFile) {
      return NextResponse.json({ error: "A file with this slug already exists for this customer" }, { status: 409 });
    }

    const storagePath = await uploadHtmlFile(customer.id, slug, file);
    const newFile = await prisma.file.create({
      data: {
        title,
        slug,
        tags: tags || [],
        metadata: metadata || {},
        storagePath,
        customerId: customer.id,
      }
    });

    return NextResponse.json({ success: true, file: newFile });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
