import crypto from "crypto";
import { prisma } from "./prisma";

export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const parts = xForwardedFor.split(",");
    const clientIp = parts[0]?.trim();
    if (clientIp) return clientIp;
  }
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  return "127.0.0.1";
}

export function hashIp(ip: string): string {
  const secret = process.env.BETTER_AUTH_SECRET || "fallback-secret-hash-ip-salt";
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}

export async function checkDemoRateLimit(ipHash: string, limit: number): Promise<{ allowed: boolean; count: number }> {
  const oneHourAgo = new Date(Date.now() - 3600 * 1000);
  const count = await prisma.demoUploadLog.count({
    where: {
      ipHash,
      createdAt: {
        gte: oneHourAgo,
      },
    },
  });

  return {
    allowed: count < limit,
    count,
  };
}
