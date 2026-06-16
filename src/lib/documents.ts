import { prisma } from "@/lib/prisma";
import { uploadHtmlFile } from "@/lib/storage";

export interface DocumentData {
  title: string;
  slug: string;
  content: string;
  tags?: string[] | string;
  metadata?: Record<string, any> | string;
}

export interface PatchDocumentData {
  title?: string;
  content?: string;
  tags?: string[] | string;
  metadata?: Record<string, any> | string;
}

export async function createDocument(customerId: string, data: DocumentData) {
  const { title, slug, content, tags: tagsRaw, metadata: metadataRaw } = data;

  const tags = parseTags(tagsRaw);
  const metadata = parseMetadata(metadataRaw);

  const existingFile = await prisma.file.findUnique({
    where: {
      customerId_slug: {
        customerId,
        slug
      }
    }
  });

  if (existingFile) {
    throw new Error("A file with this slug already exists for this customer");
  }

  const storagePath = await uploadHtmlFile(customerId, slug, content);

  const newFile = await prisma.file.create({
    data: {
      title,
      slug,
      tags,
      metadata: metadata || {},
      storagePath,
      customerId,
    }
  });

  return newFile;
}

export async function patchDocument(customerId: string, slug: string, data: PatchDocumentData) {
  const existingFile = await prisma.file.findUnique({
    where: {
      customerId_slug: {
        customerId,
        slug
      }
    }
  });

  if (!existingFile) {
    throw new Error("File not found");
  }

  const { title, content, tags: tagsRaw, metadata: metadataRaw } = data;
  const updateData: any = {};

  if (title !== undefined) updateData.title = title;

  if (tagsRaw !== undefined) {
    updateData.tags = parseTags(tagsRaw);
  }

  if (metadataRaw !== undefined) {
    updateData.metadata = parseMetadata(metadataRaw) || {};
  }

  if (content !== undefined) {
    await uploadHtmlFile(customerId, slug, content);
    updateData.updatedAt = new Date();
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No fields to update provided");
  }

  const updatedFile = await prisma.file.update({
    where: {
      customerId_slug: {
        customerId,
        slug
      }
    },
    data: updateData
  });

  return updatedFile;
}

function parseTags(tagsRaw: any): string[] {
  if (!tagsRaw) return [];
  if (Array.isArray(tagsRaw)) return tagsRaw;
  if (typeof tagsRaw === "string") {
    try {
      return JSON.parse(tagsRaw);
    } catch {
      return tagsRaw.split(",").map(t => t.trim()).filter(Boolean);
    }
  }
  return [];
}

function parseMetadata(metadataRaw: any): Record<string, any> | null {
  if (!metadataRaw) return null;
  if (typeof metadataRaw === "object" && !Array.isArray(metadataRaw)) return metadataRaw;
  if (typeof metadataRaw === "string") {
    try {
      return JSON.parse(metadataRaw);
    } catch {
      return null;
    }
  }
  return null;
}
