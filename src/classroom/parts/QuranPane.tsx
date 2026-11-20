import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { authedJson } from '../../lib/authedJson';
import { useT } from '../../lib/language';
import { sharedQuranApi, type Mark, type MarkType, type QuranChapter, type QuranPage, type QuranWord } from '../../quran/api';
import { MARK_STYLE, Mushaf, TajweedLegend } from '../../quran/Mushaf';

const PAGES = 604;
const pageKey = (bookingId: string) => `wz-room-quran-${bookingId}`;
/** The teacher's last mushaf page in this lesson, so a rejoin opens where they were (the page itself is not persisted). */
export function lastRoomQuranPage(bookingId: string): number {
  try { return Math.min(PAGES, Math.max(1, Number(sessionStorage.getItem(pageKey(bookingId))) || 1)); } catch { return 1; }
}

/**
 * Classroom 4.2: the synced mushaf in the lesson. The teacher turns the pages (the learner follows over the room channel)
 * and taps a word to mark it. Marks are saved for this lesson and reach the learner only with the sent report, so the
 * learner's screen never shows them.
 */
export function QuranPane({ bookingId, page: pageNo, teacher, staff, onPage }: {
  bookingId: string;
  page: number;
  teacher: boolean;
  /** Staff accounts (teacher, admin observer) read through the dashboard routes. */
  staff: boolean;
  onPage?: (page: number) => void;
}) {
  const { t, isAr } = useT();
  const api = sharedQuranApi(staff ? 'dashboard' : 'student');
  const [page, setPage] = useState<QuranPage | null>(null);
  const [chapters, setChapters] = useState<QuranChapter[]>([]);
  const [bismillah, setBismillah] = useState<QuranWord[] | undefined>();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pageInput, setPageInput] = useState('');

  useEffect(() => {
    api.chapters().then((d) => setChapters(d.chapters)).catch(() => {});
    api.page(1).then((p) => setBismillah(p.verses[0]?.words)).catch(() => {});
    if (teacher) authedJson<{ marks: Mark[] }>(`/api/dashboard/bookings/${bookingId}/quran-marks`).then((d) => setMarks(d.marks || [])).catch(() => {});
  }, [api, bookingId, teacher]);

  useEffect(() => {
    let live = true;
    setError('');
    api.page(pageNo).then((p) => { if (live) setPage(p); }).catch(() => { if (live) setError(t('This page could not load.', 'الصفحة دي ما اتحملتش.')); });
    if (teacher) try { sessionStorage.setItem(pageKey(bookingId), String(pageNo)); } catch { /* private mode */ }
    return () => { live = false; };
  }, [api, pageNo, teacher, bookingId]);

  const markMap = useMemo(() => new Map(marks.map((m) => [`${m.verseKey}:${m.word}`, m.type] as [string, MarkType])), [marks]);
  const current = picked ? marks.find((m) => `${m.verseKey}:${m.word}` === picked) : undefined;
  const go = (p: number) => { if (onPage && p >= 1 && p <= PAGES) { onPage(p); setPicked(null); } };

  const save = async (type: MarkType) => {
    if (!picked) return;
    const [s, a, w] = picked.split(':');
    setBusy(true); setError('');
    try {
      const { mark } = await authedJson<{ mark: Mark }>(`/api/dashboard/bookings/${bookingId}/quran-marks`, { method: 'PUT', body: JSON.stringify({ verseKey: `${s}:${a}`, word: Number(w), type, note: note.trim() || null }) });
      setMarks((list) => [...list.filter((m) => m.id !== mark.id), mark]);
      setPicked(null); setNote('');
    } catch (e: any) { setError(e?.message || t('Could not save the mark.', 'العلامة ما اتحفظتش.')); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!current) return;
    setBusy(true);
    try {
      await authedJson(`/api/dashboard/bookings/${bookingId}/quran-marks/${current.id}`, { method: 'DELETE' });
      setMarks((list) => list.filter((m) => m.id !== current.id));
      setPicked(null); setNote('');
    } catch (e: any) { setError(e?.message || t('Could not remove the mark.', 'العلامة ما اتشالتش.')); } finally { setBusy(false); }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      {teacher && (
        <div className="flex shrink-0 flex-wrap items-end gap-2 px-1">
          <div className="min-w-44 flex-1">
            <Select aria-label={t('Surah', 'السورة')} value={page?.verses[0]?.chapter ?? ''} onChange={(e) => { const c = chapters.find((x) => x.n === Number(e.target.value)); if (c) go(c.pages[0]); }} className="h-10">
              {chapters.map((c) => <option key={c.n} value={c.n}>{c.n}. {isAr ? c.ar : c.en}</option>)}
            </Select>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); go(Number(pageInput)); setPageInput(''); }}>
            <Input aria-label={t('Page (1-604)', 'صفحة (١-٦٠٤)')} inputMode="numeric" value={pageInput} placeholder={String(pageNo)} onChange={(e) => setPageInput(e.target.value.replace(/\D/g, '').slice(0, 3))} className="h-10 w-20" />
          </form>
          <div className="flex gap-1" dir="rtl">
            <Button type="button" size="sm" variant="outline" onClick={() => go(pageNo - 1)} disabled={pageNo <= 1} aria-label={t('Previous page', 'الصفحة اللي قبلها')}><ChevronRight className="h-4 w-4" aria-hidden="true" /></Button>
            <Button type="button" size="sm" variant="outline" onClick={() => go(pageNo + 1)} disabled={pageNo >= PAGES} aria-label={t('Next page', 'الصفحة اللي بعدها')}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></Button>
          </div>
          <p className="w-full text-xs text-muted-foreground">{t('Tap a word to mark it. The learner sees your marks with the lesson report.', 'دوس على كلمة عشان تعلّمها. الطالب هيشوف العلامات مع تقرير الحصة.')}</p>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        {error && <p role="alert" className="px-2 text-sm text-destructive">{error}</p>}
        {page && <Mushaf page={page} chapters={chapters} bismillah={bismillah} marks={teacher ? markMap : undefined} active={picked}
          onWord={teacher ? (key) => { setPicked(key); setNote(marks.find((m) => `${m.verseKey}:${m.word}` === key)?.note || ''); } : undefined} />}
        {page && teacher && <div className="mx-auto mt-2 max-w-[44rem]"><TajweedLegend page={page} /></div>}
      </div>
      {teacher && picked && (
        <div role="dialog" aria-label={t('Mark this word', 'علّم الكلمة دي')} className="glass-1 shrink-0 rounded-[var(--r-3)] p-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MARK_STYLE) as MarkType[]).map((k) => (
              <Button key={k} type="button" size="sm" variant={current?.type === k ? 'primary' : 'outline'} onClick={() => save(k)} disabled={busy}>
                <span className="me-1.5 h-1 w-4 rounded-full" style={{ background: MARK_STYLE[k].line }} aria-hidden="true" />{isAr ? MARK_STYLE[k].ar : MARK_STYLE[k].en}
              </Button>
            ))}
            {current && <Button type="button" size="sm" variant="ghost" onClick={remove} disabled={busy}><Trash2 className="me-1 h-4 w-4" aria-hidden="true" />{t('Remove', 'شيل')}</Button>}
            <Button type="button" size="sm" variant="ghost" onClick={() => setPicked(null)}>{t('Close', 'اقفل')}</Button>
          </div>
          <Input className="mt-2 h-10" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('Note (optional), e.g. madd 4 counts', 'ملاحظة (اختياري)، مثلاً: المد ٤ حركات')} aria-label={t('Note', 'ملاحظة')} />
        </div>
      )}
    </div>
  );
}
