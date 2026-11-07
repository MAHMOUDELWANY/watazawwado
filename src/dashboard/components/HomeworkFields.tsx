import React, { useState } from 'react';
import { Plus, X, Sparkles } from 'lucide-react';
import { useT } from '../../lib/language';
import { dashboardFetch } from '../lib/dashboardApi';
import { SURAHS } from '../../lib/surahs';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export type HomeworkDraft = { kind: 'recite' | 'review' | 'task'; surah: number; ayah_from: string; ayah_to: string; body: string };

export const MAX_TASKS = 3;
export const emptyTask = (kind: HomeworkDraft['kind'] = 'recite'): HomeworkDraft => ({ kind, surah: 67, ayah_from: '1', ayah_to: '10', body: '' });

/** What the API gets: empty review/task rows are dropped there too. */
export function homeworkPayload(rows: HomeworkDraft[]) {
  return rows.map((r) => r.kind === 'recite'
    ? { kind: r.kind, surah: r.surah, ayah_from: Number(r.ayah_from), ayah_to: Number(r.ayah_to), body: r.body.trim() || null }
    : { kind: r.kind, body: r.body.trim() || null });
}

/** NX-02: "For next lesson" in the post-lesson summary. 1-3 tasks, saved with the summary. */
export function HomeworkFields({ value, onChange, studentId, privateNotes, subject, legend, noSuggest = false }: {
  value: HomeworkDraft[]; onChange: (rows: HomeworkDraft[]) => void; studentId: string; privateNotes: string; subject: string;
  /** The Homework page sets tasks outside a lesson summary: its own title, no Jalila draft (it needs lesson notes). */
  legend?: string; noSuggest?: boolean;
}) {
  const { t, isAr } = useT();
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const set = (i: number, patch: Partial<HomeworkDraft>) => onChange(value.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const kinds: Array<[HomeworkDraft['kind'], string]> = [
    ['recite', t('Memorize / recite', 'حفظ أو تلاوة')],
    ['review', t('Review a lesson', 'مراجعة درس')],
    ['task', t('Free task', 'مهمة حرة')],
  ];

  const suggest = async () => {
    setDrafting(true); setDraftError(null);
    try {
      const res = await dashboardFetch<{ tasks: string[] }>(`/api/dashboard/students/${studentId}/homework-draft`, {
        method: 'POST', body: JSON.stringify({ privateNotes: privateNotes.trim(), subject }),
      });
      const keep = value.filter((r) => r.kind === 'recite' || r.body.trim());
      onChange([...keep, ...res.tasks.map((body) => ({ ...emptyTask('task'), body }))].slice(0, MAX_TASKS));
    } catch (err: any) {
      setDraftError(err?.message || t('Jalila could not suggest homework.', 'جليلة معرفتش تقترح واجب.'));
    } finally {
      setDrafting(false);
    }
  };

  return (
    <fieldset className="space-y-2" data-testid="homework-fields">
      <legend className="text-xs font-semibold text-foreground mb-1">{legend || t('Homework for next lesson (optional)', 'واجب للحصة الجاية (اختياري)')}</legend>
      {value.map((row, i) => {
        const surah = SURAHS.find((s) => s.n === row.surah);
        return (
          <div key={i} className="rounded-xl border border-border p-2.5 space-y-2" data-testid="homework-row">
            <div className="flex items-center gap-2">
              <Select aria-label={t('Type', 'النوع')} value={row.kind} onChange={(e) => set(i, { kind: e.target.value as HomeworkDraft['kind'] })} className="h-10">
                {kinds.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </Select>
              <Button type="button" variant="ghost" size="icon" aria-label={t('Remove task', 'شيل المهمة')} onClick={() => onChange(value.filter((_, j) => j !== i))}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            {row.kind === 'recite' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <Select aria-label={t('Surah', 'السورة')} value={row.surah} onChange={(e) => set(i, { surah: Number(e.target.value), ayah_from: '1', ayah_to: '' })} className="h-10">
                    {SURAHS.map((s) => <option key={s.n} value={s.n}>{s.n}. {isAr ? s.ar : s.en}</option>)}
                  </Select>
                </div>
                <label className="grid gap-1 text-[11px] text-muted-foreground">
                  {t('From ayah', 'من آية')}
                  <Input type="number" inputMode="numeric" min={1} max={surah?.ayat} value={row.ayah_from} onChange={(e) => set(i, { ayah_from: e.target.value })} className="h-10" />
                </label>
                <label className="grid gap-1 text-[11px] text-muted-foreground">
                  {t('To ayah', 'لآية')}
                  <Input type="number" inputMode="numeric" min={1} max={surah?.ayat} value={row.ayah_to} onChange={(e) => set(i, { ayah_to: e.target.value })} className="h-10" placeholder={String(surah?.ayat || '')} />
                </label>
              </div>
            )}
            <Input
              aria-label={t('Task', 'المهمة')}
              value={row.body}
              maxLength={500}
              onChange={(e) => set(i, { body: e.target.value })}
              className="h-10"
              placeholder={row.kind === 'recite'
                ? t('Note (optional), e.g. listen twice first', 'ملاحظة (اختياري)، مثلاً: اسمعها مرتين الأول')
                : row.kind === 'review'
                  ? t('Which lesson, e.g. Lesson 2, the sun letters', 'أنهي درس، مثلاً: الدرس ٢، الحروف الشمسية')
                  : t('e.g. Write 5 Fusha words about your family', 'مثلاً: اكتب ٥ كلمات فصحى عن أسرتك')}
            />
          </div>
        );
      })}
      <div className="flex flex-wrap items-center gap-2">
        {value.length < MAX_TASKS && (
          <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, emptyTask()])} data-testid="add-homework">
            <Plus className="w-4 h-4 me-1" />{t('Add a task', 'ضيف مهمة')}
          </Button>
        )}
        {!noSuggest && (
          <Button type="button" variant="ghost" size="sm" onClick={suggest} disabled={!privateNotes.trim() || drafting} isLoading={drafting}>
            <Sparkles className="w-4 h-4 me-1" />{t('Suggest with Jalila', 'اقترح مع جليلة')}
          </Button>
        )}
        {!noSuggest && !privateNotes.trim() && <span className="text-[11px] text-muted-foreground">{t('Jalila needs your private notes.', 'جليلة محتاجة ملاحظاتك الخاصة.')}</span>}
        {draftError && <span role="alert" className="text-[11px] text-destructive w-full">{draftError}</span>}
      </div>
    </fieldset>
  );
}
