import type { Lesson } from '../../types';
import { lessonT202TeacherAr } from './l02-teacher-ar.js';

// Rules: docs/curriculum/tajweed/RULES.md. Map: docs/curriculum/tajweed/MAP-level-2.md (Lesson 2: the throat, three
// depths: ء ه · ع ح · غ خ). Brief and evidence log: docs/curriculum/tajweed/L2-02-the-throat.md. Ayat: Uthmani Hafs via
// the Quran connector (quran.ai, fetched 2026-11-03), unchanged; the reciter (Husary, muallim) plays them.

const R = (id: string, text: string, ayah: string) => ({ id, text, voice: 'reciter' as const, quran: true, ayah });
const F = (id: string, text: string) => ({ id, text, voice: 'fusha' as const, emotion: 'clear, slow' });
const IKHLAS1 = R('ikhlas-1', 'قُلْ هُوَ ٱللَّهُ أَحَدٌ', '112:1');
const FATIHA2 = R('fatiha-2', 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ', '1:2');
const FATIHA5 = R('fatiha-5', 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', '1:5');
const FALAQ2 = R('falaq-2', 'مِن شَرِّ مَا خَلَقَ', '113:2');
const FALAQ3 = R('falaq-3', 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', '113:3');
const FALAQ5 = R('falaq-5', 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', '113:5');

export const lessonT202: Lesson = {
  subject: 'tajweed-2',
  version: 'adults',
  subjectTitle: 'Tajweed · Level 2',
  number: 2,
  title: 'The Throat',
  titleAr: 'حروف الحلق',
  part: 'Level 2 · Where Letters Are Born',
  minutes: 45,
  goal: 'By the end of this lesson, you will say the six throat letters from their own floors and keep ه apart from ح and ء apart from ع.',
  reviewed: false,
  teacherAr: lessonT202TeacherAr,
  outcomes: [
    'Places the six throat letters on three floors: deepest ء ه, middle ع ح, nearest غ خ.',
    'Hears that each floor has a voiced letter (ء ع غ) and a breathed one (ه ح خ).',
    'Says ح and ع from the middle of the throat in Al-Fatiha, not as ه and a hamza.',
    'Recites Al-Falaq with a clear خ, غ and ح.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Three floors', page: 2 },
    { label: 'Voice and breath', page: 6 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 12 },
  ],
  pages: [
    {
      title: 'The Throat',
      station: 'spark',
      layout: 'cover',
      scene: 'tm2Cover',
      lines: [],
      explain: [
        'Ask about the mission: which pair did the learner practise, and can they hear the difference now?',
        'Tell them: today we go down into the throat, the area English speakers find hardest.',
      ],
    },
    {
      title: 'Six letters, one tube',
      station: 'spark',
      layout: 'story',
      scene: 'tm2Recall',
      lines: [
        'Last time, the throat was one red tube on the map. Inside it there are six letters.',
        'To most English ears, four of them sound like h, a catch, k and a French r.',
        'They are not. Each one has its own floor, and once you feel the floors, you stop mixing them.',
      ],
      explain: [
        'Ask the learner to say the six letters as they say them today, without correcting yet. Note which pairs merge.',
        'That list is your plan for this lesson.',
      ],
    },
    {
      title: 'Three floors',
      station: 'zad',
      layout: 'concept',
      scene: 'tm2Floors',
      lines: [
        'Picture the throat as a building with three floors, the lowest one nearest the chest.',
        'The sound starts at the bottom and rises. Each pair of letters stops it on a different floor.',
        'Deepest: ء ه. In the middle: ع ح. Nearest the mouth: غ خ.',
      ],
      items: ['Deepest · aqsa al-halq', 'Middle · wasat al-halq', 'Nearest · adna al-halq'],
      vocab: [{ arabic: 'حُرُوفُ الْحَلْق', translit: 'huruf al-halq', meaning: 'the throat letters: ء ه ع ح غ خ' }],
      explain: [
        'Say أَءْ، أَعْ، أَغْ in a row and ask the learner where the sound moves: up, towards the mouth.',
        'The Arabic names of the floors are for reference; the learner only needs deepest, middle, nearest.',
      ],
      teacherNote: 'Aqsa, wasat and adna al-halq: the three points of the throat in the 17-point count.',
    },
    {
      title: 'The deepest floor',
      station: 'zad',
      layout: 'concept',
      scene: 'tm2Deep',
      lines: [
        'ء closes the floor completely: the voice stops for a moment, then the door opens.',
        'ه sits in the same place, but the door stays open and only soft breath passes.',
        'Al-Ikhlas holds both in four words: هُوَ and ٱللَّهُ for ه, أَحَدٌ for ء.',
      ],
      say: [F('a-hamza', 'أَأْ'), F('ah', 'أَهْ'), IKHLAS1],
      explain: [
        'Let the learner feel the stop of ء: like the catch in "uh-oh". Then ه: a sigh with nothing closed.',
        'Play the ayah and point at each ه and the ء.',
      ],
    },
    {
      title: 'The middle floor',
      station: 'zad',
      layout: 'concept',
      scene: 'tm2Mid',
      lines: [
        'ع squeezes the middle of the throat while the voice keeps going through it.',
        'ح is the same squeeze with breath only, no voice: like fogging a mirror, but tighter and deeper.',
        'Al-Fatiha opens with both: ٱلْحَمْدُ starts with ح, ٱلْعَـٰلَمِينَ with ع.',
      ],
      say: [F('a-ain', 'أَعْ'), F('ahh', 'أَحْ'), FATIHA2],
      explain: [
        'The squeeze is the key. If nothing tightens, ح falls to ه and ع falls to a hamza.',
        'Try a whispered ح against a whispered ه: the ح has a narrow, rough edge.',
      ],
      teacherNote: 'Do not let the squeeze become a cough or a choke. Short, firm and relaxed.',
    },
    {
      title: 'The nearest floor',
      station: 'zad',
      layout: 'concept',
      scene: 'tm2Near',
      lines: [
        'غ is a gentle gargle at the top of the throat, with the voice on.',
        'خ is the same place with breath only, like the ch in the Scottish word loch.',
        'Al-Falaq puts them one ayah apart: خَلَقَ, then غَاسِقٍ.',
      ],
      say: [F('a-ghain', 'أَغْ'), F('akh', 'أَخْ'), FALAQ2, FALAQ3],
      explain: [
        'Many learners say خ as a hard k, and غ as an r or a g. Both are too far forward in the mouth.',
        'Let them gargle a little water, then say أَغْ from the same spot.',
      ],
    },
    {
      title: 'One voiced, one breathed',
      station: 'zad',
      layout: 'concept',
      scene: 'tm2Pattern',
      lines: [
        'Look at the three floors again: every floor holds a pair.',
        'One letter of each pair carries the voice: ء، ع، غ. The other is only breath: ه، ح، خ.',
        'Put a hand on your throat and say أَعْ then أَحْ: a buzz, then nothing. Six letters, one rule to tell them apart.',
      ],
      say: [F('a-ain', 'أَعْ'), F('ahh', 'أَحْ'), F('a-ghain', 'أَغْ'), F('akh', 'أَخْ')],
      explain: [
        'This is the wow of the lesson: the throat is three floors of twins.',
        'Voice and breath have Arabic names (jahr and hams); they come in Part B of this level.',
      ],
    },
    {
      title: 'One letter, one meaning',
      station: 'zad',
      layout: 'evidence',
      scene: 'tm2Meaning',
      evidence: {
        arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
        meaning: 'You alone we worship, and You alone we ask for help.',
        reference: 'Al-Fatiha 1:5',
      },
      tadabbur: {
        word: 'نَعْبُدُ',
        root: 'ع ب د',
        meaning: 'We worship. Words from this root come 275 times in the Quran, and it starts with a ع.',
        question: 'You say this ayah to Allah in every rak\'ah. How carefully do you want to say it?',
        action: 'In your next salah, slow down on نَعْبُدُ and give its ع the squeeze of the middle floor.',
      },
      say: [FATIHA5],
      lines: [
        'In every rak\'ah you say these words to Allah directly.',
        'If the ع comes out as a hamza, نَعْبُدُ is no longer the word that was revealed.',
        'That is why the throat gets a whole lesson: the letters English speakers slip on are in the ayat they say most.',
      ],
      explain: [
        'Play the ayah. Ask the learner to say نَعْبُدُ three times, with the hand on the throat for the buzz of ع.',
        'Keep it gentle: the aim is care, not fear. The one who struggles with the Quran has two rewards (the hadith of Level 1, Lesson 1).',
      ],
    },
    {
      title: 'Four slips',
      station: 'zad',
      layout: 'concept',
      scene: 'tm2Slips',
      lines: [
        'The four slips we hear most, and the floor that fixes each one.',
        'ح said as ه, and ع said as a hamza: both have lost the squeeze of the middle floor.',
        'خ said as k, and غ said as r or g: both have moved out of the throat into the mouth.',
      ],
      items: ['ح → ه', 'ع → ء', 'خ → k', 'غ → r'],
      explain: ['Model each slip on purpose and let the learner catch you. Then say it right from its floor.'],
    },
    {
      title: 'Which floor?',
      station: 'athar',
      layout: 'game',
      scene: 'tm2Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Say each letter with a hamza before it. Which floor of the throat is it on?',
        bins: [
          { id: 'deep', label: 'Deepest', hint: 'ء ه' },
          { id: 'mid', label: 'Middle', hint: 'ع ح' },
          { id: 'near', label: 'Nearest', hint: 'غ خ' },
        ],
        cards: [
          { label: 'ح in ٱلْحَمْدُ', bin: 'mid', why: 'ح is on the middle floor, with ع. It needs the squeeze.' },
          { label: 'ه in هُوَ', bin: 'deep', why: 'ه is on the deepest floor, with ء: open, only breath.' },
          { label: 'ع in نَعْبُدُ', bin: 'mid', why: 'ع is on the middle floor: the squeeze with the voice on.' },
          { label: 'خ in خَلَقَ', bin: 'near', why: 'خ is on the nearest floor, at the top of the throat.' },
          { label: 'ء in أَحَدٌ', bin: 'deep', why: 'The hamza closes the deepest floor for a moment.' },
          { label: 'غ in غَاسِقٍ', bin: 'near', why: 'غ is on the nearest floor: a gentle gargle with the voice.' },
          { label: 'ح in حَاسِدٍ', bin: 'mid', why: 'Middle floor again: ح, the breathed twin of ع.' },
          { label: 'ه in ٱللَّهُ', bin: 'deep', why: 'The ه at the end of the Name is on the deepest floor.' },
        ],
      },
      explain: [
        'A short review, no timer and no points. The result goes into your lesson report.',
        'Ask the learner to say each letter out loud before choosing.',
      ],
      teacherNote: 'The result is added to your lesson report automatically.',
    },
    {
      title: 'Voice or breath?',
      station: 'athar',
      layout: 'question',
      scene: 'tm2Voice',
      lines: ['Hand on your throat. Say each letter with a hamza before it and feel for the buzz.'],
      interaction: {
        kind: 'clues',
        prompt: 'Tap every letter that carries the voice.',
        clues: [
          { label: 'ع', correct: true },
          { label: 'ح', correct: false },
          { label: 'غ', correct: true },
          { label: 'خ', correct: false },
          { label: 'ء', correct: true },
          { label: 'ه', correct: false },
        ],
      },
      explain: ['The voiced three are ء، ع، غ. If the learner taps ح or خ, let them feel the throat again on أَحْ.'],
    },
    {
      title: 'Your turn to recite',
      station: 'athar',
      layout: 'question',
      scene: 'tm2Recite',
      lines: [
        'Recite Al-Falaq slowly. Listen for خَلَقَ, غَاسِقٍ and حَاسِدٍ.',
        'Then recite ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ with the middle floor awake.',
      ],
      say: [FALAQ2, FALAQ3, FALAQ5, FATIHA2],
      interaction: {
        kind: 'ask',
        prompt: 'Recite to your teacher. Did each throat letter come from its own floor?',
        reveal: 'Three floors, six letters, each one in its place.',
      },
      explain: ['Correct only the throat letters today. Note which slip came back, if any.'],
      teacherNote: 'Write the slips in your report: they are next lesson\'s warm-up.',
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'tm2Mission',
      lines: [
        'In every salah this week, give the ع of نَعْبُدُ its squeeze.',
        'Once a day, say the six letters from the bottom floor up: ء ه، ع ح، غ خ.',
      ],
      interaction: {
        kind: 'choose',
        prompt: 'Which twin will you watch most this week?',
        options: ['ح and ه', 'ع and ء', 'خ and غ', 'All of them'],
      },
      explain: ['Start the next lesson by hearing the six letters from the bottom floor up.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'tm2Next',
      lines: [
        'Just above the throat, the back of the tongue rises to meet the roof of the mouth.',
        'Two letters live there, a step apart: ق and ك. Next time, the deepest part of the tongue.',
      ],
      explain: ['End on ق and ك. Ask the learner to find both in Al-Ikhlas before next lesson.'],
    },
  ],
};
