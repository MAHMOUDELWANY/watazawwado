import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2";
  
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    destructive: "border-transparent bg-destructive text-destructive-foreground",
    success: "border-transparent bg-success text-success-foreground",
    warning: "border-transparent bg-warning text-warning-foreground",
    outline: "text-foreground border-border",
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  );
}
