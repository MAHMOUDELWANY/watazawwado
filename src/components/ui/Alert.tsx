import React from 'react';
import { cn } from '../../lib/utils';
import { Info, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'info' | 'success' | 'warning' | 'destructive';
  title?: React.ReactNode;
  icon?: boolean | React.ReactNode;
}

export function Alert({
  className,
  variant = 'info',
  title,
  children,
  icon = true,
  ...props
}: AlertProps) {
  // Semantic design system variants
  const variants = {
    info: 'bg-surface-subtle text-foreground border-border',
    success: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning-foreground border-warning/30',
    destructive: 'bg-destructive/15 text-destructive border-destructive/30',
  };

  const Icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    destructive: AlertCircle,
  };

  const Icon = typeof icon === 'boolean' ? Icons[variant] : null;

  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-xl border p-4 flex gap-3',
        variants[variant],
        className
      )}
      {...props}
    >
      {icon && (
        <div className="shrink-0 mt-0.5">
          {typeof icon === 'boolean' && Icon ? <Icon className="w-5 h-5" /> : icon}
        </div>
      )}
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-1 leading-none tracking-tight">{title}</h5>}
        <div className="text-sm opacity-90 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
