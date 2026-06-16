import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, PATCH } from '@/app/api/v1/files/route';
import { validateApiKey } from '@/lib/auth-api';
import { createDocument, patchDocument } from '@/lib/documents';

vi.mock('@/lib/auth-api', () => ({
  validateApiKey: vi.fn(),
}));

vi.mock('@/lib/documents', () => ({
  createDocument: vi.fn(),
  patchDocument: vi.fn(),
}));

describe('API v1 Files Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('should return 401 if API key is invalid', async () => {
      vi.mocked(validateApiKey).mockResolvedValueOnce(null);
      const req = new Request('http://localhost/api/v1/files', { method: 'POST' });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('should return 400 if customer_slug is missing', async () => {
      vi.mocked(validateApiKey).mockResolvedValueOnce({ userId: 'u1' });
      const req = new Request('http://localhost/api/v1/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'T', slug: 's', content: 'c' })
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: expect.stringContaining('customer_slug') });
    });

    it('should return 403 if user has no access to workspace', async () => {
      vi.mocked(validateApiKey)
        .mockResolvedValueOnce({ userId: 'u1' }) // first call (general)
        .mockResolvedValueOnce(null); // second call (with context)

      const req = new Request('http://localhost/api/v1/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_slug: 'c1', title: 'T', slug: 's', content: 'c' })
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it('should successfully create document', async () => {
      vi.mocked(validateApiKey).mockResolvedValue({ customerId: 'cust-id' });
      vi.mocked(createDocument).mockResolvedValueOnce({ id: 'f1', slug: 's' } as any);

      const req = new Request('http://localhost/api/v1/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_slug: 'c1', title: 'T', slug: 's', content: 'c' })
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(createDocument).toHaveBeenCalledWith('cust-id', expect.objectContaining({ title: 'T' }));
    });
  });

  describe('PATCH', () => {
    it('should successfully patch document', async () => {
      vi.mocked(validateApiKey).mockResolvedValue({ customerId: 'cust-id' });
      vi.mocked(patchDocument).mockResolvedValueOnce({ id: 'f1', slug: 's' } as any);

      const req = new Request('http://localhost/api/v1/files', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_slug: 'c1', slug: 's', title: 'New' })
      });
      const res = await PATCH(req);
      expect(res.status).toBe(200);
      expect(patchDocument).toHaveBeenCalledWith('cust-id', 's', expect.objectContaining({ title: 'New' }));
    });
  });
});
