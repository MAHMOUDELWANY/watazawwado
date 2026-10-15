import React from 'react';
import { BrandLogo } from '../../components/ui/BrandLogo';

/**
 * Admin view of a student request (AI-guide request, placement test) in the site's identity:
 * brand band, logo, title, then labelled rows — the same structure as the site's emails.
 */
export function RequestCard({
  title,
  subtitle,
  badge,
  rows,
  children,
  actions
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  rows?: [string, React.ReactNode][];
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl overflow-hidden border border-border bg-surface shadow-sm">
      <div className="h-1.5 bg-[linear-gradient(90deg,#087D91,#D8C6AE,#C51F24)]" aria-hidden="true" />
      <header className="px-5 py-4 flex items-start gap-3 border-b border-border/60 bg-surface-subtle/40">
        <BrandLogo variant="compact" />
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-foreground leading-snug">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {badge && (
          <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">{badge}</span>
        )}
      </header>
      {rows && rows.length > 0 && (
        <dl className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{k}</dt>
              <dd className="text-foreground mt-0.5 break-words">{v || '—'}</dd>
            </div>
          ))}
        </dl>
      )}
      {children && <div className="px-5 pb-4">{children}</div>}
      {actions && <footer className="px-5 py-3 border-t border-border/60 flex flex-wrap gap-2">{actions}</footer>}
    </article>
  );
}

/** Turns a flat object (e.g. an AI assessment) into readable rows; nested values are joined. */
export function objectRows(obj: Record<string, any> | null | undefined): [string, string][] {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj)
    .filter(([, v]) => Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== '' && typeof v !== 'object')
    .map(([k, v]) => [k.replace(/_/g, ' '), Array.isArray(v) ? v.join(', ') : String(v)]);
}
