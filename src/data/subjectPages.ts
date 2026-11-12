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
  rateUsd: 10 | 13;
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
    rateUsd: 10,
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
      'لابنك معلم خاص به، مباشرةً على Zoom، في حصة فردية. يسمع المعلم كل حرف ويصحّحه في وقته، ويسير على قدر سرعة ابنك، سواء كان يبدأ بالحروف أو يقرأ من المصحف.',
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
      'التجويد على ٣ مستويات، يُطبَّق أثناء القراءة، لا قواعد محفوظة فقط.',
      'حفظ ومراجعة على قد سرعته، من السور القصيرة.',
      'اختبار تحديد مستوى قصير بعد الحصة التجريبية، لنبدأ من المستوى الصحيح.'
    ],
    faqEn: [
      { q: 'From what age can my child start?', a: 'Children in a family account are 6 to 17. A parent aged 18 or over opens the account and manages each child.' },
      { q: 'Can my daughter have a female teacher?', a: 'Yes. We have male and female teachers, and you choose your child’s teacher when you sign up.' },
      { q: 'How much does it cost?', a: 'Quran lessons are from $10 an hour, so a 30-minute lesson is $5. The first lesson is a free 30-minute trial.' }
    ],
    faqAr: [
      { q: 'من أي عمر يمكن لابني أن يبدأ؟', a: 'الأطفال في حساب الأسرة من ٦ إلى ١٧ سنة. ويفتح وليّ الأمر (١٨ سنة أو أكثر) الحساب ويتابع كل طفل.' },
      { q: 'هل يمكن أن تدرس ابنتي مع معلمة؟', a: 'نعم. لدينا معلمون ومعلمات، وتختار معلم ابنك أو ابنتك عند التسجيل.' },
      { q: 'السعر كام؟', a: 'حصص القرآن من ١٠ دولار للساعة، يعني حصة ٣٠ دقيقة بـ ٥ دولار. وأول حصة تجريبية مجانية ٣٠ دقيقة.' }
    ],
    related: ['online-tajweed-classes', 'online-quran-memorization', 'islamic-classes-for-kids']
  },
  {
    slug: 'online-quran-classes-for-adults',
    serviceIds: ['quran-reading', 'tajweed', 'quran-memorization'],
    rateUsd: 10,
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
      'كثير من الكبار الذين نعلّمهم لم تُتح لهم الفرصة في الصغر، ويخجلون من البدء الآن. الحصة الفردية خاصة: أنت ومعلمك فقط، على قدر سرعتك، ولا يسمعك أحد غيره.',
      'تستطيع الأخوات التعلّم مع معلمة. وتختار معلمك عند التسجيل.'
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
      'الحفظ والمراجعة: تبدأ، أو تزيد، أو تثبّت ما تحفظه.',
      'الحصة ٣٠ أو ٤٥ أو ٦٠ دقيقة، في مواعيد تختارها من مواعيد معلمك.'
    ],
    faqEn: [
      { q: 'I am a complete beginner. Is that fine?', a: 'Yes. Quran Reading starts with Foundations: the letters, their sounds and the qaida, from zero.' },
      { q: 'Are lessons recorded?', a: 'No. Lessons are not recorded, and the teacher hosts every Zoom lesson with a waiting room.' },
      { q: 'How much does it cost?', a: 'From $10 an hour, charged by length: $5 for 30 minutes. The first lesson is a free 30-minute trial.' }
    ],
    faqAr: [
      { q: 'أنا مبتدئ تمامًا. هل يناسبني؟', a: 'نعم. تبدأ قراءة القرآن بالتأسيس: الحروف وأصواتها والقاعدة، من الصفر.' },
      { q: 'هل تُسجَّل الحصص؟', a: 'لا. الحصص لا تُسجَّل، والمعلم هو مضيف كل حصة Zoom مع غرفة انتظار.' },
      { q: 'السعر كام؟', a: 'من ١٠ دولار للساعة، والسعر على قد مدة الحصة: ٥ دولار لـ ٣٠ دقيقة. وأول حصة تجريبية مجانية ٣٠ دقيقة.' }
    ],
    related: ['online-tajweed-classes', 'online-quran-memorization', 'learn-arabic-online']
  },
  {
    slug: 'online-tajweed-classes',
    serviceIds: ['tajweed'],
    rateUsd: 10,
    titleEn: 'Online Tajweed Classes, 1-on-1 for Kids & Adults | Watazawwado',
    titleAr: 'حصص تجويد أونلاين، فردية للأطفال والكبار | وتزودوا',
    descEn: 'Learn Tajweed online in one-on-one Zoom lessons: three levels from the essential rules to the advanced ones, applied as you recite. Free trial lesson.',
    descAr: 'تعلّم التجويد أونلاين في حصص فردية على Zoom: ٣ مستويات من الأحكام الأساسية إلى المتقدمة، تطبّقها وأنت تقرأ. الحصة التجريبية الأولى مجانية.',
    h1En: 'Online Tajweed classes',
    h1Ar: 'حصص تجويد أونلاين',
    introEn: [
      'Tajweed is learned with the ear. Your teacher listens to you recite, stops at the letter that needs work, and shows you how it should sound until it becomes natural.',
      'Because the lesson is one-on-one, nothing slips past. A mistake repeated for months is hard to undo; caught early, it is a two-minute fix.'
    ],
    introAr: [
      'التجويد يُتعلَّم بالأذن. يسمعك معلمك وأنت تقرأ، ويتوقف عند الحرف الذي يحتاج إلى عمل، ويريك نطقه الصحيح حتى يصبح طبيعيًا.',
      'ولأن الحصة فردية، لا يفوت شيء. الخطأ الذي يتكرر شهورًا يصعب تصحيحه، أما إن اكتُشف مبكرًا فيُصحَّح في دقيقتين.'
    ],
    learnEn: [
      'Level 1: the essential rules, applied while you recite.',
      'Level 2: where each letter comes from (makharij) and its qualities (sifat).',
      'Level 3: the advanced rules, until the whole picture is complete.',
      'A placement test after your free trial, so you start at the right level.'
    ],
    learnAr: [
      'المستوى الأول: الأحكام الأساسية، وتطبيقها أثناء القراءة.',
      'المستوى الثاني: مخارج الحروف وصفاتها.',
      'المستوى الثالث: الأحكام المتقدمة، لحد ما الصورة تكمل.',
      'اختبار تحديد مستوى بعد الحصة التجريبية، لتبدأ من المستوى الصحيح.'
    ],
    faqEn: [
      { q: 'Do I need to read Arabic first?', a: 'Tajweed builds on reading. If you cannot read yet, start with Quran Reading; your teacher will tell you in the trial.' },
      { q: 'Is it for children too?', a: 'Yes. Children aged 6 to 17 learn in a family account, adults in their own account.' },
      { q: 'How much does it cost?', a: 'From $10 an hour: $5 for 30 minutes, $7.50 for 45, $10 for 60. The first lesson is a free trial.' }
    ],
    faqAr: [
      { q: 'هل يجب أن أعرف قراءة العربية أولًا؟', a: 'التجويد مبني على القراءة. إن كنت لا تقرأ بعد، فابدأ بقراءة القرآن، وسيخبرك معلمك في الحصة التجريبية.' },
      { q: 'هل يناسب الأطفال أيضًا؟', a: 'نعم. يتعلّم الأطفال من ٦ إلى ١٧ سنة في حساب الأسرة، والكبار في حساباتهم.' },
      { q: 'السعر كام؟', a: 'من ١٠ دولار للساعة: ٥ لـ ٣٠ دقيقة، و٧.٥ لـ ٤٥، و١٠ لـ ٦٠. وأول حصة تجريبية مجانية.' }
    ],
    related: ['online-quran-memorization', 'online-quran-classes-for-kids', 'online-quran-classes-for-adults']
  },
  {
    slug: 'online-quran-memorization',
    serviceIds: ['quran-memorization'],
    rateUsd: 10,
    titleEn: 'Online Hifz Classes: Quran Memorization & Revision | Watazawwado',
    titleAr: 'حصص حفظ القرآن ومراجعته أونلاين | وتزودوا',
    descEn: 'One-on-one online Hifz lessons for kids and adults: start memorizing, add more, or keep what you know firm with steady revision. Free trial lesson.',
    descAr: 'حصص حفظ فردية أونلاين للأطفال والكبار: ابدأ الحفظ، أو زِد، أو ثبّت ما تحفظه بمراجعة منتظمة. الحصة التجريبية الأولى مجانية.',
    h1En: 'Online Quran memorization (Hifz)',
    h1Ar: 'حفظ القرآن ومراجعته أونلاين',
    introEn: [
      'Memorizing is the easy half. Keeping it is the work. Our Hifz lessons put new memorization and revision together, so what you learn this month is still there next year.',
      'You tell us your goal when you sign up: starting out, adding more, or keeping what you have firm. Your teacher plans around it.'
    ],
    introAr: [
      'الحفظ هو النصف السهل، والتثبيت هو العمل الحقيقي. تجمع حصص الحفظ عندنا بين الحفظ الجديد والمراجعة، ليبقى ما تحفظه هذا الشهر معك في السنة القادمة.',
      'تخبرنا بهدفك عند التسجيل: أبدأ، أو أزيد، أو أثبّت ما أحفظه. ويخطط معلمك على أساسه.'
    ],
    learnEn: [
      'Starting out: new memorization from the short surahs.',
      'Adding more: you know some juz and want to go further.',
      'Keeping it firm: mostly revision, to hold on to what you have.',
      'A clear task between lessons, so the week counts too.'
    ],
    learnAr: [
      'أبدأ: حفظ جديد من السور القصيرة.',
      'بزوّد: حافظ كام جزء وعايز تكمّل.',
      'أثبّت: مراجعة في الأساس، لتحافظ على ما حفظته.',
      'مهمة واضحة بين كل حصة والتي تليها، ليكون للأسبوع أثر أيضًا.'
    ],
    faqEn: [
      { q: 'How fast will my child memorize?', a: 'It depends on the child and on daily practice. Steady, short revision every day matters more than big amounts once a week.' },
      { q: 'Can we do revision only?', a: 'Yes. Choose “keeping it firm” and the lessons focus on revision.' },
      { q: 'How much does it cost?', a: 'From $10 an hour, charged by length. The first lesson is a free 30-minute trial.' }
    ],
    faqAr: [
      { q: 'في كم من الوقت سيحفظ ابني؟', a: 'يختلف ذلك من طفل لآخر وبحسب المراجعة اليومية. مراجعة قصيرة منتظمة كل يوم أهم من كمية كبيرة مرة في الأسبوع.' },
      { q: 'ينفع مراجعة بس؟', a: 'أيوه. اختار «بثبّت» والحصص هتركّز على المراجعة.' },
      { q: 'السعر كام؟', a: 'من ١٠ دولار للساعة، على قد مدة الحصة. وأول حصة تجريبية مجانية ٣٠ دقيقة.' }
    ],
    related: ['online-tajweed-classes', 'online-quran-classes-for-kids', 'online-quran-classes-for-adults']
  },
  {
    slug: 'islamic-classes-for-kids',
    serviceIds: ['zad-essentials', 'seerah'],
    rateUsd: 10,
    titleEn: 'Online Islamic Classes for Kids & Teens: the Zad Path | Watazawwado',
    titleAr: 'حصص دينية أونلاين للأطفال والشباب: مسار الأثر | وتزودوا',
    descEn: 'Our own curriculum of Islamic knowledge, taught 1-on-1 online: Zad Essentials and the Seerah, in Kids (6–11), Teens (12–17) and Adults versions. Free trial lesson.',
    descAr: 'منهجنا الخاص في العلم الشرعي، في حصص فردية أونلاين: أول الزاد والسيرة النبوية، بنسخة للأطفال (٦–١١) والشباب (١٢–١٧) والكبار. الحصة التجريبية الأولى مجانية.',
    h1En: 'Online Islamic classes for kids',
    h1Ar: 'حصص دينية أونلاين للأطفال: مسار الأثر',
    introEn: [
      'The Zad Path is our own curriculum: the first things every Muslim needs, and the life of the Prophet ﷺ, taught so that children understand them and live them.',
      'There is no level to choose. The version follows your child’s age: Kids 6–11, Teens 12–17, Adults 18+. Every lesson leaves time to reflect on what was learned.'
    ],
    introAr: [
      'مسار الأثر هو منهجنا الخاص: أول ما يحتاجه كل مسلم، وسيرة النبي ﷺ، بطريقة تجعل الأطفال يفهمونها ويعيشونها.',
      'لا يوجد مستوى تختاره. النسخة تتبع عمر ابنك: أطفال ٦–١١، وشباب ١٢–١٧، وكبار ١٨ فأكثر. وفي كل حصة وقت للتدبّر فيما تعلّموه.'
    ],
    learnEn: [
      'Zad Essentials: the first things every Muslim needs to know.',
      'Seerah: the life and character of the Prophet ﷺ.',
      'Balanced and moderate teaching, following Ahl al-Sunnah wal-Jama‘ah.',
      'A version made for your child’s age, picked automatically.'
    ],
    learnAr: [
      'أول الزاد: أول ما يجب على كل مسلم أن يعرفه.',
      'السيرة: حياة النبي ﷺ وأخلاقه.',
      'تعليم وسطي معتدل، على منهج أهل السنة والجماعة.',
      'نسخة مصمّمة لعمر ابنك، تُحدَّد تلقائيًا.'
    ],
    faqEn: [
      { q: 'Can I sit in on the lessons?', a: 'Yes. Parents can sit in on any lesson, and the teacher hosts every Zoom lesson with a waiting room.' },
      { q: 'Can adults take it too?', a: 'Yes. The Adults version is for learners aged 18 and over.' },
      { q: 'How much does it cost?', a: 'From $10 an hour, charged by length. The first lesson is a free 30-minute trial.' }
    ],
    faqAr: [
      { q: 'أقدر أحضر الحصة مع ابني؟', a: 'أيوه. ولي الأمر يقدر يحضر أي حصة، والمعلم هو مضيف كل حصة Zoom مع غرفة انتظار.' },
      { q: 'ينفع للكبار؟', a: 'أيوه. نسخة الكبار للي عندهم ١٨ سنة أو أكتر.' },
      { q: 'السعر كام؟', a: 'من ١٠ دولار للساعة، على قد مدة الحصة. وأول حصة تجريبية مجانية ٣٠ دقيقة.' }
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
      'الفصحى لغة القرآن والكتب والأخبار، ويفهمها العالم العربي كله. ونحن نعلّمها لغةً حية: يقرؤها ابنك ويكتبها ويتحدث بها من المستوى الأول.',
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
      { q: 'الفصحى أم العامية: بأيهما يبدأ ابني؟', a: 'بحسب هدفكم. كتبنا مقالًا عن هذا الموضوع، ويستطيع معلمك أن ينصحك في الحصة التجريبية.' },
      { q: 'هل تساعد على فهم القرآن؟', a: 'نعم. الفصحى لغة القرآن، فكلما كبرت عربيتك كبر فهمك.' },
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
    descAr: 'تحدّث المصرية بثقة: حصص فردية على Zoom تبدأ بالأصوات، والفرانكو والحروف العربية جنبًا إلى جنب. الحصة التجريبية الأولى مجانية.',
    h1En: 'Learn Egyptian Arabic online',
    h1Ar: 'اتعلم اللهجة المصرية أونلاين',
    introEn: [
      'Egyptian is the Arabic most people understand, from films and songs to family calls. Our lessons start with the sounds of the dialect, then move into real everyday conversation.',
      'You see each word in Franco (Latin letters) and in Arabic script together, so you can start speaking before you read fluently.'
    ],
    introAr: [
      'المصرية هي العربية التي يفهمها أغلب الناس، من الأفلام والأغاني حتى مكالمات العائلة. تبدأ حصصنا بأصوات اللهجة، ثم محادثة يومية حقيقية.',
      'ترى كل كلمة بالفرانكو وبالحروف العربية معًا، فتستطيع أن تبدأ الكلام قبل أن تقرأ بطلاقة.'
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
      { q: 'هل يناسب الأطفال؟', a: 'نعم. للهجة المصرية تصميم واحد لكل الأعمار، ويتعلّم الأطفال في حساب الأسرة.' },
      { q: 'نحن مصريون لكن أولادنا لا يتكلمون إلا الإنجليزية. هل سيفيدهم؟', a: 'نعم. كثير من العائلات تريد أن يتحدث أولادها مع الجد والجدة وأبناء العم، والمحادثة اليومية هي الأساس.' },
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
      'الإنجليزية مع معلم يفهم من أين أتيت. يبدأ الأطفال بالأصوات (phonics) والقراءة الأولى، ويسير الأكبر على مستويات CEFR من A1 حتى C1.',
      'الحصة فردية، فيذهب الوقت كله فيما تحتاجه: كلام، أو قراءة، أو كتابة، أو امتحان.'
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
      { q: 'لمن هذه الحصص؟', a: 'للأطفال في حساب الأسرة (٦ إلى ١٧) وللكبار (١٨ فأكثر)، من الكلمات الأولى حتى الإنجليزية المتقدمة.' },
      { q: 'هل يمكن أن يشرح المعلم بالعربية؟', a: 'نعم، حين يساعد ذلك. أخبر معلمك في الحصة التجريبية كيف تحب أن تتعلّم.' },
      { q: 'السعر كام؟', a: 'من ١٣ دولار للساعة: ٦.٥ دولار لـ ٣٠ دقيقة. وأول حصة تجريبية مجانية ٣٠ دقيقة.' }
    ],
    related: ['learn-arabic-online', 'learn-egyptian-arabic-online', 'online-quran-classes-for-kids']
  }
];

export const findSubjectPage = (slug: string) => SUBJECT_PAGES.find((p) => p.slug === slug) || null;
