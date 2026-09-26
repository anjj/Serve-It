import { createFileRoute } from "@tanstack/react-router";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";
import { isDemoEnabled, getDemoSweepSecret } from "@/lib/demo";

function timingSafeCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    try {
      crypto.timingSafeEqual(bufA, bufA);
    } catch {
      // Ignore
    }
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export const POST = async ({ request }: { request: Request }) => {
  if (!isDemoEnabled()) {
    return new Response("Not Found", { status: 404 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providedSecret = authHeader.split(" ")[1] || "";
  const sweepSecret = getDemoSweepSecret();
  if (!sweepSecret || !timingSafeCompare(providedSecret, sweepSecret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // 1. Find up to 200 expired Files
    const expiredFiles = await prisma.file.findMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
      take: 200,
    });

    // 2. Best-effort delete expired storage objects
    for (const file of expiredFiles) {
      try {
        await deleteFile(file.storagePath);
      } catch (err) {
        console.error(`Sweep failed to delete storage for file ${file.id}:`, err);
      }
    }

    // 3. Delete DB rows for those files
    const deletedIds = expiredFiles.map((f) => f.id);
    if (deletedIds.length > 0) {
      await prisma.file.deleteMany({
        where: {
          id: {
            in: deletedIds,
          },
        },
      });
    }

    // 4. Prune DemoUploadLog rows older than 1 hour rate limit window
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    await prisma.demoUploadLog.deleteMany({
      where: {
        createdAt: {
          lt: oneHourAgo,
        },
      },
    });

    // 5. Count remaining expired files
    const remaining = await prisma.file.count({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    return Response.json({
      deleted: expiredFiles.length,
      remaining,
    });
  } catch (error) {
    console.error("API /api/demo/sweep error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};

export const Route = createFileRoute("/api/demo/sweep")({
  server: { handlers: { POST } },
});
