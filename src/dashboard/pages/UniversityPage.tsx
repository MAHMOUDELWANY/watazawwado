import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Circle, Lock } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { useTeacherAuth } from '../../lib/auth';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { confirmAction, notify } from '../../components/ui/Feedback';

/**
 * NX-15 "Watazawwado University". A teacher teaches only the subjects licensed to them. Any other subject is earned
 * on a track: our curriculum and the teacher guide (the teacher ticks them), then a test and an observed lesson that
 * the super admin records. Passing both grants the subject. The super admin also sees who may teach what.
 */
type Row = {
  teacher_email: string; subject: string; status: 'training' | 'licensed';
  curriculum_done_at: string | null; guide_done_at: string | null; test_score: number | null;
  test_passed_at: string | null; observed_passed_at: string | null; note: string | null; licensed_at: string | null;
};
type Teacher = { email: string; display_name: string | null; display_name_ar: string | null; role: string; is_active: boolean };

const NAMES: Record<string, { en: string; ar: string }> = {
  'quran-reading': { en: 'Quran reading', ar: 'قراءة القرآن' },
  tajweed: { en: 'Tajweed', ar: 'التجويد' },
  'quran-memorization': { en: 'Memorization & revision', ar: 'الحفظ والمراجعة' },
  'zad-essentials': { en: 'Zad Essentials', ar: 'أول الزاد' },
  seerah: { en: 'Seerah', ar: 'السيرة النبوية' },
  'modern-standard-arabic': { en: 'Fusha Arabic', ar: 'العربية الفصحى' },
  'egyptian-arabic': { en: 'Egyptian Arabic', ar: 'اللهجة المصرية' },
  english: { en: 'English', ar: 'الإنجليزية' },
};

function Step({ done, label, children }: { done: boolean; label: string; children?: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      {done ? <Check className="w-4 h-4 mt-0.5 text-teal shrink-0" aria-hidden="true" /> : <Circle className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" aria-hidden="true" />}
      <span className="grid gap-1 min-w-0">
        <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
        {children}
      </span>
    </li>
  );
}

export default function UniversityPage() {
  const { isAr, t } = useT();
  const { teacherRole } = useTeacherAuth();
  const isSuperAdmin = teacherRole === 'super_admin';
  const name = (s: string) => (isAr ? NAMES[s]?.ar : NAMES[s]?.en) || s;

  const [subjects, setSubjects] = useState<string[]>([]);
  const [mine, setMine] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    dashboardFetch<{ subjects: string[]; rows: Row[] }>('/api/dashboard/university/me')
      .then((d) => { setSubjects(d.subjects); setMine(d.rows); })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const start = async (subject: string) => {
    setBusy(subject);
    try { await dashboardFetch(`/api/dashboard/university/me/${subject}/start`, { method: 'POST' }); load(); notify(t('Track started. The admin was told.', 'بدأ المسار، والإدارة اتبلغت.')); }
    catch (e: any) { notify(e.message, 'error'); }
    finally { setBusy(null); }
  };
  const tick = async (subject: string, step: 'curriculum' | 'guide', done: boolean) => {
    setBusy(`${subject}:${step}`);
    try { await dashboardFetch(`/api/dashboard/university/me/${subject}/step`, { method: 'POST', body: JSON.stringify({ step, done }) }); load(); }
    catch (e: any) { notify(e.message, 'error'); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl" data-testid="university-page">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{t('Watazawwado University', 'جامعة وتزودوا')}</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          {t('You teach the subjects that are yours. To earn another one: study our curriculum and the teacher guide, then pass a test and an observed lesson with the admin.',
            'بتدرّس المواد اللي بتاعتك. ولو عايز مادة جديدة: ادرس منهجنا ودليل المعلم، وبعدين اختبار وحصة بيحضرها حد من الإدارة.')}
        </p>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {mine && (
        <section aria-labelledby="my-subjects" className="space-y-3">
          <h2 id="my-subjects" className="text-lg font-semibold">{t('My subjects', 'موادي')}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {subjects.map((s) => {
              const row = mine.find((r) => r.subject === s);
              return (
                <Card key={s} className="p-4 grid gap-3" data-testid={`subject-${s}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{name(s)}</span>
                    {row?.status === 'licensed'
                      ? <Badge variant="success">{t('You teach it', 'بتدرّسها')}</Badge>
                      : row ? <Badge variant="warning">{t('In training', 'في التدريب')}</Badge>
                      : <Badge variant="outline"><Lock className="w-3 h-3 me-1 inline" aria-hidden="true" />{t('Not yet', 'لسه')}</Badge>}
                  </div>
                  {!row && (
                    <Button size="sm" variant="outline" className="w-fit" isLoading={busy === s} onClick={() => start(s)}>
                      {t('Start the track', 'ابدأ المسار')}
                    </Button>
                  )}
                  {row?.status === 'training' && (
                    <ol className="grid gap-2.5">
                      <Step done={!!row.curriculum_done_at} label={t('1. Study our curriculum for this subject', '١. ادرس منهجنا في المادة دي')}>
                        <span className="flex flex-wrap gap-3">
                          <Link to="/dashboard/curriculum" className="text-xs font-semibold text-teal underline underline-offset-4">{t('Open the curriculum', 'افتح المنهج')}</Link>
                          <button type="button" disabled={busy === `${s}:curriculum`} onClick={() => tick(s, 'curriculum', !row.curriculum_done_at)} className="text-xs font-semibold underline underline-offset-4">
                            {row.curriculum_done_at ? t('Mark not done', 'رجّعها مش خلصانة') : t('I studied it', 'درسته')}
                          </button>
                        </span>
                      </Step>
                      <Step done={!!row.guide_done_at} label={t('2. Read the teacher guide', '٢. اقرأ دليل المعلم')}>
                        <span className="text-xs text-muted-foreground">{t('The guide for each subject is being written; the admin sends it to you.', 'دليل كل مادة لسه بيتكتب، والإدارة بتبعتهولك.')}</span>
                        <button type="button" disabled={busy === `${s}:guide`} onClick={() => tick(s, 'guide', !row.guide_done_at)} className="text-xs font-semibold underline underline-offset-4 w-fit">
                          {row.guide_done_at ? t('Mark not done', 'رجّعها مش خلصانة') : t('I read it', 'قريته')}
                        </button>
                      </Step>
                      <Step done={!!row.test_passed_at} label={t('3. The test (recorded by the admin)', '٣. الاختبار (الإدارة بتسجّله)')}>
                        {row.test_score != null && <span className="text-xs text-muted-foreground">{t(`Score: ${row.test_score}/100`, `الدرجة: ${row.test_score}/100`)}</span>}
                      </Step>
                      <Step done={!!row.observed_passed_at} label={t('4. An observed lesson (recorded by the admin)', '٤. حصة بيحضرها حد من الإدارة')} />
                    </ol>
                  )}
                  {row?.status === 'training' && row.note && <p className="text-xs text-muted-foreground">{row.note}</p>}
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {isSuperAdmin && <AdminMatrix name={name} />}
    </div>
  );
}

/** Super admin: who may teach what, and each track's steps. */
function AdminMatrix({ name }: { name: (s: string) => string }) {
  const { isAr, t } = useT();
  const [data, setData] = useState<{ subjects: string[]; teachers: Teacher[]; rows: Row[] } | null>(null);
  const [open, setOpen] = useState<{ teacher: Teacher; subject: string } | null>(null);
  const [score, setScore] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    dashboardFetch<{ subjects: string[]; teachers: Teacher[]; rows: Row[] }>('/api/dashboard/admin/university').then(setData).catch((e) => notify(e.message, 'error'));
  }, []);
  useEffect(() => { load(); }, [load]);
  if (!data) return null;

  const rowOf = (email: string, subject: string) => data.rows.find((r) => r.teacher_email === email && r.subject === subject);
  const teacherName = (tc: Teacher) => (isAr ? tc.display_name_ar || tc.display_name : tc.display_name) || tc.email;
  const current = open ? rowOf(open.teacher.email, open.subject) : undefined;

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    if (!open) return;
    if (action === 'revoke' && !(await confirmAction(t(`Remove ${name(open.subject)} from ${teacherName(open.teacher)}? Their track is cleared too.`, `نشيل ${name(open.subject)} من ${teacherName(open.teacher)}؟ المسار كمان بيتمسح.`), { danger: true }))) return;
    setBusy(true);
    try {
      await dashboardFetch(`/api/dashboard/admin/university/${encodeURIComponent(open.teacher.email)}/${open.subject}`, {
        method: 'POST', body: JSON.stringify({ action, ...(note.trim() ? { note } : {}), ...extra }),
      });
      load(); setOpen(null);
    } catch (e: any) { notify(e.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <section aria-labelledby="who-teaches" className="space-y-3">
      <h2 id="who-teaches" className="text-lg font-semibold">{t('Who teaches what', 'مين بيدرّس إيه')}</h2>
      <p className="text-xs text-muted-foreground">{t('Tap a cell to grant, remove, open a track or record a test or an observed lesson. A new teacher teaches nothing until you grant subjects here.', 'اضغط على أي خانة علشان تدّي المادة أو تشيلها أو تفتح مسار أو تسجّل اختبار أو حصة. المعلم الجديد مش بيدرّس حاجة لحد ما تدّيله مواد من هنا.')}</p>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-surface-subtle">
              <th scope="col" className="text-start p-3 font-semibold sticky start-0 bg-surface-subtle">{t('Teacher', 'المعلم')}</th>
              {data.subjects.map((s) => <th key={s} scope="col" className="p-3 font-semibold text-xs whitespace-nowrap">{name(s)}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.teachers.filter((tc) => tc.is_active).map((tc) => (
              <tr key={tc.email} className="border-t border-border">
                <th scope="row" className="text-start p-3 font-medium whitespace-nowrap sticky start-0 bg-background">
                  <span className="block">{teacherName(tc)}</span>
                  {/* Two teachers can share a display name; the email tells them apart. */}
                  <span className="block text-[11px] font-normal text-muted-foreground" dir="ltr">{tc.email}</span>
                </th>
                {data.subjects.map((s) => {
                  const r = rowOf(tc.email, s);
                  return (
                    <td key={s} className="p-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => { setOpen({ teacher: tc, subject: s }); setScore(r?.test_score != null ? String(r.test_score) : ''); setNote(r?.note || ''); }}
                        aria-label={`${teacherName(tc)}: ${name(s)}`}
                        className={`min-h-11 min-w-11 rounded-xl px-2 text-xs font-semibold focus-ring ${r?.status === 'licensed' ? 'bg-teal/15 text-teal' : r ? 'bg-gold/15 text-gold' : 'text-muted-foreground hover:bg-surface-subtle'}`}
                      >
                        {r?.status === 'licensed' ? '✓' : r ? t('Training', 'تدريب') : '·'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!open} onClose={() => setOpen(null)} title={open ? `${teacherName(open.teacher)} · ${name(open.subject)}` : ''} maxWidth="md">
        {open && (
          <div className="grid gap-4">
            <p className="text-sm text-muted-foreground">
              {current?.status === 'licensed' ? t('Teaches this subject.', 'بيدرّس المادة دي.') : current ? t('On the track.', 'في المسار.') : t('Does not teach this subject.', 'مش بيدرّس المادة دي.')}
            </p>
            {current?.status === 'training' && (
              <ul className="text-sm grid gap-1">
                <li>{current.curriculum_done_at ? '✓' : '○'} {t('Curriculum studied', 'درس المنهج')}</li>
                <li>{current.guide_done_at ? '✓' : '○'} {t('Teacher guide read', 'قرا دليل المعلم')}</li>
                <li>{current.test_passed_at ? '✓' : '○'} {t('Test passed', 'نجح في الاختبار')}{current.test_score != null ? ` (${current.test_score}/100)` : ''}</li>
                <li>{current.observed_passed_at ? '✓' : '○'} {t('Observed lesson passed', 'نجح في الحصة المحضورة')}</li>
              </ul>
            )}
            <label className="grid gap-1 text-sm">
              <span>{t('Note (optional)', 'ملاحظة (اختياري)')}</span>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} />
            </label>
            {current?.status === 'training' && (
              <div className="grid gap-2">
                <label className="grid gap-1 text-sm">
                  <span>{t('Test score (0-100)', 'درجة الاختبار (٠-١٠٠)')}</span>
                  <Input type="number" inputMode="numeric" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} dir="ltr" />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" isLoading={busy} disabled={score === ''} onClick={() => act('test', { score: Number(score), passed: true })}>{t('Test passed', 'نجح في الاختبار')}</Button>
                  <Button size="sm" variant="ghost" isLoading={busy} disabled={score === ''} onClick={() => act('test', { score: Number(score), passed: false })}>{t('Not yet', 'لسه')}</Button>
                  <Button size="sm" variant="outline" isLoading={busy} onClick={() => act('observed', { passed: !current.observed_passed_at })}>
                    {current.observed_passed_at ? t('Undo observed lesson', 'إلغاء الحصة المحضورة') : t('Observed lesson passed', 'نجح في الحصة المحضورة')}
                  </Button>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {current?.status !== 'licensed' && <Button size="sm" isLoading={busy} onClick={() => act('license')}>{t('Grant the subject now', 'ادّيله المادة دلوقتي')}</Button>}
              {!current && <Button size="sm" variant="outline" isLoading={busy} onClick={() => act('start')}>{t('Open a track', 'افتح له مسار')}</Button>}
              {current && <Button size="sm" variant="ghost" isLoading={busy} onClick={() => act('revoke')}>{t('Remove', 'شيلها')}</Button>}
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
