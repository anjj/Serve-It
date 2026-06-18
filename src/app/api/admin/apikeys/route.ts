import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, customerId, userId } = await req.json();
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
        // @ts-ignore - Schema might have userId but prisma client might need update or it's handled via extensions
        userId: userId || null
      }
    });

    // We return the raw key ONLY once. It cannot be retrieved again.
    return NextResponse.json({ success: true, key: fullKey, record: newApiKey });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
