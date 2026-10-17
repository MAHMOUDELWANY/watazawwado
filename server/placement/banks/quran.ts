import { q, bi, type SubjectBank } from '../types.js';

// Quran reading, Tajweed (riwayat Hafs 'an 'Asim), memorization and revision.

export const quranReading: SubjectBank = {
  beginner: [
    q('Which letter is this: ب ?', 'ما اسم هذا الحرف: ب ؟', bi(['Baa', 'Taa', 'Thaa', 'Noon'], ['باء', 'تاء', 'ثاء', 'نون']), 'Letter recognition|معرفة الحروف'),
    q('Which letter has three dots above it?', 'أي حرف عليه ثلاث نقاط من فوق؟', ['ث', 'ت', 'ب', 'ن'], 'Letter recognition|معرفة الحروف'),
    q('How many letters are in the Arabic alphabet?', 'كم عدد حروف الهجاء العربية؟', ['28', '24', '30', '26'], 'Alphabet|حروف الهجاء'),
    q('Arabic (and the Quran) is read in which direction?', 'العربية والقرآن بيتقروا من أي اتجاه؟', bi(['Right to left', 'Left to right', 'Top to bottom', 'Either way'], ['من اليمين للشمال', 'من الشمال لليمين', 'من فوق لتحت', 'أي اتجاه']), 'Reading basics|أساسيات القراءة'),
    q('Which letter is this: م ?', 'ما اسم هذا الحرف: م ؟', bi(['Meem', 'Noon', 'Faa', 'Qaaf'], ['ميم', 'نون', 'فاء', 'قاف']), 'Letter recognition|معرفة الحروف')
  ],
  elementary: [
    q('The small mark above a letter that gives an "a" sound is called…', 'العلامة الصغيرة فوق الحرف اللي بتدي صوت "ـَ" اسمها…', bi(['Fatha', 'Kasra', 'Damma', 'Sukoon'], ['الفتحة', 'الكسرة', 'الضمة', 'السكون']), 'Short vowels|الحركات'),
    q('How is بِ read?', 'كيف تُقرأ بِ ؟', ['bi', 'ba', 'bu', 'b'], 'Short vowels|الحركات'),
    q('The mark ـّ (shadda) means the letter is…', 'علامة الشدة ـّ معناها إن الحرف…', bi(['Doubled (pronounced twice)', 'Silent', 'Read long', 'Read with a nasal sound only'], ['مُضعَّف (يُنطق مرتين)', 'لا يُنطق', 'يُمد', 'يُنطق بغنة فقط']), 'Shadda|الشدة'),
    q('Which of these letters does NOT connect to the letter after it?', 'أي حرف من دول ما بيتوصلش بالحرف اللي بعده؟', ['د', 'ب', 'س', 'ل'], 'Joining letters|اتصال الحروف'),
    q('How is the word كَتَبَ read?', 'كيف تُقرأ كلمة كَتَبَ ؟', ['kataba', 'kutiba', 'kitab', 'katbu'], 'Reading words|قراءة الكلمات')
  ],
  intermediate: [
    q('Which three letters make a long vowel (madd)?', 'ما حروف المد الثلاثة؟', ['ا و ي', 'ب ت ث', 'ل م ن', 'ق ط ب'], 'Long vowels|حروف المد'),
    q('Tanween (ـً ـٍ ـٌ) adds which sound at the end of a word?', 'التنوين (ـً ـٍ ـٌ) بيضيف أي صوت في آخر الكلمة؟', bi(['A "n" sound', 'A "m" sound', 'A long "a"', 'No sound'], ['صوت نون', 'صوت ميم', 'مد بالألف', 'لا شيء']), 'Tanween|التنوين'),
    q('In الشَّمْس, the لام is…', 'في كلمة الشَّمْس، اللام…', bi(['Not pronounced (sun letter)', 'Pronounced clearly (moon letter)', 'Doubled', 'Read with a long vowel'], ['لا تُنطق (لام شمسية)', 'تُنطق (لام قمرية)', 'مشددة', 'تُمد']), 'Sun & moon letters|اللام الشمسية والقمرية'),
    q('The round ة at the end of رَحْمَة, when you stop on it, is read as…', 'التاء المربوطة في رَحْمَة لما تقف عليها بتُنطق…', ['هـ', 'ت', 'ن', 'لا تُنطق'], 'Stopping|الوقف'),
    q('How is قَالُوا read?', 'كيف تُقرأ قَالُوا ؟', ['qaaloo', 'qalawa', 'qaluwaa', 'qulu'], 'Reading words|قراءة الكلمات')
  ],
  advanced: [
    q('In the Mushaf, the small sign مـ above a word means…', 'العلامة الصغيرة مـ فوق الكلمة في المصحف معناها…', bi(['A required stop (waqf lazim)', 'Stopping is forbidden', 'Prostration', 'End of a juz'], ['وقف لازم', 'ممنوع الوقف', 'سجدة تلاوة', 'نهاية جزء']), 'Mushaf signs|علامات المصحف'),
    q('The sign لا above a word in the Mushaf means…', 'العلامة لا فوق الكلمة في المصحف معناها…', bi(['Do not stop here', 'You must stop', 'Stopping is better', 'Pause briefly without breath'], ['لا تقف هنا', 'وقف لازم', 'الوقف أولى', 'سكتة لطيفة']), 'Mushaf signs|علامات المصحف'),
    q('How many hizb are in the whole Quran?', 'كم عدد الأحزاب في القرآن كله؟', ['60', '30', '114', '120'], 'Quran structure|تقسيم المصحف'),
    q('A small circle ۟ above a letter (e.g. أُو۟لَٰٓئِكَ) means the letter is…', 'الدائرة الصغيرة ۟ فوق حرف (زي أُو۟لَٰٓئِكَ) معناها إن الحرف…', bi(['Not pronounced at all', 'Read long', 'Read with shadda', 'Read with tanween'], ['لا يُنطق مطلقًا', 'يُمد', 'يُشدد', 'يُنون']), 'Mushaf signs|علامات المصحف'),
    q('When you stop on a word ending with tanween fath (e.g. عَلِيمًا), you read it…', 'لما تقف على كلمة آخرها تنوين فتح (زي عَلِيمًا) تقرأها…', bi(['With a long "aa": ʿaleemaa', 'With "an": ʿaleeman', 'With sukoon: ʿaleem', 'With "un": ʿaleemun'], ['بألف مد: عَلِيمَا', 'بالتنوين: عليمًا', 'بالسكون: عليمْ', 'بالضم: عليمٌ']), 'Stopping|الوقف')
  ]
};

export const tajweed: SubjectBank = {
  beginner: [
    q('Tajweed means…', 'معنى التجويد…', bi(['Reciting each letter correctly from its place with its qualities', 'Reading fast', 'Memorizing the Quran', 'Explaining the meanings'], ['إخراج كل حرف من مخرجه مع إعطائه حقه ومستحقه', 'القراءة بسرعة', 'حفظ القرآن', 'تفسير المعاني']), 'Basics|أساسيات'),
    q('Ghunnah is a sound that comes from…', 'الغنة صوت بيخرج من…', bi(['The nose', 'The throat', 'The lips', 'The chest'], ['الأنف (الخيشوم)', 'الحلق', 'الشفتين', 'الصدر']), 'Ghunnah|الغنة'),
    q('The letters of qalqalah are…', 'حروف القلقلة هي…', ['قطب جد', 'يرملون', 'خص ضغط قظ', 'ء هـ ع ح غ خ'], 'Qalqalah|القلقلة'),
    q('Natural madd (madd tabee‘i) is held for…', 'المد الطبيعي مقداره…', bi(['2 counts', '4 counts', '6 counts', '1 count'], ['حركتان', '4 حركات', '6 حركات', 'حركة واحدة']), 'Madd|المد'),
    q('A noon or meem with shadda (نّ مّ) is read with…', 'النون والميم المشددتان بتُقرأ بـ…', bi(['Ghunnah for 2 counts', 'No ghunnah', 'Qalqalah', 'Madd of 6'], ['غنة بمقدار حركتين', 'بدون غنة', 'قلقلة', 'مد 6 حركات']), 'Ghunnah|الغنة')
  ],
  elementary: [
    q('Rules of noon sakinah and tanween are…', 'أحكام النون الساكنة والتنوين هي…', bi(['Izhar, Idgham, Iqlab, Ikhfa', 'Tafkheem and Tarqeeq', 'Madd and Qasr', 'Qalqalah and Ghunnah'], ['الإظهار والإدغام والإقلاب والإخفاء', 'التفخيم والترقيق', 'المد والقصر', 'القلقلة والغنة']), 'Noon sakinah|النون الساكنة'),
    q('The letters of izhar halqi are…', 'حروف الإظهار الحلقي…', ['ء هـ ع ح غ خ', 'يرملون', 'ب', 'قطب جد'], 'Noon sakinah|النون الساكنة'),
    q('Iqlab happens when noon sakinah or tanween is followed by…', 'الإقلاب يحصل لما ييجي بعد النون الساكنة أو التنوين حرف…', ['ب', 'م', 'ن', 'ل'], 'Noon sakinah|النون الساكنة'),
    q('The letters of idgham are gathered in the word…', 'حروف الإدغام مجموعة في كلمة…', ['يرملون', 'قطب جد', 'خص ضغط قظ', 'أبغ حجك'], 'Noon sakinah|النون الساكنة'),
    q('In مِنْ بَعْدِ, the noon is read with…', 'في مِنْ بَعْدِ النون بتُقرأ بـ…', bi(['Iqlab (turned into a hidden meem)', 'Clear izhar', 'Full idgham', 'Qalqalah'], ['إقلاب (تُقلب ميمًا مخفاة)', 'إظهار', 'إدغام', 'قلقلة']), 'Noon sakinah|النون الساكنة')
  ],
  intermediate: [
    q('Meem sakinah followed by ب is…', 'الميم الساكنة لو بعدها باء حكمها…', bi(['Ikhfa shafawi', 'Izhar shafawi', 'Idgham mithlayn', 'Iqlab'], ['إخفاء شفوي', 'إظهار شفوي', 'إدغام مثلين', 'إقلاب']), 'Meem sakinah|الميم الساكنة'),
    q('Madd muttasil (hamzah after the madd letter in the same word) is…', 'المد المتصل (الهمزة بعد حرف المد في نفس الكلمة) حكمه…', bi(['Obligatory, 4–5 counts', 'Permissible, 2 counts', 'Obligatory, 2 counts', 'Forbidden'], ['واجب، 4 أو 5 حركات', 'جائز، حركتان', 'واجب، حركتان', 'ممنوع']), 'Madd|المد'),
    q('The letters that are always heavy (tafkheem) are…', 'حروف التفخيم الدائم…', ['خص ضغط قظ', 'قطب جد', 'يرملون', 'ء هـ ع ح غ خ'], 'Heavy letters|التفخيم'),
    q('The lam in لفظ الجلالة (الله) is heavy when the letter before it has…', 'لام لفظ الجلالة بتتفخّم لما الحرف اللي قبلها عليه…', bi(['Fatha or damma', 'Kasra', 'Sukoon only', 'Shadda'], ['فتحة أو ضمة', 'كسرة', 'سكون فقط', 'شدة']), 'Heavy letters|التفخيم'),
    q('In مِنْ وَالٍ, the noon is read with…', 'في مِنْ وَالٍ النون بتُقرأ بـ…', bi(['Idgham with ghunnah', 'Idgham without ghunnah', 'Izhar', 'Ikhfa'], ['إدغام بغنة', 'إدغام بغير غنة', 'إظهار', 'إخفاء']), 'Noon sakinah|النون الساكنة')
  ],
  advanced: [
    q('Madd lazim is held for…', 'المد اللازم مقداره…', bi(['6 counts', '2 counts', '4 counts only', '1 count'], ['6 حركات', 'حركتان', '4 حركات فقط', 'حركة واحدة']), 'Madd|المد'),
    q('The main articulation areas (makharij) are…', 'المخارج العامة عددها…', bi(['5: jawf, throat, tongue, lips, nose', '3: throat, tongue, lips', '7', '17'], ['5: الجوف والحلق واللسان والشفتان والخيشوم', '3: الحلق واللسان والشفتان', '7', '17']), 'Makharij|المخارج'),
    q('Idgham mutajanisayn is when two letters…', 'إدغام المتجانسين يكون بين حرفين…', bi(['Share the same makhraj but differ in qualities (e.g. ت ط)', 'Are identical', 'Are close in makhraj', 'Are both throat letters'], ['اتفقا مخرجًا واختلفا صفةً (زي ت و ط)', 'متماثلين', 'متقاربين مخرجًا', 'حلقيين']), 'Idgham|الإدغام'),
    q('Madd ‘arid lis-sukoon (e.g. stopping on الْعَالَمِينَ) may be held for…', 'المد العارض للسكون (زي الوقف على العالمين) يجوز فيه…', bi(['2, 4 or 6 counts', 'Only 2 counts', 'Only 6 counts', '5 counts only'], ['2 أو 4 أو 6 حركات', 'حركتان فقط', '6 حركات فقط', '5 حركات فقط']), 'Madd|المد'),
    q('The ra is light (tarqeeq) in…', 'الراء بتترقّق في…', ['فِرْعَوْنَ', 'رَبِّ', 'قُرْآن', 'مَرْيَمَ'], 'Ra rules|أحكام الراء')
  ]
};

export const quranMemorization: SubjectBank = {
  beginner: [
    q('How many verses are in Surat Al-Fatiha?', 'كم عدد آيات سورة الفاتحة؟', ['7', '5', '6', '8'], 'Short surahs|قصار السور'),
    q('Complete: قُلْ هُوَ اللَّهُ …', 'أكمل: قُلْ هُوَ اللَّهُ …', ['أَحَدٌ', 'الصَّمَدُ', 'رَبِّ النَّاسِ', 'الْفَلَقِ'], 'Recall|الاستحضار'),
    q('Which surah starts with قُلْ أَعُوذُ بِرَبِّ النَّاسِ?', 'أي سورة تبدأ بـ قُلْ أَعُوذُ بِرَبِّ النَّاسِ؟', bi(['An-Nas', 'Al-Falaq', 'Al-Ikhlas', 'Al-Kafirun'], ['الناس', 'الفلق', 'الإخلاص', 'الكافرون']), 'Short surahs|قصار السور'),
    q('How many surahs are in the Quran?', 'كم عدد سور القرآن؟', ['114', '110', '120', '99'], 'Quran structure|تقسيم المصحف'),
    q('Complete: إِنَّا أَعْطَيْنَاكَ …', 'أكمل: إِنَّا أَعْطَيْنَاكَ …', ['الْكَوْثَرَ', 'الْفَتْحَ', 'النَّصْرَ', 'الْقُرْآنَ'], 'Recall|الاستحضار')
  ],
  elementary: [
    q('Juz ‘Amma is juz number…', 'جزء عمّ هو الجزء رقم…', ['30', '29', '1', '28'], 'Quran structure|تقسيم المصحف'),
    q('Which surah comes right after Al-Kawthar?', 'أي سورة بعد سورة الكوثر مباشرة؟', bi(['Al-Kafirun', 'Al-Ma‘un', 'An-Nasr', 'Quraysh'], ['الكافرون', 'الماعون', 'النصر', 'قريش']), 'Surah order|ترتيب السور'),
    q('Complete: وَالْعَصْرِ ۝ إِنَّ الْإِنسَانَ …', 'أكمل: وَالْعَصْرِ ۝ إِنَّ الْإِنسَانَ …', ['لَفِي خُسْرٍ', 'لَكَفُورٌ', 'خُلِقَ هَلُوعًا', 'لَيَطْغَىٰ'], 'Recall|الاستحضار'),
    q('Surat Al-Falaq starts with…', 'سورة الفلق تبدأ بـ…', ['قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', 'قُلْ يَا أَيُّهَا الْكَافِرُونَ', 'إِذَا جَاءَ نَصْرُ اللَّهِ'], 'Recall|الاستحضار'),
    q('How many verses are in Surat Al-Ikhlas?', 'كم عدد آيات سورة الإخلاص؟', ['4', '3', '5', '6'], 'Short surahs|قصار السور')
  ],
  intermediate: [
    q('Ayat al-Kursi is in which surah?', 'آية الكرسي في أي سورة؟', bi(['Al-Baqarah', 'Al ‘Imran', 'An-Nisa', 'Al-Kahf'], ['البقرة', 'آل عمران', 'النساء', 'الكهف']), 'Recall|الاستحضار'),
    q('Surat Al-Mulk is in juz…', 'سورة الملك في الجزء…', ['29', '30', '28', '27'], 'Quran structure|تقسيم المصحف'),
    q('Which surah does not begin with Bismillah?', 'أي سورة لا تبدأ بالبسملة؟', bi(['At-Tawbah', 'Al-Anfal', 'Yunus', 'Hud'], ['التوبة', 'الأنفال', 'يونس', 'هود']), 'Quran structure|تقسيم المصحف'),
    q('Complete Ayat al-Kursi: اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ …', 'أكمل آية الكرسي: اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ …', ['الْحَيُّ الْقَيُّومُ', 'الْعَزِيزُ الْحَكِيمُ', 'الرَّحْمَٰنُ الرَّحِيمُ', 'السَّمِيعُ الْعَلِيمُ'], 'Recall|الاستحضار'),
    q('The longest surah in the Quran is…', 'أطول سورة في القرآن…', bi(['Al-Baqarah', 'Al ‘Imran', 'An-Nisa', 'Al-A‘raf'], ['البقرة', 'آل عمران', 'النساء', 'الأعراف']), 'Quran structure|تقسيم المصحف')
  ],
  advanced: [
    q('Surat Al-Kahf is surah number…', 'سورة الكهف ترتيبها في المصحف…', ['18', '17', '19', '36'], 'Surah order|ترتيب السور'),
    q('Surat Yasin is surah number…', 'سورة يس ترتيبها في المصحف…', ['36', '35', '37', '67'], 'Surah order|ترتيب السور'),
    q('Ayat al-Kursi is verse number… of Al-Baqarah', 'آية الكرسي رقمها في سورة البقرة…', ['255', '256', '286', '152'], 'Recall|الاستحضار'),
    q('How many verses are in Surat Al-Baqarah?', 'كم عدد آيات سورة البقرة؟', ['286', '200', '255', '300'], 'Quran structure|تقسيم المصحف'),
    q('Which surah comes right before Al-Mulk?', 'أي سورة قبل سورة الملك مباشرة؟', bi(['At-Tahrim', 'Al-Qalam', 'At-Talaq', 'Al-Hadid'], ['التحريم', 'القلم', 'الطلاق', 'الحديد']), 'Surah order|ترتيب السور')
  ]
};

export const quranRevision: SubjectBank = {
  beginner: [
    q('Muraja‘ah (revision) means…', 'المراجعة معناها…', bi(['Regularly re-reciting what you memorized', 'Learning a new surah', 'Reading the translation', 'Listening only'], ['تكرار ما حفظته بانتظام', 'حفظ سورة جديدة', 'قراءة الترجمة', 'الاستماع فقط']), 'Revision habits|عادات المراجعة'),
    q('Which surah comes right after Al-Ikhlas?', 'أي سورة بعد الإخلاص مباشرة؟', bi(['Al-Falaq', 'An-Nas', 'Al-Masad', 'Al-Kawthar'], ['الفلق', 'الناس', 'المسد', 'الكوثر']), 'Surah order|ترتيب السور'),
    q('Complete from Al-Fatiha: الْحَمْدُ لِلَّهِ …', 'أكمل من سورة الفاتحة: الْحَمْدُ لِلَّهِ …', ['رَبِّ الْعَالَمِينَ', 'الرَّحْمَٰنِ الرَّحِيمِ', 'مَالِكِ يَوْمِ الدِّينِ', 'الَّذِي خَلَقَ'], 'Recall|الاستحضار'),
    q('Which surah comes right before An-Nas?', 'أي سورة قبل الناس مباشرة؟', bi(['Al-Falaq', 'Al-Ikhlas', 'Al-‘Asr', 'Al-Fil'], ['الفلق', 'الإخلاص', 'العصر', 'الفيل']), 'Surah order|ترتيب السور'),
    q('Complete: إِذَا جَاءَ نَصْرُ اللَّهِ …', 'أكمل: إِذَا جَاءَ نَصْرُ اللَّهِ …', ['وَالْفَتْحُ', 'وَالنَّصْرُ', 'وَالْعَصْرُ', 'وَالْفَجْرُ'], 'Recall|الاستحضار')
  ],
  elementary: [
    q('The best way to keep what you memorized is…', 'أفضل طريقة لتثبيت الحفظ…', bi(['A fixed daily revision portion', 'Revising once a month', 'Only memorizing new parts', 'Reading the translation'], ['ورد مراجعة يومي ثابت', 'مراجعة مرة في الشهر', 'الحفظ الجديد فقط', 'قراءة الترجمة']), 'Revision habits|عادات المراجعة'),
    q('Which surah comes right after Al-Fil?', 'أي سورة بعد الفيل مباشرة؟', bi(['Quraysh', 'Al-Ma‘un', 'Al-Humazah', 'Al-Kawthar'], ['قريش', 'الماعون', 'الهمزة', 'الكوثر']), 'Surah order|ترتيب السور'),
    q('Complete: لِإِيلَافِ …', 'أكمل: لِإِيلَافِ …', ['قُرَيْشٍ', 'النَّاسِ', 'الْفِيلِ', 'الْكَوْثَرِ'], 'Recall|الاستحضار'),
    q('Surat Al-Ma‘un comes right after…', 'سورة الماعون بعد سورة…', bi(['Quraysh', 'Al-Kawthar', 'Al-Fil', 'Al-‘Asr'], ['قريش', 'الكوثر', 'الفيل', 'العصر']), 'Surah order|ترتيب السور'),
    q('Complete: تَبَّتْ يَدَا أَبِي لَهَبٍ …', 'أكمل: تَبَّتْ يَدَا أَبِي لَهَبٍ …', ['وَتَبَّ', 'وَمَا كَسَبَ', 'ذَاتَ لَهَبٍ', 'حَمَّالَةَ الْحَطَبِ'], 'Recall|الاستحضار')
  ],
  intermediate: [
    q('"Mutashabihat" in revision are…', 'المتشابهات في المراجعة هي…', bi(['Verses that look alike and get mixed up', 'Verses with prostration', 'The longest verses', 'Verses about stories'], ['آيات متشابهة الألفاظ بتلتبس على الحافظ', 'آيات السجدة', 'أطول الآيات', 'آيات القصص']), 'Revision habits|عادات المراجعة'),
    q('Which surah comes right after An-Naba’?', 'أي سورة بعد النبأ مباشرة؟', bi(['An-Nazi‘at', '‘Abasa', 'At-Takwir', 'Al-Infitar'], ['النازعات', 'عبس', 'التكوير', 'الانفطار']), 'Surah order|ترتيب السور'),
    q('Complete: عَمَّ يَتَسَاءَلُونَ ۝ عَنِ …', 'أكمل: عَمَّ يَتَسَاءَلُونَ ۝ عَنِ …', ['النَّبَإِ الْعَظِيمِ', 'السَّاعَةِ', 'الْيَوْمِ الْآخِرِ', 'الْحَقِّ'], 'Recall|الاستحضار'),
    q('Juz 29 starts with which surah?', 'الجزء 29 بيبدأ بأي سورة؟', bi(['Al-Mulk', 'Al-Qalam', 'An-Naba’', 'Al-Hadid'], ['الملك', 'القلم', 'النبأ', 'الحديد']), 'Quran structure|تقسيم المصحف'),
    q('Which surah comes right after Al-Mulk?', 'أي سورة بعد الملك مباشرة؟', bi(['Al-Qalam', 'Al-Haqqah', 'At-Tahrim', 'Nuh'], ['القلم', 'الحاقة', 'التحريم', 'نوح']), 'Surah order|ترتيب السور')
  ],
  advanced: [
    q('Juz 30 starts with which surah?', 'الجزء 30 بيبدأ بأي سورة؟', bi(['An-Naba’', 'Al-Mulk', 'Al-A‘la', 'Al-Fajr'], ['النبأ', 'الملك', 'الأعلى', 'الفجر']), 'Quran structure|تقسيم المصحف'),
    q('Which surah comes right after Al-Kahf?', 'أي سورة بعد الكهف مباشرة؟', bi(['Maryam', 'Ta-Ha', 'Al-Isra’', 'Al-Anbiya’'], ['مريم', 'طه', 'الإسراء', 'الأنبياء']), 'Surah order|ترتيب السور'),
    q('Which surah comes right before Yasin?', 'أي سورة قبل يس مباشرة؟', bi(['Fatir', 'As-Saffat', 'Saba’', 'Sad'], ['فاطر', 'الصافات', 'سبأ', 'ص']), 'Surah order|ترتيب السور'),
    q('A good method to fix mutashabihat is…', 'من أفضل طرق ضبط المتشابهات…', bi(['Noting the differences and revising them together', 'Skipping them', 'Reading faster', 'Revising them once a year'], ['تدوين الفروق ومراجعة المتشابه معًا', 'تجاوزها', 'القراءة بسرعة أكبر', 'مراجعتها مرة في السنة']), 'Revision habits|عادات المراجعة'),
    q('How many juz are in the Quran?', 'كم عدد أجزاء القرآن؟', ['30', '60', '114', '40'], 'Quran structure|تقسيم المصحف')
  ]
};
