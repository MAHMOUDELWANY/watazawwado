import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { BookOpen, Check, ExternalLink, Sparkles } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { homeworkLine, type HomeworkItem } from '../../lib/homework';
import { useActiveLearner } from '../activeLearner';

/**
 * NX-02: "This week's homework" on the student home. The teacher's tasks for the next lesson, one Done per task.
 * Calm by design: no red and no due dates; an open task simply waits for the next lesson.
 */
export function HomeworkCard({ isAr }: { isAr: boolean }) {
  const { learners, activeId } = useActiveLearner();
  const reduce = useReducedMotion();
  const [data, setData] = useState<{ open: HomeworkItem[]; recent: HomeworkItem[]; hasNextLesson: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [cheer, setCheer] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setData(null);
    const q = activeId ? `?learnerId=${encodeURIComponent(activeId)}` : '';
    authedJson<{ open: HomeworkItem[]; recent: HomeworkItem[]; hasNextLesson: boolean }>(`/api/student/homework${q}`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activeId]);

  const mastered = (data?.recent || []).filter((h) => h.review === 'mastered');
  if (!data || (data.open.length === 0 && mastered.length === 0)) return null;

  const showNames = !activeId && learners.length > 1;
  const nameOf = (id: string) => learners.find((l) => l.id === id)?.name || '';

  const toggle = async (hw: HomeworkItem) => {
    const done = !hw.done_at;
    setBusy(hw.id); setError('');
    try {
      const r = await authedJson<{ homework: HomeworkItem }>(`/api/student/homework/${hw.id}/done`, { method: 'POST', body: JSON.stringify({ done }) });
      setData((d) => d && { ...d, open: d.open.map((x) => (x.id === hw.id ? r.homework : x)) });
      if (done) setCheer(hw.id);
    } catch (e: any) {
      setError(isAr ? 'معرفناش نحفظ، جرّب تاني.' : e?.message || 'Could not save.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section data-testid="homework-card" className="p-4 rounded-2xl glass-card border border-border space-y-3" aria-labelledby="homework-card-title">
      <h2 id="homework-card-title" className="text-sm font-semibold text-foreground flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-teal" aria-hidden="true" />
        {isAr ? 'واجب الأسبوع' : "This week's homework"}
      </h2>

      {data.open.length > 0 && (
        <ul className="space-y-2">
          {data.open.map((hw) => {
            const line = homeworkLine(hw, isAr);
            const done = Boolean(hw.done_at);
            return (
              <li key={hw.id} className="flex items-start gap-3 rounded-xl bg-surface-subtle p-3">
                <button
                  type="button"
                  onClick={() => toggle(hw)}
                  disabled={busy === hw.id}
                  aria-pressed={done}
                  aria-label={done ? (isAr ? 'علّمته خلصان، دوس عشان تلغي' : 'Marked done, tap to undo') : (isAr ? 'خلصت' : 'Done')}
                  className={`tap-44 relative shrink-0 w-7 h-7 mt-0.5 grid place-items-center rounded-full border-2 transition-colors cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${done ? 'bg-teal border-teal text-white' : 'border-border text-transparent hover:border-teal'}`}
                >
                  <motion.span initial={false} animate={reduce ? undefined : { scale: done ? [0.6, 1.15, 1] : 1 }} transition={{ duration: 0.3 }}>
                    <Check className="w-4 h-4" aria-hidden="true" />
                  </motion.span>
                </button>
                <div className="min-w-0 flex-1 grid gap-0.5">
                  {showNames && <span className="text-[11px] font-semibold text-muted-foreground">{nameOf(hw.student_id)}</span>}
                  <span className={`text-sm text-foreground ${done ? 'line-through decoration-muted-foreground/50' : ''}`}>{line.title}</span>
                  {line.note && <span className="text-xs text-muted-foreground">{line.note}</span>}
                  {line.href && (line.external
                    ? <a href={line.href} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-teal underline underline-offset-4 inline-flex items-center gap-1 w-fit">{isAr ? 'افتح الآيات' : 'Open the ayat'}<ExternalLink className="w-3 h-3" aria-hidden="true" /></a>
                    : <Link to={line.href} className="text-xs font-semibold text-teal underline underline-offset-4 w-fit">{isAr ? 'افتح منهجي' : 'Open my curriculum'}</Link>)}
                  <AnimatePresence>
                    {cheer === hw.id && done && (
                      <motion.span
                        role="status"
                        initial={reduce ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-semibold text-gold"
                      >
                        {isAr ? 'زادك الله علمًا' : 'May Allah increase you in knowledge'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {mastered.length > 0 && (
        <p className="text-xs text-foreground flex items-center gap-1.5" data-testid="homework-mastered">
          <Sparkles className="w-4 h-4 text-gold" aria-hidden="true" />
          {isAr
            ? `المعلم قال أتقنت ${mastered.length.toLocaleString('ar-EG')} من واجباتك الأخيرة. ما شاء الله!`
            : `Your teacher marked ${mastered.length} recent ${mastered.length === 1 ? 'task' : 'tasks'} as mastered. Masha Allah!`}
        </p>
      )}

      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

      {!data.hasNextLesson && data.open.length > 0 && (
        <Link to="/student/book" className="block text-center rounded-xl bg-primary text-primary-foreground text-sm font-semibold py-2.5 min-h-11 focus-ring">
          {isAr ? 'احجز حصتك الجاية' : 'Book your next lesson'}
        </Link>
      )}
    </section>
  );
}
