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
        tagline: 'From the first letter to reading the Mushaf on your own.',
        arabicTagline: 'من أول حرف حتى تقرأ من المصحف بنفسك.',
        description: 'Two stages. Foundations: every letter, its sound and its vowels, then joining letters into words. Reading the Mushaf: whole verses, read steadily and correctly. We go at your pace, with patience.',
        whoIsItFor: 'Anyone starting from zero, children from age 6 and adults, and anyone coming back to the Quran after a long break.',
        whatYouWillLearn: [
          'Every letter: its shape, its sound and where it comes from',
          'Short and long vowels, sukoon and shaddah',
          'Joining letters into words, then words into verses',
          'Reading from the Mushaf on your own, without stumbling'
        ],
        durations: [30, 45, 60],
        recommendedFrequency: '2 to 3 lessons a week'
      },
      {
        id: 'tajweed',
        name: 'Tajweed Rules & Application',
        arabicName: 'أحكام التجويد وتطبيقاته',
        category: 'quran',
        tagline: 'Give every letter its right, in your own recitation.',
        arabicTagline: 'إتقان مخارج الحروف وصفاتها وتطبيق أحكام النون والميم والمدود عملياً.',
        description: 'Three levels, always practised while you recite: where each letter comes from and how it sounds, the rules of noon and meem sakinah, the madd, and where to stop and start.',
        whoIsItFor: 'Anyone who can already read the Mushaf and wants to recite correctly and beautifully.',
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
        tagline: 'Memorize new surahs, or keep what you have firm.',
        arabicTagline: 'احفظ سورًا جديدة، أو ثبّت ما حفظته.',
        description: 'One subject, built around your goal: start memorizing, add more, or keep what you already have. A weekly target that fits your life, recited to your teacher so mistakes are caught before they settle.',
        whoIsItFor: 'Children and adults starting to memorize, and anyone who memorized before and wants to revise and keep it.',
        whatYouWillLearn: [
          'Reading a passage correctly before you memorize it',
          'A revision plan that keeps older surahs strong',
          'The meaning of key words, so the verses stay with you',
          'Telling similar verses apart (mutashabihat)'
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
    arabicDescription: 'منهجنا نحن: الإيمان والعبادة والأخلاق وسيرة النبي ﷺ، صُمّم ليغيّر حياتك. ثلاث نسخ حسب العمر.',
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
        description: 'Part of the Zad Path, our own curriculum: the life of the Prophet ﷺ in order, one episode at a time, and what each moment teaches us today. Three versions by age: Kids 6–11, Teens 12–17, Adults 18+.',
        whoIsItFor: 'Every age. The version follows the learner’s age, so there is no level to choose.',
        whatYouWillLearn: [
          'His life in order, one story at a time',
          'His character in hardship, at home and with people',
          'One small lesson to live from every episode',
          'Love for him ﷺ that grows from knowing him'
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
        whoIsItFor: 'Learners starting from zero, in three versions by age: Kids 6–11, Teens 12–17, Adults 18+.',
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
        tagline: 'The Arabic of the Quran and of books, spoken from the first level.',
        arabicTagline: 'عربية القرآن والكتب، وبتتكلمها من أول مستوى.',
        description: 'Four levels: Foundations, Beginner, Intermediate and Advanced. From the letters to reading real texts, with grammar explained simply and conversation in every level. A kids version and a 12+ version.',
        whoIsItFor: 'Non-Arabic speakers starting from zero, and anyone who wants to understand the Quran, read Arabic books or speak Fusha.',
        whatYouWillLearn: [
          'Reading and writing the letters, if you are new to Arabic',
          'Everyday conversation in clear Fusha, from the first level',
          'Grammar and sentence building, explained simply',
          'Understanding what you read and what you recite'
        ],
        durations: [30, 45, 60],
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
        tagline: 'The Arabic people speak every day in Egypt.',
        arabicTagline: 'العربية التي يتحدث بها الناس كل يوم في مصر.',
        description: 'We start with the sounds, then go level by level. Every word is written both in Franco (Arabic in Latin letters) and in Arabic script, so you can start before you read Arabic. One design for all ages.',
        whoIsItFor: 'Families with Egyptian relatives, travellers to Egypt, children of Egyptian parents abroad, and anyone who wants everyday spoken Arabic.',
        whatYouWillLearn: [
          'The sounds of Egyptian Arabic, first',
          'Everyday talk: greetings, family, shopping and travel',
          'Franco and Arabic script side by side',
          'How Egyptian Arabic differs from Fusha'
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
        tagline: 'English you speak, read and write with confidence.',
        arabicTagline: 'إنجليزي تتكلمه وتقراه وتكتبه بثقة.',
        description: 'Two tracks. Kids: phonics first, then reading. Ages 12 and up: levels A1 to C1 on the CEFR scale. Your teacher knows the sounds and grammar that trip up Arabic speakers, and corrects them patiently.',
        whoIsItFor: 'Children learning to read English, and teens and adults who want to speak, read and write it better.',
        whatYouWillLearn: [
          'Phonics and reading, for kids',
          'Speaking in real situations: school, work and home',
          'Grammar that fixes the usual mistakes of Arabic speakers',
          'Reading, and writing clear messages and emails'
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
    arabicDescription: 'اختر موعدًا بتوقيتك. ٣٠ دقيقة على Zoom، بلا بطاقة ودون أن تدفع شيئًا.',
    highlight: 'No obligation',
    arabicHighlight: 'من غير أي التزام'
  },
  {
    step: '02',
    title: 'Meet your teacher',
    arabicTitle: 'قابل معلمك',
    description: 'Your teacher listens to your goal, finds your level gently, and gives you a real mini-lesson.',
    arabicDescription: 'يستمع معلمك إلى هدفك، ويعرف مستواك بهدوء، ويقدّم لك درسًا قصيرًا حقيقيًا تلمس فيه طريقة الشرح.',
    highlight: 'A gentle assessment',
    arabicHighlight: 'تقييم هادي'
  },
  {
    step: '03',
    title: 'Get your plan',
    arabicTitle: 'استلم خطتك',
    description: 'A clear path: the lesson length (30, 45 or 60 minutes), how often you meet, and what you will study.',
    arabicDescription: 'طريق واضح: مدة الحصة (٣٠ أو ٤٥ أو ٦٠ دقيقة)، وعدد المرات في الأسبوع، وما الذي ستدرسه بالضبط.',
    highlight: 'Made for you',
    arabicHighlight: 'على مقاسك'
  },
  {
    step: '04',
    title: 'Learn, week after week',
    arabicTitle: 'اتعلّم أسبوع ورا أسبوع',
    description: 'Private lessons on Zoom, and the on-site chat between them. Move a lesson yourself up to 1 hour before, or cancel up to 3 hours before.',
    arabicDescription: 'حصص فردية على Zoom، والمحادثة على الموقع بين الحصص. غيّر موعد حصتك بنفسك حتى ساعة قبلها، أو ألغِها حتى ٣ ساعات قبلها.',
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
    arabicDescription: 'ننتقل حين تثبت الخطوة، لا حين تنتهي الصفحة. فالخطوة الهادئة الثابتة تبقى أطول.'
  },
  {
    title: 'Understand what you learn',
    arabicTitle: 'نفهم ما نتعلمه',
    description: 'A verse you understand stays with you. Every rule and every new word comes with its meaning.',
    arabicDescription: 'الآية التي تفهمها تبقى معك. وكل قاعدة وكل كلمة جديدة تأتي ومعها معناها.'
  },
  {
    title: 'A small habit, every week',
    arabicTitle: 'عادة صغيرة كل أسبوع',
    description: 'Half an hour that comes back every week beats a long lesson that never returns. We fit the pace to your life.',
    arabicDescription: 'نصف ساعة تعود إليها كل أسبوع خيرٌ من حصة طويلة لا تعود. ونضبط الإيقاع على حياتك.'
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
    answer: 'Yes. Every lesson is you and your teacher, nobody else; there are no group lessons. You normally keep the same teacher, and you can ask us to change teacher at any time.',
    arabicAnswer: 'نعم. كل حصة لك ولمعلمك فقط، ولا توجد حصص جماعية. وتبقى عادةً مع المعلم نفسه، ويمكنك أن تطلب منا تغيير المعلم في أي وقت.',
    category: 'general'
  },
  {
    question: 'Will my teacher change?',
    arabicQuestion: 'هل سيتغيّر معلّمي؟',
    answer: 'Not from our side. Your teacher stays with you lesson after lesson; you can still ask for a change at any time. If a teacher ever has to leave, we tell you two months ahead, and the next teacher receives your full file, so nobody starts from zero.',
    arabicAnswer: 'لا، ليس من جهتنا. يبقى معلّمك معك حصةً بعد حصة، ويمكنك أن تطلب التغيير متى شئت. وإن اضطر معلّم يومًا إلى المغادرة، نخبرك قبلها بشهرين، ويستلم المعلّم التالي ملفك كاملًا، فلا يبدأ أحد من الصفر.',
    category: 'general'
  },
  {
    question: 'How does the free trial work?',
    arabicQuestion: 'كيف تكون الحصة التجريبية المجانية؟',
    answer: 'It is a free 30-minute lesson on Zoom (up to 45 if needed), one per new student. Your teacher gets to know your goal, finds your level with simple exercises and teaches a short real lesson, then suggests a plan. No card, no pressure. You can move it once, up to 1 hour before; if it is missed or cancelled, you can book again after 48 hours.',
    arabicAnswer: 'حصة مجانية على Zoom مدتها ٣٠ دقيقة (وقد تصل إلى ٤٥ عند الحاجة)، واحدة لكل طالب جديد. يتعرّف معلمك على هدفك، ويعرف مستواك بتمارين بسيطة، ويشرح لك درسًا قصيرًا حقيقيًا، ثم يقترح عليك خطة. بلا بطاقة وبلا أي ضغط. يمكنك تغيير موعدها مرة واحدة حتى ساعة قبلها، وإن فاتتك أو أُلغيت يمكنك الحجز من جديد بعد ٤٨ ساعة.',
    category: 'trial'
  },
  {
    question: 'Can I choose a female teacher?',
    arabicQuestion: 'أقدر أختار معلّمة؟',
    answer: 'Yes. When you set up your learning profile you choose a male or a female teacher, for yourself or for each child. Many families choose a female teacher for their daughters, and you can ask us to change teacher at any time.',
    arabicAnswer: 'نعم. عند إعداد ملفك التعليمي تختار معلّمًا أو معلّمة، لك أو لكل طفل من أطفالك. كثير من الأسر تختار معلّمة لبناتها، ويمكنك أن تطلب منا تغيير المعلم في أي وقت.',
    category: 'general'
  },
  {
    question: 'What is the cancellation and rescheduling policy?',
    arabicQuestion: 'أقدر ألغي أو أغيّر ميعاد الحصة؟',
    answer: 'You can cancel up to 3 hours before (a paid lesson comes back as a lesson credit) and move it yourself up to 1 hour before, to tomorrow or later. In the last hour nothing can change; for a real emergency, message us on WhatsApp.',
    arabicAnswer: 'يمكنك إلغاء الحصة حتى ٣ ساعات قبل موعدها (وتعود الحصة المدفوعة إليك رصيدًا)، وتغيير موعدها بنفسك من حسابك حتى ساعة قبلها، إلى أي يوم من الغد فصاعدًا. في الساعة الأخيرة لا يمكن التغيير؛ وإن طرأ ظرف طارئ فعلًا، راسلنا على واتساب.',
    category: 'booking'
  },
  {
    question: 'What happens if we miss a lesson?',
    arabicQuestion: 'ماذا يحدث إن فاتتنا حصة؟',
    answer: 'We send reminders before every lesson, by email and on the site. A lesson that is missed without cancelling counts as taken, so cancel or move it in time if plans change. If a real emergency comes up, message us on WhatsApp and we will see what we can do. If we or the teacher cancel, you choose a free new time, a lesson credit or a refund, and your next lesson gets 10 extra minutes.',
    arabicAnswer: 'نذكّرك قبل كل حصة بالبريد وعلى الموقع. الحصة التي تفوت دون إلغاء تُحتسب كأنها أُخذت، فإن تغيّرت ظروفك ألغِها أو غيّر موعدها في الوقت المناسب. وإن طرأ ظرف طارئ فعلًا راسلنا على واتساب ونرى ما يمكننا فعله. وإن ألغينا نحن أو المعلم الحصة، تختار أنت موعدًا جديدًا مجانًا أو رصيد حصة أو استرداد المبلغ، وتزيد حصتك التالية ١٠ دقائق.',
    category: 'booking'
  },
  {
    question: 'How will I know how my child is doing?',
    arabicQuestion: 'كيف أعرف كيف يتقدّم ابني؟',
    answer: 'After lessons the teacher writes a short summary for the family, with what to practise next. Your account shows where each child is in every subject, and a monthly report you can print. You can also message the teacher and our team any time.',
    arabicAnswer: 'بعد الحصص يكتب المعلم للأسرة ملخصًا قصيرًا وما يتمرّن عليه الطفل بعدها. وفي حسابك ترى أين وصل كل طفل في كل مادة، وتقريرًا شهريًا يمكنك طباعته. ويمكنك مراسلة المعلم وفريقنا في أي وقت.',
    category: 'teaching'
  },
  {
    question: 'Can I manage all my children in one account?',
    arabicQuestion: 'أقدر أتابع كل أولادي من حساب واحد؟',
    answer: 'Yes. A parent opens one family account and adds each child (ages 6 to 17). You book, follow progress and see one family calendar for everyone, and a package for a second child gets 5% off.',
    arabicAnswer: 'نعم. يفتح وليّ الأمر حساب أسرة واحدًا ويضيف كل طفل (من ٦ إلى ١٧ سنة). تحجز وتتابع التقدّم وترى تقويمًا واحدًا للأسرة كلها، وعلى باقة الطفل الثاني خصم ٥٪.',
    category: 'general'
  },
  {
    question: 'I cannot read any Arabic. Can I still start?',
    arabicQuestion: 'لا أعرف قراءة العربية إطلاقًا، هل أستطيع البدء؟',
    answer: 'Of course, and you are not alone. We begin with the very first letter, its shape and its sound, step by step and with patience.',
    arabicAnswer: 'بالتأكيد، ولست وحدك. نبدأ من أول حرف، شكله وصوته، خطوة بخطوة وبصبر.',
    category: 'teaching'
  },
  {
    question: 'How long is a lesson?',
    arabicQuestion: 'كم مدة الحصة؟',
    answer: '30, 45 or 60 minutes. Thirty minutes suits young children and busy days; sixty suits long revision or grammar. Shorter lessons cost the same per minute.',
    arabicAnswer: '٣٠ أو ٤٥ أو ٦٠ دقيقة. الـ٣٠ مناسبة للأطفال والأيام المزحومة، والـ٦٠ للمراجعة الطويلة والنحو. والحصة الأقصر بنفس سعر الدقيقة.',
    category: 'booking'
  },
  {
    question: 'How do I pay?',
    arabicQuestion: 'كيف أدفع؟',
    answer: 'Online through Stripe: card, Apple Pay or PayPal. A paid lesson is confirmed once the payment goes through. The free trial costs nothing.',
    arabicAnswer: 'أونلاين عن طريق Stripe: بطاقة أو Apple Pay أو PayPal. تتأكد الحصة المدفوعة فور إتمام الدفع، والحصة التجريبية مجانية.',
    category: 'booking'
  },
  {
    question: 'How do time zones work?',
    arabicQuestion: 'المواعيد بتوقيت أي بلد؟',
    answer: 'Every time on the site is shown in your own time zone, automatically. No maths needed. Lessons are booked from tomorrow onwards, never for the same day.',
    arabicAnswer: 'تظهر كل المواعيد على الموقع بتوقيت بلدك تلقائيًا، فلا تحتاج إلى حساب فرق الساعات. ويكون الحجز من الغد فصاعدًا، لا في اليوم نفسه.',
    category: 'general'
  },
  {
    question: 'Do I need an account to book?',
    arabicQuestion: 'هل أحتاج إلى حساب لأحجز؟',
    answer: 'Yes, every booking needs a free account, the free trial too. It takes a minute, and it is where you see your lessons, Zoom links and packages, and talk to your teacher.',
    arabicAnswer: 'نعم، كل حجز يحتاج إلى حساب مجاني، حتى الحصة التجريبية. يستغرق دقيقة، ومنه تتابع حصصك وروابط Zoom وباقاتك، وتراسل معلمك.',
    category: 'booking'
  },
  {
    question: 'From what age can my child start?',
    arabicQuestion: 'ابني يقدر يبدأ من سن كام؟',
    answer: 'From 6. A parent opens a family account and adds each child aged 6 to 17. Learners aged 18 and over open their own account.',
    arabicAnswer: 'من ٦ سنوات. يفتح وليّ الأمر حساب أسرة ويضيف كل طفل من ٦ إلى ١٧ سنة، ومن بلغ ١٨ سنة أو أكثر يفتح حسابه بنفسه.',
    category: 'general'
  },
  {
    question: 'Can I get my money back?',
    arabicQuestion: 'أقدر أسترد فلوسي؟',
    answer: 'You can withdraw within 14 days of buying a lesson or a package, and we refund what was not delivered. A paid lesson cancelled in time becomes a lesson credit, or you can ask for a refund on WhatsApp. If we or the teacher cancel, you choose a new time, a credit or a refund. The full rules are in our terms.',
    arabicAnswer: 'يمكنك الانسحاب خلال ١٤ يومًا من شراء الحصة أو الباقة، ونردّ إليك قيمة ما لم تأخذه. والحصة المدفوعة التي تلغيها في الوقت المناسب تعود إليك رصيد حصة، أو تطلب الاسترداد على واتساب. وإن ألغينا نحن أو المعلم، تختار أنت موعدًا جديدًا أو رصيدًا أو استردادًا. والتفاصيل كلها في الشروط.',
    category: 'booking'
  }
];
