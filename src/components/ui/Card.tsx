import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'highlighted' | 'muted' | 'status';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-surface border-border shadow-sm",
      interactive: "bg-surface border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer",
      highlighted: "bg-primary/5 dark:bg-primary/10 border-primary/20 shadow-sm",
      muted: "bg-surface-subtle border-border-subtle shadow-none",
      status: "bg-surface border-border-subtle border-l-4 border-l-primary shadow-sm",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border text-surface-foreground overflow-hidden",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-xl font-semibold leading-none tracking-tight font-serif", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}
