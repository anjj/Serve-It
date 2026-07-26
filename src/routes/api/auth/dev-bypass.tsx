import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Local-only developer sign-in shortcut: find-or-create the dev user, sync
// isAdmin, then establish a real better-auth session for it. Never available
// outside NODE_ENV === "development" (see src/lib/auth.ts, where
// emailAndPassword is only enabled in development in the first place).
const DEV_BYPASS_PASSWORD = "dev-bypass-password-not-for-production";

export const POST = async ({ request }: { request: Request }) => {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let data: { email?: string; isAdmin?: boolean } = {};
  try {
    data = await request.json();
  } catch {
    // no body is fine, use defaults
  }
  const email = data.email || "dev@example.com";
  const isAdmin = data.isAdmin === true;

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    await auth.api.signUpEmail({
      body: { email, password: DEV_BYPASS_PASSWORD, name: "Developer User" },
    });
    await prisma.user.update({ where: { email }, data: { isAdmin } });
  } else if (existing.isAdmin !== isAdmin) {
    await prisma.user.update({ where: { id: existing.id }, data: { isAdmin } });
  }

  return auth.api.signInEmail({
    body: { email, password: DEV_BYPASS_PASSWORD },
    asResponse: true,
  });
};

export const Route = createFileRoute("/api/auth/dev-bypass")({
  server: { handlers: { POST } },
});
