import React, { useEffect, useState } from 'react';
import { RotateCcw, ExternalLink, Check } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { SURAHS, quranLink } from '../../lib/surahs';
import { useActiveLearner } from '../activeLearner';

type Card = { id: string; student_id: string; surah: number; ayah_from: number; ayah_to: number; box: number; due_on: string; learnerName: string | null };
type Grade = 'smooth' | 'slips' | 'mushaf';

const GRADES: { grade: Grade; en: string; ar: string }[] = [
  { grade: 'smooth', en: 'Smooth', ar: 'تمام' },
  { grade: 'slips', en: 'A few slips', ar: 'كام غلطة' },
  { grade: 'mushaf', en: 'Needed the mushaf', ar: 'احتجت المصحف' },
];

/**
 * NX-01: "Today's review" on the student home. Ayat the teacher marked mastered come back on a growing gap; the learner
 * recites each from memory and says how it went. No streaks and no red: a missed day only leaves the cards waiting.
 */
export function ReviewCard({ isAr }: { isAr: boolean }) {
  const { activeId } = useActiveLearner();
  const [data, setData] = useState<{ due: Card[]; total: number; nextDue: string | null } | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setData(null); setDone([]);
    const q = activeId ? `?learnerId=${encodeURIComponent(activeId)}` : '';
    authedJson<{ due: Card[]; total: number; nextDue: string | null }>(`/api/student/review${q}`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activeId]);

  if (!data || data.total === 0) return null;

  const n = (v: number) => (isAr ? v.toLocaleString('ar-EG') : String(v));
  const title = (c: Card) => {
    const s = SURAHS.find((x) => x.n === c.surah);
    const name = s ? (isAr ? `سورة ${s.ar}` : `Surah ${s.en}`) : '';
    const range = c.ayah_from === c.ayah_to
      ? (isAr ? `آية ${n(c.ayah_from)}` : `ayah ${c.ayah_from}`)
      : (isAr ? `من آية ${n(c.ayah_from)} لـ ${n(c.ayah_to)}` : `ayat ${c.ayah_from}-${c.ayah_to}`);
    return `${name}${isAr ? '، ' : ', '}${range}`;
  };
  const left = data.due.filter((c) => !done.includes(c.id));
  const nextLabel = data.nextDue
    ? new Date(`${data.nextDue}T12:00:00Z`).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
    : null;

  const grade = async (c: Card, g: Grade) => {
    setBusy(c.id); setError('');
    try {
      await authedJson(`/api/student/review/${c.id}`, { method: 'POST', body: JSON.stringify({ grade: g }) });
      setDone((d) => [...d, c.id]);
    } catch (e: any) {
      setError(isAr ? 'معرفناش نحفظ، جرّب تاني.' : e?.message || 'Could not save.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section data-testid="review-card" className="p-4 rounded-2xl glass-card border border-border space-y-3" aria-labelledby="review-card-title">
      <h2 id="review-card-title" className="text-sm font-semibold text-foreground flex items-center gap-2">
        <RotateCcw className="w-4 h-4 text-teal" aria-hidden="true" />
        {isAr ? 'مراجعة النهارده' : "Today's review"}
      </h2>

      {left.length > 0 ? (
        <>
          <p className="text-xs text-muted-foreground">
            {isAr ? 'سمّع كل جزء من حفظك من غير المصحف، وبعدين قول لنا كان عامل إزاي.' : 'Recite each part from memory, without the mushaf, then tell us how it went.'}
          </p>
          <ul className="space-y-3">
            {left.map((c) => (
              <li key={c.id} className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {title(c)}
                    {c.learnerName && <span className="block text-xs font-normal text-muted-foreground">{c.learnerName}</span>}
                  </p>
                  <a href={quranLink(c.surah, c.ayah_from, c.ayah_to)} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 min-h-11 text-xs text-teal underline underline-offset-4">
                    {isAr ? 'افتح الآيات' : 'Open the ayat'}<ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label={isAr ? 'كان عامل إزاي؟' : 'How did it go?'}>
                  {GRADES.map((g) => (
                    <button key={g.grade} type="button" disabled={busy === c.id} onClick={() => grade(c, g.grade)}
                      className="min-h-11 rounded-xl border border-border px-2 text-xs font-semibold text-foreground hover:bg-surface-subtle disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal">
                      {isAr ? g.ar : g.en}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-muted-foreground flex items-center gap-2" role="status">
          <Check className="w-4 h-4 text-teal shrink-0" aria-hidden="true" />
          {done.length > 0
            ? (isAr ? 'خلّصت مراجعة النهارده، بارك الله فيك.' : 'Today’s review is done. May Allah bless your effort.')
            : (isAr ? 'مفيش مراجعة النهارده.' : 'Nothing to review today.')}
          {nextLabel && !done.length && <span>{isAr ? ` المراجعة الجاية: ${nextLabel}.` : ` Next review: ${nextLabel}.`}</span>}
        </p>
      )}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </section>
  );
}
