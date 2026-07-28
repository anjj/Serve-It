import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteCustomerStorage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}));

describe('deleteCustomerStorage', () => {
  const mockBucket = {
    list: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.storage.from).mockReturnValue(mockBucket as any);
  });

  it('returns 0 and does not call remove when there are no files', async () => {
    mockBucket.list.mockResolvedValueOnce({ data: [], error: null });

    const count = await deleteCustomerStorage('empty-customer');
    expect(count).toBe(0);
    expect(mockBucket.list).toHaveBeenCalledWith('tenants/empty-customer', { limit: 100, offset: 0 });
    expect(mockBucket.remove).not.toHaveBeenCalled();
  });

  it('lists recursively and deletes files in nested directories', async () => {
    // First list call returns a file and a directory
    mockBucket.list.mockResolvedValueOnce({
      data: [
        { name: 'file1.html', id: 'id-file1' },
        { name: 'files', id: null }, // directory
      ],
      error: null,
    });

    // Second list call for the folder "tenants/test-customer/files"
    mockBucket.list.mockResolvedValueOnce({
      data: [
        { name: 'nested.html', id: 'id-nested' },
      ],
      error: null,
    });

    mockBucket.remove.mockResolvedValueOnce({ data: [], error: null });

    const count = await deleteCustomerStorage('test-customer');
    expect(count).toBe(2);

    expect(mockBucket.list).toHaveBeenCalledWith('tenants/test-customer', { limit: 100, offset: 0 });
    expect(mockBucket.list).toHaveBeenCalledWith('tenants/test-customer/files', { limit: 100, offset: 0 });

    expect(mockBucket.remove).toHaveBeenCalledWith([
      'tenants/test-customer/file1.html',
      'tenants/test-customer/files/nested.html',
    ]);
  });

  it('paginates correctly using loop with offset when limit is reached', async () => {
    // First page returns 100 files
    const firstPage = Array.from({ length: 100 }, (_, i) => ({
      name: `file_${i}.html`,
      id: `id_${i}`,
    }));
    mockBucket.list.mockResolvedValueOnce({ data: firstPage, error: null });

    // Second page returns 5 files
    const secondPage = Array.from({ length: 5 }, (_, i) => ({
      name: `file_100_${i}.html`,
      id: `id_100_${i}`,
    }));
    mockBucket.list.mockResolvedValueOnce({ data: secondPage, error: null });

    mockBucket.remove.mockResolvedValue({ data: [], error: null });

    const count = await deleteCustomerStorage('paginated-customer');
    expect(count).toBe(105);

    expect(mockBucket.list).toHaveBeenCalledWith('tenants/paginated-customer', { limit: 100, offset: 0 });
    expect(mockBucket.list).toHaveBeenCalledWith('tenants/paginated-customer', { limit: 100, offset: 100 });

    expect(mockBucket.remove).toHaveBeenCalledTimes(2);
  });

  it('throws an error if list fails', async () => {
    mockBucket.list.mockResolvedValueOnce({
      data: null,
      error: { message: 'Network Timeout' },
    });

    await expect(deleteCustomerStorage('error-customer')).rejects.toThrow(
      'Failed to list storage path tenants/error-customer: Network Timeout'
    );
    expect(mockBucket.remove).not.toHaveBeenCalled();
  });

  it('throws an error if remove fails', async () => {
    mockBucket.list.mockResolvedValueOnce({
      data: [{ name: 'file.html', id: '1' }],
      error: null,
    });
    mockBucket.remove.mockResolvedValueOnce({
      data: null,
      error: { message: 'Unauthorized removal' },
    });

    await expect(deleteCustomerStorage('remove-fail-customer')).rejects.toThrow(
      'Failed to delete storage batch: Unauthorized removal'
    );
  });
});
