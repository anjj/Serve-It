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
  it('renders Entra ID login button with neutral styling', () => {
    render(<SignIn />);
    const loginBtn = screen.getByRole('button', { name: /authenticate via entra id/i });
    expect(loginBtn).toBeInTheDocument();
    expect(loginBtn).toHaveClass('bg-primary');
  });
});
