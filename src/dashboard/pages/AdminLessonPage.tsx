import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { BrandLoader } from '../../components/ui/BrandLoader';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

type SideTime = { at: string; event: string; source: string };
type Quality = { side: string; precheck_720: boolean | null; start_height: number | null; min_height: number | null; degraded_seconds: number; audio_only_seconds: number; reconnects: number; focus_away_seconds: number };
type View = {
  lesson: { id: string; referenceCode: string | null; learnerName: string | null; teacherName: string | null; serviceId: string | null; bookingType: string | null; status: string; notHeldReason: string | null; scheduledStart: string; scheduledEnd: string | null; durationMinutes: number | null };
  attendance: { togetherMinutes: number; requiredMinutes: number; held: boolean; joins: { teacher: number; student: number }; unstable: string | null; teacher: SideTime[]; student: SideTime[] };
  verdict: { verdict: string; reason: string; trigger: string; applied: boolean; decided_at: string } | null;
  lateness: { late_minutes: number; reason: string | null; status: string; admin_note: string | null } | null;
  earlyEnd: Array<{ at: string; minutesEarly: number; reason: string }>;
  quality: Quality[];
  incidents: Array<{ kind: string; side: string; created_at: string }>;
  adminObservations: Array<{ admin_user_id: string; started_at: string; ended_at: string | null; notes: string | null }>;
  guardianObservations: Array<{ userId: string; lastEnteredAt: string }>;
  rating: { rating: number; comment: string | null; created_at: string } | null;
  sharedFiles: string[];
  timeline: Array<{ at: string; type: string; by: string; payload: any }>;
};

const VERDICT: Record<string, { en: string; ar: string }> = {
  completed: { en: 'Completed (held)', ar: 'اتعملت' },
  learner_no_show: { en: 'Learner no-show', ar: 'الطالب ما حضرش' },
  teacher_no_show: { en: 'Teacher no-show', ar: 'المعلم ما حضرش' },
  review: { en: 'Needs your decision', ar: 'محتاجة قرارك' },
};

/** Classroom 3.5 (super admin): one lesson as the room saw it. Read-only; decisions stay on the booking and late-reason pages. */
export default function AdminLessonPage() {
  const { id } = useParams();
  const { t, isAr } = useT();
  const L = (x: { en: string; ar: string }) => (isAr ? x.ar : x.en);
  const [view, setView] = useState<View | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setView(null); setFailed(false);
    dashboardFetch<View>(`/api/admin/lessons/${id}`).then(setView).catch(() => setFailed(true));
  }, [id]);

  const time = (iso: string | null | undefined) => (iso ? DateTime.fromISO(iso).setLocale(isAr ? 'ar' : 'en').toFormat('d LLL, HH:mm:ss') : '—');
  const clock = (iso: string) => DateTime.fromISO(iso).toFormat('HH:mm:ss');
  const describe = (r: View['timeline'][number]): string => {
    const p = r.payload || {};
    switch (r.type) {
      case 'slide': return t(`Slide: ${p.state?.track} lesson ${p.state?.number}, page ${(p.state?.page ?? 0) + 1}${p.state?.inked ? ' (pen used)' : ''}`, `شريحة: ${p.state?.track} الدرس ${p.state?.number}، صفحة ${(p.state?.page ?? 0) + 1}${p.state?.inked ? ' (بالقلم)' : ''}`);
      case 'pdf': return t(`File shown, page ${(p.page ?? 0) + 1}`, `ملف معروض، صفحة ${(p.page ?? 0) + 1}`);
      case 'layout': return t(`Layout: ${p.mode}${p.pane ? ` (${p.pane})` : ''}`, `الشكل: ${p.mode}${p.pane ? ` (${p.pane})` : ''}`);
      case 'reaction': return t(`Learner reaction: ${p.kind}`, `تفاعل الطالب: ${p.kind}`);
      case 'focus': return p.away ? t('Learner left the tab', 'الطالب ساب الصفحة') : t('Learner came back', 'الطالب رجع');
      case 'quality': return t(`Connection (${p.side}): ${p.link}, layer ${p.layer}`, `الاتصال (${p.side}): ${p.link}، طبقة ${p.layer}`);
      case 'end': return p.early ? t(`Ended ${p.minutesEarly} min early: ${p.reason}`, `خلصت بدري ${p.minutesEarly} دقيقة: ${p.reason}`) : t('Teacher ended the lesson', 'المعلم أنهى الحصة');
      case 'talk': return t('Talk time summary', 'ملخص وقت الكلام') + ` ${JSON.stringify(p)}`;
      default: return r.type;
    }
  };

  if (failed) return <p role="alert" className="p-6 text-crimson">{t('Could not load this lesson.', 'ماقدرناش نحمّل الحصة دي.')}</p>;
  if (!view) return <div className="grid place-items-center p-10"><BrandLoader size="md" /></div>;
  const { lesson, attendance: a } = view;

  const Side = ({ label, rows }: { label: string; rows: SideTime[] }) => (
    <div>
      <p className="font-semibold text-foreground">{label}</p>
      {rows.length ? (
        <ul className="text-sm text-muted-foreground tabular-nums">
          {rows.map((r, i) => <li key={i}>{clock(r.at)} · {r.event === 'joined' ? t('joined', 'دخل') : t('left', 'خرج')}{r.source !== 'room' ? ` (${r.source})` : ''}</li>)}
        </ul>
      ) : <p className="text-sm text-muted-foreground">{t('Never joined', 'ما دخلش')}</p>}
    </div>
  );

  return (
    <div className="space-y-4 pb-12">
      <Link to="/dashboard/bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />{t('Bookings', 'الحجوزات')}
      </Link>
      <header>
        <h1 className="text-2xl font-editorial font-bold text-foreground">{lesson.learnerName || t('Lesson', 'حصة')} · {lesson.teacherName || '—'}</h1>
        <p className="text-sm text-muted-foreground">{time(lesson.scheduledStart)} · {lesson.durationMinutes} {t('min', 'دقيقة')} · {lesson.referenceCode} · {lesson.status}{lesson.notHeldReason ? ` (${lesson.notHeldReason})` : ''}</p>
      </header>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-foreground">{t('Attendance', 'الحضور')}</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {view.verdict ? <Badge variant={view.verdict.verdict === 'review' ? 'warning' : 'default'}>{L(VERDICT[view.verdict.verdict] || { en: view.verdict.verdict, ar: view.verdict.verdict })}</Badge>
            : <Badge variant="outline">{t('No automatic verdict', 'مفيش قرار تلقائي')}</Badge>}
          {view.verdict && <span className="text-muted-foreground">{view.verdict.reason} · {view.verdict.trigger === 'end' ? t('when the teacher ended', 'لما المعلم أنهى') : t('after the room closed', 'بعد ما الغرفة اتقفلت')} · {time(view.verdict.decided_at)}</span>}
        </div>
        <p className="text-sm text-foreground">{t(`Together ${a.togetherMinutes} of ${a.requiredMinutes} min needed`, `مع بعض ${a.togetherMinutes} من ${a.requiredMinutes} دقيقة مطلوبة`)} · {t(`joins: teacher ${a.joins.teacher}, learner ${a.joins.student}`, `مرات الدخول: المعلم ${a.joins.teacher}، الطالب ${a.joins.student}`)}{a.unstable ? ` · ${t('unstable', 'غير مستقر')}: ${a.unstable}` : ''}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Side label={t('Teacher', 'المعلم')} rows={a.teacher} />
          <Side label={t('Learner', 'الطالب')} rows={a.student} />
        </div>
      </Card>

      <Card className="p-4 space-y-2 text-sm">
        <h2 className="font-semibold text-foreground">{t('Lateness and early end', 'التأخير والإنهاء بدري')}</h2>
        {view.lateness ? <p>{t(`Teacher ${view.lateness.late_minutes} min late`, `المعلم اتأخر ${view.lateness.late_minutes} دقيقة`)} · {view.lateness.status}{view.lateness.reason ? `: “${view.lateness.reason}”` : ''}{view.lateness.admin_note ? ` · ${view.lateness.admin_note}` : ''}</p>
          : <p className="text-muted-foreground">{t('No lateness recorded.', 'مفيش تأخير.')}</p>}
        {view.earlyEnd.length ? view.earlyEnd.map((e, i) => <p key={i}>{t(`Ended ${e.minutesEarly} min early: `, `خلصت بدري ${e.minutesEarly} دقيقة: `)}“{e.reason}”</p>)
          : <p className="text-muted-foreground">{t('Not ended early.', 'ما خلصتش بدري.')}</p>}
      </Card>

      <Card className="p-4 space-y-2 text-sm">
        <h2 className="font-semibold text-foreground">{t('Connection quality', 'جودة الاتصال')}</h2>
        {view.quality.length ? view.quality.map((q) => (
          <p key={q.side}>{q.side === 'teacher' ? t('Teacher', 'المعلم') : t('Learner', 'الطالب')}: {t('720p check', 'فحص 720p')} {q.precheck_720 == null ? '—' : q.precheck_720 ? '✓' : '✗'} · {t('start', 'البداية')} {q.start_height ?? '—'}p · {t('lowest', 'أقل')} {q.min_height ?? '—'}p · {t('degraded', 'ضعيف')} {Math.round(q.degraded_seconds / 60)}m · {t('audio only', 'صوت بس')} {Math.round(q.audio_only_seconds / 60)}m · {t('reconnects', 'إعادة اتصال')} {q.reconnects} · {t('away', 'بعيد')} {Math.round(q.focus_away_seconds / 60)}m</p>
        )) : <p className="text-muted-foreground">{t('No quality data.', 'مفيش بيانات جودة.')}</p>}
        {view.incidents.length > 0 && <p>{t('Incidents: ', 'مشاكل: ')}{view.incidents.map((i) => `${i.kind} (${i.side}, ${clock(i.created_at)})`).join(' · ')}</p>}
      </Card>

      <Card className="p-4 space-y-2 text-sm">
        <h2 className="font-semibold text-foreground">{t('Observers and rating', 'المتابعين والتقييم')}</h2>
        {view.adminObservations.length ? view.adminObservations.map((o, i) => <p key={i}>{t('Admin visit', 'زيارة الإدارة')} {clock(o.started_at)}–{o.ended_at ? clock(o.ended_at) : '…'}{o.notes ? `: ${o.notes}` : ''}</p>)
          : <p className="text-muted-foreground">{t('No admin visit.', 'مفيش زيارة إدارة.')}</p>}
        {view.guardianObservations.length ? view.guardianObservations.map((g, i) => <p key={i}>{t('Guardian watched (last entry ', 'ولي الأمر تابع (آخر دخول ')}{clock(g.lastEnteredAt)})</p>)
          : <p className="text-muted-foreground">{t('No guardian watched.', 'ولي الأمر ما تابعش.')}</p>}
        {view.rating ? <p>{t('Rating', 'التقييم')}: {'★'.repeat(view.rating.rating)}{'☆'.repeat(5 - view.rating.rating)}{view.rating.comment ? ` · “${view.rating.comment}”` : ''}</p>
          : <p className="text-muted-foreground">{t('Not rated yet.', 'لسه ما اتقيّمتش.')}</p>}
        <p className="text-muted-foreground">{t(`Files sent with the report: ${view.sharedFiles.length}`, `ملفات اتبعتت مع التقرير: ${view.sharedFiles.length}`)}</p>
      </Card>

      <Card className="p-4 space-y-2">
        <h2 className="font-semibold text-foreground">{t('Timeline', 'الخط الزمني')}</h2>
        {view.timeline.length ? (
          <ol className="text-sm space-y-1 max-h-[32rem] overflow-auto">
            {view.timeline.map((r, i) => (
              <li key={i} className="flex gap-3"><span className="tabular-nums text-muted-foreground shrink-0" dir="ltr">{clock(r.at)}</span><span className="text-foreground">{describe(r)}</span></li>
            ))}
          </ol>
        ) : <p className="text-sm text-muted-foreground">{t('Nothing was recorded in the room.', 'مفيش حاجة اتسجلت في الغرفة.')}</p>}
      </Card>
    </div>
  );
}
