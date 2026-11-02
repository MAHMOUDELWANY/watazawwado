import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Calendar, Compass, Globe, GraduationCap, Library, Presentation, Users, Video } from 'lucide-react';
import { authedJson } from '../lib/authedJson';
import { kidToken, setKidToken } from '../lib/kidDevice';
import { useAppLanguage } from '../lib/language';
import { AuthPage } from '../components/auth/AuthFrame';
import { OtpVerificationCard } from '../components/auth/OtpVerificationCard';
import { BrandLogo } from '../components/ui/BrandLogo';
import { BrandLoader } from '../components/ui/BrandLoader';
import { Card } from '../components/ui/Card';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { MobileTabBar, isTabActive, MOBILE_TAB_BAR_PADDING } from '../components/ui/MobileTabBar';
import { HomeworkCard } from '../student/components/HomeworkCard';
import { ReviewCard } from '../student/components/ReviewCard';
import StudentLessonRoomPage from '../student/pages/StudentLessonRoomPage';
import StudentCurriculumPage, { StudentCurriculumLessonPage } from '../student/pages/StudentCurriculumPage';
import StudentProgressPage from '../student/pages/StudentProgressPage';
import StudentProgressReportPage from '../student/pages/StudentProgressReportPage';
import StudentCertificatePage from '../student/pages/StudentCertificatePage';
import StudentCommunityPage from '../student/pages/StudentCommunityPage';
import StudentPlacementPage from '../student/pages/StudentPlacementPage';
import StudentPlacementReportPage from '../student/pages/StudentPlacementReportPage';

const HomeProgressCard = lazy(() => import('../student/components/progress/HomeProgressCard').then((m) => ({ default: m.HomeProgressCard })));

/**
 * NX-16: a child's own device (a phone, tablet or computer other than the parent's). The parent makes a one-time
 * 6-digit code in the Family tab; this page trades it for the device's token, on the same code screen and motion as
 * the email code. The device is then the child's learning space, built from the portal's own pages: home (next lesson,
 * review, homework, progress), lessons, lesson room, curriculum, progress and report, certificates, the honour board and
 * the placement test, all for that one child. No payments, booking, settings, messages or other children: the server
 * refuses every other route, and portal links to /student/... are sent to the same page under /kid.
 */
const CODE_LENGTH = 6;
const GOLD_TEXT = 'text-[#A06E14] dark:text-[#E5A93C]';

interface KidLesson { id: string; start: string; end: string; minutes: number; title: string; titleAr: string; zoomUrl: string | null }
interface KidMe { learner: { id: string; name: string }; lessons: KidLesson[] }

export default function KidApp() {
  const { lang, isAr, toggleLanguage } = useAppLanguage();
  const [linked, setLinked] = useState(() => Boolean(kidToken()));
  const [removed, setRemoved] = useState(false);
  const [me, setMe] = useState<KidMe | null>(null);
  const [failed, setFailed] = useState(false);
  const location = useLocation();

  const unlinked = useCallback(() => { setKidToken(null); setMe(null); setRemoved(true); setLinked(false); }, []);

  useEffect(() => {
    if (!linked) return;
    authedJson<KidMe>('/api/kid/me').then(setMe).catch((err: any) => (err?.status === 401 ? unlinked() : setFailed(true)));
  }, [linked, unlinked]);

  if (!linked) {
    return (
      <AuthPage isAr={isAr}>
        <PairCard lang={lang} removed={removed} onToggleLang={toggleLanguage} onLinked={() => { setRemoved(false); setFailed(false); setLinked(true); }} />
      </AuthPage>
    );
  }

  const tabs = [
    { key: 'home', path: '/kid', label: isAr ? 'الرئيسية' : 'Home', icon: BookOpen },
    { key: 'lessons', path: '/kid/lessons', label: isAr ? 'حصصي' : 'Lessons', icon: Calendar },
    { key: 'curriculum', path: '/kid/curriculum', label: isAr ? 'منهجي' : 'Curriculum', icon: Library },
    { key: 'progress', path: '/kid/progress', label: isAr ? 'مسيرتي' : 'Progress', icon: Compass },
    { key: 'community', path: '/kid/community', label: isAr ? 'مجتمعنا' : 'Community', icon: Users },
  ];
  const active = (path: string) => isTabActive(path, location.pathname, '/kid');

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} lang={lang} className="khatam-field brand-lights min-h-dvh bg-background text-foreground">
      <header className="mx-auto max-w-5xl flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
        <Link to="/kid" aria-label={isAr ? 'الرئيسية' : 'Home'}><BrandLogo variant="compact" /></Link>
        {/* Tablet and computer: the sections as pill tabs; on a phone they are in the bottom bar. */}
        <nav aria-label={isAr ? 'الأقسام' : 'Sections'} className="hidden md:flex items-center gap-1 glass-1 rounded-full p-1">
          {tabs.map((t) => (
            <Link
              key={t.key}
              to={t.path}
              aria-current={active(t.path) ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 min-h-10 text-sm font-semibold transition-colors focus-ring ${active(t.path) ? 'bg-primary text-primary-foreground' : 'text-foreground/80 hover:bg-surface-subtle'}`}
            >
              <t.icon className="w-4 h-4" aria-hidden="true" />{t.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleLanguage} className="btn-glass is-pill !min-h-10 !px-3.5 text-sm">
            <Globe className="w-4 h-4" aria-hidden="true" />
            <span>{isAr ? 'EN' : 'عربي'}</span>
          </button>
          <ThemeToggle compact className="!w-11 !h-11 !rounded-full" />
        </div>
      </header>
      <main className={`mx-auto max-w-5xl px-4 sm:px-6 py-6 ${MOBILE_TAB_BAR_PADDING}`}>
        {failed ? (
          <p role="alert" className="text-sm text-destructive">{isAr ? 'معرفناش نجيب حصصك، جرّب تاني بعد شوية.' : 'Could not load your lessons. Please try again in a moment.'}</p>
        ) : !me ? (
          <div className="py-16 grid justify-items-center"><BrandLoader size="md" /></div>
        ) : (
          <Routes>
            <Route path="/" element={<KidHome isAr={isAr} me={me} />} />
            <Route path="/lessons" element={<KidLessons isAr={isAr} lessons={me.lessons} />} />
            <Route path="/room/:id" element={<StudentLessonRoomPage lang={lang} backTo="/kid/lessons" />} />
            <Route path="/curriculum" element={<StudentCurriculumPage lang={lang} />} />
            <Route path="/curriculum/:learner/:subject/:number" element={<StudentCurriculumLessonPage lang={lang} />} />
            <Route path="/progress" element={<StudentProgressPage lang={lang} />} />
            <Route path="/progress/report" element={<StudentProgressReportPage lang={lang} />} />
            <Route path="/certificate/:id" element={<StudentCertificatePage lang={lang} />} />
            <Route path="/community" element={<StudentCommunityPage lang={lang} />} />
            <Route path="/placement" element={<StudentPlacementPage lang={lang} />} />
            <Route path="/placement/report/:id" element={<StudentPlacementReportPage lang={lang} />} />
            {/* Booking, wallet, messages, settings and the rest are for the parent's account. */}
            <Route path="*" element={<Navigate to="/kid" replace />} />
          </Routes>
        )}
      </main>
      <MobileTabBar
        label={isAr ? 'التنقل السفلي' : 'Bottom navigation'}
        tabs={tabs.map((t) => ({ key: t.key, label: t.label, icon: t.icon, to: t.path, active: active(t.path) }))}
      />
    </div>
  );
}

function PairCard({ lang, removed, onToggleLang, onLinked }: { lang: 'ar' | 'en'; removed: boolean; onToggleLang: () => void; onLinked: () => void }) {
  const isAr = lang === 'ar';
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialCode = (params.get('code') || '').replace(/\D/g, '').slice(0, CODE_LENGTH);

  const pair = async (code: string) => {
    try {
      const { token } = await authedJson<{ token: string }>('/api/kid/pair', { method: 'POST', body: JSON.stringify({ code }) });
      setKidToken(token);
      return { success: true };
    } catch {
      return { success: false };
    }
  };

  return (
    <OtpVerificationCard
      key={lang}
      lang={lang}
      onToggleLang={onToggleLang}
      variant="page"
      length={CODE_LENGTH}
      initialCode={initialCode}
      onVerify={pair}
      // Drop ?code= so a reload never tries the used code again.
      onSuccess={() => { navigate('/kid', { replace: true }); onLinked(); }}
      copy={{
        title: isAr ? <>افتح <span className={GOLD_TEXT}>حصصك</span> هنا</> : <>Open your <span className={GOLD_TEXT}>lessons</span> here</>,
        subtitle: removed
          ? (isAr ? 'الجهاز ده اتشال من حساب العيلة. اطلب من بابا أو ماما كود جديد واكتبه هنا.' : 'This device was removed from the family account. Ask your parent for a new code and type it here.')
          : (isAr ? 'بابا أو ماما هيطلّعوا كود من 6 أرقام من تبويب العيلة في حسابهم. ينفع على موبايل أو تابلت أو كمبيوتر.' : 'Your parent makes a 6-digit code in the Family tab of their account. It works on a phone, tablet or computer.'),
        doneSubtitle: isAr ? 'الجهاز ده اتربط. يلا بينا على حصصك.' : 'This device is linked. On to your lessons.',
        error: isAr ? 'الكود ده غلط أو خلص وقته. اطلب من بابا أو ماما كود جديد.' : 'This code is wrong or has expired. Ask your parent for a new one.',
        groupLabel: isAr ? 'كود الربط من 6 أرقام' : '6-digit link code',
      }}
    />
  );
}

/** The join buttons show from 15 minutes before the lesson until it ends. */
function LessonCard({ lesson, isAr, big = false }: { lesson: KidLesson; isAr: boolean; big?: boolean }) {
  const locale = isAr ? 'ar-EG' : 'en-GB';
  const start = new Date(lesson.start);
  const now = Date.now();
  const open = now >= start.getTime() - 15 * 60 * 1000 && now <= Date.parse(lesson.end);
  return (
    <Card className={`grid gap-2 ${big ? 'p-5' : 'p-4'}`}>
      <span className={`font-semibold ${big ? 'text-lg' : ''}`}>{isAr ? lesson.titleAr || lesson.title : lesson.title}</span>
      <span className="text-sm text-muted-foreground">
        {start.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })} · {start.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}
      </span>
      {open ? (
        <div className="flex flex-wrap gap-2">
          {lesson.zoomUrl && (
            <a href={lesson.zoomUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold px-4 min-h-11 focus-ring">
              <Video className="w-4 h-4" aria-hidden="true" />{isAr ? 'ادخل الحصة' : 'Join the lesson'}
            </a>
          )}
          <Link to={`/kid/room/${lesson.id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-border text-sm font-semibold px-4 min-h-11 focus-ring">
            <Presentation className="w-4 h-4" aria-hidden="true" />{isAr ? 'غرفة الحصة' : 'Lesson room'}
          </Link>
        </div>
      ) : big && (
        <span className="text-xs text-muted-foreground">{isAr ? 'زرار الدخول بيظهر هنا قبل الحصة بربع ساعة.' : 'The join button shows here 15 minutes before the lesson.'}</span>
      )}
    </Card>
  );
}

function KidHome({ isAr, me }: { isAr: boolean; me: KidMe }) {
  const next = me.lessons[0];
  const tiles = [
    { to: '/kid/curriculum', icon: Library, label: isAr ? 'منهجي' : 'My curriculum', note: isAr ? 'دروسك وصفحاتها' : 'Your lessons and their pages' },
    { to: '/kid/progress', icon: Compass, label: isAr ? 'مسيرتي' : 'My progress', note: isAr ? 'اللي خلّصته لحد دلوقتي' : 'What you finished so far' },
    { to: '/kid/community', icon: Users, label: isAr ? 'مجتمعنا' : 'Community', note: isAr ? 'لوحة الشرف' : 'The honour board' },
    { to: '/kid/placement', icon: GraduationCap, label: isAr ? 'اختبار المستوى' : 'Level test', note: isAr ? 'اعرف مستواك' : 'Find your level' },
  ];
  return (
    <div className="grid gap-5" data-testid="kid-home">
      <h1 className="text-2xl sm:text-3xl font-display font-bold">{isAr ? `أهلًا يا ${me.learner.name}` : `Assalamu alaykum, ${me.learner.name}`}</h1>

      <section className="grid gap-3" aria-labelledby="kid-next">
        <h2 id="kid-next" className="text-base font-semibold">{isAr ? 'حصتك الجاية' : 'Your next lesson'}</h2>
        {next ? <LessonCard lesson={next} isAr={isAr} big /> : <p className="text-sm text-muted-foreground">{isAr ? 'مفيش حصص محجوزة دلوقتي.' : 'No lessons booked right now.'}</p>}
      </section>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <ReviewCard isAr={isAr} />
        <HomeworkCard isAr={isAr} kid />
      </div>

      <Suspense fallback={null}><HomeProgressCard isAr={isAr} /></Suspense>

      <nav aria-label={isAr ? 'أقسامي' : 'My sections'} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="glass-1 rounded-2xl p-4 grid gap-1 min-h-11 hover:bg-surface-subtle transition-colors focus-ring">
            <t.icon className="w-5 h-5 text-accent" aria-hidden="true" />
            <span className="font-semibold text-sm">{t.label}</span>
            <span className="text-xs text-muted-foreground">{t.note}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function KidLessons({ isAr, lessons }: { isAr: boolean; lessons: KidLesson[] }) {
  return (
    <div className="grid gap-4" data-testid="kid-lessons">
      <h1 className="text-2xl font-display font-bold">{isAr ? 'حصصي' : 'My lessons'}</h1>
      {lessons.length === 0 && <p className="text-sm text-muted-foreground">{isAr ? 'مفيش حصص محجوزة دلوقتي.' : 'No lessons booked right now.'}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {lessons.map((l) => <LessonCard key={l.id} lesson={l} isAr={isAr} />)}
      </div>
    </div>
  );
}
