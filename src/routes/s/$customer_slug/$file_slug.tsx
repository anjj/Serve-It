import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/lib/prisma";
import { downloadFile } from "@/lib/storage";
import { resolveActor } from "@/lib/auth-utils";

export const Route = createFileRoute("/s/$customer_slug/$file_slug")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { customer_slug, file_slug } = params;
        const actor = await resolveActor(request);

        if (!actor) {
          const baseUrl = process.env.BETTER_AUTH_URL || request.url;
          const loginUrl = new URL("/auth/signin", baseUrl);
          loginUrl.searchParams.set("callbackUrl", `/s/${customer_slug}/${file_slug}`);
          return Response.redirect(loginUrl, 302);
        }

        try {
          const customer = await prisma.customer.findUnique({
            where: { slug: customer_slug },
            include: actor.kind === "user" ? { users: { where: { userId: actor.userId } } } : undefined,
          });
          if (!customer) return new Response("Workspace not found", { status: 404 });

          if (actor.kind === "customer") {
            if (actor.customerSlug !== customer_slug) return new Response("Access Denied to Workspace", { status: 403 });
          } else {
            const hasMembership = ((customer as { users?: unknown[] }).users?.length ?? 0) > 0;
            if (!actor.isAdmin && !hasMembership) return new Response("Access Denied to Workspace", { status: 403 });
          }

          const file = await prisma.file.findUnique({ where: { customerId_slug: { customerId: customer.id, slug: file_slug } } });
          if (!file) return new Response("File not found", { status: 404 });

          const blob = await downloadFile(file.storagePath);
          const htmlContent = await blob.text();

          return new Response(htmlContent, {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "private, max-age=0, must-revalidate",
              "X-Content-Type-Options": "nosniff",
              "Content-Security-Policy": "sandbox allow-scripts",
            },
          });
        } catch (error) {
          console.error("API error:", error);
          return new Response("Error serving file", { status: 500 });
        }
      },
    },
  },
});
