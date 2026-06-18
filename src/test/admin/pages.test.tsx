import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  });

  describe('CustomersPage', () => {
    beforeEach(() => {
      mockFetch.mockImplementation(async (url, options) => {
        if (url === '/api/admin/customers' && (!options || options.method === 'GET')) {
          return {
            ok: true,
            json: async () => ({ customers: [{ id: 'c1', name: 'Test Customer', slug: 'test-cust', isActive: true }] })
          };
        }
        if (url === '/api/admin/customers' && options?.method === 'POST') {
          return {
            ok: true,
            json: async () => ({ customer: { id: 'c2', name: 'New Customer', slug: 'new-cust', isActive: true } })
          };
        }
        if (url === '/api/admin/apikeys' && options?.method === 'POST') {
          return {
            ok: true,
            json: async () => ({ success: true, key: 'sk_live_serve-it_fakekey123' })
          };
        }
        return { ok: false, status: 404 };
      });
    });

    it('renders list of customers', async () => {
      render(<CustomersPage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Test Customer')).toBeInTheDocument();
      });
      expect(screen.getByText('Slug: test-cust | Active: Yes')).toBeInTheDocument();
    });

    it('creates a new customer', async () => {
      const user = userEvent.setup();
      render(<CustomersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Customer')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('Name');
      const slugInput = screen.getByLabelText('Slug');
      const passwordInput = screen.getByLabelText('Password');
      const submitBtn = screen.getByRole('button', { name: /create customer/i });

      await user.type(nameInput, 'New Customer');
      await user.type(slugInput, 'new-cust');
      await user.type(passwordInput, 'pass123');

      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/customers', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'New Customer', slug: 'new-cust', password: 'pass123' })
        }));
      });
      // Also expects refetch to have been called
      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 initial get, 1 post, 1 refetch get
    });

    it('generates an API key for a customer', async () => {
      const user = userEvent.setup();
      render(<CustomersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Customer')).toBeInTheDocument();
      });

      const generateBtn = screen.getByRole('button', { name: /generate api key/i });
      await user.click(generateBtn);

      const keyNameInput = screen.getByPlaceholderText('Key Label (e.g. MCP Sidecar)');
      await user.type(keyNameInput, 'My Key');

      const saveBtn = screen.getByRole('button', { name: /save/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText('sk_live_serve-it_fakekey123')).toBeInTheDocument();
      });

      const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissBtn);

      expect(screen.queryByText('sk_live_serve-it_fakekey123')).not.toBeInTheDocument();
    });

    it('cancels API key generation', async () => {
      const user = userEvent.setup();
      render(<CustomersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Customer')).toBeInTheDocument();
      });

      const generateBtn = screen.getByRole('button', { name: /generate api key/i });
      await user.click(generateBtn);

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelBtn);

      expect(screen.queryByPlaceholderText('Key Label (e.g. MCP Sidecar)')).not.toBeInTheDocument();
    });

    it('does not generate API key if label is empty', async () => {
      const user = userEvent.setup();
      render(<CustomersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Customer')).toBeInTheDocument();
      });

      const generateBtn = screen.getByRole('button', { name: /generate api key/i });
      await user.click(generateBtn);

      const saveBtn = screen.getByRole('button', { name: /save/i });
      await user.click(saveBtn);

      // fetch should not be called for apikeys
      expect(mockFetch).not.toHaveBeenCalledWith('/api/admin/apikeys', expect.anything());
    });
  });

  describe('UsersPage', () => {
    beforeEach(() => {
      mockFetch.mockImplementation(async (url, options) => {
        if (url === '/api/admin/users') {
          return {
            ok: true,
            json: async () => ({
              users: [{ 
                id: 'u1', 
                name: 'Test User', 
                email: 'test@example.com', 
                isAdmin: false, 
                customers: [{ customer: { id: 'c1', name: 'Assigned Customer' } }],
                apiKeys: [{ id: 'key1' }]
              }]
            })
          };
        }
        if (url === '/api/admin/customers') {
          return {
            ok: true,
            json: async () => ({
              customers: [
                { id: 'c1', name: 'Assigned Customer' },
                { id: 'c2', name: 'Unassigned Customer' }
              ]
            })
          };
        }
        if (url === '/api/admin/users/assign' || url === '/api/admin/users/revoke' || url === '/api/admin/users/role') {
          return { ok: true, json: async () => ({ success: true }) };
        }
        if (url === '/api/admin/apikeys' && options?.method === 'POST') {
          return {
            ok: true,
            json: async () => ({ success: true, key: 'sk_live_serve-it_userkey123' })
          };
        }
        return { ok: false, status: 404 };
      });
    });

    it('renders list of users and their assigned workspaces', async () => {
      render(<UsersPage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Test User (test@example.com)')).toBeInTheDocument();
      });
      expect(screen.getByText('Key Generated')).toBeInTheDocument();
      expect(screen.getByText('Assigned Customer')).toBeInTheDocument();
    });

    it('assigns a workspace to a user', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test User (test@example.com)')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'c2'); // Unassigned Customer

      const assignBtn = screen.getByRole('button', { name: /assign/i });
      await user.click(assignBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/assign', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ userId: 'u1', customerId: 'c2' })
        }));
      });
    });

    it('does not assign if no workspace selected', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test User (test@example.com)')).toBeInTheDocument();
      });

      const assignBtn = screen.getByRole('button', { name: /assign/i });
      await user.click(assignBtn);

      expect(mockFetch).not.toHaveBeenCalledWith('/api/admin/users/assign', expect.anything());
    });

    it('revokes a workspace from a user', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test User (test@example.com)')).toBeInTheDocument();
      });

      // The button inside the span with Assigend Customer text has an ×
      const revokeBtns = screen.getAllByRole('button', { name: /×/i });
      await user.click(revokeBtns[0]);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/revoke', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ userId: 'u1', customerId: 'c1' })
        }));
      });
    });

    it('toggles admin role', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test User (test@example.com)')).toBeInTheDocument();
      });

      // The button for toggling admin has no text but has a role. We can find it by className or test id.
      // There are multiple buttons, but let's grab the toggle button. It's the one right after "Admin:"
      const toggleBtn = screen.getByText('Admin:').nextElementSibling as HTMLButtonElement;
      await user.click(toggleBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/role', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ userId: 'u1', isAdmin: true })
        }));
      });
    });

    it('generates an API key for a user', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test User (test@example.com)')).toBeInTheDocument();
      });

      const generateBtn = screen.getByRole('button', { name: /generate api key/i });
      await user.click(generateBtn);

      const keyNameInput = screen.getByPlaceholderText('Key Label (e.g. My Key)');
      await user.type(keyNameInput, 'My User Key');

      const saveBtn = screen.getByRole('button', { name: /save/i });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText('sk_live_serve-it_userkey123')).toBeInTheDocument();
      });

      const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissBtn);

      expect(screen.queryByText('sk_live_serve-it_userkey123')).not.toBeInTheDocument();
    });

    it('cancels API key generation', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test User (test@example.com)')).toBeInTheDocument();
      });

      const generateBtn = screen.getByRole('button', { name: /generate api key/i });
      await user.click(generateBtn);

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelBtn);

      expect(screen.queryByPlaceholderText('Key Label (e.g. My Key)')).not.toBeInTheDocument();
    });

    it('does not generate API key if label is empty', async () => {
      const user = userEvent.setup();
      render(<UsersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test User (test@example.com)')).toBeInTheDocument();
      });

      const generateBtn = screen.getByRole('button', { name: /generate api key/i });
      await user.click(generateBtn);

      const saveBtn = screen.getByRole('button', { name: /save/i });
      await user.click(saveBtn);

      // fetch should not be called for apikeys
      expect(mockFetch).not.toHaveBeenCalledWith('/api/admin/apikeys', expect.anything());
    });
  });
});
