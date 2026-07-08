import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import SignIn from '@/app/auth/signin/page';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
}));

describe('SignIn Page', () => {
  beforeEach(() => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test-google-id');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-google-secret');
    vi.stubEnv('AZURE_AD_CLIENT_ID', 'test-azure-id');
    vi.stubEnv('AZURE_AD_CLIENT_SECRET', 'test-azure-secret');
  });

  it('renders Google login button', () => {
    render(<SignIn />);
    const loginBtn = screen.getByRole('button', { name: /google login/i });
    expect(loginBtn).toBeInTheDocument();
    expect(loginBtn).toHaveClass('bg-primary');
  });

  it('renders Microsoft login button', () => {
    render(<SignIn />);
    const loginBtn = screen.getByRole('button', { name: /microsoft login/i });
    expect(loginBtn).toBeInTheDocument();
  });

  it('hides buttons when env variables are missing', () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', '');
    vi.stubEnv('AZURE_AD_CLIENT_ID', '');
    render(<SignIn />);
    expect(screen.queryByRole('button', { name: /google login/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /microsoft login/i })).not.toBeInTheDocument();
  });
});
