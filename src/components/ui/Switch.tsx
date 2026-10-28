import React from 'react';
import { cn } from '../../lib/utils';

/** An on/off setting: the whole row is the hit area, the switch shows the state. Use a checkbox for consent and selection. */
export function Switch({ checked, onChange, children, hint, className, disabled }: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn('flex items-center justify-between gap-3 min-h-11 text-sm text-foreground', disabled ? 'opacity-60' : 'cursor-pointer', className)}>
      <span className="grid min-w-0">
        <span className="font-medium">{children}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 h-7 w-12 rounded-full transition-colors duration-200 focus-ring',
          checked ? 'bg-teal' : 'bg-border'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-1 start-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
            checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </label>
  );
}
