import type { ServiceOption, TimezoneOption, DayAvailability, TimeSlot, LessonDuration } from './types';

export const BOOKING_SERVICES: ServiceOption[] = [
  // --- QURAN PILLAR ---
  {
    id: 'quran-reading',
    name: 'Quran Reading (Noorani Qaidah & Fluency)',
    arabicName: 'القراءة القرآنية والقاعدة النورانية',
    group: 'quran',
    tagline: 'Step-by-step reading mastery from Arabic letters to fluent recitation.',
    arabicTagline: 'من الحروف الأساسية إلى القراءة التامة السلسة للمصحف.',
    description: 'A structured, patient approach to phonetics, letter connections, vowel signs (Harakat), and smooth reading directly from the Mushaf.',
    arabicDescription: 'منهج صبور ومنظم يبدأ من مخارج الحروف وحركاتها وحتى التلاوة المباشرة من المصحف.',
    suggestedGoals: [
      'Learn Arabic letters and vowels from scratch',
      'Improve reading fluency and eliminate hesitation',
      'Transition from Nourani Qaidah to the Mushaf',
      'Learn correct Quranic pausing and stopping signs'
    ],
    arabicSuggestedGoals: [
      'تعلم الحروف والحركات من البداية',
      'تحسين طلاقة القراءة والتخلص من التردد',
      'الانتقال من القاعدة النورانية إلى المصحف الشريف',
      'إتقان علامات الوقف والابتداء'
    ],
    defaultDurations: [30, 45, 60],
    hourlyRateUsd: 9
  },
  {
    id: 'tajweed',
    name: 'Tajweed Rules & Applied Articulation',
    arabicName: 'أحكام التجويد ومخارج الحروف',
    group: 'quran',
    tagline: 'Practical application of Makhaarij, Sifaat, and recitation rules.',
    arabicTagline: 'تطبيق عملي لأحكام النون والميم والمدود ومخارج الحروف.',
    description: 'Learn the exact rules of Tajweed through guided repetition and real-time auditory correction, applying theoretical rules directly into verses.',
    arabicDescription: 'إتقان أحكام التلاوة عبر الترديد والتصحيح الصوتي المباشر والتدريب العملي.',
    suggestedGoals: [
      'Master rules of Noon Sakinah, Meem Sakinah, and Madd',
      'Correct letter articulation points (Makhaarij)',
      'Refine heavy and light letters (Tafkheem & Tarqeeq)',
      'Prepare for structured Tajweed certification / Ijazah path'
    ],
    arabicSuggestedGoals: [
      'إتقان أحكام النون والميم والمدود',
      'تصحيح مخارج وصفات الحروف بدقة',
      'التمييز العملي بين التفخيم والترقيق',
      'التأسيس لمنهج الإجازة القرآنية'
    ],
    defaultDurations: [30, 45, 60],
    hourlyRateUsd: 9
  },
  {
    id: 'quran-memorization',
    // Memorization and revision are one subject since 2026-10-18 (quran-revision is retired).
    name: 'Quran Memorization & Revision',
    arabicName: 'الحفظ والمراجعة',
    group: 'quran',
    tagline: 'New memorization or keeping what you know, at a pace that fits your life.',
    arabicTagline: 'حفظ جديد أو تثبيت اللي حفظته، على قد وقتك وطاقتك.',
    description: 'Tell us your goal and how much you know. We build one plan that adds new pages and keeps the old ones firm, with a daily routine you can keep.',
    arabicDescription: 'قولنا هدفك وحافظ قد إيه. بنعمل لك خطة واحدة تضيف حفظ جديد وتثبّت القديم، مع ورد يومي تقدر تلتزم بيه.',
    suggestedGoals: [
      'Memorize Juz’ Amma or Juz’ Tabarak',
      'Establish a disciplined daily Hifz routine',
      'Memorize selected Surahs (Al-Kahf, Yaseen, Al-Mulk)',
      'Complete long-term full Quran memorization track'
    ],
    arabicSuggestedGoals: [
      'حفظ جزء عم أو جزء تبارك',
      'بناء ورد يومي منضبط للحفظ',
      'حفظ سور مخصوصة كالملك والكهف ويس',
      'السير في خطة ختم القرآن الكريم كاملاً'
    ],
    defaultDurations: [30, 45, 60],
    hourlyRateUsd: 9
  },
  {
    id: 'quran-revision',
    hidden: true,
    name: 'Quran Revision & Retention (Muraja’ah)',
    arabicName: 'المراجعة والتثبيت القرآني',
    group: 'quran',
    tagline: 'Re-strengthening previously memorized parts with structured oversight.',
    arabicTagline: 'إعادة تثبيت ما سبق حفظه وتصحيح المتشابهات.',
    description: 'Dedicated revision cycles for students who have memorized parts of the Quran and want to eliminate doubts, mutashabihat, and memory slips.',
    arabicDescription: 'جلسات مراجعة منتظمة لمن سبق لهم الحفظ لضبط المتشابهات وإتقان الحفظ.',
    suggestedGoals: [
      'Revise and solidify previously memorized Surahs',
      'Fix Mutashabihat (similar sounding verses)',
      'Prepare for an oral Quran examination',
      'Maintain an unbroken weekly recitation cycle'
    ],
    arabicSuggestedGoals: [
      'تثبيت وتمكين الأجزاء المحفوظة سابقاً',
      'ضبط المتشابهات اللفظية في الآيات',
      'الاستعداد للاختبارات القرآنية',
      'المحافظة على ورد مراجعة أسبوعي مستمر'
    ],
    defaultDurations: [30, 45, 60],
    hourlyRateUsd: 9
  },

  // --- ISLAMIC STUDIES PILLAR ---
  {
    // The curriculum's foundations subject (docs/curriculum/PLAN.md §1a): Kids 6–11, Teens & Adults 12+.
    id: 'zad-essentials',
    name: 'Zad Essentials (The First Things Every Muslim Needs)',
    arabicName: 'أول الزاد: ما لا يسع المسلم جهله',
    group: 'islamic_studies',
    tagline: 'For learners starting from zero: belief, purity, prayer and good manners, with the reason behind each.',
    arabicTagline: 'لمن يبدأ من الصفر: العقيدة والطهارة والصلاة والأخلاق، مع الحكمة والدليل.',
    description: 'Each lesson gives the reason first, then the evidence from the Quran and Sunnah, and ends with one small step to live it this week. Animated lessons in three versions, picked from the learner’s age: Kids (6–11), Teens (12–17) and Adults (18+).',
    arabicDescription: 'كل درس يبدأ بالحجة العقلية، ثم الدليل من القرآن والسنة، وينتهي بخطوة عملية صغيرة يطبقها المتعلم في أسبوعه. دروس متحركة بتلات نسخ حسب السن: للأطفال (٦–١١)، وللناشئة (١٢–١٧)، وللكبار (١٨+).',
    suggestedGoals: [
      'My child knows nothing yet and I want a clear start',
      'Learn how to make wudu and pray correctly, with the evidence',
      'Understand who Allah is and why we worship Him',
      'Build good manners and daily Sunnahs at home'
    ],
    arabicSuggestedGoals: [
      'ابني لسه مايعرفش حاجة وعايز بداية واضحة',
      'تعلم الوضوء والصلاة بطريقة صحيحة مع الدليل',
      'معرفة الله ولماذا نعبده',
      'بناء الأخلاق والسنن اليومية في البيت'
    ],
    defaultDurations: [30, 45, 60],
    hourlyRateUsd: 9
  },
  {
    id: 'islamic-studies',
    hidden: true,
    name: 'Islamic Studies for Adults & Youth',
    arabicName: 'الدراسات الإسلامية العامة',
    group: 'islamic_studies',
    tagline: 'Balanced, foundational Muslim knowledge taught with warmth and context.',
    arabicTagline: 'معارف إسلامية أصيلة بأسلوب تربوي هادئ ومناسب للغرب.',
    description: 'Comprehensive curriculum spanning the pillars of Islam, everyday manners (Adab), core du’as, and life application for learners in the West.',
    arabicDescription: 'منهج متكامل يغطي أركان الإسلام، الآداب والأذكار اليومية للمسلمين في المهجر.',
    suggestedGoals: [
      'Build core Islamic literacy for children/teens in Western schools',
      'Understand the 5 Pillars and 6 Articles of Faith',
      'Learn daily Sunnah practices, du’as, and character',
      'Safely ask personal questions about faith and identity'
    ],
    arabicSuggestedGoals: [
      'بناء وعي إسلامي متين للأبناء في الغرب',
      'فهم أركان الإسلام والإيمان بعمق',
      'تعلم الأذكار والآداب النبوية اليومية',
      'مساحة آمنة للنقاش والإجابة عن تساؤلات الهوية'
    ],
    defaultDurations: [30, 45, 60],
    hourlyRateUsd: 9
  },
  {
    id: 'fiqh',
    hidden: true,
    name: 'Practical Fiqh (Worship & Daily Life)',
    arabicName: 'الفقه الميسر والعلوم الشرعية',
    group: 'islamic_studies',
    tagline: 'Clear, step-by-step guidance on Taharah, Salah, Sawm, and everyday halal ($9/hr base, up to $13/hr for advanced Fiqh).',
    arabicTagline: 'بيان أحكام الطهارة والصلاة والصيام والمعاملات (تبدأ من 9$ للميسر وحتى 13$ للمستويات المتقدمة).',
    description: 'Accessible learning on how to perform acts of worship accurately according to established mainstream Islamic jurisprudence, without sectarian division.',
    arabicDescription: 'شرح ميسر لأحكام العبادات والمعاملات وفق المنهج المعتدل دون تعقيد.',
    suggestedGoals: [
      'Master the step-by-step conditions, obligations, and Sunnahs of Salah',
      'Learn the rules of Taharah (wudu, ghusl, purification)',
      'Understand rules of Fasting (Ramadan) and Zakah basics',
      'Clarify everyday Halal vs Haram rulings'
    ],
    arabicSuggestedGoals: [
      'إتقان شروط وأركان وسنن الصلاة العملية',
      'تعلم أحكام الطهارة والوضوء والغسل',
      'فهم أحكام الصيام وزكاة الفطر والمال',
      'معرفة الحلال والحرام في شؤون الحياة اليومية'
    ],
    defaultDurations: [30, 45, 60],
    hourlyRateUsd: 9
  },
  {
    id: 'aqeedah',
    hidden: true,
    name: 'Aqeedah (Islamic Creed & Core Beliefs)',
    arabicName: 'العقيدة الإسلامية الصافية',
    group: 'islamic_studies',
    tagline: 'Clarity of faith, understanding Allah’s Names, and grounding spiritual certainty.',
    arabicTagline: 'ترسيخ الإيمان ومعرفة أسماء الله الحسنى وصفاته بأمان وسكينة.',
    description: 'Grounding the heart in sound Islamic beliefs, the Names and Attributes of Allah, angels, books, prophets, and the Day of Judgment.',
    arabicDescription: 'غرس الإيمان الصحيح في القلب والتعرف على أركان الإيمان بأسلوب يورث الطمأنينة.',
    suggestedGoals: [
      'Understand the Beautiful Names of Allah and their spiritual impact',
      'Build unshakeable certainty and answers to modern doubts',
      'Deepen understanding of destiny (Qadar) and divine wisdom',
      'Teach foundational monotheism (Tawheed) to children'
    ],
    arabicSuggestedGoals: [
      'التعرف على أسماء الله الحسنى وأثرها الروحي',
      'بناء اليقين والإجابة عن الشبهات المعاصرة',
      'فهم حكمة الله وقضائه وقدره',
      'تعليم التوحيد للأطفال بصورة ميسرة'
    ],
    defaultDurations: [30, 45, 60],
    hourlyRateUsd: 9
  },
  {
    id: 'seerah',
    name: 'Seerah (Prophetic Biography & Moral Character)',
    arabicName: 'السيرة النبوية والشمائل المحمدية',
    group: 'islamic_studies',
    tagline: 'The inspiring life, character, and leadership of Prophet Muhammad ﷺ.',
    arabicTagline: 'دراسة سيرة النبي ﷺ وأخلاقه القيادية والإنسانية.',
    description: 'The life of the Prophet ﷺ from Makkah to Madinah, and what it asks of us today. Three versions by age: stories for Kids (6–11), choices and lessons for Teens (12–17), more depth for Adults (18+).',
    arabicDescription: 'رحلة مع سيرة الحبيب ﷺ من مكة للمدينة، وإيه اللي بتطلبه مننا النهارده. تلات نسخ حسب السن: قصص للأطفال (٦–١١)، ومواقف ودروس للناشئة (١٢–١٧)، وعمق أكتر للكبار (١٨+).',
    suggestedGoals: [
      'Learn the chronological life story of the Prophet ﷺ',
      'Instill love of the Prophet ﷺ in family and children',
      'Study the morals and interactions of the Companions',
      'Apply Prophetic empathy and character in daily life'
    ],
    arabicSuggestedGoals: [
      'دراسة أحداث السيرة النبوية بترتيب زمني ملهم',
      'غرس محبة النبي ﷺ في قلوب الأبناء',
      'التعرف على سِيَر الصحابة الكرام وتضحياتهم',
      'تطبيق الأخلاق والرحمة المحمدية في المعاملات'
    ],
    defaultDurations: [30, 45, 60],
    hourlyRateUsd: 9
  },

  // --- ARABIC PILLAR ---
  {
    id: 'arabic-conversation',
    hidden: true,
    name: 'Arabic Conversation & Speaking Fluency',
    arabicName: 'المحادثة والتحدث باللغة العربية',
    group: 'arabic',
    tagline: 'Practical oral confidence through immersive, encouraging dialogue.',
    arabicTagline: 'اكتساب الشجاعة في التحدث عبر الحوار التفاعلي المشجع.',
    description: 'Overcome fear of speaking. Interactive dialogue practice on daily life, family, travel, hobbies, and authentic discussions with live correction.',
    arabicDescription: 'كسر حاجز الخوف من التحدث عبر جلسات حوارية تشمل مواقف الحياة اليومية والتعبير الحر.',
    suggestedGoals: [
      'Speak Arabic comfortably without anxiety',
      'Acquire natural conversational phrases and idioms',
      'Improve listening comprehension and pronunciation',
      'Build vocabulary for everyday discussions'
    ],
    arabicSuggestedGoals: [
      'التحدث بالعربية دون قلق أو تردد',
      'اكتساب تعبيرات ومصطلحات طبيعية شائعة',
      'تطوير الاستماع وفهم المتحدثين الأصليين',
      'زيادة الحصيلة اللغوية للمحادثات اليومية'
    ],
    defaultDurations: [30, 45, 60],
    hourlyRateUsd: 13
  },
  {
    id: 'modern-standard-arabic',
    // Fusha absorbs arabic-foundations and arabic-conversation since 2026-10-18.
    name: 'Fusha Arabic (Modern Standard Arabic)',
    arabicName: 'العربية الفصحى',
    group: 'arabic',
    tagline: 'From the alphabet to reading, writing and speaking with confidence ($13/hr).',
    arabicTagline: 'من الحروف لحد القراءة والكتابة والكلام بثقة (13$ للساعة).',
    description: 'Start at Foundations (letters, reading, writing), then beginner, intermediate and advanced. Conversation runs through every level. A version for kids and one for 12+.',
    arabicDescription: 'بنبدأ بالتأسيس (الحروف والقراءة والكتابة)، وبعده مبتدئ ومتوسط ومتقدم، والمحادثة معاك في كل مستوى. نسخة للأطفال ونسخة من ١٢ سنة.',
    suggestedGoals: [
      'Understand classical Arabic grammar (Nahw & Sarf)',
      'Read Arabic articles, books, and Islamic literature',
      'Understand the language of the Quran directly without translation',
      'Achieve academic fluency in Arabic writing and reading'
    ],
    arabicSuggestedGoals: [
      'فهم قواعد النحو والصرف بطريقة مبسطة',
      'قراءة النصوص والمقالات والكتب التراثية',
      'فهم معاني القرآن الكريم باللغة العربية مباشرة',
      'تطوير مهارات الكتابة والقراءة الأكاديمية'
    ],
    defaultDurations: [30, 45, 60],
    hourlyRateUsd: 13
  },
  {
    id: 'egyptian-arabic',
    name: 'Egyptian Colloquial Arabic (Ammiyya)',
    arabicName: 'اللهجة المصرية العامية',
    group: 'arabic',
    tagline: 'The most widely understood dialect across the entire Arab world ($13/hr).',
    arabicTagline: 'اللهجة الأكثر انتشاراً وفهماً في العالم العربي (13$ للساعة).',
    description: 'Learn authentic Egyptian Ammiyya for real-life conversations, travel, films, and connecting effortlessly with native Arabic speakers worldwide.',
    arabicDescription: 'تعلم اللهجة المصرية المحبوبة للمحادثات اليومية والسفر والتواصل الممتع.',
    suggestedGoals: [
      'Communicate naturally with friends, family, or travel in Egypt',
      'Understand Egyptian media, shows, and cultural references',
      'Master common street phrases, greetings, and humor',
      'Switch smoothly between formal Arabic and everyday dialect'
    ],
    arabicSuggestedGoals: [
      'التواصل التلقائي عند السفر أو مع الأصدقاء',
      'فهم الحوارات والأفلام والمسلسلات المصرية',
      'إتقان التعبيرات والتحيات اليومية الشعبية',
      'الربط الذكي بين الفصحى واللهجة الدارجة'
    ],
    defaultDurations: [30, 45, 60],
    hourlyRateUsd: 13
  },
  {
    id: 'arabic-foundations',
    hidden: true,
    name: 'Arabic for Beginners (Reading, Writing & Phonics)',
    arabicName: 'أساسيات اللغة العربية للمبتدئين',
    group: 'arabic',
    tagline: 'A gentle, systematic start for non-Arabic speakers and reverts.',
    arabicTagline: 'بداية هادئة ومنهجية لغير الناطقين بالعربية والمسلمين الجدد.',
    description: 'Designed specifically for those who cannot yet read the Arabic script or have just embraced Islam, building confidence letter by letter.',
    arabicDescription: 'مخصص لمن لا يعرف قراءة الحروف أو المسلمين الجدد لبناء الأساس بثقة.',
    suggestedGoals: [
      'Master the Arabic alphabet and writing strokes',
      'Read basic vocabulary, road signs, and prayer texts',
      'Form first spoken sentences and personal greetings',
      'Gain confidence in basic Arabic pronunciation'
    ],
    arabicSuggestedGoals: [
      'إتقان الحروف الهجائية ورسمها وقراءتها',
      'قراءة الكلمات الأساسية ونصوص الصلوات',
      'تكوين أولى الجمل الشفهية والتحيات',
      'اكتساب نطق عربي سليم وواثق'
    ],
    defaultDurations: [30, 45, 60],
    hourlyRateUsd: 9
  },

  // --- ENGLISH PILLAR ---
  {
    id: 'english',
    name: 'English Language (Phonics, Reading & CEFR A1–C1)',
    arabicName: 'اللغة الإنجليزية (الأصوات والقراءة ومستويات A1–C1)',
    group: 'english',
    tagline: 'Everyday, school and work English with a patient, qualified teacher ($13/hr).',
    arabicTagline: 'إنجليزي للحياة والمدرسة والشغل، مع معلم صبور ومؤهل (13$ للساعة).',
    description: 'For children: phonics and reading, step by step. From age 12: the CEFR levels A1 to C1, with speaking in every lesson, grammar and writing.',
    arabicDescription: 'للأطفال: الأصوات والقراءة خطوة بخطوة. ومن سن 12: مستويات A1 لحد C1، مع محادثة في كل درس، وقواعد وكتابة.',
    suggestedGoals: [
      'Read simple English words and sentences with confidence (children)',
      'Speak more confidently in everyday conversations',
      'Reach the next CEFR level (A1 to C1)',
      'Write clearer emails and school work with fewer grammar mistakes'
    ],
    arabicSuggestedGoals: [
      'يقرأ كلمات وجمل إنجليزي بسيطة بثقة (للأطفال)',
      'ثقة أكبر في المحادثة اليومية',
      'الوصول للمستوى اللي بعده (من A1 لحد C1)',
      'كتابة إيميلات وواجبات أوضح وبأخطاء أقل'
    ],
    defaultDurations: [30, 45, 60],
    hourlyRateUsd: 13
  }
];

/** Subjects that can be chosen today; retired ones stay in BOOKING_SERVICES only to label old bookings. */
export const BOOKABLE_SERVICES = BOOKING_SERVICES.filter((s) => !s.hidden);

export const MAJOR_TIMEZONES: TimezoneOption[] = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)', city: 'New York / Toronto', offset: 'UTC-4 / UTC-5' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)', city: 'Chicago / Dallas', offset: 'UTC-5 / UTC-6' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)', city: 'Denver / Calgary', offset: 'UTC-6 / UTC-7' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)', city: 'Los Angeles / Vancouver', offset: 'UTC-7 / UTC-8' },
  { value: 'Europe/London', label: 'UK & Ireland Time (GMT / BST)', city: 'London / Dublin', offset: 'UTC+0 / UTC+1' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)', city: 'Paris / Berlin / Amsterdam', offset: 'UTC+1 / UTC+2' },
  { value: 'Africa/Cairo', label: 'Egypt Time', city: 'Cairo / Alexandria', offset: 'UTC+3' },
  { value: 'Asia/Riyadh', label: 'Arabian Standard Time (AST)', city: 'Riyadh / Makkah / Madinah', offset: 'UTC+3' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', city: 'Dubai / Abu Dhabi', offset: 'UTC+4' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AEST)', city: 'Sydney / Melbourne', offset: 'UTC+10 / UTC+11' },
  { value: 'Australia/Perth', label: 'Australian Western Time (AWST)', city: 'Perth', offset: 'UTC+8' }
];

// Helper to calculate exact lesson rate based on service and duration
export function calculateLessonFee(serviceId: string, duration: LessonDuration, isTrial: boolean): number {
  if (isTrial) return 0;
  const service = BOOKING_SERVICES.find((s) => s.id === serviceId);
  const hourlyRate = service?.hourlyRateUsd || 9;
  
  // Display only; the server computes the charged fee with the same rule (server/pricing lessonFeeUsd).
  return Math.round(((hourlyRate * duration) / 60) * 100) / 100;
}

import { calculateCairoEquivalent } from '../lib/timezone.js';

// Generate realistic mock availability for 21 days from today
export function generateMockAvailability(baseDate = new Date(), timezone = 'America/New_York'): DayAvailability[] {
  const days: DayAvailability[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Start from tomorrow so visitors always book realistic upcoming slots
  for (let i = 1; i <= 21; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);

    const dayOfWeekIndex = d.getDay();
    const dayOfWeek = dayNames[dayOfWeekIndex];
    const dayOfMonth = d.getDate();
    const monthName = monthNames[d.getMonth()];
    const year = d.getFullYear();
    const monthPadded = String(d.getMonth() + 1).padStart(2, '0');
    const dayPadded = String(dayOfMonth).padStart(2, '0');
    const dateString = `${year}-${monthPadded}-${dayPadded}`;

    // Friday has slightly reduced slots for Jumu'ah prayer, Sundays are teaching days
    // Let day 7 and 14 have "no availability" simulation to demonstrate empty state gracefully
    const isSpecialOffDay = i === 6 || i === 13;

    if (isSpecialOffDay) {
      days.push({
        dateString,
        dayOfWeek,
        dayOfMonth,
        monthName,
        isAvailable: false,
        reasonUnavailable: 'No lessons on this day.',
        slots: []
      });
      continue;
    }

    // Standard available slots with dynamic Cairo equivalent computation
    const rawTimes = [
      { time24: '09:00', timeDisplay: '09:00 AM', period: 'morning' as const, available: true },
      { time24: '10:30', timeDisplay: '10:30 AM', period: 'morning' as const, available: i % 3 !== 0 },
      { time24: '11:45', timeDisplay: '11:45 AM', period: 'morning' as const, available: true },
      { time24: '14:00', timeDisplay: '02:00 PM', period: 'afternoon' as const, available: true },
      { time24: '15:30', timeDisplay: '03:30 PM', period: 'afternoon' as const, available: i % 2 === 0 },
      { time24: '17:00', timeDisplay: '05:00 PM', period: 'afternoon' as const, available: true },
      { time24: '18:30', timeDisplay: '06:30 PM', period: 'evening' as const, available: true },
      { time24: '20:00', timeDisplay: '08:00 PM', period: 'evening' as const, available: i % 4 !== 0 },
      { time24: '21:15', timeDisplay: '09:15 PM', period: 'evening' as const, available: true }
    ];

    const slots: TimeSlot[] = rawTimes.map((slot) => ({
      id: `${dateString}-${slot.time24.replace(':', '')}`,
      time24: slot.time24,
      timeDisplay: slot.timeDisplay,
      period: slot.period,
      available: slot.available,
      cairoTimeEquiv: calculateCairoEquivalent(dateString, slot.time24, timezone)
    }));

    days.push({
      dateString,
      dayOfWeek,
      dayOfMonth,
      monthName,
      isAvailable: true,
      slots
    });
  }

  return days;
}
