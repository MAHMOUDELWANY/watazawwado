import { q, bi, type SubjectBank } from '../types.js';

// Arabic (foundations, Modern Standard Arabic, conversation, Egyptian) and English.

export const arabicFoundations: SubjectBank = {
  beginner: [
    q('Which letter is this: ع ?', 'ما اسم هذا الحرف: ع ؟', bi(['‘Ayn', 'Ghayn', 'Haa', 'Faa'], ['عين', 'غين', 'حاء', 'فاء']), 'Letters|الحروف'),
    q('Which of these is the letter Seen?', 'أي حرف من دول هو السين؟', ['س', 'ش', 'ص', 'ض'], 'Letters|الحروف'),
    q('Which two letters differ only by a dot: ح and…', 'حرف بيختلف عن ح بنقطة فقط:', ['خ', 'ع', 'هـ', 'د'], 'Letters|الحروف'),
    q('Arabic is written…', 'العربية بتتكتب…', bi(['From right to left', 'From left to right', 'From top to bottom', 'In either direction'], ['من اليمين للشمال', 'من الشمال لليمين', 'من فوق لتحت', 'أي اتجاه']), 'Writing|الكتابة'),
    q('What sound does the letter م make?', 'صوت حرف م…', ['m', 'n', 'b', 'f'], 'Sounds|الأصوات')
  ],
  elementary: [
    q('How is بَابٌ read?', 'كيف تُقرأ بَابٌ ؟', ['baabun', 'bibun', 'babu', 'bubaa'], 'Reading|القراءة'),
    q('The word كِتَاب means…', 'كلمة كِتَاب معناها…', ['📖 Book', '✏️ Pen', '🏠 House', '🚪 Door'], 'Vocabulary|المفردات'),
    q('The form of ع at the start of a word looks like…', 'شكل حرف العين في أول الكلمة…', ['عـ', 'ـعـ', 'ـع', 'ع'], 'Letter forms|أشكال الحروف'),
    q('Which word starts with a "sun letter" (the ل is silent)?', 'أي كلمة بتبدأ بحرف شمسي (اللام ما بتتنطقش)؟', ['الشَّمْس', 'الْقَمَر', 'الْكِتَاب', 'الْبَاب'], 'Sun & moon letters|الشمسية والقمرية'),
    q('The word قَلَم means…', 'كلمة قَلَم معناها…', ['✏️ Pen', '📖 Book', '🚪 Door', '🪑 Chair'], 'Vocabulary|المفردات')
  ],
  intermediate: [
    q('Choose the correct sentence:', 'اختار الجملة الصحيحة:', ['هَذَا بَيْتٌ كَبِيرٌ', 'هَذِهِ بَيْتٌ كَبِيرٌ', 'هَذَا بَيْتٌ كَبِيرَةٌ', 'هَذِهِ بَيْتٌ كَبِيرَةٌ'], 'Gender agreement|التذكير والتأنيث'),
    q('The feminine of طَالِب is…', 'مؤنث طَالِب…', ['طَالِبَة', 'طُلَّاب', 'طَالِبُونَ', 'طَلَب'], 'Gender|التذكير والتأنيث'),
    q('The plural of وَلَد is…', 'جمع وَلَد…', ['أَوْلَاد', 'وَلَدَات', 'وُلُود', 'وَلَدُونَ'], 'Plurals|الجمع'),
    q('Complete: أَنَا ___ عَرَبِيًّا (I speak Arabic)', 'أكمل: أَنَا ___ عَرَبِيًّا', ['أَتَكَلَّمُ', 'تَتَكَلَّمُ', 'يَتَكَلَّمُ', 'نَتَكَلَّمُ'], 'Verbs|الأفعال'),
    q('The word مَدْرَسَة means…', 'كلمة مَدْرَسَة معناها…', ['🏫 School', '🧑‍🏫 Teacher', '📝 Lesson', '🎒 Student'], 'Vocabulary|المفردات')
  ],
  advanced: [
    q('Choose the correct sentence:', 'اختار الجملة الصحيحة:', ['ذَهَبَتِ الْبِنْتُ إِلَى الْمَدْرَسَةِ', 'ذَهَبَ الْبِنْتُ إِلَى الْمَدْرَسَةِ', 'ذَهَبَتِ الْبِنْتَ إِلَى الْمَدْرَسَةُ', 'ذَهَبْتُ الْبِنْتُ إِلَى الْمَدْرَسَةِ'], 'Sentences|الجمل'),
    q('The dual of كِتَاب (subject case) is…', 'المثنى من كِتَاب (في حالة الرفع)…', ['كِتَابَانِ', 'كُتُب', 'كِتَابِينَ', 'كِتَابَات'], 'Dual|المثنى'),
    q('The past tense of يَكْتُبُ is…', 'الماضي من يَكْتُبُ…', ['كَتَبَ', 'اُكْتُبْ', 'كِتَابَة', 'مَكْتُوب'], 'Verbs|الأفعال'),
    q('Which word means "yesterday"?', 'أي كلمة معناها "yesterday"؟', ['أَمْسِ', 'غَدًا', 'الْيَوْمَ', 'الْآنَ'], 'Vocabulary|المفردات'),
    q('In "الكتابُ على المكتبِ", the word على is a…', 'في "الكتابُ على المكتبِ" كلمة على هي…', bi(['Preposition', 'Verb', 'Noun', 'Pronoun'], ['حرف جر', 'فعل', 'اسم', 'ضمير']), 'Grammar|القواعد')
  ]
};

export const modernStandardArabic: SubjectBank = {
  beginner: [
    q('Choose the correct meaning of بَيْت:', 'معنى كلمة بَيْت:', ['🏠 House', '🚗 Car', '🛣️ Street', '🏙️ City'], 'Vocabulary|المفردات'),
    q('Which is a verb?', 'أي كلمة فعل؟', ['كَتَبَ', 'كِتَاب', 'مِنْ', 'هُوَ'], 'Parts of speech|أقسام الكلام'),
    q('The pronoun for "she" is…', 'ضمير "she" هو…', ['هِيَ', 'هُوَ', 'أَنْتَ', 'نَحْنُ'], 'Pronouns|الضمائر'),
    q('Which is a preposition (حرف جر)?', 'أي كلمة حرف جر؟', ['فِي', 'ذَهَبَ', 'وَلَد', 'جَمِيل'], 'Parts of speech|أقسام الكلام'),
    q('"How are you?" in Fusha is…', '"How are you?" بالفصحى…', ['كَيْفَ حَالُكَ؟', 'إِزَّيَّك؟', 'شْلُونَك؟', 'كِيفَك؟'], 'Expressions|التعبيرات')
  ],
  elementary: [
    q('The words of speech in Arabic are three kinds:', 'الكلمة في العربية ثلاثة أنواع:', bi(['Noun, verb, particle', 'Subject, object, verb', 'Past, present, future', 'Singular, dual, plural'], ['اسم وفعل وحرف', 'فاعل ومفعول وفعل', 'ماضٍ ومضارع وأمر', 'مفرد ومثنى وجمع']), 'Parts of speech|أقسام الكلام'),
    q('In "قَرَأَ الطَّالِبُ الدَّرْسَ", the subject (فاعل) is…', 'في "قَرَأَ الطَّالِبُ الدَّرْسَ" الفاعل هو…', ['الطَّالِبُ', 'الدَّرْسَ', 'قَرَأَ', 'لا يوجد'], 'Sentence roles|الإعراب'),
    q('The object (مفعول به) is usually…', 'المفعول به حكمه…', bi(['Mansub (accusative)', 'Marfu‘ (nominative)', 'Majrur (genitive)', 'Majzum'], ['منصوب', 'مرفوع', 'مجرور', 'مجزوم']), 'Case endings|الإعراب'),
    q('A noun after a preposition is…', 'الاسم بعد حرف الجر…', bi(['Majrur (genitive)', 'Marfu‘', 'Mansub', 'Majzum'], ['مجرور', 'مرفوع', 'منصوب', 'مجزوم']), 'Case endings|الإعراب'),
    q('Choose the correct sentence:', 'اختار الجملة الصحيحة:', ['الطَّالِبَاتُ مُجْتَهِدَاتٌ', 'الطَّالِبَاتُ مُجْتَهِدُونَ', 'الطَّالِبَاتُ مُجْتَهِدٌ', 'الطَّالِبَاتُ مُجْتَهِدَانِ'], 'Agreement|المطابقة')
  ],
  intermediate: [
    q('كان and its sisters make the predicate (خبر)…', 'كان وأخواتها تجعل الخبر…', bi(['Mansub', 'Marfu‘', 'Majrur', 'Unchanged'], ['منصوبًا', 'مرفوعًا', 'مجرورًا', 'كما هو']), 'Kana & sisters|كان وأخواتها'),
    q('إنّ and its sisters make the subject (اسمها)…', 'إنّ وأخواتها تجعل اسمها…', bi(['Mansub', 'Marfu‘', 'Majrur', 'Majzum'], ['منصوبًا', 'مرفوعًا', 'مجرورًا', 'مجزومًا']), 'Inna & sisters|إن وأخواتها'),
    q('Correct: كَانَ الْجَوُّ ___', 'الصحيح: كَانَ الْجَوُّ ___', ['جَمِيلًا', 'جَمِيلٌ', 'جَمِيلٍ', 'جَمِيلُ'], 'Kana & sisters|كان وأخواتها'),
    q('Correct: إِنَّ ___ رَحِيمٌ', 'الصحيح: إِنَّ ___ رَحِيمٌ', ['اللَّهَ', 'اللَّهُ', 'اللَّهِ', 'اللَّهْ'], 'Inna & sisters|إن وأخواتها'),
    q('The plural مَسَاجِد is a…', 'كلمة مَسَاجِد جمع…', bi(['Broken plural', 'Sound masculine plural', 'Sound feminine plural', 'Dual'], ['تكسير', 'مذكر سالم', 'مؤنث سالم', 'مثنى']), 'Plurals|الجمع')
  ],
  advanced: [
    q('The sound masculine plural in the accusative/genitive ends in…', 'جمع المذكر السالم في النصب والجر بينتهي بـ…', ['ـِينَ', 'ـُونَ', 'ـَانِ', 'ـَاتٌ'], 'Case endings|الإعراب'),
    q('After لَمْ the present verb is…', 'الفعل المضارع بعد لَمْ…', bi(['Majzum', 'Mansub', 'Marfu‘', 'Majrur'], ['مجزوم', 'منصوب', 'مرفوع', 'مجرور']), 'Verb moods|إعراب الفعل'),
    q('After لَنْ the present verb is…', 'الفعل المضارع بعد لَنْ…', bi(['Mansub', 'Majzum', 'Marfu‘', 'Majrur'], ['منصوب', 'مجزوم', 'مرفوع', 'مجرور']), 'Verb moods|إعراب الفعل'),
    q('In "كِتَابُ الطَّالِبِ", the word الطالبِ is…', 'في "كِتَابُ الطَّالِبِ" كلمة الطالبِ…', bi(['Mudaf ilayh (majrur)', 'Na‘t (adjective)', 'Fa‘il', 'Maf‘ul bihi'], ['مضاف إليه مجرور', 'نعت', 'فاعل', 'مفعول به']), 'Idafa|الإضافة'),
    q('The ḥāl (circumstantial) in "جَاءَ الطِّفْلُ مُبْتَسِمًا" is…', 'الحال في "جَاءَ الطِّفْلُ مُبْتَسِمًا"…', ['مُبْتَسِمًا', 'الطِّفْلُ', 'جَاءَ', 'لا يوجد'], 'Grammar|النحو')
  ]
};

export const arabicConversation: SubjectBank = {
  beginner: [
    q('The reply to "السَّلَامُ عَلَيْكُمْ" is…', 'الرد على "السَّلَامُ عَلَيْكُمْ"…', ['وَعَلَيْكُمُ السَّلَامُ', 'صَبَاحُ النُّورِ', 'شُكْرًا', 'مَعَ السَّلَامَةِ'], 'Greetings|التحية'),
    q('"Thank you" in Arabic is…', '"Thank you" بالعربي…', ['شُكْرًا', 'عَفْوًا', 'مِنْ فَضْلِكَ', 'نَعَمْ'], 'Polite words|كلمات اللطف'),
    q('"What is your name?" is…', '"What is your name?" هي…', ['مَا اسْمُكَ؟', 'مِنْ أَيْنَ أَنْتَ؟', 'كَمْ عُمْرُكَ؟', 'أَيْنَ تَسْكُنُ؟'], 'Introductions|التعارف'),
    q('The reply to "صَبَاحُ الْخَيْرِ" is…', 'الرد على "صَبَاحُ الْخَيْرِ"…', ['صَبَاحُ النُّورِ', 'مَسَاءُ الْخَيْرِ', 'تُصْبِحُ عَلَى خَيْرٍ', 'أَهْلًا'], 'Greetings|التحية'),
    q('"نَعَمْ" means…', '"نَعَمْ" معناها…', ['👍 Yes', '👎 No', '🤷 Maybe', '🙏 Please'], 'Basics|الأساسيات')
  ],
  elementary: [
    q('"How much is this?" is…', '"How much is this?" هي…', ['بِكَمْ هَذَا؟', 'مَا هَذَا؟', 'أَيْنَ هَذَا؟', 'لِمَنْ هَذَا؟'], 'Shopping|التسوق'),
    q('"Where is the mosque?" is…', '"Where is the mosque?" هي…', ['أَيْنَ الْمَسْجِدُ؟', 'مَتَى الْمَسْجِدُ؟', 'كَيْفَ الْمَسْجِدُ؟', 'مَنِ الْمَسْجِدُ؟'], 'Directions|الاتجاهات'),
    q('The day after الْأَحَد is…', 'اليوم اللي بعد الأحد…', ['الِاثْنَيْن', 'السَّبْت', 'الثُّلَاثَاء', 'الْجُمُعَة'], 'Days|الأيام'),
    q('"I am from America" is…', '"I am from America" هي…', ['أَنَا مِنْ أَمْرِيكَا', 'أَنَا فِي أَمْرِيكَا', 'أَنَا إِلَى أَمْرِيكَا', 'أَنَا عَنْ أَمْرِيكَا'], 'Introductions|التعارف'),
    q('The reply to "شُكْرًا" is usually…', 'الرد على "شُكْرًا" عادةً…', ['عَفْوًا', 'شُكْرًا', 'نَعَمْ', 'إِلَى اللِّقَاءِ'], 'Polite words|كلمات اللطف')
  ],
  intermediate: [
    q('"In my opinion…" is…', '"In my opinion…" هي…', ['فِي رَأْيِي…', 'فِي بَيْتِي…', 'مِنْ فَضْلِي…', 'عَلَى رَأْسِي…'], 'Expressing opinions|التعبير عن الرأي'),
    q('Choose the best reply: هَلْ تُحِبُّ الْقَهْوَةَ؟', 'اختار أفضل رد: هَلْ تُحِبُّ الْقَهْوَةَ؟', ['نَعَمْ، أُحِبُّهَا كَثِيرًا', 'نَعَمْ، أُحِبُّهُ كَثِيرًا', 'لَا، أُحِبُّ كَثِيرًا', 'نَعَمْ، تُحِبُّهَا'], 'Answering questions|الرد على الأسئلة'),
    q('"I would like to book an appointment" is…', '"I would like to book an appointment" هي…', ['أُرِيدُ أَنْ أَحْجِزَ مَوْعِدًا', 'أُرِيدُ مَوْعِدًا حَجَزَ', 'حَجَزْتُ أَنْ أُرِيدَ', 'أُرِيدُ الْحَجْزَ مَوْعِدٌ'], 'Daily situations|مواقف يومية'),
    q('"I don\'t understand, please repeat" is…', '"I don\'t understand, please repeat" هي…', ['لَمْ أَفْهَمْ، أَعِدْ مِنْ فَضْلِكَ', 'فَهِمْتُ، شُكْرًا', 'لَا أَعْرِفُ الطَّرِيقَ', 'أَنَا مَشْغُولٌ الْآنَ'], 'Daily situations|مواقف يومية'),
    q('"Yesterday I went to the market" is…', '"Yesterday I went to the market" هي…', ['أَمْسِ ذَهَبْتُ إِلَى السُّوقِ', 'غَدًا ذَهَبْتُ إِلَى السُّوقِ', 'أَمْسِ أَذْهَبُ إِلَى السُّوقِ', 'أَمْسِ سَأَذْهَبُ إِلَى السُّوقِ'], 'Past tense|الماضي')
  ],
  advanced: [
    q('Which connector means "however"?', 'أي أداة ربط معناها "however"؟', ['وَمَعَ ذَلِكَ', 'لِذَلِكَ', 'بِالْإِضَافَةِ إِلَى', 'لِأَنَّ'], 'Connectors|أدوات الربط'),
    q('"I agree with you to some extent" is…', '"I agree with you to some extent" هي…', ['أَتَّفِقُ مَعَكَ إِلَى حَدٍّ مَا', 'أَخْتَلِفُ مَعَكَ تَمَامًا', 'لَا أَعْرِفُكَ', 'أَنَا مُتَّفِقٌ غَدًا'], 'Discussion|المناقشة'),
    q('The most polite way to interrupt is…', 'أكثر طريقة مهذبة للمقاطعة…', ['اِسْمَحْ لِي أَنْ أُضِيفَ شَيْئًا', 'اُسْكُتْ', 'لَا، لَا', 'أَنَا أَتَكَلَّمُ'], 'Discussion|المناقشة'),
    q('"As a result" in formal speech is…', '"As a result" في الكلام الرسمي…', ['وَنَتِيجَةً لِذَلِكَ', 'وَقَبْلَ ذَلِكَ', 'وَعَلَى الرَّغْمِ', 'وَأَحْيَانًا'], 'Connectors|أدوات الربط'),
    q('"Could you explain more?" (polite) is…', '"Could you explain more?" بأدب…', ['هَلْ يُمْكِنُكَ أَنْ تُوَضِّحَ أَكْثَرَ؟', 'وَضِّحْ!', 'لِمَاذَا تَتَكَلَّمُ؟', 'مَا هَذَا الْكَلَامُ؟'], 'Discussion|المناقشة')
  ]
};

export const egyptianArabic: SubjectBank = {
  beginner: [
    q('"عايز" in Egyptian means…', '"عايز" بالمصري معناها…', bi(['I want', 'I know', 'I go', 'I have'], ['أريد', 'أعرف', 'أذهب', 'عندي']), 'Vocabulary|المفردات'),
    q('"How are you?" in Egyptian is…', '"How are you?" بالمصري…', ['إزيك؟', 'شلونك؟', 'كيفك؟', 'واش راك؟'], 'Greetings|التحية'),
    q('"فين" means…', '"فين" معناها…', bi(['Where', 'When', 'Why', 'Who'], ['أين', 'متى', 'لماذا', 'من']), 'Question words|أدوات الاستفهام'),
    q('"دلوقتي" means…', '"دلوقتي" معناها…', bi(['Now', 'Tomorrow', 'Later', 'Yesterday'], ['الآن', 'غدًا', 'لاحقًا', 'أمس']), 'Vocabulary|المفردات'),
    q('"أيوه" means…', '"أيوه" معناها…', bi(['Yes', 'No', 'Maybe', 'Thanks'], ['نعم', 'لا', 'ربما', 'شكرًا']), 'Vocabulary|المفردات')
  ],
  elementary: [
    q('"إمتى" means…', '"إمتى" معناها…', bi(['When', 'Where', 'How', 'What'], ['متى', 'أين', 'كيف', 'ماذا']), 'Question words|أدوات الاستفهام'),
    q('"I don\'t know" in Egyptian is…', '"I don\'t know" بالمصري…', ['مش عارف', 'لا أعرفُ', 'ما بعرف', 'ما أدري'], 'Negation|النفي'),
    q('"بكام ده؟" means…', '"بكام ده؟" معناها…', bi(['How much is this?', 'What is this?', 'Where is this?', 'Whose is this?'], ['بكم هذا؟', 'ما هذا؟', 'أين هذا؟', 'لمن هذا؟']), 'Shopping|التسوق'),
    q('"عشان" means…', '"عشان" معناها…', bi(['Because / so that', 'But', 'Then', 'Maybe'], ['لأن / لكي', 'لكن', 'ثم', 'ربما']), 'Connectors|أدوات الربط'),
    q('"كويس" means…', '"كويس" معناها…', bi(['Good', 'Bad', 'Big', 'Far'], ['جيد', 'سيئ', 'كبير', 'بعيد']), 'Vocabulary|المفردات')
  ],
  intermediate: [
    q('"هروح" means…', '"هروح" معناها…', bi(['I will go', 'I went', 'I am going now', 'Go!'], ['سأذهب', 'ذهبتُ', 'أذهب الآن', 'اذهب!']), 'Future tense|المستقبل'),
    q('"بيكتب" means…', '"بيكتب" معناها…', bi(['He is writing / he writes', 'He wrote', 'He will write', 'Write!'], ['يكتب (الآن أو عادةً)', 'كتب', 'سيكتب', 'اكتب!']), 'Present tense|المضارع'),
    q('"I didn\'t eat" in Egyptian is…', '"I didn\'t eat" بالمصري…', ['ما كلتش', 'مش باكل', 'لم آكل', 'مش هاكل'], 'Negation|النفي'),
    q('"لسه" in "لسه ما وصلتش" means…', '"لسه" في "لسه ما وصلتش" معناها…', bi(['Not yet', 'Already', 'Never', 'Soon'], ['حتى الآن لم', 'بالفعل', 'أبدًا', 'قريبًا']), 'Expressions|التعبيرات'),
    q('"خلاص" usually means…', '"خلاص" غالبًا معناها…', bi(['That’s it / done / okay', 'Hello', 'Thank you', 'Please'], ['انتهى / تمام', 'مرحبًا', 'شكرًا', 'من فضلك']), 'Expressions|التعبيرات')
  ],
  advanced: [
    q('"على فكرة" means…', '"على فكرة" معناها…', bi(['By the way', 'In my opinion', 'Of course', 'Never mind'], ['بالمناسبة', 'في رأيي', 'بالطبع', 'لا يهم']), 'Expressions|التعبيرات'),
    q('"معلش" is used to…', '"معلش" بتتقال عشان…', bi(['Apologise or comfort (never mind / sorry)', 'Say goodbye', 'Agree strongly', 'Ask a price'], ['الاعتذار أو المواساة', 'الوداع', 'الموافقة الشديدة', 'السؤال عن السعر']), 'Expressions|التعبيرات'),
    q('"I was going to call you" in Egyptian is…', '"I was going to call you" بالمصري…', ['كنت هكلمك', 'هكلمك بكره', 'كلمتك امبارح', 'بكلمك دلوقتي'], 'Tenses|الأزمنة'),
    q('"ولا يهمك" means…', '"ولا يهمك" معناها…', bi(['Don’t worry about it', 'You don’t care', 'Who cares', 'It is important'], ['لا تقلق / ولا يهمك', 'أنت لا تهتم', 'من يهتم', 'إنه مهم']), 'Expressions|التعبيرات'),
    q('"He keeps saying" in Egyptian is…', '"He keeps saying" بالمصري…', ['فضل يقول', 'قال مرة', 'هيقول', 'ما قالش'], 'Expressions|التعبيرات')
  ]
};

export const english: SubjectBank = {
  beginner: [
    q('Choose the correct word: "She ___ a student."', 'اختار الكلمة الصحيحة: "She ___ a student."', ['is', 'are', 'am', 'be'], 'Verb to be|فعل الكينونة'),
    q('Choose the correct word: "I have two ___."', 'اختار الكلمة الصحيحة: "I have two ___."', ['books', 'book', 'bookes', 'a book'], 'Plurals|الجمع'),
    q('The opposite of "big" is…', 'عكس "big"…', ['small', 'tall', 'long', 'fast'], 'Vocabulary|المفردات'),
    q('"Good morning" is said…', 'بنقول "Good morning"…', bi(['In the morning', 'At night', 'When leaving', 'Before sleeping'], ['الصبح', 'بالليل', 'وإحنا ماشيين', 'قبل النوم']), 'Greetings|التحية'),
    q('Choose the correct word: "This is ___ apple."', 'اختار الكلمة الصحيحة: "This is ___ apple."', ['an', 'a', 'the a', 'two'], 'Articles|أدوات التعريف والتنكير')
  ],
  elementary: [
    q('Choose: "He ___ to school every day."', 'اختار: "He ___ to school every day."', ['goes', 'go', 'going', 'gone'], 'Present simple|المضارع البسيط'),
    q('The past of "go" is…', 'الماضي من "go"…', ['went', 'goed', 'gone', 'going'], 'Past simple|الماضي البسيط'),
    q('Choose: "There ___ many people here."', 'اختار: "There ___ many people here."', ['are', 'is', 'be', 'am'], 'There is/are|There is/are'),
    q('Choose: "I am good ___ English."', 'اختار: "I am good ___ English."', ['at', 'in', 'on', 'for'], 'Prepositions|حروف الجر'),
    q('Choose: "___ you like tea?"', 'اختار: "___ you like tea?"', ['Do', 'Does', 'Are', 'Is'], 'Questions|الأسئلة')
  ],
  intermediate: [
    q('Choose: "I ___ in London since 2019."', 'اختار: "I ___ in London since 2019."', ['have lived', 'live', 'lived', 'am living'], 'Present perfect|المضارع التام'),
    q('Choose: "If it rains, I ___ at home."', 'اختار: "If it rains, I ___ at home."', ['will stay', 'stayed', 'would stayed', 'stay will'], 'Conditionals|الجمل الشرطية'),
    q('Choose: "The letter ___ yesterday."', 'اختار: "The letter ___ yesterday."', ['was sent', 'sent', 'is send', 'has sent'], 'Passive voice|المبني للمجهول'),
    q('Choose: "She is ___ than her sister."', 'اختار: "She is ___ than her sister."', ['taller', 'more tall', 'tallest', 'tall'], 'Comparatives|المقارنة'),
    q('"Look forward to" is followed by…', 'بعد "look forward to" بييجي…', bi(['A noun or -ing form', 'The base verb', 'A past verb', 'An infinitive with "to"'], ['اسم أو فعل بـ ing', 'الفعل المجرد', 'فعل ماضي', 'to + فعل']), 'Grammar patterns|تراكيب')
  ],
  advanced: [
    q('Choose: "If I ___ you, I would accept the offer."', 'اختار: "If I ___ you, I would accept the offer."', ['were', 'am', 'will be', 'have been'], 'Conditionals|الجمل الشرطية'),
    q('Choose: "Hardly ___ arrived when it started to rain."', 'اختار: "Hardly ___ arrived when it started to rain."', ['had we', 'we had', 'we have', 'did we'], 'Inversion|التقديم والتأخير'),
    q('Reported speech: He said, "I am tired." → He said that he ___ tired.', 'الكلام المنقول: He said, "I am tired." → He said that he ___ tired.', ['was', 'is', 'has', 'were'], 'Reported speech|الكلام المنقول'),
    q('Choose the best word: "The results were ___; nobody expected them."', 'اختار أفضل كلمة: "The results were ___; nobody expected them."', ['unprecedented', 'predictable', 'ordinary', 'usual'], 'Advanced vocabulary|مفردات متقدمة'),
    q('Choose: "By next year, she ___ her degree."', 'اختار: "By next year, she ___ her degree."', ['will have finished', 'finishes', 'has finished', 'finished'], 'Future perfect|المستقبل التام')
  ]
};
