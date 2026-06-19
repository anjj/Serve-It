import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-none font-sans font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 px-4 py-2 ';
    
    let variantStyles = '';
    if (variant === 'primary') {
      variantStyles = 'bg-primary text-white hover:bg-green-700 ';
    } else if (variant === 'secondary') {
      variantStyles = 'bg-background-alternate text-foreground border border-border-color hover:bg-background-soft ';
    } else if (variant === 'danger') {
      variantStyles = 'bg-red-600 text-white hover:bg-red-700 ';
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles}${variantStyles}${className}`.trim()}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
