/**
 * NX-11: articles for Muslim families in the West, in English and Arabic. Each language is written on its own, not
 * translated line by line. Rules: docs/marketing/RULES.md (no prices in the text, no invented claims, no rulings,
 * no Quran or hadith quoted unless verified with its source). Each article is a public page with its own address,
 * hreflang pair and BlogPosting schema (src/data/seo.ts, scripts/prerender-seo.ts).
 */
export type Block = { h: string } | { p: string } | { list: string[] };

export interface Article {
  slug: string;
  /** ISO date first published. */
  date: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  bodyEn: Block[];
  bodyAr: Block[];
}

export const ARTICLES: Article[] = [
  {
    slug: 'quran-for-kids-in-the-west',
    date: '2026-11-01',
    titleEn: 'Keeping your child close to the Quran when you live in the West',
    titleAr: 'كيف تُبقي ابنك قريبًا من القرآن وأنتم تعيشون في الغرب',
    descEn: 'Practical habits for busy Muslim families abroad: short daily practice, the right kind of lesson, and how to stay involved as a parent.',
    descAr: 'عادات عملية لأسرة مسلمة مشغولة في الغرب: وِرد يومي قصير، ونوع الحصة المناسب، وكيف تبقى بجانب ابنك في رحلته مع القرآن.',
    bodyEn: [
      { p: 'Weekend school, homework, sports, a long commute. Many parents we talk to say the same thing: they want their children to love the Quran, and the week keeps getting in the way. There is no secret method. What works is small, steady and close to home.' },
      { h: 'Ten minutes a day beats two hours on Sunday' },
      { p: 'A child who reads or revises a little every day keeps what they learned. A child who meets the Quran once a week spends half of each class recovering what slipped. Pick a fixed moment that already exists in your day, such as after Fajr, after school, or before bed, and keep it short enough that nobody dreads it.' },
      { h: 'One teacher, one child' },
      { p: 'In a group, the confident reader gets the attention and the shy one hides. In a one-on-one lesson the teacher hears every letter your child reads, corrects it on the spot, and adjusts the pace to that child. For Tajweed and memorization this matters a great deal, because a mistake repeated for months is hard to undo.' },
      { h: 'Make the meaning part of it' },
      { p: 'Children who live in English often read the Arabic without knowing what it says. A few words of meaning, a short story behind a surah, or one question ("what do you think this ayah asks us to do?") turns reading into something they own. It also gives you something to talk about at dinner.' },
      { h: 'Stay in the room, at least at first' },
      { p: 'Sit in on a lesson now and then. You will see how your child reads, what the teacher asks of them, and what to practise during the week. Ask the teacher for one clear task between lessons, and ask your child to read it to you. Your attention tells them it matters.' },
      { h: 'Small wins, said out loud' },
      { list: [
        'Celebrate finishing a surah, not only finishing a juz.',
        'Let them recite what they learned in the family prayer.',
        'Keep a simple chart on the fridge for days practised.',
        'When they are tired, shorten the session rather than skipping it.'
      ] },
      { h: 'When to look for help' },
      { p: 'If your own Arabic is limited, or the week simply has no room for you to teach, a regular teacher takes that weight off you. At Watazawwado every learner has their own teacher in live one-on-one lessons on Zoom, with male and female teachers, and the first lesson is a free trial so you can see how it feels for your child before deciding anything.' }
    ],
    bodyAr: [
      { p: 'المدرسة، والواجبات، والتمارين، والمشاوير. كثير من الأهالي الذين نحدّثهم يقولون الكلام نفسه: نتمنى أن يحب أولادنا القرآن، لكن الأسبوع ينتهي قبل أن نلحق. لا توجد طريقة سحرية. الذي ينفع شيء صغير، منتظم، وقريب من البيت.' },
      { h: 'عشر دقائق كل يوم خير من ساعتين يوم الأحد' },
      { p: 'الطفل الذي يقرأ أو يراجع قليلًا كل يوم يحافظ على ما تعلّمه. أما الذي يلقى القرآن مرة في الأسبوع فيذهب نصف حصته في استرجاع ما نسيه. اختر وقتًا موجودًا أصلًا في يومكم، بعد الفجر أو بعد المدرسة أو قبل النوم، واجعله قصيرًا بحيث لا يملّ منه أحد.' },
      { h: 'معلم واحد لطفل واحد' },
      { p: 'في المجموعة، يأخذ الطفل الجريء الاهتمام ويختبئ الخجول. أما في الحصة الفردية فيسمع المعلم كل حرف يقرؤه ابنك، ويصحّحه في وقته، ويسير على قدر سرعته هو. وهذا مهم جدًا في التجويد والحفظ، لأن الخطأ الذي يتكرر شهورًا يصعب تصحيحه بعد ذلك.' },
      { h: 'اجعل المعنى جزءًا من الحكاية' },
      { p: 'كثير من أولادنا الذين يعيشون بالإنجليزية يقرؤون العربية دون أن يفهموا. كلمتان عن المعنى، أو قصة قصيرة خلف السورة، أو سؤال واحد مثل «ما الذي تطلبه منا هذه الآية برأيك؟»، تجعل القراءة شيئًا يخصّه هو. وتمنحكم أيضًا حديثًا على العشاء.' },
      { h: 'كن حاضرًا، على الأقل في البداية' },
      { p: 'احضر حصة من حين لآخر. سترى كيف يقرأ ابنك، وما الذي طلبه منه المعلم، وما الذي يراجعه طوال الأسبوع. اطلب من المعلم مهمة واحدة واضحة بين الحصتين، واطلب من ابنك أن يُسمعك إياها. اهتمامك يخبره أن هذا الأمر مهم.' },
      { h: 'إنجازات صغيرة، نحتفل بها بصوت عالٍ' },
      { list: [
        'احتفلوا بختم سورة، لا بختم جزء فقط.',
        'دعه يقرأ ما حفظه في صلاة الأسرة.',
        'جدول بسيط على الثلاجة للأيام التي راجع فيها.',
        'حين يكون متعبًا، قصّروا الوقت بدل أن تلغوه.'
      ] },
      { h: 'متى تبحث عن مساعدة' },
      { p: 'إن كانت عربيتك أنت محدودة، أو لم يترك لك الأسبوع وقتًا للتعليم، يحمل المعلم الثابت هذا العبء عنك. في وتزودوا لكل طالب معلمه في حصص فردية مباشرة على Zoom، ولدينا معلمون ومعلمات، والحصة التجريبية الأولى مجانية لترى هل ابنك مرتاح قبل أن تقرر أي شيء.' }
    ]
  },
  {
    slug: 'fusha-or-dialect-for-kids',
    date: '2026-11-01',
    titleEn: 'Fusha or a spoken dialect: which Arabic should my child learn first?',
    titleAr: 'الفصحى أم العامية: بأي عربية يبدأ ابني؟',
    descEn: 'An honest look at Modern Standard Arabic and spoken dialects for children growing up abroad, and how to choose based on your family’s goal.',
    descAr: 'مقارنة صريحة بين الفصحى والعامية لطفل يكبر خارج البلاد العربية، وكيف تختار بحسب هدف أسرتكم.',
    bodyEn: [
      { p: 'Parents often ask us this before the first lesson. The short answer: it depends on what you want Arabic to do for your child. Both are real Arabic, and they serve different needs.' },
      { h: 'What Fusha gives a child' },
      { p: 'Fusha (Modern Standard Arabic) is the Arabic of books, news, school textbooks and formal speech across the Arab world. It sits closest to the language of the Quran, so a child who learns it finds Quran reading and Islamic books easier to follow over time. It is also the same everywhere, which helps if your family comes from different countries.' },
      { h: 'What a dialect gives a child' },
      { p: 'Nobody chats in Fusha at the dinner table. If grandparents speak Egyptian, Levantine or Gulf Arabic, a child who learns that dialect can talk with them, joke with cousins and feel at home on a visit. For a child whose main need is family connection, a dialect brings results they can feel quickly.' },
      { h: 'Questions that settle it' },
      { list: [
        'Is the main goal understanding the Quran and Islamic texts? Start with Fusha.',
        'Is the main goal talking with relatives? Start with the family’s dialect.',
        'Does the child already speak some dialect at home? Fusha builds on it well.',
        'Is the family mixed, or with no strong dialect at home? Fusha is the common ground.'
      ] },
      { h: 'Can a child learn both?' },
      { p: 'Yes, and many do. The two share most of their vocabulary and grammar, so time spent on one is not wasted on the other. What confuses children is switching without a plan. Pick one as the main track for a season, then add the other once reading and basic speaking feel comfortable.' },
      { h: 'How we teach it' },
      { p: 'At Watazawwado children can learn Fusha or Egyptian Arabic in one-on-one lessons, and the teacher shapes them around the child’s age and level. If you are unsure which to start with, tell the teacher in the free trial lesson what you hope for, and they will suggest a path.' }
    ],
    bodyAr: [
      { p: 'يسأل كثير من الأهالي هذا السؤال قبل الحصة الأولى. الجواب المختصر: بحسب ما تريد أن تقدّمه العربية لابنك. كلاهما عربية حقيقية، ولكلٍّ فائدته.' },
      { h: 'ماذا تعطي الفصحى للطفل' },
      { p: 'الفصحى لغة الكتب والأخبار والمدارس والكلام الرسمي في العالم العربي كله. وهي الأقرب إلى لغة القرآن، فالطفل الذي يتعلّمها يجد قراءة القرآن والكتب الإسلامية أسهل مع الوقت. وهي واحدة في كل البلاد، وهذا يفرق إن كانت الأسرة من بلاد مختلفة.' },
      { h: 'ماذا تعطي العامية للطفل' },
      { p: 'لا أحد يتحدث الفصحى على مائدة الطعام. إن كان الجد والجدة يتحدثان المصرية أو الشامية أو الخليجية، فالطفل الذي يتعلّم تلك اللهجة يستطيع أن يكلّمهما ويمازح أبناء عمه ويشعر أنه في بيته حين يسافر. وإن كانت صلة الأسرة أهم ما عندكم، فاللهجة تأتي بنتيجة يشعر بها الطفل سريعًا.' },
      { h: 'أسئلة تحسم القرار' },
      { list: [
        'الهدف الأول فهم القرآن والكتب الإسلامية؟ ابدأ بالفصحى.',
        'الهدف الأول الحديث مع الأقارب؟ ابدأ بلهجة الأسرة.',
        'الطفل يتحدث قليلًا من العامية في البيت؟ الفصحى تُبنى عليها جيدًا.',
        'الأسرة مختلطة أو لا توجد لهجة واضحة في البيت؟ الفصحى أرض مشتركة.'
      ] },
      { h: 'هل يمكن أن يتعلّم الاثنتين؟' },
      { p: 'نعم، وكثيرون يفعلون ذلك. تشترك الاثنتان في أغلب الكلمات والقواعد، فالوقت الذي يُصرف على إحداهما لا يضيع على الأخرى. الذي يربك الطفل هو التنقّل بلا خطة. اختاروا واحدة تكون الأساس لفترة، وحين تصبح القراءة والكلام البسيط مريحين أضيفوا الأخرى.' },
      { h: 'كيف نعلّمهما' },
      { p: 'في وتزودوا يستطيع الأطفال تعلّم الفصحى أو المصرية في حصص فردية، ويضبط المعلم الحصة على عمر الطفل ومستواه. وإن كنت ما زلت محتارًا بأيهما تبدأ، فأخبر المعلم في الحصة التجريبية المجانية بما تريده، وهو يقترح عليك الطريق.' }
    ]
  },
  {
    slug: 'choosing-an-online-quran-teacher',
    date: '2026-11-01',
    titleEn: 'What to look for in an online Quran teacher for your child',
    titleAr: 'كيف تختار معلم قرآن أونلاين لابنك',
    descEn: 'A parent’s checklist for online Quran lessons: what to watch for in the trial lesson, safety basics, and questions worth asking before you commit.',
    descAr: 'قائمة لوليّ الأمر قبل أن يبدأ حصص القرآن أونلاين: ما الذي تلاحظه في الحصة التجريبية، وأساسيات الأمان، وأسئلة تطرحها قبل أن تلتزم.',
    bodyEn: [
      { p: 'Searching for an online Quran teacher brings up hundreds of options, and they all look similar from the outside. The difference shows up in the lesson itself. Here is what we would look for if we were choosing for our own children.' },
      { h: 'Watch the trial lesson closely' },
      { list: [
        'Does the teacher listen more than they talk? Your child should be reading for most of the lesson.',
        'Are mistakes corrected gently and right away, with the reason explained at the child’s level?',
        'Does the teacher check what your child already knows before starting?',
        'Does your child leave the lesson calm, or even a little proud?'
      ] },
      { h: 'Ask about the teacher, plainly' },
      { p: 'Ask where the teacher studied and what they teach. A good academy answers clearly and does not inflate it. Also ask who will teach your child each week. A teacher who changes every month means starting over every month.' },
      { h: 'Safety is not a detail' },
      { list: [
        'You should be able to sit in on any lesson.',
        'The teacher, not the child, should open and control the video room.',
        'Messages between teacher and child should stay on the academy’s platform, never on a private account.',
        'Lessons should not be recorded without your permission.'
      ] },
      { h: 'A male or female teacher' },
      { p: 'Many families prefer a female teacher for daughters, or for younger children. It is a fair request, and an academy should make it easy rather than treat it as a favour.' },
      { h: 'Look for a plan between lessons' },
      { p: 'Progress happens in the days between lessons. Ask what your child should practise during the week, and how you will hear about their progress. A short note after each lesson tells you more than a monthly report.' },
      { h: 'Try before you decide' },
      { p: 'At Watazawwado the first lesson is a free trial, so you can see the teacher with your child before paying for anything. We offer male and female teachers, and our child safety page explains how every lesson with a child works.' }
    ],
    bodyAr: [
      { p: 'حين تبحث عن معلم قرآن أونلاين ستجد خيارات كثيرة جدًا، وكلها تبدو متشابهة من الخارج. الفرق يظهر في الحصة نفسها. هذا ما كنا سنبحث عنه لو كنا نختار لأولادنا نحن.' },
      { h: 'ركّز في الحصة التجريبية' },
      { list: [
        'هل يستمع المعلم أكثر مما يتكلم؟ المفترض أن ابنك هو الذي يقرأ معظم الحصة.',
        'هل يُصحَّح الخطأ بهدوء وفي وقته، ويُشرح السبب بكلام على قدر عمر الطفل؟',
        'هل يعرف المعلم أين وصل ابنك قبل أن يبدأ؟',
        'هل يخرج ابنك من الحصة مرتاحًا، أو فخورًا بنفسه قليلًا؟'
      ] },
      { h: 'اسأل عن المعلم بوضوح' },
      { p: 'اسأل المعلم أين درس وماذا يعلّم. الأكاديمية الجيدة تجيب بوضوح ودون مبالغة. واسأل من سيعلّم ابنك كل أسبوع، لأن المعلم الذي يتغيّر كل شهر يعني أنكم تبدؤون من جديد كل شهر.' },
      { h: 'الأمان ليس تفصيلًا' },
      { list: [
        'من حقك أن تحضر أي حصة.',
        'المعلم هو من يفتح غرفة الفيديو ويتحكم فيها، لا الطفل.',
        'تبقى الرسائل بين المعلم والطفل على منصة الأكاديمية، ولا تنتقل إلى أي حساب خاص.',
        'لا تُسجَّل الحصص دون إذنك.'
      ] },
      { h: 'معلم أم معلمة' },
      { p: 'كثير من الأسر تفضّل معلمة للبنات أو للأطفال الصغار. هذا طلب طبيعي، والمفترض أن تسهّله الأكاديمية لا أن تعدّه خدمة إضافية.' },
      { h: 'ابحث عن خطة بين الحصص' },
      { p: 'التقدّم يحدث في الأيام التي بين الحصص. اسأل ماذا يراجع ابنك طوال الأسبوع، وكيف ستعرف مستواه. ملاحظة قصيرة بعد كل حصة تخبرك أكثر من تقرير كل شهر.' },
      { h: 'جرّب قبل أن تقرر' },
      { p: 'في وتزودوا الحصة التجريبية الأولى مجانية، لترى المعلم مع ابنك قبل أن تدفع أي شيء. لدينا معلمون ومعلمات، وصفحة أمان الأطفال تشرح كيف تسير كل حصة مع طفل.' }
    ]
  }
];

export const findArticle = (slug: string) => ARTICLES.find((a) => a.slug === slug) || null;
