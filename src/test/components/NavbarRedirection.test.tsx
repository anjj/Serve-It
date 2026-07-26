import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';

const mockSession = {
  user: { name: 'Test User', email: 'test@example.com', isAdmin: true, id: 'user-1' },
};

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' }),
}));

vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({ data: mockSession }),
  signOut: vi.fn(),
}));

describe('Navbar Redirection Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT redirect to the first workspace when on /dashboard', async () => {
    const mockCustomers = [
      { id: '1', name: 'Customer A', slug: 'customer-a' },
      { id: '2', name: 'Customer B', slug: 'customer-b' },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ customers: mockCustomers }),
    });

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Navbar />
        </ThemeProvider>
      </QueryClientProvider>,
    );

    // Wait for customers to be loaded
    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    // Verify that navigation was NOT triggered to redirect to customer-a
    expect(mockNavigate).not.toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ customer_slug: 'customer-a' }) }),
    );
  });
});
