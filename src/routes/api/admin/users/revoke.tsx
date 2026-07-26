import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-utils";
import { parseJsonBody } from "@/lib/http";

export const POST = withAdmin(async ({ request }: { request: Request }) => {
  const data = (await parseJsonBody(request)) as { userId?: string; customerId?: string } | null;
  if (!data) return Response.json({ error: "Invalid JSON payload" }, { status: 400 });

  const { userId, customerId } = data;
  try {
    await prisma.userCustomer.delete({ where: { userId_customerId: { userId: userId!, customerId: customerId! } } });
    return Response.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/admin/users/revoke")({
  server: { handlers: { POST } },
});
