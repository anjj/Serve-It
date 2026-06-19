import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import RootLayout from '@/app/layout';

// Mock next/font/google
vi.mock('next/font/google', () => ({
  Montserrat: () => ({ variable: '--font-montserrat' }),
  JetBrains_Mono: () => ({ variable: '--font-jetbrains-mono' }),
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));

// Mock Providers to avoid network errors
vi.mock('@/components/Providers', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('RootLayout Fonts', () => {
  it('should apply Montserrat and JetBrains Mono font variables to the body', () => {
    render(
      <RootLayout>
        <div data-testid="test-content">Test Content</div>
      </RootLayout>
    );

    const body = screen.getByTestId('test-content').closest('body');
    expect(body).toBeInTheDocument();
    expect(body?.className).toContain('--font-montserrat');
    expect(body?.className).toContain('--font-jetbrains-mono');
  });
});
