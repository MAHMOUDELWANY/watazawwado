import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HeartHandshake, HandHeart, Check } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { BrandLoader } from '../../components/ui/BrandLoader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { notify } from '../../components/ui/Feedback';

/**
 * NX-07 "Sponsor a learner" (owner decisions 2026-11-02): one general sadaqah fund. Give by a number of lessons or any
 * amount; or ask for lessons for a learner. The academy chooses who receives, and nobody's name is shown.
 */
interface SponsorData {
  fund: { balanceUsd: number; lessonsApprox: number; grants: number };
  lessonUnitUsd: number; lessonChoices: number[]; minAmountUsd: number; maxAmountUsd: number;
  myDonations: Array<{ amountUsd: number; lessons: number | null; createdAt: string }>;
  requests: Array<{ id: string; learnerId: string; learnerName: string | null; lessons: number; status: 'pending' | 'approved' | 'declined'; note: string | null; createdAt: string }>;
  learners: Array<{ id: string; name: string }>;
}

const money = (n: number) => `$${Number(n || 0).toFixed(2).replace(/\.00$/, '')}`;

export default function StudentSponsorPage({ lang }: { lang: 'ar' | 'en' }) {
  const isAr = lang === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<SponsorData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState(false);
  const [lessons, setLessons] = useState<number | null>(8);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [reqLearner, setReqLearner] = useState('');
  const [reqLessons, setReqLessons] = useState(8);
  const [reason, setReason] = useState('');

  const load = () => authedJson<SponsorData>('/api/student/sponsorship').then((d) => {
    setData(d);
    setReqLearner((cur) => cur || d.learners[0]?.id || '');
  }).catch((e) => setError(e.message));

  useEffect(() => {
    // Back from Stripe: confirm the sadaqah (the webhook also does it), then thank.
    const sessionId = params.get('session_id');
    const done = () => { setParams({}, { replace: true }); load(); };
    if (sessionId) {
      authedJson('/api/payments/stripe/verify', { method: 'POST', body: JSON.stringify({ sessionId }) })
        .then(() => setThanks(true)).catch(() => notify(t('We are still confirming your payment. It shows here within minutes.', 'لسه بنأكد الدفع، وهيظهر هنا خلال دقايق.'))).finally(done);
    } else {
      if (params.get('cancelled')) setParams({}, { replace: true });
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const give = async () => {
    setBusy('give');
    try {
      const body = lessons ? { lessons } : { amount: Number(amount) };
      const { sessionUrl } = await authedJson<{ sessionUrl: string }>('/api/student/sponsorship/donate', { method: 'POST', body: JSON.stringify(body) });
      window.location.href = sessionUrl;
    } catch (e: any) { notify(e.message, 'error'); setBusy(null); }
  };

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('ask');
    try {
      await authedJson('/api/student/sponsorship/request', { method: 'POST', body: JSON.stringify({ learnerId: reqLearner, lessons: reqLessons, reason }) });
      setReason('');
      notify(t('Your request reached us. We will reply here and on your notifications.', 'طلبك وصلنا، وهنرد عليك هنا وفي الإشعارات.'));
      load();
    } catch (e: any) { notify(e.message, 'error'); }
    finally { setBusy(null); }
  };

  if (error) return <p className="p-6 text-sm text-destructive">{error}</p>;
  if (!data) return <div className="py-24 flex justify-center"><BrandLoader /></div>;

  const given = data.myDonations.reduce((s, d) => s + d.amountUsd, 0);
  const amountOk = Number(amount) >= data.minAmountUsd && Number(amount) <= data.maxAmountUsd;
  const statusBadge = (s: string) => s === 'approved'
    ? <Badge variant="success">{t('Lessons added', 'الحصص اتضافت')}</Badge>
    : s === 'declined' ? <Badge variant="outline">{t('Not this time', 'مش المرة دي')}</Badge>
    : <Badge variant="warning">{t('With our team', 'عند فريقنا')}</Badge>;

  return (
    <div className="space-y-6 pb-12 max-w-3xl" data-testid="sponsor-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          <HeartHandshake className="w-7 h-7 text-accent" aria-hidden="true" />{t('Sponsor a learner', 'اكفل طالب')}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          {t('A sadaqah fund for learners who cannot pay. You give to the fund; our team chooses who receives, after a request. Nobody sees who gave or who received.',
            'صندوق صدقة للطلاب اللي مش قادرين يدفعوا. انت بتتصدّق للصندوق، وفريقنا بيختار مين ياخد بعد ما يطلب. ومحدش بيعرف مين اتصدّق ولا مين أخد.')}
        </p>
      </div>

      {thanks && (
        <Card className="p-4 flex items-start gap-3 border-teal/40" role="status">
          <Check className="w-5 h-5 text-teal shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm">{t('Your sadaqah reached the fund. May Allah accept it from you.', 'صدقتك وصلت الصندوق. تقبّل الله منك.')}</p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 grid gap-1">
          <span className="text-xs text-muted-foreground">{t('In the fund now', 'في الصندوق دلوقتي')}</span>
          <span className="text-2xl font-bold tabular-nums">{money(data.fund.balanceUsd)}</span>
          <span className="text-xs text-muted-foreground">{t(`About ${data.fund.lessonsApprox} lessons`, `حوالي ${data.fund.lessonsApprox} حصة`)}</span>
        </Card>
        <Card className="p-4 grid gap-1">
          <span className="text-xs text-muted-foreground">{t('Learners helped', 'طلاب اتساعدوا')}</span>
          <span className="text-2xl font-bold tabular-nums">{data.fund.grants}</span>
          {given > 0 && <span className="text-xs text-muted-foreground">{t(`Your sadaqah: ${money(given)}`, `صدقتك: ${money(given)}`)}</span>}
        </Card>
      </div>

      <Card className="p-5 grid gap-4" aria-labelledby="give-title">
        <h2 id="give-title" className="text-lg font-semibold">{t('Give sadaqah', 'اتصدّق')}</h2>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('Number of lessons', 'عدد الحصص')}>
          {data.lessonChoices.map((n) => (
            <button
              key={n} type="button" role="radio" aria-checked={lessons === n} onClick={() => setLessons(n)}
              className={`rounded-xl border p-3 grid gap-0.5 text-center min-h-11 focus-ring transition-colors ${lessons === n ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-subtle'}`}
            >
              <span className="font-semibold">{t(`${n} lessons`, `${n} حصص`)}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{money(n * data.lessonUnitUsd)}</span>
            </button>
          ))}
        </div>
        <label className="grid gap-1.5 text-sm">
          <span>{t('Or any amount (USD)', 'أو أي مبلغ (بالدولار)')}</span>
          <Input
            type="number" inputMode="decimal" min={data.minAmountUsd} max={data.maxAmountUsd} step="1" dir="ltr" value={amount}
            placeholder={`${data.minAmountUsd}–${data.maxAmountUsd}`}
            onChange={(e) => { setAmount(e.target.value); setLessons(e.target.value ? null : 8); }}
          />
        </label>
        <p className="text-xs text-muted-foreground">{t(`One lesson is a 30-minute lesson at ${money(data.lessonUnitUsd)}. This is sadaqah, not zakat.`, `الحصة الواحدة حصة ٣٠ دقيقة بـ ${money(data.lessonUnitUsd)}. ده صدقة، مش زكاة.`)}</p>
        <Button onClick={give} isLoading={busy === 'give'} disabled={!lessons && !amountOk} className="w-full sm:w-fit">
          <HandHeart className="w-4 h-4 me-2" aria-hidden="true" />
          {lessons ? t(`Give ${money(lessons * data.lessonUnitUsd)}`, `اتصدّق بـ ${money(lessons * data.lessonUnitUsd)}`) : t('Give', 'اتصدّق')}
        </Button>
      </Card>

      {data.learners.length > 0 && (
        <Card className="p-5 grid gap-4" aria-labelledby="ask-title">
          <div>
            <h2 id="ask-title" className="text-lg font-semibold">{t('Need lessons from the fund?', 'محتاج حصص من الصندوق؟')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('Tell us in a line or two. Only our team reads it, and nobody else ever knows.', 'قولّنا في سطر أو اتنين. فريقنا بس اللي بيقراه، ومحدش تاني هيعرف.')}</p>
          </div>
          <form onSubmit={ask} className="grid gap-3">
            {data.learners.length > 1 && (
              <label className="grid gap-1.5 text-sm">
                <span>{t('For', 'لمين')}</span>
                <Select value={reqLearner} onChange={(e) => setReqLearner(e.target.value)}>
                  {data.learners.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </Select>
              </label>
            )}
            <label className="grid gap-1.5 text-sm">
              <span>{t('How many lessons', 'كام حصة')}</span>
              <Select value={String(reqLessons)} onChange={(e) => setReqLessons(Number(e.target.value))}>
                {data.lessonChoices.map((n) => <option key={n} value={n}>{t(`${n} lessons`, `${n} حصص`)}</option>)}
              </Select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span>{t('Why (only our team reads this)', 'السبب (فريقنا بس اللي بيقراه)')}</span>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} minLength={10} maxLength={1000} required />
            </label>
            <Button type="submit" variant="outline" isLoading={busy === 'ask'} disabled={reason.trim().length < 10 || !reqLearner} className="w-full sm:w-fit">
              {t('Send the request', 'ابعت الطلب')}
            </Button>
          </form>
          {data.requests.length > 0 && (
            <ul className="grid gap-2 pt-2 border-t border-border">
              {data.requests.map((r) => (
                <li key={r.id} className="text-sm flex flex-wrap items-center justify-between gap-2">
                  <span>{t(`${r.lessons} lessons for ${r.learnerName || ''}`, `${r.lessons} حصص لـ ${r.learnerName || ''}`)}</span>
                  {statusBadge(r.status)}
                  {r.note && <span className="basis-full text-xs text-muted-foreground">{r.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
