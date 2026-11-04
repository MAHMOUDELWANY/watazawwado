import type { Lesson } from '../../types';
import { lessonFT303TeacherAr } from './l03-teacher-ar.js';

// Rules: docs/curriculum/fusha/RULES.md. Map: docs/curriculum/fusha/MAP-level-3.md (Lesson 3: إِنَّ and her sisters; 12+
// theme: a debate club). Institute cast. All six sisters (إِنَّ، أَنَّ، لَكِنَّ، كَأَنَّ، لَيْتَ، لَعَلَّ), their noun in
// ـَ and their predicate in ـُ, with attached pronouns. Every Arabic word fully diacritized.

const W = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'fusha' as const, emotion });

export const lessonFT303: Lesson = {
  subject: 'fusha-12-3',
  version: 'teens',
  subjectTitle: 'Fusha Arabic · 12+ · Level 3',
  number: 3,
  title: 'The Debate Club',
  titleAr: 'نَادِي ٱلْمُنَاظَرَةِ',
  part: 'Level 3',
  minutes: 50,
  goal: 'By the end of this lesson, you will argue a point in Arabic with إِنَّ and her five sisters, and get every ending right.',
  reviewed: false,
  teacherAr: lessonFT303TeacherAr,
  outcomes: [
    'Names the six sisters and their mood: إِنَّ (certainly), أَنَّ (that), لَكِنَّ (but), كَأَنَّ (as if), لَيْتَ (if only), لَعَلَّ (perhaps).',
    'Puts the noun after them in ـَ and keeps the predicate in ـُ: إِنَّ ٱلْهَاتِفَ مُفِيدٌ.',
    'Attaches pronouns: إِنَّهُ، لَكِنَّنِي، كَأَنَّكَ، لَعَلَّهَا.',
    'Builds a short argument: claim, "but", wish and compromise.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'إِنَّ and the seesaw', page: 3 },
    { label: 'The sisters', page: 5 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'The Debate Club',
      station: 'spark',
      layout: 'cover',
      scene: 'fy3Cover',
      lines: [],
      explain: [
        'Check the mission: read the passive headlines and name each missing doer.',
        'Tell them: today the institute holds a debate. Six small words will decide who wins.',
      ],
    },
    {
      title: 'The motion',
      station: 'spark',
      layout: 'story',
      scene: 'fy3Motion',
      lines: [
        'Friday is debate club. Ustadh Kareem writes the motion on the board: should phones be banned at school?',
        'Sara argues for phones. Yusuf argues against them, while his own phone buzzes in his pocket.',
        'Listen for the small words each of them puts at the start of a sentence.',
      ],
      explain: ['Ask the learner which side they would take, in English, and one reason.'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'fy3Story',
      lines: [
        'Listen twice. What is Sara\'s point? What is Yusuf\'s?',
        'How does Sara tease Yusuf, and what does he wish for?',
        'What does Ustadh Kareem suggest at the end?',
      ],
      say: [
        W('story-1', 'ٱلْمَوْضُوعُ: هَلْ يُمْنَعُ ٱلْهَاتِفُ فِي ٱلْمَدْرَسَةِ؟', 'teacher, chairing'),
        W('story-2', 'إِنَّ ٱلْهَاتِفَ مُفِيدٌ لِلدِّرَاسَةِ.', 'young woman, confident'),
        W('story-3', 'لَكِنَّ ٱلطُّلَّابَ يَلْعَبُونَ بِهِ فِي ٱلدَّرْسِ.', 'young man, firm'),
        W('story-4', 'كَأَنَّكَ لَا تَلْعَبُ بِهِ أَنْتَ!', 'young woman, teasing'),
        W('story-5', 'لَيْتَ ٱلْهَاتِفَ يَدْرُسُ عَنِّي!', 'young man, laughing'),
        W('story-6', 'لَعَلَّ ٱلْحَلَّ فِي ٱلْوَسَطِ.', 'teacher, wise'),
      ],
      explain: [
        'Play the scene twice. Ask in English: Sara\'s point? (phones help studying). Yusuf\'s? (students play with them in class).',
        'Then: Sara teases "as if you don\'t play with it yourself"; Yusuf wishes the phone could study for him; Kareem: "perhaps the answer is in the middle".',
      ],
      teacherNote: 'Input first. Write the first word of each sentence on the board after the second listening: the sisters.',
    },
    {
      title: 'إِنَّ: certainly',
      station: 'zad',
      layout: 'concept',
      scene: 'fy3Inna',
      lines: [
        'A plain sentence: ٱلْهَاتِفُ مُفِيدٌ, the phone is useful. Both words end in ـُ.',
        'Add إِنَّ for certainty: إِنَّ ٱلْهَاتِفَ مُفِيدٌ. The first noun drops to ـَ; the predicate keeps its ـُ.',
        'Grammar calls them the noun of إِنَّ (ٱسْمُهَا) and her predicate (خَبَرُهَا).',
      ],
      vocab: [
        { arabic: 'إِنَّ', translit: 'inna', meaning: 'certainly, indeed' },
        { arabic: 'مُفِيدٌ', translit: 'mufīd', meaning: 'useful' },
      ],
      say: [W('hatif-mufid', 'ٱلْهَاتِفُ مُفِيدٌ.'), W('inna-hatif', 'إِنَّ ٱلْهَاتِفَ مُفِيدٌ.', 'confident')],
      explain: [
        'Remind the learner of Level 2, Lesson 3: ـَ is the "done to" vowel. إِنَّ treats her noun the same way.',
        'In speech, إِنَّ adds weight. In writing, it often just opens a sentence firmly.',
      ],
    },
    {
      title: 'The seesaw',
      station: 'zad',
      layout: 'concept',
      scene: 'fy3Seesaw',
      lines: [
        'Picture a seesaw with two seats. إِنَّ sits on the first seat, so that seat goes down to ـَ.',
        'The second seat stays up in ـُ: إِنَّ ٱلطُّلَّابَ مَشْغُولُونَ, the students are certainly busy.',
        'Next level, you will meet كَانَ, her mirror image: it leaves the first seat and pushes the second.',
      ],
      say: [W('inna-tullab', 'إِنَّ ٱلطُّلَّابَ مَشْغُولُونَ.')],
      explain: ['Draw the seesaw. Write ٱسْمُهَا under the low seat, خَبَرُهَا under the high one. One sentence each, in both forms.'],
      teacherNote: 'The wow: one picture explains a rule students often memorise blindly. Come back to it in Lesson 8 with كَانَ.',
    },
    {
      title: 'But and that',
      station: 'zad',
      layout: 'concept',
      scene: 'fy3Lakinna',
      lines: [
        'لَكِنَّ, but: لَكِنَّ ٱلطُّلَّابَ يَلْعَبُونَ بِهِ. Yusuf\'s reply has the same seesaw.',
        'أَنَّ, that: it joins a thought to a verb. أَعْتَقِدُ أَنَّ ٱلْهَاتِفَ مُفِيدٌ, I think that the phone is useful.',
        'إِنَّ starts a sentence; أَنَّ sits in the middle, after words like "I think", "I know", "I heard".',
      ],
      vocab: [
        { arabic: 'لَكِنَّ', translit: 'lākinna', meaning: 'but' },
        { arabic: 'أَنَّ', translit: 'anna', meaning: 'that' },
        { arabic: 'أَعْتَقِدُ', translit: 'aʿtaqidu', meaning: 'I believe, I think' },
      ],
      say: [W('lakinna-tullab', 'لَكِنَّ ٱلطُّلَّابَ يَلْعَبُونَ بِهِ.'), W('anna-hatif', 'أَعْتَقِدُ أَنَّ ٱلْهَاتِفَ مُفِيدٌ.')],
      explain: ['Contrast in pairs: إِنَّ ٱلْهَاتِفَ مُفِيدٌ / أَعْتَقِدُ أَنَّ ٱلْهَاتِفَ مُفِيدٌ. Same endings, different place.'],
    },
    {
      title: 'As if, if only, perhaps',
      station: 'zad',
      layout: 'concept',
      scene: 'fy3Moods',
      lines: [
        'كَأَنَّ, as if: كَأَنَّ ٱلْفَصْلَ مَلْعَبٌ, as if the classroom were a playground.',
        'لَيْتَ, if only, for a wish that may not come true: لَيْتَ ٱلْهَاتِفَ يَدْرُسُ عَنِّي.',
        'لَعَلَّ, perhaps, for a hope: لَعَلَّ ٱلْحَلَّ فِي ٱلْوَسَطِ. All three keep the same seesaw.',
      ],
      vocab: [
        { arabic: 'كَأَنَّ', translit: 'kaʾanna', meaning: 'as if' },
        { arabic: 'لَيْتَ', translit: 'layta', meaning: 'if only (a wish)' },
        { arabic: 'لَعَلَّ', translit: 'laʿalla', meaning: 'perhaps (a hope)' },
      ],
      say: [W('kaanna-fasl', 'كَأَنَّ ٱلْفَصْلَ مَلْعَبٌ.'), W('story-5', 'لَيْتَ ٱلْهَاتِفَ يَدْرُسُ عَنِّي!', 'laughing'), W('story-6', 'لَعَلَّ ٱلْحَلَّ فِي ٱلْوَسَطِ.', 'wise')],
      explain: ['Ask the learner for one wish with لَيْتَ and one hope with لَعَلَّ about their own week. Check the noun\'s ـَ.'],
    },
    {
      title: 'With pronouns',
      station: 'zad',
      layout: 'concept',
      scene: 'fy3Pronouns',
      lines: [
        'The sisters can carry a pronoun instead of a noun: إِنَّهُ (he/it certainly), إِنَّهَا (she certainly).',
        'لَكِنَّنِي, but I. كَأَنَّكَ, as if you: that was Sara\'s tease. لَعَلَّهَا, perhaps she.',
        'The pronoun takes the noun\'s seat, so you no longer see the ـَ, but the seesaw is still there.',
      ],
      vocab: [
        { arabic: 'إِنَّهُ', translit: 'innahu', meaning: 'he/it certainly' },
        { arabic: 'لَكِنَّنِي', translit: 'lākinnanī', meaning: 'but I' },
        { arabic: 'كَأَنَّكَ', translit: 'kaʾannaka', meaning: 'as if you' },
      ],
      say: [W('innahu', 'إِنَّهُ'), W('lakinnani', 'لَكِنَّنِي'), W('story-4', 'كَأَنَّكَ لَا تَلْعَبُ بِهِ أَنْتَ!', 'teasing'), W('laallaha', 'لَعَلَّهَا')],
      explain: ['Drill: the teacher says a noun sentence, the learner rewrites it with a pronoun: إِنَّ سَارَةَ مُتَحَمِّسَةٌ → إِنَّهَا مُتَحَمِّسَةٌ.'],
    },
    {
      title: 'Six moods, one sentence',
      station: 'zad',
      layout: 'concept',
      scene: 'fy3Six',
      lines: [
        'Take one sentence, ٱلدَّرْسُ سَهْلٌ, and run it through all six.',
        'إِنَّ ٱلدَّرْسَ سَهْلٌ (certainly) · أَنَّ (that) · لَكِنَّ (but) · كَأَنَّ (as if) · لَيْتَ (if only) · لَعَلَّ (perhaps).',
        'Six meanings, one grammar: the noun always ـَ, the predicate always ـُ. Learn one, and you have learnt six.',
      ],
      say: [W('dars-sahl', 'ٱلدَّرْسُ سَهْلٌ.'), W('inna-dars', 'إِنَّ ٱلدَّرْسَ سَهْلٌ.'), W('layta-dars', 'لَيْتَ ٱلدَّرْسَ سَهْلٌ!', 'wistful')],
      explain: ['Let the learner say all six aloud with the matching tone: firm, neutral, contrasting, doubtful, wistful, hopeful.'],
    },
    {
      title: 'Which ending?',
      station: 'athar',
      layout: 'game',
      scene: 'fy3Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Fill the gap with the right form of ٱلْهَاتِفُ.',
        bins: [
          { id: 'a', label: 'ٱلْهَاتِفَ', hint: 'after a sister' },
          { id: 'u', label: 'ٱلْهَاتِفُ', hint: 'no sister' },
        ],
        cards: [
          { label: 'لَعَلَّ ___ فِي ٱلْحَقِيبَةِ.', bin: 'a', why: 'After لَعَلَّ, her noun takes ـَ.' },
          { label: '___ جَدِيدٌ.', bin: 'u', why: 'A plain noun sentence: ـُ.' },
          { label: 'سَمِعْتُ أَنَّ ___ غَالٍ.', bin: 'a', why: 'After أَنَّ, her noun takes ـَ.' },
          { label: 'يُمْنَعُ ___ فِي ٱلِٱمْتِحَانِ.', bin: 'u', why: 'The stand-in of a passive verb (Lesson 2): ـُ.' },
          { label: 'كَأَنَّ ___ صَدِيقُهُ.', bin: 'a', why: 'After كَأَنَّ, her noun takes ـَ.' },
          { label: 'لَيْتَ ___ يَصْمُتُ قَلِيلًا!', bin: 'a', why: 'After لَيْتَ, her noun takes ـَ.' },
        ],
      },
      explain: ['Card 4 is a trap from Lesson 2: a passive verb, not a sister. The result goes into your report.'],
    },
    {
      title: 'Your turn: debate',
      station: 'athar',
      layout: 'question',
      scene: 'fy3Talk',
      lines: [
        'Pick a motion with your teacher: homework, social media, school uniforms.',
        'Make your case in four lines: إِنَّ... لَكِنَّ... لَيْتَ... لَعَلَّ... Your teacher argues back.',
      ],
      say: [W('inna-wajib', 'إِنَّ ٱلْوَاجِبَ مُفِيدٌ.', 'confident')],
      interaction: { kind: 'ask', prompt: 'Did every noun after a sister end in ـَ?', reveal: 'مُمْتَازٌ! You argued in Arabic, endings and all.' },
      explain: ['Keep vocabulary simple; the four-line structure is the goal. Note errors and review two at the end.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'fy3Mission',
      lines: [
        'Write a five-line opinion on any topic you care about, using five different sisters.',
        'Underline each sister\'s noun and check its ـَ.',
      ],
      interaction: { kind: 'choose', prompt: 'What will your topic be?', options: ['School and homework', 'Phones and social media', 'Sport', 'Something in my city'] },
      explain: ['Next time, read the opinion together and score one point per correct ending.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'fy3Next',
      lines: [
        'After the debate, Kareem gives the class a team project.',
        'At the end Sara writes: تَعَلَّمْنَا كَثِيرًا لِأَنَّنَا تَعَاوَنَّا. We learnt a lot because we worked together.',
        'Next time: Forms V and VI, the verbs of learning and teamwork, both starting with تَـ.',
      ],
      say: [W('taallamna', 'تَعَلَّمْنَا كَثِيرًا لِأَنَّنَا تَعَاوَنَّا.', 'young woman, proud')],
      explain: ['End on the sentence. Ask: which sister is hiding in لِأَنَّنَا? (أَنَّ, with لِـ and نَا).'],
    },
  ],
};
