import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Baby, Globe, LogOut, Presentation, Video } from 'lucide-react';
import { authedJson } from '../lib/authedJson';
import { BrandLogo } from '../components/ui/BrandLogo';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { BrandLoader } from '../components/ui/BrandLoader';
import { ParentPinDialog } from './components/ParentPinDialog';
import { SingleLearnerScope } from './activeLearner';

/**
 * BUILD-LIST 1.6: "Hand to my child" on the parent's own device. The family portal turns into kid mode on this
 * device: only the child's learning pages and lesson room (the kid app's page set), no Watch button, no booking,
 * payments, messages or settings. Leaving kid mode needs the parent PIN. Kept in this browser's storage, so a reload
 * stays in kid mode. The server still refuses watching without the PIN proof.
 */
export type KidMode = { learnerId: string; name: string };
const KEY = 'wz-kid-mode';
const EVENT = 'wz-kid-mode-changed';

export function readKidMode(): KidMode | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    return v && typeof v.learnerId === 'string' && typeof v.name === 'string' ? v : null;
  } catch { return null; }
}
export function setKidMode(v: KidMode | null) {
  try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event(EVENT));
}
export function useKidMode(): KidMode | null {
  const [v, setV] = useState(readKidMode);
  useEffect(() => {
    const sync = () => setV(readKidMode());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);
  return v;
}

/** Family tab: pick a child, confirm with the PIN (made here if there is none yet), and the device is theirs. */
export function KidModeSwitch({ isAr, children }: { isAr: boolean; children: Array<{ id: string; name: string }> }) {
  const navigate = useNavigate();
  const [pick, setPick] = useState<{ id: string; name: string } | null>(null);
  const t = (en: string, ar: string) => (isAr ? ar : en);
  if (children.length === 0) return null;
  return (
    <div className="pt-4 border-t border-border space-y-3" data-testid="kid-mode-switch">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Baby className="w-4 h-4 text-accent" aria-hidden="true" /><span>{t('Hand this device to my child', 'سلّم الجهاز ده لابني')}</span>
      </h3>
      <p className="text-xs text-muted-foreground">
        {t('This device then shows only your child\'s lessons, homework and learning pages. Booking, payments, messages and watching lessons are hidden. You need your PIN to come back.',
          'الجهاز هيعرض حصص ابنك وواجبه وصفحات التعلم بس. الحجز والدفع والرسائل ومتابعة الحصص هيستخبوا. هتحتاج الرقم السري علشان ترجع.')}
      </p>
      <div className="flex flex-wrap gap-2">
        {children.map((c) => (
          <Button key={c.id} type="button" size="sm" variant="outline" onClick={() => setPick(c)}>
            {t(`Hand to ${c.name}`, `سلّمه لـ ${c.name}`)}
          </Button>
        ))}
      </div>
      <ParentPinDialog isOpen={!!pick} isAr={isAr} onClose={() => setPick(null)}
        onDone={() => { if (pick) setKidMode({ learnerId: pick.id, name: pick.name }); setPick(null); navigate('/student/lessons'); }} />
    </div>
  );
}

/** The kid-mode frame: logo, the child's name, language, and "Back to parent" behind the PIN. */
export function KidModeShell({ isAr, kid, onToggleLang, children }: { isAr: boolean; kid: KidMode; onToggleLang: () => void; children: React.ReactNode }) {
  const navigate = useNavigate();
  const [asking, setAsking] = useState(false);
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const tabs = [['/student/lessons', t('Lessons', 'حصصي')], ['/student/homework', t('Homework', 'الواجب')], ['/student/curriculum', t('Learn', 'اتعلم')], ['/student/progress', t('Progress', 'تقدمي')]];
  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="min-h-dvh bg-background text-foreground" data-testid="kid-mode">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/student/lessons" aria-label={t('Home', 'الرئيسية')}><BrandLogo variant="compact" /></Link>
        <nav aria-label={t('Sections', 'الأقسام')} className="flex flex-wrap items-center gap-1">
          {tabs.map(([to, label]) => <Link key={to} to={to} className="inline-flex min-h-10 items-center rounded-full px-3 text-sm font-semibold hover:bg-surface-subtle focus-ring">{label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onToggleLang} className="btn-glass is-pill !min-h-10 !px-3.5 text-sm"><Globe className="w-4 h-4" aria-hidden="true" /><span>{isAr ? 'EN' : 'عربي'}</span></button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setAsking(true)}>
            <LogOut className="me-1.5 h-4 w-4 rtl:rotate-180" aria-hidden="true" />{t('Back to parent', 'رجوع لولي الأمر')}
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <SingleLearnerScope learner={{ id: kid.learnerId, name: kid.name }}>{children}</SingleLearnerScope>
      </main>
      <ParentPinDialog isOpen={asking} isAr={isAr} onClose={() => setAsking(false)} onDone={() => { setAsking(false); setKidMode(null); navigate('/student'); }} />
    </div>
  );
}

type Booking = { id: string; studentId: string; status: string; scheduledStart: string; scheduledEnd: string | null; durationMinutes: number | null; serviceTitle: string; serviceArabicTitle?: string; classroom?: boolean; zoomMeetingLink?: string | null };

/** The child's upcoming lessons, with the room button from 15 minutes before; no cancel, reschedule or watch. */
export function KidModeLessons({ isAr, kid }: { isAr: boolean; kid: KidMode }) {
  const [list, setList] = useState<Booking[] | null>(null);
  const [failed, setFailed] = useState(false);
  const t = (en: string, ar: string) => (isAr ? ar : en);
  useEffect(() => {
    authedJson<Booking[]>('/api/student/bookings').then((d) => setList(Array.isArray(d) ? d : [])).catch(() => setFailed(true));
  }, []);
  if (failed) return <p role="alert" className="text-sm text-destructive">{t('Could not load your lessons. Please try again in a moment.', 'مقدرناش نحمّل حصصك. جرّب تاني بعد شوية.')}</p>;
  if (!list) return <div className="grid justify-items-center py-16"><BrandLoader size="md" /></div>;
  const now = Date.now();
  const end = (b: Booking) => (b.scheduledEnd ? Date.parse(b.scheduledEnd) : Date.parse(b.scheduledStart) + (b.durationMinutes || 30) * 60_000);
  const mine = list.filter((b) => b.studentId === kid.learnerId && ['confirmed', 'rescheduled'].includes(b.status) && end(b) > now)
    .sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart));
  const locale = isAr ? 'ar-EG' : 'en-GB';
  return (
    <div className="grid gap-4" data-testid="kid-mode-lessons">
      <h1 className="text-2xl font-display font-bold">{t(`${kid.name}'s lessons`, `حصص ${kid.name}`)}</h1>
      {mine.length === 0 && <p className="text-sm text-muted-foreground">{t('No lessons booked right now.', 'مفيش حصص محجوزة دلوقتي.')}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {mine.map((b) => {
          const start = new Date(b.scheduledStart);
          const open = now >= start.getTime() - 15 * 60_000 && now <= end(b);
          return (
            <Card key={b.id} className="grid gap-2 p-4">
              <span className="font-semibold">{isAr ? b.serviceArabicTitle || b.serviceTitle : b.serviceTitle}</span>
              <span className="text-sm text-muted-foreground">{start.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })} · {start.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}</span>
              {open ? (
                b.classroom || !b.zoomMeetingLink ? (
                  <Link to={`/student/room/${encodeURIComponent(b.id)}`} className="inline-flex min-h-11 items-center gap-1.5 justify-self-start rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground focus-ring">
                    <Presentation className="h-4 w-4" aria-hidden="true" />{t('Join the lesson', 'ادخل الحصة')}
                  </Link>
                ) : (
                  <a href={b.zoomMeetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 justify-self-start rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground focus-ring">
                    <Video className="h-4 w-4" aria-hidden="true" />{t('Join the lesson', 'ادخل الحصة')}
                  </a>
                )
              ) : <span className="text-xs text-muted-foreground">{t('The join button shows here 15 minutes before the lesson.', 'زرار الدخول هيظهر هنا قبل الحصة بربع ساعة.')}</span>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
