import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-md";
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-muted text-foreground",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-border-subtle bg-transparent hover:bg-muted text-foreground",
      link: "underline-offset-4 hover:underline text-primary",
    };

    const sizes = {
      sm: "h-9 px-3 text-sm",
      md: "h-11 px-4 py-2",
      lg: "h-14 px-8 text-lg",
      icon: "h-11 w-11",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin rtl:ml-2 rtl:mr-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
