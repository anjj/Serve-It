import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Logo } from '@/components/Logo';

describe('Logo Component', () => {
  it('renders the brand name and slogan', () => {
    render(<Logo />);
    expect(screen.getByText(/Serve-It/i)).toBeInTheDocument();
    expect(screen.getByText(/UNMODIFIED HTML SERVING LAYER/i)).toBeInTheDocument();
  });
});
