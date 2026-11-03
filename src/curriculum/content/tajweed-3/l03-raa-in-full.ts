import type { Lesson } from '../../types';
import { lessonT303TeacherAr } from './l03-teacher-ar.js';

// Rules: docs/curriculum/tajweed/RULES.md. Map: docs/curriculum/tajweed/MAP-level-3.md (Lesson 3: raa in full).
// Brief and evidence log: docs/curriculum/tajweed/L3-03-raa-in-full.md. The cases follow Taysir ar-Rahman fi Tajweed
// al-Quran (Su'ad Abdul-Hamid), the chapter on tafkheem and tarqeeq, pp. 146-152, for Hafs by way of ash-Shatibiyyah;
// the wording and examples' order are ours. Ayat: Uthmani Hafs via the Quran connector (quran.ai, fetched 2026-11-03),
// unchanged; the reciter (Husary, muallim) plays them.

const R = (id: string, text: string, ayah: string) => ({ id, text, voice: 'reciter' as const, quran: true, ayah });
const FATIHA2 = R('fatiha-2', 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ', '1:2');
const FATIHA7 = R('fatiha-7', 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ', '1:7');
const QADR1 = R('qadr-1', 'إِنَّآ أَنزَلْنَـٰهُ فِى لَيْلَةِ ٱلْقَدْرِ', '97:1');
const QADR3 = R('qadr-3', 'لَيْلَةُ ٱلْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ', '97:3');
const QADR4 = R('qadr-4', 'تَنَزَّلُ ٱلْمَلَـٰٓئِكَةُ وَٱلرُّوحُ فِيهَا بِإِذْنِ رَبِّهِم مِّن كُلِّ أَمْرٍ', '97:4');
const ASR1 = R('asr-1', 'وَٱلْعَصْرِ', '103:1');
const ASR2 = R('asr-2', 'إِنَّ ٱلْإِنسَـٰنَ لَفِى خُسْرٍ', '103:2');
const FAJR4 = R('fajr-4', 'وَٱلَّيْلِ إِذَا يَسْرِ', '89:4');
const FAJR5 = R('fajr-5', 'هَلْ فِى ذَٰلِكَ قَسَمٌ لِّذِى حِجْرٍ', '89:5');
const FAJR10 = R('fajr-10', 'وَفِرْعَوْنَ ذِى ٱلْأَوْتَادِ', '89:10');
const FAJR14 = R('fajr-14', 'إِنَّ رَبَّكَ لَبِٱلْمِرْصَادِ', '89:14');
const FAJR28 = R('fajr-28', 'ٱرْجِعِىٓ إِلَىٰ رَبِّكِ رَاضِيَةً مَّرْضِيَّةً', '89:28');
const MAARIJ5 = R('maarij-5', 'فَٱصْبِرْ صَبْرًا جَمِيلًا', '70:5');
const SHUARA63 = R('shuara-63', 'فَأَوْحَيْنَآ إِلَىٰ مُوسَىٰٓ أَنِ ٱضْرِب بِّعَصَاكَ ٱلْبَحْرَ ۖ فَٱنفَلَقَ فَكَانَ كُلُّ فِرْقٍ كَٱلطَّوْدِ ٱلْعَظِيمِ', '26:63');

export const lessonT303: Lesson = {
  subject: 'tajweed-3',
  version: 'adults',
  subjectTitle: 'Tajweed · Level 3',
  number: 3,
  title: 'Raa in Full',
  titleAr: 'أحكام الراء',
  part: 'Level 3 · Measure',
  minutes: 50,
  goal: 'By the end of this lesson, you will decide, for any raa in Hafs, whether it is heavy, light, or one of the few words that allow both.',
  reviewed: false,
  teacherAr: lessonT303TeacherAr,
  outcomes: [
    'Reads a raa with a fatha or damma heavy, and with a kasra light.',
    'For a still raa, looks at the vowel before it; at a stop, looks past a still letter to the vowel before that, and reads it light after a ي.',
    'Knows the two cases where a kasra before the raa does not make it light: the kasra of a hamzat al-wasl, and a heavy letter after the raa in the same word.',
    'Names the words with two allowed ways in Hafs: فِرْقٍ، يَسْرِ، ٱلْقِطْرِ، مِصْرَ at a stop.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'The rule', page: 2 },
    { label: 'Exceptions', page: 6 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'Raa in Full',
      station: 'spark',
      layout: 'cover',
      scene: 'tr3Cover',
      lines: [],
      explain: [
        'Ask about the mission: which stopping sign did the learner find, and did they follow it?',
        'Tell them: raa was one lesson in Level 1. Today it gets every case, from Taysir ar-Rahman.',
      ],
    },
    {
      title: 'One letter, two weights',
      station: 'spark',
      layout: 'story',
      scene: 'tr3Weights',
      lines: [
        'Recite Al-Fatiha and listen to the raa. In رَبِّ and ٱلرَّحْمَـٰنِ it is full and heavy.',
        'In غَيْرِ ٱلْمَغْضُوبِ it turns thin and light.',
        'Same letter, same surah. What decides its weight? By the end of today, you will never need to guess.',
      ],
      say: [FATIHA2, FATIHA7],
      explain: [
        'Play both ayat and ask the learner to raise a hand at each raa: heavy or light?',
        'Most learners already feel it. Today we turn the feeling into rules they can check.',
      ],
    },
    {
      title: 'Look at the raa first',
      station: 'zad',
      layout: 'concept',
      scene: 'tr3Vowel',
      lines: [
        'If the raa carries a vowel, the vowel decides.',
        'A fatha or a damma makes it heavy: رَبِّ, and ٱلرُّوحُ in Al-Qadr.',
        'A kasra makes it light: غَيْرِ in Al-Fatiha.',
      ],
      say: [FATIHA2, QADR4, FATIHA7],
      explain: [
        'This covers most raas in the Quran. Everything after this page is about a raa with no vowel.',
        'The same holds for a raa with a shadda: رَبِّ is heavy because its own vowel is a fatha.',
      ],
    },
    {
      title: 'Still? Look before it',
      station: 'zad',
      layout: 'concept',
      scene: 'tr3Before',
      lines: [
        'A still raa takes its weight from the vowel just before it.',
        'After a fatha or a damma it is heavy: مَّرْضِيَّةً in Al-Fajr.',
        'After a kasra it is light: وَفِرْعَوْنَ.',
      ],
      say: [FAJR28, FAJR10],
      explain: [
        'Ask the learner to cover the raa with a finger and read the letter before it: its vowel gives the answer.',
        'Two exceptions to "after a kasra" come in a few pages.',
      ],
    },
    {
      title: 'At a stop, look past it',
      station: 'zad',
      layout: 'concept',
      scene: 'tr3Stop',
      lines: [
        'When you stop on a raa it becomes still. If the letter before it is still too, look one step further back.',
        'وَٱلْعَصْرِ and خُسْرٍ: a fatha and a damma further back, so both are heavy. حِجْرٍ in Al-Fajr: a kasra, so it is light.',
        'And if a ي comes just before the raa, it is light at a stop: خَيْرٌ.',
      ],
      say: [ASR1, ASR2, FAJR5, QADR3],
      explain: [
        'Al-Asr is the best drill: its first two ayat end on a heavy raa at a stop.',
        'The ي can be a madd letter (بَشِيرٍ) or a leen (خَيْرٌ); both make the stopped raa light.',
      ],
    },
    {
      title: 'Same word, two weights',
      station: 'zad',
      layout: 'concept',
      scene: 'tr3Same',
      lines: [
        'Al-Qadr says لَيْلَةِ ٱلْقَدْرِ three times.',
        'Stop at the end of the first ayah and the raa is heavy: still, after a still د, after a fatha.',
        'In ayah three you read on: لَيْلَةُ ٱلْقَدْرِ خَيْرٌ. Now the raa has a kasra, and it turns light. Then خَيْرٌ is heavy as you read on, and light if you stop on it.',
      ],
      say: [QADR1, QADR3],
      explain: [
        'This is the wow of the lesson: one word changes weight with the way you recite it.',
        'Play 97:1 to a stop, then 97:3 joined, and let the learner hear the same ٱلْقَدْرِ go heavy, then light.',
      ],
    },
    {
      title: 'A kasra that does not count',
      station: 'zad',
      layout: 'evidence',
      scene: 'tr3Wasl',
      evidence: {
        arabic: 'ٱرْجِعِىٓ إِلَىٰ رَبِّكِ رَاضِيَةً مَّرْضِيَّةً',
        meaning: 'Return to your Lord, well pleased and pleasing.',
        reference: 'Al-Fajr 89:28',
      },
      tadabbur: {
        word: 'رَاضِيَةً',
        root: 'ر ض و',
        meaning: 'Well pleased: content with what Allah gave. Words from this root come 73 times in the Quran.',
        question: 'The soul is called back pleased, and pleasing. What would make your soul pleased with Allah today?',
        action: 'Recite Al-Fajr 27 to 30 once a day this week, slowly, and give each raa its weight.',
      },
      say: [FAJR28],
      lines: [
        'ٱرْجِعِىٓ starts with a kasra, and the raa after it is still. Yet it is heavy.',
        'That kasra belongs to the hamzat al-wasl, the joining hamza. It is not the word\'s own vowel, so it does not count.',
        'Every raa in this ayah is heavy: ٱرْجِعِىٓ، رَبِّكِ، رَاضِيَةً، مَّرْضِيَّةً.',
      ],
      explain: [
        'Play the ayah and count the four heavy raas together.',
        'The same holds for ٱرْكَعُوا۟ and إِنِ ٱرْتَبْتُمْ: a kasra brought in only to start or to join never lightens the raa.',
      ],
    },
    {
      title: 'When a heavy letter follows',
      station: 'zad',
      layout: 'concept',
      scene: 'tr3Istila',
      lines: [
        'The other exception: a still raa after an original kasra is heavy if a heavy letter comes right after it in the same word.',
        'لَبِٱلْمِرْصَادِ: a kasra, then raa, then ص. The ص pulls it heavy. The same in قِرْطَاسٍ and فِرْقَةٍ.',
        'The heavy letter must be in the same word. In فَٱصْبِرْ صَبْرًا the ص starts the next word, so the raa stays light.',
      ],
      say: [FAJR14, MAARIJ5],
      explain: [
        'Taysir lists the places: قِرْطَاسٍ، مِرْصَادًا، فِرْقَةٍ، لَبِٱلْمِرْصَادِ، إِرْصَادًا.',
        'The "same word" condition is the one learners forget. Let them hear 70:5 twice.',
      ],
      teacherNote: 'Taysir ar-Rahman, p. 147 (the seventh heavy case) and p. 152 (the note on the same word).',
    },
    {
      title: 'Both are allowed',
      station: 'zad',
      layout: 'concept',
      scene: 'tr3Both',
      lines: [
        'A few words in Hafs may be read either way.',
        'Light is preferred in فِرْقٍ when you read on, in يَسْرِ at a stop, and in ٱلْقِطْرِ at a stop.',
        'Heavy is preferred in مِصْرَ at a stop. Choose one way with your teacher, and keep it.',
      ],
      say: [SHUARA63, FAJR4],
      explain: [
        'Play 26:63 and let the learner hear فِرْقٍ: light is preferred when reading on.',
        'At a stop on فِرْقٍ, Taysir reports both ways and prefers heavy. Mention it; do not drill it today.',
      ],
      teacherNote: 'Taysir ar-Rahman, pp. 149-151. مِصْرَ: the unnunated word, as in Yunus 10:87.',
    },
    {
      title: 'Heavy, light or both?',
      station: 'athar',
      layout: 'game',
      scene: 'tr3Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Nine raas from Al-Fatiha, Al-Qadr, Al-Asr and Al-Fajr. Heavy, light, or both allowed?',
        bins: [
          { id: 'heavy', label: 'Heavy', hint: 'tafkheem' },
          { id: 'light', label: 'Light', hint: 'tarqeeq' },
          { id: 'both', label: 'Both', hint: 'two allowed ways' },
        ],
        cards: [
          { label: 'رَبِّ', bin: 'heavy', why: 'The raa has a fatha.' },
          { label: 'غَيْرِ ٱلْمَغْضُوبِ', bin: 'light', why: 'The raa has a kasra.' },
          { label: 'stopping on وَٱلْعَصْرِ', bin: 'heavy', why: 'Still, after a still ص, after a fatha.' },
          { label: 'stopping on حِجْرٍ', bin: 'light', why: 'Still, after a still ج, after a kasra.' },
          { label: 'وَفِرْعَوْنَ', bin: 'light', why: 'Still, after an original kasra, no heavy letter after it.' },
          { label: 'ٱرْجِعِىٓ', bin: 'heavy', why: 'The kasra before it is a hamzat al-wasl; it does not count.' },
          { label: 'لَبِٱلْمِرْصَادِ', bin: 'heavy', why: 'A heavy ص comes after it in the same word.' },
          { label: 'stopping on خَيْرٌ', bin: 'light', why: 'A ي comes just before the stopped raa.' },
          { label: 'فِرْقٍ, reading on', bin: 'both', why: 'Both are allowed; light is preferred when reading on.' },
        ],
      },
      explain: [
        'A short review, no timer and no points. The result goes into your lesson report.',
        'Ask the learner to say each word out loud, with the stop where the card says, before choosing.',
      ],
      teacherNote: 'The result is added to your lesson report automatically.',
    },
    {
      title: 'Your turn to recite',
      station: 'athar',
      layout: 'question',
      scene: 'tr3Recite',
      lines: [
        'Recite Al-Qadr, then Al-Asr, stopping at the end of every ayah.',
        'Name the weight of each raa before you say it.',
      ],
      say: [QADR1, QADR3, QADR4, ASR1, ASR2],
      interaction: {
        kind: 'ask',
        prompt: 'Recite to your teacher. Did every raa take the weight its case gives it?',
        reveal: 'The vowel of the raa first; if it is still, the vowel before it; and two exceptions.',
      },
      explain: ['Listen especially for ٱلْقَدْرِ in 97:3 (light when joined) and the stops of Al-Asr (heavy).'],
      teacherNote: 'Note which case the learner missed: vowel, still, stop, or an exception.',
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'tr3Mission',
      lines: [
        'Every day this week, recite Al-Qadr and Al-Asr and check each raa against the rule.',
        'Choose with your teacher how you will read فِرْقٍ, and keep it.',
      ],
      interaction: {
        kind: 'choose',
        prompt: 'Which surah will you check every day?',
        options: ['Al-Qadr', 'Al-Asr', 'Al-Fajr 27-30', 'All three'],
      },
      explain: ['Start the next lesson by hearing Al-Qadr from the learner.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'tr3Next',
      lines: [
        'You have the three measures now: how long, where to stop, how heavy.',
        'Next time Part B begins: the stretch before a hamza, in full.',
      ],
      explain: ['End on Part B. Ask the learner to find a madd before a hamza in Al-Qadr.'],
    },
  ],
};
