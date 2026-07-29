import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Route } from "@/routes/s/$customer_slug/$file_slug";
import { prisma } from "@/lib/prisma";
import { downloadFile, deleteFile } from "@/lib/storage";
import { resolveActor } from "@/lib/auth-utils";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: {
      findUnique: vi.fn(),
    },
    file: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/storage", () => ({
  downloadFile: vi.fn(),
  deleteFile: vi.fn(),
}));

vi.mock("@/lib/auth-utils", () => ({
  resolveActor: vi.fn(),
}));

describe("Short URL serving route GET /s/$customer_slug/$file_slug", () => {
  const originalEnv = process.env;
  const GET = (Route as any).options.server.handlers.GET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      DEMO_ENABLED: "true",
      BETTER_AUTH_URL: "http://localhost:3000",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should serve unexpired demo artifacts with 200 and custom headers", async () => {
    const mockCustomer = { id: "demo-cust-id", slug: "demo", isDemo: true };
    const mockFile = {
      id: "file-id",
      slug: "live-token",
      storagePath: "tenants/demo/files/live-token.html",
      expiresAt: new Date(Date.now() + 1800 * 1000), // 30 mins in future
    };

    vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce(mockCustomer as any);
    vi.mocked(prisma.file.findUnique).mockResolvedValueOnce(mockFile as any);
    vi.mocked(downloadFile).mockResolvedValueOnce(new Blob(["<html>live text</html>"], { type: "text/html" }));

    const req = new Request("http://localhost/s/demo/live-token");
    const res = await GET({ request: req, params: { customer_slug: "demo", file_slug: "live-token" } });

    expect(res.status).toBe(200);
    const content = await res.text();
    expect(content).toBe("<html>live text</html>");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(resolveActor).not.toHaveBeenCalled();
  });

  it("should trigger lazy deletion and serve 410 for expired demo links", async () => {
    const mockCustomer = { id: "demo-cust-id", slug: "demo", isDemo: true };
    const mockFile = {
      id: "file-id",
      slug: "expired-token",
      storagePath: "tenants/demo/files/expired-token.html",
      expiresAt: new Date(Date.now() - 1000), // expired
    };

    vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce(mockCustomer as any);
    vi.mocked(prisma.file.findUnique).mockResolvedValueOnce(mockFile as any);
    vi.mocked(deleteFile).mockResolvedValueOnce(undefined);
    vi.mocked(prisma.file.delete).mockResolvedValueOnce({ id: "file-id" } as any);

    const req = new Request("http://localhost/s/demo/expired-token");
    const res = await GET({ request: req, params: { customer_slug: "demo", file_slug: "expired-token" } });

    expect(res.status).toBe(410);
    const html = await res.text();
    expect(html).toContain("This demo link has expired");

    expect(deleteFile).toHaveBeenCalledWith("tenants/demo/files/expired-token.html");
    expect(prisma.file.delete).toHaveBeenCalledWith({ where: { id: "file-id" } });
  });

  it("should redirect anonymous request to /auth/signin if customer is not demo (preserving load ordering)", async () => {
    const mockCustomer = { id: "real-cust-id", slug: "acme", isDemo: false };
    vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce(mockCustomer as any);
    vi.mocked(resolveActor).mockResolvedValueOnce(null); // anonymous

    const req = new Request("http://localhost/s/acme/doc-1");
    const res = await GET({ request: req, params: { customer_slug: "acme", file_slug: "doc-1" } });

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("/auth/signin");
  });
});
