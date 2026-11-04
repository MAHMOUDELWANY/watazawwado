import { q, bi, type BankQuestion, type Level } from './types.js';

/**
 * Placement built from the curriculum (LEVELS-PLAN-2026-11 §4). The learner does not pick a level: the test starts at the
 * first rung and climbs. Each rung is one level, with one question per lesson (Lessons 1–3, in order), so every question
 * points to the lesson that teaches it. Lesson numbers are the same in every age version of a subject. Authoring rule as
 * in types.ts: the first option is correct. Recited parts cannot be checked here: `teacherChecks` says so in the report.
 */
export interface LessonQuestion extends BankQuestion { lesson: number }
export interface Rung { level: Level; questions: LessonQuestion[] }
export interface Ladder { rungs: Rung[]; teacherChecks?: { en: string; ar: string } }

const at = (lesson: number, b: BankQuestion): LessonQuestion => ({ ...b, lesson });

// Foundations (Literacy A): any miss here means starting from the first lesson.
const letters: LessonQuestion[] = [
  at(1, q('Arabic is written…', 'العربية بتتكتب…', bi(['From right to left', 'From left to right', 'From top to bottom', 'In either direction'], ['من اليمين للشمال', 'من الشمال لليمين', 'من فوق لتحت', 'أي اتجاه']), 'How Arabic writing works|الكتابة العربية')),
  at(1, q('Which letter differs from ح only by a dot above it?', 'أي حرف بيختلف عن ح بنقطة فوقه بس؟', ['خ', 'ج', 'ع', 'د'], 'Letters and their dots|الحروف ونقطها')),
  at(1, q('How is بَابٌ read?', 'إزاي بتتقري بَابٌ ؟', ['baabun', 'bibun', 'babu', 'bubaa'], 'Reading with vowels|القراءة بالتشكيل'))
];

export const LADDERS: Record<string, Ladder> = {
  'quran-reading': {
    teacherChecks: { en: 'Reading aloud from the Mushaf: your teacher listens in the trial.', ar: 'القراءة بصوت من المصحف: المعلم بيسمعها في الحصة التجريبية.' },
    rungs: [
      { level: 'beginner', questions: letters },
      {
        level: 'intermediate',
        questions: [
          at(1, q('How is the small standing alif in ٱلرَّحْمَـٰنِ read?', 'الألف الصغيرة الواقفة في ٱلرَّحْمَـٰنِ بتتقري إزاي؟', bi(['As a long "aa"', 'It is not read', 'As a short "a"', 'As a hamza'], ['ألف ممدودة "آ"', 'ما بتتقريش', 'فتحة قصيرة', 'همزة']), 'The small alif|الألف الصغيرة')),
          at(2, q('A letter with a shadda, as in رَبِّ, is read as…', 'الحرف المشدد زي رَبِّ بيتقري…', bi(['Two sounds: rab-bi', 'One short sound: ra-bi', 'A long vowel: raa-bi', 'A silent letter'], ['حرفين: رَبْ-بِ', 'حرف واحد: رَ-بِ', 'مد: رَا-بِ', 'ما بيتقريش']), 'The shadda|الشدة')),
          at(3, q('Stopping on أَحَدٌ at the end of an ayah, you say…', 'لو وقفت على أَحَدٌ في آخر الآية بتقول…', ['أَحَدْ', 'أَحَدُنْ', 'أَحَدَا', 'أَحَدِنْ'], 'Tanween and stopping|التنوين والوقف'))
        ]
      }
    ]
  },
  'tajweed': {
    teacherChecks: { en: 'Applying the rules while reciting: your teacher listens in the trial.', ar: 'تطبيق الأحكام وانت بتقرأ: المعلم بيسمعه في الحصة التجريبية.' },
    rungs: [
      {
        level: 'beginner',
        questions: [
          at(1, q('A "hidden mistake" (لحن خفي) in recitation is…', 'اللحن الخفي في التلاوة هو…', bi(['Missing a tajweed rule; the meaning stays', 'Changing a letter or vowel', 'Reading slowly', 'Starting without the basmala'], ['ترك حكم من أحكام التجويد والمعنى سليم', 'تغيير حرف أو حركة', 'القراءة ببطء', 'البدء من غير بسملة']), 'What tajweed is|ما هو التجويد')),
          at(2, q('Which group holds the five letters of qalqalah (the bounce)?', 'أي مجموعة فيها حروف القلقلة الخمسة؟', ['ق ط ب ج د', 'ء ه ع ح غ خ', 'ي ر م ل و ن', 'ص ض ط ظ ق'], 'Qalqalah|القلقلة')),
          at(3, q('In مِنْ خَوْفٍ the noon is read clearly (izhar) because the next letter is…', 'في مِنْ خَوْفٍ النون بتظهر (إظهار) لأن الحرف اللي بعدها…', bi(['A throat letter', 'A lip letter', 'A letter with a shadda', 'A sun letter'], ['حرف حلقي', 'حرف شفوي', 'حرف مشدد', 'حرف شمسي']), 'Izhar|الإظهار'))
        ]
      },
      {
        level: 'intermediate',
        questions: [
          at(1, q('The madd letters (ا و ي when they stretch) come from…', 'حروف المد بتخرج من…', bi(['The empty space of the mouth and throat (al-jawf)', 'The lips', 'The tip of the tongue', 'The nose'], ['الجوف', 'الشفتين', 'طرف اللسان', 'الخيشوم']), 'The five areas (makharij)|المخارج الخمسة')),
          at(2, q('Which two throat letters come from the middle of the throat?', 'أي حرفين من حروف الحلق مخرجهم وسط الحلق؟', ['ع ح', 'ء ه', 'غ خ', 'ق ك'], 'The throat letters|حروف الحلق')),
          at(3, q('Which letter comes from the furthest back of the tongue?', 'أي حرف مخرجه أقصى اللسان من أبعد نقطة؟', ['ق', 'ك', 'ج', 'ش'], 'The deepest tongue: ق and ك|أقصى اللسان'))
        ]
      },
      {
        level: 'advanced',
        questions: [
          at(1, q('In Hafs (by way of ash-Shatibiyyah), madd lazim is stretched…', 'المد اللازم في رواية حفص (من الشاطبية) مقداره…', bi(['6 counts', '2 counts', '4 or 5 counts', '2, 4 or 6 counts'], ['6 حركات', 'حركتين', '4 أو 5 حركات', '2 أو 4 أو 6 حركات']), 'Madd and its ranks|المدود ومراتبها')),
          at(2, q('After a "good" stop (hasan) in the middle of an ayah, you start again…', 'بعد وقف حسن في وسط الآية، بتبدأ…', bi(['From a sound place before it', 'From the very next word', 'From the start of the surah', 'Anywhere you like'], ['من مكان سليم قبله', 'من الكلمة اللي بعده على طول', 'من أول السورة', 'من أي مكان']), 'Stopping and starting|الوقف والابتداء')),
          at(3, q('A raa with a kasra (رِ) is read…', 'الراء المكسورة (رِ) بتتقري…', bi(['Light (tarqeeq)', 'Heavy (tafkheem)', 'Either way', 'Silent'], ['مرققة', 'مفخمة', 'بالوجهين', 'ما بتتقريش']), 'The rules of raa|أحكام الراء'))
        ]
      }
    ]
  },
  'modern-standard-arabic': {
    rungs: [
      { level: 'beginner', questions: letters },
      {
        level: 'elementary',
        questions: [
          at(1, q('Choose: ___ غُرْفَةٌ (This is a room.)', 'اختار: ___ غُرْفَةٌ', ['هَذِهِ', 'هَذَا', 'مَنْ', 'مَا'], 'هذا and هذه|هذا وهذه')),
          at(2, q('Turn هَذَا كِتَابٌ into a yes-or-no question:', 'حوّل هَذَا كِتَابٌ لسؤال إجابته نعم أو لا:', ['أَهَذَا كِتَابٌ؟', 'مَا هَذَا كِتَابٌ؟', 'مَنْ هَذَا كِتَابٌ؟', 'هَذَا كِتَابٌ لَا؟'], 'Yes-or-no questions with أَ|السؤال بأَ')),
          at(3, q('A mosque far away: ___ مَسْجِدٌ', 'مسجد بعيد: ___ مَسْجِدٌ', ['ذَلِكَ', 'تِلْكَ', 'هَذِهِ', 'مَنْ'], 'Near and far|القريب والبعيد'))
        ]
      },
      {
        level: 'intermediate',
        questions: [
          at(1, q('"We went to the museum": ___ إِلَى ٱلْمَتْحَفِ', '"إحنا روحنا المتحف": ___ إِلَى ٱلْمَتْحَفِ', ['ذَهَبْنَا', 'ذَهَبُوا', 'ذَهَبْتُمْ', 'ذَهَبَتْ'], 'The past verb, every person|الماضي مع كل الضمائر')),
          at(2, q('"You study", said to a woman:', '"إنتِ بتذاكري" بالفصحى:', ['تَدْرُسِينَ', 'تَدْرُسُونَ', 'يَدْرُسُونَ', 'أَدْرُسُ'], 'The present verb|المضارع')),
          at(3, q('"I saw Omar\'s father": رَأَيْتُ ___ عُمَرَ', '"شفت أبو عمر": رَأَيْتُ ___ عُمَرَ', ['أَبَا', 'أَبُو', 'أَبِي', 'أَبٌ'], 'The five nouns|الأسماء الخمسة'))
        ]
      },
      {
        level: 'advanced',
        questions: [
          at(1, q('Which verb means "to teach" (Form II of عَلِمَ)?', 'أي فعل معناه "علّم" (على وزن فَعَّلَ من عَلِمَ)؟', ['عَلَّمَ', 'عَلِمَ', 'تَعَلَّمَ', 'مَعْلُومٌ'], 'Verb patterns|أوزان الفعل')),
          at(2, q('"The door was opened": ___ ٱلْبَابُ', '"الباب اتفتح": ___ ٱلْبَابُ', ['فُتِحَ', 'فَتَحَ', 'يَفْتَحُ', 'اِفْتَحْ'], 'The passive|المبني للمجهول')),
          at(3, q('Choose the correct sentence:', 'اختار الجملة الصحيحة:', ['إِنَّ ٱلْهَاتِفَ مُفِيدٌ', 'إِنَّ ٱلْهَاتِفُ مُفِيدٌ', 'إِنَّ ٱلْهَاتِفَ مُفِيدًا', 'إِنَّ ٱلْهَاتِفِ مُفِيدٍ'], 'إنّ and her sisters|إنّ وأخواتها'))
        ]
      }
    ]
  },
  // Sounds (12+, for learners who know Fusha) is a side door, not a rung: the teacher can move a Fusha speaker there.
  'egyptian-arabic': {
    teacherChecks: { en: 'Speaking and listening: your teacher checks them in the trial.', ar: 'الكلام والسمع: المعلم بيشوفهم في الحصة التجريبية.' },
    rungs: [
      {
        level: 'elementary',
        questions: [
          at(1, q('Someone says صباح الخير. You answer…', 'حد قالك صباح الخير. بترد…', ['صباح النور', 'مع السلامة', 'اسمي…', 'منين؟'], 'Greetings|التحيات')),
          at(2, q('A woman from Egypt is…', 'ست من مصر هي…', ['مصرية', 'مصري', 'مصريين', 'مصر'], 'Countries and nationalities|البلاد والجنسيات')),
          at(3, q('Pointing at a bag (شنطة): إيه ___؟', 'بتشاور على شنطة: إيه ___؟', ['دي', 'ده', 'مين', 'منين'], 'ده and دي|ده ودي'))
        ]
      },
      {
        level: 'intermediate',
        questions: [
          at(1, q('"She went to the market": ___ السوق', '"هي راحت السوق": ___ السوق', ['راحت', 'راح', 'رحت', 'هتروح'], 'The past tense|الماضي')),
          at(2, q('"I will go tomorrow": ___ بكرة', '"أنا هروح بكرة": ___ بكرة', ['هروح', 'بروح', 'رحت', 'روح'], 'The future with هـ|المستقبل بـ هـ')),
          at(3, q('In a story, which word brings the surprise?', 'في الحكاية، أنهي كلمة بتجيب المفاجأة؟', ['فجأة', 'وبعدين', 'امبارح', 'في الآخر'], 'Telling a story|الحكاية'))
        ]
      },
      {
        level: 'advanced',
        questions: [
          at(1, q('You half agree with a friend. Politely, you say…', 'موافق صاحبك نص موافقة. بأدب بتقول…', ['معاك حق، بس…', 'بالظبط!', 'لأ، غلط.', 'مش مهم.'], 'Opinions, politely|الرأي بأدب')),
          at(2, q('A big job and nobody helps. The saying that fits:', 'شغلانة كبيرة ومحدش بيساعد. المثل اللي يناسب:', ['إيد لوحدها ما تسقفش', 'اللي فات مات', 'الصبر مفتاح الفرج', 'على قد لحافك مد رجليك'], 'Sayings in context|الأمثال في مكانها')),
          at(3, q('In fast speech, which word carries almost no meaning?', 'في الكلام السريع، أنهي كلمة تقريباً من غير معنى؟', ['يعني', 'بكرة', 'المحطة', 'الساعة تلاتة'], 'Fast natural speech|الكلام السريع'))
        ]
      }
    ]
  }
};

/** Where a ladder test stands: still climbing (`next` = the rung to add), or done with a level and a lesson to start from. */
export type Climb = { done: false; next: number } | { done: true; level: Level; lesson: number | null };
// (Narrow with `'next' in r`: the project runs without strictNullChecks, so `!r.done` does not narrow.)

/**
 * Two misses in a rung stop the climb there, and the start lesson is the first missed one. A rung with at most one miss
 * opens the next. Clearing the top rung places the learner at the top level, from its first missed lesson (or `null`:
 * they know the first three lessons, and the teacher picks what comes next).
 */
export function climb(ladder: Ladder, results: { level: Level; lesson?: number; ok: boolean }[]): Climb {
  const asked = ladder.rungs.filter((r) => results.some((x) => x.level === r.level));
  for (const rung of asked) {
    const missed = results.filter((x) => x.level === rung.level && !x.ok).map((x) => x.lesson ?? 1);
    if (missed.length >= 2) return { done: true, level: rung.level, lesson: Math.min(...missed) };
  }
  if (asked.length < ladder.rungs.length) return { done: false, next: asked.length };
  const top = ladder.rungs[ladder.rungs.length - 1];
  const missed = results.filter((x) => x.level === top.level && !x.ok).map((x) => x.lesson ?? 1);
  return { done: true, level: top.level, lesson: missed.length ? Math.min(...missed) : null };
}
