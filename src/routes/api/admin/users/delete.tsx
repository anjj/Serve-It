import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-utils";
import { parseJsonBody } from "@/lib/http";

export const POST = withAdmin(async ({ request }: { request: Request }, actor) => {
  const data = (await parseJsonBody(request)) as { userId?: string; confirmEmail?: string } | null;
  if (!data) {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { userId, confirmEmail } = data;
  if (!userId || !confirmEmail) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (confirmEmail !== user.email) {
      return Response.json({ error: "Confirmation does not match" }, { status: 400 });
    }

    if (userId === actor.userId) {
      return Response.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    if (user.isAdmin) {
      const adminCount = await prisma.user.count({ where: { isAdmin: true } });
      if (adminCount <= 1) {
        return Response.json({ error: "Cannot delete the last remaining admin" }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id: userId } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/admin/users/delete")({
  server: { handlers: { POST } },
});
