import React, { useState, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, PublicButton, PageHero } from '../PublicDesignSystem';
import { SERVICES_DATA as ALL_PILLARS } from '../../../data/content';
import { BOOKABLE_SERVICES } from '../../../booking/mockData';

// Only subjects on offer today (RULES.md "Subjects"); retired ones keep their copy in content.ts but are not shown.
const SERVICES_DATA = ALL_PILLARS.map((p) => ({ ...p, services: p.services.filter((s) => BOOKABLE_SERVICES.some((b) => b.id === s.id)) }));
import { BookOpen, Globe2, Languages, Library, Search, X } from 'lucide-react';
import { SubjectCard, FamilyStyle } from './SubjectCard';
import { FAMILY_SCENES } from '../illustrations/StudyScenes';

// One short line per subject, in the academy's voice (RULES.md 6b): [English, Arabic].
const SUBJECT_TAGLINES: Record<string, [string, string]> = {
  'quran-reading': ['Read it the way it was revealed.', 'اقرأه كما نزل.'],
  'tajweed': ['Give every letter its right.', 'أعطِ كل حرف حقّه.'],
  'quran-memorization': ["Carry the Qur'an in your heart.", 'احمل القرآن في قلبك.'],
  'quran-revision': ['Keep what you memorized, for life.', 'اللي حفظته يفضل معاك.'],
  'aqeedah': ['A faith you understand, and feel.', 'إيمان تفهمه وتطمئن بيه.'],
  'fiqh': ['Pray and worship with certainty.', 'صلِّ واعبد ربك على يقين.'],
  'seerah': ['Walk with the Prophet ﷺ, step by step.', 'امشِ مع النبي ﷺ خطوة بخطوة.'],
  'islamic-studies': ['Live the deen, not just learn it.', 'عِش الدين، مش بس تتعلمه.'],
  'zad-essentials': ['The first provisions for the road.', 'أول زادك في الطريق.'],
  'modern-standard-arabic': ['Understand what you recite.', 'افهم اللي بتقراه.'],
  'arabic-conversation': ['Speak from the very first lesson.', 'اتكلم من أول حصة.'],
  'egyptian-arabic': ['Talk like you grew up by the Nile.', 'اتكلم كأنك من أهل البلد.'],
  'arabic-foundations': ['Every journey starts with a letter.', 'كل رحلة بتبدأ بحرف.'],
  'english': ['Speak English with confidence.', 'اتكلم إنجليزي بثقة.'],
};

// One brand colour per family of subjects: tab gradient, deep card portal, chips, accents.
const FAMILY_CONFIGS: Record<string, FamilyStyle & { icon: React.ComponentType<{ className?: string }>; window: string; tint: string }> = {
  quran: {
    icon: BookOpen,
    window: 'from-[#C51F24] via-[#A3271F] to-[#8B4935]',
    portal: ['#A3201F', '#4E2219'],
    tint: '#C51F24',
    chip: 'bg-[#C51F24]/10 text-[#C51F24] dark:text-[#E82C32] border-[#C51F24]/25',
    text: 'text-[#C51F24] dark:text-[#E82C32]'
  },
  islamic_studies: {
    icon: Library,
    window: 'from-[#087D91] via-[#0A6B7C] to-[#05434E]',
    portal: ['#0B7183', '#05363F'],
    tint: '#087D91',
    chip: 'bg-[#087D91]/10 text-[#087D91] dark:text-[#12A4BC] border-[#087D91]/25',
    text: 'text-[#087D91] dark:text-[#12A4BC]'
  },
  arabic: {
    icon: Languages,
    window: 'from-[#8B4935] via-[#9C5A33] to-[#B4552F]',
    portal: ['#9C5A33', '#4A2619'],
    tint: '#8B4935',
    chip: 'bg-[#8B4935]/10 text-[#8B4935] dark:text-[#DA7960] border-[#8B4935]/25',
    text: 'text-[#8B4935] dark:text-[#DA7960]'
  },
  english: {
    icon: Globe2,
    window: 'from-[#E5A93C] via-[#C98A2A] to-[#8B4935]',
    portal: ['#C98A2A', '#5E321F'],
    tint: '#E5A93C',
    chip: 'bg-[#E5A93C]/15 text-[#8A5A12] dark:text-[#E5A93C] border-[#E5A93C]/35',
    text: 'text-[#8A5A12] dark:text-[#E5A93C]'
  }
};

// Arabic details for all 14 subjects (English ones live in src/data/content.ts).
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
    recommendedFrequency: '٢ لـ ٣ حصص في الأسبوع'
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
    recommendedFrequency: 'حصتين في الأسبوع'
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
    recommendedFrequency: '٢ لـ ٤ حصص في الأسبوع'
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
    recommendedFrequency: '٢ لـ ٣ حصص في الأسبوع'
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
    recommendedFrequency: 'حصة أو اتنين في الأسبوع'
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
    recommendedFrequency: 'حصة أو اتنين في الأسبوع'
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
    recommendedFrequency: 'حصة في الأسبوع'
  },
  'zad-essentials': {
    description: 'دروس متحركة في العقيدة والطهارة والصلاة والأخلاق. كل موضوع يبدأ بالحجة العقلية، ثم الدليل من القرآن والسنة، ثم خطوة عملية صغيرة.',
    whoIsItFor: 'الأطفال اللي لسه مايعرفوش حاجة (نسخة الأطفال ٦–١١)، والناشئة والكبار اللي عايزين بداية صحيحة (١٢+).',
    whatYouWillLearn: [
      'مين هو الله، وليه نعبده وحده',
      'الوضوء والصلاة خطوة بخطوة مع الدليل',
      'أركان الإسلام والإيمان بشرح بسيط',
      'أخلاق وسنن يومية تغيّر أفعال الطفل وكلامه'
    ],
    recommendedFrequency: 'حصة أو اتنين في الأسبوع'
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
    recommendedFrequency: 'حصتين في الأسبوع'
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
    recommendedFrequency: 'حصتين في الأسبوع'
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
    recommendedFrequency: '٢ لـ ٣ حصص في الأسبوع'
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
    recommendedFrequency: 'حصة أو اتنين في الأسبوع'
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
    recommendedFrequency: '٢ لـ ٣ حصص في الأسبوع'
  },
  'english': {
    description: 'معلمينا بيدرّسوا الإنجليزية بمستوى C1، وعارفين كويس الأصوات والقواعد اللي بتتعب الناطقين بالعربية، وبيصححوها بدقة وصبر.',
    whoIsItFor: 'الناطقون بالعربية الراغبون في الطلاقة والمحادثة، المهاجرون، أو الطلاب المستعدون للدراسة بالخارج واجتياز الاختبارات.',
    whatYouWillLearn: [
      'تدريب مركز على النطق الصحيح وتصفية مخارج الحروف الإنجليزية',
      'اكتساب طلاقة التحدث في بيئات العمل والمواقف الاجتماعية الحية',
      'تصحيح الأخطاء النحوية الناجمة عن الترجمة الحرفية من العربية',
      'مهارات القراءة السريعة وكتابة الرسائل والبريد الإلكتروني المهني'
    ],
    recommendedFrequency: 'حصتين في الأسبوع'
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
            ...(SUBJECT_TAGLINES[service.id] || []),
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
            title={isEn ? <>What you can <span className="text-ribbon">learn with us.</span></> : <>تتعلم إيه <span className="text-ribbon">معانا؟</span></>}
            intro={isEn
              ? 'One-on-one lessons shaped around your goal: Quran and Tajweed, Zad Essentials and Seerah, Arabic and English, from the very first letter to advanced study.'
              : 'دروس فردية على مقاس هدفك: القرآن والتجويد، وأول الزاد والسيرة، والعربية والإنجليزية، من أول حرف لحد المستوى المتقدم.'}
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
              className={`focus-ring min-h-11 px-4 py-2 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
                selectedPillarId === 'all' ? 'bg-foreground text-background border-foreground' : 'bg-surface text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {isEn ? 'All subjects' : 'كل المواد'}
            </button>
            {SERVICES_DATA.map((pillar) => {
              const config = FAMILY_CONFIGS[pillar.id] || FAMILY_CONFIGS.quran;
              const Icon = config.icon;
              const isSelected = selectedPillarId === pillar.id;
              return (
                <button
                  key={pillar.id}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedPillarId(pillar.id)}
                  className={`focus-ring min-h-11 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors cursor-pointer ${
                    isSelected ? `bg-gradient-to-br ${config.window} text-white border-transparent` : `bg-surface border-border text-muted-foreground hover:text-foreground`
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
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
              placeholder={isEn ? 'Search: Tajweed, Seerah, Fusha…' : 'ابحث: تجويد، سيرة، فصحى…'}
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
              <span>{isEn ? `${totalResultsCount} subject(s) for "${searchQuery}"` : `${totalResultsCount} مادة لكلمة "${searchQuery}"`}</span>
              <button 
                onClick={() => setSearchQuery('')} 
                className="text-primary hover:underline font-bold"
              >
                {isEn ? 'Clear search' : 'امسح البحث'}
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
                {isEn ? 'No subject matches that word' : 'ملقيناش مادة بالكلمة دي'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isEn 
                  ? 'Try another word, or book a free trial and tell your teacher what you want to learn.'
                  : 'جرّب كلمة تانية، أو احجز حصة مجانية وقول لمعلمك عايز تتعلم إيه.'}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedPillarId('all'); }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:opacity-95 cursor-pointer"
              >
                {isEn ? 'Show all subjects' : 'اعرض كل المواد'}
              </button>
            </div>
          ) : (
            filteredPillars.map((pillar) => {
              const config = FAMILY_CONFIGS[pillar.id] || FAMILY_CONFIGS.quran;
              const FamilyScene = FAMILY_SCENES[pillar.id];

              return (
                <section key={pillar.id} aria-labelledby={`family-${pillar.id}`} className="space-y-6">

                  <header className="family-head" style={{ "--fam": config.tint } as React.CSSProperties}>
                    <div className="order-2 sm:order-1 space-y-2 text-center sm:text-start">
                      <h2 id={`family-${pillar.id}`} className="font-editorial text-[1.75rem] sm:text-4xl text-foreground font-bold leading-tight">
                        {isEn ? pillar.title : pillar.arabicTitle}
                      </h2>
                      <p className="text-base text-muted-foreground leading-relaxed max-w-xl sm:mx-0 mx-auto">
                        {isEn ? pillar.description : (pillar.arabicDescription || pillar.description)}
                      </p>
                    </div>
                    {FamilyScene && <FamilyScene className="family-scene order-1 sm:order-2" />}
                  </header>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {pillar.services.map((service) => {
                      const arDetails = ARABIC_SERVICE_DETAILS[service.id];
                      const line = SUBJECT_TAGLINES[service.id];
                      return (
                        <SubjectCard
                          key={service.id}
                          service={service}
                          family={config}
                          isEn={isEn}
                          title={isEn ? service.name : (service.arabicName || service.name)}
                          tagline={line ? line[isEn ? 0 : 1] : (isEn ? service.tagline : (service.arabicTagline || service.tagline))}
                          whoFor={isEn ? service.whoIsItFor : (arDetails?.whoIsItFor || service.whoIsItFor)}
                          learn={isEn ? (service.whatYouWillLearn || []) : (arDetails?.whatYouWillLearn || service.whatYouWillLearn || [])}
                          frequency={isEn ? service.recommendedFrequency : (arDetails?.recommendedFrequency || service.recommendedFrequency)}
                          expanded={Boolean(expandedServices[service.id])}
                          onToggle={() => toggleExpand(service.id)}
                          onTrial={() => onOpenTrialModal(service.id)}
                        />
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
