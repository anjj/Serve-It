import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { CodeContainer } from '@/components/CodeContainer';

describe('CodeContainer Component', () => {
  it('renders correctly with default styles', () => {
    const { container } = render(<CodeContainer>console.log("Hello");</CodeContainer>);
    const code = container.firstChild as HTMLElement;
    
    expect(code).toBeInTheDocument();
    expect(code?.className).toContain('rounded-[var(--radius-card)]');
    expect(code?.className).toContain('font-mono');
    expect(code?.className).toContain('bg-background-alternate');
  });
});
