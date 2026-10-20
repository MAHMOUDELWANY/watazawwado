import type { ServicePillar, FAQItem } from '../types';

export const SERVICES_DATA: ServicePillar[] = [
  {
    id: 'quran',
    title: 'Quran & Tajweed',
    arabicTitle: 'القرآن والتجويد',
    description: 'From the first letter and its sound to fluent recitation and firm memorization.',
    arabicDescription: 'من أول حرف ومخرجه، لحد التلاوة السليمة والحفظ المتقن.',
    services: [
      {
        id: 'quran-reading',
        name: 'Quran Reading',
        arabicName: 'قراءة القرآن الكريم',
        category: 'quran',
        tagline: 'From recognizing letters and vowels to fluent recitation directly from the Mushaf.',
        arabicTagline: 'من معرفة الحروف والحركات إلى التلاوة السلسة مباشرة من المصحف الشريف.',
        description: 'For adults and children who want to read the Quran independently. We start with letter shapes, vocal points of articulation (Makharij), and short vowels, building slowly and patiently until full verses flow naturally.',
        whoIsItFor: 'Beginners of any age, adults returning to the Quran, or children starting their first Noorani / Qaida lessons.',
        whatYouWillLearn: [
          'Arabic alphabet phonetics and precise mouth positioning',
          'Connecting letters, short vowels, and Sukoon',
          'Reading full sentences from the Mushaf with correct rhythm',
          'Building reading stamina without frustration'
        ],
        durations: [30, 45, 60],
        recommendedFrequency: '2 to 3 lessons a week'
      },
      {
        id: 'tajweed',
        name: 'Tajweed Rules & Application',
        arabicName: 'أحكام التجويد وتطبيقاته',
        category: 'quran',
        tagline: 'Learn why and how every letter is pronounced according to authentic rules.',
        arabicTagline: 'إتقان مخارج الحروف وصفاتها وتطبيق أحكام النون والميم والمدود عملياً.',
        description: 'Tajweed is not just theory—it is hearing and practicing the exact acoustic characteristics of each letter. We study rules like Noon Sakinah, Meem Sakinah, Madd, and stopping rules, applying them immediately in your recitation.',
        whoIsItFor: 'Students who can already read Arabic text but want to recite with beauty, accuracy, and traditional correctness.',
        whatYouWillLearn: [
          'Accurate Makharij (points of articulation) and Sifaat (letter characteristics)',
          'Noon Sakinah, Tanween, and Meem Sakinah rules in practice',
          'Rules of Madd (elongation) and Waqf (stopping points)',
          'Practical ear training to catch your own recitation mistakes'
        ],
        durations: [30, 45, 60],
        recommendedFrequency: '2 lessons a week'
      },
      {
        id: 'quran-memorization',
        name: 'Quran Memorization & Revision',
        arabicName: 'الحفظ والمراجعة',
        category: 'quran',
        tagline: 'A sustainable, steady memorization system built around your daily life.',
        arabicTagline: 'منهجية حفظ مستدامة وتثبيت متقن يناسب وقتك وجدولك اليومي.',
        description: 'Memorizing the Quran requires consistency over speed. We design a realistic weekly target—whether it is three verses or a full page—with live recitation to catch mistakes before they set into memory.',
        whoIsItFor: 'Committed learners and youth striving to memorize Surahs or complete sections of the Quran.',
        whatYouWillLearn: [
          'Pre-memorization reading to guarantee flawless Tajweed before committing to memory',
          'Systematic daily revision schedules that prevent forgetting older Surahs',
          'Understanding key word meanings to anchor memorization naturally',
          'Techniques to overcome difficult verse transitions (Mutashabihat)'
        ],
        durations: [30, 45, 60],
        recommendedFrequency: '2 to 4 lessons a week'
      },
      {
        id: 'quran-revision',
        name: 'Quran Revision & Retention',
        arabicName: 'مراجعة القرآن وتثبيت الحفظ',
        category: 'quran',
        tagline: 'Protect what you have memorized and solidify weak portions.',
        arabicTagline: 'متابعة دورية للحفاظ وأصحاب الحفظ الجزئي لضبط المتشابهات وإتقان التلاوة.',
        description: 'For students who have previously memorized parts of the Quran or the entire Quran and need a disciplined, supportive partner to recite to regularly and eliminate doubts.',
        whoIsItFor: 'Huffadh, students with partial memorization who have lost fluency, or those preparing for tests or revision goals.',
        whatYouWillLearn: [
          'Structured recitation cycles (Dawr) adapted to your free time',
          'Targeted diagnostic drills on previously forgotten Surahs',
          'Immediate error correction on subtle vocal and letter distinctions',
          'Confidence building to lead prayers or recite smoothly'
        ],
        durations: [30, 45, 60],
        recommendedFrequency: '2 to 3 lessons a week'
      }
    ]
  },
  {
    id: 'islamic_studies',
    title: 'The Zad Path',
    arabicTitle: 'مسار الأثر',
    description: 'Our own curriculum: faith, worship, character and the life of the Prophet ﷺ, made to change how you live. Three versions by age.',
    arabicDescription: 'منهجنا إحنا: الإيمان والعبادة والأخلاق وسيرة النبي ﷺ، معمول عشان يغيّر حياتك. تلات نسخ حسب السن.',
    services: [
      {
        id: 'aqeedah',
        name: 'Aqeedah (Islamic Creed)',
        arabicName: 'العقيدة الإسلامية',
        category: 'islamic_studies',
        tagline: 'Understanding the fundamentals of belief with conviction and clarity.',
        arabicTagline: 'فهم أركان الإيمان وأصول التوحيد بوضوح وتأصيل علمي سليم.',
        description: 'A study of the core pillars of Iman—Belief in Allah, His Angels, His Books, His Messengers, the Last Day, and Divine Decree. Taught from sound classical sources with open dialogue for contemporary questions.',
        whoIsItFor: 'Adults seeking firm intellectual and spiritual grounding, and youth growing up in Western environments.',
        whatYouWillLearn: [
          'The meaning and implications of Tawheed in daily living',
          'The pillars of Iman explained without unnecessary philosophical jargon',
          'Clear answers to common questions about faith, purpose, and destiny',
          'Building a firm identity rooted in sound understanding'
        ],
        durations: [30, 45, 60],
        recommendedFrequency: '1 to 2 lessons a week'
      },
      {
        id: 'fiqh',
        name: 'Fiqh (Daily Practical Worship)',
        arabicName: 'فقه العبادات اليومية',
        category: 'islamic_studies',
        tagline: 'How to perform your Salah, Wudu, fasting, and daily duties with certainty.',
        arabicTagline: 'أحكام الطهارة والصلاة والصيام والمعاملات بأسلوب ميسر وعملي.',
        description: 'Clear, practical jurisprudence focused on what a Muslim needs in everyday life: Taharah (purification), Salah (prayer conditions and rulings), Sawm (fasting), and everyday ethics.',
        whoIsItFor: 'New Muslims, teens building independent habits, or adults wanting to verify their prayer and worship is correct.',
        whatYouWillLearn: [
          'Step-by-step practical Wudu, Ghusl, and purification rulings',
          'Complete mechanics of Salah: obligatory acts, Sunan, and prostrations of forgetfulness (Sujood as-Sahw)',
          'Rulings of fasting and traveler prayers',
          'Handling modern daily situations calmly with sound knowledge'
        ],
        durations: [30, 45, 60],
        recommendedFrequency: '1 to 2 lessons a week'
      },
      {
        id: 'seerah',
        name: 'Seerah (Prophetic Biography)',
        arabicName: 'السيرة النبوية العطرة',
        category: 'islamic_studies',
        tagline: 'Walking through the life, character, and decisions of the Prophet Muhammad ﷺ.',
        arabicTagline: 'رحلة ملهمة في حياة النبي ﷺ ومواقفه وأخلاقه للقدوة والاهتداء.',
        description: 'More than dates and events—a journey into the character, mercy, leadership, and emotional warmth of the Prophet ﷺ. We examine how he responded to hardship, family life, community building, and companionship.',
        whoIsItFor: 'Anyone wishing to develop a personal love and connection with the Prophet ﷺ through his living example.',
        whatYouWillLearn: [
          'Chronological narrative from pre-Islamic Arabia to the farewell pilgrimage',
          'The Prophet’s character in times of trial, victory, and grief',
          'Practical lessons in leadership, family manners, and patience',
          'Connecting historical incidents to our lives today'
        ],
        durations: [30, 45, 60],
        recommendedFrequency: '1 lesson a week'
      },
      {
        id: 'zad-essentials',
        name: 'Zad Essentials',
        arabicName: 'أول الزاد',
        category: 'islamic_studies',
        tagline: 'The first things every Muslim needs, for learners starting from zero.',
        arabicTagline: 'ما لا يسع المسلم جهله، لمن يبدأ من الصفر.',
        description: 'Belief, purity, prayer and manners in animated lessons. Every topic gives the reason first, then the evidence from the Quran and Sunnah, then one small step to live it.',
        whoIsItFor: 'Children who know nothing yet (Kids version, 6–11), and teens and adults who want a sound start (12+).',
        whatYouWillLearn: [
          'Who Allah is, and why we worship Him alone',
          'Wudu and prayer step by step, with the evidence',
          'The pillars of Islam and Iman, explained simply',
          'Manners and daily Sunnahs that change how a child acts and speaks'
        ],
        durations: [30, 45, 60],
        recommendedFrequency: '1–2 lessons a week'
      },
      {
        id: 'islamic-studies',
        name: 'Foundations of Islamic Studies',
        arabicName: 'أساسيات الدراسات الإسلامية',
        category: 'islamic_studies',
        tagline: 'A comprehensive starter curriculum designed for young learners and busy adults.',
        arabicTagline: 'منهاج تأسيسي متكامل يجمع الآداب والأدعية وقصص الأنبياء لليافعين والكبار.',
        description: 'An integrated curriculum combining basic Aqeedah, everyday manners (Adab), essential Duas, and moral stories from the Quran and companions.',
        whoIsItFor: 'Children aged 7+, youth, and adults starting their learning from square one.',
        whatYouWillLearn: [
          'Essential daily Duas and their meanings',
          'Islamic manners (Adab) with parents, teachers, and society',
          'Core stories of the Prophets from Adam to Isa (peace be upon them)',
          'Building a loving, balanced Muslim character'
        ],
        durations: [30, 45, 60],
        recommendedFrequency: '2 lessons a week'
      }
    ]
  },
  {
    id: 'arabic',
    title: 'Arabic Language',
    arabicTitle: 'اللغة العربية',
    description: 'Arabic that opens understanding: for the Quran, for reading, and for real conversation.',
    arabicDescription: 'عربية تفهم بيها القرآن، وتقرا بيها، وتتكلم بيها بثقة.',
    services: [
      {
        id: 'modern-standard-arabic',
        name: 'Fusha Arabic',
        arabicName: 'العربية الفصحى',
        category: 'arabic',
        tagline: 'The universal written language of books, media, and scholarship across the Arab world.',
        arabicTagline: 'إتقان لغة الكتب والتراث والقواعد الهيكلية بيسر وسلاسة.',
        description: 'Learn to read, write, and comprehend standard Arabic grammar (Nahw) and morphology (Sarf) using interactive texts, structured dialogues, and real-world reading material.',
        whoIsItFor: 'University students, Quran students wanting deep grammatical insight, and professionals.',
        whatYouWillLearn: [
          'Essential grammar structures explained simply in English without confusion',
          'Sentence construction, verb conjugations, and root patterns',
          'Reading comprehension of classical and modern passages',
          'Writing coherent sentences with accurate voweling'
        ],
        durations: [45, 60],
        recommendedFrequency: '2 lessons a week'
      },
      {
        id: 'arabic-conversation',
        name: 'Spoken Arabic Conversation',
        arabicName: 'المحادثة والتحدث بالعربية',
        category: 'arabic',
        tagline: 'Overcome the fear of speaking through real, guided 1-on-1 dialogues.',
        arabicTagline: 'كسر حاجز الخوف والانطلاق في التحدث بطلاقة عبر حوارات يومية حية.',
        description: 'A conversation-focused space where you talk from minute one. We simulate everyday scenarios—introductions, ordering food, asking directions, discussing family and work—gently correcting pronunciation and sentence cadence as you go.',
        whoIsItFor: 'Intermediate learners who understand grammar on paper but freeze when trying to speak aloud.',
        whatYouWillLearn: [
          'Rapid recall of high-frequency vocabulary and common idioms',
          'Natural sentence rhythm and conversational fillers',
          'Confidence speaking in full sentences without translating word-for-word in your head',
          'Listening comprehension with authentic native pacing'
        ],
        durations: [30, 45, 60],
        recommendedFrequency: '2 to 3 lessons a week'
      },
      {
        id: 'egyptian-arabic',
        name: 'Egyptian Spoken Arabic (Aammiyya)',
        arabicName: 'اللهجة المصرية الحية',
        category: 'arabic',
        tagline: 'The most widely understood dialect in the Arab world through cinema, music, and daily life.',
        arabicTagline: 'تحدث اللهجة الأكثر انتشاراً وفهماً في العالم العربي بثقة وعفوية.',
        description: 'Learn the warm, humorous, and expressive dialect of Egypt. Ideal for travel, speaking with Egyptian friends and family, or understanding Arab media effortlessly.',
        whoIsItFor: 'Spouses of Egyptians, travelers, diaspora youth, or students wanting a lively practical dialect.',
        whatYouWillLearn: [
          'Unique Egyptian vocabulary, expressions, and cultural nuances',
          'Everyday conversational patterns for greetings, bargaining, and hospitality',
          'Key grammatical shifts between Fusha and Egyptian dialect',
          'Pronunciation secrets that make you sound natural immediately'
        ],
        durations: [30, 45, 60],
        recommendedFrequency: '1 to 2 lessons a week'
      },
      {
        id: 'arabic-foundations',
        name: 'Arabic Foundations for Non-Arabs',
        arabicName: 'تأسيس العربية للناطقين بغيرها',
        category: 'arabic',
        tagline: 'Gentle, structured entry into Arabic reading, writing, and core vocabulary.',
        arabicTagline: 'مدخل تدريجي ممتع لتعلم الحروف والمفردات الأساسية للجدد.',
        description: 'Designed specifically for non-Arabic speakers. We strip away academic intimidation and focus on practical letter recognition, basic vocabulary, and everyday Quranic terms.',
        whoIsItFor: 'Adults with zero prior background in the Arabic script.',
        whatYouWillLearn: [
          'Mastery of the 28 Arabic letters in isolated and connected positions',
          'Phonetic training for Arabic-specific sounds (ح, خ, ص, ض, ط, ظ, ع, غ, ق)',
          'Top 200 common words found in the Quran and daily Muslim life',
          'Reading simple signs, phrases, and short passages'
        ],
        durations: [30, 45, 60],
        recommendedFrequency: '2 lessons a week'
      }
    ]
  },
  {
    id: 'english',
    title: 'English',
    arabicTitle: 'اللغة الإنجليزية',
    description: 'English you speak with confidence, at work, at school and in daily life.',
    arabicDescription: 'إنجليزي تتكلمه بثقة، في الشغل والدراسة والحياة.',
    services: [
      {
        id: 'english',
        name: '1-on-1 English Language Coaching',
        arabicName: 'تدريب اللغة الإنجليزية الفردي',
        category: 'english',
        tagline: 'Build conversational fluency, clean grammar, and confident professional English.',
        arabicTagline: 'تطوير الطلاقة والمحادثة وتجاوز أخطاء الترجمة للناطقين بالعربية.',
        description: 'Our teachers teach English at C1 level. They know the sounds and grammar that trip up Arabic speakers, and correct them precisely and patiently.',
        whoIsItFor: 'Arabic speakers seeking fluent spoken English, immigrants to English-speaking countries, or learners preparing for study abroad.',
        whatYouWillLearn: [
          'Targeted pronunciation and accent clarity training',
          'Practical conversational fluency for social and professional settings',
          'Grammar repair tailored specifically to common Arabic-to-English translation errors',
          'Reading comprehension and natural email / text writing'
        ],
        durations: [30, 45, 60],
        recommendedFrequency: '2 lessons a week'
      }
    ]
  }
];


// The four steps on /how-it-works (also read by the AI learning guide in api/index.ts).
export const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Book your free trial',
    arabicTitle: 'احجز حصتك المجانية',
    description: 'Pick a time in your own time zone. Thirty minutes on Zoom, no card and nothing to pay.',
    arabicDescription: 'اختار ميعاد بتوقيتك. ٣٠ دقيقة على Zoom، من غير بطاقة ومن غير ما تدفع حاجة.',
    highlight: 'No obligation',
    arabicHighlight: 'من غير أي التزام'
  },
  {
    step: '02',
    title: 'Meet your teacher',
    arabicTitle: 'قابل معلمك',
    description: 'Your teacher listens to your goal, finds your level gently, and gives you a real mini-lesson.',
    arabicDescription: 'معلمك بيسمع هدفك، ويعرف مستواك بهدوء، ويديك درس صغير حقيقي تحس فيه بطريقة الشرح.',
    highlight: 'A gentle assessment',
    arabicHighlight: 'تقييم هادي'
  },
  {
    step: '03',
    title: 'Get your plan',
    arabicTitle: 'استلم خطتك',
    description: 'A clear path: the lesson length (30, 45 or 60 minutes), how often you meet, and what you will study.',
    arabicDescription: 'طريق واضح: مدة الحصة (٣٠ أو ٤٥ أو ٦٠ دقيقة)، وكام مرة في الأسبوع، وهتدرس إيه بالظبط.',
    highlight: 'Made for you',
    arabicHighlight: 'على مقاسك'
  },
  {
    step: '04',
    title: 'Learn, week after week',
    arabicTitle: 'اتعلّم أسبوع ورا أسبوع',
    description: 'Private lessons on Zoom, and the on-site chat between them. Move a lesson yourself up to 1 hour before, or cancel up to 3 hours before.',
    arabicDescription: 'حصص فردية على Zoom، والمحادثة على الموقع بين الحصص. تغيّر ميعاد حصتك بنفسك لحد ساعة قبلها، أو تلغيها لحد ٣ ساعات قبلها.',
    highlight: 'Flexible',
    arabicHighlight: 'بمرونة'
  }
];

// What every lesson holds to, whatever the subject (/how-it-works).
export const TEACHING_PILLARS = [
  {
    title: 'Mastery before speed',
    arabicTitle: 'الإتقان قبل السرعة',
    description: 'We move on when a step is solid, not when the page ends. Slow and sure lasts longer.',
    arabicDescription: 'بنكمّل لما الخطوة تثبت، مش لما الصفحة تخلص. الخطوة الهادية الثابتة بتعيش أطول.'
  },
  {
    title: 'Understand what you learn',
    arabicTitle: 'نفهم اللي بنتعلمه',
    description: 'A verse you understand stays with you. Every rule and every new word comes with its meaning.',
    arabicDescription: 'الآية اللي بتفهمها بتفضل معاك. وكل قاعدة وكل كلمة جديدة بييجي معاها معناها.'
  },
  {
    title: 'A small habit, every week',
    arabicTitle: 'عادة صغيرة كل أسبوع',
    description: 'Half an hour that comes back every week beats a long lesson that never returns. We fit the pace to your life.',
    arabicDescription: 'نص ساعة بترجع كل أسبوع أحسن من حصة طويلة مبترجعش. وبنظبط الإيقاع على حياتك.'
  },
  {
    title: 'Manners before knowledge',
    arabicTitle: 'الأدب قبل العلم',
    description: 'Our scholars learned adab before they learned knowledge. Respect, patience and a kind word are part of every lesson.',
    arabicDescription: 'علماؤنا اتعلموا الأدب قبل العلم. والاحترام والصبر والكلمة الطيبة جزء من كل حصة.'
  }
];

export const FAQS: FAQItem[] = [
  {
    question: 'Is every lesson one-on-one?',
    arabicQuestion: 'هل كل حصة فردية؟',
    answer: 'Yes. Every lesson is you and your teacher, nobody else. You keep the same teacher, and we never move you to another teacher or into a group without asking you first.',
    arabicAnswer: 'أيوه. كل حصة إنت ومعلمك وبس. بتفضل مع نفس المعلم، ومش هننقلك لمعلم تاني أو لمجموعة من غير ما نسألك الأول.',
    category: 'general'
  },
  {
    question: 'How does the free trial work?',
    arabicQuestion: 'الحصة التجريبية المجانية بتكون إزاي؟',
    answer: 'It is a free 30-minute lesson on Zoom (up to 45 if needed). Your teacher gets to know your goal, finds your level with simple exercises and teaches a short real lesson. Then you get a suggested plan. No card, no pressure.',
    arabicAnswer: 'حصة مجانية على Zoom مدتها ٣٠ دقيقة (وممكن توصل ٤٥ لو احتجنا). معلمك بيتعرف على هدفك، ويعرف مستواك بتمارين بسيطة، ويشرحلك درس صغير حقيقي، وبعدها يقترح عليك خطة. من غير بطاقة ومن غير أي ضغط.',
    category: 'trial'
  },
  {
    question: 'Can I choose a female teacher?',
    arabicQuestion: 'أقدر أختار معلّمة؟',
    answer: 'Yes. When you set up your learning profile you choose a male or a female teacher, for yourself or for each child.',
    arabicAnswer: 'أيوه. وإنت بتعمل ملفك التعليمي بتختار معلّم أو معلّمة، ليك أو لكل طفل من أولادك.',
    category: 'general'
  },
  {
    question: 'What is the cancellation and rescheduling policy?',
    arabicQuestion: 'أقدر ألغي أو أغيّر ميعاد الحصة؟',
    answer: 'You can cancel up to 3 hours before (a paid lesson comes back as a lesson credit) and move it yourself up to 1 hour before, to tomorrow or later. In the last hour nothing can change; for a real emergency, message us on WhatsApp.',
    arabicAnswer: 'تقدر تلغي الحصة لحد ٣ ساعات قبل ميعادها (والحصة المدفوعة بترجعلك كرصيد)، وتغيّر ميعادها بنفسك من حسابك لحد ساعة قبلها، لأي يوم من بكرة ورايح. في آخر ساعة مفيش تغيير؛ ولو حصل ظرف طارئ فعلاً، كلّمنا على واتساب.',
    category: 'booking'
  },
  {
    question: 'I cannot read any Arabic. Can I still start?',
    arabicQuestion: 'مبعرفش أقرا عربي خالص، أقدر أبدأ؟',
    answer: 'Of course, and you are not alone. We begin with the very first letter, its shape and its sound, step by step and with patience.',
    arabicAnswer: 'طبعاً، وإنت مش لوحدك. بنبدأ من أول حرف، شكله وصوته، خطوة بخطوة وبصبر.',
    category: 'teaching'
  },
  {
    question: 'How long is a lesson?',
    arabicQuestion: 'الحصة مدتها قد إيه؟',
    answer: '30, 45 or 60 minutes. Thirty minutes suits young children and busy days; sixty suits long revision or grammar. Shorter lessons cost the same per minute.',
    arabicAnswer: '٣٠ أو ٤٥ أو ٦٠ دقيقة. الـ٣٠ مناسبة للأطفال والأيام المزحومة، والـ٦٠ للمراجعة الطويلة والنحو. والحصة الأقصر بنفس سعر الدقيقة.',
    category: 'booking'
  },
  {
    question: 'How do I pay?',
    arabicQuestion: 'بدفع إزاي؟',
    answer: 'Online through Stripe: card, Apple Pay or PayPal. A paid lesson is confirmed once the payment goes through. The free trial costs nothing.',
    arabicAnswer: 'أونلاين عن طريق Stripe: بطاقة أو Apple Pay أو PayPal. الحصة المدفوعة بتتأكد أول ما الدفع يتم، والحصة التجريبية ببلاش.',
    category: 'booking'
  },
  {
    question: 'How do time zones work?',
    arabicQuestion: 'المواعيد بتوقيت مين؟',
    answer: 'Every time on the site is shown in your own time zone, automatically. No maths needed.',
    arabicAnswer: 'كل المواعيد على الموقع بتظهر بتوقيت بلدك تلقائياً. مش محتاج تحسب فرق الساعات.',
    category: 'general'
  },
  {
    question: 'Do I need an account to book?',
    arabicQuestion: 'محتاج حساب عشان أحجز؟',
    answer: 'Yes, every booking needs a free account, the free trial too. It takes a minute, and it is where you see your lessons, Zoom links and packages, and talk to your teacher.',
    arabicAnswer: 'أيوه، كل حجز محتاج حساب مجاني، حتى الحصة التجريبية. بياخد دقيقة، ومنه تتابع حصصك وروابط Zoom وباقاتك، وتكلّم معلمك.',
    category: 'booking'
  }
];
