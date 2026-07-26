import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/lib/prisma";
import { uploadHtmlFile, deleteFile } from "@/lib/storage";
import { withAuth, type Actor } from "@/lib/auth-utils";
import { parseJsonBody, SLUG_PATTERN } from "@/lib/http";

export const GET = withAuth(async ({ params }: { request: Request; params: { customer_slug: string } }, actor: Actor) => {
  const { customer_slug } = params;

  try {
    if (actor.kind === "customer") {
      if (actor.customerSlug !== customer_slug) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
      const customer = await prisma.customer.findUnique({ where: { slug: customer_slug } });
      if (!customer) return Response.json({ error: "Workspace not found" }, { status: 404 });

      const files = await prisma.file.findMany({
        where: { customerId: customer.id },
        select: { id: true, title: true, slug: true, tags: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
      return Response.json({ files });
    }

    const customer = await prisma.customer.findUnique({
      where: { slug: customer_slug },
      include: { users: { where: { userId: actor.userId } } },
    });
    if (!customer) return Response.json({ error: "Workspace not found" }, { status: 404 });
    if (!actor.isAdmin && customer.users.length === 0) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    const files = await prisma.file.findMany({
      where: { customerId: customer.id },
      select: { id: true, title: true, slug: true, tags: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ files });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const POST = withAuth(async ({ request, params }: { request: Request; params: { customer_slug: string } }, actor: Actor) => {
  if (actor.kind !== "user") {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const { customer_slug } = params;
  const { userId, isAdmin } = actor;

  try {
    const customer = await prisma.customer.findUnique({ where: { slug: customer_slug }, include: { users: { where: { userId } } } });
    if (!customer) return Response.json({ error: "Workspace not found" }, { status: 404 });
    if (!isAdmin && customer.users.length === 0) return Response.json({ error: "Access denied" }, { status: 403 });

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const fileEntry = formData.get("file");
    const tagsRaw = formData.get("tags") as string;
    const metadataRaw = formData.get("metadata") as string;

    if (!title || !slug || !fileEntry) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!SLUG_PATTERN.test(slug)) {
      return Response.json(
        { error: "Invalid slug format. Only alphanumeric characters, dashes, and underscores are allowed." },
        { status: 400 },
      );
    }

    let file = "";
    if (fileEntry instanceof File) {
      file = await fileEntry.text();
    } else if (typeof fileEntry === "string") {
      file = fileEntry;
    } else {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!file) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    let tags: string[] = [];
    if (tagsRaw) {
      try {
        tags = JSON.parse(tagsRaw);
      } catch {
        tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
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

    const existingFile = await prisma.file.findUnique({ where: { customerId_slug: { customerId: customer.id, slug } } });
    if (existingFile) {
      return Response.json({ error: "A file with this slug already exists for this customer" }, { status: 409 });
    }

    const storagePath = await uploadHtmlFile(customer.id, slug, file);
    const newFile = await prisma.file.create({
      data: { title, slug, tags: tags || [], metadata: metadata || {}, storagePath, customerId: customer.id },
    });

    return Response.json({ success: true, file: newFile });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withAuth(async ({ request, params }: { request: Request; params: { customer_slug: string } }, actor: Actor) => {
  if (actor.kind !== "user") {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const { customer_slug } = params;
  const { userId, isAdmin } = actor;

  try {
    const customer = await prisma.customer.findUnique({ where: { slug: customer_slug }, include: { users: { where: { userId } } } });
    if (!customer) return Response.json({ error: "Workspace not found" }, { status: 404 });
    if (!isAdmin && customer.users.length === 0) return Response.json({ error: "Access denied" }, { status: 403 });

    const data = (await parseJsonBody(request)) as { fileId?: string } | null;
    if (!data) return Response.json({ error: "Invalid JSON payload" }, { status: 400 });

    const { fileId } = data;
    if (!fileId) {
      return Response.json({ error: "Missing fileId" }, { status: 400 });
    }

    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.customerId !== customer.id) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    await deleteFile(file.storagePath);
    await prisma.file.delete({ where: { id: fileId } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/workspace/$customer_slug/files")({
  server: { handlers: { GET, POST, DELETE } },
});
