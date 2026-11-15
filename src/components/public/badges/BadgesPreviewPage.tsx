import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Moon, Play, RotateCcw, Sun } from 'lucide-react';
import { useT } from '../../../lib/language';
import { useTheme } from '../../ThemeProvider';
import { hideBootSplash } from '../../../lib/bootSplash';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';

/**
 * Trial page for the achievement badges (owner, 2026-11-15): every badge of the new set, the shelf as a child sees it,
 * and the clockwork reveal of the big badge, silent for now. Open to anyone, not indexed (not in the SEO page list).
 * Design: docs/superpowers/specs/2026-11-14-achievement-badges-design.md. Renders: scripts/badges/build_shelf.py.
 */

type L = { en: string; ar: string };
type Tier = 'copper' | 'gold' | 'grand';
type Subject = 'quran' | 'zad' | 'lang' | 'scholar';
type FamilyId = 'lessons' | 'rhythm' | 'subject' | 'teacher' | 'homework';
interface BadgeDef { id: string; fam: FamilyId; tier: Tier; t: L; e: L; num?: boolean; rep?: boolean; subj?: Subject }

const FAMILIES: Array<{ id: FamilyId; title: L; shape: L; lede: L }> = [
  { id: 'lessons', title: { en: 'Lessons', ar: 'الحصص' }, shape: { en: 'a round coin', ar: 'عملة مستديرة' }, lede: { en: 'Every lesson attended, in any subject.', ar: 'كل حصة حضرتها، في أي مادة.' } },
  { id: 'rhythm', title: { en: 'Rhythm', ar: 'الإيقاع' }, shape: { en: 'a shamsa', ar: 'شمسة' }, lede: { en: 'At least one lesson a week, weeks in a row. A missed week never takes it away.', ar: 'حصة على الأقل كل أسبوع، أسابيع متتالية. لا يضيع إن غبت أسبوعًا.' } },
  { id: 'subject', title: { en: 'Subject milestones', ar: 'إنجاز في المادة' }, shape: { en: 'the khatam star', ar: 'نجمة الخاتم' }, lede: { en: 'Recorded by your teacher. The gem colour names the subject.', ar: 'يسجّلها معلمك. لون الجوهرة يدل على المادة.' } },
  { id: 'teacher', title: { en: "Teacher's recognition", ar: 'تقدير المعلم' }, shape: { en: 'a mihrab arch', ar: 'محراب' }, lede: { en: 'Your teacher gives it and writes why.', ar: 'يمنحها معلمك ويكتب سببها.' } },
  { id: 'homework', title: { en: 'Homework', ar: 'الواجب' }, shape: { en: 'a zellige tile', ar: 'بلاطة زليج' }, lede: { en: 'The work you do on your own between lessons. Effort, never the score.', ar: 'ما تعمله وحدك بين الحصص. يُكافأ الاجتهاد لا الدرجة.' } },
];

const BADGES: BadgeDef[] = [
  { id: 'first-lesson', fam: 'lessons', tier: 'copper', t: { en: 'First lesson', ar: 'أول حصة' }, e: { en: 'Attend your first lesson', ar: 'احضر حصتك الأولى' } },
  { id: 'lessons-10', fam: 'lessons', tier: 'copper', num: true, t: { en: '10 lessons', ar: '١٠ حصص' }, e: { en: 'Attend 10 lessons', ar: 'احضر ١٠ حصص' } },
  { id: 'lessons-25', fam: 'lessons', tier: 'gold', num: true, t: { en: '25 lessons', ar: '٢٥ حصة' }, e: { en: 'Attend 25 lessons', ar: 'احضر ٢٥ حصة' } },
  { id: 'lessons-50', fam: 'lessons', tier: 'gold', num: true, t: { en: '50 lessons', ar: '٥٠ حصة' }, e: { en: 'Attend 50 lessons', ar: 'احضر ٥٠ حصة' } },
  { id: 'lessons-100', fam: 'lessons', tier: 'grand', num: true, t: { en: '100 lessons', ar: '١٠٠ حصة' }, e: { en: 'Attend 100 lessons', ar: 'احضر ١٠٠ حصة' } },
  { id: 'rhythm-4', fam: 'rhythm', tier: 'copper', num: true, t: { en: 'A month of rhythm', ar: 'شهر على الإيقاع' }, e: { en: 'A lesson every week, 4 weeks in a row', ar: 'حصة كل أسبوع، ٤ أسابيع متتالية' } },
  { id: 'rhythm-12', fam: 'rhythm', tier: 'gold', num: true, t: { en: 'Three steady months', ar: 'ثلاثة أشهر ثابتة' }, e: { en: 'A lesson every week, 12 weeks in a row', ar: 'حصة كل أسبوع، ١٢ أسبوعًا متتالية' } },
  { id: 'rhythm-26', fam: 'rhythm', tier: 'gold', num: true, t: { en: 'Half a steady year', ar: 'نصف سنة ثابت' }, e: { en: 'A lesson every week, 26 weeks in a row', ar: 'حصة كل أسبوع، ٢٦ أسبوعًا متتالية' } },
  { id: 'rhythm-52', fam: 'rhythm', tier: 'grand', num: true, t: { en: 'A full year', ar: 'سنة كاملة' }, e: { en: 'A lesson every week for a whole year', ar: 'حصة كل أسبوع لمدة سنة كاملة' } },
  { id: 'surah', fam: 'subject', subj: 'quran', tier: 'gold', rep: true, t: { en: 'A surah memorised', ar: 'حفظ سورة' }, e: { en: 'Your teacher records a surah you memorised', ar: 'معلمك يسجّل سورة حفظتها' } },
  { id: 'tajweed', fam: 'subject', subj: 'quran', tier: 'gold', rep: true, t: { en: 'A tajweed rule mastered', ar: 'إتقان حكم تجويد' }, e: { en: 'Your teacher records a rule you mastered', ar: 'معلمك يسجّل حكمًا أتقنته' } },
  { id: 'juz', fam: 'subject', subj: 'quran', tier: 'grand', rep: true, t: { en: 'A juz completed', ar: 'إتمام جزء' }, e: { en: 'Your teacher records a whole juz', ar: 'معلمك يسجّل جزءًا كاملًا' } },
  { id: 'khatma', fam: 'subject', subj: 'quran', tier: 'grand', rep: true, t: { en: 'Khatma', ar: 'ختمة' }, e: { en: 'You completed the whole Quran with your teacher', ar: 'ختمت القرآن كاملًا مع معلمك' } },
  { id: 'zad-level', fam: 'subject', subj: 'zad', tier: 'grand', rep: true, t: { en: 'A Zad Path level', ar: 'مستوى في مسار زاد' }, e: { en: 'You finished a level of the Zad Path', ar: 'أنهيت مستوى من مسار زاد' } },
  { id: 'language-level', fam: 'subject', subj: 'lang', tier: 'grand', rep: true, t: { en: 'A language level', ar: 'مستوى لغة' }, e: { en: 'You finished a level in Fusha, Egyptian Arabic or English', ar: 'أنهيت مستوى في الفصحى أو المصرية أو الإنجليزية' } },
  { id: 'scholar-book', fam: 'subject', subj: 'scholar', tier: 'grand', rep: true, t: { en: 'A book completed', ar: 'إتمام كتاب' }, e: { en: "You finished a book in the Scholar's Path", ar: 'أنهيت كتابًا في مسار العلماء' } },
  { id: 'teacher', fam: 'teacher', tier: 'gold', rep: true, t: { en: "Teacher's recognition", ar: 'تقدير المعلم' }, e: { en: 'Your teacher gives it and writes why', ar: 'معلمك يمنحها ويكتب لماذا' } },
  { id: 'homework-first', fam: 'homework', tier: 'copper', t: { en: 'First homework', ar: 'أول واجب' }, e: { en: 'Finish your first homework', ar: 'أنهِ واجبك الأول' } },
  { id: 'homework-10', fam: 'homework', tier: 'copper', num: true, t: { en: '10 homeworks', ar: '١٠ واجبات' }, e: { en: 'Finish 10 homeworks', ar: 'أنهِ ١٠ واجبات' } },
  { id: 'homework-25', fam: 'homework', tier: 'gold', num: true, t: { en: '25 homeworks', ar: '٢٥ واجبًا' }, e: { en: 'Finish 25 homeworks', ar: 'أنهِ ٢٥ واجبًا' } },
  { id: 'homework-50', fam: 'homework', tier: 'grand', num: true, t: { en: '50 homeworks', ar: '٥٠ واجبًا' }, e: { en: 'Finish 50 homeworks', ar: 'أنهِ ٥٠ واجبًا' } },
  { id: 'lesson-mastered', fam: 'homework', tier: 'gold', rep: true, t: { en: 'A whole lesson mastered', ar: 'درس كامل متقن' }, e: { en: "You passed a whole lesson's homework", ar: 'اجتزت واجب درس كامل' } },
  { id: 'came-back', fam: 'homework', tier: 'gold', rep: true, t: { en: 'Came back and remembered', ar: 'رجعتَ وتذكّرت' }, e: { en: 'You passed a review 7 or 21 days later', ar: 'اجتزت مراجعة بعد ٧ أيام أو ٢١ يومًا' } },
  { id: 'tried-again', fam: 'homework', tier: 'gold', rep: true, t: { en: 'Tried again and made it', ar: 'حاولتَ ثانيةً ونجحت' }, e: { en: "It didn't pass the first time, so you tried again", ar: 'لم تنجح أول مرة، فأعدت ونجحت' } },
];

const TIER: Record<Tier, L> = { copper: { en: 'Copper', ar: 'نحاس' }, gold: { en: 'Gold', ar: 'ذهب' }, grand: { en: 'Gold and gem', ar: 'ذهب بجوهرة' } };
const TIER_DOT: Record<Tier, string> = { copper: 'bg-[#B4693F]', gold: 'bg-[#D9A441]', grand: 'bg-[#C51F24] ring-2 ring-[#D9A441]' };
const SUBJ: Record<Subject, { dot: string; t: L }> = {
  quran: { dot: 'bg-[#C51F24]', t: { en: 'Quran', ar: 'القرآن' } },
  zad: { dot: 'bg-[#087D91]', t: { en: 'Zad Path', ar: 'مسار زاد' } },
  lang: { dot: 'bg-[#C9772E]', t: { en: 'Languages', ar: 'اللغات' } },
  scholar: { dot: 'bg-[#D8C6AE]', t: { en: "Scholar's Path", ar: 'مسار العلماء' } },
};

/** Example learner for the shelf: a child who studies Quran only. Example data, never a real account. */
const EXAMPLE_EARNED: Record<string, number> = { 'first-lesson': 1, 'lessons-10': 1, 'lessons-25': 1, 'rhythm-4': 1, 'rhythm-12': 1, surah: 7, tajweed: 3, teacher: 1, 'homework-first': 1, 'homework-10': 1, 'lesson-mastered': 4, 'came-back': 2, 'tried-again': 1 };

const toArabicDigits = (s: string) => s.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

export default function BadgesPreviewPage() {
  const { isAr, t, toggleLanguage } = useT();
  const { theme, toggleTheme } = useTheme() as { theme: string; toggleTheme: () => void };
  const [open, setOpen] = useState<BadgeDef | null>(null);
  const pick = (x: L) => (isAr ? x.ar : x.en);
  const src = (b: BadgeDef) => `/badges/shelf/${b.id}${b.num && isAr ? '-ar' : ''}.webp`;
  const digits = (n: number) => (isAr ? toArabicDigits(String(n)) : String(n));

  useEffect(() => { hideBootSplash(); }, []);
  useEffect(() => { document.title = t('Badges (trial)', 'الأوسمة (تجربة)') + ' · Watazawwado'; }, [isAr]);

  const shelf = BADGES.filter((b) => !b.subj || b.subj === 'quran');
  const earned = shelf.filter((b) => EXAMPLE_EARNED[b.id]).length;

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-[#1F1A17] text-[#F4EEE6] text-sm text-center px-4 py-2">
        {t('Trial mode: these badges are being tried out and are not given to learners yet.', 'وضع التجربة: هذه الأوسمة قيد التجربة ولا تُمنح للطلاب بعد.')}
      </div>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pb-20 pt-8 grid gap-14">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-3 min-w-0 max-w-2xl">
            <p className="text-sm font-bold tracking-wide text-crimson">{t('Watazawwado Academy', 'أكاديمية وتزودوا')}</p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight text-balance">{t('The achievements shelf', 'رف الأوسمة')}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {t('Every badge a learner can earn with us. Each one marks something that really happened: a lesson attended, a surah memorised, a level finished, homework done on your own.',
                'كل وسام يمكن أن يكسبه الطالب معنا. كل وسام يسجّل شيئًا حدث فعلًا: حصة حضرها، أو سورة حفظها، أو مستوى أنهاه، أو واجب أتمّه وحده.')}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-[15px]">
              {[[24, t('badges', 'وسامًا')], [5, t('families', 'عائلات')], [3, t('tiers', 'درجات')]].map(([n, w]) => (
                <span key={String(w)}><b className="font-display text-2xl me-1">{digits(n as number)}</b>{w}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleLanguage}>{isAr ? 'English' : 'العربية'}</Button>
            <Button variant="outline" size="icon" onClick={toggleTheme} aria-label={t('Switch theme', 'تبديل المظهر')}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </header>

        <RevealStage isAr={isAr} t={t} />

        <section className="grid gap-5" aria-labelledby="read-h">
          <div className="grid gap-1">
            <h2 id="read-h" className="font-display text-2xl sm:text-3xl font-bold">{t('How to read a badge', 'كيف يُقرأ الوسام')}</h2>
            <p className="text-muted-foreground">{t('Three things you can tell at a glance, before reading a word.', 'ثلاثة أشياء تفهمها من نظرة، قبل أن تقرأ أي كلمة.')}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <KeyCard title={t('The shape is the family', 'الشكل يدل على العائلة')}>
              {FAMILIES.map((f) => {
                const ex = { lessons: 'lessons-25', rhythm: 'rhythm-12', subject: 'surah', teacher: 'teacher', homework: 'came-back' }[f.id];
                return <Mini key={f.id} src={src(BADGES.find((b) => b.id === ex)!)} label={pick(f.title)} />;
              })}
            </KeyCard>
            <KeyCard title={t('The metal is how big it is', 'المعدن يدل على حجم الإنجاز')} note={t('Copper for beginnings, gold for the middle, gold with a gem, clockwork and ribbons for the big ones.', 'نحاس للبدايات، وذهب للإنجازات المتوسطة، وذهب بجوهرة وتروس وشرائط للكبيرة.')}>
              {(['homework-10', 'homework-25', 'homework-50'] as const).map((id, i) => <Mini key={id} src={src(BADGES.find((b) => b.id === id)!)} label={pick(TIER[(['copper', 'gold', 'grand'] as Tier[])[i]])} />)}
            </KeyCard>
            <KeyCard title={t('The gem is the subject', 'الجوهرة تدل على المادة')} note={t('Lessons crimson, rhythm teal, homework dark brown.', 'الحصص قرمزي، والإيقاع فيروزي، والواجب بنّي داكن.')}>
              {(['khatma', 'zad-level', 'language-level', 'scholar-book'] as const).map((id) => { const b = BADGES.find((x) => x.id === id)!; return <Mini key={id} src={src(b)} label={pick(SUBJ[b.subj!].t)} />; })}
            </KeyCard>
          </div>
        </section>

        <section className="grid gap-5" aria-labelledby="shelf-h">
          <div className="grid gap-1">
            <h2 id="shelf-h" className="font-display text-2xl sm:text-3xl font-bold">{t('The shelf as a child sees it', 'الرف كما يراه طفل')}</h2>
            <p className="text-muted-foreground">{t('An example: a child who has studied Quran with us for four months.', 'مثال: طفل يدرس القرآن معنا منذ أربعة أشهر.')}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-[minmax(0,380px)_minmax(0,1fr)] items-start">
            <div className="rounded-[32px] border border-border bg-surface p-5 grid gap-5 shadow-[0_18px_40px_-28px_rgba(31,26,23,.45)]">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-2xl font-bold">{t('My badges', 'أوسمتي')}</h3>
                <span className="text-sm text-muted-foreground tabular-nums">{isAr ? `${digits(earned)} من ${digits(shelf.length)}` : `${earned} of ${shelf.length}`}</span>
              </div>
              {FAMILIES.map((f) => (
                <div key={f.id} className="grid gap-2">
                  <h4 className="text-xs font-bold text-muted-foreground">{f.id === 'subject' ? t('Quran', 'القرآن') : pick(f.title)}</h4>
                  <div className="grid grid-cols-4 gap-x-1 gap-y-3">
                    {shelf.filter((b) => b.fam === f.id).map((b) => {
                      const n = EXAMPLE_EARNED[b.id];
                      return (
                        <button key={b.id} type="button" onClick={() => setOpen(b)} className="relative grid justify-items-center gap-1 text-center text-[11px] leading-tight rounded-xl focus-ring cursor-pointer"
                          aria-label={pick(b.t) + (n ? '' : t(', not earned yet', '، لم يُكسب بعد'))}>
                          <img src={src(b)} alt="" width={72} height={72} loading="lazy" className={`w-full max-w-[72px] aspect-square object-contain ${n ? '' : 'grayscale contrast-50 brightness-110 opacity-35 dark:brightness-50 dark:opacity-45'}`} />
                          {n > 1 && <span className="absolute top-0 start-1 rounded-full bg-foreground text-background text-[11px] font-bold px-1.5 tabular-nums">×{digits(n)}</span>}
                          <span className={n ? 'text-foreground' : 'text-muted-foreground'}>{pick(b.t)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-5">
              {[
                [t('Not earned yet', 'ما لم يُكسب بعد'), t('A faint shadow of the same badge, so you see what is ahead and what earns it.', 'ظل باهت لنفس الوسام، فترى ما ينتظرك وما يكسبه.')],
                [t('Badges that repeat', 'الأوسمة المتكررة'), t('One badge with a count (×7), so the shelf stays calm.', 'وسام واحد عليه عدد (×٧)، فلا يزدحم الرف.')],
                [t('Only your subjects', 'موادك فقط'), t('This child studies Quran only, so the Zad Path and language badges do not appear.', 'هذا الطفل يدرس القرآن فقط، فلا تظهر له أوسمة مسار زاد واللغات.')],
                [t('No ranking', 'بلا ترتيب'), t('No comparing with others, no points, and nothing is taken away after a missed week.', 'لا مقارنة بأحد، ولا نقاط، ولا يُسحب وسام إذا غبت أسبوعًا.')],
              ].map(([h, p]) => (
                <div key={h} className="grid gap-1"><b className="font-display text-lg">{h}</b><p className="text-muted-foreground max-w-prose">{p}</p></div>
              ))}
              <p className="text-sm text-muted-foreground">{t('Tap any badge to see it up close.', 'اضغط أي وسام لتراه عن قرب.')}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-8" aria-labelledby="all-h">
          <div className="grid gap-1">
            <h2 id="all-h" className="font-display text-2xl sm:text-3xl font-bold">{t('Every badge', 'الأوسمة كلها')}</h2>
          </div>
          {FAMILIES.map((f) => {
            const items = BADGES.filter((b) => b.fam === f.id);
            return (
              <div key={f.id} className="grid gap-4 border-t border-border pt-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="font-display text-xl font-bold">{pick(f.title)}</h3>
                  <span className="text-sm text-muted-foreground">{digits(items.length)} · {pick(f.shape)}</span>
                </div>
                <p className="text-muted-foreground -mt-2">{pick(f.lede)}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {items.map((b) => (
                    <button key={b.id} type="button" onClick={() => setOpen(b)} className="rounded-2xl border border-border bg-surface p-3 pb-4 grid justify-items-center content-start gap-1.5 text-center cursor-pointer transition-transform hover:-translate-y-0.5 focus-ring">
                      <img src={src(b)} alt="" width={140} height={140} loading="lazy" className="w-full max-w-[140px] aspect-square object-contain" />
                      <span className="font-display font-bold leading-snug">{pick(b.t)}</span>
                      <span className="text-[13px] text-muted-foreground leading-snug">{pick(b.e)}</span>
                      <TierTag tier={b.tier} pick={pick} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <footer className="text-sm text-muted-foreground border-t border-border pt-6">
          {t('Trial page. The badges will reach learners\' shelves once this trial is approved.', 'صفحة تجريبية. تصل الأوسمة إلى رفوف الطلاب بعد اعتماد هذه التجربة.')}
        </footer>
      </main>

      <Modal isOpen={!!open} onClose={() => setOpen(null)} maxWidth="sm">
        {open && (
          <div className="grid justify-items-center gap-3 text-center pb-2">
            <img src={src(open)} alt="" width={240} height={240} className="w-60 h-60 object-contain" />
            <h3 className="font-display text-2xl font-bold">{pick(open.t)}</h3>
            <p className="text-muted-foreground">{pick(open.e)}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <TierTag tier={open.tier} pick={pick} />
              {open.subj && <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs"><i className={`w-2 h-2 rounded-full ${SUBJ[open.subj].dot}`} />{pick(SUBJ[open.subj].t)}</span>}
              {open.rep && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{t('Repeats with a count', 'يتكرر بعدد')}</span>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function TierTag({ tier, pick }: { tier: Tier; pick: (x: L) => string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs"><i className={`w-2 h-2 rounded-full ${TIER_DOT[tier]}`} />{pick(TIER[tier])}</span>;
}

function KeyCard({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 grid gap-3 content-start">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <div className="flex flex-wrap gap-1">{children}</div>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}

function Mini({ src, label }: { src: string; label: string }) {
  return (
    <div className="grid justify-items-center gap-0.5 w-[76px] text-center text-xs text-muted-foreground">
      <img src={src} alt="" width={60} height={60} loading="lazy" className="w-[60px] h-[60px] object-contain" />
      <span>{label}</span>
    </div>
  );
}

/** The big badge's clockwork reveal (2026-11-12 design), silent: the sound effects are not ready yet (owner, 2026-11-15). */
function RevealStage({ isAr, t }: { isAr: boolean; t: (en: string, ar: string) => string }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<'poster' | 'reveal' | 'idle'>('poster');
  const reveal = useRef<HTMLVideoElement>(null);
  const play = () => {
    setPhase('reveal');
    requestAnimationFrame(() => { const v = reveal.current; if (v) { v.currentTime = 0; v.play().catch(() => setPhase('idle')); } });
  };
  return (
    <section className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,360px)] items-center rounded-[28px] bg-[#1F1A17] text-[#F4EEE6] p-5 sm:p-8 overflow-hidden" aria-labelledby="reveal-h">
      <div className="grid gap-3 order-2 md:order-1">
        <p className="text-sm font-bold tracking-wide text-[#E5A93C]">{t('The big badges', 'الأوسمة الكبيرة')}</p>
        <h2 id="reveal-h" className="font-display text-2xl sm:text-3xl font-bold text-balance">{t('A moment made with care, like the effort behind it', 'لحظة مصنوعة بعناية، بقدر التعب الذي وراءها')}</h2>
        <p className="text-[#CDBFAE] max-w-prose">
          {t('When a child earns a big badge, its pieces fly in and lock together like a clock, and the gem goes in last like a key. Shown here without sound while we finish it.',
            'عندما يكسب الطفل وسامًا كبيرًا، تطير قطعه وتتعشّق معًا مثل الساعة، وتدخل الجوهرة أخيرًا كالمفتاح. يُعرض هنا بلا صوت حتى ننتهي منه.')}
        </p>
        {!reduce && (
          <div>
            <button type="button" onClick={play} className="inline-flex items-center gap-2 rounded-full bg-crimson text-white font-semibold px-5 min-h-[44px] cursor-pointer hover:bg-crimson-hover focus-ring">
              {phase === 'poster' ? <Play className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
              {phase === 'poster' ? t('Watch the reveal', 'شاهد المشهد') : t('Watch again', 'شاهده مرة أخرى')}
            </button>
          </div>
        )}
      </div>
      <div className="order-1 md:order-2 relative mx-auto w-full max-w-[360px] aspect-[4/5] rounded-2xl overflow-hidden bg-black">
        <img src="/badges/ruby-khatam/idle-poster.webp" alt={t('The ruby khatam badge', 'وسام الخاتم الياقوتي')} className="absolute inset-0 w-full h-full object-cover" />
        {!reduce && phase !== 'poster' && (
          <>
            <video ref={reveal} src="/badges/ruby-khatam/reveal.mp4" muted playsInline preload="auto" onEnded={() => setPhase('idle')}
              className={`absolute inset-0 w-full h-full object-cover ${phase === 'reveal' ? '' : 'hidden'}`} aria-hidden="true" />
            {phase === 'idle' && <video src="/badges/ruby-khatam/idle.mp4" muted playsInline autoPlay loop className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />}
          </>
        )}
        <span className="sr-only">{isAr ? 'مشهد بلا صوت' : 'Silent clip'}</span>
      </div>
    </section>
  );
}
