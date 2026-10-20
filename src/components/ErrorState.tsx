import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/** ST-04: the portal's one error state: what went wrong in plain words, and "Try again". Pairs with EmptyState. */
export function ErrorState({ message, onRetry, isAr }: { message?: string | null; onRetry?: () => void; isAr: boolean }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center py-12 px-6 text-center glass-surface border border-border-subtle rounded-2xl space-y-3">
      <AlertCircle className="w-8 h-8 text-warning" aria-hidden="true" />
      <p className="text-sm text-foreground max-w-sm">
        {message || (isAr ? 'حصلت مشكلة وإحنا بنحمّل الصفحة.' : 'Something went wrong while loading this page.')}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-surface-subtle cursor-pointer min-h-[40px]"
        >
          <RefreshCw className="w-4 h-4" />
          {isAr ? 'حاول تاني' : 'Try again'}
        </button>
      )}
    </div>
  );
}
