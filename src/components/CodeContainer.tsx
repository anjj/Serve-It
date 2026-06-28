import React from 'react';

export type CodeContainerProps = React.HTMLAttributes<HTMLPreElement>;

export const CodeContainer = React.forwardRef<HTMLPreElement, CodeContainerProps>(
  ({ className = '', ...props }, ref) => {
    const baseStyles = 'rounded-[var(--radius-card)] p-4 bg-surface border border-border-color font-mono text-meta overflow-x-auto ';

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
