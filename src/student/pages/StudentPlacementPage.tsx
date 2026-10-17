import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Clock, CalendarPlus, ArrowLeft, ArrowRight, Check, FlaskConical } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { authedJson } from '../../lib/authedJson';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { BrandSpinner } from '../../components/ui/BrandLoader';
import { BOOKING_SERVICES } from '../../booking/mockData';
import { Select } from '../../components/ui/Select';
import { SUBJECT_FAMILIES } from '../../components/onboarding/subjects';
import { LEVELS } from '../../components/onboarding/JourneyPath';

/**
 * Placement test (owner decision 2026-10-16): for the subject and level chosen at onboarding,
 * opened after the free trial is booked, taken once per subject. Questions come from the site's
 * question banks in both languages and follow the language chosen on the site.
 */

type Status = 'not_yet' | 'take_now' | 'in_progress' | 'submitted' | 'reviewed';
interface LearnerState { id: string; name: string; level: string | null; serviceId: string; status: Status; testId?: string }
interface Test { id: string; questions: { q: { en: string; ar: string }; options: { en: string[]; ar: string[] } }[] }

export default function StudentPlacementPage({ lang }: { lang: 'ar' | 'en' }) {
  const isAr = lang === 'ar';
  const navigate = useNavigate();
  const [learners, setLearners] = useState<LearnerState[] | null>(null);
  const [learnerId, setLearnerId] = useState('');
  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Test mode (temporary, owner request 2026-10-17): try any subject and level before booking.
  const [testMode, setTestMode] = useState(false);
  const [trySubject, setTrySubject] = useState('');
  const [tryLevel, setTryLevel] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await authedJson<{ learners: LearnerState[]; testMode?: boolean }>('/api/placement/mine');
      setLearners(d.learners);
      setTestMode(!!d.testMode);
      setLearnerId((cur) => cur || d.learners.find((l) => l.status === 'take_now' || l.status === 'in_progress')?.id || d.learners[0]?.id || '');
    } catch (err: any) {
      setError(err.message);
      setLearners([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const d = await authedJson<{ test: Test }>('/api/placement/start', {
        method: 'POST',
        body: JSON.stringify({ learnerStudentId: learnerId || undefined, lang, ...(testMode ? { serviceId: trySubject || undefined, level: tryLevel || undefined } : {}) })
      });
      setTest(d.test);
      setAnswers(new Array(d.test.questions.length).fill(-1));
      window.scrollTo({ top: 0 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!test) return;
    if (answers.some((a) => a < 0)) {
      setError(isAr ? 'جاوب على كل الأسئلة — لو مش متأكد، اختار أقرب إجابة.' : 'Please answer every question — if unsure, pick your best guess.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const d = await authedJson<{ testId: string }>(`/api/placement/${test.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers })
      });
      navigate(`/student/placement/report/${d.testId}`);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (learners === null) {
    return <div className="py-16 flex justify-center"><BrandSpinner size={28} /></div>;
  }

  if (test) {
    return (
      <QuestionStepper
        isAr={isAr}
        questions={test.questions}
        answers={answers}
        setAnswer={(qi, oi) => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
        onSubmit={submit}
        busy={busy}
        error={error}
      />
    );
  }

  const learner = learners.find((l) => l.id === learnerId) || learners[0];
  const service = BOOKING_SERVICES.find((s) => s.id === learner?.serviceId);

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {learners.length > 1 && (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={isAr ? 'الطالب' : 'Learner'}>
          {learners.map((l) => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={l.id === learnerId}
              onClick={() => setLearnerId(l.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer text-start ${l.id === learnerId ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-subtle'}`}
            >
              <span className="block">{l.name}</span>
              <span className="block text-[11px] font-normal text-muted-foreground">
                {l.status === 'reviewed' || l.status === 'submitted' ? (isAr ? 'خلّص الاختبار' : 'Test done')
                  : l.status === 'not_yet' ? (isAr ? 'بعد أول حجز' : 'After first booking')
                  : (isAr ? 'جاهز للاختبار' : 'Ready for the test')}
              </span>
            </button>
          ))}
        </div>
      )}

      {testMode && learner && (
        <Card className="glass-card border-dashed border-accent/50">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-accent">
              <FlaskConical className="w-5 h-5" aria-hidden="true" />
              <h2 className="font-display font-bold text-foreground">{isAr ? 'وضع التجربة' : 'Test mode'}</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? 'مؤقتًا قبل الإطلاق: الاختبار مفتوح من غير حجز. اختار أي مادة وأي مستوى وجرّب، وتقدر تعيد كل مرة.'
                : 'Temporary, before launch: the test is open without a booking. Pick any subject and level and try it; you can retake it as often as you like.'}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                <span className="font-semibold text-foreground">{isAr ? 'المادة' : 'Subject'}</span>
                <Select value={trySubject || learner.serviceId} onChange={(e) => setTrySubject(e.target.value)}>
                  {SUBJECT_FAMILIES.map((f) => (
                    <optgroup key={f.key} label={isAr ? f.ar : f.en}>
                      {f.subjects.map((s) => <option key={s.id} value={s.id}>{isAr ? s.ar : s.en}</option>)}
                    </optgroup>
                  ))}
                </Select>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-semibold text-foreground">{isAr ? 'المستوى' : 'Level'}</span>
                <Select value={tryLevel || learner.level || 'beginner'} onChange={(e) => setTryLevel(e.target.value)}>
                  {LEVELS.map((l) => <option key={l.id} value={l.id}>{isAr ? l.ar : l.en}</option>)}
                </Select>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={start} isLoading={busy}>{isAr ? 'ابدأ اختبار تجريبي' : 'Start a trial test'}</Button>
              {learner.testId && (learner.status === 'submitted' || learner.status === 'reviewed') && (
                <Link to={`/student/placement/report/${learner.testId}`} className="text-sm font-semibold text-primary hover:underline">
                  {isAr ? 'آخر تقرير' : 'Latest report'}
                </Link>
              )}
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      {!testMode && (
      <Card className="glass-card">
        <CardContent className="p-6 sm:p-8 space-y-4 text-center">
          {!learner ? (
            <p className="text-sm text-muted-foreground">{isAr ? 'كمّل بيانات حسابك الأول.' : 'Finish your profile first.'}</p>
          ) : learner.status === 'submitted' || learner.status === 'reviewed' ? (
            <>
              <Clock className="w-10 h-10 text-accent mx-auto" />
              <h2 className="text-lg font-display font-bold text-foreground">{isAr ? 'خلّصت اختبار المادة دي' : 'You took the test for this subject'}</h2>
              <p className="text-sm text-muted-foreground">
                {learner.status === 'reviewed'
                  ? (isAr ? 'فريقنا راجع نتيجتك وكتبلك رأيه.' : 'Our team reviewed your result and wrote you a note.')
                  : (isAr ? 'فريقنا بيراجع نتيجتك وهيوصلك إشعار.' : 'Our team is reviewing your result; you will get a notification.')}
              </p>
              <Link to={`/student/placement/report/${learner.testId}`} className="inline-flex px-5 py-2.5 rounded-xl btn-primary-material text-primary-foreground text-sm font-semibold">
                {isAr ? 'عرض تقرير النتيجة' : 'View the result report'}
              </Link>
            </>
          ) : learner.status === 'not_yet' ? (
            <>
              <CalendarPlus className="w-10 h-10 text-primary mx-auto" />
              <h2 className="text-lg font-display font-bold text-foreground">{learners.length > 1 ? (isAr ? `اختبار ${learner.name} بيفتح بعد أول حجز له` : `${learner.name}'s test opens after their first booking`) : (isAr ? 'الاختبار بيفتح بعد حجز الحصة التجريبية' : 'The test opens after you book your free trial')}</h2>
              <p className="text-sm text-muted-foreground">
                {isAr ? 'احجز حصتك التجريبية المجانية، وبعدها خد الاختبار القصير عشان معلمك يجهّزلك الحصة.' : 'Book your free trial, then take the short test so your teacher can prepare your lesson.'}
              </p>
              <Link to="/student/book" className="inline-flex px-5 py-2.5 rounded-xl btn-primary-material text-primary-foreground text-sm font-semibold">
                {isAr ? 'احجز الحصة التجريبية' : 'Book the free trial'}
              </Link>
            </>
          ) : (
            <>
              <Sparkles className="w-10 h-10 text-primary mx-auto" />
              <h2 className="text-lg font-display font-bold text-foreground">{isAr ? 'اختبار تحديد المستوى' : 'Placement test'}</h2>
              <p className="text-sm text-foreground font-semibold">
                {learners.length > 1 ? `${learner.name} · ` : ''}{service ? (isAr ? service.arabicName : service.name) : learner.serviceId}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isAr
                  ? '8 أسئلة اختيار من متعدد (حوالي 5 دقايق) على حسب المادة والمستوى اللي اخترتهم. مفيش نجاح ورسوب — جاوب على قد ما تعرف، والنتيجة بتظهر لك على طول.'
                  : '8 multiple-choice questions (about 5 minutes) based on the subject and level you chose. There is no pass or fail — answer what you can, and you see your result right away.'}
              </p>
              <Button onClick={start} isLoading={busy} className="w-full sm:w-auto">
                {learner.status === 'in_progress' ? (isAr ? 'كمّل الاختبار' : 'Continue the test') : (isAr ? 'ابدأ الاختبار' : 'Start the test')}
              </Button>
            </>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
      )}
    </div>
  );
}

const LETTERS = { en: ['A', 'B', 'C', 'D'], ar: ['أ', 'ب', 'ج', 'د'] };
const hasArabic = (t: string) => /[؀-ۿ]/.test(t);

/** One question per screen: tap an answer and it moves on; Back/Next and the bars let you revisit. */
function QuestionStepper({ isAr, questions, answers, setAnswer, onSubmit, busy, error }: {
  isAr: boolean;
  questions: Test['questions'];
  answers: number[];
  setAnswer: (qi: number, oi: number) => void;
  onSubmit: () => void;
  busy: boolean;
  error: string | null;
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(() => Math.max(0, answers.findIndex((a) => a < 0)));
  const [dir, setDir] = useState(1);
  const total = questions.length;
  const q = questions[index];
  const options = isAr ? q.options.ar : q.options.en;
  const qText = isAr ? q.q.ar : q.q.en;
  const answered = answers.filter((a) => a >= 0).length;
  const isLast = index === total - 1;
  const BackIcon = isAr ? ArrowRight : ArrowLeft;
  const NextIcon = isAr ? ArrowLeft : ArrowRight;
  // Slide in the reading direction; RTL mirrors it.
  const offset = (isAr ? -1 : 1) * 40;

  const go = (to: number) => {
    if (to < 0 || to >= total) return;
    setDir(to > index ? 1 : -1);
    setIndex(to);
  };

  const choose = (oi: number) => {
    setAnswer(index, oi);
    if (!isLast) window.setTimeout(() => go(index + 1), reduce ? 0 : 320);
  };

  // Keys 1–4 pick an answer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= options.length) choose(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{isAr ? 'اختبار تحديد المستوى' : 'Placement test'}</span>
          <span aria-live="polite">{isAr ? `سؤال ${index + 1} من ${total}` : `Question ${index + 1} of ${total}`}</span>
        </div>
        <div className="flex gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answered} aria-label={isAr ? 'التقدم' : 'Progress'}>
          {questions.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={isAr ? `اذهب للسؤال ${i + 1}` : `Go to question ${i + 1}`}
              className={`h-2 flex-1 rounded-full transition-colors duration-200 cursor-pointer ${
                answers[i] >= 0 ? 'bg-[linear-gradient(90deg,#087D91,#0A9DB5)]' : 'bg-surface-subtle'
              } ${i === index ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background' : ''}`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.fieldset
          key={index}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * offset }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -dir * offset }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card rounded-3xl p-5 sm:p-7 space-y-5"
        >
          <legend className="sr-only">{isAr ? `سؤال ${index + 1}` : `Question ${index + 1}`}</legend>
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 text-primary font-display font-bold grid place-items-center">{index + 1}</span>
            <p dir="auto" className={`font-display font-bold text-foreground leading-relaxed ${hasArabic(qText) ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>{qText}</p>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup">
            {options.map((opt, oi) => {
              const selected = answers[index] === oi;
              return (
                <motion.button
                  key={oi}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(oi)}
                  whileTap={reduce ? undefined : { scale: 0.97 }}
                  className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-start cursor-pointer transition-colors duration-150 ${
                    selected ? 'border-primary bg-primary/10 shadow-sm' : 'border-border hover:border-primary/40 hover:bg-surface-subtle'
                  }`}
                >
                  <span className={`shrink-0 w-8 h-8 rounded-lg grid place-items-center text-sm font-bold transition-colors ${
                    selected ? 'bg-primary text-primary-foreground' : 'bg-surface-subtle text-muted-foreground group-hover:text-foreground'
                  }`}>
                    {selected ? <Check className="w-4 h-4" aria-hidden="true" /> : (isAr ? LETTERS.ar : LETTERS.en)[oi]}
                  </span>
                  <span dir="auto" className={`text-foreground ${hasArabic(opt) ? 'text-lg leading-loose' : 'text-sm sm:text-base'}`}>{opt}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.fieldset>
      </AnimatePresence>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => go(index - 1)} disabled={index === 0} className="gap-1.5">
          <BackIcon className="w-4 h-4" aria-hidden="true" />{isAr ? 'السابق' : 'Back'}
        </Button>
        {isLast || answered === total ? (
          <Button onClick={onSubmit} isLoading={busy} disabled={answered < total}>
            {answered < total
              ? (isAr ? `فاضل ${total - answered} سؤال` : `${total - answered} left to answer`)
              : (isAr ? 'إرسال وعرض النتيجة' : 'Send and see my result')}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => go(index + 1)} className="gap-1.5">
            {isAr ? 'التالي' : 'Next'}<NextIcon className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {isAr ? 'مش متأكد؟ اختار أقرب إجابة. مفيش نجاح ورسوب.' : 'Not sure? Pick your best guess. There is no pass or fail.'}
      </p>
    </div>
  );
}
