import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { RichText } from '../../components/ui/RichText';
import { useT } from '../../lib/language';

/**
 * Jalila inside the teacher's day (phase 4, owner 2026-10-28): one tap on the next lesson gives a short prep note
 * from the student's goals and last lesson notes. Private notes are never sent. The teacher decides; Jalila suggests.
 */
export function JalilaBrief({ studentId }: { studentId: string }) {
  const { t, lang } = useT();
  const [brief, setBrief] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prepare = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await dashboardFetch<{ brief: string }>(`/api/dashboard/students/${studentId}/ai-brief`, {
        method: 'POST',
        body: JSON.stringify({ lang }),
      });
      setBrief(res.brief);
    } catch (err: any) {
      setError(err?.message || t("Jalila couldn't prepare it. Try again.", 'جليلة مقدرتش تجهّزه. جرّب تاني.'));
    } finally {
      setBusy(false);
    }
  };

  if (brief) {
    return (
      <div className="rounded-2xl bg-surface border border-border p-4 grid gap-2" data-testid="jalila-brief">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold" aria-hidden="true" />
          {t('Jalila · prep for this lesson (a suggestion, you decide)', 'جليلة · تحضير الحصة (اقتراح، والقرار ليك)')}
        </p>
        <RichText text={brief} className="text-sm text-foreground leading-relaxed" />
      </div>
    );
  }
  return (
    <div className="grid gap-1">
      <button
        type="button"
        onClick={prepare}
        disabled={busy}
        className="justify-self-start inline-flex items-center gap-2 min-h-11 px-4 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground hover:border-gold cursor-pointer focus-ring disabled:opacity-60"
      >
        <Sparkles className="w-4 h-4 text-gold" aria-hidden="true" />
        {busy ? t('Jalila is preparing…', 'جليلة بتحضّر…') : t('Prep this lesson with Jalila', 'حضّر الحصة مع جليلة')}
      </button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
