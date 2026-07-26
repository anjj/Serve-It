import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-utils";

export const GET = withAdmin(async () => {
  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    include: {
      customers: { include: { customer: { select: { id: true, name: true } } } },
      apiKeys: { select: { id: true } },
    },
  });
  return Response.json({ users });
});

export const Route = createFileRoute("/api/admin/users/")({
  server: { handlers: { GET } },
});
