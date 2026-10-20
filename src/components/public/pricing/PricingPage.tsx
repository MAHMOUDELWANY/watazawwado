import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, PublicButton, PageHero } from '../PublicDesignSystem';
import { EnvelopeCard, EnvelopePlan } from './EnvelopeCard';
import { CalendarClock, ShieldCheck, HeartHandshake } from 'lucide-react';

// Approved $9/hour group packages (RULES.md §4, docs/pricing/packages.md). Display only:
// the server catalog charges the real price. Honest wording only, no invented social proof.
const PLANS: Array<{ en: EnvelopePlan; ar: EnvelopePlan }> = [
  {
    en: { id: 'pkg-4', tone: 'teal', title: 'Steady Start', meta: '4 lessons, 60 minutes each', perLesson: '$8.50', total: '$34 for 4 lessons. You save $2.', features: ['One lesson a week, a calm habit', 'Book each lesson when it suits you', 'Cancel up to 3 hours before'] },
    ar: { id: 'pkg-4', tone: 'teal', title: 'بداية ثابتة', meta: '٤ حصص، ٦٠ دقيقة لكل حصة', perLesson: '$8.50', total: '34$ لأربع حصص، وبتوفّر 2$', features: ['حصة في الأسبوع، عادة هادية', 'تحجز كل حصة في الوقت اللي يناسبك', 'إلغاء لحد ٣ ساعات قبل الحصة'] }
  },
  {
    en: { id: 'pkg-8', tone: 'crimson', title: 'Committed Learner', meta: '8 lessons, 60 minutes each', badge: 'Balanced', perLesson: '$8.25', total: '$66 for 8 lessons. You save $6.', features: ['Two lessons a week, progress you feel', 'A good rhythm for memorization', '5% off for a second child'] },
    ar: { id: 'pkg-8', tone: 'crimson', title: 'طالب ملتزم', meta: '٨ حصص، ٦٠ دقيقة لكل حصة', badge: 'متوازنة', perLesson: '$8.25', total: '66$ لثماني حصص، وبتوفّر 6$', features: ['حصتين في الأسبوع، تقدّم تحس بيه', 'وتيرة مناسبة للحفظ والمراجعة', 'خصم 5% للطفل التاني'] }
  },
  {
    en: { id: 'pkg-12', tone: 'copper', title: 'Fast Progress', meta: '12 lessons, 60 minutes each', badge: 'Best price', perLesson: '$8.00', total: '$96 for 12 lessons. You save $12.', features: ['Three lessons a week, faster steps', 'The lowest price per lesson', '5% off for a second child'] },
    ar: { id: 'pkg-12', tone: 'copper', title: 'تقدّم أسرع', meta: '١٢ حصة، ٦٠ دقيقة لكل حصة', badge: 'أقل سعر', perLesson: '$8.00', total: '96$ لاثنتي عشرة حصة، وبتوفّر 12$', features: ['٣ حصص في الأسبوع، خطوات أسرع', 'أقل سعر للحصة', 'خصم 5% للطفل التاني'] }
  }
];

/** Desktop: the hovered envelope opens. Touch screens: the envelope nearest the middle of the screen opens. */
function useOpenEnvelope(ids: string[]) {
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const [hovered, setHovered] = useState<string | null>(null);
  const [centered, setCentered] = useState<string | null>(null);
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
      setCentered(bestDist < window.innerHeight * 0.32 ? best : null);
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
    isOpen: (id: string) => (canHover ? hovered === id : centered === id),
    onHover: (id: string) => (h: boolean) => setHovered((cur) => (h ? id : cur === id ? null : cur))
  };
}

export function PricingPage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';
  const navigate = useNavigate();
  const envelopes = useOpenEnvelope(PLANS.map((p) => p.en.id));

  return (
    <main id="main-content" className="pt-24 lg:pt-32 pb-20">
      <PublicSection>
        <div className="max-w-5xl mx-auto space-y-12">
          <PageHero
            title={isEn ? <>Clear prices, <span className="text-ribbon">at your own pace.</span></> : <>أسعار واضحة، <span className="text-ribbon">وبالوتيرة اللي تناسبك.</span></>}
            intro={isEn
              ? 'Packages of 4, 8 or 12 lessons at a lower price per lesson. Pay once with Stripe. No subscription, nothing renews by itself.'
              : 'باقات ٤ أو ٨ أو ١٢ حصة بسعر أقل للحصة. تدفع مرة واحدة عبر Stripe. مفيش اشتراك، ومفيش تجديد تلقائي.'}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            {PLANS.map((p) => {
              const plan = isEn ? p.en : p.ar;
              return (
                <EnvelopeCard
                  key={plan.id}
                  ref={envelopes.register(plan.id)}
                  plan={plan}
                  open={envelopes.isOpen(plan.id)}
                  onHoverChange={envelopes.onHover(plan.id)}
                  isAr={!isEn}
                  primaryLabel={isEn ? 'Choose this package' : 'اختار الباقة دي'}
                  onPrimary={() => navigate('/student/packages')}
                  secondaryLabel={isEn ? 'Try a free lesson first' : 'جرّب حصة مجانية الأول'}
                  onSecondary={() => onOpenTrialModal()}
                />
              );
            })}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl mx-auto text-center">
            {isEn
              ? 'These packages are for Quran, Tajweed and the Zad Path. One lesson on its own is $9 an hour; a package brings it down to $8. Fusha, Egyptian Arabic and English start from $13 an hour, with their own $13 packages in your account. Shorter lessons cost the same per minute. Advanced or intensive study can cost more; your teacher sets it after an assessment, and you always see it before you pay.'
              : 'الباقات دي للقرآن والتجويد ومسار الأثر. الحصة لوحدها بـ 9$ للساعة، والباقة بتنزّلها لحد 8$. الفصحى والعامية المصرية والإنجليزية من 13$ للساعة، وليها باقات 13$ في حسابك. الحصص الأقصر بنفس السعر للدقيقة. والدراسة المتقدمة أو المكثفة ممكن تكون أعلى؛ بيحددها المعلم بعد التقييم، ودايماً بتشوفها قبل ما تدفع.'}
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
              <Link to="/faq" className="underline hover:text-foreground">{isEn ? 'Questions about paying?' : 'عندك سؤال عن الدفع؟'}</Link>
            </p>
          </div>
        </div>
      </PublicSection>
    </main>
  );
}
