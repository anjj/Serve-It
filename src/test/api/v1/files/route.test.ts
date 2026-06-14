import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/v1/files/route';
import { prisma } from '@/lib/prisma';
import { uploadHtmlFile } from '@/lib/storage';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
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

describe('POST /api/v1/files', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if Authorization header is missing or invalid', async () => {
    const req = new Request('http://localhost/api/v1/files', {
      method: 'POST',
      body: new FormData(),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 if API key is invalid', async () => {
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce(null);

    const req = new Request('http://localhost/api/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-key',
      },
      body: new FormData(),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Invalid API Key');
  });

  it('should return 403 if customer workspace is inactive', async () => {
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce({
      id: 'key-1',
      customer: {
        id: 'cust-1',
        name: 'Inactive Customer',
        slug: 'inactive',
        isActive: false,
      },
    } as any);

    const req = new Request('http://localhost/api/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-key',
      },
      body: new FormData(),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Customer workspace is inactive');
  });

  it('should return 400 if required fields are missing', async () => {
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce({
      id: 'key-1',
      customer: {
        id: 'cust-1',
        name: 'Active Customer',
        slug: 'active',
        isActive: true,
      },
    } as any);

    const formData = new FormData();
    formData.append('title', 'Test'); // missing slug and file

    const req = new Request('http://localhost/api/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-key',
      },
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing required fields');
  });

  it('should return 409 if a file with same slug already exists', async () => {
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce({
      id: 'key-1',
      customer: {
        id: 'cust-1',
        name: 'Active Customer',
        slug: 'active',
        isActive: true,
      },
    } as any);
    vi.mocked(prisma.file.findUnique).mockResolvedValueOnce({ id: 'file-1' } as any);

    const formData = new FormData();
    formData.append('title', 'Test');
    formData.append('slug', 'test-file');
    formData.append('file', new File(['<html></html>'], 'test-file.html', { type: 'text/html' }));

    const req = new Request('http://localhost/api/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-key',
      },
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe('A file with this slug already exists for this customer');
  });

  it('should successfully upload file via API and create record', async () => {
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce({
      id: 'key-1',
      customer: {
        id: 'cust-1',
        name: 'Active Customer',
        slug: 'active',
        isActive: true,
      },
    } as any);
    vi.mocked(prisma.file.findUnique).mockResolvedValueOnce(null);
    vi.mocked(uploadHtmlFile).mockResolvedValueOnce('tenants/cust-1/files/test-file.html');
    vi.mocked(prisma.file.create).mockResolvedValueOnce({
      id: 'file-2',
      title: 'Test',
      slug: 'test-file',
      tags: ['test'],
      metadata: { source: 'api' },
      storagePath: 'tenants/cust-1/files/test-file.html',
      customerId: 'cust-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formData = new FormData();
    formData.append('title', 'Test');
    formData.append('slug', 'test-file');
    formData.append('file', new File(['<html></html>'], 'test-file.html', { type: 'text/html' }));
    formData.append('tags', 'test');
    formData.append('metadata', JSON.stringify({ source: 'api' }));

    const req = new Request('http://localhost/api/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-key',
      },
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.file.id).toBe('file-2');
    expect(uploadHtmlFile).toHaveBeenCalledWith('cust-1', 'test-file', '<html></html>');
  });
});
