import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/routes/api/admin/apikeys';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    apiKey: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((args) => {
      if (Array.isArray(args)) {
        return Promise.all(args);
      }
      return args(prisma);
    }),
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

const adminUser = { id: 'admin-1', isAdmin: true, name: 'Admin', email: 'admin@example.com' };

function req(body: unknown) {
  return new Request('http://localhost/api/admin/apikeys', { method: 'POST', body: JSON.stringify(body) });
}

describe('POST /api/admin/apikeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if unauthorized (no session)', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as any);

    const res = await POST({ request: req({ name: 'Test Key', userId: 'user-1' }), params: {} } as any);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 if user is not an admin', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { id: 'user-1', isAdmin: false, name: null, email: 'user@example.com' } } as any);

    const res = await POST({ request: req({ name: 'Test Key', userId: 'user-1' }), params: {} } as any);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if name is missing', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: adminUser } as any);

    const res = await POST({ request: req({ userId: 'user-1' }), params: {} } as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing fields');
  });

  it('should return 400 if userId is missing', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: adminUser } as any);

    const res = await POST({ request: req({ name: 'Test Key' }), params: {} } as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing fields');
  });

  it('should return 404 if the target user does not exist', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: adminUser } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const res = await POST({ request: req({ name: 'Test Key', userId: 'missing-user' }), params: {} } as any);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('User not found');
  });

  it('should delete existing keys, generate, hash, persist, and return the new key on success', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: adminUser } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'user-123' } as any);

    const createdRecord = {
      id: 'key-123',
      name: 'Test Key',
      keyHash: 'dummyhash',
      userId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.apiKey.deleteMany).mockResolvedValueOnce({ count: 1 });
    vi.mocked(prisma.apiKey.create).mockResolvedValueOnce(createdRecord);

    const res = await POST({ request: req({ name: 'Test Key', userId: 'user-123' }), params: {} } as any);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.key).toContain('sk_live_serve-it_');
    expect(data.record.id).toBe('key-123');
    expect(data.record.name).toBe('Test Key');

    expect(prisma.apiKey.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
    });
    expect(prisma.apiKey.create).toHaveBeenCalledWith({
      data: {
        name: 'Test Key',
        keyHash: expect.any(String),
        userId: 'user-123',
      },
    });
  });

  it('should return 500 when database transaction fails', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: adminUser } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'user-123' } as any);
    vi.mocked(prisma.$transaction).mockRejectedValueOnce(new Error('DB Connection Timeout'));

    const res = await POST({ request: req({ name: 'Test Key', userId: 'user-123' }), params: {} } as any);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Internal server error');
  });
});
