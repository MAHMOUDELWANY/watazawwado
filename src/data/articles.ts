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
    titleAr: 'إزاي تخلّي ابنك قريب من القرآن وإنتم عايشين في الغرب',
    descEn: 'Practical habits for busy Muslim families abroad: short daily practice, the right kind of lesson, and how to stay involved as a parent.',
    descAr: 'عادات عملية لأسرة مسلمة مشغولة برّه: ورد يومي قصير، ونوع الحصة المناسب، وإزاي تفضل جنب ابنك في رحلته مع القرآن.',
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
      { p: 'مدرسة الأسبوع، والواجبات، والتمرين، والمشاوير. أهالي كتير بنكلّمهم بيقولوا نفس الكلام: نفسنا ولادنا يحبّوا القرآن، بس الأسبوع بيخلص من غير ما نلحق. مفيش طريقة سحرية. اللي بينفع حاجة صغيرة، ثابتة، وقريبة من البيت.' },
      { h: 'عشر دقايق كل يوم أحسن من ساعتين يوم الأحد' },
      { p: 'الطفل اللي بيقرا أو بيراجع شوية كل يوم بيحافظ على اللي اتعلّمه. أما اللي بيقابل القرآن مرة في الأسبوع فنص الحصة بيروح في استرجاع اللي نسيه. اختار وقت موجود أصلاً في يومكم، بعد الفجر أو بعد المدرسة أو قبل النوم، وخليه قصير لدرجة إن محدش يزهق منه.' },
      { h: 'معلم واحد لطفل واحد' },
      { p: 'في المجموعة، الطفل الجريء بياخد الاهتمام والخجول بيستخبى. في الحصة الفردية المعلم بيسمع كل حرف ابنك بيقراه، وبيصحّحه في وقتها، وبيمشي على قدّ سرعته هو. وده مهم جداً في التجويد والحفظ، لأن الغلطة اللي بتتكرر شهور صعب تتصلّح بعد كده.' },
      { h: 'خلّي المعنى جزء من الحكاية' },
      { p: 'ولادنا اللي عايشين بالإنجليزي كتير بيقروا العربي من غير ما يفهموا. كلمتين معنى، أو قصة قصيرة ورا السورة، أو سؤال واحد زي «تفتكر الآية دي بتطلب مننا نعمل إيه؟»، بيخلّوا القراية حاجة تخصّه هو. وكمان بيدّوكم كلام تتكلموا فيه على العشا.' },
      { h: 'خليك موجود، على الأقل في الأول' },
      { p: 'احضر حصة كل فترة. هتشوف ابنك بيقرا إزاي، والمعلم طالب منه إيه، ويراجع إيه طول الأسبوع. اطلب من المعلم مهمة واحدة واضحة بين الحصتين، واطلب من ابنك يسمّعها لك. اهتمامك بيقوله إن الموضوع ده مهم.' },
      { h: 'إنجازات صغيرة، بنقولها بصوت عالي' },
      { list: [
        'احتفلوا بختم سورة، مش بس بختم جزء.',
        'خلّيه يقرا اللي حفظه في صلاة العيلة.',
        'جدول بسيط على التلاجة للأيام اللي راجع فيها.',
        'لما يكون تعبان، قصّروا الوقت بدل ما تلغوه.'
      ] },
      { h: 'إمتى تدوّر على مساعدة' },
      { p: 'لو عربيتك أنت نفسك على قدّها، أو الأسبوع مش سايب لك وقت تعلّم، المعلم الثابت بيشيل الحمل ده عنك. في وتزودوا كل طالب ليه معلمه في حصص فردية مباشرة على Zoom، ومعانا معلمين ومعلمات، وأول حصة تجريبية مجاناً عشان تشوف ابنك مرتاح ولا لأ قبل ما تقرر أي حاجة.' }
    ]
  },
  {
    slug: 'fusha-or-dialect-for-kids',
    date: '2026-11-01',
    titleEn: 'Fusha or a spoken dialect: which Arabic should my child learn first?',
    titleAr: 'الفصحى ولا العامية: ابني يبدأ بأنهي عربي؟',
    descEn: 'An honest look at Modern Standard Arabic and spoken dialects for children growing up abroad, and how to choose based on your family’s goal.',
    descAr: 'مقارنة صريحة بين الفصحى والعامية لطفل بيكبر برّه، وإزاي تختار على حسب هدف عيلتكم.',
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
      { p: 'السؤال ده أهالي كتير بيسألوه قبل أول حصة. الإجابة المختصرة: على حسب إنت عايز العربي يعمل إيه لابنك. الاتنين عربي حقيقي، وكل واحد ليه فايدة.' },
      { h: 'الفصحى بتدّي الطفل إيه' },
      { p: 'الفصحى هي لغة الكتب والأخبار والمدارس والكلام الرسمي في العالم العربي كله. وهي الأقرب للغة القرآن، فالطفل اللي بيتعلّمها بيلاقي قراية القرآن والكتب الإسلامية أسهل مع الوقت. وهي واحدة في كل البلاد، وده بيفرق لو العيلة من بلاد مختلفة.' },
      { h: 'العامية بتدّي الطفل إيه' },
      { p: 'محدش بيتكلم فصحى على السفرة. لو الجد والجدة بيتكلموا مصري أو شامي أو خليجي، الطفل اللي بيتعلّم اللهجة دي يقدر يكلّمهم ويهزّر مع ولاد عمه ويحس إنه في بيته وهو مسافر. ولو أهم حاجة عندكم صلة العيلة، اللهجة بتجيب نتيجة الطفل بيحسّها بسرعة.' },
      { h: 'أسئلة بتحسم القرار' },
      { list: [
        'الهدف الأول فهم القرآن والكتب الإسلامية؟ ابدأ بالفصحى.',
        'الهدف الأول الكلام مع القرايب؟ ابدأ بلهجة العيلة.',
        'الطفل بيتكلم شوية عامية في البيت؟ الفصحى بتتبني عليها كويس.',
        'العيلة مختلطة أو مفيش لهجة واضحة في البيت؟ الفصحى أرض مشتركة.'
      ] },
      { h: 'ينفع يتعلّم الاتنين؟' },
      { p: 'أيوه، وكتير بيعملوا كده. الاتنين بيشتركوا في أغلب الكلمات والقواعد، فالوقت اللي بيتصرف على واحدة مش ضايع على التانية. اللي بيلخبط الطفل هو التنقّل من غير خطة. اختاروا واحدة تكون الأساس لفترة، وبعد ما القراية والكلام البسيط يبقوا مريحين ضيفوا التانية.' },
      { h: 'إحنا بنعلّمها إزاي' },
      { p: 'في وتزودوا الأطفال يقدروا يتعلّموا الفصحى أو المصري في حصص فردية، والمعلم بيظبط الحصة على سن الطفل ومستواه. ولو لسه محتار تبدأ بأنهي واحدة، قول للمعلم في الحصة التجريبية المجانية إنت عايز إيه، وهو يقترح عليك الطريق.' }
    ]
  },
  {
    slug: 'choosing-an-online-quran-teacher',
    date: '2026-11-01',
    titleEn: 'What to look for in an online Quran teacher for your child',
    titleAr: 'تختار معلم قرآن أونلاين لابنك إزاي',
    descEn: 'A parent’s checklist for online Quran lessons: what to watch for in the trial lesson, safety basics, and questions worth asking before you commit.',
    descAr: 'قائمة لولي الأمر قبل ما يبدأ حصص قرآن أونلاين: تلاحظ إيه في الحصة التجريبية، وأساسيات الأمان، وأسئلة تسألها قبل ما تلتزم.',
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
      { p: 'لما تدوّر على معلم قرآن أونلاين هتلاقي اختيارات بالمية، وكلها شكلها واحد من برّه. الفرق بيبان في الحصة نفسها. ده اللي كنا هندوّر عليه لو بنختار لولادنا إحنا.' },
      { h: 'ركّز في الحصة التجريبية' },
      { list: [
        'المعلم بيسمع أكتر ما بيتكلم؟ المفروض ابنك هو اللي بيقرا أغلب الحصة.',
        'الغلط بيتصلّح بهدوء وفي وقته، والسبب بيتشرح بكلام على قدّ سن الطفل؟',
        'المعلم بيعرف ابنك وصل لفين قبل ما يبدأ؟',
        'ابنك بيخرج من الحصة مرتاح، أو حتى فخور بنفسه شوية؟'
      ] },
      { h: 'اسأل عن المعلم بوضوح' },
      { p: 'اسأل المعلم درس فين وبيعلّم إيه. الأكاديمية الكويسة بترد بوضوح ومن غير مبالغة. واسأل مين اللي هيعلّم ابنك كل أسبوع، لأن المعلم اللي بيتغيّر كل شهر معناه إنكم بتبدأوا من الأول كل شهر.' },
      { h: 'الأمان مش تفصيلة' },
      { list: [
        'من حقك تحضر أي حصة.',
        'المعلم هو اللي يفتح غرفة الفيديو ويتحكم فيها، مش الطفل.',
        'الرسايل بين المعلم والطفل تفضل على منصة الأكاديمية، ومتروحش لأي حساب خاص.',
        'الحصص متتسجّلش من غير إذنك.'
      ] },
      { h: 'معلم ولا معلمة' },
      { p: 'عيلات كتير بتفضّل معلمة للبنات أو للأطفال الصغيرين. ده طلب طبيعي، والأكاديمية المفروض تسهّله مش تعتبره خدمة زيادة.' },
      { h: 'دوّر على خطة بين الحصص' },
      { p: 'التقدّم بيحصل في الأيام اللي بين الحصص. اسأل ابنك يراجع إيه طول الأسبوع، وهتعرف مستواه إزاي. ملاحظة قصيرة بعد كل حصة بتقولك أكتر من تقرير كل شهر.' },
      { h: 'جرّب قبل ما تقرر' },
      { p: 'في وتزودوا أول حصة تجريبية مجاناً، عشان تشوف المعلم مع ابنك قبل ما تدفع أي حاجة. معانا معلمين ومعلمات، وصفحة أمان الأطفال بتشرح إزاي بتمشي كل حصة مع طفل.' }
    ]
  }
];

export const findArticle = (slug: string) => ARTICLES.find((a) => a.slug === slug) || null;
