import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from '../../components/ui/Card';
import { BrandSpinner } from '../../components/ui/BrandLoader';
import { useNavigate } from 'react-router-dom';
import { RequestCard } from '../components/RequestCard';
import { adminChatLink } from '../../lib/authedJson';

/**
 * Super admin: placement tests sent by new learners. The admin reads the answers, writes a reply and
 * (optionally) sets the learner's level; the learner is notified and can book.
 */

interface AdminTest {
  id: string;
  authUserId: string;
  learnerName: string | null;
  serviceId: string;
  statedLevel: string | null;
  status: string;
  score: number | null;
  maxScore: number | null;
  suggestedLevel: string | null;
  aiSummary: string | null;
  adminReply: string | null;
  submittedAt: string | null;
  questions: { q: { en: string; ar: string }; options: { en: string[]; ar: string[] }; answer: number; level: string }[];
  answers: number[] | null;
}

const LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced'];

export default function PlacementTestsPage() {
  const { t, isAr } = useT();
  const [status, setStatus] = useState<'submitted' | 'reviewed'>('submitted');
  const [tests, setTests] = useState<AdminTest[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [level, setLevel] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const openChat = async (userId: string) => {
    try {
      navigate(await adminChatLink(userId));
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  const load = useCallback(async () => {
    setTests(null);
    try {
      const d = await dashboardFetch<{ tests: AdminTest[] }>(`/api/dashboard/placement-tests?status=${status}`);
      setTests(d.tests || []);
    } catch {
      setTests([]);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (test: AdminTest) => {
    setBusy(true);
    setMessage(null);
    try {
      await dashboardFetch(`/api/dashboard/placement-tests/${test.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply, level: level || undefined })
      });
      setMessage(t('Sent. The student was notified and can book now.', 'اتبعت. الطالب وصله إشعار ويقدر يحجز دلوقتي.'));
      setOpenId(null);
      setReply('');
      setLevel('');
      load();
    } catch (err: any) {
      setMessage(err.message || t('Could not save the review.', 'تعذر حفظ المراجعة.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t('Placement tests', 'اختبارات تحديد المستوى')}</h1>
          <p className="text-sm text-muted-foreground">{t('New learners book after you reply.', 'الطلاب الجدد بيحجزوا بعد ردك.')}</p>
        </div>
        <div className="flex gap-2" role="tablist">
          {(['submitted', 'reviewed'] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={status === s}
              onClick={() => setStatus(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer ${status === s ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-subtle'}`}
            >
              {s === 'submitted' ? t('Waiting', 'مستني ردك') : t('Replied', 'تم الرد')}
            </button>
          ))}
        </div>
      </div>

      {message && <p role="status" className="text-sm p-3 rounded-xl bg-success/10 border border-success/30">{message}</p>}

      {tests === null ? (
        <div className="py-12 flex justify-center"><BrandSpinner size={28} /></div>
      ) : tests.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('Nothing here right now.', 'مفيش حاجة هنا دلوقتي.')}</p>
      ) : (
        tests.map((test) => (
          <RequestCard
            key={test.id}
            title={`${t('Placement test', 'اختبار تحديد مستوى')} · ${test.learnerName || t('Learner', 'طالب')}`}
            subtitle={test.submittedAt ? new Date(test.submittedAt).toLocaleString(isAr ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : undefined}
            badge={`${test.score}/${test.maxScore}`}
            rows={[
              [t('Subject', 'المادة'), test.serviceId],
              [t('Level they chose', 'المستوى اللي اختاره'), test.statedLevel || '—'],
              [t('Level the result suggests', 'المستوى حسب النتيجة'), test.suggestedLevel || '—'],
              [t('Summary', 'الملخص'), test.aiSummary || '—']
            ]}
            actions={
              <>
                <Button size="sm" onClick={() => openChat(test.authUserId)}>{t('Continue in chat', 'كمّل معاه في الشات')}</Button>
                <Button variant="outline" size="sm" onClick={() => setOpenId(openId === test.id ? null : test.id)}>
                  {openId === test.id ? t('Hide answers', 'اخفي الإجابات') : status === 'submitted' ? t('Answers & reply', 'الإجابات والرد') : t('Answers', 'الإجابات')}
                </Button>
              </>
            }
          >
              {openId === test.id && (
                <div className="space-y-4">
                  <ol className="space-y-2 text-sm">
                    {test.questions.map((q, i) => {
                      const chosen = test.answers?.[i];
                      const right = chosen === q.answer;
                      return (
                        <li key={i} className="p-3 rounded-xl glass-surface">
                          <div className="font-medium text-foreground">{i + 1}. {isAr ? q.q.ar : q.q.en} <span className="text-xs text-muted-foreground">({q.level})</span></div>
                          <div className="mt-1 flex items-center gap-1.5">
                            {right ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-destructive" />}
                            <span>{t('Answer', 'الإجابة')}: {chosen != null && chosen >= 0 ? (isAr ? q.options.ar : q.options.en)[chosen] : '-'}</span>
                            {!right && <span className="text-muted-foreground">· {t('correct', 'الصحيحة')}: {(isAr ? q.options.ar : q.options.en)[q.answer]}</span>}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  {status === 'submitted' ? (
                    <div className="space-y-3">
                      <Textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        rows={4}
                        maxLength={2000}
                        aria-label={t('Reply to the student', 'ردك على الطالب')}
                        placeholder={t('Your reply to the student: level, what to start with, lesson length…', 'ردك على الطالب: المستوى، هنبدأ بإيه، مدة الحصة…')}
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <Select value={level} onChange={(e) => setLevel(e.target.value)} aria-label={t('Set level', 'حدد المستوى')} className="max-w-[220px]">
                          <option value="">{t('Keep current level', 'سيب المستوى زي ما هو')}</option>
                          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                        </Select>
                        <Button onClick={() => review(test)} isLoading={busy} disabled={!reply.trim()}>
                          {t('Send reply', 'ابعت الرد')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap p-3 rounded-xl glass-surface">{test.adminReply}</p>
                  )}
                </div>
              )}
          </RequestCard>
        ))
      )}
    </div>
  );
}
