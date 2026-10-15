import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Clock, CalendarPlus } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { BrandSpinner } from '../../components/ui/BrandLoader';
import { BOOKING_SERVICES } from '../../booking/mockData';

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

  const load = useCallback(async () => {
    try {
      const d = await authedJson<{ learners: LearnerState[] }>('/api/placement/mine');
      setLearners(d.learners);
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
        body: JSON.stringify({ learnerStudentId: learnerId || undefined, lang })
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
    const answered = answers.filter((a) => a >= 0).length;
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-background/90 backdrop-blur">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-1.5">
            <span>{isAr ? 'اختبار تحديد المستوى' : 'Placement test'}</span>
            <span>{isAr ? `${answered} من ${test.questions.length}` : `${answered} of ${test.questions.length}`}</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-subtle overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={test.questions.length} aria-valuenow={answered}>
            <div className="h-full bg-[linear-gradient(90deg,#087D91,#C51F24)] transition-all" style={{ width: `${(answered / test.questions.length) * 100}%` }} />
          </div>
        </div>
        {test.questions.map((q, qi) => (
          <fieldset key={qi} className="glass-card rounded-2xl p-5 space-y-3">
            <legend className="sr-only">{isAr ? `سؤال ${qi + 1}` : `Question ${qi + 1}`}</legend>
            <p className="font-semibold text-foreground leading-relaxed"><span className="text-primary">{qi + 1}.</span> {isAr ? q.q.ar : q.q.en}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(isAr ? q.options.ar : q.options.en).map((opt, oi) => (
                <label
                  key={oi}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border cursor-pointer text-sm transition-colors ${
                    answers[qi] === oi ? 'border-primary bg-primary/10 text-foreground' : 'border-border hover:bg-surface-subtle text-foreground'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${qi}`}
                    checked={answers[qi] === oi}
                    onChange={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
                    className="accent-[var(--primary)]"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button onClick={submit} isLoading={busy} className="w-full">
          {isAr ? 'إرسال الإجابات وعرض النتيجة' : 'Send my answers and see the result'}
        </Button>
      </div>
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
              className={`px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer ${l.id === learnerId ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-subtle'}`}
            >
              {l.name}
            </button>
          ))}
        </div>
      )}

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
              <h2 className="text-lg font-display font-bold text-foreground">{isAr ? 'الاختبار بيفتح بعد حجز الحصة التجريبية' : 'The test opens after you book your free trial'}</h2>
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
                {service ? (isAr ? service.arabicName : service.name) : learner.serviceId}
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
    </div>
  );
}
