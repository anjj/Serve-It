import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PATCH, DELETE } from '@/routes/api/admin/customers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteCustomerStorage } from '@/lib/storage';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    file: {
      count: vi.fn(),
    },
  },
}));

vi.mock('@/lib/storage', () => ({
  deleteCustomerStorage: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}));

function req(body?: unknown, method = 'POST') {
  return new Request('http://localhost', { method, body: body === undefined ? undefined : JSON.stringify(body) });
}

describe('/api/admin/customers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as any);
      const res = await GET({ request: new Request('http://localhost'), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('returns customers if authorized as admin', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      vi.mocked(prisma.customer.findMany).mockResolvedValueOnce([{ id: '1', name: 'Test' } as any]);
      const res = await GET({ request: new Request('http://localhost'), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.customers).toEqual([{ id: '1', name: 'Test' }]);
    });
  });

  describe('POST', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as any);
      const res = await POST({ request: req({}), params: {} } as any);
      expect(res.status).toBe(401);
    });

    it('returns 400 if missing fields', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      const res = await POST({ request: req({ name: 'Only Name' }), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('Missing fields');
    });

    it('creates customer and returns 200 on success', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed_pw' as any);
      vi.mocked(prisma.customer.create).mockResolvedValueOnce({ id: '2', name: 'New', slug: 'new' } as any);

      const res = await POST({ request: req({ name: 'New', slug: 'new', password: 'password123' }), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.customer).toEqual({ id: '2', name: 'New', slug: 'new' });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.customer.create).toHaveBeenCalledWith({
        data: { name: 'New', slug: 'new', passwordHash: 'hashed_pw' },
      });
    });

    it('returns 500 on db error', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed_pw' as any);
      vi.mocked(prisma.customer.create).mockRejectedValueOnce(new Error('DB Error'));

      const res = await POST({ request: req({ name: 'New', slug: 'new', password: 'password123' }), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });
  });

  describe('PATCH', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as any);
      const res = await PATCH({ request: req({ customerId: '123', password: 'newpassword123' }, 'PATCH'), params: {} } as any);
      expect(res.status).toBe(401);
    });

    it('returns 400 if missing fields', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      const res = await PATCH({ request: req({ customerId: '123' }, 'PATCH'), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('Missing fields');
    });

    it('returns 400 if password is less than 8 characters', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      const res = await PATCH({ request: req({ customerId: '123', password: 'short' }, 'PATCH'), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('Password must be at least 8 characters long.');
    });

    it('returns 404 for non-existent customer', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce(null);

      const res = await PATCH({ request: req({ customerId: 'non-existent', password: 'newpassword123' }, 'PATCH'), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(404);
      expect(json.error).toBe('Workspace not found');
    });

    it('updates customer password hash and returns 200 on success', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce({ id: '123', name: 'Test' } as any);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('new_hashed_pw' as any);
      vi.mocked(prisma.customer.update).mockResolvedValueOnce({ id: '123', passwordHash: 'new_hashed_pw' } as any);

      const res = await PATCH({ request: req({ customerId: '123', password: 'newpassword123' }, 'PATCH'), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { passwordHash: 'new_hashed_pw' },
      });
    });

    it('returns 500 on db update error', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce({ id: '123', name: 'Test' } as any);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('new_hashed_pw' as any);
      vi.mocked(prisma.customer.update).mockRejectedValueOnce(new Error('DB Error'));

      const res = await PATCH({ request: req({ customerId: '123', password: 'newpassword123' }, 'PATCH'), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });
  });

  describe('DELETE', () => {
    it('returns 401 if unauthorized', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as any);
      const res = await DELETE({ request: req({ customerId: '123', confirmSlug: 'slug' }, 'DELETE'), params: {} } as any);
      expect(res.status).toBe(401);
    });

    it('returns 401 if non-admin user', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: false } } as any);
      const res = await DELETE({ request: req({ customerId: '123', confirmSlug: 'slug' }, 'DELETE'), params: {} } as any);
      expect(res.status).toBe(401);
    });

    it('returns 400 on invalid JSON payload', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      const request = new Request('http://localhost', { method: 'DELETE', body: 'invalid-json' });
      const res = await DELETE({ request, params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('Invalid JSON payload');
    });

    it('returns 400 if missing fields', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      const res = await DELETE({ request: req({ customerId: '123' }, 'DELETE'), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('Missing fields');
    });

    it('returns 404 for unknown customer', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce(null);

      const res = await DELETE({ request: req({ customerId: 'non-existent', confirmSlug: 'some-slug' }, 'DELETE'), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(404);
      expect(json.error).toBe('Workspace not found');
    });

    it('returns 400 if confirmSlug does not match', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce({ id: '123', slug: 'actual-slug' } as any);

      const res = await DELETE({ request: req({ customerId: '123', confirmSlug: 'mismatched-slug' }, 'DELETE'), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('Confirmation does not match');
    });

    it('returns 500 when deleteCustomerStorage throws, leaving DB customer record intact', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce({ id: '123', slug: 'actual-slug' } as any);
      vi.mocked(prisma.file.count).mockResolvedValueOnce(5);
      vi.mocked(deleteCustomerStorage).mockRejectedValueOnce(new Error('Storage failure'));

      const res = await DELETE({ request: req({ customerId: '123', confirmSlug: 'actual-slug' }, 'DELETE'), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(500);
      expect(json.error).toBe('Internal server error');
      expect(prisma.customer.delete).not.toHaveBeenCalled();
    });

    it('happy path deletes customer files and metadata, returning 200', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({ user: { isAdmin: true } } as any);
      vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce({ id: '123', slug: 'actual-slug' } as any);
      vi.mocked(prisma.file.count).mockResolvedValueOnce(5);
      vi.mocked(deleteCustomerStorage).mockResolvedValueOnce(12);
      vi.mocked(prisma.customer.delete).mockResolvedValueOnce({ id: '123' } as any);

      const res = await DELETE({ request: req({ customerId: '123', confirmSlug: 'actual-slug' }, 'DELETE'), params: {} } as any);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.deleted).toEqual({ files: 5, objects: 12 });

      expect(deleteCustomerStorage).toHaveBeenCalledWith('123');
      expect(prisma.customer.delete).toHaveBeenCalledWith({ where: { id: '123' } });
    });
  });
});
