import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from '../LangLink';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, PublicButton, PageHero } from '../PublicDesignSystem';
import { EnvelopeCard, EnvelopePlan } from './EnvelopeCard';
import { CalendarClock, ShieldCheck, HeartHandshake } from 'lucide-react';
import { BOOKABLE_SERVICES } from '../../../booking/mockData';

// Approved packages for both price bands (RULES.md §4, docs/pricing/packages.md), 60-minute lessons. Display only:
// the server catalog charges the real price. Honest wording only, no invented social proof.
type Band = 9 | 13;
const TIERS: Record<Band, Array<{ perLesson: string; total: number; save: number }>> = {
  9: [{ perLesson: '8.50', total: 34, save: 2 }, { perLesson: '8.25', total: 66, save: 6 }, { perLesson: '8.00', total: 96, save: 12 }],
  13: [{ perLesson: '12.25', total: 49, save: 3 }, { perLesson: '12.00', total: 96, save: 8 }, { perLesson: '11.50', total: 138, save: 18 }],
};
const AR_COUNT = ['لأربع حصص', 'لثماني حصص', 'لاثنتي عشرة حصة'];
// Short names for the subject picker (the catalog names are written for the booking flow).
const SHORT: Record<string, [string, string]> = {
  'quran-reading': ['Quran Reading', 'قراءة القرآن'],
  'tajweed': ['Tajweed', 'التجويد'],
  'quran-memorization': ['Memorization & Revision', 'الحفظ والمراجعة'],
  'zad-essentials': ['Zad Essentials', 'أول الزاد'],
  'seerah': ['Seerah', 'السيرة'],
  'modern-standard-arabic': ['Fusha Arabic', 'الفصحى'],
  'egyptian-arabic': ['Egyptian Arabic', 'العامية المصرية'],
  'english': ['English', 'الإنجليزية'],
};

function plansFor(band: Band): Array<{ en: EnvelopePlan; ar: EnvelopePlan }> {
  const [t4, t8, t12] = TIERS[band];
  return [
    {
      en: { id: 'pkg-4', tone: 'teal', title: 'Steady Start', meta: '4 lessons, 60 minutes each', perLesson: `$${t4.perLesson}`, total: `$${t4.total} for 4 lessons. You save $${t4.save}.`, features: ['One lesson a week, a calm habit', 'Book each lesson when it suits you', 'Cancel up to 3 hours before'] },
      ar: { id: 'pkg-4', tone: 'teal', title: 'بداية ثابتة', meta: '٤ حصص، ٦٠ دقيقة لكل حصة', perLesson: `$${t4.perLesson}`, total: `${t4.total}$ ${AR_COUNT[0]}، وبتوفّر ${t4.save}$`, features: ['حصة في الأسبوع، عادة هادية', 'تحجز كل حصة في الوقت اللي يناسبك', 'إلغاء لحد ٣ ساعات قبل الحصة'] }
    },
    {
      en: { id: 'pkg-8', tone: 'crimson', title: 'Committed Learner', meta: '8 lessons, 60 minutes each', badge: 'Balanced', perLesson: `$${t8.perLesson}`, total: `$${t8.total} for 8 lessons. You save $${t8.save}.`, features: ['Two lessons a week, progress you feel', band === 9 ? 'A good rhythm for memorization' : 'A good rhythm for a new language', '5% off for a second child'] },
      ar: { id: 'pkg-8', tone: 'crimson', title: 'طالب ملتزم', meta: '٨ حصص، ٦٠ دقيقة لكل حصة', badge: 'متوازنة', perLesson: `$${t8.perLesson}`, total: `${t8.total}$ ${AR_COUNT[1]}، وبتوفّر ${t8.save}$`, features: ['حصتين في الأسبوع، تقدّم تحس بيه', band === 9 ? 'وتيرة مناسبة للحفظ والمراجعة' : 'وتيرة مناسبة للغة جديدة', 'خصم 5% للطفل التاني'] }
    },
    {
      en: { id: 'pkg-12', tone: 'copper', title: 'Fast Progress', meta: '12 lessons, 60 minutes each', badge: 'Best price', perLesson: `$${t12.perLesson}`, total: `$${t12.total} for 12 lessons. You save $${t12.save}.`, features: ['Three lessons a week, faster steps', 'The lowest price per lesson', '5% off for a second child'] },
      ar: { id: 'pkg-12', tone: 'copper', title: 'تقدّم أسرع', meta: '١٢ حصة، ٦٠ دقيقة لكل حصة', badge: 'أقل سعر', perLesson: `$${t12.perLesson}`, total: `${t12.total}$ ${AR_COUNT[2]}، وبتوفّر ${t12.save}$`, features: ['٣ حصص في الأسبوع، خطوات أسرع', 'أقل سعر للحصة', 'خصم 5% للطفل التاني'] }
    }
  ];
}

/**
 * Desktop: the hovered envelope opens. Touch screens: a tap opens an envelope; scrolling opens the envelope nearest the
 * middle of the screen (phones, one per row) and replaces an earlier tap once the centred envelope changes.
 */
function useOpenEnvelope(ids: string[]) {
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const [hovered, setHovered] = useState<string | null>(null);
  const [centered, setCentered] = useState<string | null>(null);
  const [tapped, setTapped] = useState<string | null>(null);
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (canHover) return;
    // Three rects per scroll event is cheap; no rAF so it also runs while the tab is hidden.
    const pick = () => {
      const mid = window.innerHeight / 2;
      let best: string | null = null;
      let bestDist = Infinity;
      for (const id of ids) {
        const el = refs.current[id];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) continue;
        const dist = Math.abs((r.top + r.bottom) / 2 - mid);
        if (dist < bestDist) { bestDist = dist; best = id; }
      }
      // Only open when an envelope is really near the middle, not just peeking at an edge.
      const next = bestDist < window.innerHeight * 0.32 ? best : null;
      setCentered((cur) => { if (cur !== next) setTapped(null); return next; });
    };
    pick();
    window.addEventListener('scroll', pick, { passive: true });
    window.addEventListener('resize', pick);
    return () => {
      window.removeEventListener('scroll', pick);
      window.removeEventListener('resize', pick);
    };
  }, [canHover, ids.join(',')]);

  return {
    register: (id: string) => (el: HTMLDivElement | null) => { refs.current[id] = el; },
    isOpen: (id: string) => (canHover ? hovered === id : (tapped ?? centered) === id),
    onTap: (id: string) => () => { if (!canHover) setTapped(id); },
    onHover: (id: string) => (h: boolean) => setHovered((cur) => (h ? id : cur === id ? null : cur))
  };
}

export function PricingPage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';
  const navigate = useNavigate();
  // The chosen subject picks the price band ($9 or from $13); it lives in ?subject= so the subject cards can link here.
  const [params, setParams] = useSearchParams();
  const subject = BOOKABLE_SERVICES.find((b) => b.id === params.get('subject')) || null;
  const band: Band | null = subject ? (subject.hourlyRateUsd > 9 ? 13 : 9) : null;
  const plans = band ? plansFor(band) : [];
  const envelopes = useOpenEnvelope(plans.map((p) => p.en.id));
  const pick = (id: string) => setParams((prev) => { const next = new URLSearchParams(prev); next.set('subject', id); return next; }, { replace: true, preventScrollReset: true });

  return (
    <main id="main-content" className="pt-16 sm:pt-20 pb-20">
      <PublicSection>
        <div className="max-w-5xl mx-auto space-y-12">
          <PageHero
            title={isEn ? <>Clear prices, <span className="text-ribbon">at your own pace.</span></> : <>أسعار واضحة، <span className="text-ribbon">وبالوتيرة اللي تناسبك.</span></>}
            intro={isEn
              ? 'Packages of 4, 8 or 12 lessons at a lower price per lesson. Pay once with Stripe. No subscription, nothing renews by itself.'
              : 'باقات ٤ أو ٨ أو ١٢ حصة بسعر أقل للحصة. تدفع مرة واحدة عبر Stripe. مفيش اشتراك، ومفيش تجديد تلقائي.'}
          />

          <section aria-labelledby="pick-subject" className="space-y-4">
            <h2 id="pick-subject" className="text-center font-editorial text-xl sm:text-2xl font-bold text-foreground">
              {isEn ? 'Choose a subject to see its packages' : 'اختار المادة عشان تشوف باقاتها'}
            </h2>
            <div role="radiogroup" aria-labelledby="pick-subject" className="flex flex-wrap justify-center gap-2">
              {BOOKABLE_SERVICES.map((s) => {
                const on = subject?.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => pick(s.id)}
                    className={`min-h-11 px-4 rounded-full border text-sm font-bold transition-colors cursor-pointer focus-ring ${on ? 'bg-[var(--teal)] border-[var(--teal)] text-white' : 'bg-surface border-border text-foreground hover:border-[var(--teal)]'}`}
                  >
                    {SHORT[s.id]?.[isEn ? 0 : 1] ?? (isEn ? s.name : (s.arabicName || s.name))}
                  </button>
                );
              })}
            </div>
            {subject && (
              <p className="text-center text-sm text-muted-foreground" aria-live="polite">
                {band === 9
                  ? (isEn ? 'One lesson on its own: $9 an hour. A package brings it down to $8.' : 'الحصة لوحدها: 9$ للساعة، والباقة بتنزّلها لحد 8$.')
                  : (isEn ? 'One lesson on its own: from $13 an hour. A package brings it down to $11.50.' : 'الحصة لوحدها: من 13$ للساعة، والباقة بتنزّلها لحد 11.50$.')}
              </p>
            )}
          </section>

          {band && <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            {plans.map((p) => {
              const plan = isEn ? p.en : p.ar;
              return (
                <EnvelopeCard
                  key={plan.id}
                  ref={envelopes.register(plan.id)}
                  plan={plan}
                  open={envelopes.isOpen(plan.id)}
                  onHoverChange={envelopes.onHover(plan.id)}
                  onTap={envelopes.onTap(plan.id)}
                  isAr={!isEn}
                  primaryLabel={isEn ? 'Choose this package' : 'اختار الباقة دي'}
                  onPrimary={() => navigate('/student/packages')}
                  secondaryLabel={isEn ? 'Try a free lesson first' : 'جرّب حصة مجانية الأول'}
                  onSecondary={() => onOpenTrialModal()}
                />
              );
            })}
          </div>}

          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl mx-auto text-center">
            {isEn
              ? 'Quran, Tajweed, Memorization and the Zad Path are $9 an hour; Fusha, Egyptian Arabic and English start from $13 an hour. Package prices are for 60-minute lessons; shorter lessons cost the same per minute. Advanced or intensive study can cost more; your teacher sets it after an assessment, and you always see it before you pay.'
              : 'القرآن والتجويد والحفظ ومسار الأثر بـ 9$ للساعة، والفصحى والعامية المصرية والإنجليزية من 13$ للساعة. أسعار الباقات لحصص ٦٠ دقيقة، والحصص الأقصر بنفس السعر للدقيقة. والدراسة المتقدمة أو المكثفة ممكن تكون أعلى؛ بيحددها المعلم بعد التقييم، ودايماً بتشوفها قبل ما تدفع.'}
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: CalendarClock, en: ['Your time, your pace', 'Move a lesson up to 1 hour before.'], ar: ['وقتك وإيقاعك', 'غيّر ميعاد الحصة لحد ساعة قبلها.'] },
              { icon: ShieldCheck, en: ['Safe payment', 'Card, Apple Pay or PayPal, through Stripe.'], ar: ['دفع آمن', 'بطاقة أو Apple Pay أو PayPal عبر Stripe.'] },
              { icon: HeartHandshake, en: ['A teacher who knows you', 'The same teacher, lesson after lesson.'], ar: ['معلم يعرفك', 'نفس المعلم، حصة بعد حصة.'] }
            ].map(({ icon: Icon, en, ar }) => (
              <li key={en[0]} className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-surface">
                <span className="arch-tile shrink-0 w-10 h-11 flex items-center justify-center bg-[#087D91]/10 text-[#087D91] dark:text-[#12A4BC]">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-bold text-foreground text-sm">{isEn ? en[0] : ar[0]}</span>
                  <span className="block text-sm text-muted-foreground">{isEn ? en[1] : ar[1]}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="text-center space-y-3">
            <PublicButton size="lg" onClick={() => onOpenTrialModal()} className="px-8">
              {isEn ? 'Book your free trial lesson' : 'احجز حصتك التجريبية المجانية'}
            </PublicButton>
            <p className="text-sm text-muted-foreground">
              <Link to="/faq" className="inline-flex items-center min-h-11 underline hover:text-foreground">{isEn ? 'Questions about paying?' : 'عندك سؤال عن الدفع؟'}</Link>
            </p>
          </div>
        </div>
      </PublicSection>
    </main>
  );
}
