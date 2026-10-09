import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { resolveActor, type Actor } from "@/lib/auth-utils";

export type AuthSessionResult = {
  actor: Actor | null;
};

/**
 * Server function to resolve the current session (both Better-Auth users and Customer Portal customers)
 * from incoming HTTP request cookies.
 */
export const getAuthSessionFn = createServerFn({ method: "GET" }).handler(async (): Promise<AuthSessionResult> => {
  try {
    const request = getRequest();
    if (!request) return { actor: null };
    const actor = await resolveActor(request);
    return { actor };
  } catch (error) {
    console.error("Error resolving auth session:", error);
    return { actor: null };
  }
});
