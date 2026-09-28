import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Globe, Sparkles, Check, ArrowRight, Video, Calendar, ShieldCheck } from 'lucide-react';
import { Language } from '../types';

interface DisciplineSwitcherShowcaseProps {
  lang: Language;
  onOpenTrialModal: (serviceId?: string) => void;
}

type PillarId = 'quran' | 'arabic' | 'studies';

export const DisciplineSwitcherShowcase: React.FC<DisciplineSwitcherShowcaseProps> = ({
  lang,
  onOpenTrialModal,
}) => {
  const isEn = lang === 'en';
  const isRtl = lang === 'ar';

  const [activePillar, setActivePillar] = useState<PillarId>('quran');
  const [activeLevelIndex, setActiveLevelIndex] = useState<number>(0);

  const pillars = [
    {
      id: 'quran' as PillarId,
      number: '01',
      badge: isEn ? 'Al-Azhar Sanad' : 'سند أزهري متصل',
      status: isEn ? 'Available now' : 'متاح للتسجيل',
      title: isEn ? 'Quran & Tajweed' : 'القرآن والتجويد',
      subtitle: isEn
        ? 'For deep phonetic precision, makharij correction, and fluent hifz.'
        : 'لضبط مخارج الحروف، وإتقان أحكام التلاوة، والحفظ الراسخ.',
      levels: isEn
        ? [
            {
              name: 'Noorani & Letter Phonetics',
              desc: 'For non-Arabic speakers and beginners starting from the alphabet.',
              durations: '30 / 45 min',
              icon: '✦',
            },
            {
              name: 'Intermediate Tajweed & Recitation',
              desc: 'Live Mushaf recitation with immediate rule application (Idgham, Madd, Ghunnah).',
              durations: '45 / 60 min',
              icon: '✦',
            },
            {
              name: 'Hifz & Systematic Revision',
              desc: 'Structured memorization schedules with retention benchmarks.',
              durations: '45 / 60 min',
              icon: '✦',
            },
          ]
        : [
            {
              name: 'القاعدة النورانية ومخارج الحروف',
              desc: 'للمبتدئين وغير الناطقين بالعربية لتأسيس نطق صحيح من الصفر.',
              durations: '٣٠ / ٤٥ دقيقة',
              icon: '✦',
            },
            {
              name: 'التجويد التطبيقي والتلاوة المرتلة',
              desc: 'قراءة مباشرة من المصحف وتطبيق أحكام النون والميم والمدود فوراً.',
              durations: '٤٥ / ٦٠ دقيقة',
              icon: '✦',
            },
            {
              name: 'الحفظ والمراجعة المنهجية',
              desc: 'جداول تسميع دورية تضمن تثبيت الآيات وتفادي النسيان.',
              durations: '٤٥ / ٦٠ دقيقة',
              icon: '✦',
            },
          ],
    },
    {
      id: 'arabic' as PillarId,
      number: '02',
      badge: isEn ? 'Fusha & Egyptian' : 'فصحى وعامية',
      status: isEn ? 'Available now' : 'متاح للتسجيل',
      title: isEn ? 'Arabic Language' : 'اللغة العربية',
      subtitle: isEn
        ? 'For Quranic comprehension, conversational confidence, and practical grammar.'
        : 'لفهم مفردات القرآن، وبناء الطلاقة الحوارية، وفهم النحو التطبيقي.',
      levels: isEn
        ? [
            {
              name: 'Modern Standard Arabic (Fusha)',
              desc: 'Formal reading, writing, and vocabulary for media, literature, and text.',
              durations: '45 / 60 min',
              icon: '✦',
            },
            {
              name: 'Egyptian Colloquial Arabic',
              desc: 'The most widely understood spoken dialect for daily life, travel, and family.',
              durations: '30 / 45 min',
              icon: '✦',
            },
            {
              name: 'Arabic Conversation & Grammar',
              desc: 'Bridge theoretical Nahw/Sarf directly into confident spoken sentences.',
              durations: '45 / 60 min',
              icon: '✦',
            },
          ]
        : [
            {
              name: 'العربية الفصحى المعاصرة',
              desc: 'قراءة وكتابة وفهم النصوص والمصطلحات الفصيحة بصورة متدرجة.',
              durations: '٤٥ / ٦٠ دقيقة',
              icon: '✦',
            },
            {
              name: 'اللهجة المصرية الحوارية',
              desc: 'اللهجة الأكثر انتشاراً وفهماً للتواصل اليومي والسفر والعائلة.',
              durations: '٣٠ / ٤٥ دقيقة',
              icon: '✦',
            },
            {
              name: 'المحادثة والنحو التطبيقي',
              desc: 'تحويل القواعد النحوية النظرية إلى طلاقة في التعبير والكلام.',
              durations: '٤٥ / ٦٠ دقيقة',
              icon: '✦',
            },
          ],
    },
    {
      id: 'studies' as PillarId,
      number: '03',
      badge: isEn ? 'Al-Azhar Verified' : 'منهج أزهري معتمد',
      status: isEn ? 'Available now' : 'متاح للتسجيل',
      title: isEn ? 'Islamic Studies' : 'الدراسات الإسلامية',
      subtitle: isEn
        ? 'For daily Fiqh, pure Aqeedah, and inspiring prophetic Seerah for modern life.'
        : 'لتعلم الفقه اليومي، والعقيدة الصحيحة، والسيرة النبوية المؤثرة في واقعنا.',
      levels: isEn
        ? [
            {
              name: 'Daily Fiqh & Salah Workshop',
              desc: 'Purification, prayer essentials, and practical everyday rulings.',
              durations: '30 / 45 min',
              icon: '✦',
            },
            {
              name: 'Authentic Aqeedah & Faith',
              desc: 'Core beliefs explained clearly and calmly to strengthen conviction.',
              durations: '45 / 60 min',
              icon: '✦',
            },
            {
              name: 'Prophetic Seerah & Character',
              desc: 'Stories and morals from the life of the Prophet ﷺ and his companions.',
              durations: '45 / 60 min',
              icon: '✦',
            },
          ]
        : [
            {
              name: 'فقه العبادات وأحكام الصلاة',
              desc: 'الطهارة، أحكام الصلاة، والمسائل اليومية بأسلوب ميسر ومباشر.',
              durations: '٣٠ / ٤٥ دقيقة',
              icon: '✦',
            },
            {
              name: 'العقيدة الإسلامية الصافية',
              desc: 'أركان الإيمان وبناء اليقين القلبي بهدوء وعقلانية.',
              durations: '٤٥ / ٦٠ دقيقة',
              icon: '✦',
            },
            {
              name: 'السيرة النبوية والأخلاق',
              desc: 'دروس وعبر من حياة الحبيب المصطفى ﷺ وصحابته الكرام.',
              durations: '٤٥ / ٦٠ دقيقة',
              icon: '✦',
            },
          ],
    },
  ];

  const currentPillarData = pillars.find((p) => p.id === activePillar) || pillars[0];
  const currentLevel = currentPillarData.levels[activeLevelIndex] || currentPillarData.levels[0];

  return (
    <section
      id="discipline-switcher"
      className="py-20 lg:py-28 bg-background border-b border-border/80 dark:border-border transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header (Mirrors 00:04 in video) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-2xl">
            {/* Index Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/40 dark:bg-secondary/20 border border-secondary/60 text-accent dark:text-accent text-xs font-semibold tracking-wide mb-4">
              <span className="font-mono text-[11px] font-bold">02</span>
              <span>{isEn ? 'Your Choice of Discipline' : 'اختيارك الشخصي'}</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-foreground tracking-tight mb-4">
              {isEn ? (
                <>
                  Choose the subject you need.{' '}
                  <span className="text-primary dark:text-primary">Switch when your goals change.</span>
                </>
              ) : (
                <>
                  اختر التخصص الذي تريده.{' '}
                  <span className="text-primary dark:text-primary">وغيّر تركيزك متى تطورت أهدافك.</span>
                </>
              )}
            </h2>
          </div>

          <div className="max-w-sm text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {isEn
              ? 'You pick the discipline before every lesson. When your family needs change, switch it seamlessly without looking for another teacher.'
              : 'تحدد المادة التي تريد التركيز عليها قبل كل جلسة. وحين تتغير متطلباتك، تنتقل بسلاسة مع نفس المعلم دون عناء البحث من جديد.'}
          </div>
        </div>

        {/* 3 Interactive Cards (Mirrors 00:05 in video) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-8">
          {pillars.map((pillar) => {
            const isSelected = activePillar === pillar.id;

            return (
              <motion.div
                key={pillar.id}
                onClick={() => {
                  setActivePillar(pillar.id);
                  setActiveLevelIndex(0);
                }}
                whileHover={{ y: -4 }}
                className={`p-6 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-background dark:bg-surface-subtle border-primary shadow-lg shadow-primary/15 ring-2 ring-primary/20'
                    : 'bg-surface border-border hover:border-accent/50 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-4">
                    <span>{pillar.number}</span>
                    <span className="text-[11px] text-primary font-medium bg-secondary/30 px-2.5 py-0.5 rounded-full">
                      {pillar.status}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-primary dark:text-primary mb-1">
                    {pillar.badge}
                  </div>

                  <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                    {pillar.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                    {pillar.subtitle}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/60 dark:border-border/60 flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary dark:text-primary">
                    {isSelected ? (isEn ? '● Active Focus' : '● التخصص المختار') : (isEn ? 'Select Focus' : 'اختر المادة')}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-primary border-primary text-white'
                        : 'border-border'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* ACTIVE BAR & INTERACTIVE LEVEL EXPLORER (Mirrors 00:06 - 00:07 in video) */}
        {/* ========================================================================= */}
        <motion.div
          layout
          className="rounded-2xl sm:rounded-3xl bg-surface-warm dark:bg-surface-subtle text-foreground border border-border p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-sm mb-8"
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span className="font-display text-lg sm:text-xl font-semibold">
              {currentPillarData.title}
            </span>
            <span className="hidden sm:inline text-white/70">→</span>
            <span className="text-xs sm:text-sm text-white/90">
              {isEn ? 'Sessions available: 30, 45, or 60 Min' : 'خيارات الجلسات: ٣٠، ٤٥، أو ٦٠ دقيقة'}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs font-mono bg-white/20 px-3 py-1 rounded-lg">
              {isEn ? 'Free Trial Available' : 'جلسة تجريبية مجانية'}
            </span>
            <button
              onClick={() => onOpenTrialModal(currentPillarData.id)}
              className="px-4 py-2 rounded-xl bg-white text-foreground text-xs font-semibold hover:bg-foreground transition-colors cursor-pointer shadow-xs"
            >
              {isEn ? 'Book for this subject' : 'احجز لهذه المادة'}
            </button>
          </div>
        </motion.div>

        {/* Level Selector & Real-Time Connection Diagram (Mirrors 00:07 in video) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-background dark:bg-surface p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-border">
          
          {/* Left: Step Levels (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {isEn ? 'Curriculum Progression Levels' : 'مستويات التدرج التعليمي'}
            </div>

            {currentPillarData.levels.map((lvl, idx) => {
              const isLvlSelected = activeLevelIndex === idx;

              return (
                <button
                  key={idx}
                  onClick={() => setActiveLevelIndex(idx)}
                  className={`w-full text-left sm:text-start p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isLvlSelected
                      ? 'bg-background border-primary shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-white/60 dark:hover:bg-surface-subtle'
                  }`}
                >
                  <span className="font-mono text-xs font-bold text-primary dark:text-primary mt-0.5">
                    0{idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-xs sm:text-sm text-foreground">
                      {lvl.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {lvl.durations}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Live Connection Node Diagram (7 cols) */}
          <div className="lg:col-span-7 bg-background p-6 sm:p-8 rounded-2xl border border-border flex flex-col justify-between">
            <div>
              {/* Status Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border/80 dark:border-border mb-6">
                <div className="text-xs font-semibold text-muted-foreground">
                  {isEn ? 'Selected Module Specification' : 'تفاصيل الوحدة المختارة'}
                </div>
                <span className="text-[10px] font-mono text-primary dark:text-primary bg-secondary/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {isEn ? 'Ready in Free Trial' : 'جاهز للجلسة التجريبية'}
                </span>
              </div>

              {/* The Connection Diagram (Matching 00:07 in video) */}
              <div className="py-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 my-4">
                
                {/* Learner Node */}
                <div className="w-full sm:w-44 p-4 rounded-xl bg-surface-warm dark:bg-surface-subtle border border-border text-center">
                  <div className="w-8 h-8 rounded-full bg-secondary/30 text-accent mx-auto mb-2 flex items-center justify-center font-bold text-xs">
                    You
                  </div>
                  <div className="font-semibold text-xs text-foreground">
                    {isEn ? 'Student / Family' : 'الطالب / الأسرة'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {isEn ? 'Local Timezone' : 'توقيتك المحلي'}
                  </div>
                </div>

                {/* Connection Bridge */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono font-semibold text-primary bg-primary/15 px-2 py-0.5 rounded">
                    Direct Zoom HD
                  </span>
                  <div className="w-16 h-0.5 bg-primary/40 relative">
                    <motion.div
                      animate={{ x: [0, 60, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-2 h-2 rounded-full bg-primary absolute -top-[3px]"
                    />
                  </div>
                </div>

                {/* Teacher Node */}
                <div className="w-full sm:w-44 p-4 rounded-xl bg-surface-warm dark:bg-surface-subtle border border-border text-center">
                  <div className="w-8 h-8 rounded-full bg-secondary/30 text-accent mx-auto mb-2 flex items-center justify-center font-bold text-xs">
                    M
                  </div>
                  <div className="font-semibold text-xs text-foreground">
                    {isEn ? 'Ustadh Mahmoud' : 'الأستاذ محمود'}
                  </div>
                  <div className="text-[10px] text-primary flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Al-Azhar Verified</span>
                  </div>
                </div>

              </div>

              {/* Module Description */}
              <div className="p-4 rounded-xl bg-background dark:bg-surface-subtle border border-border/80 dark:border-border mt-4">
                <div className="text-xs font-semibold text-foreground mb-1">
                  {currentLevel.name}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentLevel.desc}
                </p>
              </div>
            </div>

            {/* Bottom confirmation */}
            <div className="mt-6 pt-4 border-t border-border/80 dark:border-border flex items-center justify-between text-xs">
              <span className="text-primary font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>
                  {isEn ? `Module ready for your free trial` : `الوحدة جاهزة لجلسة التقييم الأولى`}
                </span>
              </span>
              <button
                onClick={() => onOpenTrialModal(currentPillarData.id)}
                className="font-semibold text-foreground hover:text-primary flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{isEn ? 'Start free trial' : 'ابدأ التجربة المجانية'}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
