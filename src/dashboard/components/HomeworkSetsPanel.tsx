import React, { useEffect, useState } from 'react';
import { ClipboardCheck, RotateCcw, Check, AlertTriangle } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { notify } from '../../components/ui/Feedback';

type L = { en: string; ar: string };
type Attempt = { score: number; total: number; at: string; missed: Array<{ page?: number; prompt?: L; explain?: L }> };
type Set = {
  id: string; kind: 'part' | 'lesson' | 'review'; title: L; status: string; score: number | null; total: number | null;
  fromPage: number; toPage: number; variantsLeft: number; createdAt: string; attempts: Attempt[];
};

/**
 * Owner review 2026-11-09: the learner's curriculum homework for the teacher: each set, the score, the questions
 * missed (with the page, so you know what to go over next lesson), and the decision when it is below the pass mark.
 */
export function HomeworkSetsPanel({ studentId, focusId }: { studentId: string; focusId?: string | null }) {
  const { t, isAr } = useT();
  const pick = (x?: L) => (x ? (isAr ? x.ar : x.en) : '');
  const [sets, setSets] = useState<Set[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => dashboardFetch<{ sets: Set[] }>(`/api/dashboard/students/${studentId}/homework-sets`).then((r) => setSets(r.sets || [])).catch(() => setSets([]));
  useEffect(() => { load(); }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const decide = async (id: string, decision: 'retry' | 'accept') => {
    setBusy(id);
    try {
      await dashboardFetch(`/api/dashboard/homework-sets/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision }) });
      notify(decision === 'retry' ? t('New questions sent to the student.', 'اتبعتله أسئلة جديدة.') : t('Homework accepted.', 'الواجب اتعتمد.'));
      await load();
    } catch (e: any) {
      notify(e?.message || t('Could not save.', 'ما اتحفظش.'), 'error');
    } finally { setBusy(null); }
  };

  if (!sets) return null;
  if (!sets.length) return (
    <section className="rounded-2xl border border-border-subtle glass-surface p-4 text-sm text-muted-foreground">
      <ClipboardCheck className="inline w-4 h-4 me-1.5 text-teal" />
      {t('No homework yet. It is made from the curriculum pages you mark after each lesson.', 'لسه مفيش واجبات. بتتعمل من صفحات المنهج اللي بتحددها بعد كل حصة.')}
    </section>
  );

  const label = (s: Set) => ({
    preparing: t('Being written', 'بيتجهز'), new: t('Not started', 'لسه ما بدأش'), retry: t('Retrying', 'بيعيد'),
    submitted: t('Needs your decision', 'محتاج قرارك'), passed: t('Passed', 'نجح'), done: t('Done', 'خلص'),
  } as Record<string, string>)[s.status] || s.status;

  return (
    <section className="space-y-3" aria-label={t('Homework', 'الواجبات')}>
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4 text-teal" />{t('Homework', 'الواجبات')}</h3>
      <ul className="space-y-2.5">
        {sets.map((s) => {
          const last = s.attempts[s.attempts.length - 1];
          const needs = s.status === 'submitted';
          return (
            <li key={s.id} className={`rounded-2xl border p-3.5 space-y-2 ${needs ? 'border-[var(--gold)]/60 bg-[var(--gold)]/10' : 'border-border-subtle glass-surface'} ${focusId === s.id ? 'ring-2 ring-primary' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{pick(s.title)}</p>
                  <p className="text-xs text-muted-foreground">
                    {({ part: t('Part of a lesson', 'جزء من درس'), lesson: t('Whole lesson', 'درس كامل'), review: t('Spaced review', 'مراجعة متباعدة') })[s.kind]}
                    {' · '}{label(s)}{s.total ? ` · ${s.score}/${s.total}` : ''}{s.attempts.length > 1 ? ` · ${t(`${s.attempts.length} tries`, `${s.attempts.length} محاولات`)}` : ''}
                  </p>
                </div>
                {needs && (
                  <div className="flex gap-2">
                    <button type="button" disabled={busy === s.id} onClick={() => decide(s.id, 'retry')} className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold px-3 py-2 min-h-[40px] disabled:opacity-50">
                      <RotateCcw className="w-3.5 h-3.5" />{t('Retry with new questions', 'يعيد بأسئلة جديدة')}
                    </button>
                    <button type="button" disabled={busy === s.id} onClick={() => decide(s.id, 'accept')} className="inline-flex items-center gap-1.5 rounded-xl border border-border text-sm font-semibold px-3 py-2 min-h-[40px] disabled:opacity-50">
                      <Check className="w-3.5 h-3.5" />{t('Accept', 'اعتمده')}
                    </button>
                  </div>
                )}
              </div>
              {last && last.missed.length > 0 && (
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-foreground flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-[#B5835A]" />{t('Missed: go over these next lesson', 'غلط فيها: ركّز عليها الحصة الجاية')}</p>
                  <ul className="space-y-1 ps-5 list-disc text-muted-foreground">
                    {last.missed.map((m, i) => <li key={i}>{pick(m.prompt)}{m.page ? <span className="text-xs"> · {t(`page ${m.page}`, `صفحة ${m.page}`)}</span> : null}</li>)}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
