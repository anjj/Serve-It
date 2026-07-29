import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/routes/api/demo/sweep";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    file: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    demoUploadLog: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/storage", () => ({
  deleteFile: vi.fn(),
}));

describe("POST /api/demo/sweep", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      DEMO_ENABLED: "true",
      DEMO_SWEEP_SECRET: "super-secret-sweep-key",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return 401 if Authorization header is missing or incorrect", async () => {
    const req = new Request("http://localhost/api/demo/sweep", {
      method: "POST",
    });
    const res1 = await POST({ request: req } as any);
    expect(res1.status).toBe(401);

    const reqWrong = new Request("http://localhost/api/demo/sweep", {
      method: "POST",
      headers: {
        "Authorization": "Bearer wrong-key",
      },
    });
    const res2 = await POST({ request: reqWrong } as any);
    expect(res2.status).toBe(401);
  });

  it("should successfully trigger sweep, deleting only expired files with batch cap 200", async () => {
    const mockExpiredFiles = [
      { id: "file-1", storagePath: "tenants/demo/files/file1.html" },
      { id: "file-2", storagePath: "tenants/demo/files/file2.html" },
    ];
    vi.mocked(prisma.file.findMany).mockResolvedValueOnce(mockExpiredFiles as any);
    vi.mocked(deleteFile).mockResolvedValue(undefined);
    vi.mocked(prisma.file.deleteMany).mockResolvedValueOnce({ count: 2 } as any);
    vi.mocked(prisma.demoUploadLog.deleteMany).mockResolvedValueOnce({ count: 5 } as any);
    vi.mocked(prisma.file.count).mockResolvedValueOnce(0);

    const req = new Request("http://localhost/api/demo/sweep", {
      method: "POST",
      headers: {
        "Authorization": "Bearer super-secret-sweep-key",
      },
    });
    const res = await POST({ request: req } as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deleted).toBe(2);
    expect(data.remaining).toBe(0);

    expect(prisma.file.findMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) } },
      take: 200,
    });
    expect(deleteFile).toHaveBeenCalledTimes(2);
    expect(prisma.file.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["file-1", "file-2"] } },
    });
    expect(prisma.demoUploadLog.deleteMany).toHaveBeenCalled();
  });
});
