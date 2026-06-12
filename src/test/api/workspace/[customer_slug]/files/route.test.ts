import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/workspace/[customer_slug]/files/route';
import { prisma } from '@/lib/prisma';
import { uploadHtmlFile } from '@/lib/storage';
import { getServerSession } from 'next-auth/next';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer: {
      findUnique: vi.fn(),
    },
    file: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/storage', () => ({
  uploadHtmlFile: vi.fn(),
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

describe('POST /api/workspace/[customer_slug]/files', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if unauthorized (no session)', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);
    const req = new Request('http://localhost/api/workspace/test-customer/files', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', slug: 'test-file', file: '<html></html>' }),
    });
    const res = await POST(req, { params: Promise.resolve({ customer_slug: 'test-customer' }) });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 if workspace does not exist', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
    });
    vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce(null);

    const req = new Request('http://localhost/api/workspace/test-customer/files', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', slug: 'test-file', file: '<html></html>' }),
    });
    const res = await POST(req, { params: Promise.resolve({ customer_slug: 'test-customer' }) });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('Workspace not found');
  });

  it('should return 403 if user has no access to workspace and is not admin', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'John Doe', email: 'john@example.com', isAdmin: false },
    });
    vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce({
      id: 'cust-1',
      name: 'Test Customer',
      slug: 'test-customer',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      users: [], // No mapping for user-1
    } as any);

    const req = new Request('http://localhost/api/workspace/test-customer/files', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', slug: 'test-file', file: '<html></html>' }),
    });
    const res = await POST(req, { params: Promise.resolve({ customer_slug: 'test-customer' }) });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Access denied');
  });

  it('should return 400 if required fields are missing', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
    });
    vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce({
      id: 'cust-1',
      name: 'Test Customer',
      slug: 'test-customer',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      users: [{ userId: 'user-1' }],
    } as any);

    const req = new Request('http://localhost/api/workspace/test-customer/files', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }), // missing slug and file
    });
    const res = await POST(req, { params: Promise.resolve({ customer_slug: 'test-customer' }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing required fields');
  });

  it('should return 409 if a file with same slug already exists', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
    });
    vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce({
      id: 'cust-1',
      name: 'Test Customer',
      slug: 'test-customer',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      users: [{ userId: 'user-1' }],
    } as any);
    vi.mocked(prisma.file.findUnique).mockResolvedValueOnce({ id: 'file-1' } as any);

    const req = new Request('http://localhost/api/workspace/test-customer/files', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', slug: 'test-file', file: '<html></html>' }),
    });
    const res = await POST(req, { params: Promise.resolve({ customer_slug: 'test-customer' }) });
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe('A file with this slug already exists for this customer');
  });

  it('should successfully upload file and create record', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
    });
    vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce({
      id: 'cust-1',
      name: 'Test Customer',
      slug: 'test-customer',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      users: [{ userId: 'user-1' }],
    } as any);
    vi.mocked(prisma.file.findUnique).mockResolvedValueOnce(null);
    vi.mocked(uploadHtmlFile).mockResolvedValueOnce('tenants/cust-1/files/test-file.html');
    vi.mocked(prisma.file.create).mockResolvedValueOnce({
      id: 'file-2',
      title: 'Test',
      slug: 'test-file',
      tags: ['test'],
      metadata: {},
      storagePath: 'tenants/cust-1/files/test-file.html',
      customerId: 'cust-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = new Request('http://localhost/api/workspace/test-customer/files', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', slug: 'test-file', file: '<html></html>', tags: ['test'] }),
    });
    const res = await POST(req, { params: Promise.resolve({ customer_slug: 'test-customer' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.file.id).toBe('file-2');
    expect(uploadHtmlFile).toHaveBeenCalledWith('cust-1', 'test-file', '<html></html>');
  });
});
