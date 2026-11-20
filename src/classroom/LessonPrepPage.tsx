import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileUp, NotebookPen, Trash2, Video } from 'lucide-react';
import { useT } from '../lib/language';
import { dashboardFetch } from '../dashboard/lib/dashboardApi';
import { lessonRoomClient } from '../lib/supabase';
import { ROOM_OPENS_MIN } from '../lib/roomWindow';
import { useNowTick } from '../student/components/LessonDayCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { BrandLoader } from '../components/ui/BrandLoader';
import { confirmAction } from '../components/ui/Feedback';
import { TeacherCurriculum } from './parts/Curriculum';
import type { RoomState } from '../lib/roomEvents';

type Slide = { track: string; number: number; page: number };
type PrepFile = { fileId: string; name: string; url: string | null };
type Prep = {
  lesson: { id: string; startsAt: string; hardCloseAt: string; learnerName: string | null; learnerType: 'child' | 'adult' | null; serviceId: string | null; subjectLabel: { en: string; ar: string } | null; roomOpen: boolean };
  lastReport: Slide | null;
  prep: { notes: string; slide: Slide | null; files: PrepFile[] };
  serverNow: number;
};

const NOTES_MAX = 8000;
const SAVE_MS = 1200;

/**
 * BUILD-LIST 1.4: the teacher prepares a lesson before it starts (`/dashboard/prepare/:id`). The slides open at the
 * learner's place (or the slide chosen last time), files upload into the lesson's room folder, and private notes save
 * as they are typed. All of it is waiting in the room; "Join the room" opens once the room window does.
 */
export default function LessonPrepPage() {
  const { t, isAr } = useT();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const now = useNowTick(20_000).getTime();
  const [data, setData] = useState<Prep | null>(null);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [notesState, setNotesState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');
  const base = `/api/dashboard/classroom/${encodeURIComponent(id)}/prep`;
  const skew = useRef(0);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedNotes = useRef('');

  const load = useCallback(async () => {
    try {
      const d = await dashboardFetch<Prep>(base);
      skew.current = d.serverNow - Date.now();
      setData(d);
      return d;
    } catch (e: any) {
      setError(e?.message || t('This lesson could not be opened.', 'الحصة دي ما فتحتش.'));
      return null;
    }
  }, [base]);

  useEffect(() => { load().then((d) => { if (d) { setNotes(d.prep.notes); savedNotes.current = d.prep.notes; } }); }, [load]);

  const saveNotes = useCallback(async (text: string) => {
    if (notesTimer.current) { clearTimeout(notesTimer.current); notesTimer.current = null; }
    if (text === savedNotes.current) return;
    setNotesState('saving');
    try {
      await dashboardFetch(base, { method: 'PUT', body: JSON.stringify({ notes: text }) });
      savedNotes.current = text;
      setNotesState('saved');
    } catch { setNotesState('error'); }
  }, [base]);
  const onNotes = (text: string) => {
    setNotes(text);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => void saveNotes(text), SAVE_MS);
  };
  // The slide the teacher stops on becomes the room's starting slide.
  const saveSlide = useCallback((s: RoomState) => {
    if (slideTimer.current) clearTimeout(slideTimer.current);
    slideTimer.current = setTimeout(() => {
      dashboardFetch(base, { method: 'PUT', body: JSON.stringify({ slide: { track: s.track, number: s.number, page: s.page } }) }).catch(() => { /* the next page turn saves again */ });
    }, 800);
  }, [base]);
  useEffect(() => () => { if (slideTimer.current) clearTimeout(slideTimer.current); }, []);
  const noop = useCallback(() => {}, []);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setFileError('');
    try {
      const { fileId, path, token } = await dashboardFetch<{ fileId: string; path: string; token: string }>(`${base}/files/upload-url`, {
        method: 'POST', body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      const { error: upErr } = await lessonRoomClient().storage.from('classroom-files').uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      await dashboardFetch(`${base}/files/${encodeURIComponent(fileId)}/confirm`, { method: 'POST', body: JSON.stringify({ name: file.name }) });
      await load();
    } catch (e: any) {
      setFileError(e?.message || t('The file could not be added.', 'الملف ما اتضافش.'));
    } finally { setUploading(false); }
  };
  const remove = async (f: PrepFile) => {
    if (!(await confirmAction(t(`Remove "${f.name}"?`, `نشيل "${f.name}"؟`), { confirmLabel: t('Remove', 'شيله'), danger: true }))) return;
    try { await dashboardFetch(`${base}/files/${encodeURIComponent(f.fileId)}`, { method: 'DELETE' }); await load(); }
    catch (e: any) { setFileError(e?.message || t('The file could not be removed.', 'الملف ما اتشالش.')); }
  };

  if (error) {
    return (
      <div className="mx-auto grid max-w-md gap-3 px-4 py-16 text-center">
        <p role="alert" className="text-base font-semibold text-foreground">{error}</p>
        <Link to="/dashboard" className="text-sm text-teal underline underline-offset-4">{t('Back to my lessons', 'رجوع لحصصي')}</Link>
      </div>
    );
  }
  if (!data) return <div className="grid min-h-[60vh] place-items-center"><BrandLoader size="md" /></div>;

  const { lesson } = data;
  const serverNow = now + skew.current;
  const start = Date.parse(lesson.startsAt);
  const open = serverNow >= start - ROOM_OPENS_MIN * 60_000 && serverNow < Date.parse(lesson.hardCloseAt);
  const learner = lesson.learnerName || t('the learner', 'الطالب');
  const subject = lesson.subjectLabel ? (isAr ? lesson.subjectLabel.ar : lesson.subjectLabel.en) : null;
  const when = new Date(start).toLocaleString(isAr ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const initial = data.prep.slide ? { ...data.prep.slide, step: 0 } : undefined;

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <Link to="/dashboard" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />{t('My lessons', 'حصصي')}
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">
            {subject ? t(`Prepare: ${subject} with ${learner}`, `تحضير: ${subject} مع ${learner}`) : t(`Prepare the lesson with ${learner}`, `تحضير حصة ${learner}`)}
          </h1>
          <p className="text-sm text-muted-foreground">{when}</p>
        </div>
        <div className="grid justify-items-end gap-1">
          <Button size="lg" disabled={!open} onClick={() => navigate(`/dashboard/room/${encodeURIComponent(lesson.id)}`)}>
            <Video className="me-2 h-5 w-5" aria-hidden="true" />{t('Join the room', 'ادخل الغرفة')}
          </Button>
          {!open && <p className="text-xs text-muted-foreground">{t(`The room opens ${ROOM_OPENS_MIN} min before the lesson.`, `الغرفة بتفتح قبل الحصة بـ${ROOM_OPENS_MIN} دقايق.`)}</p>}
        </div>
      </header>

      <p className="text-sm text-muted-foreground">
        {t('Everything you prepare here is waiting in the room: the slide you stop on opens first, your files are in the File tab, and your notes are for you only.',
          'كل اللي هتحضّره هنا هيستناك في الغرفة: آخر شريحة توقف عليها هتفتح الأول، والملفات في تبويب "ملف"، والملاحظات ليك انت بس.')}
      </p>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="h-[70vh] min-h-[28rem] overflow-hidden p-3">
          <TeacherCurriculum initial={initial} start={{ serviceId: lesson.serviceId, learnerType: lesson.learnerType, lastReport: data.lastReport }}
            publish={noop} publishInk={noop} save={saveSlide} />
        </Card>

        <div className="grid content-start gap-5">
          <Card className="grid gap-3 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><FileUp className="h-4 w-4 text-accent" aria-hidden="true" />{t('Files for this lesson', 'ملفات الحصة')}</h2>
            {data.prep.files.length > 0 ? (
              <ul className="grid gap-2">
                {data.prep.files.map((f) => (
                  <li key={f.fileId} className="flex items-center justify-between gap-2 rounded-xl border border-border p-2 text-sm">
                    {f.url ? <a href={f.url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-teal underline underline-offset-4">{f.name}</a> : <span className="min-w-0 truncate">{f.name}</span>}
                    <Button type="button" size="icon" variant="ghost" aria-label={t(`Remove ${f.name}`, `شيل ${f.name}`)} onClick={() => remove(f)}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">{t('No files yet. Add a PDF or a picture to show in the lesson.', 'مفيش ملفات لسه. ضيف PDF أو صورة تعرضها في الحصة.')}</p>}
            <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 justify-self-start rounded-xl border border-border px-4 text-sm font-medium text-teal hover:bg-surface-subtle focus-within:outline focus-within:outline-2 focus-within:outline-[var(--focus)] ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
              <FileUp className="h-4 w-4" aria-hidden="true" />{uploading ? t('Adding…', 'بنضيف…') : t('Add a PDF or picture', 'ضيف PDF أو صورة')}
              <input type="file" accept="application/pdf,image/png,image/jpeg" className="sr-only" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
            {fileError && <p role="alert" className="text-sm text-destructive">{fileError}</p>}
          </Card>

          <Card className="grid gap-2 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <NotebookPen className="h-4 w-4 text-accent" aria-hidden="true" /><label htmlFor="prep-notes">{t('My notes', 'ملاحظاتي')}</label>
            </h2>
            <p className="text-xs text-muted-foreground">{t('Only you see these, here and in the room.', 'انت بس اللي بتشوفها، هنا وفي الغرفة.')}</p>
            <Textarea id="prep-notes" rows={8} dir="auto" maxLength={NOTES_MAX} value={notes} onChange={(e) => onNotes(e.target.value)} onBlur={() => void saveNotes(notes)}
              placeholder={t('What to revise, what to ask, what to watch for…', 'هتراجع إيه، هتسأل إيه، هتركز على إيه…')} />
            <p role="status" className="text-xs text-muted-foreground">
              {notesState === 'saving' ? t('Saving…', 'بيتحفظ…') : notesState === 'saved' ? t('Saved', 'اتحفظ') : notesState === 'error' ? t('Not saved yet. Your notes are still here.', 'ما اتحفظش لسه. ملاحظاتك لسه هنا.') : t('Saves as you type', 'بيتحفظ وانت بتكتب')}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
