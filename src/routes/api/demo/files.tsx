import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/lib/prisma";
import { uploadHtmlFile } from "@/lib/storage";
import {
  isDemoEnabled,
  getDemoTtlSeconds,
  getDemoMaxFileBytes,
  getDemoRateLimitPerIp,
  getDemoGlobalActiveLimit,
  generateDemoToken,
  getDemoWorkspace,
} from "@/lib/demo";
import { getClientIp, hashIp, checkDemoRateLimit } from "@/lib/rate-limit";

export const POST = async ({ request }: { request: Request }) => {
  // 1. Kill switch check
  if (!isDemoEnabled()) {
    return new Response("Not Found", { status: 404 });
  }

  const maxFileBytes = getDemoMaxFileBytes();

  try {
    // 2. Size Check (from Header)
    const contentLengthHeader = request.headers.get("content-length");
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (contentLength > maxFileBytes) {
        return Response.json({ error: "File too large" }, { status: 413 });
      }
    }

    // Parse formData safely
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json({ error: "Invalid form data" }, { status: 400 });
    }

    const fileEntry = formData.get("file");
    if (!fileEntry) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 3. Extension & content checks
    let fileContent = "";
    let fileName = "";

    if (fileEntry instanceof File) {
      fileName = fileEntry.name;
      fileContent = await fileEntry.text();
    } else if (typeof fileEntry === "string") {
      fileContent = fileEntry;
    } else {
      return Response.json({ error: "Invalid file payload" }, { status: 400 });
    }

    // Check actual text content size
    const actualByteSize = Buffer.byteLength(fileContent, "utf8");
    if (actualByteSize > maxFileBytes) {
      return Response.json({ error: "File too large" }, { status: 413 });
    }

    // Check extension if name is available, otherwise allow if text is parsed
    if (fileName) {
      const nameToCheck = fileName.toLowerCase();
      if (!nameToCheck.endsWith(".html") && !nameToCheck.endsWith(".htm")) {
        return Response.json({ error: "Only .html and .htm files are allowed" }, { status: 400 });
      }
    } else if (fileEntry instanceof File) {
      return Response.json({ error: "Only .html and .htm files are allowed" }, { status: 400 });
    }

    if (!fileContent.trim()) {
      return Response.json({ error: "File content cannot be empty" }, { status: 400 });
    }

    // 4. Per-IP Rate Limiting
    const ip = getClientIp(request);
    const ipHash = hashIp(ip);
    const rateLimitCheck = await checkDemoRateLimit(ipHash, getDemoRateLimitPerIp());
    if (!rateLimitCheck.allowed) {
      return Response.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": "3600",
          },
        }
      );
    }

    // 5. Global Quota check
    const demoWorkspace = await getDemoWorkspace();
    if (!demoWorkspace) {
      return Response.json({ error: "Demo workspace is not initialized" }, { status: 500 });
    }

    const now = new Date();
    const activeDemoFilesCount = await prisma.file.count({
      where: {
        customerId: demoWorkspace.id,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
    });

    if (activeDemoFilesCount >= getDemoGlobalActiveLimit()) {
      return Response.json(
        { error: "Demo is at capacity, try again shortly" },
        { status: 503 }
      );
    }

    // 6. Successful processing path
    const slug = generateDemoToken();
    const storagePath = await uploadHtmlFile(demoWorkspace.id, slug, fileContent);

    const expiresAt = new Date(Date.now() + getDemoTtlSeconds() * 1000);

    const newFile = await prisma.file.create({
      data: {
        title: "Demo Upload",
        slug,
        tags: ["demo"],
        metadata: { demo: true },
        storagePath,
        customerId: demoWorkspace.id,
        expiresAt,
      },
    });

    // Write log entry
    await prisma.demoUploadLog.create({
      data: {
        ipHash,
      },
    });

    const publicUrl = `${process.env.BETTER_AUTH_URL}/s/${demoWorkspace.slug}/${slug}`;
    return Response.json(
      { url: publicUrl, expiresAt: expiresAt.toISOString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("API /api/demo/files error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};

export const Route = createFileRoute("/api/demo/files")({
  server: { handlers: { POST } },
});
