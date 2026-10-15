import React, { useState, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, StudyLine, MarginNote, PublicButton, PageHero } from '../PublicDesignSystem';
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
    description: 'معلمانا يدرّسان الإنجليزية بمستوى C1. نعرف تماماً الأصوات والقواعد التي تُتعب الناطقين بالعربية، ونصححها بدقة وصبر.',
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

  // One brand colour per family of subjects (window gradient, chip, ring).
  const pillarConfigs: Record<string, {
    icon: React.ComponentType<{ className?: string }>;
    window: string;
    chip: string;
    ring: string;
    text: string;
  }> = {
    quran: {
      icon: BookOpen,
      window: 'from-[#C51F24] via-[#A3271F] to-[#8B4935]',
      chip: 'bg-[#C51F24]/10 text-[#C51F24] dark:text-[#E82C32] border-[#C51F24]/25',
      ring: 'hover:border-[#C51F24]/50 focus-within:border-[#C51F24]/50',
      text: 'text-[#C51F24] dark:text-[#E82C32]'
    },
    islamic_studies: {
      icon: Library,
      window: 'from-[#087D91] via-[#0A6B7C] to-[#05434E]',
      chip: 'bg-[#087D91]/10 text-[#087D91] dark:text-[#12A4BC] border-[#087D91]/25',
      ring: 'hover:border-[#087D91]/50 focus-within:border-[#087D91]/50',
      text: 'text-[#087D91] dark:text-[#12A4BC]'
    },
    arabic: {
      icon: Languages,
      window: 'from-[#8B4935] via-[#9C5A33] to-[#B4552F]',
      chip: 'bg-[#8B4935]/10 text-[#8B4935] dark:text-[#DA7960] border-[#8B4935]/25',
      ring: 'hover:border-[#8B4935]/50 focus-within:border-[#8B4935]/50',
      text: 'text-[#8B4935] dark:text-[#DA7960]'
    },
    english: {
      icon: Globe2,
      window: 'from-[#E5A93C] via-[#C98A2A] to-[#8B4935]',
      chip: 'bg-[#E5A93C]/15 text-[#8A5A12] dark:text-[#E5A93C] border-[#E5A93C]/35',
      ring: 'hover:border-[#E5A93C]/60 focus-within:border-[#E5A93C]/60',
      text: 'text-[#8A5A12] dark:text-[#E5A93C]'
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
          
          <PageHero
            title={isEn ? <>What you can <span className="text-ribbon">learn with us.</span></> : <>ماذا تتعلم <span className="text-ribbon">معنا؟</span></>}
            intro={isEn
              ? 'One-on-one lessons shaped around your goal: Quran and Tajweed, Arabic, Islamic studies and English, from the very first letter to advanced study.'
              : 'دروس فردية على مقاس هدفك: القرآن والتجويد، والعربية، والعلوم الشرعية، والإنجليزية، من أول حرف لحد المستوى المتقدم.'}
          />

        </div>
      </PublicSection>

      {/* ─── 2. CONTROLS: CATEGORY TABS & LIVE SEARCH ────────────────────── */}
      <PublicSection className="pt-2 pb-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Families of subjects */}
          <div className="flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label={isEn ? 'Subject families' : 'مجموعات المواد'}>
            <button
              role="tab"
              aria-selected={selectedPillarId === 'all'}
              onClick={() => setSelectedPillarId('all')}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
                selectedPillarId === 'all' ? 'bg-foreground text-background border-foreground' : 'bg-surface text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {isEn ? 'All subjects' : 'كل المواد'}
            </button>
            {SERVICES_DATA.map((pillar) => {
              const config = pillarConfigs[pillar.id] || pillarConfigs.quran;
              const Icon = config.icon;
              const isSelected = selectedPillarId === pillar.id;
              return (
                <button
                  key={pillar.id}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedPillarId(pillar.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
                    isSelected ? `bg-gradient-to-br ${config.window} text-white border-transparent` : `bg-surface border-border text-muted-foreground hover:text-foreground`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{isEn ? pillar.title : pillar.arabicTitle}</span>
                </button>
              );
            })}
          </div>

          <div className="relative max-w-md mx-auto">
            <Search className="w-4 h-4 text-muted-foreground absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? 'Search: Tajweed, grammar, Fiqh…' : 'ابحث: تجويد، نحو، فقه…'}
              aria-label={isEn ? 'Search subjects' : 'ابحث في المواد'}
              className="w-full ps-11 pe-10 py-3 rounded-full bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-[#087D91]/50"
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
                  ? 'Try searching with different keywords, or book a free trial to discuss your unique goals directly with your teacher.'
                  : 'جرب البحث بكلمة أخرى، أو احجز جلستك التجريبية لمناقشة أهدافك الخاصة مع معلمك مباشرة.'}
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
                  
                  <header className="flex items-center gap-3">
                    <span className={`arch-tile w-10 h-11 flex items-center justify-center bg-gradient-to-b ${config.window} text-white shrink-0`}>
                      <PillarIcon className="w-5 h-5" />
                    </span>
                    <div>
                      <h2 className="font-editorial text-2xl sm:text-3xl text-foreground font-bold">
                        {isEn ? pillar.title : pillar.arabicTitle}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isEn ? pillar.description : (pillar.arabicDescription || pillar.description)}
                      </p>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {pillar.services.map((service: ServiceItem) => {
                      const arDetails = ARABIC_SERVICE_DETAILS[service.id];
                      const isExpanded = Boolean(expandedServices[service.id]);
                      const whoFor = isEn ? service.whoIsItFor : (arDetails?.whoIsItFor || service.whoIsItFor);
                      const learn = isEn ? (service.whatYouWillLearn || []) : (arDetails?.whatYouWillLearn || service.whatYouWillLearn || []);
                      const frequency = isEn ? service.recommendedFrequency : (arDetails?.recommendedFrequency || service.recommendedFrequency);
                      const detailsId = `details-${service.id}`;

                      return (
                        <article
                          key={service.id}
                          className={`group flex flex-col rounded-[1.75rem] border border-border bg-surface overflow-hidden transition-[border-color,box-shadow] duration-300 hover:shadow-[0_24px_48px_-28px_rgba(18,16,14,0.45)] ${config.ring}`}
                        >
                          {/* Arch window in the family colour */}
                          <div className="px-5 pt-5">
                            <div className={`door-arch khatam-window relative mx-auto w-32 h-36 bg-gradient-to-b ${config.window} flex items-end justify-center pb-4 overflow-hidden`}>
                              <PillarIcon className="relative w-8 h-8 text-white/95 transition-transform duration-500 group-hover:-translate-y-1" />
                            </div>
                          </div>

                          <div className="flex-1 px-6 pt-5 pb-4 space-y-2 text-center">
                            <h3 className="font-editorial text-xl font-bold text-foreground leading-snug">
                              {isEn ? service.name : (service.arabicName || service.name)}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {isEn ? service.tagline : (service.arabicTagline || service.tagline)}
                            </p>
                            <ul className="flex flex-wrap justify-center gap-1.5 pt-2" aria-label={isEn ? 'Lesson lengths' : 'مدد الحصة'}>
                              {service.durations.map((d) => (
                                <li key={d} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${config.chip}`}>
                                  {isEn ? `${d} min` : `${d} دقيقة`}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                id={detailsId}
                                key="details"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="mx-6 mb-4 pt-4 border-t border-border space-y-3 text-sm text-start">
                                  <p className="text-foreground/85 leading-relaxed">{whoFor}</p>
                                  <ul className="space-y-1.5">
                                    {learn.map((item, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${config.text}`} />
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  <p className={`text-xs font-semibold ${config.text}`}>
                                    {isEn ? `Suggested: ${frequency}` : `المقترح: ${frequency}`}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="px-5 pb-5 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleExpand(service.id)}
                              aria-expanded={isExpanded}
                              aria-controls={detailsId}
                              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground border border-border hover:bg-surface-subtle transition-colors cursor-pointer"
                            >
                              <span>{isExpanded ? (isEn ? 'Less' : 'أقل') : (isEn ? 'Details' : 'التفاصيل')}</span>
                              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenTrialModal(service.id)}
                              className="flex-1 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover active:scale-[0.98] transition-all cursor-pointer"
                            >
                              {isEn ? 'Free trial' : 'حصة مجانية'}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                </section>
              );
            })
          )}

        </div>
      </PublicSection>

      {/* ─── 4. CLOSING ─── */}
      <section className="public-container pt-16 pb-0">
        <div className="band-deep relative overflow-hidden rounded-[2rem] px-6 py-12 sm:px-12 lg:py-16 text-center">
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold leading-tight">
            {isEn ? 'Not sure where to start?' : 'محتار تبدأ منين؟'}
          </h2>
          <p className="mt-3 text-base sm:text-lg leading-relaxed max-w-xl mx-auto text-[#FAF7F2]/80">
            {isEn
              ? 'That is what the free trial is for. Your teacher listens first, then suggests the path.'
              : 'الحصة التجريبية لده بالظبط. معلمك يسمعك الأول، وبعدين يقترح الطريق.'}
          </p>
          <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
            <PublicButton variant="primary" size="lg" onClick={() => onOpenTrialModal()} className="w-full sm:w-auto">
              {isEn ? 'Book your free trial lesson' : 'احجز حصتك التجريبية المجانية'}
            </PublicButton>
            <Link to="/pricing" className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold border border-[#FAF7F2]/30 text-[#FAF7F2] hover:bg-[#FAF7F2]/10 transition-colors">
              {isEn ? 'See prices' : 'شوف الأسعار'}
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
