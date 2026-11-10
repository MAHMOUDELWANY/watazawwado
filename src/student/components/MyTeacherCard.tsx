import React, { useCallback, useEffect, useState } from 'react';
import { authedJson } from '../../lib/authedJson';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { notify } from '../../components/ui/Feedback';

/**
 * "My teacher" with "Ask to change teacher" (docs/policies/TEACHER-CHANGE.md, owner 2026-11-10). One row per learner
 * on the account; the family gives a reason and a short note, our team decides. Nothing here tells the teacher.
 */

type Learner = {
  id: string; name: string; self: boolean;
  teacher: { id: string; nameEn: string; nameAr: string; photo: string | null } | null;
  request: { id: string; status: 'open' | 'talk' | 'waitlist' | 'approved' | 'declined' | 'withdrawn'; message: string | null } | null;
  options: Array<{ id: string; nameEn: string; nameAr: string }>;
};

const REASONS: Array<{ id: string; en: string; ar: string }> = [
  { id: 'times', en: "The teacher's times don't suit us", ar: 'مواعيد المعلم مش مناسبة لينا' },
  { id: 'teacher_gender', en: 'We prefer a female / a male teacher', ar: 'نفضّل معلمة / معلم' },
  { id: 'level_subject', en: 'The level or subject changed', ar: 'المستوى أو المادة اتغيّرت' },
  { id: 'siblings', en: 'We want siblings with the same teacher', ar: 'عايزين الإخوات مع نفس المعلم' },
  { id: 'language', en: 'Needs explanations more in English or in Arabic', ar: 'محتاج شرح أكتر بالإنجليزي أو بالعربي' },
  { id: 'fit', en: "The teaching style isn't suiting us", ar: 'طريقة الشرح مش مناسبة لينا' },
  { id: 'quality', en: 'Lateness or lessons that feel unprepared', ar: 'تأخير أو حصص مش متحضّرة' },
  { id: 'safety', en: 'Something about safety or respect', ar: 'أمر يخص الأمان أو الاحترام' },
  { id: 'other', en: 'Something else', ar: 'سبب تاني' }
];

export function MyTeacherCard({ isAr }: { isAr: boolean }) {
  const [learners, setLearners] = useState<Learner[] | null>(null);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [preferred, setPreferred] = useState('');
  const [busy, setBusy] = useState(false);
  const t = (en: string, ar: string) => (isAr ? ar : en);

  const load = useCallback(() => {
    authedJson<{ learners: Learner[] }>('/api/student/teacher-change').then((d) => setLearners(d.learners || [])).catch(() => setLearners([]));
  }, []);
  useEffect(load, [load]);

  if (!learners || learners.length === 0) return null;

  const send = async (studentId: string) => {
    if (!reason) return notify(t('Choose a reason first.', 'اختار السبب الأول.'), 'error');
    if (note.trim().length < 3) return notify(t('Write a few words so our team understands.', 'اكتب كلمتين عشان فريقنا يفهم.'), 'error');
    setBusy(true);
    try {
      await authedJson('/api/student/teacher-change', { method: 'POST', body: JSON.stringify({ studentId, reasonType: reason, note: note.trim(), preferredTeacherId: preferred || undefined }) });
      notify(t('Sent. Our team will get back to you within two days.', 'اتبعت. فريقنا هيرد عليك خلال يومين.'), 'success');
      setOpenFor(null); setReason(''); setNote(''); setPreferred('');
      load();
    } catch (e: any) {
      notify(e?.message || t('Could not send.', 'معرفناش نبعت.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async (id: string) => {
    setBusy(true);
    try {
      await authedJson(`/api/student/teacher-change/${id}/withdraw`, { method: 'POST' });
      notify(t('Request withdrawn. Nothing changed.', 'اتلغى الطلب، ومفيش حاجة اتغيّرت.'), 'success');
      load();
    } catch (e: any) {
      notify(e?.message || t('Could not withdraw.', 'معرفناش نلغي.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const statusLine = (r: NonNullable<Learner['request']>) => {
    if (r.status === 'open' || r.status === 'talk') return t('Your request is with our team. We reply within two days.', 'طلبك عند فريقنا، وهنرد عليك خلال يومين.');
    if (r.status === 'waitlist') return r.message || t('We are finding the right teacher.', 'بندوّر على المعلم المناسب.');
    if (r.status === 'declined') return r.message || t('We could not change the teacher this time.', 'مقدرناش نغيّر المعلم المرة دي.');
    if (r.status === 'approved') return t('Done: the new teacher is above. Book their free times from Book.', 'تمام: المعلم الجديد ظاهر فوق، واحجز مواعيده الفاضية من «احجز».');
    return null;
  };

  return (
    <section aria-labelledby="my-teacher-title" className="space-y-3">
      <h3 id="my-teacher-title" className="text-base font-display font-bold text-foreground">{learners.length > 1 ? t('Teachers', 'المعلمين') : t('Your teacher', 'معلمك')}</h3>
      {learners.map((l) => {
        const name = l.teacher ? (isAr ? l.teacher.nameAr : l.teacher.nameEn) : t('Our team is choosing', 'فريقنا بيختار');
        const open = l.request && ['open', 'talk', 'waitlist'].includes(l.request.status);
        return (
          <div key={l.id} className="rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center gap-3">
              {l.teacher?.photo
                ? <img src={l.teacher.photo} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                : <span className="w-11 h-11 rounded-full bg-primary/10 shrink-0" aria-hidden="true" />}
              <div className="min-w-0 flex-1">
                {learners.length > 1 && <p className="text-xs text-muted-foreground">{l.self ? t('You', 'إنت') : l.name}</p>}
                <p className="font-bold text-foreground truncate">{name}</p>
              </div>
              {!open && openFor !== l.id && (
                <Button size="sm" variant="ghost" onClick={() => { setOpenFor(l.id); setReason(''); setNote(''); setPreferred(''); }}>
                  {t('Ask to change', 'اطلب تغيير')}
                </Button>
              )}
            </div>

            {l.request && statusLine(l.request) && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-subtle px-3 py-2 text-sm text-muted-foreground" aria-live="polite">
                <span>{statusLine(l.request)}</span>
                {open && <Button size="sm" variant="ghost" onClick={() => withdraw(l.request!.id)} disabled={busy}>{t('Withdraw', 'إلغاء الطلب')}</Button>}
              </div>
            )}

            {openFor === l.id && (
              <div className="space-y-3 border-t border-border pt-3">
                <p className="text-sm text-muted-foreground">
                  {t('Tell us why, honestly. Only our team reads it; your teacher is never told the reason.', 'قولنا السبب بصراحة. فريقنا بس اللي بيقراه، والمعلم مش بيعرف السبب أبدًا.')}
                </p>
                <label className="block text-sm font-semibold text-foreground" htmlFor={`tc-reason-${l.id}`}>{t('The reason', 'السبب')}</label>
                <Select id={`tc-reason-${l.id}`} value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option value="">{t('Choose', 'اختار')}</option>
                  {REASONS.map((r) => <option key={r.id} value={r.id}>{isAr ? r.ar : r.en}</option>)}
                </Select>
                {reason === 'safety' && (
                  <p className="text-sm font-semibold text-destructive">{t('This goes to our team straight away. We will contact you today.', 'ده بيوصل لفريقنا فورًا، وهنتواصل معاك النهارده.')}</p>
                )}
                <label className="block text-sm font-semibold text-foreground" htmlFor={`tc-note-${l.id}`}>{t('A few words', 'كلمتين')}</label>
                <Textarea id={`tc-note-${l.id}`} rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
                {l.options.length > 0 && (
                  <>
                    <label className="block text-sm font-semibold text-foreground" htmlFor={`tc-pref-${l.id}`}>{t('A teacher you would like (optional)', 'معلم تحبه (اختياري)')}</label>
                    <Select id={`tc-pref-${l.id}`} value={preferred} onChange={(e) => setPreferred(e.target.value)}>
                      <option value="">{t('Let our team choose', 'سيب فريقنا يختار')}</option>
                      {l.options.map((o) => <option key={o.id} value={o.id}>{isAr ? o.nameAr : o.nameEn}</option>)}
                    </Select>
                  </>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('If we move you, booked lessons more than 3 hours away come back to your balance, and you book the new teacher\'s free times.', 'لو نقلناك، الحصص المحجوزة اللي فاضلها أكتر من ٣ ساعات بترجع رصيد عندك، وتحجز مواعيد المعلم الجديد الفاضية.')}
                </p>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setOpenFor(null)}>{t('Cancel', 'رجوع')}</Button>
                  <Button size="sm" onClick={() => send(l.id)} isLoading={busy}>{t('Send to our team', 'ابعت لفريقنا')}</Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
