import { createFileRoute } from "@tanstack/react-router";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-utils";
import { parseJsonBody } from "@/lib/http";

export const POST = withAdmin(async ({ request }: { request: Request }) => {
  const data = (await parseJsonBody(request)) as { name?: string; userId?: string } | null;
  if (!data) return Response.json({ error: "Invalid JSON payload" }, { status: 400 });

  const { name, userId } = data;
  if (!name || !userId) return Response.json({ error: "Missing fields" }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const rawKey = crypto.randomBytes(32).toString("hex");
    const keyPrefix = "sk_live_serve-it_";
    const fullKey = `${keyPrefix}${rawKey}`;
    const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");

    const newApiKey = await prisma.apiKey.create({
      data: { name, keyHash, userId },
    });

    // We return the raw key ONLY once. It cannot be retrieved again.
    return Response.json({ success: true, key: fullKey, record: newApiKey });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/admin/apikeys")({
  server: { handlers: { POST } },
});
