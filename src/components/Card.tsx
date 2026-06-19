import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'alternate';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'primary', ...props }, ref) => {
    const baseStyles = 'rounded-[var(--radius-card)] p-8 border border-border-color shadow-sm ';
    const bgStyle = variant === 'alternate' ? 'bg-background-alternate' : 'bg-background';

    return (
      <div
        ref={ref}
        className={`${baseStyles}${bgStyle} ${className}`.trim()}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';
