import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { notify } from '../../components/ui/Feedback';
import type { StudentNote } from '../types';

/**
 * Monthly note with Jalila (phase 4): a draft letter to the family about the last 30 days, in the family's language.
 * The teacher edits it; saving stores it as a family note, so it shows on the family's progress page and monthly report.
 */
export function MonthlyNoteDraft({ studentId, onSaved }: { studentId: string; onSaved: (note: StudentNote) => void }) {
  const { t } = useT();
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const write = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await dashboardFetch<{ draft: string }>(`/api/dashboard/students/${studentId}/monthly-draft`, { method: 'POST', body: JSON.stringify({}) });
      setDraft(res.draft);
    } catch (err: any) {
      setError(err?.message || t("Jalila couldn't write it. Try again.", 'جليلة مقدرتش تكتبها. جرّب تاني.'));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!draft?.trim()) return;
    setSaving(true);
    try {
      const res = await dashboardFetch<{ note: StudentNote }>(`/api/dashboard/students/${studentId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Monthly note to the family', family_summary: draft.trim() }),
      });
      onSaved(res.note);
      setDraft(null);
      notify(t('Monthly note saved. The family sees it on their progress page.', 'رسالة الشهر اتحفظت. الأسرة هتشوفها في صفحة التقدم.'));
    } catch (err: any) {
      notify(err?.message || t("Couldn't save the note.", 'تعذر حفظ الرسالة.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (draft === null) {
    return (
      <div className="grid gap-1">
        <button
          type="button"
          onClick={write}
          disabled={busy}
          className="justify-self-start inline-flex items-center gap-2 min-h-11 px-4 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground hover:border-gold cursor-pointer focus-ring disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4 text-gold" aria-hidden="true" />
          {busy ? t('Jalila is writing…', 'جليلة بتكتب…') : t('Write the monthly note with Jalila', 'اكتب رسالة الشهر مع جليلة')}
        </button>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="grid gap-2" data-testid="monthly-note-draft">
      <label htmlFor="monthly-note" className="text-xs font-semibold text-muted-foreground">
        {t("Jalila's draft for the family. Edit it, then save.", 'مسودة جليلة للأسرة. عدّلها وبعدين احفظ.')}
      </label>
      <Textarea id="monthly-note" value={draft} onChange={(e) => setDraft(e.target.value)} rows={5} maxLength={1200} dir="auto" />
      <div className="flex flex-col-reverse sm:flex-row gap-2">
        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setDraft(null)}>{t('Discard', 'إلغاء')}</Button>
        <Button className="w-full sm:w-auto" onClick={save} isLoading={saving} disabled={!draft.trim()}>{t('Save for the family', 'احفظ للأسرة')}</Button>
      </div>
    </div>
  );
}
