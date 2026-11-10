import React, { useState } from 'react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { notify } from '../../components/ui/Feedback';

/**
 * A teacher asks the academy to hand a learner to another teacher (docs/policies/TEACHER-CHANGE.md). Only the super
 * admin decides; the family is never told that the teacher asked.
 */
const REASONS = [
  { id: 'times', en: 'My times no longer suit them', ar: 'مواعيدي مبقتش مناسبة ليهم' },
  { id: 'teacher_reasons', en: 'My own circumstances (hours, leave, leaving)', ar: 'ظروفي (ساعاتي، إجازة، هسيب الأكاديمية)' },
  { id: 'level_subject', en: 'Their level or subject is beyond what I teach', ar: 'مستواه أو مادته مش من اللي بدرّسه' },
  { id: 'learner_attendance', en: 'Repeated absences or late cancellations', ar: 'غياب أو إلغاء متأخر متكرر' },
  { id: 'respect', en: 'Disrespect from the learner or the parent', ar: 'عدم احترام من الطالب أو ولي الأمر' },
  { id: 'safety', en: 'Something about safety', ar: 'أمر يخص الأمان' },
  { id: 'other', en: 'Something else', ar: 'سبب تاني' }
];

export function HandOverCard({ studentId }: { studentId: string }) {
  const { t, isAr } = useT();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [handover, setHandover] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!reason || note.trim().length < 3) return notify(t('Choose a reason and write a short note for the academy.', 'اختار السبب واكتب ملاحظة قصيرة للأكاديمية.'), 'error');
    setBusy(true);
    try {
      await dashboardFetch('/api/dashboard/teacher-change', { method: 'POST', body: JSON.stringify({ studentId, reasonType: reason, note: note.trim(), handoverNote: handover.trim() || undefined }) });
      setSent(true); setOpen(false);
      notify(t('Sent to the academy. Keep teaching as usual until we arrange it.', 'اتبعت للأكاديمية. كمّل الحصص عادي لحد ما نرتّب النقل.'), 'success');
    } catch (e: any) {
      notify(e?.message || t('Could not send.', 'معرفناش نبعت.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="glass-card rounded-2xl p-5 border border-border shadow-2xs space-y-3" aria-labelledby="handover-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="handover-title" className="text-base font-display font-semibold text-foreground">{t('Hand over this learner', 'تسليم الطالب لمعلم تاني')}</h2>
        {!open && !sent && <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>{t('Ask the academy', 'اطلب من الأكاديمية')}</Button>}
      </div>
      {sent && <p className="text-sm text-muted-foreground">{t('Your request is with the academy.', 'طلبك عند الأكاديمية.')}</p>}
      {open && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('Only the academy reads this. The family is never told you asked.', 'الأكاديمية بس اللي بتقرا ده، والأسرة مش بتعرف إنك اللي طلبت.')}</p>
          <label htmlFor="ho-reason" className="block text-sm font-semibold text-foreground">{t('The reason', 'السبب')}</label>
          <Select id="ho-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">{t('Choose', 'اختار')}</option>
            {REASONS.map((r) => <option key={r.id} value={r.id}>{isAr ? r.ar : r.en}</option>)}
          </Select>
          <label htmlFor="ho-note" className="block text-sm font-semibold text-foreground">{t('For the academy', 'للأكاديمية')}</label>
          <Textarea id="ho-note" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          <label htmlFor="ho-handover" className="block text-sm font-semibold text-foreground">{t('A note for the next teacher (optional)', 'ملاحظة للمعلم الجاي (اختياري)')}</label>
          <Textarea id="ho-handover" rows={2} maxLength={1000} value={handover} onChange={(e) => setHandover(e.target.value)} placeholder={t('Where they are, what works with them', 'وصل لفين، وإيه اللي بينفع معاه')} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>{t('Cancel', 'رجوع')}</Button>
            <Button size="sm" onClick={send} isLoading={busy}>{t('Send', 'ابعت')}</Button>
          </div>
        </div>
      )}
    </section>
  );
}
