import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import CustomersPage from '@/app/admin/customers/page';
import UsersPage from '@/app/admin/users/page';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Admin Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    mockFetch.mockImplementation(async (url) => {
      if (url === '/api/admin/customers') {
        return {
          ok: true,
          json: async () => ({ customers: [{ id: 'c1', name: 'Test Customer', slug: 'test-cust', isActive: true }] })
        };
      }
      if (url === '/api/admin/users') {
        return {
          ok: true,
          json: async () => ({
            users: [{ id: 'u1', name: 'Test User', email: 'test@example.com', isAdmin: false, customers: [] }]
          })
        };
      }
      return { ok: false, status: 404 };
    });
  });

  it('renders CustomersPage with neutral button styling', async () => {
    render(<CustomersPage />);
    const createBtn = await screen.findByRole('button', { name: /create customer/i });
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).toHaveClass('bg-zinc-900');
    expect(createBtn.closest('.max-w-4xl')).toHaveClass('dark:text-zinc-100');
  });

  it('renders UsersPage with neutral button styling', async () => {
    render(<UsersPage />);
    const assignBtn = await screen.findByRole('button', { name: /assign/i });
    expect(assignBtn).toBeInTheDocument();
    expect(assignBtn).toHaveClass('bg-zinc-900');
    expect(assignBtn.closest('.max-w-5xl')).toHaveClass('dark:text-zinc-100');
  });
});
