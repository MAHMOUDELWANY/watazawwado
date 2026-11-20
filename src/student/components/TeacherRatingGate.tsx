import React, { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { authedJson } from '../../lib/authedJson';

type Pending = { learnerId: string; learnerName: string | null; isChild: boolean; teacherId: string; teacherName: string | null; lessonCount: number; canSnooze: boolean };
type Key = 'explains' | 'patient' | 'onTime' | 'enjoys';

/**
 * Owner decision 2026-11-20: a short questionnaire about the teacher after the learner's 4th completed lesson with
 * them, then every 8. It cannot be closed; "Later today" works once. Only in the family portal (never kid mode, the
 * server refuses child phones). Answers stay with our team; the teacher sees averages only.
 */
export function TeacherRatingGate({ isAr, hold = false }: { isAr: boolean; hold?: boolean }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [scores, setScores] = useState<Partial<Record<Key, number>>>({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () => authedJson<{ pending: Pending | null }>('/api/student/teacher-rating/pending').then((d) => setPending(d.pending)).catch(() => {});
  useEffect(() => { load(); }, []);
  if (!pending || hold) return null;

  const teacher = pending.teacherName || (isAr ? 'المعلم' : 'the teacher');
  const learner = pending.learnerName || (isAr ? 'ابنك' : 'your child');
  const questions: Array<[Key, string, string]> = [
    ['explains', `${teacher} explains clearly`, `${teacher} بيشرح بوضوح`],
    ['patient', `${teacher} is patient and kind`, `${teacher} صبور وطيب في التعامل`],
    ['onTime', `${teacher} is on time`, `${teacher} بيلتزم بالمواعيد`],
    ['enjoys', pending.isChild ? `${learner} enjoys the lessons` : 'I enjoy the lessons', pending.isChild ? `${learner} مبسوط من الحصص` : 'أنا مبسوط من الحصص'],
  ];
  const ready = questions.every(([k]) => scores[k]);
  const body = { learnerId: pending.learnerId, teacherId: pending.teacherId, lessonCount: pending.lessonCount };

  const post = async (path: string, extra: object) => {
    setBusy(true); setError('');
    try {
      await authedJson(path, { method: 'POST', body: JSON.stringify({ ...body, ...extra }) });
      setScores({}); setNote('');
      setPending(null);
      await load();
    } catch (e: any) {
      setError(isAr ? 'ما اتحفظش، جرّب تاني.' : e?.message || 'Could not save. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen onClose={() => {}} hideCloseButton maxWidth="lg" layerClassName="z-[120]"
      title={isAr ? `رأيك في ${teacher}` : `How is ${teacher} doing?`}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          {pending.canSnooze && (
            <Button variant="ghost" disabled={busy} onClick={() => post('/api/student/teacher-rating/snooze', { tz: Intl.DateTimeFormat().resolvedOptions().timeZone })}>
              {isAr ? 'بعدين النهارده' : 'Later today'}
            </Button>
          )}
          <Button disabled={!ready || busy} isLoading={busy} onClick={() => post('/api/student/teacher-rating', { ...scores, note: note.trim() || null })}>
            {isAr ? 'ابعت' : 'Send'}
          </Button>
        </div>
      }
    >
      <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-4 text-start">
        <p className="text-sm text-muted-foreground">
          {isAr
            ? `${pending.lessonCount} حصص مع ${teacher}${pending.isChild ? ` لـ${learner}` : ''}. دقيقة واحدة عشان نعرف الحصص ماشية إزاي. إجاباتك بتوصل لفريقنا بس، والمعلم بيشوف متوسطات من غير أسماء.`
            : `${pending.lessonCount} lessons with ${teacher}${pending.isChild ? ` for ${learner}` : ''}. One minute to tell us how it is going. Only our team reads your answers; the teacher sees averages, never names.`}
        </p>
        {questions.map(([key, en, ar]) => (
          <fieldset key={key} className="space-y-1.5">
            <legend className="text-sm font-semibold text-foreground">{isAr ? ar : en}</legend>
            <div className="flex gap-1.5" dir="ltr">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v} type="button" aria-pressed={scores[key] === v} onClick={() => setScores((s) => ({ ...s, [key]: v }))}
                  aria-label={`${v} / 5`}
                  className={`h-11 w-11 rounded-xl border text-sm font-semibold tabular-nums cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${scores[key] === v ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:bg-surface-subtle'}`}
                >{v}</button>
              ))}
            </div>
          </fieldset>
        ))}
        <p className="text-xs text-muted-foreground">{isAr ? '1 = خالص، 5 = جدًا' : '1 = not at all, 5 = very much'}</p>
        <label className="block space-y-1.5">
          <span className="text-sm text-muted-foreground">{isAr ? 'حاجة تانية تحب تقولها؟ (اختياري)' : 'Anything else? (optional)'}</span>
          <Textarea value={note} maxLength={1000} rows={3} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
    </Modal>
  );
}
