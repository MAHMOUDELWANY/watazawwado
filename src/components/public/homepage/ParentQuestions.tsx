import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { Link } from '../LangLink';
import { findSubjectPage, SUBJECT_PAGES_PATH } from '../../../data/subjectPages';
import { Bezel } from './journey/Premium';

/**
 * Self-persuasion instead of claims (docs/design/LANDING-LESSONS-2026-11-18.md): three short questions the parent
 * answers about their own child, then their answers are read back with one matching page and the small first step.
 * The parent names the problem; we never push. Gentle wording only: no fear, no guilt.
 */

type L = { en: string; ar: string };
type Opt = { id: string; label: L };

const GOALS: (Opt & { slug: string; says: L })[] = [
  { id: 'read', slug: 'online-quran-classes-for-kids', label: { en: 'Read the Quran correctly', ar: 'يقرأ القرآن صحيحًا' }, says: { en: 'read the Quran correctly', ar: 'يقرأ القرآن صحيحًا' } },
  { id: 'hifz', slug: 'online-quran-memorization', label: { en: 'Memorise, and keep it', ar: 'يحفظ ويثبت حفظه' }, says: { en: 'memorise and keep it', ar: 'يحفظ ويثبت حفظه' } },
  { id: 'deen', slug: 'islamic-classes-for-kids', label: { en: 'Know and love his deen', ar: 'يعرف دينه ويحبه' }, says: { en: 'know and love the deen', ar: 'يعرف دينه ويحبه' } },
  { id: 'arabic', slug: 'learn-arabic-online', label: { en: 'Understand Arabic', ar: 'يفهم العربية' }, says: { en: 'understand Arabic', ar: 'يفهم العربية' } },
];
const SINCE: (Opt & { says: L })[] = [
  { id: 'new', label: { en: 'We are just starting', ar: 'لسه بنبدأ' }, says: { en: 'You are just starting', ar: 'وأنتم في البداية' } },
  { id: 'months', label: { en: 'A few months', ar: 'من كام شهر' }, says: { en: 'It has been a few months', ar: 'وبقالكم كام شهر' } },
  { id: 'years', label: { en: 'A year or more', ar: 'سنة أو أكتر' }, says: { en: 'It has been a year or more', ar: 'وبقالكم سنة أو أكتر' } },
];
const NEED: (Opt & { says: L })[] = [
  { id: 'patient', label: { en: 'Patience with children', ar: 'الصبر على الأطفال' }, says: { en: 'a patient teacher who stays with your child', ar: 'معلّم صبور يبقى مع طفلك' } },
  { id: 'female', label: { en: 'A female teacher', ar: 'معلّمة' }, says: { en: 'a female teacher who stays with your child', ar: 'معلّمة تبقى مع طفلك' } },
  { id: 'follow', label: { en: 'Knowing how it is going', ar: 'أعرف أخباره أول بأول' }, says: { en: 'a note after every lesson, before you ask', ar: 'تقرير بعد كل حصة، قبل أن تسأل' } },
  { id: 'times', label: { en: 'Times that fit our week', ar: 'مواعيد تناسبنا' }, says: { en: 'times you choose, with the same teacher', ar: 'مواعيد تختارها أنت، مع نفس المعلّم' } },
];

const QUESTIONS: { q: L; opts: Opt[] }[] = [
  { q: { en: 'What do you hope changes for your child?', ar: 'إيه اللي نفسك يتغيّر عند طفلك؟' }, opts: GOALS },
  { q: { en: 'How long has it been like this?', ar: 'بقالكم قد إيه على كده؟' }, opts: SINCE },
  { q: { en: 'What matters most to you in a teacher?', ar: 'إيه أهم حاجة عندك في المعلّم؟' }, opts: NEED },
];

export function ParentQuestions({ isEn, onTrial }: { isEn: boolean; onTrial: () => void }) {
  const reduce = useReducedMotion();
  const [answers, setAnswers] = React.useState<string[]>([]);
  const t = (l: L) => (isEn ? l.en : l.ar);
  const Arrow = isEn ? ArrowRight : ArrowLeft;
  const step = answers.length;
  const done = step === QUESTIONS.length;

  const goal = GOALS.find((g) => g.id === answers[0]);
  const since = SINCE.find((s) => s.id === answers[1]);
  const need = NEED.find((n) => n.id === answers[2]);
  const page = goal ? findSubjectPage(goal.slug) : null;
  const motionProps = reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const } };

  return (
    <section className="border-y border-border/70 bg-surface-warm/60" aria-labelledby="parent-questions">
      <div className="public-container py-16 lg:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="inline-flex items-center gap-3 text-xs sm:text-sm font-bold tracking-wide text-[#B4552F] dark:text-[#E5A93C]">
            <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />{isEn ? 'Three quick questions' : 'تلات أسئلة سريعة'}<span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />
          </p>
          <h2 id="parent-questions" className="mt-3 font-editorial font-bold text-[2rem] leading-[1.2] sm:text-5xl text-foreground scroll-mt-28">
            {isEn ? <>Tell us about <span className="text-ribbon">your child</span></> : <>احكِ لنا عن <span className="text-ribbon">طفلك</span></>}
          </h2>
          <p className="mt-4 text-muted-foreground text-base sm:text-lg">{isEn ? 'Three taps. You answer, we listen.' : 'تلات ضغطات. انت تجاوب، واحنا نسمع.'}</p>
        </div>

        <Bezel radius="2.25rem" className="mt-10 max-w-3xl mx-auto" core="p-5 sm:p-9">
          {/* Progress: three segments. */}
          <div className="flex gap-2" aria-hidden="true">
            {QUESTIONS.map((_, k) => <span key={k} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${k < step ? 'bg-[#E5A93C]' : 'bg-border'}`} />)}
          </div>

          <div aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {!done ? (
                <motion.div key={step} {...motionProps} className="mt-6">
                  <p className="text-sm text-muted-foreground">{isEn ? `Question ${step + 1} of 3` : `سؤال ${['١', '٢', '٣'][step]} من ٣`}</p>
                  <h3 className="mt-1 font-editorial font-bold text-2xl sm:text-3xl text-foreground">{t(QUESTIONS[step].q)}</h3>
                  <div role="group" aria-label={t(QUESTIONS[step].q)} className="mt-5 grid gap-3 sm:grid-cols-2">
                    {QUESTIONS[step].opts.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setAnswers((a) => [...a, o.id])}
                        className="group flex items-center justify-between gap-3 rounded-2xl ring-1 ring-border bg-background px-5 py-4 min-h-14 text-start font-bold text-foreground transition-[box-shadow,transform,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-[#E5A93C] hover:bg-[#E5A93C]/[0.06] hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
                      >
                        {t(o.label)}
                        <Arrow className="w-4 h-4 shrink-0 text-[#B4552F]" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                  {step > 0 && (
                    <button type="button" onClick={() => setAnswers((a) => a.slice(0, -1))} className="mt-4 min-h-11 text-sm font-semibold text-muted-foreground underline underline-offset-4">
                      {isEn ? 'Back' : 'رجوع'}
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div key="result" {...motionProps} className="mt-6 text-center">
                  {/* Their own words, read back. */}
                  <p className="font-editorial text-2xl sm:text-3xl leading-snug text-foreground">
                    {isEn
                      ? <>You want your child to <span className="text-ribbon font-bold">{goal && t(goal.says)}</span>. {since && t(since.says)}.</>
                      : <>نفسك طفلك <span className="text-ribbon font-bold">{goal && t(goal.says)}</span>، {since && t(since.says)}.</>}
                  </p>
                  <p className="mt-3 text-lg text-muted-foreground">
                    {isEn ? 'What fits: ' : 'اللي يناسبكم: '}<b className="text-foreground">{need && t(need.says)}</b>.
                  </p>
                  <p className="mt-6 text-base text-foreground">
                    {isEn ? 'The first step is small: a free 30-minute lesson, no card. The teacher hears your child and tells you where to start.' : 'وأول خطوة صغيرة: حصة مجانية ٣٠ دقيقة، من غير بطاقة. المعلّم يسمع طفلك ويقولك تبدأوا منين.'}
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <button type="button" onClick={onTrial} className="liquid-cta inline-flex items-center justify-center gap-2 rounded-xl bg-[#C51F24] px-6 py-3 min-h-12 font-bold text-[#FAF7F2] shadow-lg shadow-[#C51F24]/25 hover:bg-[#A8191E] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E5A93C]/60">
                      {isEn ? 'Book the free lesson' : 'احجز الحصة المجانية'}
                    </button>
                    {page && (
                      <Link to={`${SUBJECT_PAGES_PATH}/${page.slug}`} className="btn-glass inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl">
                        {isEn ? page.h1En : page.h1Ar}<Arrow className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                  <button type="button" onClick={() => setAnswers([])} className="mt-4 inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-muted-foreground">
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />{isEn ? 'Answer again' : 'جاوب من الأول'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Bezel>

        {/* Not a parent of a young child? One small door each, lower in weight (one avatar first). */}
        <div className="mt-8 max-w-3xl mx-auto text-center text-sm text-muted-foreground">
          <p>
            {isEn ? 'Learning for yourself? ' : 'بتتعلّم لنفسك؟ '}
            {/* MK-04: one line for young adults who drifted away. */}
            <span className="font-semibold text-foreground">{isEn ? 'Drifted? Start where you are. No lectures.' : 'بعدت شوية؟ ابدأ من مكانك. من غير محاضرات.'}</span>
          </p>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {['online-quran-classes-for-adults', 'online-tajweed-classes', 'learn-arabic-online', 'learn-egyptian-arabic-online', 'online-english-classes'].map(findSubjectPage).filter((p) => p !== null).map((p) => (
              <li key={p.slug}>
                <Link to={`${SUBJECT_PAGES_PATH}/${p.slug}`} className="inline-flex items-center min-h-11 rounded-full border border-border bg-background px-4 font-semibold text-foreground hover:border-[#087D91]/60 transition-colors">
                  {isEn ? p.h1En : p.h1Ar}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
