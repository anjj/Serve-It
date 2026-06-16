import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/admin/apikeys/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      create: vi.fn(),
    },
  },
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

describe('POST /api/admin/apikeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if unauthorized (no session)', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const req = new Request('http://localhost/api/admin/apikeys', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Key', customerId: 'cust-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 if user is not an admin', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'user@example.com', isAdmin: false },
    } as any);

    const req = new Request('http://localhost/api/admin/apikeys', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Key', customerId: 'cust-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if name is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'admin@example.com', isAdmin: true },
    } as any);

    const req = new Request('http://localhost/api/admin/apikeys', {
      method: 'POST',
      body: JSON.stringify({ customerId: 'cust-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing fields');
  });

  it('should return 400 if both customerId and userId are missing', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'admin@example.com', isAdmin: true },
    } as any);

    const req = new Request('http://localhost/api/admin/apikeys', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Key' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing fields');
  });

  it('should generate, hash, persist, and return the key on success', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'admin@example.com', isAdmin: true },
    } as any);

    const createdRecord = {
      id: 'key-123',
      name: 'Test Key',
      keyHash: 'dummyhash',
      customerId: 'cust-123',
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.apiKey.create).mockResolvedValueOnce(createdRecord);

    const req = new Request('http://localhost/api/admin/apikeys', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Key', customerId: 'cust-123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.key).toContain('sk_live_serve-it_');
    expect(data.record.id).toBe('key-123');
    expect(data.record.name).toBe('Test Key');

    expect(prisma.apiKey.create).toHaveBeenCalledWith({
      data: {
        name: 'Test Key',
        keyHash: expect.any(String),
        customerId: 'cust-123',
        userId: null,
      },
    });
  });

  it('should support generating key associated only with userId', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'admin@example.com', isAdmin: true },
    } as any);

    const createdRecord = {
      id: 'key-456',
      name: 'User Key',
      keyHash: 'dummyhash2',
      customerId: null,
      userId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.apiKey.create).mockResolvedValueOnce(createdRecord);

    const req = new Request('http://localhost/api/admin/apikeys', {
      method: 'POST',
      body: JSON.stringify({ name: 'User Key', userId: 'user-123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.key).toContain('sk_live_serve-it_');
    expect(data.record.id).toBe('key-456');

    expect(prisma.apiKey.create).toHaveBeenCalledWith({
      data: {
        name: 'User Key',
        keyHash: expect.any(String),
        customerId: null,
        userId: 'user-123',
      },
    });
  });

  it('should return 500 when database insertion fails', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: 'admin@example.com', isAdmin: true },
    } as any);

    vi.mocked(prisma.apiKey.create).mockRejectedValueOnce(new Error('DB Connection Timeout'));

    const req = new Request('http://localhost/api/admin/apikeys', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Key', customerId: 'cust-123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('DB Connection Timeout');
  });
});
