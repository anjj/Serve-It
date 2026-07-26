import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/routes/api/admin/users/assign';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userCustomer: {
      create: vi.fn(),
    },
  },
}));

function req(body: unknown) {
  return new Request('http://localhost', { method: 'POST', body: JSON.stringify(body) });
}

describe('/api/admin/users/assign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as any);
      const res = await POST({ request: req({}), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('assigns user to customer on success', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      vi.mocked(prisma.userCustomer.create).mockResolvedValueOnce({} as any);

      const res = await POST({ request: req({ userId: 'u1', customerId: 'c1' }), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prisma.userCustomer.create).toHaveBeenCalledWith({
        data: { userId: 'u1', customerId: 'c1' },
      });
    });

    it('returns 500 on db error', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      vi.mocked(prisma.userCustomer.create).mockRejectedValueOnce(new Error('DB Error'));

      const res = await POST({ request: req({ userId: 'u1', customerId: 'c1' }), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });
  });
});
