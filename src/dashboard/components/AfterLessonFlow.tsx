import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenCheck, CheckCircle2, Clock, GraduationCap, Library, User } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useT } from '../../lib/language';
import { dashboardFetch } from '../lib/dashboardApi';
import { PostLessonSummaryEditor } from './PostLessonSummaryEditor';
import { reportProfile, audienceOf } from '../../lib/subjectReport';
import { SUBJECTS, GROUPS } from '../../curriculum/catalog';
import type { DashboardLesson } from '../types';

/** Lessons whose curriculum step is still open, so the second window comes back until it is done. */
const PENDING_KEY = 'wz-pending-curriculum';
type Suggest = { track: string; number: number; fromPage: number; toPage: number };
type Pending = { bookingId: string; studentId: string; studentName: string; subject: string; age: number | null; suggest?: Suggest | null };

export function readPendingCurriculum(): Pending[] {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); } catch { return []; }
}
function writePending(list: Pending[]) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-20))); } catch { /* private mode */ }
}
export function clearPendingCurriculum(bookingId?: string | null, studentId?: string | null) {
  writePending(readPendingCurriculum().filter((p) => p.bookingId !== bookingId && (!studentId || p.studentId !== studentId)));
}

/**
 * Owner review 2026-11-09: a lesson that was held (Zoom shows teacher and student together long enough) needs its
 * report before anything else. Called by the Today page with its lessons.
 */
export function lessonNeedsReport(l: DashboardLesson, now = Date.now()): boolean {
  // Classroom 3.3: the room marked it completed by itself; the report is still the teacher's.
  if (l.status === 'completed' && l.report_due && l.student_id) return true;
  if (!['confirmed', 'rescheduled'].includes(String(l.status)) || !l.student_id) return false;
  const end = new Date(l.scheduled_end || l.scheduled_start).getTime();
  const seen = l.attendance;
  if (!seen) return false;
  // As soon as the teacher has left a held lesson, or once the lesson time is over and both came.
  return (seen.held && !seen.teacherIn) || (now > end && seen.teacher && seen.student && !seen.teacherIn);
}

/** Picks the curriculum version for the learner's age inside the subject's group. */
function defaultTrack(group: string | null, age: number | null): string {
  const tracks = SUBJECTS.filter((s) => s.group === group);
  if (!tracks.length) return '';
  const a = Number(age) || 0;
  const want = a && a < 12 ? /kid/i : a && a < 18 ? /teen|12/i : /adult|12|general/i;
  return (tracks.find((t) => want.test(t.id) || want.test(t.version)) || tracks[0]).id;
}

/** Step 2: where did you reach in the curriculum? Opens the lesson in "My curriculum" to record the slides. */
function CurriculumStep({ pending, onLater }: { pending: Pending; onLater: () => void }) {
  const { t, isAr } = useT();
  const navigate = useNavigate();
  const profile = reportProfile(pending.subject);
  const group = GROUPS.find((g) => g.id === profile.curriculumGroup) || null;
  const tracks = useMemo(() => SUBJECTS.filter((s) => s.group === group?.id), [group?.id]);
  const suggest = pending.suggest && tracks.some((tr) => tr.id === pending.suggest!.track) ? pending.suggest : null;
  const [track, setTrack] = useState(() => suggest?.track || defaultTrack(group?.id || null, pending.age));
  const [number, setNumber] = useState(suggest?.number || 1);

  // Start from the lesson after the last one reported for this learner (a room lesson starts from its own slides).
  useEffect(() => {
    if (suggest) return;
    dashboardFetch<{ map: Array<{ id: string; lessons: Array<{ number: number; complete: boolean; coveredPages: number[] }> }> }>(`/api/dashboard/curriculum/students/${pending.studentId}`)
      .then((d) => {
        const mine = (d?.map || []).find((s) => tracks.some((tr) => tr.id === s.id));
        if (!mine) return;
        setTrack(mine.id);
        const last = [...mine.lessons].filter((l) => l.coveredPages.length).sort((a, b) => b.number - a.number)[0];
        const built = tracks.find((tr) => tr.id === mine.id)?.lessons || {};
        if (last) setNumber(last.complete && built[last.number + 1] ? last.number + 1 : last.number);
      })
      .catch(() => {});
  }, [pending.studentId, tracks, suggest]);

  const entry = tracks.find((tr) => tr.id === track);
  const built = entry ? Object.keys(entry.lessons).map(Number).sort((a, b) => a - b) : [];
  const go = () => {
    if (!entry || !group) return;
    const pages = suggest && suggest.track === entry.id && suggest.number === number ? `&from=${suggest.fromPage}&to=${suggest.toPage}` : '';
    navigate(`/dashboard/curriculum/${group.id}/${entry.id}/${number}?student=${encodeURIComponent(pending.studentId)}&booking=${encodeURIComponent(pending.bookingId)}${pages}`);
    onLater();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-teal/30 bg-teal/10 p-4">
        <CheckCircle2 className="w-5 h-5 text-teal shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-foreground">
          {t(`Report saved. Now mark how far you got in the curriculum with ${pending.studentName}: the pages you covered open for them, and their homework is made from exactly those pages.`,
            `التقرير اتحفظ. فاضل تحدد وصلت لفين في المنهج مع ${pending.studentName}: الصفحات اللي خدتوها بتتفتح له، والواجب بيتعمل منها هي بس.`)}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-foreground">{t('Curriculum', 'المنهج')}</span>
          <Select value={track} onChange={(e) => { setTrack(e.target.value); setNumber(1); }}>
            {tracks.map((tr) => <option key={tr.id} value={tr.id}>{isAr ? tr.titleAr : tr.title}</option>)}
          </Select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-foreground">{t('Lesson', 'الدرس')}</span>
          <Select value={String(number)} onChange={(e) => setNumber(Number(e.target.value))}>
            {built.map((n) => <option key={n} value={n}>{`${n}. ${isAr ? entry!.lessons[n].titleAr : entry!.lessons[n].title}`}</option>)}
          </Select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={go} disabled={!entry || !built.length}>
          <Library className="w-4 h-4 me-2" aria-hidden="true" />
          {t('Open the lesson and mark the pages', 'افتح الدرس وحدد الصفحات')}
        </Button>
        <span className="text-xs text-muted-foreground">{t('This window comes back until the pages are saved.', 'الشاشة دي هترجع لحد ما تحفظ الصفحات.')}</span>
      </div>
    </div>
  );
}


type DraftFile = { fileId: string; kind: 'pdf' | 'image'; shared: boolean; name?: string | null };
export type ReportDraft = {
  curriculum: Suggest | null;
  lessons: Array<{ track: string; number: number; title: string | null; seconds: number; pages: Array<{ page: number; seconds: number; inked: boolean; taught: boolean }> }>;
  files: DraftFile[];
  reactions: Record<string, number>;
  talk: Record<string, number> | null;
  /** Classroom 2.10: corrections logged in the room and the learner's understanding checks (older drafts lack them). */
  corrections?: Array<{ said: string; correct: string; note: string | null }>;
  checks?: Array<{ part: string; level: 'green' | 'amber' | 'red' }>;
  earlyEnd: { minutesEarly: number; reason: string } | null;
};
const CHECK_LABELS: Record<string, { en: string; ar: string }> = {
  green: { en: 'understood', ar: 'فاهم' }, amber: { en: 'partly', ar: 'نص نص' }, red: { en: 'not yet', ar: 'لسه' },
};

const REACTION_LABELS: Record<string, { en: string; ar: string }> = {
  hand: { en: 'raised a hand', ar: 'رفع إيده' }, confused: { en: 'confused', ar: 'مش فاهم' }, slower: { en: 'slower please', ar: 'أبطأ شوية' },
  repeat: { en: 'repeat please', ar: 'عيد تاني' }, thinking: { en: 'thinking', ar: 'بيفكر' },
};
const mins = (sec: number) => Math.max(0, Math.round(sec / 60));

/** Classroom 3.3: what the room saw, for the teacher to check before writing. Files ticked here go to the family. */
function ReportDraftPanel({ draft, picked, onPick }: { draft: ReportDraft; picked: string[]; onPick: (ids: string[]) => void }) {
  const { t, isAr } = useT();
  const L = (x: { en: string; ar: string }) => (isAr ? x.ar : x.en);
  const covered = draft.curriculum;
  const lesson = covered ? draft.lessons.find((l) => l.track === covered.track && l.number === covered.number) : null;
  const subject = covered ? SUBJECTS.find((s) => s.id === covered.track) : null;
  const reactions = Object.entries(draft.reactions);
  // The room saves talk time in ms (teacherMs, learnerMs); older drafts used seconds.
  const secs = (s?: number, ms?: number) => (typeof s === 'number' ? s : typeof ms === 'number' ? ms / 1000 : undefined);
  const talkTeacher = secs(draft.talk?.teacherSeconds, draft.talk?.teacherMs);
  const talkLearner = secs(draft.talk?.learnerSeconds ?? draft.talk?.studentSeconds, draft.talk?.learnerMs);
  return (
    <section className="rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4 space-y-3 text-sm" aria-label={t('What the room saw', 'اللي الغرفة سجّلته')}>
      <p className="font-semibold text-foreground">{t('From the lesson room (check it, then write your report)', 'من غرفة الحصة (راجعه وبعدين اكتب تقريرك)')}</p>
      {covered && subject ? (
        <p className="text-foreground">
          {t('Slides covered: ', 'الشرائح اللي اتشرحت: ')}
          <span className="font-semibold">{isAr ? subject.titleAr : subject.title} · {t(`lesson ${covered.number}`, `الدرس ${covered.number}`)}{lesson?.title ? ` (${lesson.title})` : ''} · {t(`pages ${covered.fromPage} to ${covered.toPage}`, `من صفحة ${covered.fromPage} لصفحة ${covered.toPage}`)}</span>
          <span className="block text-xs text-muted-foreground">{t('A page counts when it stayed 20 seconds or more, or you drew on it. You can change it in the next step.', 'الصفحة بتتحسب لو فضلت 20 ثانية أو أكتر، أو كتبت عليها بالقلم. تقدر تغيّرها في الخطوة الجاية.')}</span>
        </p>
      ) : (
        <p className="text-muted-foreground">{t('No curriculum slides were taught long enough to suggest a range.', 'مفيش شرائح منهج اتشرحت وقت كفاية عشان نقترح صفحات.')}</p>
      )}
      {draft.files.length > 0 && (
        <fieldset className="space-y-1.5">
          <legend className="font-semibold text-foreground">{t('Files from the lesson (ticked ones go to the family with the report)', 'ملفات الحصة (اللي متعلّم عليها بتوصل للأسرة مع التقرير)')}</legend>
          {draft.files.map((f, i) => (
            <label key={f.fileId} className="flex items-center gap-2 min-h-[36px]">
              <input type="checkbox" className="h-4 w-4 accent-[var(--teal)]" checked={picked.includes(f.fileId)}
                onChange={(e) => onPick(e.target.checked ? [...picked, f.fileId] : picked.filter((x) => x !== f.fileId))} />
              <span>{f.name || (f.kind === 'pdf' ? t(`PDF ${i + 1}`, `ملف PDF ${i + 1}`) : t(`Picture ${i + 1}`, `صورة ${i + 1}`))}</span>
            </label>
          ))}
        </fieldset>
      )}
      {typeof talkTeacher === 'number' && typeof talkLearner === 'number' && (
        <p className="text-foreground">{t(`Talk time: you ${mins(talkTeacher)} min, the learner ${mins(talkLearner)} min`, `وقت الكلام: إنت ${mins(talkTeacher)} دقيقة، والطالب ${mins(talkLearner)} دقيقة`)}</p>
      )}
      {reactions.length > 0 && (
        <p className="text-foreground">{t('Reactions: ', 'التفاعلات: ')}{reactions.map(([k, n]) => `${REACTION_LABELS[k] ? L(REACTION_LABELS[k]) : k} ×${n}`).join(' · ')}</p>
      )}
      {!!draft.corrections?.length && (
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{t('Corrections in the lesson (saved to the learner’s mistake bank)', 'التصحيحات في الحصة (اتحفظت في بنك أخطاء الطالب)')}</p>
          <ul className="space-y-0.5 text-foreground">
            {draft.corrections.map((c, i) => (
              <li key={i}><bdi className="line-through decoration-muted-foreground/60">{c.said}</bdi> → <bdi className="font-semibold">{c.correct}</bdi>{c.note ? <span className="text-muted-foreground"> · {c.note}</span> : null}</li>
            ))}
          </ul>
        </div>
      )}
      {!!draft.checks?.length && (
        <p className="text-foreground">{t('Understanding checks: ', 'أسئلة الفهم: ')}{draft.checks.map((c) => `${c.part || t('lesson', 'الدرس')}: ${L(CHECK_LABELS[c.level])}`).join(' · ')}</p>
      )}
      {draft.earlyEnd && (
        <p className="text-muted-foreground">{t(`Ended ${draft.earlyEnd.minutesEarly} min early: `, `خلصت بدري ${draft.earlyEnd.minutesEarly} دقيقة: `)}{draft.earlyEnd.reason}</p>
      )}
    </section>
  );
}

/**
 * The after-lesson window (owner review 2026-11-09). Step 1: the lesson report, in the subject's and the learner's
 * own words; it can't be closed without saving. Step 2: the curriculum pages covered, which open the pages for the
 * learner and make their homework.
 */
export function AfterLessonFlow({ lesson, pending, onDone }: { lesson: DashboardLesson | null; pending: Pending | null; onDone: () => void }) {
  const { t, isAr } = useT();
  const [student, setStudent] = useState<{ age: number | null; learner_type: string | null; current_level: string | null } | null>(null);
  const [step2, setStep2] = useState<Pending | null>(pending);
  const studentId = String(lesson?.student_id || lesson?.studentId || '');

  useEffect(() => { setStep2(pending); }, [pending]);
  // 3.3: the room's draft for this lesson (null for a lesson that never used the room).
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  useEffect(() => {
    setDraft(null);
    if (!lesson?.id) return;
    dashboardFetch<{ draft: ReportDraft | null }>(`/api/dashboard/bookings/${lesson.id}/report-draft`)
      .then((d) => { setDraft(d?.draft || null); setPicked((d?.draft?.files || []).map((f) => f.fileId)); })
      .catch(() => setDraft(null));
  }, [lesson?.id]);
  useEffect(() => {
    if (!studentId) return;
    dashboardFetch<any>(`/api/dashboard/students/${studentId}`)
      .then((d) => setStudent({ age: d?.student?.age ?? null, learner_type: d?.student?.learner_type ?? null, current_level: d?.student?.current_level ?? null }))
      .catch(() => setStudent({ age: null, learner_type: null, current_level: null }));
  }, [studentId]);

  const open = Boolean(lesson || step2);
  if (!open) return null;

  const name = lesson?.learner_name || step2?.studentName || t('the student', 'الطالب');
  const subject = String(lesson?.service_id || lesson?.service_name || step2?.subject || '');
  const profile = reportProfile(subject);
  const audience = audienceOf(student?.age, student?.learner_type);
  const audienceLabel = audience === 'child' ? t('Child · the parent reads the report', 'طفل · ولي الأمر بيقرا التقرير')
    : audience === 'teen' ? t('Teen · reads it with the family', 'مراهق · بيقراه مع أسرته') : t('Adult learner', 'طالب بالغ');

  const finishReport = async () => {
    if (!lesson) return;
    try {
      if (lesson.status !== 'completed') await dashboardFetch(`/api/dashboard/bookings/${lesson.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) });
    } catch { /* the report is saved; the lesson row shows what is left */ }
    // The files the teacher kept ticked reach the family with the report.
    if (draft?.files.length) {
      try {
        await dashboardFetch(`/api/dashboard/bookings/${lesson.id}/report-files`, { method: 'POST', body: JSON.stringify({ fileIds: picked }) });
      } catch { /* the report itself is saved */ }
    }
    const next: Pending = { bookingId: lesson.id, studentId, studentName: name.split(/\s+/)[0], subject, age: student?.age ?? null, suggest: draft?.curriculum || null };
    if (profile.curriculumGroup) {
      writePending([...readPendingCurriculum().filter((p) => p.bookingId !== lesson.id), next]);
      setStep2(next);
    } else {
      onDone();
    }
  };

  const later = () => { setStep2(null); onDone(); };

  return (
    <Modal
      isOpen={open}
      onClose={() => { /* required: closes only by finishing */ }}
      hideCloseButton
      maxWidth="3xl"
      title={step2
        ? <span className="flex items-center gap-2"><BookOpenCheck className="w-5 h-5 text-teal" />{t('Where did you reach in the curriculum?', 'وصلتوا لفين في المنهج؟')}</span>
        : <span className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" />{t('The lesson is done. Its report, please', 'الحصة خلصت، تقريرها لو سمحت')}</span>}
    >
      {lesson && !step2 ? (
        <div className="space-y-4">
          {/* Who the lesson was with: the learner, their audience, the subject they booked. No attendance times here. */}
          <div className="grid sm:grid-cols-3 gap-2 text-sm">
            <div className="rounded-xl border border-border-subtle glass-surface p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><User className="w-3.5 h-3.5" />{t('Learner', 'الطالب')}</div>
              <div className="font-semibold text-foreground">{name}{student?.age ? <span className="text-muted-foreground font-normal"> · {t(`${student.age} yrs`, `${student.age} سنة`)}</span> : null}</div>
              <div className="text-xs text-muted-foreground">{audienceLabel}</div>
            </div>
            <div className="rounded-xl border border-border-subtle glass-surface p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><Library className="w-3.5 h-3.5" />{t('Subject booked', 'المادة المحجوزة')}</div>
              <div className="font-semibold text-foreground">{isAr ? profile.name.ar : profile.name.en}</div>
              {student?.current_level && <div className="text-xs text-muted-foreground capitalize">{student.current_level}</div>}
            </div>
            <div className="rounded-xl border border-border-subtle glass-surface p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><Clock className="w-3.5 h-3.5" />{t('Lesson', 'الحصة')}</div>
              <div className="font-semibold text-foreground">{lesson.duration_minutes} {t('min', 'دقيقة')}</div>
              <div className="text-xs text-teal font-semibold">{t('Held ✓', 'اتعملت ✓')}</div>
            </div>
          </div>
          {draft && <ReportDraftPanel draft={draft} picked={picked} onPick={setPicked} />}
          {student && (
            <PostLessonSummaryEditor
              studentId={studentId}
              studentName={name}
              bookingId={lesson.id}
              subjectHint={subject}
              learnerAge={student.age}
              learnerType={student.learner_type}
              submitLabel={profile.curriculumGroup ? t('Save and go to the curriculum', 'احفظ وكمّل للمنهج') : t('Save the report', 'احفظ التقرير')}
              onSaved={finishReport}
            />
          )}
        </div>
      ) : step2 ? (
        <CurriculumStep pending={step2} onLater={later} />
      ) : null}
    </Modal>
  );
}
