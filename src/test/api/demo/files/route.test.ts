import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/routes/api/demo/files";
import { prisma } from "@/lib/prisma";
import { uploadHtmlFile } from "@/lib/storage";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: {
      findFirst: vi.fn(),
    },
    file: {
      count: vi.fn(),
      create: vi.fn(),
    },
    demoUploadLog: {
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/storage", () => ({
  uploadHtmlFile: vi.fn(),
}));

const mockDemoCustomer = {
  id: "demo-cust-id",
  name: "Demo Workspace",
  slug: "demo",
  isDemo: true,
  passwordHash: null,
  isActive: true,
};

describe("POST /api/demo/files", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      DEMO_ENABLED: "true",
      DEMO_MAX_FILE_BYTES: "2000000",
      DEMO_RATE_LIMIT_PER_IP_PER_HOUR: "5",
      DEMO_GLOBAL_ACTIVE_LIMIT: "500",
      BETTER_AUTH_SECRET: "test-secret",
      BETTER_AUTH_URL: "http://localhost:3000",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return 404 if DEMO_ENABLED is false", async () => {
    process.env.DEMO_ENABLED = "false";
    const req = new Request("http://localhost/api/demo/files", {
      method: "POST",
    });
    const res = await POST({ request: req } as any);
    expect(res.status).toBe(404);
  });

  it("should return 413 if file exceeds DEMO_MAX_FILE_BYTES from Content-Length header", async () => {
    const req = new Request("http://localhost/api/demo/files", {
      method: "POST",
    });

    // Explicitly stub get on headers to return "3000000" for content-length
    vi.spyOn(req.headers, "get").mockImplementation((name: string) => {
      if (name.toLowerCase() === "content-length") {
        return "3000000";
      }
      return null;
    });

    const res = await POST({ request: req } as any);
    expect(res.status).toBe(413);
    const data = await res.json();
    expect(data.error).toBe("File too large");
  });

  it("should return 400 if file is missing in form data", async () => {
    const formData = new FormData();
    const req = new Request("http://localhost/api/demo/files", {
      method: "POST",
      body: formData,
    });
    const res = await POST({ request: req } as any);
    expect(res.status).toBe(400);
  });

  it("should return 400 for non-.html/.htm extension files", async () => {
    const formData = new FormData();
    formData.append("file", new File(["hello"], "document.txt", { type: "text/plain" }));
    const req = new Request("http://localhost/api/demo/files", {
      method: "POST",
      body: formData,
    });
    const res = await POST({ request: req } as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Only .html and .htm files are allowed");
  });

  it("should return 400 if file content is empty", async () => {
    const formData = new FormData();
    formData.append("file", new File(["   "], "document.html", { type: "text/html" }));
    const req = new Request("http://localhost/api/demo/files", {
      method: "POST",
      body: formData,
    });
    const res = await POST({ request: req } as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("File content cannot be empty");
  });

  it("should return 429 if the client exceeds hourly rate limit", async () => {
    // Mock upload logs count in trailing hour to be 5 (limit met)
    vi.mocked(prisma.demoUploadLog.count).mockResolvedValueOnce(5);

    const formData = new FormData();
    formData.append("file", new File(["<html></html>"], "document.html", { type: "text/html" }));
    const req = new Request("http://localhost/api/demo/files", {
      method: "POST",
      headers: {
        "x-forwarded-for": "1.2.3.4",
      },
      body: formData,
    });
    const res = await POST({ request: req } as any);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("3600");
  });

  it("should return 503 if global active demo files capacity is reached", async () => {
    vi.mocked(prisma.demoUploadLog.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.customer.findFirst).mockResolvedValueOnce(mockDemoCustomer as any);
    // Mock global demo files count to be 500 (limit met)
    vi.mocked(prisma.file.count).mockResolvedValueOnce(500);

    const formData = new FormData();
    formData.append("file", new File(["<html></html>"], "document.html", { type: "text/html" }));
    const req = new Request("http://localhost/api/demo/files", {
      method: "POST",
      body: formData,
    });
    const res = await POST({ request: req } as any);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe("Demo is at capacity, try again shortly");
  });

  it("should succeed and return 201 with live URL and expiresAt", async () => {
    vi.mocked(prisma.demoUploadLog.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.customer.findFirst).mockResolvedValueOnce(mockDemoCustomer as any);
    vi.mocked(prisma.file.count).mockResolvedValueOnce(10);
    vi.mocked(uploadHtmlFile).mockResolvedValueOnce("tenants/demo/files/randomslug.html");
    vi.mocked(prisma.file.create).mockResolvedValueOnce({ id: "file-id" } as any);
    vi.mocked(prisma.demoUploadLog.create).mockResolvedValueOnce({ id: "log-id" } as any);

    const formData = new FormData();
    formData.append("file", new File(["<html>hello</html>"], "document.html", { type: "text/html" }));
    const req = new Request("http://localhost/api/demo/files", {
      method: "POST",
      body: formData,
    });
    const res = await POST({ request: req } as any);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.url).toContain("/s/demo/");
    expect(data.expiresAt).toBeDefined();
    expect(uploadHtmlFile).toHaveBeenCalled();
  });
});
