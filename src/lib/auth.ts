import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  session: { expiresIn: 60 * 60 * 24 * 30 },
  // Only used by the local developer-bypass sign-in (see
  // src/routes/api/auth/dev-bypass.tsx). Real users authenticate via the
  // social providers below; there is no email/password login in production.
  emailAndPassword: {
    enabled: process.env.NODE_ENV === "development",
    requireEmailVerification: false,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET
      ? {
          microsoft: {
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            tenantId: process.env.AZURE_AD_TENANT_ID || "common",
          },
        }
      : {}),
  },
  user: {
    additionalFields: {
      // Never settable from client input; only ever changed server-side via
      // /api/admin/users/role.
      isAdmin: { type: "boolean", required: false, input: false, defaultValue: false },
    },
  },
  plugins: [tanstackStartCookies()],
});
