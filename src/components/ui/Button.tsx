import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-display font-medium transition-micro active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-xl tracking-wide";
    
    const variants = {
      primary: "btn-primary-material",
      secondary: "btn-secondary-material",
      ghost: "hover:bg-surface-subtle text-foreground",
      outline: "border border-border bg-transparent hover:bg-surface-subtle text-foreground",
      glass: "glass-surface text-foreground hover:bg-surface-warm/80 dark:hover:bg-surface-subtle/80 glass-hover",
    };

    const sizes = {
      sm: "h-9 px-4 text-base rounded-lg",
      md: "h-11 px-5 py-2 text-base rounded-xl",
      lg: "h-14 px-8 text-lg rounded-2xl",
      icon: "h-11 w-11 rounded-xl",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0 shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
