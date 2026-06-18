import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadHtmlFile, deleteFile } from "@/lib/storage";
import { validateTenantAccess } from "@/lib/tenant-auth";

export async function GET(req: Request, { params }: { params: Promise<{ customer_slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  const customer_slug = resolvedParams.customer_slug;

  const authResult = await validateTenantAccess(
    session.user as any,
    customer_slug,
    {
      ip: req.headers.get("x-forwarded-for") || "unknown",
      resource: `/api/workspace/${customer_slug}/files`,
      action: "GET_FILES"
    }
  );

  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const customer = authResult.customer!;

  try {
    const files = await prisma.file.findMany({ where: { customerId: customer.id }, select: { id: true, title: true, slug: true, tags: true, createdAt: true }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ customer_slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if ((session.user as any).role === "CUSTOMER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const resolvedParams = await params;
  const customer_slug = resolvedParams.customer_slug;

  const authResult = await validateTenantAccess(
    session.user as any,
    customer_slug,
    {
      ip: req.headers.get("x-forwarded-for") || "unknown",
      resource: `/api/workspace/${customer_slug}/files`,
      action: "UPLOAD_FILE"
    }
  );

  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const customer = authResult.customer!;

  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const fileEntry = formData.get("file");
    const tagsRaw = formData.get("tags") as string;
    const metadataRaw = formData.get("metadata") as string;

    if (!title || !slug || !fileEntry) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let file = "";
    if (fileEntry instanceof File) {
      file = await fileEntry.text();
    } else if (typeof fileEntry === "string") {
      file = fileEntry;
    } else {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let tags: string[] = [];
    if (tagsRaw) {
      try {
        tags = JSON.parse(tagsRaw);
      } catch {
        tags = tagsRaw.split(",").map(t => t.trim()).filter(Boolean);
      }
    }

    let metadata = {};
    if (metadataRaw) {
      try {
        metadata = JSON.parse(metadataRaw);
      } catch {
        // Fallback
      }
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

export async function DELETE(req: Request, { params }: { params: Promise<{ customer_slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if ((session.user as any).role === "CUSTOMER") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const resolvedParams = await params;
  const customer_slug = resolvedParams.customer_slug;

  const authResult = await validateTenantAccess(
    session.user as any,
    customer_slug,
    {
      ip: req.headers.get("x-forwarded-for") || "unknown",
      resource: `/api/workspace/${customer_slug}/files`,
      action: "DELETE_FILE"
    }
  );

  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const customer = authResult.customer!;

  try {
    const data = await req.json();
    const { fileId } = data;
    if (!fileId) {
      return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
    }

    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.customerId !== customer.id) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    await deleteFile(file.storagePath);
    await prisma.file.delete({ where: { id: fileId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
