import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth-api";
import { createDocument, patchDocument } from "@/lib/documents";

export async function POST(req: Request) {
  try {
    // 1. Authenticate
    // Note: Since this is a global endpoint, we don't know the customer slug yet.
    // The payload must contain it.
    const auth = await validateApiKey(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. Parse payload (handle both JSON and FormData)
    let payload: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      payload.customer_slug = formData.get("customer_slug") as string;
      payload.title = formData.get("title") as string;
      payload.slug = formData.get("slug") as string;
      payload.tags = formData.get("tags") as string;
      payload.metadata = formData.get("metadata") as string;

      const fileEntry = formData.get("file");
      if (fileEntry instanceof File) {
        payload.content = await fileEntry.text();
      } else if (typeof fileEntry === "string") {
        payload.content = fileEntry;
      }
    }

    const { customer_slug, title, slug, content, tags, metadata } = payload;

    if (!customer_slug) {
      return NextResponse.json({ error: "Missing required field: customer_slug" }, { status: 400 });
    }

    if (!title || !slug || !content) {
      return NextResponse.json({ error: "Missing required fields: title, slug, or content" }, { status: 400 });
    }

    // 3. Re-validate auth with specific customer context if it's a user-level key
    // (Customer-level keys are checked against the specific customer they belong to)
    const authWithContext = await validateApiKey(req, customer_slug);
    if (!authWithContext || !authWithContext.customerId) {
      return NextResponse.json({ error: "Access denied to this workspace" }, { status: 403 });
    }

    // 4. Create document
    const newFile = await createDocument(authWithContext.customerId, {
      title,
      slug,
      content,
      tags,
      metadata
    });

    const publicUrl = `${process.env.NEXTAUTH_URL}/s/${customer_slug}/${newFile.slug}`;
    return NextResponse.json({ success: true, file: newFile, url: publicUrl });
  } catch (error: any) {
    const status = error.message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await validateApiKey(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let payload: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      payload.customer_slug = formData.get("customer_slug") as string;
      payload.title = formData.get("title") as string;
      payload.slug = formData.get("slug") as string;
      payload.tags = formData.get("tags") as string;
      payload.metadata = formData.get("metadata") as string;

      const fileEntry = formData.get("file");
      if (fileEntry instanceof File) {
        payload.content = await fileEntry.text();
      } else if (typeof fileEntry === "string") {
        payload.content = fileEntry;
      }
    }

    const { customer_slug, slug, title, content, tags, metadata } = payload;

    if (!customer_slug || !slug) {
      return NextResponse.json({ error: "Missing required fields: customer_slug or slug" }, { status: 400 });
    }

    const authWithContext = await validateApiKey(req, customer_slug);
    if (!authWithContext || !authWithContext.customerId) {
      return NextResponse.json({ error: "Access denied to this workspace" }, { status: 403 });
    }

    const updatedFile = await patchDocument(authWithContext.customerId, slug, {
      title,
      content,
      tags,
      metadata
    });

    const publicUrl = `${process.env.NEXTAUTH_URL}/s/${customer_slug}/${updatedFile.slug}`;
    return NextResponse.json({ success: true, file: updatedFile, url: publicUrl });
  } catch (error: any) {
    const status = error.message.includes("not found") ? 404 : (error.message.includes("No fields") ? 400 : 500);
    return NextResponse.json({ error: error.message }, { status });
  }
}
