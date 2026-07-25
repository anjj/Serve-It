import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadHtmlFile } from "@/lib/storage";
import crypto from "crypto";

const BASE_URL = process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL;

/**
 * Resolves the caller's ApiKey and the target Customer workspace.
 *
 * An ApiKey belongs to exactly one User (D4); it is not pinned to a single
 * workspace at creation time. Every request must therefore name which
 * workspace it targets via `customer_slug`, and the caller's user must have
 * a UserCustomer membership there (or be a platform admin).
 */
async function resolveKeyAndCustomer(req: Request, customerSlug: string | null) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const apiKey = authHeader.split(" ")[1];
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

  const apiKeyRecord = await prisma.apiKey.findUnique({ where: { keyHash }, include: { user: true } });
  if (!apiKeyRecord) {
    return { error: NextResponse.json({ error: "Invalid API Key" }, { status: 403 }) };
  }

  if (!customerSlug) {
    return { error: NextResponse.json({ error: "Missing required field: customer_slug" }, { status: 400 }) };
  }

  const customer = await prisma.customer.findUnique({
    where: { slug: customerSlug },
    include: { users: { where: { userId: apiKeyRecord.userId } } },
  });
  if (!customer) {
    return { error: NextResponse.json({ error: "Workspace not found" }, { status: 404 }) };
  }
  if (!customer.isActive) {
    return { error: NextResponse.json({ error: "Customer workspace is inactive" }, { status: 403 }) };
  }
  if (!apiKeyRecord.user.isAdmin && customer.users.length === 0) {
    return { error: NextResponse.json({ error: "User is not a member of this workspace" }, { status: 403 }) };
  }

  return { customer };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const customerSlug = formData.get("customer_slug") as string | null;
    const resolved = await resolveKeyAndCustomer(req, customerSlug);
    if (resolved.error) return resolved.error;
    const { customer } = resolved;

    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const fileEntry = formData.get("file");
    const tagsRaw = formData.get("tags") as string;
    const metadataRaw = formData.get("metadata") as string;

    if (!title || !slug || !fileEntry) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isValidSlug = /^[a-zA-Z0-9_-]+$/.test(slug);
    if (!isValidSlug) {
      return NextResponse.json({ error: "Invalid slug format. Only alphanumeric characters, dashes, and underscores are allowed." }, { status: 400 });
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

    const existingFile = await prisma.file.findUnique({ where: { customerId_slug: { customerId: customer.id, slug } } });
    if (existingFile) return NextResponse.json({ error: "A file with this slug already exists for this customer" }, { status: 409 });

    const storagePath = await uploadHtmlFile(customer.id, slug, file);
    const newFile = await prisma.file.create({ data: { title, slug, tags: tags || [], metadata: metadata || {}, storagePath, customerId: customer.id } });

    const publicUrl = `${BASE_URL}/s/${customer.slug}/${newFile.slug}`;
    return NextResponse.json({ success: true, file: newFile, url: publicUrl });
  } catch (error: any) {
    console.error("API /v1/files error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const formData = await req.formData();
    const customerSlug = formData.get("customer_slug") as string | null;
    const resolved = await resolveKeyAndCustomer(req, customerSlug);
    if (resolved.error) return resolved.error;
    const { customer } = resolved;

    const slug = formData.get("slug") as string;
    if (!slug) {
      return NextResponse.json({ error: "Missing required field: slug" }, { status: 400 });
    }

    const isValidSlug = /^[a-zA-Z0-9_-]+$/.test(slug);
    if (!isValidSlug) {
      return NextResponse.json({ error: "Invalid slug format. Only alphanumeric characters, dashes, and underscores are allowed." }, { status: 400 });
    }

    // Find the existing file
    const existingFile = await prisma.file.findUnique({
      where: {
        customerId_slug: {
          customerId: customer.id,
          slug: slug
        }
      }
    });
    if (!existingFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Fields to update
    const title = formData.get("title") as string | null;
    const fileEntry = formData.get("file");
    const tagsRaw = formData.get("tags") as string | null;
    const metadataRaw = formData.get("metadata") as string | null;

    const hasTitle = title !== null;
    const hasTags = tagsRaw !== null;
    const hasMetadata = metadataRaw !== null;
    const hasFile = fileEntry !== null;

    if (!hasTitle && !hasTags && !hasMetadata && !hasFile) {
      return NextResponse.json({ error: "No fields to update provided" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (hasTitle) {
      updateData.title = title;
    }

    if (hasTags) {
      let tags: string[] = [];
      try {
        tags = JSON.parse(tagsRaw);
      } catch {
        tags = tagsRaw.split(",").map(t => t.trim()).filter(Boolean);
      }
      updateData.tags = tags;
    }

    if (hasMetadata) {
      let metadata = {};
      try {
        metadata = JSON.parse(metadataRaw);
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
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      await uploadHtmlFile(customer.id, slug, file);
      updateData.updatedAt = new Date();
    }

    const updatedFile = await prisma.file.update({
      where: {
        customerId_slug: {
          customerId: customer.id,
          slug: slug
        }
      },
      data: updateData
    });

    const publicUrl = `${BASE_URL}/s/${customer.slug}/${updatedFile.slug}`;
    return NextResponse.json({ success: true, file: updatedFile, url: publicUrl });
  } catch (error: any) {
    console.error("API /v1/files error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
