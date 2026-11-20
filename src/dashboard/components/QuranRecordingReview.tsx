import React, { useEffect, useMemo, useState } from 'react';
import { ScanSearch } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../lib/language';
import { dashboardFetch } from '../lib/dashboardApi';
import { sharedQuranApi, type MarkType, type QuranChapter, type QuranPage } from '../../quran/api';
import { MARK_STYLE, Mushaf } from '../../quran/Mushaf';

type Review = { surah: number; ayahFrom: number; ayahTo: number; marks: Array<{ key: string; type: MarkType }>; reviewedAt: string | null };

/**
 * Classroom 4.5: the teacher marks the words of a sent recording by ear. The detector's own flags are never shown here
 * (a blind check), so the super admin page can measure how often the two agree before any hint reaches a learner.
 */
export function QuranRecordingReview({ recordingId, playUrl }: { recordingId: string; playUrl: string | null }) {
  const { t, isAr } = useT();
  const api = sharedQuranApi('dashboard');
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [missing, setMissing] = useState(false);
  const [pages, setPages] = useState<QuranPage[]>([]);
  const [chapters, setChapters] = useState<QuranChapter[]>([]);
  const [marks, setMarks] = useState<Map<string, MarkType>>(new Map());
  const [type, setType] = useState<MarkType>('wrong_word');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || review || missing) return;
    dashboardFetch<{ review: Review }>(`/api/dashboard/recitations/${recordingId}/quran-review`)
      .then(async ({ review: r }) => {
        setReview(r);
        setMarks(new Map(r.marks.map((m) => [m.key, m.type])));
        const [first, last] = await Promise.all([api.pageOf(`${r.surah}:${r.ayahFrom}`), api.pageOf(`${r.surah}:${r.ayahTo}`)]);
        setPages(await Promise.all(Array.from({ length: last - first + 1 }, (_, i) => api.page(first + i))));
        setChapters((await api.chapters()).chapters);
      })
      .catch((e: any) => { if (e?.status === 404) setMissing(true); else setError(e?.message || t('Could not load.', 'ما اتحملش.')); });
  }, [open, recordingId]);

  const range = useMemo(() => review && { surah: review.surah, from: review.ayahFrom, to: review.ayahTo }, [review]);
  const toggle = (key: string) => setMarks((m) => {
    const next = new Map(m);
    if (next.get(key) === type) next.delete(key); else next.set(key, type);
    return next;
  });
  const save = async () => {
    setBusy(true); setError('');
    try {
      await dashboardFetch(`/api/dashboard/recitations/${recordingId}/quran-review`, { method: 'POST', body: JSON.stringify({ marks: [...marks].map(([key, type]) => ({ key, type })) }) });
      setReview((r) => r && { ...r, reviewedAt: new Date().toISOString() });
      setOpen(false);
    } catch (e: any) { setError(e?.message || t('Could not save.', 'ما اتحفظش.')); } finally { setBusy(false); }
  };
  const inRange = (v: { chapter: number; verse: number }) => !range || (v.chapter === range.surah && v.verse >= range.from && v.verse <= range.to);

  return (
    <>
      <Button type="button" size="sm" variant="ghost" className="w-fit" onClick={() => setOpen(true)}>
        <ScanSearch className="me-1 h-4 w-4" aria-hidden="true" />{review?.reviewedAt ? t('Word marks saved', 'علامات الكلمات اتحفظت') : t('Mark the words', 'علّم الكلمات')}
      </Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} maxWidth="4xl" title={t('Mark the mistaken words', 'علّم الكلمات الغلط')}
        footer={review && <div className="flex flex-wrap justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>{t('Cancel', 'إلغاء')}</Button><Button onClick={save} isLoading={busy}>{t('Save marks', 'احفظ العلامات')}</Button></div>}>
        {missing ? (
          <p className="text-sm text-muted-foreground">{t('This recording was sent without a word check, so there is nothing to compare.', 'التسجيل ده اتبعت من غير مراجعة الكلمات، فمفيش حاجة نقارنها.')}</p>
        ) : !review ? (
          error ? <p role="alert" className="text-sm text-destructive">{error}</p> : <p className="text-sm text-muted-foreground">{t('Loading…', 'بنحمّل…')}</p>
        ) : (
          <div className="grid gap-3">
            <p className="text-sm text-muted-foreground">{t('Listen, choose the kind of mistake, then tap each word. Tap again to clear. This trains our word check; the family does not see these marks.', 'اسمع، اختار نوع الغلط، ودوس على كل كلمة. دوس تاني عشان تشيلها. ده بيدرّب مراجعة الكلمات عندنا؛ الأسرة مش هتشوف العلامات دي.')}</p>
            {playUrl && <audio controls preload="none" src={playUrl} className="h-10 w-full" />}
            <div role="radiogroup" aria-label={t('Kind of mistake', 'نوع الغلط')} className="flex flex-wrap gap-2">
              {(Object.keys(MARK_STYLE) as MarkType[]).map((k) => (
                <Button key={k} type="button" size="sm" role="radio" aria-checked={type === k} variant={type === k ? 'primary' : 'outline'} onClick={() => setType(k)}>
                  <span className="me-1.5 h-1 w-4 rounded-full" style={{ background: MARK_STYLE[k].line }} aria-hidden="true" />{isAr ? MARK_STYLE[k].ar : MARK_STYLE[k].en}
                </Button>
              ))}
            </div>
            {pages.map((p) => (
              <Mushaf key={p.page} page={{ ...p, verses: p.verses.filter(inRange) }} chapters={chapters} marks={marks} onWord={(key) => toggle(key)} />
            ))}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
