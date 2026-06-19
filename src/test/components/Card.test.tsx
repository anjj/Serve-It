import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Card } from '@/components/Card';

describe('Card Component', () => {
  it('renders correctly with default styles', () => {
    const { container } = render(<Card>Card Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();
    
    expect(card?.className).toContain('rounded-[var(--radius-card)]');
    expect(card?.className).toContain('p-8');
    expect(card?.className).toContain('bg-background');
  });

  it('renders variant alternate', () => {
    const { container } = render(<Card variant="alternate">Alternate Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card?.className).toContain('bg-background-alternate');
  });
});
