import { createFileRoute } from "@tanstack/react-router";
import crypto from "crypto";
import type { Customer } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { uploadHtmlFile } from "@/lib/storage";
import { SLUG_PATTERN } from "@/lib/http";

type ResolveResult = { ok: true; customer: Customer } | { ok: false; status: number; error: string };

/**
 * An ApiKey belongs to exactly one User; it isn't pinned to a single
 * workspace at creation time. Every request must therefore name its target
 * workspace via `customer_slug`, and the caller's user must have a
 * UserCustomer membership there (or be a platform admin).
 */
async function resolveKeyAndCustomer(request: Request, customerSlug: string | null): Promise<ResolveResult> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const apiKey = authHeader.split(" ")[1];
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

  const apiKeyRecord = await prisma.apiKey.findUnique({ where: { keyHash }, include: { user: true } });
  if (!apiKeyRecord) {
    return { ok: false, status: 403, error: "Invalid API Key" };
  }

  if (!customerSlug) {
    return { ok: false, status: 400, error: "Missing required field: customer_slug" };
  }

  const customer = await prisma.customer.findUnique({
    where: { slug: customerSlug },
    include: { users: { where: { userId: apiKeyRecord.userId } } },
  });
  if (!customer) {
    return { ok: false, status: 404, error: "Workspace not found" };
  }
  if (!customer.isActive) {
    return { ok: false, status: 403, error: "Customer workspace is inactive" };
  }
  if (!apiKeyRecord.user.isAdmin && customer.users.length === 0) {
    return { ok: false, status: 403, error: "User is not a member of this workspace" };
  }

  return { ok: true, customer };
}

export const POST = async ({ request }: { request: Request }) => {
  try {
    const formData = await request.formData();
    const customerSlug = formData.get("customer_slug") as string | null;
    const resolved = await resolveKeyAndCustomer(request, customerSlug);
    if (!resolved.ok) return Response.json({ error: resolved.error }, { status: resolved.status });
    const { customer } = resolved;

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
    if (!file) return Response.json({ error: "Missing required fields" }, { status: 400 });

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
    if (existingFile) return Response.json({ error: "A file with this slug already exists for this customer" }, { status: 409 });

    const storagePath = await uploadHtmlFile(customer.id, slug, file);
    const newFile = await prisma.file.create({
      data: { title, slug, tags: tags || [], metadata: metadata || {}, storagePath, customerId: customer.id },
    });

    const publicUrl = `${process.env.BETTER_AUTH_URL}/s/${customer.slug}/${newFile.slug}`;
    return Response.json({ success: true, file: newFile, url: publicUrl });
  } catch (error) {
    console.error("API /v1/files error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};

export const PATCH = async ({ request }: { request: Request }) => {
  try {
    const formData = await request.formData();
    const customerSlug = formData.get("customer_slug") as string | null;
    const resolved = await resolveKeyAndCustomer(request, customerSlug);
    if (!resolved.ok) return Response.json({ error: resolved.error }, { status: resolved.status });
    const { customer } = resolved;

    const slug = formData.get("slug") as string;
    if (!slug) {
      return Response.json({ error: "Missing required field: slug" }, { status: 400 });
    }
    if (!SLUG_PATTERN.test(slug)) {
      return Response.json(
        { error: "Invalid slug format. Only alphanumeric characters, dashes, and underscores are allowed." },
        { status: 400 },
      );
    }

    const existingFile = await prisma.file.findUnique({ where: { customerId_slug: { customerId: customer.id, slug } } });
    if (!existingFile) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    const title = formData.get("title") as string | null;
    const fileEntry = formData.get("file");
    const tagsRaw = formData.get("tags") as string | null;
    const metadataRaw = formData.get("metadata") as string | null;

    const hasTitle = title !== null;
    const hasTags = tagsRaw !== null;
    const hasMetadata = metadataRaw !== null;
    const hasFile = fileEntry !== null;

    if (!hasTitle && !hasTags && !hasMetadata && !hasFile) {
      return Response.json({ error: "No fields to update provided" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (hasTitle) {
      updateData.title = title;
    }

    if (hasTags) {
      let tags: string[] = [];
      try {
        tags = JSON.parse(tagsRaw as string);
      } catch {
        tags = (tagsRaw as string).split(",").map((t) => t.trim()).filter(Boolean);
      }
      updateData.tags = tags;
    }

    if (hasMetadata) {
      let metadata = {};
      try {
        metadata = JSON.parse(metadataRaw as string);
      } catch {
        // Fallback
      }
      updateData.metadata = metadata;
    }

    if (hasFile) {
      let file = "";
      if (fileEntry instanceof File) {
        file = await fileEntry.text();
      } else if (typeof fileEntry === "string") {
        file = fileEntry;
      }
      if (!file) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
      }

      await uploadHtmlFile(customer.id, slug, file);
      updateData.updatedAt = new Date();
    }

    const updatedFile = await prisma.file.update({
      where: { customerId_slug: { customerId: customer.id, slug } },
      data: updateData,
    });

    const publicUrl = `${process.env.BETTER_AUTH_URL}/s/${customer.slug}/${updatedFile.slug}`;
    return Response.json({ success: true, file: updatedFile, url: publicUrl });
  } catch (error) {
    console.error("API /v1/files error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};

export const Route = createFileRoute("/api/v1/files")({
  server: { handlers: { POST, PATCH } },
});
