import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { dashboardDownload } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

const LABELS = {
  students: ['Export students (CSV)', 'تصدير الطلاب (CSV)'],
  leads: ['Export leads (CSV)', 'تصدير المهتمين (CSV)'],
  payments: ['Export payments (CSV)', 'تصدير المدفوعات (CSV)']
} as const;

/** CRM-05: admin-only CSV download (the server builds the file; Arabic opens in Excel). */
export function ExportCsvButton({ kind }: { kind: keyof typeof LABELS }) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const run = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await dashboardDownload(`/api/dashboard/admin/export/${kind}.csv`, `watazawwado-${kind}-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="tap-44 relative inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl glass-card border-none text-foreground hover:bg-surface-subtle transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{t(LABELS[kind][0], LABELS[kind][1])}</span>
      </button>
      {failed && <span role="alert" className="text-xs text-destructive">{t('Export failed. Try again.', 'التصدير فشل. جرّب تاني.')}</span>}
    </span>
  );
}
