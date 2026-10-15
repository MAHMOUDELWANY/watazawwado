import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Sparkles, Clock } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { BrandSpinner } from '../../components/ui/BrandLoader';

/**
 * AI placement test (owner decision 2026-10-16). Questions come from the server, different for every
 * learner, based on the subject and level chosen at onboarding; answers are graded on the server.
 * The admin team reviews the result and replies, then the learner can book.
 */

interface Test {
  id: string;
  learnerStudentId: string;
  learnerName: string | null;
  serviceId: string;
  status: 'in_progress' | 'submitted' | 'reviewed';
  questions?: { q: string; options: string[] }[];
  score: number | null;
  maxScore: number | null;
  adminReply: string | null;
  createdAt: string;
}

export default function StudentPlacementPage({ lang }: { lang: 'ar' | 'en' }) {
  const isAr = lang === 'ar';
  const [data, setData] = useState<{ tests: Test[]; learners: { id: string; name: string }[]; gates: Record<string, string | null> } | null>(null);
  const [learnerId, setLearnerId] = useState<string>('');
  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await authedJson<any>('/api/placement/mine');
      setData(d);
      setLearnerId((cur) => cur || d.learners?.find((l: any) => d.gates?.[l.id])?.id || d.learners?.[0]?.id || '');
    } catch (err: any) {
      setError(err.message);
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
      setAnswers(new Array(d.test.questions?.length || 0).fill(-1));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!test) return;
    if (answers.some((a) => a < 0)) {
      setError(isAr ? 'جاوب على كل الأسئلة — لو مش عارف، اختار أقرب إجابة.' : 'Please answer every question — if unsure, pick your best guess.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const d = await authedJson<{ score: number; maxScore: number }>(`/api/placement/${test.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers })
      });
      setResult(d);
      setTest(null);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!data && !error) {
    return <div className="py-16 flex justify-center"><BrandSpinner size={28} /></div>;
  }

  if (result) {
    return (
      <Card className="max-w-xl mx-auto glass-card">
        <CardContent className="p-8 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
          <h2 className="text-xl font-display font-bold text-foreground">{isAr ? 'تمام، الاختبار وصلنا' : 'Done — we got your test'}</h2>
          <p className="text-sm text-muted-foreground">
            {isAr ? `نتيجتك: ${result.score} من ${result.maxScore}. فريقنا هيراجعها ويبعتلك رأيه في الرسائل، ومعلمك هيستخدمها في تجهيز حصتك.` : `Your score: ${result.score} of ${result.maxScore}. Our team will review it and reply in Messages, and your teacher will use it to prepare your lesson.`}
          </p>
          <Link to="/student/messages" className="inline-flex px-5 py-2.5 rounded-xl btn-primary-material text-primary-foreground text-sm font-semibold">
            {isAr ? 'الرسائل' : 'Messages'}
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (test?.questions) {
    const answered = answers.filter((a) => a >= 0).length;
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <p className="text-sm text-muted-foreground">
          {isAr ? `جاوبت ${answered} من ${test.questions.length}` : `${answered} of ${test.questions.length} answered`}
        </p>
        {test.questions.map((q, qi) => (
          <fieldset key={qi} className="glass-card rounded-2xl p-5 space-y-3">
            <legend className="sr-only">{isAr ? `سؤال ${qi + 1}` : `Question ${qi + 1}`}</legend>
            <p className="font-semibold text-foreground"><span className="text-primary">{qi + 1}.</span> {q.q}</p>
            <div className="grid gap-2">
              {q.options.map((opt, oi) => (
                <label
                  key={oi}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border cursor-pointer text-sm transition-colors ${
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
          {isAr ? 'إرسال الإجابات' : 'Send my answers'}
        </Button>
      </div>
    );
  }

  const tests = data?.tests || [];
  const learners = data?.learners || [];
  const gate = learnerId ? data?.gates?.[learnerId] : null;
  const latest = tests.find((t) => t.learnerStudentId === learnerId);

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
          {latest?.status === 'reviewed' ? (
            <>
              <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
              <h2 className="text-lg font-display font-bold text-foreground">{isAr ? 'رد فريقنا على اختبارك' : 'Our team replied to your test'}</h2>
              <p className="text-sm text-foreground whitespace-pre-wrap text-start glass-surface rounded-xl p-4">{latest.adminReply}</p>
              <Link to="/student/messages" className="inline-flex px-5 py-2.5 rounded-xl btn-primary-material text-primary-foreground text-sm font-semibold">
                {isAr ? 'كمّل في الرسائل' : 'Continue in Messages'}
              </Link>
            </>
          ) : latest?.status === 'submitted' || gate === 'PLACEMENT_PENDING_REVIEW' ? (
            <>
              <Clock className="w-10 h-10 text-accent mx-auto" />
              <h2 className="text-lg font-display font-bold text-foreground">{isAr ? 'اختبارك بيتراجع' : 'Your test is being reviewed'}</h2>
              <p className="text-sm text-muted-foreground">
                {isAr ? 'هيوصلك إشعار أول ما فريقنا يرد. تقدر تسألنا أي حاجة في الرسائل.' : 'You will get a notification as soon as our team replies. Ask us anything in Messages.'}
              </p>
            </>
          ) : (
            <>
              <Sparkles className="w-10 h-10 text-primary mx-auto" />
              <h2 className="text-lg font-display font-bold text-foreground">{isAr ? 'اختبار تحديد المستوى' : 'Placement test'}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isAr
                  ? 'حوالي 8 أسئلة اختيار من متعدد، على حسب المادة والمستوى اللي اخترتهم. مفيش نجاح ورسوب — جاوب على قد ما تعرف، وده بيساعد المعلم يجهزلك الحصة المناسبة.'
                  : 'About 8 multiple-choice questions based on your subject and level. There is no pass or fail — answer what you can; it helps your teacher prepare the right lesson.'}
              </p>
              {gate === null && !latest && (
                <p className="text-xs text-muted-foreground">{isAr ? 'الاختبار ده اختياري ليك لأن عندك حصص قبل كده.' : 'This is optional for you because you already have lessons.'}</p>
              )}
              <Button onClick={start} isLoading={busy} className="w-full sm:w-auto">
                {isAr ? 'ابدأ الاختبار' : 'Start the test'}
              </Button>
            </>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
