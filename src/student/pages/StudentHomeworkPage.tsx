import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Award, Check, ChevronLeft, ChevronRight, ClipboardCheck, Clock, RotateCcw, Sparkles, X } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import FocusTrap from '../../components/FocusTrap';

/**
 * Owner review 2026-11-09: the Homework tab. Sets come from the curriculum pages the teacher marked after a lesson.
 * New / retry → answer; below the pass mark it waits for the teacher; passed and accepted sets are done.
 * Look per age version: kids playful with Zad, teens game-like, adults calm (docs/design/ACCOUNT-VOICE.md).
 */

type L = { en: string; ar: string };
type Q =
  | { id: string; type: 'mcq'; page: number; prompt: L; options: L[] }
  | { id: string; type: 'truefalse'; page: number; prompt: L }
  | { id: string; type: 'order'; page: number; prompt: L; items: Array<L & { key: string }> };
type Result = { id: string; correct: boolean; explain: L; correctAnswer: number | boolean | string[] };
type HwSet = {
  id: string; studentId: string; track: string; lessonNumber: number; fromPage: number; toPage: number;
  kind: 'part' | 'lesson' | 'review'; version: 'kids' | 'teens' | 'adults' | null; title: L;
  status: 'new' | 'retry' | 'submitted' | 'passed' | 'done'; score: number | null; total: number | null;
  createdAt: string; questions: Q[]; lastResult: { score: number; total: number; results: Result[] } | null;
};
type Badge = { id: string; title: L };
type Learner = { id: string; name: string; badges: Badge[] };

const ZAD = '/zad-notification-192.png';

function useL(lang: 'ar' | 'en') {
  const ar = lang === 'ar';
  return { ar, t: (en: string, arText: string) => (ar ? arText : en), pick: (x: L) => (ar ? x.ar : x.en) };
}

const KIND: Record<HwSet['kind'], L> = {
  part: { en: 'Part of a lesson', ar: 'جزء من درس' },
  lesson: { en: 'Whole lesson', ar: 'درس كامل' },
  review: { en: 'Quick review', ar: 'مراجعة سريعة' },
};

/** Option tile colours: our palette, never green (success is teal). */
const TILE = ['border-crimson/40 hover:bg-crimson/5', 'border-teal/40 hover:bg-teal/5', 'border-[var(--gold)]/60 hover:bg-[var(--gold)]/10', 'border-[#B5835A]/50 hover:bg-[#B5835A]/10'];

function OrderQuestion({ q, value, onChange, pick, t }: { q: Extract<Q, { type: 'order' }>; value: string[]; onChange: (v: string[]) => void; pick: (x: L) => string; t: (a: string, b: string) => string }) {
  const left = q.items.filter((it) => !value.includes(it.key));
  return (
    <div className="space-y-3">
      <ol className="space-y-2 min-h-[48px] rounded-2xl border-2 border-dashed border-border p-2" aria-label={t('Your order', 'ترتيبك')}>
        {value.length === 0 && <li className="text-sm text-muted-foreground p-2">{t('Tap the steps below in the right order.', 'دوس على الخطوات اللي تحت بالترتيب الصح.')}</li>}
        {value.map((k, i) => {
          const it = q.items.find((x) => x.key === k)!;
          return (
            <li key={k}>
              <button type="button" onClick={() => onChange(value.filter((x) => x !== k))} className="w-full flex items-center gap-3 rounded-xl bg-teal/10 border border-teal/40 px-3 py-2.5 text-start min-h-[44px]">
                <span className="w-7 h-7 rounded-full bg-teal text-white text-sm font-bold grid place-items-center shrink-0">{i + 1}</span>
                <span className="flex-1">{pick(it)}</span>
                <X className="w-4 h-4 text-muted-foreground" aria-label={t('Remove', 'شيل')} />
              </button>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap gap-2">
        {left.map((it) => (
          <button key={it.key} type="button" onClick={() => onChange([...value, it.key])} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm min-h-[44px] hover:border-teal">
            {pick(it)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The new badge, revealed like the owner's references: drop in, a gold burst, then a slow shimmer. */
function BadgeUnlock({ badges, onClose, pick, t }: { badges: Badge[]; onClose: () => void; pick: (x: L) => string; t: (a: string, b: string) => string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-[#1E1410]/80 backdrop-blur-sm p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} role="dialog" aria-modal="true" aria-label={t('New badge', 'وسام جديد')}>
      <FocusTrap onEscape={onClose}>
      <div className="relative text-center" onClick={(e) => e.stopPropagation()}>
        {!reduce && (
          <>
            <motion.div className="absolute left-1/2 top-24 -translate-x-1/2 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(229,169,60,0.75), rgba(229,169,60,0) 65%)' }}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.6, 1.1], opacity: [0, 1, 0.55] }} transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1], delay: 0.35 }} />
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.span key={i} className="absolute left-1/2 top-24 w-2 h-2 rounded-full bg-[var(--gold)]"
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ x: Math.cos((i / 14) * Math.PI * 2) * 150, y: Math.sin((i / 14) * Math.PI * 2) * 150 + 40, opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, delay: 0.45, ease: 'easeOut' }} />
            ))}
          </>
        )}
        <motion.div className="relative mx-auto w-40 h-48" initial={reduce ? false : { y: -260, rotate: -12, scale: 0.6 }} animate={{ y: 0, rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
          {/* Arch-shaped badge in our palette, the khatam star inside. */}
          <svg viewBox="0 0 160 192" className="w-full h-full drop-shadow-[0_12px_30px_rgba(229,169,60,0.45)]" aria-hidden="true">
            <defs>
              <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F6D58E" /><stop offset="0.5" stopColor="#E5A93C" /><stop offset="1" stopColor="#B5835A" /></linearGradient>
              <linearGradient id="in" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8E1B2C" /><stop offset="1" stopColor="#5C1220" /></linearGradient>
            </defs>
            <path d="M80 6 C122 6 152 36 152 78 V176 a10 10 0 0 1-10 10 H18 a10 10 0 0 1-10-10 V78 C8 36 38 6 80 6Z" fill="url(#bg)" />
            <path d="M80 22 C113 22 136 46 136 80 V166 H24 V80 C24 46 47 22 80 22Z" fill="url(#in)" />
            <g transform="translate(80 98)" fill="#F6D58E">
              <rect x="-26" y="-26" width="52" height="52" rx="4" />
              <rect x="-26" y="-26" width="52" height="52" rx="4" transform="rotate(45)" />
              <circle r="15" fill="#8E1B2C" />
              <circle r="7" fill="#F6D58E" />
            </g>
          </svg>
          {!reduce && <motion.div className="absolute inset-0 rounded-t-full" style={{ clipPath: 'inset(0 round 999px 999px 10px 10px)' }}><motion.div className="absolute inset-0" style={{ background: 'linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)' }} initial={{ x: '-120%' }} animate={{ x: '120%' }} transition={{ duration: 1.6, delay: 1.1, repeat: Infinity, repeatDelay: 2.4 }} /></motion.div>}
        </motion.div>
        <motion.img src={ZAD} alt="" aria-hidden="true" className="absolute end-[calc(50%-7rem)] -top-2 w-14 h-14 rounded-full" initial={reduce ? false : { scale: 0, y: 30 }} animate={{ scale: 1, y: [30, -8, 0] }} transition={{ delay: 0.9, duration: 0.6 }} />
        <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-5 space-y-1 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F6D58E]">{t('New badge', 'وسام جديد')}</p>
          <p className="font-display text-2xl font-bold">{badges.map((b) => pick(b.title)).join(' · ')}</p>
          <button type="button" onClick={onClose} className="mt-4 rounded-full bg-[#F6D58E] text-[#1E1410] font-bold px-6 py-2.5 min-h-[44px]">{t('Yay!', 'يا سلام!')}</button>
        </motion.div>
      </div>
      </FocusTrap>
    </motion.div>
  );
}

function Player({ set, lang, onDone }: { set: HwSet; lang: 'ar' | 'en'; onDone: (r: { passed: boolean; newBadges: Badge[] }) => void }) {
  const { ar, t, pick } = useL(lang);
  const reduce = useReducedMotion();
  const kids = set.version === 'kids';
  const teens = set.version === 'teens';
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ passed: boolean; score: number; total: number; results: Result[]; newBadges: Badge[] } | null>(null);
  const q = set.questions[i];
  const answered = (x: Q) => answers[x.id] !== undefined && (x.type !== 'order' || (answers[x.id] as string[]).length === x.items.length);
  const allDone = set.questions.every(answered);

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const r = await authedJson<any>(`/api/student/homework-sets/${set.id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) });
      setResult(r);
    } catch (e: any) { setError(e?.message || t('Could not hand it in. Try again.', 'ماتسلّمش. جرّب تاني.')); } finally { setBusy(false); }
  };

  if (result) {
    const pct = Math.round((result.score / Math.max(1, result.total)) * 100);
    return (
      <div className="space-y-5">
        <div className="text-center space-y-3">
          <motion.img src={ZAD} alt="" aria-hidden="true" className="mx-auto w-20 h-20 rounded-full" initial={reduce ? false : { scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 12 }} />
          <div className="font-display text-4xl font-bold text-foreground tabular-nums">{result.score}/{result.total}</div>
          <p className="text-base text-foreground">
            {result.passed
              ? pct === 100 ? t('Full marks, masha’Allah!', 'الدرجة النهائية، ما شاء الله!') : t('Well done, masha’Allah! It stuck.', 'برافو، ما شاء الله! المعلومة ثبتت.')
              : t('Good try. Your teacher will look at it and may send you new questions on the same pages.', 'محاولة حلوة. معلمك هيبص عليها وممكن يبعتلك أسئلة جديدة على نفس الصفحات.')}
          </p>
        </div>
        <ol className="space-y-2.5">
          {set.questions.map((x, n) => {
            const r = result.results.find((y) => y.id === x.id);
            return (
              <li key={x.id} className={`rounded-2xl border p-3.5 ${r?.correct ? 'border-teal/40 bg-teal/5' : 'border-crimson/30 bg-crimson/5'}`}>
                <div className="flex items-start gap-2">
                  {r?.correct ? <Check className="w-5 h-5 text-teal shrink-0" /> : <X className="w-5 h-5 text-crimson shrink-0" />}
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{n + 1}. {pick(x.prompt)}</p>
                    {r && !r.correct && x.type === 'mcq' && typeof r.correctAnswer === 'number' && <p className="text-sm text-foreground">{t('Answer: ', 'الإجابة: ')}{pick(x.options[r.correctAnswer])}</p>}
                    {r && !r.correct && x.type === 'truefalse' && <p className="text-sm text-foreground">{t('Answer: ', 'الإجابة: ')}{r.correctAnswer ? t('True', 'صح') : t('False', 'غلط')}</p>}
                    {r && !r.correct && x.type === 'order' && Array.isArray(r.correctAnswer) && <p className="text-sm text-foreground">{t('Right order: ', 'الترتيب الصح: ')}{(r.correctAnswer as string[]).map((k) => pick(x.items.find((it) => it.key === k) || x.items[0])).join(' ← ')}</p>}
                    {r && <p className="text-sm text-muted-foreground">{pick(r.explain)}</p>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <button type="button" onClick={() => onDone({ passed: result.passed, newBadges: result.newBadges || [] })} className="w-full rounded-2xl bg-primary text-primary-foreground font-semibold py-3 min-h-[48px]">{t('Done', 'تمام')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Progress: kids see Zad walking along, teens a bold bar, adults a quiet counter. */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t(`Question ${i + 1} of ${set.questions.length}`, `سؤال ${i + 1} من ${set.questions.length}`)}</span>
          <span>{pick(KIND[set.kind])}</span>
        </div>
        <div className={`relative w-full rounded-full bg-surface-subtle ${teens ? 'h-3' : 'h-2'}`}>
          <motion.div className={`h-full rounded-full ${teens ? 'bg-gradient-to-r from-crimson to-[var(--gold)]' : 'bg-teal'}`} animate={{ width: `${((i + (q && answered(q) ? 1 : 0)) / set.questions.length) * 100}%` }} transition={{ type: 'spring', stiffness: 200, damping: 26 }} />
          {kids && <motion.img src={ZAD} alt="" aria-hidden="true" className="absolute -top-4 w-9 h-9 rounded-full" animate={{ insetInlineStart: `calc(${(i / set.questions.length) * 100}% - 8px)` }} transition={{ type: 'spring', stiffness: 180, damping: 18 }} />}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={reduce ? false : { opacity: 0, x: ar ? -24 : 24 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: ar ? 24 : -24 }} transition={{ duration: 0.22 }} className="space-y-4">
          <h3 className={`font-display font-bold text-foreground ${kids ? 'text-2xl' : 'text-xl'}`}>{pick(q.prompt)}</h3>
          {q.type === 'mcq' && (
            <div className="grid gap-2.5" role="radiogroup">
              {q.options.map((o, n) => {
                const on = answers[q.id] === n;
                return (
                  <button key={n} type="button" role="radio" aria-checked={on} onClick={() => setAnswers((a) => ({ ...a, [q.id]: n }))}
                    className={`text-start rounded-2xl border-2 px-4 ${kids ? 'py-4 text-lg' : 'py-3'} min-h-[52px] transition-colors ${on ? 'border-teal bg-teal/10 font-semibold' : `bg-surface ${kids ? TILE[n % TILE.length] : 'border-border hover:border-teal/60'}`}`}>
                    {pick(o)}
                  </button>
                );
              })}
            </div>
          )}
          {q.type === 'truefalse' && (
            <div className="grid grid-cols-2 gap-3" role="radiogroup">
              {[true, false].map((v) => {
                const on = answers[q.id] === v;
                return (
                  <button key={String(v)} type="button" role="radio" aria-checked={on} onClick={() => setAnswers((a) => ({ ...a, [q.id]: v }))}
                    className={`rounded-2xl border-2 ${kids ? 'py-6 text-xl' : 'py-4'} font-bold min-h-[56px] ${on ? (v ? 'border-teal bg-teal/10' : 'border-crimson bg-crimson/10') : 'border-border bg-surface'}`}>
                    {v ? t('True', 'صح') : t('False', 'غلط')}
                  </button>
                );
              })}
            </div>
          )}
          {q.type === 'order' && <OrderQuestion q={q} value={(answers[q.id] as string[]) || []} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} pick={pick} t={t} />}
        </motion.div>
      </AnimatePresence>

      {error && <p role="alert" className="text-sm text-crimson">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setI((n) => Math.max(0, n - 1))} disabled={i === 0} className="inline-flex items-center gap-1 rounded-xl border border-border px-4 py-2.5 min-h-[44px] disabled:opacity-40">
          {ar ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}{t('Back', 'رجوع')}
        </button>
        {i < set.questions.length - 1 ? (
          <button type="button" onClick={() => setI((n) => n + 1)} disabled={!answered(q)} className="inline-flex items-center gap-1 rounded-xl bg-primary text-primary-foreground font-semibold px-5 py-2.5 min-h-[44px] disabled:opacity-40">
            {t('Next', 'التالي')}{ar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={!allDone || busy} className="inline-flex items-center gap-2 rounded-xl bg-teal text-white font-semibold px-5 py-2.5 min-h-[44px] disabled:opacity-40">
            <ClipboardCheck className="w-4 h-4" />{busy ? t('Checking…', 'بنصحح…') : t('Hand it in', 'سلّم الواجب')}
          </button>
        )}
      </div>
    </div>
  );
}

export default function StudentHomeworkPage({ lang }: { lang: 'ar' | 'en' }) {
  const { t, pick } = useL(lang);
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<{ learners: Learner[]; sets: HwSet[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const openId = params.get('set');

  const load = () => authedJson<{ learners: Learner[]; sets: HwSet[] }>('/api/student/homework-sets').then(setData).catch((e) => setError(e?.message || 'error'));
  useEffect(() => { load(); }, []);

  const groups = useMemo(() => {
    const sets = data?.sets || [];
    return {
      todo: sets.filter((s) => s.status === 'new' || s.status === 'retry'),
      waiting: sets.filter((s) => s.status === 'submitted'),
      done: sets.filter((s) => s.status === 'passed' || s.status === 'done'),
    };
  }, [data]);
  const open = data?.sets.find((s) => s.id === openId && (s.status === 'new' || s.status === 'retry')) || null;
  const multi = (data?.learners.length || 0) > 1;
  const nameOf = (id: string) => data?.learners.find((l) => l.id === id)?.name || '';
  const close = () => { params.delete('set'); setParams(params, { replace: true }); };

  const Card = ({ s }: { s: HwSet }) => (
    <li>
      <button type="button" disabled={!(s.status === 'new' || s.status === 'retry')} onClick={() => { params.set('set', s.id); setParams(params); }}
        className="w-full text-start rounded-2xl border border-border glass-card p-4 flex items-center gap-3 min-h-[64px] enabled:hover:border-teal/60 transition-colors">
        <span className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${s.status === 'retry' ? 'bg-[var(--gold)]/20 text-[#8a5a12]' : s.status === 'submitted' ? 'bg-surface-subtle text-muted-foreground' : s.status === 'new' ? 'bg-crimson/10 text-crimson' : 'bg-teal/15 text-teal'}`}>
          {s.status === 'retry' ? <RotateCcw className="w-5 h-5" /> : s.status === 'submitted' ? <Clock className="w-5 h-5" /> : s.status === 'new' ? <Sparkles className="w-5 h-5" /> : <Check className="w-5 h-5" />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold text-foreground truncate">{pick(s.title)}</span>
          <span className="block text-sm text-muted-foreground">
            {pick(KIND[s.kind])}{multi ? ` · ${nameOf(s.studentId)}` : ''}
            {s.status === 'new' && ` · ${t(`${s.questions.length} questions`, `${s.questions.length} أسئلة`)}`}
            {s.status === 'retry' && ` · ${t('new questions from your teacher', 'أسئلة جديدة من معلمك')}`}
            {s.status === 'submitted' && ` · ${t('your teacher is looking at it', 'معلمك بيراجعه')}`}
            {(s.status === 'passed' || s.status === 'done') && s.total ? ` · ${s.score}/${s.total}` : ''}
          </span>
        </span>
      </button>
    </li>
  );

  return (
    <div className="space-y-6 pb-16">
      <header className="flex items-center gap-3">
        <img src={ZAD} alt="" aria-hidden="true" className="w-12 h-12 rounded-full" />
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{t('Homework', 'الواجبات')}</h1>
          <p className="text-sm text-muted-foreground">{t('A few questions on what you took, so it stays with you all week.', 'كام سؤال على اللي خدته، عشان يفضل معاك طول الأسبوع.')}</p>
        </div>
      </header>

      {data?.learners.some((l) => l.badges.length) && (
        <section aria-label={t('Badges', 'الأوسمة')} className="flex flex-wrap gap-2">
          {data.learners.flatMap((l) => l.badges.map((b) => (
            <span key={`${l.id}-${b.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-3 py-1 text-sm font-semibold text-foreground">
              <Award className="w-4 h-4 text-[#B5835A]" />{pick(b.title)}{multi ? ` · ${l.name}` : ''}
            </span>
          )))}
        </section>
      )}

      {error && <p role="alert" className="text-sm text-crimson">{error}</p>}
      {!data && !error && <p className="text-sm text-muted-foreground">{t('Loading…', 'بنحمّل…')}</p>}
      {data && data.sets.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center space-y-2">
          <img src={ZAD} alt="" aria-hidden="true" className="mx-auto w-16 h-16 rounded-full opacity-90" />
          <p className="text-foreground font-semibold">{t('No homework yet', 'لسه مفيش واجبات')}</p>
          <p className="text-sm text-muted-foreground">{t('After each lesson your homework shows up here.', 'بعد كل حصة واجبك هيظهر هنا.')}</p>
        </div>
      )}

      {([['todo', t('To do', 'جديد')], ['waiting', t('With your teacher', 'عند معلمك')], ['done', t('Done', 'خلص')]] as const).map(([k, label]) =>
        groups[k].length ? (
          <section key={k} className="space-y-2.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{label} · {groups[k].length}</h2>
            <ul className="space-y-2.5">{groups[k].map((s) => <Card key={s.id} s={s} />)}</ul>
          </section>
        ) : null)}

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={pick(open.title)}>
            <FocusTrap onEscape={close}>
            <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-foreground truncate">{pick(open.title)}</p>
                <button type="button" onClick={close} className="rounded-full border border-border p-2 min-w-[44px] min-h-[44px] grid place-items-center" aria-label={t('Close', 'إغلاق')}><X className="w-5 h-5" /></button>
              </div>
              <Player set={open} lang={lang} onDone={(r) => { close(); if (r.newBadges.length) setBadges(r.newBadges); load(); }} />
            </div>
            </FocusTrap>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{badges.length > 0 && <BadgeUnlock badges={badges} onClose={() => setBadges([])} pick={pick} t={t} />}</AnimatePresence>
    </div>
  );
}
