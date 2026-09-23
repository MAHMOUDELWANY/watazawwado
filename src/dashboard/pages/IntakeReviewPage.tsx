import React from 'react';
import IntakeReviewPanel from '../components/IntakeReviewPanel';
import { dashboardFetch } from '../lib/dashboardApi';

/**
 * ====================================================================
 * WATAZAWWADO — DASHBOARD INTAKE REVIEW PAGE
 * File: src/dashboard/pages/IntakeReviewPage.tsx
 *
 * Thin wrapper that supplies the authenticated dashboard fetch helper to
 * the review panel. Teacher authorization is enforced server-side.
 * ====================================================================
 */

export default function IntakeReviewPage() {
  const lang: 'en' | 'ar' = (typeof document !== 'undefined' && document.documentElement.lang === 'ar') ? 'ar' : 'en';

  const apiFetch = React.useCallback(
    (path: string, init?: RequestInit) =>
      dashboardFetch<Response>(path, init as RequestInit).then(async (r: any) => {
        // dashboardFetch already returns parsed JSON; re-wrap for the panel's
        // Response-like contract (ok + json()).
        return {
          ok: r?.ok !== false && r?.error === undefined,
          json: async () => r,
        } as unknown as Response;
      }),
    []
  );

  return (
    <div className="w-full">
      <IntakeReviewPanel lang={lang} apiFetch={apiFetch} />
    </div>
  );
}
