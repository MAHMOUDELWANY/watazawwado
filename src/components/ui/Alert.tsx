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
  const variants = {
    info: 'bg-primary/10 text-primary-foreground border-primary/20', // wait, primary foreground is white. Let's use a subtle variant.
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning-foreground border-warning/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  };
  
  // Refined variants based on the theme
  const refinedVariants = {
    info: 'bg-surface-subtle text-foreground border-border',
    success: 'bg-[#6B8E70]/10 dark:bg-[#6B8E70]/20 text-[#4C6B3E] dark:text-[#A3BF96] border-[#6B8E70]/30',
    warning: 'bg-[#DE9B61]/10 dark:bg-[#DE9B61]/20 text-[#B87A44] dark:text-[#E8B688] border-[#DE9B61]/30',
    destructive: 'bg-[#D16D6A]/10 dark:bg-[#D16D6A]/20 text-[#B24D4A] dark:text-[#E29A98] border-[#D16D6A]/30',
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
        refinedVariants[variant],
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
