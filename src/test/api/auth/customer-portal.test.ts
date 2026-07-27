import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/routes/api/auth/customer-portal';
import { prisma } from '@/lib/prisma';
import { getCustomerPortalCookie, verifyCustomerPortalToken } from '@/lib/customer-portal-auth';

vi.mock('@/lib/customer-portal-auth', () => ({
  getCustomerPortalCookie: vi.fn(),
  verifyCustomerPortalToken: vi.fn(),
  customerPortalSetCookieHeader: vi.fn(),
  customerPortalClearCookieHeader: vi.fn(),
  signCustomerPortalToken: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer: {
      findUnique: vi.fn(),
    },
  },
}));

describe('GET /api/auth/customer-portal (Stateless Fail-Closed Session)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null session if no cookie token exists', async () => {
    vi.mocked(getCustomerPortalCookie).mockReturnValueOnce(undefined);
    vi.mocked(verifyCustomerPortalToken).mockReturnValueOnce(null);

    const res = await GET({ request: new Request('http://localhost') });
    const json = await res.json();
    expect(json.session).toBeNull();
  });

  it('returns null session if customer does not exist in the database', async () => {
    vi.mocked(getCustomerPortalCookie).mockReturnValueOnce('some-token');
    vi.mocked(verifyCustomerPortalToken).mockReturnValueOnce({
      customerId: 'deleted-id',
      slug: 'deleted-slug',
      exp: Date.now() + 100000,
    });
    vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce(null);

    const res = await GET({ request: new Request('http://localhost') });
    const json = await res.json();
    expect(json.session).toBeNull();
    expect(prisma.customer.findUnique).toHaveBeenCalledWith({ where: { id: 'deleted-id' } });
  });

  it('returns null session if customer is inactive (soft-disabled)', async () => {
    vi.mocked(getCustomerPortalCookie).mockReturnValueOnce('some-token');
    vi.mocked(verifyCustomerPortalToken).mockReturnValueOnce({
      customerId: 'inactive-id',
      slug: 'inactive-slug',
      exp: Date.now() + 100000,
    });
    vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce({
      id: 'inactive-id',
      slug: 'inactive-slug',
      isActive: false,
    } as any);

    const res = await GET({ request: new Request('http://localhost') });
    const json = await res.json();
    expect(json.session).toBeNull();
  });

  it('returns valid session if customer exists and is active', async () => {
    vi.mocked(getCustomerPortalCookie).mockReturnValueOnce('valid-token');
    vi.mocked(verifyCustomerPortalToken).mockReturnValueOnce({
      customerId: 'active-id',
      slug: 'active-slug',
      exp: Date.now() + 100000,
    });
    vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce({
      id: 'active-id',
      slug: 'active-slug',
      isActive: true,
    } as any);

    const res = await GET({ request: new Request('http://localhost') });
    const json = await res.json();
    expect(json.session).toEqual({
      customerId: 'active-id',
      slug: 'active-slug',
    });
  });
});
