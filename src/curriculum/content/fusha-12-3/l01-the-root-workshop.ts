import type { Lesson } from '../../types';
import { lessonFT301TeacherAr } from './l01-teacher-ar.js';

// Rules: docs/curriculum/fusha/RULES.md. Map: docs/curriculum/fusha/MAP-level-3.md (Lesson 1: verb patterns; 12+ take
// Forms II, III and IV with the idea of all ten; theme: the root workshop). Institute cast. Every Arabic word fully
// diacritized.

const W = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'fusha' as const, emotion });

export const lessonFT301: Lesson = {
  subject: 'fusha-12-3',
  version: 'teens',
  subjectTitle: 'Fusha Arabic · 12+ · Level 3',
  number: 1,
  title: 'The Root Workshop',
  titleAr: 'وَرْشَةُ ٱلْجُذُورِ',
  part: 'Level 3',
  minutes: 50,
  goal: 'By the end of this lesson, you will build new verbs from a root with three patterns, and recognise them in the present by their يُـ.',
  reviewed: false,
  teacherAr: lessonFT301TeacherAr,
  outcomes: [
    'Explains root (جَذْرٌ) and pattern (وَزْنٌ), with فَعَلَ as the model.',
    'Builds Form II فَعَّلَ (causing), Form III فَاعَلَ (with someone), Form IV أَفْعَلَ (making something happen).',
    'Recognises the present of Forms II–IV by its يُـ: يُعَلِّمُ، يُكَاتِبُ، يُرْسِلُ.',
    'Looks a verb up by its root in a dictionary.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'Three patterns', page: 3 },
    { label: 'Dictionary', page: 8 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'The Root Workshop',
      station: 'spark',
      layout: 'cover',
      scene: 'fy1Cover',
      lines: [],
      explain: [
        'Welcome the learner to Level 3. Level 2 used verbs; Level 3 opens them up to see how they are built.',
        'Ask: in English, how are "teach" and "learn" related? (They are not, by their letters.) Arabic does it differently.',
      ],
    },
    {
      title: 'Three letters on the board',
      station: 'spark',
      layout: 'story',
      scene: 'fy1Board',
      lines: [
        'Ustadh Kareem writes three letters on the board and nothing else: ع ل م.',
        'He asks the class to name every word they know that hides those letters: عِلْمٌ، عَالِمٌ، مُعَلِّمٌ...',
        'Then he asks a harder question: how did one root make all of these?',
      ],
      explain: ['Ask the learner to list the words they know with ع ل م. Write them up; they will return on page 7.'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'fy1Story',
      lines: [
        'Listen twice. Who taught Yusuf Arabic first?',
        'Who does Sara write to, and where does that person live?',
        'How do the two friends help each other?',
      ],
      say: [
        W('story-1', 'مَنْ عَلَّمَكَ ٱلْعَرَبِيَّةَ يَا يُوسُفُ؟', 'teacher, warm'),
        W('story-2', 'عَلَّمَنِي أَبِي أَوَّلًا، ثُمَّ دَرَسْتُ هُنَا.', 'young man'),
        W('story-3', 'وَأَنَا أُكَاتِبُ صَدِيقَةً فِي ٱلْأُرْدُنِّ.', 'young woman, proud'),
        W('story-4', 'مُمْتَازٌ! وَمَنْ يُسَاعِدُكِ؟', 'teacher'),
        W('story-5', 'هِيَ تُسَاعِدُنِي، وَأَنَا أُرْسِلُ لَهَا رَسَائِلَ بِٱلْإِنْجِلِيزِيَّةِ.', 'young woman'),
        W('story-6', 'هَذَا هُوَ ٱلتَّعَاوُنُ!', 'teacher, pleased'),
      ],
      explain: [
        'Play the scene twice. Ask in English: who taught Yusuf first? (his father). Who does Sara write to? (a friend in Jordan).',
        'Then: how do they help each other? (the friend helps her Arabic; Sara sends messages in English).',
      ],
      teacherNote: 'Input first. Count the verbs the learner caught; most of them are this lesson\'s patterns.',
    },
    {
      title: 'Root and pattern',
      station: 'zad',
      layout: 'concept',
      scene: 'fy1Pattern',
      lines: [
        'A root (جَذْرٌ) is usually three letters that hold a meaning: ع ل م, knowing.',
        'A pattern (وَزْنٌ) is the shape poured around it, and the shape adds its own meaning.',
        'Grammarians write every pattern with the model root ف ع ل: the plain past is فَعَلَ, so عَلِمَ is "on the pattern فَعِلَ".',
      ],
      vocab: [
        { arabic: 'جَذْرٌ', translit: 'jadhr', meaning: 'root' },
        { arabic: 'وَزْنٌ', translit: 'wazn', meaning: 'pattern (literally: weight)' },
      ],
      say: [W('jadhr', 'جَذْرٌ'), W('wazn', 'وَزْنٌ'), W('faala', 'فَعَلَ')],
      explain: [
        'وَزْنٌ literally means "weight": the word is weighed against ف ع ل letter by letter.',
        'Show the weighing: ع under ف، ل under ع، م under ل.',
      ],
    },
    {
      title: 'Form II: make it happen to someone',
      station: 'zad',
      layout: 'concept',
      scene: 'fy1Two',
      lines: [
        'فَعَّلَ: a shadda doubles the middle letter. It often means causing, or doing something hard and often.',
        'عَلِمَ, he knew → عَلَّمَ, he taught. فَهِمَ, he understood → فَهَّمَ, he made someone understand.',
        'كَسَرَ, he broke → كَسَّرَ, he smashed to pieces. Present: يُعَلِّمُ، يُفَهِّمُ.',
      ],
      vocab: [
        { arabic: 'عَلَّمَ يُعَلِّمُ', translit: 'ʿallama yuʿallimu', meaning: 'to teach' },
        { arabic: 'فَهَّمَ يُفَهِّمُ', translit: 'fahhama yufahhimu', meaning: 'to explain, make understand' },
        { arabic: 'كَسَّرَ يُكَسِّرُ', translit: 'kassara yukassiru', meaning: 'to smash' },
      ],
      say: [W('allama', 'عَلَّمَ'), W('fahhama', 'فَهَّمَ'), W('kassara', 'كَسَّرَ'), W('yuallimu', 'يُعَلِّمُ')],
      explain: ['Contrast the pairs aloud: عَلِمَ / عَلَّمَ, كَسَرَ / كَسَّرَ. The learner should hear the held letter.'],
    },
    {
      title: 'Form III: with someone',
      station: 'zad',
      layout: 'concept',
      scene: 'fy1Three',
      lines: [
        'فَاعَلَ: a long ā after the first letter. It usually means doing it with or towards another person.',
        'كَتَبَ, he wrote → كَاتَبَ, he wrote to someone, corresponded. That is Sara and her friend.',
        'Other everyday ones: سَاعَدَ (helped), شَارَكَ (took part, shared), شَاهَدَ (watched). Present: يُكَاتِبُ، يُسَاعِدُ.',
      ],
      vocab: [
        { arabic: 'كَاتَبَ يُكَاتِبُ', translit: 'kātaba yukātibu', meaning: 'to correspond with' },
        { arabic: 'سَاعَدَ يُسَاعِدُ', translit: 'sāʿada yusāʿidu', meaning: 'to help' },
        { arabic: 'شَارَكَ يُشَارِكُ', translit: 'shāraka yushāriku', meaning: 'to take part, share' },
      ],
      say: [W('kataba', 'كَتَبَ'), W('kaataba', 'كَاتَبَ'), W('saada', 'سَاعَدَ'), W('shaaraka', 'شَارَكَ'), W('yukaatibu', 'يُكَاتِبُ')],
      explain: ['Ask: why does كَاتَبَ suit pen pals better than كَتَبَ? (both people write; it goes both ways).'],
    },
    {
      title: 'Form IV: make something do it',
      station: 'zad',
      layout: 'concept',
      scene: 'fy1Four',
      lines: [
        'أَفْعَلَ: a hamza in front, and the first root letter loses its vowel. It usually makes something else do the action.',
        'خَرَجَ, he went out → أَخْرَجَ, he took something out. دَخَلَ → أَدْخَلَ, he brought in.',
        'And أَرْسَلَ, he sent: Sara\'s messages. In the present the hamza goes and يُـ comes in: يُرْسِلُ، يُخْرِجُ.',
      ],
      vocab: [
        { arabic: 'أَخْرَجَ يُخْرِجُ', translit: 'akhraja yukhriju', meaning: 'to take out' },
        { arabic: 'أَدْخَلَ يُدْخِلُ', translit: 'adkhala yudkhilu', meaning: 'to bring in' },
        { arabic: 'أَرْسَلَ يُرْسِلُ', translit: 'arsala yursilu', meaning: 'to send' },
      ],
      say: [W('kharaja', 'خَرَجَ'), W('akhraja', 'أَخْرَجَ'), W('adkhala', 'أَدْخَلَ'), W('arsala', 'أَرْسَلَ'), W('yursilu', 'يُرْسِلُ')],
      explain: ['Act it: walk out of the room (خَرَجَ), then take a book out of a bag (أَخْرَجَ). The learner names each.'],
    },
    {
      title: 'Hear yu-, think pattern',
      station: 'zad',
      layout: 'concept',
      scene: 'fy1Ladder',
      lines: [
        'One sound ties the three patterns together: their present starts with يُـ, a u, where plain verbs have يَـ.',
        'يَكْتُبُ is plain; يُكَاتِبُ has a pattern. يَخْرُجُ is plain; يُخْرِجُ has a pattern.',
        'There are ten common patterns in all. You now have four of them, counting the plain one. The other six come over the next lessons.',
      ],
      say: [W('yaktubu', 'يَكْتُبُ'), W('yukaatibu-2', 'يُكَاتِبُ'), W('yakhruju', 'يَخْرُجُ'), W('yukhriju', 'يُخْرِجُ')],
      explain: [
        'Read the pairs slowly and let the learner say which is "plain" and which has a pattern, by ear only.',
        'Go back to the board words from page 2: مُعَلِّمٌ is the doer of عَلَّمَ (Form II). The patterns reach nouns too.',
      ],
      teacherNote: 'The wow: one vowel (u) tells the learner they are hearing a built verb, before they know its meaning.',
    },
    {
      title: 'Looking it up',
      station: 'zad',
      layout: 'concept',
      scene: 'fy1Dictionary',
      lines: [
        'Arabic dictionaries are ordered by root, not by the first letter of the word.',
        'To find أَرْسَلَ, take away what the pattern added: the hamza. Look under ر س ل.',
        'Under one root you will find the whole family: رَسُولٌ، رِسَالَةٌ، مُرْسِلٌ.',
      ],
      vocab: [{ arabic: 'رِسَالَةٌ', translit: 'risālah', meaning: 'a letter, a message' }],
      say: [W('risala', 'رِسَالَةٌ')],
      explain: ['If the learner uses a dictionary app, show the root search. Otherwise do it on paper with three roots.'],
    },
    {
      title: 'Which pattern?',
      station: 'athar',
      layout: 'game',
      scene: 'fy1Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Which pattern built this verb?',
        look: 'row',
        bins: [
          { id: 'ii', label: 'فَعَّلَ', hint: 'Form II' },
          { id: 'iii', label: 'فَاعَلَ', hint: 'Form III' },
          { id: 'iv', label: 'أَفْعَلَ', hint: 'Form IV' },
        ],
        cards: [
          { label: 'أَرْسَلَ', bin: 'iv', why: 'A hamza in front, first root letter still: Form IV, he sent.' },
          { label: 'شَارَكَ', bin: 'iii', why: 'A long ā after the first letter: Form III, he took part.' },
          { label: 'كَسَّرَ', bin: 'ii', why: 'A doubled middle letter: Form II, he smashed.' },
          { label: 'يُكَاتِبُ', bin: 'iii', why: 'Present with يُـ and a long ā: Form III, he corresponds.' },
          { label: 'يُخْرِجُ', bin: 'iv', why: 'Present يُـ with the first root letter still: Form IV, he takes out.' },
          { label: 'يُعَلِّمُ', bin: 'ii', why: 'Present يُـ with a doubled middle letter: Form II, he teaches.' },
        ],
      },
      explain: ['Ask for the root of each card too (ر س ل، ش ر ك...). The result goes into your report.'],
    },
    {
      title: 'Your turn: the workshop',
      station: 'athar',
      layout: 'question',
      scene: 'fy1Talk',
      lines: [
        'Your teacher gives you a root: د ر س. Build Form I and Form II and use each in a sentence.',
        'Then answer: مَنْ عَلَّمَكَ ٱلْعَرَبِيَّةَ أَوَّلًا؟ and مَنْ يُسَاعِدُكَ ٱلْآنَ؟',
      ],
      say: [W('darasa', 'دَرَسَ'), W('darrasa', 'دَرَّسَ')],
      interaction: { kind: 'ask', prompt: 'Did you use two patterns from one root, and answer both questions?', reveal: 'مُمْتَازٌ! You are building words, not just learning them.' },
      explain: ['دَرَسَ (studied) and دَرَّسَ (taught a subject). Accept any correct sentence; correct the shadda by ear.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'fy1Mission',
      lines: [
        'Find three verbs with يُـ in any Arabic text: a sign, a song, a page you read.',
        'For each, write its root and its pattern. Bring one you could not solve.',
      ],
      interaction: { kind: 'choose', prompt: 'Where will you hunt?', options: ['A news headline', 'A book I am reading', 'Labels and signs', 'A video with subtitles'] },
      explain: ['Next time, solve the unsolved verb together; it will likely be a pattern from the coming lessons.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'fy1Next',
      lines: [
        'A headline on Sara\'s phone: فُتِحَ طَرِيقٌ جَدِيدٌ فِي ٱلْمَدِينَةِ.',
        'A new road was opened. But who opened it? The verb does not say, and it does not want to.',
        'Next time: the passive, and why news loves it.',
      ],
      say: [W('futiha', 'فُتِحَ طَرِيقٌ جَدِيدٌ فِي ٱلْمَدِينَةِ.', 'newsreader')],
      explain: ['End on the headline. Ask: who might have opened the road? Why might a newspaper leave that out?'],
    },
  ],
};
