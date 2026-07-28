import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/routes/api/admin/users/delete';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

function req(body: unknown) {
  return new Request('http://localhost', { method: 'POST', body: JSON.stringify(body) });
}

describe('/api/admin/users/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as any);
      const res = await POST({ request: req({ userId: 'u1', confirmEmail: 'u1@example.com' }), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('returns 401 if not admin', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: { id: 'u1', isAdmin: false, email: 'u1@example.com' }
      } as any);
      const res = await POST({ request: req({ userId: 'u2', confirmEmail: 'u2@example.com' }), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('returns 400 on invalid JSON', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: { id: 'admin1', isAdmin: true, email: 'admin@example.com' }
      } as any);
      const invalidReq = new Request('http://localhost', { method: 'POST', body: 'invalid-json' });
      const res = await POST({ request: invalidReq, params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('Invalid JSON payload');
    });

    it('returns 400 on missing fields', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: { id: 'admin1', isAdmin: true, email: 'admin@example.com' }
      } as any);
      const res = await POST({ request: req({ userId: 'u1' }), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('Missing fields');
    });

    it('returns 404 if user not found', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: { id: 'admin1', isAdmin: true, email: 'admin@example.com' }
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      const res = await POST({ request: req({ userId: 'u1', confirmEmail: 'u1@example.com' }), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(404);
      expect(json.error).toBe('User not found');
    });

    it('returns 400 if confirmEmail does not match user email', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: { id: 'admin1', isAdmin: true, email: 'admin@example.com' }
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'u1', email: 'u1@example.com' } as any);

      const res = await POST({ request: req({ userId: 'u1', confirmEmail: 'wrong@example.com' }), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('Confirmation does not match');
    });

    it('returns 400 if user tries to self-delete', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: { id: 'admin1', isAdmin: true, email: 'admin@example.com' }
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'admin1', email: 'admin@example.com' } as any);

      const res = await POST({ request: req({ userId: 'admin1', confirmEmail: 'admin@example.com' }), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('Cannot delete your own account');
    });

    it('returns 400 if user is the last remaining admin', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: { id: 'admin1', isAdmin: true, email: 'admin@example.com' }
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'admin2', email: 'admin2@example.com', isAdmin: true } as any);
      vi.mocked(prisma.user.count).mockResolvedValueOnce(1); // Only admin2 (or 1 total admin)

      const res = await POST({ request: req({ userId: 'admin2', confirmEmail: 'admin2@example.com' }), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('Cannot delete the last remaining admin');
    });

    it('deletes user on happy path', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: { id: 'admin1', isAdmin: true, email: 'admin@example.com' }
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'u2', email: 'u2@example.com', isAdmin: false } as any);
      vi.mocked(prisma.user.delete).mockResolvedValueOnce({} as any);

      const res = await POST({ request: req({ userId: 'u2', confirmEmail: 'u2@example.com' }), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u2' } });
    });
  });
});
