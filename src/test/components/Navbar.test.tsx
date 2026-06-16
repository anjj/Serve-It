import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { name: 'Test User', email: 'test@example.com', isAdmin: true } },
    status: 'authenticated',
  }),
  signOut: vi.fn(),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock global fetch
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ customers: [] }),
});
global.fetch = mockFetch;

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders brand name and user information', () => {
    render(
      <ThemeProvider>
        <Navbar />
      </ThemeProvider>
    );

    expect(screen.getByText('Serve-It')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders a theme toggle button and handles theme switching', () => {
    render(
      <ThemeProvider>
        <Navbar />
      </ThemeProvider>
    );

    // Look for the theme toggle button by its accessible label or title
    const toggleBtn = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleBtn).toBeInTheDocument();

    // Verify it works by checking document element updates
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    fireEvent.click(toggleBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
