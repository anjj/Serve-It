import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';

// Mock @/lib/auth-client
const mockSession = {
  user: { name: 'Test User', email: 'test@example.com', isAdmin: true, id: 'user-1' },
};

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(() => ({
    data: mockSession,
    status: 'authenticated',
  })),
  signOut: vi.fn(),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
  useRouter: () => ({
    push: mockPush,
  }),
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

    render(
      <ThemeProvider>
        <Navbar />
      </ThemeProvider>
    );

    // Wait for customers to be loaded
    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    // Verify that router.push was NOT called to redirect to customer-a
    expect(mockPush).not.toHaveBeenCalledWith('/dashboard/customer-a');
  });
});
