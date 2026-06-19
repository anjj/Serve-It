import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/admin/users/revoke/route';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userCustomer: {
      delete: vi.fn(),
    },
  },
}));

describe('/api/admin/users/revoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);
      const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('revokes user from customer on success', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      vi.mocked(prisma.userCustomer.delete).mockResolvedValueOnce({} as any);

      const req = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u1', customerId: 'c1' })
      });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prisma.userCustomer.delete).toHaveBeenCalledWith({
        where: { userId_customerId: { userId: 'u1', customerId: 'c1' } }
      });
    });

    it('returns 500 on db error', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      vi.mocked(prisma.userCustomer.delete).mockRejectedValueOnce(new Error('DB Error'));

      const req = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u1', customerId: 'c1' })
      });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(500);
      expect(json.error).toBe('DB Error');
    });
  });
});
