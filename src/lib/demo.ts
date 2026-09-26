import crypto from "crypto";
import { prisma } from "./prisma";

export function isDemoEnabled(): boolean {
  return process.env.DEMO_ENABLED !== "false";
}

export function getDemoTtlSeconds(): number {
  return Number(process.env.DEMO_TTL_SECONDS || "3600");
}

export function getDemoMaxFileBytes(): number {
  return Number(process.env.DEMO_MAX_FILE_BYTES || "2000000");
}

export function getDemoRateLimitPerIp(): number {
  return Number(process.env.DEMO_RATE_LIMIT_PER_IP_PER_HOUR || "5");
}

export function getDemoGlobalActiveLimit(): number {
  return Number(process.env.DEMO_GLOBAL_ACTIVE_LIMIT || "500");
}

export function getDemoSweepSecret(): string {
  return process.env.DEMO_SWEEP_SECRET || "";
}

export function generateDemoToken(): string {
  // Generates 22-character unguessable base64url slug (16 bytes)
  return crypto.randomBytes(16).toString("base64url");
}

export async function getDemoWorkspace() {
  return prisma.customer.findFirst({
    where: {
      isDemo: true,
      slug: "demo",
    },
  });
}
