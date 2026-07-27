import { createFileRoute } from "@tanstack/react-router";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-utils";
import { parseJsonBody, SLUG_PATTERN } from "@/lib/http";
import { deleteCustomerStorage } from "@/lib/storage";

export const GET = withAdmin(async () => {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { files: true },
      },
    },
  });
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

export const DELETE = withAdmin(async ({ request }: { request: Request }) => {
  const body = (await parseJsonBody(request)) as { customerId?: string; confirmSlug?: string } | null;
  if (!body) return Response.json({ error: "Invalid JSON payload" }, { status: 400 });

  const { customerId, confirmSlug } = body;
  if (!customerId || !confirmSlug) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return Response.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (confirmSlug !== customer.slug) {
      return Response.json({ error: "Confirmation does not match" }, { status: 400 });
    }

    const fileCount = await prisma.file.count({ where: { customerId } });

    // Delete customer storage files first. If this fails/throws, we abort before DB deletion.
    const deletedObjectsCount = await deleteCustomerStorage(customer.id);

    // Cascades File and UserCustomer rows via FK cascades
    await prisma.customer.delete({ where: { id: customerId } });

    return Response.json({
      success: true,
      deleted: {
        files: fileCount,
        objects: deletedObjectsCount,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const Route = createFileRoute("/api/admin/customers")({
  server: { handlers: { GET, POST, DELETE } },
});
