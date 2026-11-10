import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { notify, confirmAction } from '../../components/ui/Feedback';

/**
 * Super admin: teacher change requests (docs/policies/TEACHER-CHANGE.md). Approve (pick a licensed teacher), talk to
 * the family first, waitlist, or decline with a message. Approving cancels lessons more than 3 hours away into credit.
 */

type Req = {
  id: string; student_id: string; studentName: string | null; initiator: 'family' | 'teacher' | 'admin';
  reason_type: string; note: string | null; handover_note: string | null; status: string; admin_message: string | null;
  created_at: string; fromName: string | null; toName: string | null; preferredName: string | null; preferred_teacher_id: string | null;
  subject: string | null; recentMoves: number; teacherQualityMoves: number; outcome: Record<string, string[]> | null;
};
type Teacher = { id: string; nameEn: string; nameAr: string; subjects: string[] };

const REASON: Record<string, [string, string]> = {
  times: ['Times', 'المواعيد'], teacher_gender: ['Teacher gender', 'معلم / معلمة'], level_subject: ['Level or subject', 'المستوى أو المادة'],
  siblings: ['Siblings together', 'الإخوات مع بعض'], teacher_reasons: ["Teacher's circumstances", 'ظروف المعلم'], language: ['Language of explanation', 'لغة الشرح'],
  fit: ['Fit: talk first', 'مش مرتاحين: كلّمهم الأول'], quality: ['Quality (counted)', 'الجودة (بتتحسب)'], learner_attendance: ['Learner attendance', 'غياب الطالب'],
  respect: ['Respect', 'الاحترام'], safety: ['SAFETY: urgent', 'أمان: عاجل'], other: ['Other', 'سبب تاني']
};
const OPEN = ['open', 'talk', 'waitlist'];

export default function TeacherChangesPage() {
  const { t, isAr } = useT();
  const [data, setData] = useState<{ requests: Req[]; teachers: Teacher[] } | null>(null);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    dashboardFetch<{ requests: Req[]; teachers: Teacher[] }>('/api/dashboard/admin/teacher-change').then(setData).catch(() => setData({ requests: [], teachers: [] }));
  }, []);
  useEffect(load, [load]);

  const decide = async (r: Req, action: 'approve' | 'talk' | 'waitlist' | 'decline') => {
    const toTeacherId = picked[r.id] || r.preferred_teacher_id || '';
    if (action === 'approve') {
      if (!toTeacherId) return notify(t('Choose the new teacher first.', 'اختار المعلم الجديد الأول.'), 'error');
      const ok = await confirmAction(
        t('Move this learner? Lessons more than 3 hours away are cancelled into credit; lessons within 3 hours stay. Each side gets its own notice.', 'تنقل الطالب؟ الحصص اللي فاضلها أكتر من ٣ ساعات بتتلغي وترجع رصيد، واللي أقل من ٣ ساعات بتفضل. وكل طرف بيوصله إشعاره.'),
        { confirmLabel: t('Move', 'انقل') }
      );
      if (!ok) return;
    }
    setBusy(r.id);
    try {
      const res = await dashboardFetch<{ outcome?: Record<string, string[]> }>(`/api/dashboard/admin/teacher-change/${r.id}/decide`, {
        method: 'POST', body: JSON.stringify({ action, toTeacherId, message: message[r.id] || '' })
      });
      const o = res.outcome;
      notify(o
        ? t(`Moved. ${o.cancel_credit.length + o.cancel_release.length + o.cancel_balance.length} lesson(s) returned, ${o.keep_soon.length} kept (within 3 hours), ${o.keep_trial.length} trial(s) left to move by hand${o.failed.length ? `, ${o.failed.length} need a look in Bookings` : ''}.`,
            `اتنقل. ${o.cancel_credit.length + o.cancel_release.length + o.cancel_balance.length} حصة رجعت رصيد، ${o.keep_soon.length} فضلت (أقل من ٣ ساعات)، ${o.keep_trial.length} تجريبية محتاجة تنقلها بإيدك${o.failed.length ? `، و${o.failed.length} محتاجة مراجعة في الحجوزات` : ''}.`)
        : t('Saved.', 'اتحفظ.'), 'success');
      load();
    } catch (e: any) {
      notify(e?.message || t('Could not save.', 'معرفناش نحفظ.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  if (!data) return <p className="p-6 text-sm text-muted-foreground">{t('Loading…', 'بيحمّل…')}</p>;
  const open = data.requests.filter((r) => OPEN.includes(r.status));
  const done = data.requests.filter((r) => !OPEN.includes(r.status)).slice(0, 30);
  const when = (iso: string) => DateTime.fromISO(iso).setLocale(isAr ? 'ar' : 'en').toRelative();

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-foreground">{t('Teacher changes', 'تغيير المعلم')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('Reply within 48 hours. The reason never reaches the previous teacher; the family is never told a teacher asked.', 'رد خلال ٤٨ ساعة. السبب مش بيوصل للمعلم السابق، والأسرة مش بتعرف إن المعلم هو اللي طلب.')}
        </p>
      </header>

      {open.length === 0 && <p className="text-sm text-muted-foreground">{t('No open requests.', 'مفيش طلبات مفتوحة.')}</p>}
      {open.map((r) => {
        const urgent = r.reason_type === 'safety';
        const options = data.teachers.filter((x) => x.nameEn !== r.fromName);
        return (
          <article key={r.id} className={`glass-card rounded-2xl border p-5 space-y-3 ${urgent ? 'border-destructive' : 'border-border'}`}>
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <Link to={`/dashboard/students/${r.student_id}`} className="font-bold text-foreground underline underline-offset-4">{r.studentName || t('Learner', 'طالب')}</Link>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={urgent ? 'destructive' : 'default'}>{REASON[r.reason_type]?.[isAr ? 1 : 0] || r.reason_type}</Badge>
                <Badge>{r.initiator === 'teacher' ? t('Teacher asked', 'المعلم طلب') : t('Family asked', 'الأسرة طلبت')}</Badge>
                {r.status !== 'open' && <Badge>{r.status === 'talk' ? t('Talking first', 'بنكلمهم الأول') : t('Waitlist', 'قائمة انتظار')}</Badge>}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('Now with', 'دلوقتي مع')} <b className="text-foreground">{r.fromName || '—'}</b>
              {r.preferredName && <> · {t('asks for', 'طالبين')} <b className="text-foreground">{r.preferredName}</b></>}
              {' · '}{when(r.created_at)}
            </p>
            {r.note && <p className="text-sm text-foreground whitespace-pre-line rounded-xl bg-surface-subtle p-3">{r.note}</p>}
            {r.handover_note && <p className="text-xs text-muted-foreground">{t('Handover note for the next teacher:', 'ملاحظة التسليم للمعلم الجاي:')} {r.handover_note}</p>}
            {r.recentMoves >= 2 && <p className="text-sm font-semibold text-destructive">{t('Two moves in 90 days: call the family before a third.', 'اتنقل مرتين في ٩٠ يوم: كلّم الأسرة قبل التالتة.')}</p>}
            {r.teacherQualityMoves > 0 && <p className="text-xs text-muted-foreground">{t(`Quality moves away from this teacher so far: ${r.teacherQualityMoves}`, `نقل بسبب الجودة من المعلم ده لحد دلوقتي: ${r.teacherQualityMoves}`)}</p>}

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={`tc-to-${r.id}`} className="block text-sm font-semibold text-foreground mb-1">{t('New teacher', 'المعلم الجديد')}</label>
                <Select id={`tc-to-${r.id}`} value={picked[r.id] ?? r.preferred_teacher_id ?? ''} onChange={(e) => setPicked({ ...picked, [r.id]: e.target.value })}>
                  <option value="">{t('Choose', 'اختار')}</option>
                  {options.map((x) => <option key={x.id} value={x.id}>{isAr ? x.nameAr : x.nameEn}</option>)}
                </Select>
              </div>
              <div>
                <label htmlFor={`tc-msg-${r.id}`} className="block text-sm font-semibold text-foreground mb-1">{t('Message to the family (for waitlist or decline)', 'رسالة للأسرة (للانتظار أو الرفض)')}</label>
                <Textarea id={`tc-msg-${r.id}`} rows={2} maxLength={500} value={message[r.id] || ''} onChange={(e) => setMessage({ ...message, [r.id]: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              {r.status !== 'talk' && <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => decide(r, 'talk')}>{t('Talk first', 'كلّمهم الأول')}</Button>}
              {r.status !== 'waitlist' && <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => decide(r, 'waitlist')}>{t('Waitlist', 'انتظار')}</Button>}
              <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => decide(r, 'decline')}>{t('Decline', 'رفض')}</Button>
              <Button size="sm" isLoading={busy === r.id} onClick={() => decide(r, 'approve')}>{t('Approve and move', 'وافق وانقل')}</Button>
            </div>
          </article>
        );
      })}

      {done.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-base font-display font-semibold text-foreground">{t('Decided', 'اتحسم')}</h2>
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {done.map((r) => (
              <li key={r.id} className="p-3 text-sm flex flex-wrap justify-between gap-2">
                <span className="text-foreground">{r.studentName} · {r.fromName || '—'}{r.toName ? ` → ${r.toName}` : ''}</span>
                <span className="text-muted-foreground">{REASON[r.reason_type]?.[isAr ? 1 : 0]} · {r.status} · {when(r.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
