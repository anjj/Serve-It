import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Button } from '@/components/Button';

describe('Button Component', () => {
  it('renders correctly with default styles', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    
    // Check for base structural and branding classes
    expect(button.className).toContain('rounded-none');
    expect(button.className).toContain('bg-primary');
    expect(button.className).toContain('text-white');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Click Me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button.className).toContain('custom-class');
  });

  it('renders variant secondary', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button', { name: /secondary/i });
    expect(button.className).toContain('bg-background-alternate');
    expect(button.className).toContain('text-foreground');
  });
});
