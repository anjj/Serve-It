import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadHtmlFile } from "@/lib/storage";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = authHeader.split(" ")[1];
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    const apiKeyRecord = await prisma.apiKey.findUnique({ where: { keyHash }, include: { customer: true } });
    if (!apiKeyRecord) return NextResponse.json({ error: "Invalid API Key" }, { status: 403 });

    const customer = apiKeyRecord.customer;
    if (!customer.isActive) return NextResponse.json({ error: "Customer workspace is inactive" }, { status: 403 });

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

    const existingFile = await prisma.file.findUnique({ where: { customerId_slug: { customerId: customer.id, slug } } });
    if (existingFile) return NextResponse.json({ error: "A file with this slug already exists for this customer" }, { status: 409 });

    const storagePath = await uploadHtmlFile(customer.id, slug, file);
    const newFile = await prisma.file.create({ data: { title, slug, tags: tags || [], metadata: metadata || {}, storagePath, customerId: customer.id } });

    const publicUrl = `${process.env.NEXTAUTH_URL}/s/${customer.slug}/${newFile.slug}`;
    return NextResponse.json({ success: true, file: newFile, url: publicUrl });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
