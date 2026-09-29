import React, { useState, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, StudyLine, MarginNote, PublicButton } from '../PublicDesignSystem';
import { SERVICES_DATA } from '../../../data/content';
import { ServiceItem } from '../../../types';
import { 
  BookOpen, 
  Globe2, 
  Languages, 
  Library, 
  Sparkles, 
  Clock, 
  Calendar, 
  Check, 
  ChevronDown, 
  Search, 
  X, 
  Users, 
  GraduationCap, 
  ShieldCheck, 
  ArrowRight,
  Flame,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';

// Comprehensive authentic Arabic details map for all 13 services
const ARABIC_SERVICE_DETAILS: Record<string, {
  description: string;
  whoIsItFor: string;
  whatYouWillLearn: string[];
  recommendedFrequency: string;
}> = {
  'quran-reading': {
    description: 'للأطفال والكبار الراغبين في القراءة الذاتية من المصحف الشريف. نبدأ بمخارج الحروف، الحركات القصيرة والطويلة، والسكون، والتدرج بهدوء وصبر حتى تتدفق الآيات بطلاقة وسلاسة.',
    whoIsItFor: 'المبتدئون من أي عمر، الكبار العائدون لتصحيح تلاوتهم، أو الأطفال في خطواتهم الأولى مع القاعدة النورانية.',
    whatYouWillLearn: [
      'ضبط مخارج الحروف العربية وأماكن النطق الصحيحة بدقة',
      'وصل الحروف وقراءة الحركات والسكون والمدود الأساسية',
      'التلاوة المباشرة من المصحف برتم سليم وبدون تعثر',
      'بناء الثقة النفسية والاستمرارية في القراءة بدون إحباط'
    ],
    recommendedFrequency: '٢ إلى ٣ جلسات أسبوعياً'
  },
  'tajweed': {
    description: 'التجويد ليس مجرد قواعد نظرية، بل تدريب عملي ومطابقة دقيقة لنطق الحروف. ندرس أحكام النون الساكنة والميم والمدود ومخارج وصفات الحروف مع التطبيق الفوري أثناء التلاوة.',
    whoIsItFor: 'الطلاب الذين يستطيعون قراءة القرآن لكنهم يسعون لإتقان التلاوة وضبط الأحكام والمخارج التراثية الصحيحة.',
    whatYouWillLearn: [
      'إتقان مخارج وصفات الحروف وتمييز الفروق الدقيقة صوتياً',
      'تطبيق أحكام النون الساكنة والتنوين والميم الساكنة عملياً',
      'أحكام المدود المتنوعة ومهارات الوقف والابتداء التام والكافي',
      'تدريب الأذن الذاتية لاكتشاف الأخطاء وتصحيحها فوراً'
    ],
    recommendedFrequency: 'جلستان أسبوعياً'
  },
  'quran-memorization': {
    description: 'حفظ القرآن يعتمد على الاستمرارية لا العجلة. نصمم معك مستهدفاً أسبوعياً يناسب وتيرة حياتك مع التسميع المباشر لضبط الحفظ وتصحيح الأخطاء قبل رسوخها في الذاكرة.',
    whoIsItFor: 'الراغبون الجادون والناشئة الساعون لحفظ سور جديدة أو إتمام أجزاء من كتاب الله تعالى.',
    whatYouWillLearn: [
      'التلاوة التحضيرية المجودة للآيات قبل البدء بالحفظ لتفادي تثبيت الأخطاء',
      'جدول مراجعة يومي متوازن يحمي السور المحفوظة من النسيان',
      'فهم المعاني المفتاحية للآيات لترسيخ الحفظ عقلياً وروحياً',
      'استراتيجيات ذكية للتغلب على الآيات المتشابهة في المصحف'
    ],
    recommendedFrequency: '٢ إلى ٤ جلسات أسبوعياً'
  },
  'quran-revision': {
    description: 'للطلاب الذين أتموا حفظ أجزاء أو القرآن كاملاً ويحتاجون رفيقاً معلماً للتسميع المنتظم وضبط المتشابهات وإتقان الأداء.',
    whoIsItFor: 'الحفاظ وأصحاب الحفظ الجزئي والراغبون في استعادة الطلاقة والاستعداد للاختبارات والإمامة.',
    whatYouWillLearn: [
      'دورات تسميع مقسمة بدقة حسب جدولك ووقت فراغك',
      'تدريبات مكثفة على السور الصعبة أو المعرضة للنسيان',
      'تصحيح فوري للملاحظات الصوتية الدقيقة وأحكام الأداء',
      'اكتساب الثقة والجاهزية للإمامة والصلاة بالقرآن'
    ],
    recommendedFrequency: '٢ إلى ٣ جلسات أسبوعياً'
  },
  'aqeedah': {
    description: 'دراسة أركان الإيمان الستة: الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر خيره وشره. نقوم بالتأصيل من المصادر الأصيلة مع مساحة مفتوحة لنقاش الأسئلة المعاصرة.',
    whoIsItFor: 'الكبار الباحثون عن يقين فكري وروحي متين، والناشئة المغتربون في البيئات الغربية لتعزيز هويتهم.',
    whatYouWillLearn: [
      'معاني التوحيد وثمراته العملية في الحياة اليومية',
      'شرح أركان الإيمان بلغة واضحة وبعيدة عن التعقيد الاصطلاحي',
      'إجابات راسخة على تساؤلات الوجود والغاية والقضاء والقدر',
      'بناء هوية إسلامية واعية مستندة إلى الدليل والبرهان'
    ],
    recommendedFrequency: 'جلسة إلى جلستين أسبوعياً'
  },
  'fiqh': {
    description: 'فقه عملي يركز على ما يحتاجه المسلم في عباداته اليومية: الطهارة والوضوء، أحكام الصلاة وشروطها وسننها، وسجود السهو، وأحكام الصيام والسفر.',
    whoIsItFor: 'المسلمون الجدد، اليافعون لتأسيس عادات عبادية صحيحة، والكبار الراغبون في التحقق من صحة صلواتهم.',
    whatYouWillLearn: [
      'أحكام الطهارة والغسل وإسباغ الوضوء بطريقة تطبيقية',
      'أركان الصلاة وسننها ومبطلاتها وسجود السهو',
      'أحكام الصيام ورخص السفر والأعذار الشرعية',
      'التعامل مع المسائل الحياتية العصرية بفهم فقهي متزن'
    ],
    recommendedFrequency: 'جلسة إلى جلستين أسبوعياً'
  },
  'seerah': {
    description: 'أكثر من مجرد تواريخ وأحداث، إنها رحلة في شخصية النبي ﷺ ورحمته وأخلاقه وقيادته، وكيف تعامل مع الصعاب والمواقف الأسرية والاجتماعية.',
    whoIsItFor: 'كل من يرغب في بناء محبة شخصية عميقة لسيدنا محمد ﷺ والاقتداء به في الحياة المعاصرة.',
    whatYouWillLearn: [
      'مسار زمني مشوق من مكة المكرمة إلى حجة الوداع بالمدينة',
      'مواقف النبي ﷺ في أوقات الشدائد والانتصار والتعامل مع المخالفين',
      'دروس عملية في فن القيادة وحسن المعاشرة والصبر الجميل',
      'ربط وقائع السيرة بمواقفنا وتحدياتنا المعاصرة اليوم'
    ],
    recommendedFrequency: 'جلسة واحدة أسبوعياً'
  },
  'islamic-studies': {
    description: 'منهاج تكاملي يجمع بين العقيدة الميسرة، الآداب الإسلامية اليومية، الأدعية والأذكار النبوية، وقصص الأنبياء المؤثرة.',
    whoIsItFor: 'الأطفال من سن ٧ سنوات فما فوق، والشباب والكبار الذين يبدأون مسيرتهم من الخطوة الأولى.',
    whatYouWillLearn: [
      'الأذكار والأدعية اليومية الأساسية مع فهم معانيها العميقة',
      'الآداب النبوية في التعامل مع الوالدين والمعلمين والمجتمع',
      'القصص الهادفة للأنبياء والصحابة واستخلاص القيم منها',
      'بناء شخصية مسلمة متوازنة تجمع بين العلم وحسن الخلق'
    ],
    recommendedFrequency: 'جلستان أسبوعياً'
  },
  'modern-standard-arabic': {
    description: 'تعلم القراءة والكتابة وفهم قواعد النحو والصرف من خلال نصوص تفاعلية وحوارات تطبيقية ومواد قراءة حقيقية من التراث والمعاصر.',
    whoIsItFor: 'طلاب الجامعات، ودارسو القرآن الراغبون في فهم الإعراب والمعاني اللغوية، والمهتمون باللغة الفصحى.',
    whatYouWillLearn: [
      'شرح مبسط لقواعد النحو (المبتدأ، الخبر، الفاعل، المفاعيل) دون تعقيد',
      'بناء الجملة العربية وتصريف الأفعال وضبط الأوزان الصرفية',
      'استيعاب المقروء للنصوص الكلاسيكية والمقالات الحديثة',
      'الكتابة والتعبير بلغة سليمة خالية من الأخطاء الإملائية'
    ],
    recommendedFrequency: 'جلستان أسبوعياً'
  },
  'arabic-conversation': {
    description: 'مساحة مخصصة للمحادثة حيث تتحدث من الدقيقة الأولى. نحاكي مواقف الحياة الواقعية كالتعارف، السفر، العمل، والأسرة، مع توجيه هادئ لمخارج النطق والإيقاع.',
    whoIsItFor: 'الطلاب أصحاب المستوى المتوسط الذين يفهمون القواعد على الورق لكنهم يترددون عند التحدث بصوت عالٍ.',
    whatYouWillLearn: [
      'استحضار سريع للمفردات الأكثر شيوعاً والتعابير اليومية',
      'اكتساب طلاقة التعبير في جمل متكاملة دون ترجمة حرفية مسبقة',
      'كسر حاجز الخوف والارتباك وبناء الثقة في المواقف الاجتماعية',
      'تطوير مهارة الاستماع والفهم بالسرعة الطبيعية للمتحدثين'
    ],
    recommendedFrequency: '٢ إلى ٣ جلسات أسبوعياً'
  },
  'egyptian-arabic': {
    description: 'تعلم اللهجة المصرية الودودة والمعبرة، وهي اللهجة الأكثر شهرة وانتشاراً في العالم العربي بفضل الفنون والسينما والتواصل اليومي.',
    whoIsItFor: 'المسافرون لمصر، أزواج وأقارب المصريين، أبناء الجاليات في الخارج، أو الراغبون في لهجة عملية حية.',
    whatYouWillLearn: [
      'المفردات المصرية الأصيلة والتعابير الشعبية وطرق المزاح والترحيب',
      'أنماط الحوار في الشارع، المطاعم، المواصلات، والشراء والبيع',
      'الفروق الجوهرية وطرق التحويل بين الفصحى واللهجة المصرية',
      'أسرار النطق والتنغيم الصوتي لتتحدث وكأنك من أهل البلد'
    ],
    recommendedFrequency: 'جلسة إلى جلستين أسبوعياً'
  },
  'arabic-foundations': {
    description: 'مصمم خصيصاً للناطقين بغير العربية. نبتعد عن الصعوبة الأكاديمية ونركز على تمييز الحروف، النطق السليم، وأهم الكلمات القرآنية والحياتية.',
    whoIsItFor: 'الدارسون الذين يبدأون من الصفر تماماً بدون أي معرفة مسبقة بالحروف العربية.',
    whatYouWillLearn: [
      'إتقان الحروف الـ٢٨ بأشكالها المختلفة (أول، وسط، وآخر الكلمة)',
      'تدريب صوتي على الحروف الخاصة بالعربية (ح، خ، ص، ض، ط، ظ، ع، غ، ق)',
      'أهم ٢٠٠ كلمة شائعة في القرآن الكريم والممارسات اليومية للمسلمين',
      'قراءة الكلمات والتراكيب البسيطة بثقة تامة'
    ],
    recommendedFrequency: '٢ إلى ٣ جلسات أسبوعياً'
  },
  'english': {
    description: 'تدريب احترافي بقيادة معتمدة بشهادة IELTS C1. نفهم تماماً الصعوبات الصوتية والنحوية التي تواجه الناطقين بالعربية عند تعلم الإنجليزية، ونعالجها بتصحيح دقيق وصبور.',
    whoIsItFor: 'الناطقون بالعربية الراغبون في الطلاقة والمحادثة، المهاجرون، أو الطلاب المستعدون للدراسة بالخارج واجتياز الاختبارات.',
    whatYouWillLearn: [
      'تدريب مركز على النطق الصحيح وتصفية مخارج الحروف الإنجليزية',
      'اكتساب طلاقة التحدث في بيئات العمل والمواقف الاجتماعية الحية',
      'تصحيح الأخطاء النحوية الناجمة عن الترجمة الحرفية من العربية',
      'مهارات القراءة السريعة وكتابة الرسائل والبريد الإلكتروني المهني'
    ],
    recommendedFrequency: 'جلستان أسبوعياً'
  }
};

export function LearningPage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  // Navigation and filter state
  const [selectedPillarId, setSelectedPillarId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});

  const toggleExpand = (serviceId: string) => {
    setExpandedServices((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    SERVICES_DATA.forEach((pillar) => {
      pillar.services.forEach((s) => {
        allExpanded[s.id] = true;
      });
    });
    setExpandedServices(allExpanded);
  };

  const collapseAll = () => {
    setExpandedServices({});
  };

  // Distinct styling configurations for each pillar
  const pillarConfigs: Record<string, {
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badgeBg: string;
    borderHover: string;
    borderActive: string;
    glow: string;
  }> = {
    quran: {
      icon: BookOpen,
      accentColor: 'text-primary',
      badgeBg: 'bg-primary/10 text-primary border-primary/25',
      borderHover: 'hover:border-primary/50',
      borderActive: 'border-primary/40',
      glow: 'shadow-primary/5'
    },
    islamic_studies: {
      icon: Library,
      accentColor: 'text-teal-600 dark:text-teal-400',
      badgeBg: 'bg-teal-500/10 text-teal-800 dark:text-teal-200 border-teal-500/30',
      borderHover: 'hover:border-teal-500/50',
      borderActive: 'border-teal-500/40',
      glow: 'shadow-teal-500/5'
    },
    arabic: {
      icon: Languages,
      accentColor: 'text-accent',
      badgeBg: 'bg-terracotta/10 text-terracotta dark:text-terracotta-light border-terracotta/30',
      borderHover: 'hover:border-terracotta/50',
      borderActive: 'border-terracotta/40',
      glow: 'shadow-terracotta/5'
    },
    english: {
      icon: Globe2,
      accentColor: 'text-teal-600 dark:text-teal-400',
      badgeBg: 'bg-teal-500/10 text-teal-800 dark:text-teal-200 border-teal-500/30',
      borderHover: 'hover:border-teal-500/50',
      borderActive: 'border-teal-500/40',
      glow: 'shadow-teal-500/5'
    }
  };

  // Filtered pillars based on active tab and search query
  const filteredPillars = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return SERVICES_DATA
      .filter((pillar) => selectedPillarId === 'all' || pillar.id === selectedPillarId)
      .map((pillar) => {
        if (!query) return pillar;

        const matchingServices = pillar.services.filter((service) => {
          const arData = ARABIC_SERVICE_DETAILS[service.id];
          const searchHaystack = [
            service.name,
            service.arabicName,
            service.tagline,
            service.arabicTagline,
            service.description,
            service.whoIsItFor,
            ...(service.whatYouWillLearn || []),
            arData?.description,
            arData?.whoIsItFor,
            ...(arData?.whatYouWillLearn || [])
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return searchHaystack.includes(query);
        });

        return {
          ...pillar,
          services: matchingServices
        };
      })
      .filter((pillar) => pillar.services.length > 0);
  }, [selectedPillarId, searchQuery]);

  const totalResultsCount = filteredPillars.reduce((acc, p) => acc + p.services.length, 0);

  return (
    <main id="main-content" className="pt-24 lg:pt-32 pb-24 min-h-screen">
      
      {/* ─── 1. HERO & INTRODUCTION ───────────────────────────────────────── */}
      <PublicSection className="pb-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 dark:bg-teal-500/20 text-teal-800 dark:text-teal-200 border border-teal-500/30 text-xs sm:text-sm font-semibold shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>{isEn ? 'Personalized 1-on-1 Syllabi • Authentic Heritage' : 'مناهج فردية متكاملة • تأصيل علمي راسخ'}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-foreground font-bold leading-tight"
          >
            {isEn ? (
              <>What you can <span className="text-brand-gradient">learn</span>.</>
            ) : (
              <>ماذا يمكنك أن <span className="text-brand-gradient">تتعلم</span>.</>
            )}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-light"
          >
            {isEn 
              ? 'Structured, personalized 1-on-1 education tailored to your goals. We focus on depth, correct understanding, and building a foundation that lasts across Quran, Arabic, and Islamic Studies.'
              : 'تعليم فردي منظم ومخصص لأهدافك. نركز على الفهم الصحيح، التأسيس العميق، وبناء علاقة مستدامة مع العلم في القرآن الكريم واللغة العربية والعلوم الإسلامية.'}
          </motion.p>

          {/* Key Value Guarantees Banner */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-start max-w-3xl mx-auto"
          >
            <div className="glass-card p-3.5 rounded-2xl border border-border/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  {isEn ? '1-on-1 Private' : 'تعليم فردي مباشر'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isEn ? 'Full focus on your pace' : 'خصوصية وتركيز تام'}
                </p>
              </div>
            </div>

            <div className="glass-card p-3.5 rounded-2xl border border-border/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  {isEn ? 'Flexible Times' : 'مرونة تامة في المواعيد'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isEn ? 'All global timezones' : 'تناسب جميع المناطق الزمنية'}
                </p>
              </div>
            </div>

            <div className="glass-card p-3.5 rounded-2xl border border-border/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-terracotta/10 text-accent flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  {isEn ? 'Free 30-Min Trial' : 'جلسة أولى مجانية'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isEn ? 'Diagnostic assessment' : 'تقييم وبناء خطة دون إلزام'}
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </PublicSection>

      {/* ─── 2. CONTROLS: CATEGORY TABS & LIVE SEARCH ────────────────────── */}
      <PublicSection className="pt-2 pb-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Interactive Discipline Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setSelectedPillarId('all')}
              className={`relative px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                selectedPillarId === 'all'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'glass-card text-muted-foreground hover:text-foreground border border-border/70 hover:bg-surface-subtle'
              }`}
            >
              <span>{isEn ? 'All Tracks (13)' : 'جميع المسارات (١٣)'}</span>
            </button>

            {SERVICES_DATA.map((pillar) => {
              const config = pillarConfigs[pillar.id] || pillarConfigs.quran;
              const Icon = config.icon;
              const isSelected = selectedPillarId === pillar.id;

              return (
                <button
                  key={pillar.id}
                  onClick={() => setSelectedPillarId(pillar.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'glass-card text-muted-foreground hover:text-foreground border border-border/70 hover:bg-surface-subtle'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{isEn ? pillar.title : pillar.arabicTitle}</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                    isSelected ? 'bg-black/20 text-white' : 'bg-surface-subtle text-muted-foreground'
                  }`}>
                    {pillar.services.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar & Quick Toggles */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            
            {/* Live Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted-foreground absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? 'Search subjects (e.g., Tajweed, Grammar, Fiqh)...' : 'ابحث في المواد (مثل: تجويد، نحو، محادثة، حفظ، عقيدة)...'}
                className="w-full ps-10 pe-10 py-2.5 rounded-xl glass-card border border-border text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label={isEn ? 'Clear search' : 'مسح البحث'}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Expand / Collapse Controls */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={expandAll}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg glass-card border border-border/70 hover:bg-surface-subtle transition-all cursor-pointer"
              >
                {isEn ? 'Expand All Details' : 'عرض تفاصيل الكل'}
              </button>
              <button
                onClick={collapseAll}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg glass-card border border-border/70 hover:bg-surface-subtle transition-all cursor-pointer"
              >
                {isEn ? 'Collapse All' : 'طي الكل'}
              </button>
            </div>

          </div>

          {/* Active Search Filter Badge */}
          {searchQuery && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{isEn ? `Showing ${totalResultsCount} matching subject(s) for "${searchQuery}"` : `عرض ${totalResultsCount} مادة مطابقة لبحثك: "${searchQuery}"`}</span>
              <button 
                onClick={() => setSearchQuery('')} 
                className="text-primary hover:underline font-bold"
              >
                {isEn ? 'Clear filter' : 'إلغاء التصفية'}
              </button>
            </div>
          )}

        </div>
      </PublicSection>

      {/* ─── 3. SYLLABUS TRACKS & RICH SERVICE CARDS ─────────────────────── */}
      <PublicSection className="pt-0">
        <div className="max-w-5xl mx-auto space-y-16">
          
          {filteredPillars.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl border border-border text-center space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-muted/40 text-muted-foreground flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {isEn ? 'No matching subjects found' : 'لم نجد مواد مطابقة لبحثك'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isEn 
                  ? 'Try searching with different keywords, or book a free trial to discuss your unique goals directly with Mahmoud.'
                  : 'جرب البحث بكلمة أخرى، أو احجز جلستك التجريبية لمناقشة أهدافك الخاصة مع الأستاذ محمود مباشرة.'}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedPillarId('all'); }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-95 cursor-pointer"
              >
                {isEn ? 'Reset Filters' : 'إعادة ضبط البحث'}
              </button>
            </div>
          ) : (
            filteredPillars.map((pillar) => {
              const config = pillarConfigs[pillar.id] || pillarConfigs.quran;
              const PillarIcon = config.icon;

              return (
                <section key={pillar.id} className="space-y-6">
                  
                  {/* Clean, Non-Clipping Pillar Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${config.badgeBg}`}>
                        <PillarIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-editorial text-2xl sm:text-3xl text-foreground font-bold">
                          {isEn ? pillar.title : pillar.arabicTitle}
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                          {isEn ? pillar.description : (pillar.arabicDescription || pillar.description)}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-surface-subtle text-muted-foreground border border-border/80 self-start sm:self-center">
                      {isEn ? `${pillar.services.length} Subjects` : `${pillar.services.length} مواد تدريسية`}
                    </span>
                  </div>

                  {/* High-Fidelity Service Cards Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {pillar.services.map((service: ServiceItem, sIndex: number) => {
                      const arDetails = ARABIC_SERVICE_DETAILS[service.id];
                      const isExpanded = Boolean(expandedServices[service.id]);

                      const displayDescription = isEn 
                        ? service.description 
                        : (arDetails?.description || service.arabicTagline || service.tagline);

                      const displayWhoIsItFor = isEn 
                        ? service.whoIsItFor 
                        : (arDetails?.whoIsItFor || service.whoIsItFor);

                      const displayWhatYouWillLearn = isEn 
                        ? (service.whatYouWillLearn || []) 
                        : (arDetails?.whatYouWillLearn || service.whatYouWillLearn || []);

                      const displayFrequency = isEn 
                        ? service.recommendedFrequency 
                        : (arDetails?.recommendedFrequency || service.recommendedFrequency);

                      return (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, y: 22 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '-20px' }}
                          transition={{
                            duration: 0.45,
                            delay: Math.min(sIndex * 0.08, 0.4),
                            ease: [0.22, 1, 0.36, 1]
                          }}
                          whileHover={{ y: -4, transition: { duration: 0.25 } }}
                          className={`glass-card rounded-2xl border border-border/90 ${config.borderHover} transition-colors duration-300 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-lg`}
                        >
                          {/* Card Content Top */}
                          <div className="p-6 space-y-4">
                            
                            {/* Card Badges Row */}
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${config.badgeBg}`}>
                                {isEn ? pillar.title : pillar.arabicTitle}
                              </span>

                              {/* Duration Tag */}
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                <Clock className="w-3.5 h-3.5 text-accent" />
                                <span>
                                  {isEn 
                                    ? `${service.durations.join(' / ')} mins`
                                    : `${service.durations.join(' / ')} دقيقة`}
                                </span>
                              </div>
                            </div>

                            {/* Service Name & Tagline */}
                            <div>
                              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                                {isEn ? service.name : (service.arabicName || service.name)}
                              </h3>
                              <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">
                                {isEn ? service.tagline : (service.arabicTagline || service.tagline)}
                              </p>
                            </div>

                            {/* Recommended Frequency Badge */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-surface-subtle/80 p-2.5 rounded-xl border border-border/60">
                              <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                              <span className="font-medium">
                                {isEn ? `Recommended: ${service.recommendedFrequency}` : `المعدل المقترح: ${displayFrequency}`}
                              </span>
                            </div>

                            {/* Expandable Syllabus & Outcomes with Framer Motion */}
                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  key="content"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                                  className="space-y-4 pt-3 border-t border-border/80 overflow-hidden"
                                >
                                  {/* Detailed Description */}
                                  <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-1.5 flex items-center gap-1.5">
                                      <GraduationCap className="w-3.5 h-3.5 text-primary" />
                                      <span>{isEn ? 'Curriculum Overview:' : 'عن المنهج وأسلوب الشرح:'}</span>
                                    </h4>
                                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                      {displayDescription}
                                    </p>
                                  </div>

                                  {/* Target Learner */}
                                  <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-1.5 flex items-center gap-1.5">
                                      <Users className="w-3.5 h-3.5 text-accent" />
                                      <span>{isEn ? 'Who this is designed for:' : 'لمن هذا المسار؟'}</span>
                                    </h4>
                                    <p className="text-xs sm:text-sm text-foreground/80 bg-surface-subtle p-2.5 rounded-xl border border-border/50">
                                      {displayWhoIsItFor}
                                    </p>
                                  </div>

                                  {/* What You Will Learn (Checklist) */}
                                  <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                      <span>{isEn ? 'What you will master:' : 'محاور التعلم والمخرجات التطبيقية:'}</span>
                                    </h4>
                                    <div className="space-y-2">
                                      {displayWhatYouWillLearn.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-foreground/90">
                                          <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                                          <span>{item}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                          </div>

                          {/* Card Footer Actions */}
                          <div className="px-6 py-4 bg-surface-subtle/50 border-t border-border/80 flex items-center justify-between gap-3">
                            
                            {/* Toggle Details Accordion */}
                            <button
                              type="button"
                              onClick={() => toggleExpand(service.id)}
                              className="text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>{isExpanded ? (isEn ? 'Hide Details' : 'إخفاء التفاصيل') : (isEn ? 'View Syllabus' : 'استكشف الخطة والمحتوى')}</span>
                              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : ''}`} />
                            </button>

                            {/* Book Free Trial Button */}
                            <button
                              type="button"
                              onClick={() => onOpenTrialModal(service.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-xs hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
                            >
                              <span>{isEn ? 'Book Free Trial' : 'احجز جلستك مجاناً'}</span>
                              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                            </button>

                          </div>

                        </motion.div>
                      );
                    })}
                  </div>

                </section>
              );
            })
          )}

        </div>
      </PublicSection>

      {/* ─── 4. BOTTOM LUXURY CALL-TO-ACTION CARD ──────────────────────────── */}
      <PublicSection className="pt-8 pb-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden glass-card p-8 sm:p-12 rounded-3xl border border-border shadow-xl text-center space-y-6">
            
            {/* Ambient decorative glow */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-teal-500/10 dark:bg-teal-500/20 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/25 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="font-editorial text-2xl sm:text-3xl text-foreground font-bold">
                {isEn ? 'Not sure which track is best for you?' : 'متردد في اختيار المسار الأنسب لك أو لأبنائك؟'}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                {isEn 
                  ? 'Book a free 30-minute diagnostic session. We will evaluate your current level, understand your personal learning aspirations, and design a customized study blueprint.'
                  : 'احجز جلسة استكشافية مجانية مدتها ٣٠ دقيقة. سنقوم بتقييم مستواك الحالي، والتعرف على أهدافك الشخصية، وبناء خطة تدريسية مخصصة تناسب وقتك تماماً.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={() => onOpenTrialModal()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl btn-primary-material text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-95"
              >
                <span>{isEn ? 'Book Free 30-Min Trial' : 'احجز جلستك الاستكشافية مجاناً'}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>

            {/* Quick Cross-Links */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 text-xs sm:text-sm text-muted-foreground">
              <Link 
                to="/how-it-works" 
                className="inline-flex items-center gap-1.5 text-teal-700 dark:text-teal-300 font-bold hover:underline"
              >
                <span>{isEn ? 'See How Lessons Work (4 Stages)' : 'تعرف على خطوات التعلم (كيف نعمل)'}</span>
                <span className="rtl:rotate-180">←</span>
              </Link>
              <span>•</span>
              <Link 
                to="/pricing" 
                className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline"
              >
                <span>{isEn ? 'View Pricing & Packages' : 'شاهد باقات وأسعار الدروس'}</span>
                <span className="rtl:rotate-180">←</span>
              </Link>
            </div>

          </div>
        </div>
      </PublicSection>

    </main>
  );
}
