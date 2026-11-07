import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import { BookOpenCheck, Check, Loader2, Mic, Plus, RotateCcw } from 'lucide-react';
import { useT } from '../../lib/language';
import { dashboardFetch } from '../lib/dashboardApi';
import { homeworkLine, type HomeworkItem } from '../../lib/homework';
import { HomeworkFields, homeworkPayload, emptyTask, type HomeworkDraft } from '../components/HomeworkFields';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { notify } from '../../components/ui/Feedback';

type Row = HomeworkItem & {
  student_name: string | null;
  lesson_start: string | null;
  recordings: Array<{ id: string; playUrl?: string | null; teacher_reply?: string | null; created_at: string }>;
};
type StudentOpt = { id: string; name: string | null; lessons: Array<{ id: string; start: string }> };
type Filter = 'open' | 'done' | 'reviewed';

const cameBack = (r: Row) => Boolean(r.done_at) || r.recordings.length > 0;

/**
 * Owner review 2026-11-07: one place for homework. Every task of my students (open first), what came back
 * (ticked done, recordings), the review buttons, and a form to set homework at any time.
 */
export default function HomeworkPage() {
  const { t, isAr } = useT();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [students, setStudents] = useState<StudentOpt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('open');
  const [busy, setBusy] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(() => {
    dashboardFetch<{ homework: Row[]; students: StudentOpt[] }>('/api/dashboard/homework')
      .then((d) => { setRows(d.homework || []); setStudents(d.students || []); setError(null); })
      .catch((e: any) => setError(e?.message || 'Could not load homework.'));
  }, []);
  useEffect(load, [load]);

  const pick = (f: Filter) => (rows || []).filter((r) => (f === 'reviewed' ? Boolean(r.review) : f === 'done' ? !r.review && cameBack(r) : !r.review));
  const shown = useMemo(() => pick(filter), [rows, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const review = async (hw: Row, value: 'mastered' | 'needs_review') => {
    setBusy(hw.id);
    try {
      await dashboardFetch(`/api/dashboard/homework/${hw.id}/review`, { method: 'POST', body: JSON.stringify({ review: value }) });
      notify(value === 'mastered' ? t('Saved as mastered. The family will see it.', 'اتسجّل أتقن، والأسرة هتشوفه.') : t('Set again for next time.', 'اتحط تاني للمرة الجاية.'));
      load();
    } catch (e: any) {
      notify(e?.message || t('Could not save.', 'معرفناش نحفظ.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const fmt = (iso: string) => DateTime.fromISO(iso).setLocale(isAr ? 'ar' : 'en').toFormat('d LLL, h:mm a');
  const tabs: Array<[Filter, string]> = [
    ['open', t('Open', 'مفتوحة')],
    ['done', t('Came back', 'رجعت')],
    ['reviewed', t('Reviewed', 'اتراجعت')],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-teal" aria-hidden="true" />{t('Homework', 'الواجبات')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('The homework you set, what your students sent back, and new homework at any time.', 'الواجبات اللي حطيتها، واللي الطلاب رجّعوه، وتقدر تحط واجب جديد في أي وقت.')}
          </p>
        </div>
        <Button onClick={() => setShowNew((v) => !v)} disabled={!students.length}>
          <Plus className="w-4 h-4 me-1" />{t('New homework', 'واجب جديد')}
        </Button>
      </div>

      {showNew && <NewHomework students={students} onDone={() => { setShowNew(false); load(); }} />}

      <div role="tablist" aria-label={t('Show', 'اعرض')} className="flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={`px-4 h-10 rounded-full text-sm font-semibold border transition-colors ${filter === key ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            {label} <span className="opacity-70">({pick(key).length})</span>
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      ) : rows === null ? (
        <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />{t('Loading…', 'بنحمّل…')}</p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground glass-card rounded-2xl border border-border p-6 text-center">
          {filter === 'open' ? t('No open homework. Set some with "New homework".', 'مفيش واجبات مفتوحة. حط واجب من "واجب جديد".') : t('Nothing here yet.', 'لسه مفيش حاجة هنا.')}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((hw) => {
            const line = homeworkLine(hw, isAr);
            return (
              <li key={hw.id} className="glass-card rounded-2xl border border-border p-4 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{hw.student_name || t('Student', 'طالب')}</p>
                    <p className="text-foreground">{line.title}</p>
                    {line.note && <p className="text-sm text-muted-foreground">{line.note}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('Set ', 'اتحط ')}{fmt(hw.created_at)}{' · '}
                      {hw.lesson_start ? t(`for the lesson of ${fmt(hw.lesson_start)}`, `لحصة ${fmt(hw.lesson_start)}`) : t('outside a lesson', 'خارج الحصة')}
                    </p>
                  </div>
                  {hw.review
                    ? <Badge variant={hw.review === 'mastered' ? 'success' : 'default'}>{hw.review === 'mastered' ? t('Mastered', 'أتقن') : t('Needs review', 'يحتاج مراجعة')}</Badge>
                    : <Badge variant={hw.done_at ? 'success' : 'default'}>{hw.done_at ? t(`Done at home · ${fmt(hw.done_at)}`, `خلّصه في البيت · ${fmt(hw.done_at)}`) : t('Not ticked yet', 'لسه ما علّمش')}</Badge>}
                </div>
                {hw.recordings.map((r) => (
                  <div key={r.id} className="rounded-xl bg-surface-subtle p-2.5 space-y-1.5">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-teal" aria-hidden="true" />{t('Recording sent', 'تسجيل وصل')} · {fmt(r.created_at)}
                    </p>
                    {r.playUrl && <audio controls preload="none" src={r.playUrl} className="w-full h-10" />}
                    {r.teacher_reply && <p className="text-xs text-muted-foreground">{t('Your reply: ', 'ردّك: ')}{r.teacher_reply}</p>}
                  </div>
                ))}
                {!hw.review && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" disabled={busy === hw.id} onClick={() => review(hw, 'mastered')}>
                      <Check className="w-4 h-4 me-1" />{t('Mastered', 'أتقن')}
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy === hw.id} onClick={() => review(hw, 'needs_review')}>
                      <RotateCcw className="w-4 h-4 me-1" />{t('Needs review', 'يحتاج مراجعة')}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function NewHomework({ students, onDone }: { students: StudentOpt[]; onDone: () => void }) {
  const { t, isAr } = useT();
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [bookingId, setBookingId] = useState('');
  const [tasks, setTasks] = useState<HomeworkDraft[]>([emptyTask()]);
  const [saving, setSaving] = useState(false);
  const student = students.find((s) => s.id === studentId);

  const save = async () => {
    setSaving(true);
    try {
      await dashboardFetch(`/api/dashboard/students/${studentId}/homework`, {
        method: 'POST', body: JSON.stringify({ items: homeworkPayload(tasks), bookingId: bookingId || null }),
      });
      notify(t('Homework sent. The family sees it on their home page.', 'الواجب اتبعت، والأسرة هتشوفه في الصفحة الرئيسية.'));
      onDone();
    } catch (e: any) {
      notify(e?.message || t('Could not save the homework.', 'معرفناش نحفظ الواجب.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass-card rounded-2xl border border-border p-4 space-y-3" aria-label={t('New homework', 'واجب جديد')}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-foreground space-y-1">
          <span>{t('Student', 'الطالب')}</span>
          <Select value={studentId} onChange={(e) => { setStudentId(e.target.value); setBookingId(''); }} className="h-10">
            {students.map((s) => <option key={s.id} value={s.id}>{s.name || t('Student', 'طالب')}</option>)}
          </Select>
        </label>
        <label className="text-sm font-medium text-foreground space-y-1">
          <span>{t('For', 'لـ')}</span>
          <Select value={bookingId} onChange={(e) => setBookingId(e.target.value)} className="h-10">
            <option value="">{t('Outside a lesson', 'خارج الحصة')}</option>
            {(student?.lessons || []).map((l) => (
              <option key={l.id} value={l.id}>{t('Lesson of ', 'حصة ')}{DateTime.fromISO(l.start).setLocale(isAr ? 'ar' : 'en').toFormat('d LLL, h:mm a')}</option>
            ))}
          </Select>
        </label>
      </div>
      {studentId && (
        <HomeworkFields value={tasks} onChange={setTasks} studentId={studentId} privateNotes="" subject="" noSuggest legend={t('Tasks (up to 3)', 'المهام (لحد ٣)')} />
      )}
      <div className="flex gap-2">
        <Button onClick={save} isLoading={saving} disabled={!studentId || !tasks.length}>{t('Send homework', 'ابعت الواجب')}</Button>
        <Button variant="ghost" onClick={onDone}>{t('Cancel', 'إلغاء')}</Button>
      </div>
    </section>
  );
}
