/**
 * One public landing page per subject and audience under /learning/<slug>, so a family searching
 * "online Quran classes for kids" or "learn Egyptian Arabic online" lands on a page about exactly that.
 * Each language is written on its own. Facts only from RULES.md (subjects §2b, prices §3, trial §2);
 * no invented claims. Each page gets its own address, hreflang pair and Course schema
 * (src/data/seo.ts, scripts/prerender-seo.ts).
 */
export interface QA { q: string; a: string }

export interface SubjectPage {
  slug: string;
  /** BOOKABLE_SERVICES ids this page is about (first one gives the schema price). */
  serviceIds: string[];
  rateUsd: 9 | 13;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  h1En: string;
  h1Ar: string;
  introEn: string[];
  introAr: string[];
  learnEn: string[];
  learnAr: string[];
  faqEn: QA[];
  faqAr: QA[];
  related: string[];
}

export const SUBJECT_PAGES_PATH = '/learning';

export const SUBJECT_PAGES: SubjectPage[] = [
  {
    slug: 'online-quran-classes-for-kids',
    serviceIds: ['quran-reading', 'tajweed', 'quran-memorization'],
    rateUsd: 9,
    titleEn: 'Online Quran Classes for Kids, 1-on-1 on Zoom | Watazawwado',
    titleAr: 'حصص قرآن أونلاين للأطفال، فردية على Zoom | وتزودوا',
    descEn: 'One-on-one online Quran classes for children aged 6 to 17: reading from the first letters, Tajweed and memorization, with male and female teachers. Free trial lesson.',
    descAr: 'حصص قرآن فردية أونلاين للأطفال من ٦ لـ ١٧ سنة: قراءة من أول الحروف، وتجويد، وحفظ، مع معلمين ومعلمات. أول حصة تجريبية مجاناً.',
    h1En: 'Online Quran classes for kids',
    h1Ar: 'حصص قرآن أونلاين للأطفال',
    introEn: [
      'Your child gets their own teacher, live on Zoom, one-on-one. The teacher hears every letter, corrects it on the spot and keeps the pace right for that child, whether they are starting with the alphabet or reading from the Mushaf.',
      'Lessons are 30, 45 or 60 minutes, at times that fit around school. You can sit in whenever you like.'
    ],
    introAr: [
      'ابنك ليه معلم خاص بيه، مباشر على Zoom، حصة فردية. المعلم بيسمع كل حرف، وبيصحّحه في وقتها، وبيمشي على قد سرعة ابنك، سواء لسه بيبدأ بالحروف أو بيقرا من المصحف.',
      'الحصة ٣٠ أو ٤٥ أو ٦٠ دقيقة، في مواعيد تناسب المدرسة. وتقدر تحضر الحصة وقت ما تحب.'
    ],
    learnEn: [
      'Reading from zero: the letters, their sounds and the qaida, then reading the Mushaf until it flows.',
      'Tajweed in three levels, applied while they recite, not only memorized as rules.',
      'Memorization and revision at their own pace, starting from the short surahs.',
      'A short placement test after the free trial, so lessons start at the right level.'
    ],
    learnAr: [
      'القراءة من الصفر: الحروف وأصواتها والقاعدة، وبعدين القراءة من المصحف لحد ما يقرا بطلاقة.',
      'التجويد على ٣ مستويات، بيتطبّق وهو بيقرا، مش قواعد محفوظة وبس.',
      'حفظ ومراجعة على قد سرعته، من السور القصيرة.',
      'اختبار تحديد مستوى قصير بعد الحصة التجريبية، عشان نبدأ من المستوى الصح.'
    ],
    faqEn: [
      { q: 'From what age can my child start?', a: 'Children in a family account are 6 to 17. A parent aged 18 or over opens the account and manages each child.' },
      { q: 'Can my daughter have a female teacher?', a: 'Yes. We have male and female teachers, and you choose your child’s teacher when you sign up.' },
      { q: 'How much does it cost?', a: 'Quran lessons are from $9 an hour, so a 30-minute lesson is $4.50. The first lesson is a free 30-minute trial.' }
    ],
    faqAr: [
      { q: 'ابني يقدر يبدأ من سن كام؟', a: 'الأطفال في حساب العيلة من ٦ لـ ١٧ سنة. ولي الأمر (١٨ سنة أو أكتر) بيفتح الحساب وبيتابع كل طفل.' },
      { q: 'بنتي ممكن تاخد مع معلمة؟', a: 'أيوه. معانا معلمين ومعلمات، وإنت بتختار معلم ابنك أو بنتك وإنت بتسجّل.' },
      { q: 'السعر كام؟', a: 'حصص القرآن من ٩ دولار للساعة، يعني حصة ٣٠ دقيقة بـ ٤.٥ دولار. وأول حصة تجريبية مجانية ٣٠ دقيقة.' }
    ],
    related: ['online-tajweed-classes', 'online-quran-memorization', 'islamic-classes-for-kids']
  },
  {
    slug: 'online-quran-classes-for-adults',
    serviceIds: ['quran-reading', 'tajweed', 'quran-memorization'],
    rateUsd: 9,
    titleEn: 'Online Quran Classes for Adults & Sisters, 1-on-1 | Watazawwado',
    titleAr: 'حصص قرآن أونلاين للكبار والأخوات، فردية | وتزودوا',
    descEn: 'Learn to read the Quran as an adult, fix your Tajweed or memorize, in private one-on-one Zoom lessons. Female teachers for sisters. Free trial lesson.',
    descAr: 'اتعلم قراءة القرآن وإنت كبير، أو صحّح تجويدك، أو احفظ، في حصص فردية خاصة على Zoom. معلمات للأخوات. أول حصة تجريبية مجاناً.',
    h1En: 'Online Quran classes for adults',
    h1Ar: 'حصص قرآن أونلاين للكبار',
    introEn: [
      'Many adults we teach never had the chance to learn properly as children, and feel shy about starting now. A one-on-one lesson is private: just you and your teacher, at your pace, with no one else listening.',
      'Sisters can learn with a female teacher. You choose your teacher when you sign up.'
    ],
    introAr: [
      'كبار كتير بنعلّمهم ماخدوش فرصتهم وهم صغيرين، وبيتكسفوا يبدأوا دلوقتي. الحصة الفردية خاصة: إنت ومعلمك بس، على قد سرعتك، ومحدش تاني بيسمع.',
      'الأخوات يقدروا يتعلّموا مع معلمة. وإنت بتختار معلمك وإنت بتسجّل.'
    ],
    learnEn: [
      'Reading from the first letters, or polishing a reading that already exists.',
      'Tajweed in three levels: the essential rules, the makharij and qualities of the letters, then the advanced rules.',
      'Memorization and revision: start, add more, or keep what you have firm.',
      'Lessons of 30, 45 or 60 minutes, at times you pick from your teacher’s hours.'
    ],
    learnAr: [
      'القراءة من أول الحروف، أو تحسين قراءة موجودة أصلاً.',
      'التجويد على ٣ مستويات: الأحكام الأساسية، ومخارج الحروف وصفاتها، وبعدين الأحكام المتقدمة.',
      'الحفظ والمراجعة: تبدأ، أو تزوّد، أو تثبّت اللي حافظه.',
      'الحصة ٣٠ أو ٤٥ أو ٦٠ دقيقة، في مواعيد بتختارها من مواعيد معلمك.'
    ],
    faqEn: [
      { q: 'I am a complete beginner. Is that fine?', a: 'Yes. Quran Reading starts with Foundations: the letters, their sounds and the qaida, from zero.' },
      { q: 'Are lessons recorded?', a: 'No. Lessons are not recorded, and the teacher hosts every Zoom lesson with a waiting room.' },
      { q: 'How much does it cost?', a: 'From $9 an hour, charged by length: $4.50 for 30 minutes. The first lesson is a free 30-minute trial.' }
    ],
    faqAr: [
      { q: 'أنا مبتدئ خالص. ينفع؟', a: 'أيوه. قراءة القرآن بتبدأ بالتأسيس: الحروف وأصواتها والقاعدة، من الصفر.' },
      { q: 'الحصص بتتسجّل؟', a: 'لأ. الحصص مش بتتسجّل، والمعلم هو مضيف كل حصة Zoom مع غرفة انتظار.' },
      { q: 'السعر كام؟', a: 'من ٩ دولار للساعة، والسعر على قد مدة الحصة: ٤.٥ دولار لـ ٣٠ دقيقة. وأول حصة تجريبية مجانية ٣٠ دقيقة.' }
    ],
    related: ['online-tajweed-classes', 'online-quran-memorization', 'learn-arabic-online']
  },
  {
    slug: 'online-tajweed-classes',
    serviceIds: ['tajweed'],
    rateUsd: 9,
    titleEn: 'Online Tajweed Classes, 1-on-1 for Kids & Adults | Watazawwado',
    titleAr: 'حصص تجويد أونلاين، فردية للأطفال والكبار | وتزودوا',
    descEn: 'Learn Tajweed online in one-on-one Zoom lessons: three levels from the essential rules to the advanced ones, applied as you recite. Free trial lesson.',
    descAr: 'اتعلم التجويد أونلاين في حصص فردية على Zoom: ٣ مستويات من الأحكام الأساسية للمتقدمة، بتتطبّق وإنت بتقرا. أول حصة تجريبية مجاناً.',
    h1En: 'Online Tajweed classes',
    h1Ar: 'حصص تجويد أونلاين',
    introEn: [
      'Tajweed is learned with the ear. Your teacher listens to you recite, stops at the letter that needs work, and shows you how it should sound until it becomes natural.',
      'Because the lesson is one-on-one, nothing slips past. A mistake repeated for months is hard to undo; caught early, it is a two-minute fix.'
    ],
    introAr: [
      'التجويد بيتعلّم بالودن. معلمك بيسمعك وإنت بتقرا، وبيقف عند الحرف اللي محتاج شغل، ويوريك نطقه الصح لحد ما يبقى طبيعي.',
      'وعشان الحصة فردية، مفيش حاجة بتعدّي. الغلطة اللي بتتكرر شهور صعب تتصلّح، لكن لو اتمسكت بدري بتتصلّح في دقيقتين.'
    ],
    learnEn: [
      'Level 1: the essential rules, applied while you recite.',
      'Level 2: where each letter comes from (makharij) and its qualities (sifat).',
      'Level 3: the advanced rules, until the whole picture is complete.',
      'A placement test after your free trial, so you start at the right level.'
    ],
    learnAr: [
      'المستوى الأول: الأحكام الأساسية، وتطبيقها وإنت بتقرا.',
      'المستوى الثاني: مخارج الحروف وصفاتها.',
      'المستوى الثالث: الأحكام المتقدمة، لحد ما الصورة تكمل.',
      'اختبار تحديد مستوى بعد الحصة التجريبية، عشان تبدأ من المستوى الصح.'
    ],
    faqEn: [
      { q: 'Do I need to read Arabic first?', a: 'Tajweed builds on reading. If you cannot read yet, start with Quran Reading; your teacher will tell you in the trial.' },
      { q: 'Is it for children too?', a: 'Yes. Children aged 6 to 17 learn in a family account, adults in their own account.' },
      { q: 'How much does it cost?', a: 'From $9 an hour: $4.50 for 30 minutes, $6.75 for 45, $9 for 60. The first lesson is a free trial.' }
    ],
    faqAr: [
      { q: 'لازم أعرف أقرا عربي الأول؟', a: 'التجويد مبني على القراءة. لو لسه مبتقراش، ابدأ بقراءة القرآن، ومعلمك هيقولك في الحصة التجريبية.' },
      { q: 'ينفع للأطفال كمان؟', a: 'أيوه. الأطفال من ٦ لـ ١٧ سنة بيتعلّموا في حساب العيلة، والكبار في حسابهم.' },
      { q: 'السعر كام؟', a: 'من ٩ دولار للساعة: ٤.٥ لـ ٣٠ دقيقة، و٦.٧٥ لـ ٤٥، و٩ لـ ٦٠. وأول حصة تجريبية مجانية.' }
    ],
    related: ['online-quran-memorization', 'online-quran-classes-for-kids', 'online-quran-classes-for-adults']
  },
  {
    slug: 'online-quran-memorization',
    serviceIds: ['quran-memorization'],
    rateUsd: 9,
    titleEn: 'Online Hifz Classes: Quran Memorization & Revision | Watazawwado',
    titleAr: 'حصص حفظ القرآن ومراجعته أونلاين | وتزودوا',
    descEn: 'One-on-one online Hifz lessons for kids and adults: start memorizing, add more, or keep what you know firm with steady revision. Free trial lesson.',
    descAr: 'حصص حفظ فردية أونلاين للأطفال والكبار: ابدأ الحفظ، أو زوّد، أو ثبّت اللي حافظه بمراجعة ثابتة. أول حصة تجريبية مجاناً.',
    h1En: 'Online Quran memorization (Hifz)',
    h1Ar: 'حفظ القرآن ومراجعته أونلاين',
    introEn: [
      'Memorizing is the easy half. Keeping it is the work. Our Hifz lessons put new memorization and revision together, so what you learn this month is still there next year.',
      'You tell us your goal when you sign up: starting out, adding more, or keeping what you have firm. Your teacher plans around it.'
    ],
    introAr: [
      'الحفظ هو النص السهل، والتثبيت هو الشغل الحقيقي. حصص الحفظ عندنا بتجمع الحفظ الجديد والمراجعة مع بعض، عشان اللي تحفظه الشهر ده يفضل معاك السنة الجاية.',
      'إنت بتقولنا هدفك وإنت بتسجّل: لسه ببدأ، أو بزوّد، أو بثبّت اللي حافظه. ومعلمك بيخطط على أساسه.'
    ],
    learnEn: [
      'Starting out: new memorization from the short surahs.',
      'Adding more: you know some juz and want to go further.',
      'Keeping it firm: mostly revision, to hold on to what you have.',
      'A clear task between lessons, so the week counts too.'
    ],
    learnAr: [
      'لسه ببدأ: حفظ جديد من السور القصيرة.',
      'بزوّد: حافظ كام جزء وعايز تكمّل.',
      'بثبّت: مراجعة في الأساس، عشان تحافظ على اللي حفظته.',
      'مهمة واضحة بين كل حصة والتانية، عشان الأسبوع كمان يفرق.'
    ],
    faqEn: [
      { q: 'How fast will my child memorize?', a: 'It depends on the child and on daily practice. Steady, short revision every day matters more than big amounts once a week.' },
      { q: 'Can we do revision only?', a: 'Yes. Choose “keeping it firm” and the lessons focus on revision.' },
      { q: 'How much does it cost?', a: 'From $9 an hour, charged by length. The first lesson is a free 30-minute trial.' }
    ],
    faqAr: [
      { q: 'ابني هيحفظ في قد إيه؟', a: 'ده بيختلف من طفل للتاني وعلى حسب المراجعة اليومية. مراجعة قصيرة ثابتة كل يوم أهم من كمية كبيرة مرة في الأسبوع.' },
      { q: 'ينفع مراجعة بس؟', a: 'أيوه. اختار «بثبّت» والحصص هتركّز على المراجعة.' },
      { q: 'السعر كام؟', a: 'من ٩ دولار للساعة، على قد مدة الحصة. وأول حصة تجريبية مجانية ٣٠ دقيقة.' }
    ],
    related: ['online-tajweed-classes', 'online-quran-classes-for-kids', 'online-quran-classes-for-adults']
  },
  {
    slug: 'islamic-classes-for-kids',
    serviceIds: ['zad-essentials', 'seerah'],
    rateUsd: 9,
    titleEn: 'Online Islamic Classes for Kids & Teens: the Zad Path | Watazawwado',
    titleAr: 'حصص دينية أونلاين للأطفال والشباب: مسار الأثر | وتزودوا',
    descEn: 'Our own curriculum of Islamic knowledge, taught 1-on-1 online: Zad Essentials and the Seerah, in Kids (6–11), Teens (12–17) and Adults versions. Free trial lesson.',
    descAr: 'منهجنا الخاص في العلم الشرعي للأطفال، حصص فردية أونلاين: أول الزاد والسيرة النبوية، بنسخة للأطفال (٦–١١) والشباب (١٢–١٧) والكبار. أول حصة تجريبية مجاناً.',
    h1En: 'Online Islamic classes for kids',
    h1Ar: 'حصص دينية أونلاين للأطفال: مسار الأثر',
    introEn: [
      'The Zad Path is our own curriculum: the first things every Muslim needs, and the life of the Prophet ﷺ, taught so that children understand them and live them.',
      'There is no level to choose. The version follows your child’s age: Kids 6–11, Teens 12–17, Adults 18+. Every lesson leaves time to reflect on what was learned.'
    ],
    introAr: [
      'مسار الأثر هو منهجنا الخاص: أول حاجات محتاجها كل مسلم، وسيرة النبي ﷺ، بطريقة تخلّي الأطفال يفهموها ويعيشوها.',
      'مفيش مستوى تختاره. النسخة بتمشي مع سن ابنك: أطفال ٦–١١، وشباب ١٢–١٧، وكبار ١٨ وأكتر. وكل حصة فيها وقت للتدبّر في اللي اتعلّموه.'
    ],
    learnEn: [
      'Zad Essentials: the first things every Muslim needs to know.',
      'Seerah: the life and character of the Prophet ﷺ.',
      'Balanced and moderate teaching, following Ahl al-Sunnah wal-Jama‘ah.',
      'A version made for your child’s age, picked automatically.'
    ],
    learnAr: [
      'أول الزاد: أول حاجات لازم كل مسلم يعرفها.',
      'السيرة: حياة النبي ﷺ وأخلاقه.',
      'تعليم وسطي معتدل، على منهج أهل السنة والجماعة.',
      'نسخة معمولة لسن ابنك، بتتحدد لوحدها.'
    ],
    faqEn: [
      { q: 'Can I sit in on the lessons?', a: 'Yes. Parents can sit in on any lesson, and the teacher hosts every Zoom lesson with a waiting room.' },
      { q: 'Can adults take it too?', a: 'Yes. The Adults version is for learners aged 18 and over.' },
      { q: 'How much does it cost?', a: 'From $9 an hour, charged by length. The first lesson is a free 30-minute trial.' }
    ],
    faqAr: [
      { q: 'أقدر أحضر الحصة مع ابني؟', a: 'أيوه. ولي الأمر يقدر يحضر أي حصة، والمعلم هو مضيف كل حصة Zoom مع غرفة انتظار.' },
      { q: 'ينفع للكبار؟', a: 'أيوه. نسخة الكبار للي عندهم ١٨ سنة أو أكتر.' },
      { q: 'السعر كام؟', a: 'من ٩ دولار للساعة، على قد مدة الحصة. وأول حصة تجريبية مجانية ٣٠ دقيقة.' }
    ],
    related: ['online-quran-classes-for-kids', 'learn-arabic-online', 'online-quran-memorization']
  },
  {
    slug: 'learn-arabic-online',
    serviceIds: ['modern-standard-arabic'],
    rateUsd: 13,
    titleEn: 'Learn Arabic Online (Fusha), 1-on-1 for Kids & Adults | Watazawwado',
    titleAr: 'اتعلم العربية الفصحى أونلاين، حصص فردية | وتزودوا',
    descEn: 'Learn Modern Standard Arabic (Fusha) in one-on-one Zoom lessons, from the alphabet to advanced, with conversation at every level. Kids and adults. Free trial lesson.',
    descAr: 'اتعلم العربية الفصحى في حصص فردية على Zoom، من الحروف للمستوى المتقدم، ومحادثة في كل مستوى. للأطفال والكبار. أول حصة تجريبية مجاناً.',
    h1En: 'Learn Arabic online',
    h1Ar: 'اتعلم العربية الفصحى أونلاين',
    introEn: [
      'Fusha is the Arabic of the Quran, of books and of the news, and it is understood across the Arab world. We teach it as a living language: your child reads it, writes it and speaks it from the first level.',
      'There is a version for children and one for learners aged 12 and over.'
    ],
    introAr: [
      'الفصحى هي لغة القرآن والكتب والأخبار، وبيفهمها العالم العربي كله. وإحنا بنعلّمها كلغة حية: ابنك بيقراها ويكتبها ويتكلمها من أول مستوى.',
      'فيه نسخة للأطفال ونسخة للي عندهم ١٢ سنة أو أكتر.'
    ],
    learnEn: [
      'Foundations: the alphabet, reading and writing, from zero.',
      'Beginner: words, sentences and first conversations.',
      'Intermediate: understanding and speaking with more confidence.',
      'Advanced: grammar, texts and style, for fluent learners.'
    ],
    learnAr: [
      'التأسيس: الحروف والقراءة والكتابة، من الصفر.',
      'مبتدئ: كلمات وجمل وأول محادثات.',
      'متوسط: فهم وكلام بثقة أكتر.',
      'متقدم: النحو والنصوص والأسلوب، للمتمكنين.'
    ],
    faqEn: [
      { q: 'Fusha or a dialect: which should my child learn first?', a: 'It depends on your goal. We wrote an article about it, and your teacher can advise in the free trial.' },
      { q: 'Does it help with the Quran?', a: 'Yes. Fusha is the language of the Quran, so understanding grows as the Arabic grows.' },
      { q: 'How much does it cost?', a: 'Arabic lessons are from $13 an hour: $6.50 for 30 minutes. The first lesson is a free 30-minute trial.' }
    ],
    faqAr: [
      { q: 'الفصحى ولا العامية: ابني يتعلم أنهي الأول؟', a: 'على حسب هدفكم. كتبنا مقال عن الموضوع ده، ومعلمك يقدر ينصحك في الحصة التجريبية.' },
      { q: 'بتساعد في فهم القرآن؟', a: 'أيوه. الفصحى لغة القرآن، فكل ما العربي يكبر الفهم بيكبر.' },
      { q: 'السعر كام؟', a: 'حصص العربي من ١٣ دولار للساعة: ٦.٥ دولار لـ ٣٠ دقيقة. وأول حصة تجريبية مجانية ٣٠ دقيقة.' }
    ],
    related: ['learn-egyptian-arabic-online', 'islamic-classes-for-kids', 'online-quran-classes-for-kids']
  },
  {
    slug: 'learn-egyptian-arabic-online',
    serviceIds: ['egyptian-arabic'],
    rateUsd: 13,
    titleEn: 'Learn Egyptian Arabic Online, 1-on-1 Lessons | Watazawwado',
    titleAr: 'اتعلم اللهجة المصرية أونلاين، حصص فردية | وتزودوا',
    descEn: 'Speak Egyptian Arabic with confidence: one-on-one Zoom lessons that start with the sounds, with Franco and Arabic script side by side. Free trial lesson.',
    descAr: 'اتكلم مصري بثقة: حصص فردية على Zoom بتبدأ بالأصوات، والفرانكو والحروف العربي جنب بعض. أول حصة تجريبية مجاناً.',
    h1En: 'Learn Egyptian Arabic online',
    h1Ar: 'اتعلم اللهجة المصرية أونلاين',
    introEn: [
      'Egyptian is the Arabic most people understand, from films and songs to family calls. Our lessons start with the sounds of the dialect, then move into real everyday conversation.',
      'You see each word in Franco (Latin letters) and in Arabic script together, so you can start speaking before you read fluently.'
    ],
    introAr: [
      'المصري هو العربي اللي أغلب الناس بتفهمه، من الأفلام والأغاني لحد مكالمات العيلة. حصصنا بتبدأ بأصوات اللهجة، وبعدين محادثة يومية حقيقية.',
      'كل كلمة بتشوفها بالفرانكو وبالحروف العربي مع بعض، فتقدر تبدأ تتكلم قبل ما تقرا بطلاقة.'
    ],
    learnEn: [
      'Sounds: the sounds of the dialect and the first everyday words.',
      'Beginner: simple everyday conversations.',
      'Intermediate: talking about most things, with some hesitation.',
      'Advanced: idioms, humour and fast speech.'
    ],
    learnAr: [
      'الأصوات: أصوات اللهجة وأول كلمات الحياة اليومية.',
      'مبتدئ: محادثات يومية بسيطة.',
      'متوسط: تتكلم في أغلب الحاجات مع شوية تردد.',
      'متقدم: تعبيرات وهزار وكلام سريع.'
    ],
    faqEn: [
      { q: 'Is it for children too?', a: 'Yes. Egyptian Arabic has one design for all ages, and children learn in a family account.' },
      { q: 'My family is Egyptian but my kids only speak English. Can this help?', a: 'Yes. Many families want their children to talk with grandparents and cousins; everyday conversation is the focus.' },
      { q: 'How much does it cost?', a: 'From $13 an hour: $6.50 for 30 minutes. The first lesson is a free 30-minute trial.' }
    ],
    faqAr: [
      { q: 'ينفع للأطفال؟', a: 'أيوه. اللهجة المصرية ليها تصميم واحد لكل الأعمار، والأطفال بيتعلّموا في حساب العيلة.' },
      { q: 'إحنا مصريين بس ولادنا بيتكلموا إنجليزي بس. ده هيفيد؟', a: 'أيوه. عائلات كتير عايزة ولادها تتكلم مع الجد والجدة وولاد العم، والمحادثة اليومية هي الأساس.' },
      { q: 'السعر كام؟', a: 'من ١٣ دولار للساعة: ٦.٥ دولار لـ ٣٠ دقيقة. وأول حصة تجريبية مجانية ٣٠ دقيقة.' }
    ],
    related: ['learn-arabic-online', 'online-english-classes', 'islamic-classes-for-kids']
  },
  {
    slug: 'online-english-classes',
    serviceIds: ['english'],
    rateUsd: 13,
    titleEn: 'Online English Classes, 1-on-1 for Kids & Adults | Watazawwado',
    titleAr: 'حصص إنجليزي أونلاين، فردية للأطفال والكبار | وتزودوا',
    descEn: 'One-on-one English lessons on Zoom: phonics and first reading for kids, CEFR A1 to C1 for learners aged 12 and over. Free trial lesson.',
    descAr: 'حصص إنجليزي فردية على Zoom: الأصوات وأول قراءة للأطفال، ومستويات A1 لحد C1 للي عندهم ١٢ سنة أو أكتر. أول حصة تجريبية مجاناً.',
    h1En: 'Online English classes',
    h1Ar: 'حصص إنجليزي أونلاين',
    introEn: [
      'English with a teacher who understands where you are coming from. Children start with phonics and their first reading; older learners follow the CEFR levels from A1 to C1.',
      'Lessons are one-on-one, so the time goes on what you need: speaking, reading, writing or an exam.'
    ],
    introAr: [
      'إنجليزي مع معلم فاهم إنت جاي منين. الأطفال بيبدأوا بالأصوات (phonics) وأول قراءة، والأكبر بيمشوا على مستويات CEFR من A1 لحد C1.',
      'الحصة فردية، فالوقت كله بيروح في اللي إنت محتاجه: كلام، أو قراءة، أو كتابة، أو امتحان.'
    ],
    learnEn: [
      'A1 Starter: phonics and first reading for kids, the basics for others.',
      'A2: simple sentences about daily life.',
      'B1 to B2: conversations, reading and writing.',
      'C1: fluent and precise English, for exams and work.'
    ],
    learnAr: [
      'A1 بداية: الأصوات وأول قراءة للأطفال، والأساسيات للباقي.',
      'A2: جمل بسيطة عن الحياة اليومية.',
      'B1 لحد B2: محادثات وقراءة وكتابة.',
      'C1: إنجليزي بطلاقة ودقة، للامتحانات والشغل.'
    ],
    faqEn: [
      { q: 'Who are these lessons for?', a: 'Children in a family account (6 to 17) and adults (18+), from first words to advanced English.' },
      { q: 'Can the teacher explain in Arabic?', a: 'Yes, when it helps. Tell your teacher in the free trial how you like to learn.' },
      { q: 'How much does it cost?', a: 'From $13 an hour: $6.50 for 30 minutes. The first lesson is a free 30-minute trial.' }
    ],
    faqAr: [
      { q: 'الحصص دي لمين؟', a: 'للأطفال في حساب العيلة (٦ لـ ١٧) وللكبار (١٨ وأكتر)، من أول كلمات لحد الإنجليزي المتقدم.' },
      { q: 'المعلم ممكن يشرح بالعربي؟', a: 'أيوه، لما ده يساعد. قول لمعلمك في الحصة التجريبية إنت بتحب تتعلم إزاي.' },
      { q: 'السعر كام؟', a: 'من ١٣ دولار للساعة: ٦.٥ دولار لـ ٣٠ دقيقة. وأول حصة تجريبية مجانية ٣٠ دقيقة.' }
    ],
    related: ['learn-arabic-online', 'learn-egyptian-arabic-online', 'online-quran-classes-for-kids']
  }
];

export const findSubjectPage = (slug: string) => SUBJECT_PAGES.find((p) => p.slug === slug) || null;
