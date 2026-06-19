import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateRawApiKey, validateApiKey } from '@/lib/auth-api';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
    },
  },
}));

describe('auth-api utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const rawKey = 'sk_live_serve-it_testkey';
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  describe('validateRawApiKey', () => {
    it('should return null if key is not found', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce(null);
      const result = await validateRawApiKey('invalid');
      expect(result).toBeNull();
    });

    it('should validate Customer-level key', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce({
        customerId: 'cust-1',
        customer: { id: 'cust-1', slug: 'workspace-1', isActive: true },
      } as any);

      const result = await validateRawApiKey(rawKey);
      expect(result).toEqual({
        customerId: 'cust-1',
        customerSlug: 'workspace-1',
      });
    });

    it('should validate User-level key with workspace access', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce({
        userId: 'user-1',
        user: {
          id: 'user-1',
          isAdmin: false,
          customers: [
            { customer: { id: 'cust-1', slug: 'workspace-1', isActive: true } }
          ]
        },
      } as any);

      const result = await validateRawApiKey(rawKey, 'workspace-1');
      expect(result).toEqual({
        userId: 'user-1',
        isAdmin: false,
        customerId: 'cust-1',
        customerSlug: 'workspace-1',
      });
    });

    it('should allow Admin user to access any active workspace', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce({
        userId: 'admin-1',
        user: {
          id: 'admin-1',
          isAdmin: true,
          customers: []
        },
      } as any);
      vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce({ id: 'cust-2', slug: 'workspace-2', isActive: true } as any);

      const result = await validateRawApiKey(rawKey, 'workspace-2');
      expect(result).toEqual({
        userId: 'admin-1',
        isAdmin: true,
        customerId: 'cust-2',
        customerSlug: 'workspace-2',
      });
    });

    it('should return null if user has no access to workspace', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce({
        userId: 'user-1',
        user: {
          id: 'user-1',
          isAdmin: false,
          customers: []
        },
      } as any);

      const result = await validateRawApiKey(rawKey, 'workspace-1');
      expect(result).toBeNull();
    });
  });

  describe('validateApiKey', () => {
    it('should extract key from Authorization header', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce({
        customerId: 'cust-1',
        customer: { id: 'cust-1', slug: 'workspace-1', isActive: true },
      } as any);

      const req = new Request('http://localhost', {
        headers: { 'Authorization': `Bearer ${rawKey}` }
      });
      const result = await validateApiKey(req);
      expect(result?.customerId).toBe('cust-1');
    });

    it('should extract key from X-API-Key header', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce({
        customerId: 'cust-1',
        customer: { id: 'cust-1', slug: 'workspace-1', isActive: true },
      } as any);

      const req = new Request('http://localhost', {
        headers: { 'X-API-Key': rawKey }
      });
      const result = await validateApiKey(req);
      expect(result?.customerId).toBe('cust-1');
    });
  });
});
