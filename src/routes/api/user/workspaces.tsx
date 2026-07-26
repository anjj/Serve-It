import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/lib/prisma";
import { withAuth, type Actor } from "@/lib/auth-utils";

export const Route = createFileRoute("/api/user/workspaces")({
  server: {
    handlers: {
      GET: withAuth(async (_ctx, actor: Actor) => {
        if (actor.kind !== "user") {
          return Response.json({ customers: [] });
        }

        const { userId, isAdmin } = actor;

        try {
          let customers;
          if (isAdmin) {
            customers = await prisma.customer.findMany({
              where: { isActive: true },
              select: { id: true, name: true, slug: true },
              orderBy: { name: "asc" },
            });
          } else {
            const userCustomers = await prisma.userCustomer.findMany({
              where: { userId },
              include: { customer: { select: { id: true, name: true, slug: true } } },
            });
            customers = userCustomers.map((uc) => uc.customer).filter((c) => c !== null).sort((a, b) => a.name.localeCompare(b.name));
          }
          return Response.json({ customers });
        } catch (error) {
          console.error("Error fetching workspaces:", error);
          return Response.json({ error: "Internal Server Error" }, { status: 500 });
        }
      }),
    },
  },
});
