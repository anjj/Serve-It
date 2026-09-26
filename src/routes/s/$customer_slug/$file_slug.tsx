import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/lib/prisma";
import { downloadFile, deleteFile } from "@/lib/storage";
import { resolveActor } from "@/lib/auth-utils";
import { isDemoEnabled } from "@/lib/demo";

export const Route = createFileRoute("/s/$customer_slug/$file_slug")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { customer_slug, file_slug } = params;

        // 1. customer = findUnique({ slug: customer_slug })
        let customer;
        try {
          customer = await prisma.customer.findUnique({
            where: { slug: customer_slug },
          });
        } catch (error) {
          console.error("API error fetching customer:", error);
          return new Response("Error serving file", { status: 500 });
        }

        // 2. if (customer?.isDemo) -> serve via the demo path (never calls resolveActor)
        if (customer?.isDemo && isDemoEnabled()) {
          try {
            const file = await prisma.file.findUnique({
              where: { customerId_slug: { customerId: customer.id, slug: file_slug } },
            });
            if (!file) return new Response("File not found", { status: 404 });

            // check expiry
            if (file.expiresAt && new Date(file.expiresAt) < new Date()) {
              // best-effort delete from storage and DB
              try {
                await deleteFile(file.storagePath);
              } catch (err) {
                console.error("Failed to delete expired storage object:", err);
              }
              try {
                await prisma.file.delete({ where: { id: file.id } });
              } catch (err) {
                console.error("Failed to delete expired database record:", err);
              }

              return new Response(
                `<!DOCTYPE html>
<html>
<head>
  <title>Expired Link</title>
  <style>
    body { font-family: sans-serif; background-color: #fafafa; color: #111; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    h1 { font-size: 24px; font-weight: bold; margin-bottom: 12px; }
    p { color: #666; margin-bottom: 24px; }
    a { color: #1a8744; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>This demo link has expired</h1>
  <p>Demo links are temporary and deleted automatically after 1 hour.</p>
  <a href="/demo">Upload a new demo file</a>
</body>
</html>`,
                {
                  status: 410,
                  headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control": "private, no-store",
                    "X-Content-Type-Options": "nosniff",
                    "X-Robots-Tag": "noindex, nofollow",
                  },
                }
              );
            }

            const blob = await downloadFile(file.storagePath);
            const htmlContent = await blob.text();

            return new Response(htmlContent, {
              headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "private, no-store",
                "X-Content-Type-Options": "nosniff",
                "Content-Security-Policy": "sandbox allow-scripts",
                "X-Robots-Tag": "noindex, nofollow",
              },
            });
          } catch (error) {
            console.error("API error serving demo file:", error);
            return new Response("Error serving file", { status: 500 });
          }
        }

        // 3. actor = await resolveActor(request)
        const actor = await resolveActor(request);

        // 4. if (!actor) -> 302 to /auth/signin (still BEFORE 404)
        if (!actor) {
          const baseUrl = process.env.BETTER_AUTH_URL || request.url;
          const loginUrl = new URL("/auth/signin", baseUrl);
          loginUrl.searchParams.set("callbackUrl", `/s/${customer_slug}/${file_slug}`);
          return Response.redirect(loginUrl, 302);
        }

        // 5. if (!customer) -> 404 (never leaks workspace existence to anon caller)
        if (!customer) return new Response("Workspace not found", { status: 404 });

        // 6. ...existing membership checks, unchanged
        try {
          // Re-fetch customer with actor membership relation to check permissions
          const customerWithMembership = await prisma.customer.findUnique({
            where: { slug: customer_slug },
            include: actor.kind === "user" ? { users: { where: { userId: actor.userId } } } : undefined,
          });

          if (!customerWithMembership) return new Response("Workspace not found", { status: 404 });

          if (actor.kind === "customer") {
            if (actor.customerSlug !== customer_slug) return new Response("Access Denied to Workspace", { status: 403 });
          } else {
            const hasMembership = ((customerWithMembership as { users?: unknown[] }).users?.length ?? 0) > 0;
            if (!actor.isAdmin && !hasMembership) return new Response("Access Denied to Workspace", { status: 403 });
          }

          const file = await prisma.file.findUnique({ where: { customerId_slug: { customerId: customerWithMembership.id, slug: file_slug } } });
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
          console.error("API error serving file:", error);
          return new Response("Error serving file", { status: 500 });
        }
      },
    },
  },
});
