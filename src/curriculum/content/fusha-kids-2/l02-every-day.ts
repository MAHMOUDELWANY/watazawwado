import type { Lesson } from '../../types';
import { lessonFK202TeacherAr } from './l02-teacher-ar.js';

// Rules: docs/curriculum/fusha/RULES.md. Map: docs/curriculum/fusha/MAP-level-2.md (Lesson 2: the present verb, يَذْهَبُ،
// تَذْهَبُ، أَذْهَبُ، نَذْهَبُ; Kids theme: Yusuf's school day). Zad Kids cast. Singular persons and نَحْنُ only; تَذْهَبِينَ and
// the plurals are 12+ (and a later Kids lesson). Every Arabic word fully diacritized.

const W = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'fusha' as const, emotion });

export const lessonFK202: Lesson = {
  subject: 'fusha-kids-2',
  version: 'kids',
  subjectTitle: 'Fusha Arabic · Kids · Level 2',
  number: 2,
  title: 'Every Day',
  titleAr: 'كُلَّ يَوْمٍ',
  part: 'Level 2',
  minutes: 45,
  goal: 'By the end of this lesson, you will say what you, your family and your friends do every day.',
  reviewed: false,
  teacherAr: lessonFK202TeacherAr,
  outcomes: [
    'Says أَذْهَبُ (I go) and نَذْهَبُ (we go) about themselves.',
    'Says يَذْهَبُ for a boy, تَذْهَبُ for a girl, and تَذْهَبُ to a boy.',
    'Knows that the past changes at its end and the present at its start.',
    'Uses the same front letters on يَكْتُبُ، يَلْعَبُ، يَشْرَبُ.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Listen first', page: 3 },
    { label: 'The front letter', page: 4 },
    { label: 'Every verb', page: 8 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'Every Day',
      station: 'spark',
      layout: 'cover',
      scene: 'fv2Cover',
      lines: [],
      explain: [
        'Greet in Arabic: السَّلَامُ عَلَيْكُمْ. Ask about the dinner mission: who did they ask مَاذَا فَعَلْتَ؟ What was the answer?',
        'Tell them: last time was about yesterday. Today is about every day.',
      ],
    },
    {
      title: 'Remember?',
      station: 'spark',
      layout: 'concept',
      scene: 'fv2Recall',
      lines: [
        'Yesterday, Yusuf went to the park: ذَهَبْتُ إِلَى ٱلْحَدِيقَةِ.',
        'Where did the "I" go? To the end of the word: ـْتُ.',
        'Keep your eye on the end. Today something happens at the other side.',
      ],
      say: [W('dhahabtu-hadiqa', 'ذَهَبْتُ إِلَى ٱلْحَدِيقَةِ.', 'remembering, happy')],
      explain: ['Two minutes. Ask: ذَهَبْتَ or ذَهَبْتُ, which one is "I"? Let them point to the end of the word.'],
    },
    {
      title: 'Monday, again',
      station: 'spark',
      layout: 'story',
      scene: 'fv2Monday',
      lines: [
        'Monday. The alarm rings, Yusuf grabs his bag, Jiddo walks him to the gate.',
        'Tuesday: the same. Wednesday: the same. It happens every day.',
        'Maryam has a toy microphone. She wants to interview Yusuf about his day.',
      ],
      explain: ['Ask the child: what do you do every morning? Every evening? Let them list two things in English.'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'fv2Story',
      lines: [
        'Listen twice. When does Yusuf go to school?',
        'What does he do there? Count the things.',
        'And Jiddo, where does he go every day?',
      ],
      say: [
        W('story-1', 'مَتَى تَذْهَبُ إِلَى ٱلْمَدْرَسَةِ يَا يُوسُفُ؟', 'girl, playing reporter'),
        W('story-2', 'أَذْهَبُ فِي ٱلصَّبَاحِ.', 'boy, proud'),
        W('story-3', 'وَمَاذَا تَفْعَلُ هُنَاكَ؟', 'girl, playing reporter'),
        W('story-4', 'أَكْتُبُ، وَأَقْرَأُ، وَأَلْعَبُ!', 'boy, counting on fingers'),
        W('story-5', 'وَجِدِّي يَذْهَبُ إِلَى ٱلْمَسْجِدِ.', 'girl, turning to the camera'),
        W('story-6', 'وَفِي ٱلْمَسَاءِ نَأْكُلُ مَعًا.', 'warm grandfather'),
      ],
      explain: [
        'Play the scene twice. Ask in English: when does Yusuf go? (in the morning). What three things does he do? (write, read, play).',
        'Then: where does Jiddo go? (the masjid). What do they all do in the evening? (eat together).',
      ],
      teacherNote: 'Input first. Do not name the rule yet; let the child hear that the words start differently now.',
    },
    {
      title: 'I go',
      station: 'zad',
      layout: 'concept',
      scene: 'fv2I',
      lines: [
        'For things you do every day, Arabic uses a new kind of verb.',
        'أَذْهَبُ: I go. The "I" sits at the front this time: أَ.',
        'أَذْهَبُ إِلَى ٱلْمَدْرَسَةِ كُلَّ يَوْمٍ: I go to school every day.',
      ],
      vocab: [
        { arabic: 'أَذْهَبُ', translit: 'adhhabu', meaning: 'I go' },
        { arabic: 'كُلَّ يَوْمٍ', translit: 'kulla yawm', meaning: 'every day' },
        { arabic: 'فِي ٱلصَّبَاحِ', translit: 'fī ṣ-ṣabāḥ', meaning: 'in the morning' },
      ],
      say: [W('adhhabu', 'أَذْهَبُ', 'clear'), W('adhhabu-kulla-yawm', 'أَذْهَبُ إِلَى ٱلْمَدْرَسَةِ كُلَّ يَوْمٍ.', 'cheerful')],
      explain: [
        'Touch your chest on أَ, just as you did for ذَهَبْتُ. Same "I", new place.',
        'Say كُلَّ يَوْمٍ with a circling hand: round and round, every day.',
      ],
    },
    {
      title: 'He goes, she goes',
      station: 'zad',
      layout: 'concept',
      scene: 'fv2HeShe',
      lines: [
        'For a boy or a man, the front letter is يَـ: يَذْهَبُ, he goes.',
        'For a girl or a woman, it is تَـ: تَذْهَبُ, she goes.',
        'Talking to a boy, it is تَـ too: تَذْهَبُ, you go. The picture tells you which one.',
      ],
      vocab: [
        { arabic: 'يَذْهَبُ', translit: 'yadhhabu', meaning: 'he goes' },
        { arabic: 'تَذْهَبُ', translit: 'tadhhabu', meaning: 'she goes / you go (to a boy)' },
      ],
      say: [W('yadhhabu', 'يَذْهَبُ جِدِّي إِلَى ٱلْمَسْجِدِ.'), W('tadhhabu-maryam', 'تَذْهَبُ مَرْيَمُ إِلَى ٱلْمَكْتَبَةِ.'), W('tadhhabu-anta', 'أَنْتَ تَذْهَبُ إِلَى ٱلْمَدْرَسَةِ.', 'pointing at a boy')],
      explain: [
        'Point at a boy picture for يَـ, a girl picture for تَـ, and at the child for تَـ again.',
        'If the child asks how to tell "she" from "you": look who is there, or add the person, هِيَ or أَنْتَ.',
      ],
    },
    {
      title: 'We go',
      station: 'zad',
      layout: 'concept',
      scene: 'fv2We',
      lines: [
        'The whole family, together: نَذْهَبُ, we go.',
        'نَـ at the front means "we", just like نَا at the end of ذَهَبْنَا.',
        'Every Friday, نَذْهَبُ إِلَى ٱلْمَسْجِدِ مَعًا.',
      ],
      vocab: [
        { arabic: 'نَذْهَبُ', translit: 'nadhhabu', meaning: 'we go' },
        { arabic: 'مَعًا', translit: 'maʿan', meaning: 'together' },
      ],
      say: [W('nadhhabu', 'نَذْهَبُ', 'happy'), W('nadhhabu-masjid', 'نَذْهَبُ إِلَى ٱلْمَسْجِدِ مَعًا.', 'warm, together')],
      explain: ['Sweep your arm round you and the child for نَذْهَبُ, the same move as for ذَهَبْنَا.'],
    },
    {
      title: 'Front or back?',
      station: 'zad',
      layout: 'concept',
      scene: 'fv2Front',
      lines: [
        'Put yesterday and every day side by side.',
        'Yesterday, the who goes at the back: ذَهَبْتُ. Every day, it goes at the front: أَذْهَبُ.',
        'So look at the start of a verb, and you know if it is every day.',
      ],
      explain: [
        'Hold your two hands apart: left hand "yesterday", right hand "every day". Say a verb; the child points to the right hand or the left.',
        'Try: ذَهَبْنَا (yesterday), نَذْهَبُ (every day), يَذْهَبُ (every day), ذَهَبَتْ (yesterday).',
      ],
      teacherNote: 'The wow of the lesson: the same "who" moves from the back of the word to the front. Children love finding it.',
    },
    {
      title: 'Every verb does it',
      station: 'zad',
      layout: 'concept',
      scene: 'fv2Verbs',
      lines: [
        'The front letters work on other verbs too.',
        'يَكْتُبُ, he writes. So: أَكْتُبُ, I write.',
        'يَلْعَبُ, he plays. So: تَلْعَبُ, she plays. يَشْرَبُ, he drinks. So: نَشْرَبُ, we drink.',
      ],
      vocab: [
        { arabic: 'يَكْتُبُ', translit: 'yaktubu', meaning: 'he writes' },
        { arabic: 'يَلْعَبُ', translit: 'yalʿabu', meaning: 'he plays' },
        { arabic: 'يَشْرَبُ', translit: 'yashrabu', meaning: 'he drinks' },
      ],
      say: [W('yaktubu', 'يَكْتُبُ', 'clear'), W('aktubu', 'أَكْتُبُ', 'clear'), W('yalabu', 'يَلْعَبُ', 'clear'), W('talabu', 'تَلْعَبُ', 'clear'), W('yashrabu', 'يَشْرَبُ', 'clear'), W('nashrabu', 'نَشْرَبُ', 'happy')],
      explain: [
        'Mime each verb (writing, playing, drinking) and let the child say it with أَ. Then swap: the child mimes, you guess.',
        'Do not explain why يَكْتُبُ has a different middle sound from يَذْهَبُ. Each verb is learnt with its own sound.',
      ],
    },
    {
      title: 'Who does it?',
      station: 'athar',
      layout: 'game',
      scene: 'fv2Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Look at the front of each verb. Who does it: I, he, or we?',
        bins: [
          { id: 'i', label: 'أَـ', hint: 'I' },
          { id: 'he', label: 'يَـ', hint: 'he' },
          { id: 'we', label: 'نَـ', hint: 'we' },
        ],
        cards: [
          { label: 'أَذْهَبُ إِلَى ٱلْمَدْرَسَةِ.', bin: 'i', why: 'أَ at the front: I go to school.' },
          { label: 'يَلْعَبُ يُوسُفُ بِٱلْكُرَةِ.', bin: 'he', why: 'يَ at the front: Yusuf (he) plays with the ball.' },
          { label: 'نَأْكُلُ مَعًا.', bin: 'we', why: 'نَ at the front: we eat together.' },
          { label: 'أَشْرَبُ ٱلْحَلِيبَ.', bin: 'i', why: 'أَ at the front: I drink the milk.' },
          { label: 'يَكْتُبُ جِدِّي رِسَالَةً.', bin: 'he', why: 'يَ at the front: Jiddo (he) writes a letter.' },
          { label: 'نَذْهَبُ إِلَى ٱلسُّوقِ.', bin: 'we', why: 'نَ at the front: we go to the market.' },
        ],
      },
      explain: ['Let the child read each card aloud first and touch its first letter. The result goes into your report.'],
    },
    {
      title: 'Your turn: my day',
      station: 'athar',
      layout: 'question',
      scene: 'fv2Talk',
      lines: [
        'Be Maryam the reporter. Ask your teacher: مَتَى تَذْهَبُ إِلَى ٱلْعَمَلِ؟',
        'Then your teacher asks you. Answer with three things you do every day: أَذْهَبُ... أَكْتُبُ... أَلْعَبُ...',
      ],
      say: [W('mata-tadhhabu', 'مَتَى تَذْهَبُ إِلَى ٱلْعَمَلِ؟', 'curious reporter')],
      interaction: { kind: 'ask', prompt: 'Three sentences, each one starting with أَ. Did you do it?', reveal: 'مُمْتَازٌ! Your whole day, in Arabic.' },
      explain: ['Pretend to hold a microphone. If the teacher is a woman, the child asks مَتَى تَذْهَبِينَ؟; just say it for them and let them copy, without explaining.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'fv2Mission',
      lines: [
        'Tomorrow morning, say one sentence about your day before you leave the house.',
        'أَذْهَبُ إِلَى ٱلْمَدْرَسَةِ. Then at night: نَأْكُلُ مَعًا.',
      ],
      interaction: { kind: 'choose', prompt: 'When will you say it?', options: ['At breakfast', 'Putting on my shoes', 'In the car', 'At the school gate'] },
      explain: ['Next time, ask which sentence they said, and who heard it.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'fv2Next',
      lines: [
        'After dinner, Jiddo opens an old photo album.',
        'He points: هَذَا أَبِي. And next to him: هَذَا أَخِي. My father, my brother.',
        'Next time: two family words that change their ending.',
      ],
      say: [W('haadha-abi', 'هَذَا أَبِي، وَهَذَا أَخِي.', 'warm grandfather, remembering')],
      explain: ['End on the photo. Ask the child: who is in your family photos at home?'],
    },
  ],
};
