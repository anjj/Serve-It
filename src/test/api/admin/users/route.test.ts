import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/admin/users/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

const adminUser = { id: 'admin-1', isAdmin: true, name: 'Admin', email: 'admin@example.com' };

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
  },
}));

describe('/api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as any);
      const res = await GET();
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('returns users if authorized as admin', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: adminUser } as any);
      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([{ id: '1', name: 'User 1' } as any]);
      const res = await GET();
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.users).toEqual([{ id: '1', name: 'User 1' }]);
    });
  });
});
