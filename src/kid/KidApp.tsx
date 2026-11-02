import React, { useCallback, useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useSearchParams } from 'react-router-dom';
import { Video, Presentation } from 'lucide-react';
import { authedJson } from '../lib/authedJson';
import { kidToken, setKidToken } from '../lib/kidDevice';
import { getStoredLanguage, setStoredLanguage } from '../lib/language';

type Language = 'ar' | 'en';
import { BrandLogo } from '../components/ui/BrandLogo';
import { BrandLoader } from '../components/ui/BrandLoader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { HomeworkCard } from '../student/components/HomeworkCard';
import { ReviewCard } from '../student/components/ReviewCard';
import StudentLessonRoomPage from '../student/pages/StudentLessonRoomPage';

/**
 * NX-16: a child's own phone. The parent makes a one-time code in the Family tab; this page trades it for the
 * phone's token. Then the child sees only their lessons (join link), the lesson room, homework, today's review and
 * recitations. No payments, booking, settings or other children: the server refuses every other route.
 */
interface KidLesson { id: string; start: string; end: string; minutes: number; title: string; titleAr: string; zoomUrl: string | null }
interface KidMe { learner: { id: string; name: string }; lessons: KidLesson[] }

export default function KidApp() {
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const isAr = lang === 'ar';
  const [linked, setLinked] = useState(() => Boolean(kidToken()));
  const [notice, setNotice] = useState('');
  const toggleLang = () => { const next = isAr ? 'en' : 'ar'; setStoredLanguage(next); setLang(next); };

  const unlinked = useCallback(() => {
    setKidToken(null);
    setLinked(false);
    setNotice(isAr ? 'الموبايل ده اتشال من حساب العيلة. اطلب من بابا أو ماما كود جديد.' : 'This phone was removed from the family account. Ask your parent for a new code.');
  }, [isAr]);

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} lang={lang} className="min-h-dvh bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <BrandLogo className="h-8 w-auto" />
        <button type="button" onClick={toggleLang} className="text-sm font-semibold text-teal min-h-11 px-2 focus-ring rounded-lg">
          {isAr ? 'English' : 'عربي'}
        </button>
      </header>
      <main className="mx-auto max-w-xl px-4 py-6">
        {!linked ? (
          <PairScreen isAr={isAr} notice={notice} onLinked={() => { setNotice(''); setLinked(true); }} />
        ) : (
          <Routes>
            <Route path="/" element={<KidHome isAr={isAr} onUnlinked={unlinked} />} />
            <Route path="/room/:id" element={<StudentLessonRoomPage lang={lang} backTo="/kid" />} />
            <Route path="*" element={<Navigate to="/kid" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

function PairScreen({ isAr, notice, onLinked }: { isAr: boolean; notice: string; onLinked: () => void }) {
  const [params] = useSearchParams();
  const [code, setCode] = useState(() => (params.get('code') || '').replace(/\D/g, '').slice(0, 6));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { token } = await authedJson<{ token: string }>('/api/kid/pair', { method: 'POST', body: JSON.stringify({ code }) });
      setKidToken(token);
      onLinked();
    } catch (err: any) {
      setError(err?.status === 404 || err?.status === 409
        ? (isAr ? 'الكود ده غلط أو خلص وقته. اطلب من بابا أو ماما كود جديد.' : 'This code is wrong or has expired. Ask your parent for a new one.')
        : (isAr ? 'معرفناش نربط الموبايل، جرّب تاني بعد شوية.' : 'Could not link this phone. Please try again in a moment.'));
    } finally { setBusy(false); }
  };

  return (
    <Card className="p-6 grid gap-4" data-testid="kid-pair">
      <h1 className="text-xl font-display font-bold">{isAr ? 'افتح حصصك على موبايلك' : 'Open your lessons on your phone'}</h1>
      <p className="text-sm text-muted-foreground">
        {isAr
          ? 'بابا أو ماما هيطلّعوا كود من 6 أرقام من صفحة العيلة في حسابهم. اكتبه هنا.'
          : 'Your parent makes a 6-digit code in the Family tab of their account. Type it here.'}
      </p>
      {notice && <p role="status" className="text-sm text-foreground">{notice}</p>}
      <form onSubmit={submit} className="grid gap-3">
        <label htmlFor="kid-code" className="text-sm font-semibold">{isAr ? 'الكود' : 'Code'}</label>
        <Input
          id="kid-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="text-center text-2xl tracking-[0.4em] tabular-nums"
          dir="ltr"
        />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" isLoading={busy} disabled={code.length !== 6 || busy}>{isAr ? 'اربط الموبايل' : 'Link this phone'}</Button>
      </form>
    </Card>
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
