import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          className={cn(
            "flex h-11 w-full appearance-none rounded-md border border-border bg-surface px-3 py-2 pr-10 rtl:pr-3 rtl:pl-10 text-sm placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent transition-all duration-base ease-premium",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 flex items-center px-3 text-muted-foreground">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";
