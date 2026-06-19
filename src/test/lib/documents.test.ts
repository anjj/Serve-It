import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDocument, patchDocument } from '@/lib/documents';
import { prisma } from '@/lib/prisma';
import { uploadHtmlFile } from '@/lib/storage';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    file: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/storage', () => ({
  uploadHtmlFile: vi.fn(),
}));

describe('documents service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDocument', () => {
    it('should throw error if slug already exists', async () => {
      vi.mocked(prisma.file.findUnique).mockResolvedValueOnce({ id: 'existing' } as any);

      await expect(createDocument('cust-1', {
        title: 'Test',
        slug: 'test',
        content: 'html'
      })).rejects.toThrow('already exists');
    });

    it('should upload content and create database record', async () => {
      vi.mocked(prisma.file.findUnique).mockResolvedValueOnce(null);
      vi.mocked(uploadHtmlFile).mockResolvedValueOnce('path/to/file.html');
      vi.mocked(prisma.file.create).mockResolvedValueOnce({ id: 'new-id', slug: 'test' } as any);

      const result = await createDocument('cust-1', {
        title: 'Test',
        slug: 'test',
        content: '<html></html>',
        tags: 'tag1, tag2',
        metadata: JSON.stringify({ key: 'val' })
      });

      expect(uploadHtmlFile).toHaveBeenCalledWith('cust-1', 'test', '<html></html>');
      expect(prisma.file.create).toHaveBeenCalledWith({
        data: {
          title: 'Test',
          slug: 'test',
          tags: ['tag1', 'tag2'],
          metadata: { key: 'val' },
          storagePath: 'path/to/file.html',
          customerId: 'cust-1',
        }
      });
      expect(result.id).toBe('new-id');
    });
  });

  describe('patchDocument', () => {
    it('should throw if document not found', async () => {
      vi.mocked(prisma.file.findUnique).mockResolvedValueOnce(null);
      await expect(patchDocument('cust-1', 'test', { title: 'new' })).rejects.toThrow('File not found');
    });

    it('should update provided fields', async () => {
      vi.mocked(prisma.file.findUnique).mockResolvedValueOnce({ id: 'ext' } as any);
      vi.mocked(prisma.file.update).mockResolvedValueOnce({ id: 'ext', title: 'Updated' } as any);

      await patchDocument('cust-1', 'test', { title: 'Updated', tags: ['new'] });

      expect(prisma.file.update).toHaveBeenCalledWith({
        where: { customerId_slug: { customerId: 'cust-1', slug: 'test' } },
        data: { title: 'Updated', tags: ['new'] }
      });
    });

    it('should upload new content if provided', async () => {
      vi.mocked(prisma.file.findUnique).mockResolvedValueOnce({ id: 'ext' } as any);
      vi.mocked(prisma.file.update).mockResolvedValueOnce({ id: 'ext' } as any);

      await patchDocument('cust-1', 'test', { content: 'new content' });

      expect(uploadHtmlFile).toHaveBeenCalledWith('cust-1', 'test', 'new content');
      expect(prisma.file.update).toHaveBeenCalledWith({
        where: { customerId_slug: { customerId: 'cust-1', slug: 'test' } },
        data: { updatedAt: expect.any(Date) }
      });
    });
  });
});
