import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { CalendarClock, ShieldCheck, MessageCircle } from 'lucide-react';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, PublicButton, PageHero } from '../PublicDesignSystem';
import { HOW_IT_WORKS_STEPS, TEACHING_PILLARS } from '../../../data/content';
import { WhatsAppIcon } from '../../ui/WhatsAppIcon';
import { buildWhatsAppUrl } from '../../../lib/whatsapp';
import { ValueCard, PORTALS } from '../ValueCard';
import {
  TrialCalendarEmblem, MeetLevelEmblem, PlanScrollEmblem, LessonLaptopEmblem,
  HourglassEmblem, UnderstandEmblem, WeekHabitEmblem, AdabEmblem,
} from '../illustrations/ValueEmblems';

const STEP_EMBLEMS = [TrialCalendarEmblem, MeetLevelEmblem, PlanScrollEmblem, LessonLaptopEmblem];
const PILLAR_EMBLEMS = [HourglassEmblem, UnderstandEmblem, WeekHabitEmblem, AdabEmblem];
const AR_DIGITS = ['١', '٢', '٣', '٤'];

export function HowItWorksPage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  const promises = [
    { icon: ShieldCheck, en: ['A free first lesson', '30 minutes, no card, nothing renews.'], ar: ['أول حصة مجاناً', '٣٠ دقيقة، من غير بطاقة، ومفيش حاجة بتتجدد.'] },
    { icon: CalendarClock, en: ['Your time, your pace', 'Move a lesson up to 1 hour before, cancel up to 3 hours before.'], ar: ['وقتك وإيقاعك', 'غيّر الميعاد لحد ساعة قبلها، أو الغي لحد ٣ ساعات قبلها.'] },
    { icon: MessageCircle, en: ['Your teacher, close by', 'Ask between lessons in the chat on the site.'], ar: ['معلمك قريب منك', 'اسأله بين الحصص في المحادثة على الموقع.'] },
  ];

  return (
    <main id="main-content" className="pt-24 lg:pt-32 pb-20">
      <PublicSection>
        <div className="max-w-5xl mx-auto space-y-16 lg:space-y-20">

          <PageHero
            title={isEn ? <>From your first lesson <span className="text-ribbon">to real, lasting progress.</span></> : <>من حصتك الأولى <span className="text-ribbon">لحد تقدّم حقيقي ومستمر.</span></>}
            intro={isEn
              ? 'Four clear steps, from a free trial to weekly lessons with your own teacher.'
              : 'أربع خطوات واضحة، من الحصة التجريبية المجانية لحد حصصك الأسبوعية مع معلمك.'}
          />

          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" aria-label={isEn ? 'The four steps' : 'الخطوات الأربع'}>
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <li key={step.step}>
                <ValueCard
                  index={i}
                  headingLevel={2}
                  emblem={STEP_EMBLEMS[i]}
                  portal={PORTALS[i % PORTALS.length]}
                  label={isEn ? `Step ${i + 1}` : `الخطوة ${AR_DIGITS[i]}`}
                  title={isEn ? step.title : step.arabicTitle}
                  text={isEn ? step.description : step.arabicDescription}
                />
              </li>
            ))}
          </ol>

          <section aria-labelledby="pillars-title" className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 id="pillars-title" className="font-editorial text-3xl sm:text-4xl text-foreground font-bold">
                {isEn ? 'Principles in every lesson' : 'مبادئ راسخة في كل درس'}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {isEn ? 'Four things we never trade away, whatever the subject.' : 'أربع حاجات مبنتنازلش عنها، أياً كانت المادة.'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {TEACHING_PILLARS.map((pillar, i) => (
                <ValueCard
                  key={pillar.title}
                  index={i}
                  emblem={PILLAR_EMBLEMS[i]}
                  portal={PORTALS[(i + 2) % PORTALS.length]}
                  title={isEn ? pillar.title : pillar.arabicTitle}
                  text={isEn ? pillar.description : pillar.arabicDescription}
                />
              ))}
            </div>
          </section>

          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {promises.map(({ icon: Icon, en, ar }) => (
              <li key={en[0]} className="flex items-start gap-3 p-4 rounded-[var(--r-3)] border border-border bg-surface shadow-[var(--shadow-1)]">
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

          <section className="band-deep relative overflow-hidden rounded-[2rem] px-6 py-12 sm:px-12 lg:py-16 text-center">
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold leading-tight">
              {isEn ? 'The first step is the easiest.' : 'أول خطوة هي الأسهل.'}
            </h2>
            <p className="mt-3 text-base sm:text-lg leading-relaxed max-w-xl mx-auto text-[#FAF7F2]/80">
              {isEn
                ? 'Pick a time that suits you. Your teacher meets you on Zoom, listens, and suggests the way.'
                : 'اختار الميعاد اللي يناسبك. معلمك هيقابلك على Zoom، ويسمعك، ويقترح عليك الطريق.'}
            </p>
            <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
              <PublicButton variant="primary" size="lg" onClick={() => onOpenTrialModal()} className="w-full sm:w-auto">
                {isEn ? 'Book your free trial lesson' : 'احجز حصتك التجريبية المجانية'}
              </PublicButton>
              <a
                href={buildWhatsAppUrl(isEn ? 'Assalamu alaikum, I read How it works on Watazawwado and have a question.' : 'السلام عليكم، قريت صفحة كيف نعمل على وتزودوا وعندي سؤال.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold bg-[#25D366] text-[#07361F] hover:bg-[#20BD5A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05363F] focus-visible:ring-[#25D366]"
              >
                <WhatsAppIcon className="w-4 h-4 shrink-0" />
                <span>{isEn ? 'Ask us on WhatsApp' : 'اسألنا على واتساب'}</span>
              </a>
            </div>
            <p className="mt-6 text-sm text-[#FAF7F2]/75 flex flex-wrap justify-center gap-x-5 gap-y-2">
              <Link to="/learning" className="inline-flex items-center min-h-11 underline hover:text-[#FAF7F2]">{isEn ? 'The subjects' : 'المواد'}</Link>
              <Link to="/pricing" className="inline-flex items-center min-h-11 underline hover:text-[#FAF7F2]">{isEn ? 'Prices' : 'الأسعار'}</Link>
              <Link to="/about" className="inline-flex items-center min-h-11 underline hover:text-[#FAF7F2]">{isEn ? 'About us' : 'من نحن'}</Link>
            </p>
          </section>

        </div>
      </PublicSection>
    </main>
  );
}
