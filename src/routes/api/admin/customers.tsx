import { createFileRoute } from "@tanstack/react-router";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-utils";
import { parseJsonBody, SLUG_PATTERN } from "@/lib/http";

export const GET = withAdmin(async () => {
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
  return Response.json({ customers });
});

export const POST = withAdmin(async ({ request }: { request: Request }) => {
  const body = (await parseJsonBody(request)) as { name?: string; slug?: string; password?: string } | null;
  if (!body) return Response.json({ error: "Invalid JSON payload" }, { status: 400 });

  const { name, slug, password } = body;
  if (!name || !slug || !password) return Response.json({ error: "Missing fields" }, { status: 400 });

  if (!SLUG_PATTERN.test(slug)) {
    return Response.json(
      { error: "Invalid slug format. Only alphanumeric characters, dashes, and underscores are allowed." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const customer = await prisma.customer.create({ data: { name, slug, passwordHash } });
    return Response.json({ customer });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/admin/customers")({
  server: { handlers: { GET, POST } },
});
