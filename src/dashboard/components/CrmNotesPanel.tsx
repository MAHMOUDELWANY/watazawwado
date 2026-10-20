import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { NotebookPen, Tag, Trash2, X } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Input } from '../../components/ui/Input';

interface CrmNote { id: string; body: string; created_at: string }

const TAG_AR: Record<string, string> = {
  'sibling likely': 'غالباً في أخ أو أخت',
  'prefers female teacher': 'تفضّل معلمة',
  'time zone tricky': 'فرق التوقيت صعب',
  'pay-later trusted': 'موثوق في الدفع لاحقاً'
};

/** CRM-03: the admin's private notes and tags for this family. Families and teachers never see them. */
export function CrmNotesPanel({ studentId }: { studentId: string }) {
  const { t, isAr } = useT();
  const [notes, setNotes] = useState<CrmNote[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [newTag, setNewTag] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = `/api/dashboard/admin/students/${studentId}/crm`;

  useEffect(() => {
    dashboardFetch(base)
      .then((d: any) => { setNotes(d.notes || []); setTags(d.tags || []); setSuggested(d.suggestedTags || []); })
      .catch(() => setError(t("Couldn't load the notes.", 'تعذر تحميل الملاحظات.')));
  }, [base]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try { await fn(); } catch (err: any) { setError(err?.message || t('Something went wrong. Please try again.', 'حصلت مشكلة، حاول تاني.')); } finally { setBusy(false); }
  };

  const saveTags = (next: string[]) => run(async () => {
    const d: any = await dashboardFetch(`${base}/tags`, { method: 'PUT', body: JSON.stringify({ tags: next }) });
    setTags(d.tags || next);
  });

  const addNote = () => run(async () => {
    const d: any = await dashboardFetch(`${base}/notes`, { method: 'POST', body: JSON.stringify({ body: draft }) });
    setNotes((n) => [d.note, ...n]);
    setDraft('');
  });

  const removeNote = (id: string) => run(async () => {
    if (!window.confirm(t('Delete this note?', 'تمسح الملاحظة دي؟'))) return;
    await dashboardFetch(`${base}/notes/${id}`, { method: 'DELETE' });
    setNotes((n) => n.filter((x) => x.id !== id));
  });

  const tagLabel = (tag: string) => (isAr && TAG_AR[tag]) || tag;
  const fmt = (iso: string) => DateTime.fromISO(iso).setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATETIME_MED);

  return (
    <div className="glass-card rounded-2xl p-6 border border-border shadow-2xs space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <NotebookPen className="w-4 h-4 text-accent" />
        <span>{t('Admin notes and tags', 'ملاحظات ووسوم الإدارة')}</span>
      </h2>
      <p className="text-xs text-muted-foreground">{t('Only the admin sees these.', 'دي بتظهر للإدارة بس.')}</p>

      {error && <div role="status" className="p-3 rounded-xl text-sm text-foreground bg-warning/10">{error}</div>}

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/30 border border-secondary/50 text-xs text-foreground">
              <Tag className="w-3 h-3 text-accent" aria-hidden="true" />
              {tagLabel(tag)}
              <button type="button" disabled={busy} onClick={() => saveTags(tags.filter((x) => x !== tag))} aria-label={t(`Remove ${tag}`, `شيل ${tagLabel(tag)}`)} className="cursor-pointer text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {suggested.filter((s) => !tags.includes(s)).map((s) => (
            <button key={s} type="button" disabled={busy} onClick={() => saveTags([...tags, s])} className="px-2.5 py-1 rounded-full border border-dashed border-border text-xs text-muted-foreground hover:text-foreground cursor-pointer">
              + {tagLabel(s)}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); const v = newTag.trim().toLowerCase(); if (v && !tags.includes(v)) { saveTags([...tags, v]); setNewTag(''); } }}
        >
          <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} maxLength={60} placeholder={t('New tag', 'وسم جديد')} aria-label={t('New tag', 'وسم جديد')} className="h-9 text-sm" />
          <Button type="submit" variant="outline" size="sm" disabled={busy || !newTag.trim()}>{t('Add', 'إضافة')}</Button>
        </form>
      </div>

      <div className="space-y-2">
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={4000} rows={3} placeholder={t('Write a note about this family…', 'اكتب ملاحظة عن الأسرة دي…')} aria-label={t('New note', 'ملاحظة جديدة')} />
        <Button size="sm" onClick={addNote} disabled={busy || !draft.trim()}>{t('Save note', 'حفظ الملاحظة')}</Button>
      </div>

      {notes.length > 0 && (
        <ul className="divide-y divide-border-subtle">
          {notes.map((n) => (
            <li key={n.id} className="py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">{n.body}</p>
                <p className="text-xs text-muted-foreground mt-1">{fmt(n.created_at)}</p>
              </div>
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => removeNote(n.id)} aria-label={t('Delete note', 'مسح الملاحظة')}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
