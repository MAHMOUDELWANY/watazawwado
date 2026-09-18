import React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent transition-all duration-base ease-premium",
          "disabled:cursor-not-allowed disabled:opacity-50 resize-y",
          error && "border-destructive focus:ring-destructive",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
