import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col select-none ${className}`.trim()}>
      <div className="flex items-center text-3xl font-black font-sans tracking-tight text-foreground">
        <span className="text-foreground">[</span>
        <span className="relative flex items-center mx-1">
          {/* Solid sharp arrow in Pass-Through Green */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
            <path d="M4 12H20M20 12L12 4M20 12L12 20" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter"/>
          </svg>
        </span>
        <span className="text-foreground">]</span>
        <span className="ml-2">Serve-It</span>
      </div>
      <div className="text-meta text-foreground-muted text-right mt-1">
        UNMODIFIED HTML SERVING LAYER
      </div>
    </div>
  );
};
