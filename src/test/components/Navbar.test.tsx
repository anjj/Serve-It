import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/ThemeProvider';

const mockUseLocation = vi.fn(() => ({ pathname: '/dashboard' }));
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
}));

vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({
    data: { user: { name: 'Test User', email: 'test@example.com', isAdmin: true } },
  }),
  signOut: vi.fn(),
}));

// Mock global fetch
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ customers: [] }),
});
global.fetch = mockFetch;

function renderNavbar() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Navbar />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/dashboard' });
  });

  it('renders brand name and user information', () => {
    renderNavbar();

    expect(screen.getByText('Serve-It')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders a theme toggle button and handles theme switching', () => {
    renderNavbar();

    // Look for the theme toggle button by its accessible label or title
    const toggleBtn = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleBtn).toBeInTheDocument();

    // Verify it works by checking document element updates
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    fireEvent.click(toggleBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
