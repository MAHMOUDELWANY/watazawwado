import type { Lesson } from '../../types';
import { lessonFK302TeacherAr } from './l02-teacher-ar.js';

// Rules: docs/curriculum/fusha/RULES.md. Map: docs/curriculum/fusha/MAP-level-3.md (Lesson 2: the passive; Kids theme:
// who broke the vase?). Zad Kids cast. Kids take the past passive (فُعِلَ، فُعِلَتْ); the present passive is 12+.
// Every Arabic word fully diacritized.

const W = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'fusha' as const, emotion });

export const lessonFK302: Lesson = {
  subject: 'fusha-kids-3',
  version: 'kids',
  subjectTitle: 'Fusha Arabic · Kids · Level 3',
  number: 2,
  title: 'Who Broke the Vase?',
  titleAr: 'مَنْ كَسَرَ ٱلْمَزْهَرِيَّةَ؟',
  part: 'Level 3',
  minutes: 45,
  goal: 'By the end of this lesson, you will say what happened when you do not know who did it: "the vase was broken".',
  reviewed: false,
  teacherAr: lessonFK302TeacherAr,
  outcomes: [
    'Hears the difference between كَسَرَ (broke) and كُسِرَ (was broken).',
    'Makes the past passive by switching the vowels to u and i: فَتَحَ → فُتِحَ، أَكَلَ → أُكِلَ.',
    'Uses كُسِرَتْ for a feminine thing, with the ت of "she".',
    'Turns "Mishmish broke the vase" into "the vase was broken" and back.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Listen first', page: 3 },
    { label: 'Was broken', page: 4 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'Who Broke the Vase?',
      station: 'spark',
      layout: 'cover',
      scene: 'fx2Cover',
      lines: [],
      explain: [
        'Greet in Arabic: السَّلَامُ عَلَيْكُمْ. Ask about the mission: which word did they teach, and to whom? Let them say عَلَّمْتُ...',
        'Tell them: today we are detectives.',
      ],
    },
    {
      title: 'Remember?',
      station: 'spark',
      layout: 'concept',
      scene: 'fx2Recall',
      lines: [
        'Last time a shadda turned عَلِمَ into عَلَّمَ. The shape changed the meaning.',
        'Today we change something even smaller: only the little vowel marks.',
      ],
      say: [W('allama', 'عَلَّمَ', 'clear')],
      explain: ['Two minutes. Ask: what does عَلَّمَ mean? And لَاعَبَ? Praise the shadda and the long ā.'],
    },
    {
      title: 'Crash!',
      station: 'spark',
      layout: 'story',
      scene: 'fx2Crash',
      lines: [
        'A crash from the living room. Jiddo\'s blue vase is on the floor, in pieces.',
        'Nobody saw it happen. The window is open, and the fish on the table is gone.',
        'Maryam puts on her detective face. Something happened, but who did it?',
      ],
      explain: ['Ask the child: have you ever found something broken and not known who did it? What did you say?'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'fx2Story',
      lines: [
        'Listen twice. What three things happened?',
        'Who asks the big question?',
        'Who does Yusuf blame, and what does Jiddo say?',
      ],
      say: [
        W('story-1', 'كُسِرَتِ ٱلْمَزْهَرِيَّةُ!', 'grandfather, shocked'),
        W('story-2', 'وَٱنْظُرْ يَا جِدِّي، فُتِحَ ٱلشُّبَّاكُ!', 'girl, detective'),
        W('story-3', 'وَأُكِلَ ٱلسَّمَكُ!', 'boy, amazed'),
        W('story-4', 'مَنْ كَسَرَ ٱلْمَزْهَرِيَّةَ؟', 'girl, serious'),
        W('story-5', 'مِشْمِشٌ كَسَرَهَا!', 'boy, pointing'),
        W('story-6', 'مِسْكِينٌ مِشْمِشٌ!', 'grandfather, laughing'),
      ],
      explain: [
        'Play the scene twice. Ask in English: what happened? (the vase was broken, the window was opened, the fish was eaten).',
        'Then: who does Yusuf say did it? (Mishmish). Is Jiddo angry? (No, he laughs: poor Mishmish).',
      ],
      teacherNote: 'Input first. The first three lines have no doer; the fourth asks for one. Let the child feel that gap.',
    },
    {
      title: 'Broke, was broken',
      station: 'zad',
      layout: 'concept',
      scene: 'fx2Was',
      lines: [
        'كَسَرَ: he broke it. Someone did it, and we can name him: كَسَرَ مِشْمِشٌ ٱلْمَزْهَرِيَّةَ.',
        'كُسِرَ: it was broken. Something happened, and we do not say who.',
        'Listen to the vowels: ka-sa-ra became ku-si-ra.',
      ],
      vocab: [
        { arabic: 'كَسَرَ', translit: 'kasara', meaning: 'he broke' },
        { arabic: 'كُسِرَ', translit: 'kusira', meaning: 'it was broken' },
        { arabic: 'مَزْهَرِيَّةٌ', translit: 'mazhariyyah', meaning: 'a vase' },
      ],
      say: [W('kasara', 'كَسَرَ', 'clear'), W('kusira', 'كُسِرَ', 'clear, slow'), W('kasara-mishmish', 'كَسَرَ مِشْمِشٌ ٱلْمَزْهَرِيَّةَ.')],
      explain: [
        'Say the pair with your hands: for كَسَرَ, mime breaking something; for كُسِرَ, show broken pieces and shrug: who knows?',
        'Make the child say ku-si-ra slowly, then fast.',
      ],
    },
    {
      title: 'The vowel switch',
      station: 'zad',
      layout: 'concept',
      scene: 'fx2Switch',
      lines: [
        'The switch works on other verbs too: first vowel u, second vowel i.',
        'فَتَحَ, he opened → فُتِحَ, it was opened. أَكَلَ, he ate → أُكِلَ, it was eaten.',
        'كَتَبَ, he wrote → كُتِبَ, it was written. Same letters, new story.',
      ],
      vocab: [
        { arabic: 'فُتِحَ', translit: 'futiḥa', meaning: 'it was opened' },
        { arabic: 'أُكِلَ', translit: 'ukila', meaning: 'it was eaten' },
        { arabic: 'كُتِبَ', translit: 'kutiba', meaning: 'it was written' },
      ],
      say: [W('fataha', 'فَتَحَ'), W('futiha', 'فُتِحَ'), W('akala', 'أَكَلَ'), W('ukila', 'أُكِلَ'), W('kataba', 'كَتَبَ'), W('kutiba', 'كُتِبَ')],
      explain: [
        'Make it a chant: "a-a, u-i". Say the active verb; the child answers with the passive.',
        'Do not explain more than the two vowels. The last vowel stays a fatha.',
      ],
    },
    {
      title: 'For a "she" thing',
      station: 'zad',
      layout: 'concept',
      scene: 'fx2She',
      lines: [
        'مَزْهَرِيَّةٌ ends in ة, so Arabic treats it as a "she".',
        'So the verb takes the ت of "she" from Level 2: كُسِرَتِ ٱلْمَزْهَرِيَّةُ, the vase was broken.',
        'But the window is a "he": فُتِحَ ٱلشُّبَّاكُ. And the fish: أُكِلَ ٱلسَّمَكُ.',
      ],
      vocab: [
        { arabic: 'كُسِرَتْ', translit: 'kusirat', meaning: 'she (it) was broken' },
        { arabic: 'شُبَّاكٌ', translit: 'shubbāk', meaning: 'a window' },
        { arabic: 'سَمَكٌ', translit: 'samak', meaning: 'fish' },
      ],
      say: [W('kusirat', 'كُسِرَتِ ٱلْمَزْهَرِيَّةُ.'), W('futiha-shubbak', 'فُتِحَ ٱلشُّبَّاكُ.'), W('ukila-samak', 'أُكِلَ ٱلسَّمَكُ.')],
      explain: [
        'Remind the child of ذَهَبَتْ from Level 2: the same ت for a girl, or a ة word.',
        'Before ٱلْـ the ت gets a kasra to join: كُسِرَتِ ٱلْـ. The child just copies the sound.',
      ],
    },
    {
      title: 'The doer disappears',
      station: 'zad',
      layout: 'concept',
      scene: 'fx2Gone',
      lines: [
        'Watch Mishmish leave the sentence: كَسَرَ مِشْمِشٌ ٱلْمَزْهَرِيَّةَ.',
        'Take the doer out, and the vase moves into his place: كُسِرَتِ ٱلْمَزْهَرِيَّةُ.',
        'Listen to the vase\'s last vowel: it was ـَ, now it is ـُ. It took the doer\'s place, so it took his vowel too.',
      ],
      explain: [
        'Use three cards on the table: verb, Mishmish, vase. Remove Mishmish; slide the vase into his place; change the verb card.',
        'The vowel change (ـَ → ـُ) is a preview. If the child does not notice it, that is fine.',
      ],
      teacherNote: 'The wow of the lesson: the doer can vanish and the sentence still stands. Children love hiding Mishmish.',
    },
    {
      title: 'Why hide the doer?',
      station: 'zad',
      layout: 'concept',
      scene: 'fx2Why',
      lines: [
        'Sometimes we do not know who did it: كُسِرَتِ ٱلْمَزْهَرِيَّةُ.',
        'Sometimes it does not matter who did it: فُتِحَ ٱلْبَابُ لِلضُّيُوفِ, the door was opened for the guests.',
        'And sometimes we are kind and do not want to blame anyone. Jiddo did that.',
      ],
      say: [W('futiha-bab', 'فُتِحَ ٱلْبَابُ لِلضُّيُوفِ.')],
      explain: ['Ask the child: if you broke something, which would you say: "I broke it" or "it was broken"? Which one is more honest? Talk about it kindly.'],
    },
    {
      title: 'Doer or no doer?',
      station: 'athar',
      layout: 'game',
      scene: 'fx2Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Does the sentence say who did it?',
        bins: [
          { id: 'doer', label: 'كَسَرَ', hint: 'we know who' },
          { id: 'none', label: 'كُسِرَ', hint: 'we do not say who' },
        ],
        cards: [
          { label: 'كَسَرَ يُوسُفُ ٱلْكُوبَ.', bin: 'doer', why: 'Yusuf broke the cup: the doer is named.' },
          { label: 'كُسِرَ ٱلْكُوبُ.', bin: 'none', why: 'The cup was broken: no doer.' },
          { label: 'فَتَحَتْ مَرْيَمُ ٱلْبَابَ.', bin: 'doer', why: 'Maryam opened the door: the doer is named.' },
          { label: 'فُتِحَ ٱلْبَابُ.', bin: 'none', why: 'The door was opened: no doer.' },
          { label: 'أُكِلَ ٱلسَّمَكُ.', bin: 'none', why: 'The fish was eaten: no doer.' },
          { label: 'أَكَلَ مِشْمِشٌ ٱلسَّمَكَ.', bin: 'doer', why: 'Mishmish ate the fish: the doer is named.' },
        ],
      },
      explain: ['Let the child read each card and listen for a-a or u-i in the verb. The result goes into your report.'],
    },
    {
      title: 'Your turn: detective',
      station: 'athar',
      layout: 'question',
      scene: 'fx2Talk',
      lines: [
        'Your teacher hides or moves things in the room while you close your eyes.',
        'Open your eyes and report: فُتِحَ ٱلْكِتَابُ! أُكِلَتِ ٱلتُّفَّاحَةُ! Then guess: مَنْ فَعَلَ ذَلِكَ؟',
      ],
      say: [W('man-faala', 'مَنْ فَعَلَ ذَلِكَ؟', 'detective, serious')],
      interaction: { kind: 'ask', prompt: 'Three changes, three sentences with u-i. Did you find them all?', reveal: 'مُمْتَازٌ! Detective Maryam would be proud.' },
      explain: ['On a video call: open a book, close a box, move a cup. Give the verbs the child needs; the vowels are the point.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'fx2Mission',
      lines: [
        'Tonight, look round your home like a detective.',
        'Find two things that were done today and say them: فُتِحَ ٱلشُّبَّاكُ... غُسِلَتِ ٱلصُّحُونُ...',
      ],
      interaction: { kind: 'choose', prompt: 'Where will you look first?', options: ['The kitchen', 'My room', 'The living room', 'The garden or balcony'] },
      explain: ['Next time, ask for the two sentences. Help with the verb if needed; praise the u-i.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'fx2Next',
      lines: [
        'Maryam is sure: إِنَّ مِشْمِشًا بَرِيءٌ! Mishmish is innocent, she says.',
        'Yusuf points at the cat: لَكِنَّ ٱلسَّمَكَ فِي فَمِهِ! But the fish is in his mouth!',
        'Next time: إِنَّ and لَكِنَّ, two little words that change the end of a whole sentence.',
      ],
      say: [W('inna-mishmishan', 'إِنَّ مِشْمِشًا بَرِيءٌ!', 'girl, certain'), W('lakinna', 'لَكِنَّ ٱلسَّمَكَ فِي فَمِهِ!', 'boy, laughing')],
      explain: ['End on the fish. Ask the child: did they notice مِشْمِشٌ became مِشْمِشًا after إِنَّ?'],
    },
  ],
};
