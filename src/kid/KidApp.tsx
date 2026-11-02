import React, { useCallback, useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Globe, Video, Presentation } from 'lucide-react';
import { authedJson } from '../lib/authedJson';
import { kidToken, setKidToken } from '../lib/kidDevice';
import { useAppLanguage } from '../lib/language';
import { AuthPage } from '../components/auth/AuthFrame';
import { OtpVerificationCard } from '../components/auth/OtpVerificationCard';
import { BrandLogo } from '../components/ui/BrandLogo';
import { BrandLoader } from '../components/ui/BrandLoader';
import { Card } from '../components/ui/Card';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { HomeworkCard } from '../student/components/HomeworkCard';
import { ReviewCard } from '../student/components/ReviewCard';
import StudentLessonRoomPage from '../student/pages/StudentLessonRoomPage';

/**
 * NX-16: a child's own device (a phone, tablet or computer other than the parent's). The parent makes a one-time
 * 6-digit code in the Family tab; this page trades it for the device's token, on the same code screen and motion as
 * the email code. Then the child sees only their lessons (join link), the lesson room, homework, today's review and
 * recitations. No payments, booking, settings or other children: the server refuses every other route.
 */
const CODE_LENGTH = 6;
const GOLD_TEXT = 'text-[#A06E14] dark:text-[#E5A93C]';

interface KidLesson { id: string; start: string; end: string; minutes: number; title: string; titleAr: string; zoomUrl: string | null }
interface KidMe { learner: { id: string; name: string }; lessons: KidLesson[] }

export default function KidApp() {
  const { lang, isAr, toggleLanguage } = useAppLanguage();
  const [linked, setLinked] = useState(() => Boolean(kidToken()));
  const [removed, setRemoved] = useState(false);

  const unlinked = useCallback(() => { setKidToken(null); setRemoved(true); setLinked(false); }, []);

  if (!linked) {
    return (
      <AuthPage isAr={isAr}>
        <PairCard lang={lang} removed={removed} onToggleLang={toggleLanguage} onLinked={() => { setRemoved(false); setLinked(true); }} />
      </AuthPage>
    );
  }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} lang={lang} className="khatam-field brand-lights min-h-dvh bg-background text-foreground">
      <header className="mx-auto max-w-3xl flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
        <BrandLogo className="h-9 w-auto" />
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleLanguage} className="btn-glass is-pill !min-h-10 !px-3.5 text-sm">
            <Globe className="w-4 h-4" aria-hidden="true" />
            <span>{isAr ? 'EN' : 'عربي'}</span>
          </button>
          <ThemeToggle compact className="!w-11 !h-11 !rounded-full" />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
        <Routes>
          <Route path="/" element={<KidHome isAr={isAr} onUnlinked={unlinked} />} />
          <Route path="/room/:id" element={<StudentLessonRoomPage lang={lang} backTo="/kid" />} />
          <Route path="*" element={<Navigate to="/kid" replace />} />
        </Routes>
      </main>
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

function KidHome({ isAr, onUnlinked }: { isAr: boolean; onUnlinked: () => void }) {
  const [me, setMe] = useState<KidMe | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    authedJson<KidMe>('/api/kid/me').then(setMe).catch((err: any) => (err?.status === 401 ? onUnlinked() : setFailed(true)));
  }, [onUnlinked]);

  if (failed) return <p role="alert" className="text-sm text-destructive">{isAr ? 'معرفناش نجيب حصصك، جرّب تاني بعد شوية.' : 'Could not load your lessons. Please try again in a moment.'}</p>;
  if (!me) return <div className="py-16 grid justify-items-center"><BrandLoader size="md" /></div>;

  const locale = isAr ? 'ar-EG' : 'en-GB';
  const now = Date.now();
  return (
    <div className="grid gap-5" data-testid="kid-home">
      <h1 className="text-2xl font-display font-bold">{isAr ? `أهلًا يا ${me.learner.name}` : `Assalamu alaykum, ${me.learner.name}`}</h1>

      <section className="grid gap-3" aria-labelledby="kid-lessons">
        <h2 id="kid-lessons" className="text-base font-semibold">{isAr ? 'حصصك الجاية' : 'Your next lessons'}</h2>
        {me.lessons.length === 0 && <p className="text-sm text-muted-foreground">{isAr ? 'مفيش حصص محجوزة دلوقتي.' : 'No lessons booked right now.'}</p>}
        {me.lessons.map((l) => {
          const start = new Date(l.start);
          // The join buttons show from 15 minutes before the lesson until it ends.
          const open = now >= start.getTime() - 15 * 60 * 1000 && now <= Date.parse(l.end);
          return (
            <Card key={l.id} className="p-4 grid gap-2">
              <span className="font-semibold">{isAr ? l.titleAr || l.title : l.title}</span>
              <span className="text-sm text-muted-foreground">
                {start.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })} · {start.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}
              </span>
              {open && (
                <div className="flex flex-wrap gap-2">
                  {l.zoomUrl && (
                    <a href={l.zoomUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold px-4 min-h-11 focus-ring">
                      <Video className="w-4 h-4" aria-hidden="true" />{isAr ? 'ادخل الحصة' : 'Join the lesson'}
                    </a>
                  )}
                  <Link to={`/kid/room/${l.id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-border text-sm font-semibold px-4 min-h-11 focus-ring">
                    <Presentation className="w-4 h-4" aria-hidden="true" />{isAr ? 'غرفة الحصة' : 'Lesson room'}
                  </Link>
                </div>
              )}
            </Card>
          );
        })}
      </section>

      <ReviewCard isAr={isAr} />
      <HomeworkCard isAr={isAr} kid />
    </div>
  );
}
