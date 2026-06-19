import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WorkspaceDashboard from '@/app/dashboard/[customer_slug]/page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ customer_slug: 'test-customer' }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/dashboard/test-customer',
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'authenticated', data: { user: { id: 'user-1' } } }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('WorkspaceDashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trash button and triggers confirmation on delete click', async () => {
    let files = [
      { id: 'file-1', title: 'Delete Me', slug: 'delete-me', tags: [], createdAt: '2026-06-12T00:00:00Z' }
    ];

    mockFetch.mockImplementation(async (url, init) => {
      if (url === '/api/user/workspaces') {
        return {
          ok: true,
          json: async () => ({
            customers: [{ id: 'cust-1', name: 'Test Customer', slug: 'test-customer' }]
          })
        };
      }

      if (url === '/api/workspace/test-customer/files') {
        if (init?.method === 'DELETE') {
          files = [];
          return {
            ok: true,
            json: async () => ({ success: true })
          };
        }
        return {
          ok: true,
          json: async () => ({ files })
        };
      }

      return { ok: false, status: 404 };
    });

    render(<WorkspaceDashboard />);

    // Wait for the files to render
    const fileTitle = await screen.findByText('Delete Me');
    expect(fileTitle).toBeInTheDocument();

    // Check for delete button
    const deleteBtn = screen.getByRole('button', { name: /delete file/i });
    expect(deleteBtn).toBeInTheDocument();

    // Mock window.confirm to return true (confirm)
    const originalConfirm = window.confirm;
    const confirmSpy = vi.fn(() => true);
    window.confirm = confirmSpy;

    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this file?');

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/workspace/test-customer/files',
        expect.objectContaining({
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: 'file-1' }),
        })
      );
    });

    window.confirm = originalConfirm;
  });
});
