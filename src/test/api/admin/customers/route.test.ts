import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/admin/customers/route';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}));

describe('/api/admin/customers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);
      const res = await GET();
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('returns customers if authorized as admin', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      vi.mocked(prisma.customer.findMany).mockResolvedValueOnce([{ id: '1', name: 'Test' } as any]);
      const res = await GET();
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.customers).toEqual([{ id: '1', name: 'Test' }]);
    });
  });

  describe('POST', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);
      const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(401);
    });

    it('returns 400 if missing fields', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ name: 'Only Name' }) });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('Missing fields');
    });

    it('creates customer and returns 200 on success', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed_pw' as any);
      vi.mocked(prisma.customer.create).mockResolvedValueOnce({ id: '2', name: 'New', slug: 'new' } as any);

      const req = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ name: 'New', slug: 'new', password: 'password123' })
      });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.customer).toEqual({ id: '2', name: 'New', slug: 'new' });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.customer.create).toHaveBeenCalledWith({
        data: { name: 'New', slug: 'new', passwordHash: 'hashed_pw' }
      });
    });

    it('returns 500 on db error', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed_pw' as any);
      vi.mocked(prisma.customer.create).mockRejectedValueOnce(new Error('DB Error'));

      const req = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ name: 'New', slug: 'new', password: 'password123' })
      });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(500);
      expect(json.error).toBe('DB Error');
    });
  });
});
