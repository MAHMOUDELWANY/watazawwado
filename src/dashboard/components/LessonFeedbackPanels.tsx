import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { Star } from 'lucide-react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

/** ST-02: a teacher's own average from families, over finished months with 5+ ratings each (single ratings stay with the admin). */
export function TeacherRatingNote() {
  const { t } = useT();
  const [d, setD] = useState<{ count: number; average: number | null; minimum: number } | null>(null);
  useEffect(() => { dashboardFetch<typeof d>('/api/dashboard/me/lesson-feedback').then(setD).catch(() => {}); }, []);
  if (!d || d.average == null) return null;
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="teacher-rating">
      <Star className="w-4 h-4 fill-gold text-gold" aria-hidden="true" />
      {d.average != null
        ? t(`Families rate your lessons ${d.average} / 5 on average (${d.count} ratings, up to last month).`, `متوسط تقييم الأسر لدروسك ${d.average} من 5 (${d.count} تقييم لحد الشهر اللي فات).`)
        : null}
    </p>
  );
}

interface AdminFeedback {
  byTeacher: Array<{ teacherId: string; teacherName: string | null; count: number; average: number }>;
  items: Array<{ bookingId: string; learnerName: string | null; teacherName: string | null; rating: number; comment: string | null; createdAt: string }>;
}

/** ST-02: super admin view of ratings and comments after lessons. */
export function AdminLessonFeedback() {
  const { t, isAr } = useT();
  const [data, setData] = useState<AdminFeedback | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { dashboardFetch<AdminFeedback>('/api/dashboard/admin/lesson-feedback').then(setData).catch(() => setFailed(true)); }, []);

  return (
    <section className="p-6 rounded-2xl glass-card space-y-4" aria-labelledby="lesson-feedback-admin-title" data-testid="admin-lesson-feedback">
      <div>
        <h2 id="lesson-feedback-admin-title" className="text-lg font-display font-bold text-foreground">{t('After-lesson ratings', 'تقييمات بعد الدرس')}</h2>
        <p className="text-sm text-muted-foreground">{t('Only you see single ratings and comments. A teacher sees only an average over past months that each have 5+ ratings.', 'التقييمات والتعليقات دي ليك بس. المعلم بيشوف متوسط بس، من الشهور اللي خلصت وفي كل شهر 5 تقييمات أو أكتر.')}</p>
      </div>
      {failed ? (
        <p className="text-sm text-destructive" role="alert">{t('Could not load ratings.', 'معرفناش نحمّل التقييمات.')}</p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">{t('Loading…', 'بنحمّل…')}</p>
      ) : data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('No ratings yet.', 'لسه مفيش تقييمات.')}</p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-2">
            {data.byTeacher.map((b) => (
              <li key={b.teacherId} className="text-sm px-3 py-1.5 rounded-full bg-surface-subtle">
                {b.teacherName || t('Teacher', 'معلم')}: <strong>{b.average}</strong> / 5 · {b.count}
              </li>
            ))}
          </ul>
          <ul className="divide-y divide-border">
            {data.items.map((i) => (
              <li key={i.bookingId} className="py-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-foreground" aria-label={`${i.rating} / 5`}>{'★'.repeat(i.rating)}<span className="text-muted-foreground">{'★'.repeat(5 - i.rating)}</span></span>
                  <span>{i.learnerName || '—'}</span>
                  <span className="text-muted-foreground">{i.teacherName || ''}</span>
                  <span className="text-xs text-muted-foreground ms-auto">{DateTime.fromISO(i.createdAt).setLocale(isAr ? 'ar' : 'en').toFormat('d LLL yyyy')}</span>
                </div>
                {i.comment && <p className="mt-1 text-muted-foreground whitespace-pre-line">{i.comment}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

const QUESTIONS: Array<['explains' | 'patient' | 'onTime' | 'enjoys', string, string]> = [
  ['explains', 'Explains clearly', 'بيشرح بوضوح'],
  ['patient', 'Patient and kind', 'صبور وطيب'],
  ['onTime', 'On time', 'ملتزم بالمواعيد'],
  ['enjoys', 'Learners enjoy the lessons', 'الطلاب مبسوطين من الحصص'],
];
type Averages = Record<'explains' | 'patient' | 'onTime' | 'enjoys', number | null>;

/** Teacher questionnaire: the teacher's own averages per question (finished months with 5+ answers; no notes, no names). */
export function TeacherQuestionnaireNote() {
  const { t } = useT();
  const [d, setD] = useState<{ count: number; averages: Averages | null } | null>(null);
  useEffect(() => { dashboardFetch<typeof d>('/api/dashboard/me/teacher-ratings').then(setD).catch(() => {}); }, []);
  if (!d?.averages) return null;
  return (
    <section className="space-y-2 text-sm" data-testid="teacher-questionnaire">
      <p className="text-muted-foreground">{t(`What families say about you (${d.count} answers, up to last month):`, `رأي الأسر فيك (${d.count} إجابة لحد الشهر اللي فات):`)}</p>
      <ul className="grid grid-cols-2 gap-2">
        {QUESTIONS.map(([k, en, ar]) => (
          <li key={k} className="rounded-xl bg-surface-subtle px-3 py-2"><span className="text-muted-foreground">{t(en, ar)}</span> <strong className="tabular-nums text-foreground">{d.averages![k]}</strong> / 5</li>
        ))}
      </ul>
    </section>
  );
}

interface AdminTeacherRatings {
  byTeacher: Array<{ teacherId: string; teacherName: string | null; count: number } & Averages>;
  items: Array<{ learnerName: string | null; teacherName: string | null; lessonCount: number; note: string | null; submittedAt: string } & Averages>;
}

/** Super admin: every teacher questionnaire answer, with averages per teacher and the notes. */
export function AdminTeacherRatings() {
  const { t, isAr } = useT();
  const [data, setData] = useState<AdminTeacherRatings | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { dashboardFetch<AdminTeacherRatings>('/api/dashboard/admin/teacher-ratings').then(setData).catch(() => setFailed(true)); }, []);
  const scores = (a: Averages) => QUESTIONS.map(([k, en, ar]) => `${t(en, ar)} ${a[k] ?? '—'}`).join(' · ');
  return (
    <section className="p-6 rounded-2xl glass-card space-y-4" aria-labelledby="teacher-ratings-admin-title" data-testid="admin-teacher-ratings">
      <div>
        <h2 id="teacher-ratings-admin-title" className="text-lg font-display font-bold text-foreground">{t('Teacher questionnaire', 'استبيان المعلمين')}</h2>
        <p className="text-sm text-muted-foreground">{t('Families answer after the 4th lesson with a teacher, then every 8. Teachers see only averages from past months with 5+ answers.', 'الأسر بتجاوب بعد الحصة الرابعة مع المعلم، وبعدين كل 8 حصص. المعلم بيشوف متوسطات بس من الشهور اللي خلصت وفيها 5 إجابات أو أكتر.')}</p>
      </div>
      {failed ? <p className="text-sm text-destructive" role="alert">{t('Could not load the answers.', 'معرفناش نحمّل الإجابات.')}</p>
        : !data ? <p className="text-sm text-muted-foreground">{t('Loading…', 'بنحمّل…')}</p>
        : data.items.length === 0 ? <p className="text-sm text-muted-foreground">{t('No answers yet.', 'لسه مفيش إجابات.')}</p>
        : (
          <>
            <ul className="space-y-2">
              {data.byTeacher.map((b) => (
                <li key={b.teacherId} className="text-sm rounded-xl bg-surface-subtle px-3 py-2">
                  <strong>{b.teacherName || t('Teacher', 'معلم')}</strong> ({b.count}): <span className="text-muted-foreground">{scores(b)}</span>
                </li>
              ))}
            </ul>
            <ul className="divide-y divide-border">
              {data.items.map((i, n) => (
                <li key={n} className="py-3 text-sm space-y-1">
                  <div className="flex flex-wrap gap-x-3">
                    <span className="font-semibold text-foreground">{i.learnerName || '—'}</span>
                    <span className="text-muted-foreground">{i.teacherName || ''} · {t(`after ${i.lessonCount} lessons`, `بعد ${i.lessonCount} حصص`)}</span>
                    <span className="text-xs text-muted-foreground ms-auto">{DateTime.fromISO(i.submittedAt).setLocale(isAr ? 'ar' : 'en').toFormat('d LLL yyyy')}</span>
                  </div>
                  <p className="text-muted-foreground">{scores(i)}</p>
                  {i.note && <p className="whitespace-pre-line text-foreground" dir="auto">{i.note}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
    </section>
  );
}

interface AdminPlatform {
  count: number; dismissed: number; average: number | null; nps: number | null;
  items: Array<{ learnerName: string | null; title: string; titleAr: string; kind: 'part' | 'track'; recommend: number; liked: string | null; improve: string | null; createdAt: string }>;
}

/** Super admin: the survey after curriculum parts and tracks (0-10 recommend, likes, improvements). */
export function AdminPlatformRatings() {
  const { t, isAr } = useT();
  const [data, setData] = useState<AdminPlatform | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { dashboardFetch<AdminPlatform>('/api/dashboard/admin/platform-ratings').then(setData).catch(() => setFailed(true)); }, []);
  return (
    <section className="p-6 rounded-2xl glass-card space-y-4" aria-labelledby="platform-ratings-admin-title" data-testid="admin-platform-ratings">
      <div>
        <h2 id="platform-ratings-admin-title" className="text-lg font-display font-bold text-foreground">{t('Academy survey', 'استبيان الأكاديمية')}</h2>
        <p className="text-sm text-muted-foreground">{t('Asked when a learner finishes a curriculum part or a whole track.', 'بيتسأل لما الطالب يخلّص جزء من المنهج أو المنهج كله.')}</p>
      </div>
      {failed ? <p className="text-sm text-destructive" role="alert">{t('Could not load the answers.', 'معرفناش نحمّل الإجابات.')}</p>
        : !data ? <p className="text-sm text-muted-foreground">{t('Loading…', 'بنحمّل…')}</p>
        : data.count === 0 ? <p className="text-sm text-muted-foreground">{t('No answers yet.', 'لسه مفيش إجابات.')}</p>
        : (
          <>
            <p className="text-sm text-foreground">
              {t(`${data.count} answers · average ${data.average} / 10 · NPS ${data.nps} · ${data.dismissed} closed without answering`, `${data.count} إجابة · المتوسط ${data.average} من 10 · NPS ${data.nps} · ${data.dismissed} قفلوه من غير إجابة`)}
            </p>
            <ul className="divide-y divide-border">
              {data.items.map((i, n) => (
                <li key={n} className="py-3 text-sm space-y-1">
                  <div className="flex flex-wrap gap-x-3">
                    <strong className="tabular-nums text-foreground">{i.recommend}/10</strong>
                    <span className="text-foreground">{i.learnerName || '—'}</span>
                    <span className="text-muted-foreground">{i.kind === 'track' ? t('Track', 'المنهج كله') : t('Part', 'جزء')}: {isAr ? i.titleAr : i.title}</span>
                    <span className="text-xs text-muted-foreground ms-auto">{DateTime.fromISO(i.createdAt).setLocale(isAr ? 'ar' : 'en').toFormat('d LLL yyyy')}</span>
                  </div>
                  {i.liked && <p dir="auto"><span className="text-muted-foreground">{t('Likes: ', 'عاجبه: ')}</span>{i.liked}</p>}
                  {i.improve && <p dir="auto"><span className="text-muted-foreground">{t('Improve: ', 'يتحسن: ')}</span>{i.improve}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
    </section>
  );
}
