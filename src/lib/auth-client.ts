import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signOut } = authClient;

/**
 * Thin adapter over better-auth's useSession() that mirrors the
 * {data, status} shape next-auth's useSession() returned, since most pages
 * branch on status === "loading" | "authenticated" | "unauthenticated".
 */
export function useSession() {
  const result = authClient.useSession();
  const status = result.isPending ? "loading" : result.data ? "authenticated" : "unauthenticated";
  return { data: result.data, status, isPending: result.isPending };
}
