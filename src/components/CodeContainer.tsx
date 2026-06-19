import React from 'react';

export interface CodeContainerProps extends React.HTMLAttributes<HTMLPreElement> {}

export const CodeContainer = React.forwardRef<HTMLPreElement, CodeContainerProps>(
  ({ className = '', ...props }, ref) => {
    const baseStyles = 'rounded-[var(--radius-card)] p-4 bg-background-alternate border border-border-color font-mono text-sm overflow-x-auto ';

    return (
      <pre
        ref={ref}
        className={`${baseStyles}${className}`.trim()}
        {...props}
      />
    );
  }
);
CodeContainer.displayName = 'CodeContainer';
