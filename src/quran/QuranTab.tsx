import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { BrandLoader } from '../components/ui/BrandLoader';
import { authedJson } from '../lib/authedJson';
import { useT } from '../lib/language';
import { SURAHS } from '../lib/surahs';
import { useActiveLearner } from '../student/activeLearner';
import { sharedQuranApi, type Mark, type MarkType, type QuranChapter, type QuranPage, type QuranWord, type Reciter } from './api';
import { FLAG_AS_MARK, MARK_STYLE, Mushaf, TajweedLegend } from './Mushaf';
import { Recite } from './Recite';
import { Detector } from './Detector';

const PAGES = 604;
const LAST_PAGE_KEY = 'wz-quran-page';
const readLast = () => { try { return Number(localStorage.getItem(LAST_PAGE_KEY)) || 1; } catch { return 1; } };
const saveLast = (p: number) => { try { localStorage.setItem(LAST_PAGE_KEY, String(p)); } catch { /* private mode */ } };

/**
 * Classroom 4.1 and 4.3: the learner's Quran tab. The whole mushaf with tajweed colours, the teacher's marks from sent
 * lesson reports, and homework: `?surah=67&from=1&to=15&hw=<id>` opens at the assigned ayat with listen-and-repeat,
 * recording and the word check. Shown only to learners in a Quran track, Islamic studies or Fusha (server decides).
 */
export function QuranTab() {
  const { t, isAr } = useT();
  const api = sharedQuranApi('student');
  const [params, setParams] = useSearchParams();
  const { activeId } = useActiveLearner();
  const [learners, setLearners] = useState<Array<{ id: string; name: string }> | null>(null);
  const [chosen, setChosen] = useState<string | null>(params.get('learner'));
  const [meta, setMeta] = useState<{ chapters: QuranChapter[]; reciters: Reciter[] } | null>(null);
  const [bismillah, setBismillah] = useState<QuranWord[] | undefined>();
  const [pageNo, setPageNo] = useState<number>(() => Number(params.get('page')) || readLast());
  const [page, setPage] = useState<QuranPage | null>(null);
  const [error, setError] = useState('');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [showMarks, setShowMarks] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const [flags, setFlags] = useState<Array<{ key: string; kind: 'missing' | 'changed' | 'extra' }>>([]);
  const [pageInput, setPageInput] = useState('');

  const hw = useMemo(() => {
    const surah = Number(params.get('surah')), from = Number(params.get('from')), to = Number(params.get('to'));
    const s = SURAHS.find((x) => x.n === surah);
    if (!s || !Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from || to > s.ayat) return null;
    return { surah, from, to, id: params.get('hw') || undefined, name: isAr ? s.ar : s.en };
  }, [params, isAr]);

  useEffect(() => {
    authedJson<{ learners: Array<{ id: string; name: string }> }>('/api/student/quran/access').then((d) => setLearners(d.learners || [])).catch(() => setLearners([]));
    api.chapters().then(setMeta).catch(() => setError(t('The mushaf could not load. Please try again.', 'المصحف ما اتحملش. جرّب تاني.')));
    api.page(1).then((p) => setBismillah(p.verses[0]?.words)).catch(() => {});
  }, [api]);

  const learner = learners && (learners.find((l) => l.id === chosen) || learners.find((l) => l.id === activeId) || learners[0] || null);

  // Homework opens at the first assigned ayah's page.
  useEffect(() => {
    if (!hw) return;
    api.pageOf(`${hw.surah}:${hw.from}`).then(setPageNo).catch(() => {});
  }, [hw?.surah, hw?.from]);

  useEffect(() => {
    let live = true;
    setError('');
    api.page(pageNo).then((p) => { if (live) { setPage(p); saveLast(pageNo); } })
      .catch(() => { if (live) setError(t('This page could not load. Please try again.', 'الصفحة دي ما اتحملتش. جرّب تاني.')); });
    return () => { live = false; };
  }, [api, pageNo]);

  useEffect(() => {
    if (!learner) return;
    authedJson<{ marks: Mark[] }>(`/api/student/quran/marks?learnerId=${encodeURIComponent(learner.id)}`).then((d) => setMarks(d.marks || [])).catch(() => setMarks([]));
  }, [learner?.id]);

  const markMap = useMemo(() => {
    const m = new Map<string, MarkType>();
    if (showMarks) for (const x of marks) m.set(`${x.verseKey}:${x.word}`, x.type);
    for (const f of flags) m.set(f.key, FLAG_AS_MARK[f.kind]);
    return m;
  }, [marks, showMarks, flags]);

  // Listen-and-repeat turns the page when the reciter reaches the next one.
  const onReciteWord = (key: string | null, verseKey: string | null) => {
    setActive(key);
    if (verseKey && page && !page.verses.some((v) => v.key === verseKey)) void api.pageOf(verseKey).then(setPageNo).catch(() => {});
  };

  const go = (p: number) => { if (p >= 1 && p <= PAGES) { setPageNo(p); setActive(null); } };
  const chapterOnPage = page?.verses[0]?.chapter;

  if (learners === null) return <BrandLoader size="md" />;
  if (!learner) {
    return (
      <div className="mx-auto max-w-xl p-6 text-center text-muted-foreground">
        {t('The Quran tab opens for learners in a Quran, Islamic studies or Fusha track.', 'تبويب القرآن بيفتح لطلاب القرآن والدراسات الإسلامية والفصحى.')}
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4 px-4 pb-24 pt-4 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold"><BookOpen className="h-6 w-6 text-accent" aria-hidden="true" />{t('Quran', 'القرآن')}</h1>
        {learners.length > 1 && (
          <Select value={learner.id} onChange={(e) => { setChosen(e.target.value); setFlags([]); }} aria-label={t('Learner', 'الطالب')} className="h-10 min-w-40">
            {learners.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        )}
      </header>

      {hw && (
        <div className="grid gap-3 rounded-2xl border border-sand-border bg-sand-light/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">{t(`Homework: Surah ${hw.name}, ayat ${hw.from}-${hw.to}`, `الواجب: سورة ${hw.name}، من آية ${hw.from} لـ ${hw.to}`)}</p>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setParams({}); setFlags([]); }}>{t('Close homework', 'اقفل الواجب')}</Button>
          </div>
          {meta && <Recite api={api} surah={hw.surah} from={hw.from} to={hw.to} reciters={meta.reciters} onWord={onReciteWord} />}
          <Detector api={api} learnerId={learner.id} homeworkId={hw.id} surah={hw.surah} from={hw.from} to={hw.to} onFlags={setFlags} />
        </div>
      )}

      <nav className="flex flex-wrap items-end gap-2" aria-label={t('Find a page', 'دوّر على صفحة')}>
        <label className="grid min-w-48 flex-1 gap-1 text-xs text-muted-foreground">
          {t('Surah', 'السورة')}
          <Select value={chapterOnPage ?? ''} onChange={(e) => { const c = meta?.chapters.find((x) => x.n === Number(e.target.value)); if (c) go(c.pages[0]); }} className="h-10">
            {(meta?.chapters || []).map((c) => <option key={c.n} value={c.n}>{c.n}. {isAr ? c.ar : c.en}</option>)}
          </Select>
        </label>
        <form className="grid gap-1 text-xs text-muted-foreground" onSubmit={(e) => { e.preventDefault(); go(Number(pageInput)); setPageInput(''); }}>
          <label htmlFor="quran-page">{t('Page (1-604)', 'صفحة (١-٦٠٤)')}</label>
          <Input id="quran-page" inputMode="numeric" value={pageInput} placeholder={String(pageNo)} onChange={(e) => setPageInput(e.target.value.replace(/\D/g, '').slice(0, 3))} className="h-10 w-24" />
        </form>
        {marks.length > 0 && (
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input type="checkbox" checked={showMarks} onChange={(e) => setShowMarks(e.target.checked)} className="h-4 w-4" />
            {t("My teacher's marks", 'علامات المعلم')}
          </label>
        )}
      </nav>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {page && <Mushaf page={page} chapters={meta?.chapters} bismillah={bismillah} marks={markMap} active={active} range={hw} />}

      <div className="flex items-center justify-between gap-2" dir="rtl">
        <Button type="button" variant="outline" onClick={() => go(pageNo - 1)} disabled={pageNo <= 1} aria-label={t('Previous page', 'الصفحة اللي قبلها')}><ChevronRight className="h-5 w-5" aria-hidden="true" /></Button>
        <span className="text-sm text-muted-foreground tabular-nums">{isAr ? `صفحة ${pageNo.toLocaleString('ar-EG')}` : `Page ${pageNo}`}</span>
        <Button type="button" variant="outline" onClick={() => go(pageNo + 1)} disabled={pageNo >= PAGES} aria-label={t('Next page', 'الصفحة اللي بعدها')}><ChevronLeft className="h-5 w-5" aria-hidden="true" /></Button>
      </div>

      {page && <TajweedLegend page={page} />}
      {markMap.size > 0 && (
        <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground" aria-label={t('What the marks mean', 'معنى العلامات')}>
          {(Object.keys(MARK_STYLE) as MarkType[]).map((k) => (
            <li key={k} className="flex items-center gap-1.5"><span className="h-1 w-5 rounded-full" style={{ background: MARK_STYLE[k].line }} aria-hidden="true" />{isAr ? MARK_STYLE[k].ar : MARK_STYLE[k].en}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default QuranTab;
