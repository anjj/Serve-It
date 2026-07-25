import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/admin/users/role/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

const adminUser = { id: 'admin-1', isAdmin: true, name: 'Admin', email: 'admin@example.com' };

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}));

describe('/api/admin/users/role', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as any);
      const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({}) });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('toggles user admin role on success', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: adminUser } as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      const req = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u1', isAdmin: true })
      });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { isAdmin: true }
      });
    });

    it('returns 500 on db error', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: adminUser } as any);
      vi.mocked(prisma.user.update).mockRejectedValueOnce(new Error('DB Error'));

      const req = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u1', isAdmin: true })
      });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });
  });
});
