import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { withAdmin } from "@/lib/auth-utils";

export const POST = withAdmin(async (req: Request) => {
  let body;
  try {
    const text = await req.text();
    body = JSON.parse(text);
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
  const { name, customerId, userId } = body;
  if (!name || (!customerId && !userId)) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  try {
    // Generate a secure random API key
    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyPrefix = "sk_live_serve-it_";
    const fullKey = `${keyPrefix}${rawKey}`;

    // Hash it for DB storage
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');

    const newApiKey = await prisma.apiKey.create({
      data: {
        name,
        keyHash,
        customerId: customerId || null,
        userId: userId || null
      }
    });

    // We return the raw key ONLY once. It cannot be retrieved again.
    return NextResponse.json({ success: true, key: fullKey, record: newApiKey });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
