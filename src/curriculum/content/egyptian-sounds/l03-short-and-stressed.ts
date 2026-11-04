import type { Lesson } from '../../types';
import { lessonES03TeacherAr } from './l03-teacher-ar.js';

// Rules: docs/curriculum/egyptian/RULES.md. Map: docs/curriculum/egyptian/MAP-sounds.md (Lesson 3: endings fall, long
// vowels shorten, unstressed vowels drop, the Cairo stress; on the metro). Adults cast. Adam's Fusha lines play in the
// Fusha clone; Egyptian lines are recorded by the owner (eg).

const E = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'eg' as const, emotion });
const F = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'fusha' as const, emotion });

export const lessonES03: Lesson = {
  subject: 'egyptian-sounds',
  version: 'adults',
  subjectTitle: 'Egyptian Arabic · Sounds',
  number: 3,
  title: 'Short and Stressed',
  titleAr: 'قصير ومشدود',
  part: 'Sounds',
  minutes: 50,
  goal: 'By the end of this lesson, you will hear why Cairo Arabic sounds faster than Fusha, and put the beat where Cairenes put it.',
  reviewed: false,
  teacherAr: lessonES03TeacherAr,
  outcomes: [
    'Drops the Fusha case endings: مَدْرَسَةٌ → madrasa.',
    'Shortens a long vowel before two consonants: كتاب → kitabha.',
    'Drops an unstressed vowel: رايح → rayḥa.',
    'Puts the Cairo stress near the end: madrása, maktába.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Listen first', page: 3 },
    { label: 'Shorter', page: 4 },
    { label: 'The beat', page: 7 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'Short and Stressed',
      station: 'spark',
      layout: 'cover',
      scene: 'es3Cover',
      lines: [],
      explain: [
        'Check the mission: one street word and one book word. Which layer is each in?',
        'Tell them: today is about the music, not the letters: length and beat.',
      ],
    },
    {
      title: 'Remember?',
      station: 'spark',
      layout: 'concept',
      scene: 'es3Recall',
      lines: [
        'Last time: ث and ذ went to t and d in street words (تلاتة، دهب), and to s and z in book words (ذكي).',
        'Four sounds down. Today, something you hear in every single sentence.',
      ],
      say: [E('talata', 'تلاتة'), E('dahab', 'دهب'), E('zaki', 'ذكي')],
      explain: ['Two minutes. Ask for one street word and one book word, said the Cairo way.'],
    },
    {
      title: 'On the metro',
      station: 'spark',
      layout: 'story',
      scene: 'es3Metro',
      lines: [
        'Adam takes the metro with Mona. He reads the station sign aloud, every Fusha vowel in its place.',
        'The announcement says the same name in half the time.',
        'Mona laughs: "You read like a poem. We talk like a train."',
      ],
      explain: ['Ask: when you hear Egyptians speak, what makes it hard to follow? Speed? Missing endings?'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'es3Story',
      lines: [
        'Listen twice. Hear the announcement, then Adam reading the sign.',
        'Where is Adam going? How does he say the word, and how does Mona say it?',
        'What does Mona say about the way Egyptians talk?',
      ],
      say: [
        E('story-1', 'المحطة الجاية: السادات.', 'metro announcer'),
        F('story-2', 'مَحَطَّةُ ٱلسَّادَاتِ.', 'careful, reading'),
        E('story-3', 'إنت رايح فين يا آدم؟', 'woman, friendly'),
        E('story-4', 'رايح المدرسة… مدرسة!', 'man, trying, then correcting himself'),
        E('story-5', 'برافو! الكلام هنا أسرع، والآخر بيقع.', 'woman, laughing'),
      ],
      explain: [
        'Play the scene twice. Ask in English: where is Adam going? (to the school, where he volunteers).',
        'Then: Mona\'s point? (speech here is faster, the ends fall off). Ask the learner to say مدرسة the way Adam said it the second time.',
      ],
      teacherNote: 'Input first. The pair mad-ra-sa / mad-RA-sa is the heart of the lesson; let the learner hear it before naming it.',
    },
    {
      title: 'The endings fall off',
      station: 'zad',
      layout: 'concept',
      scene: 'es3Endings',
      lines: [
        'Fusha words carry endings: madrasatun, kitaabun, baytun.',
        'Cairo drops them. You hear madrasa, kitaab, beet.',
        'That alone makes every sentence shorter. The grammar from Fusha is still in your head; it just stops being said.',
      ],
      vocab: [
        { arabic: 'مدرسة', translit: 'madrása', meaning: 'school' },
        { arabic: 'كتاب', translit: 'kitaab', meaning: 'book' },
        { arabic: 'بيت', translit: 'beet', meaning: 'house, home' },
      ],
      say: [F('madrasatun', 'مَدْرَسَةٌ'), E('madrasa', 'مدرسة'), F('kitabun', 'كِتَابٌ'), E('kitaab', 'كتاب')],
      explain: ['Say a Fusha word, then cut its ending with a hand chop: kitaabun → kitaab. The learner repeats the chopped one.'],
    },
    {
      title: 'Long vowels shrink',
      station: 'zad',
      layout: 'concept',
      scene: 'es3Shrink',
      lines: [
        'Add "her" to كتاب and Fusha says kitaabuhaa. Cairo says kitabha.',
        'The long aa shrinks to a short a, because two consonants now follow it (bh).',
        'The same with باب: baab, but babha (her door), babna (our door).',
      ],
      vocab: [
        { arabic: 'كتابها', translit: 'kitabha', meaning: 'her book' },
        { arabic: 'بابنا', translit: 'babna', meaning: 'our door' },
      ],
      say: [E('kitabha', 'كتابها'), E('baab', 'باب'), E('babha', 'بابها'), E('babna', 'بابنا')],
      explain: ['Tap the table: long for baab (two taps), short for babha (one tap). Rhythm first, rule second.'],
    },
    {
      title: 'A vowel disappears',
      station: 'zad',
      layout: 'concept',
      scene: 'es3Drop',
      lines: [
        'رايح is raayiḥ, going (a man). Add the ending for a woman, and the i between them vanishes: رايحة, rayḥa.',
        'The same pattern: كاتب kaatib → كاتبة katba. ساكن saakin (living somewhere) → ساكنة sakna.',
        'Cairo hates a weak vowel squeezed between two strong ones. It simply drops it.',
      ],
      vocab: [
        { arabic: 'رايحة', translit: 'rayḥa', meaning: 'going (a woman)' },
        { arabic: 'ساكنة', translit: 'sakna', meaning: 'living (somewhere, a woman)' },
      ],
      say: [E('rayih', 'رايح'), E('rayha', 'رايحة'), E('sakin', 'ساكن'), E('sakna', 'ساكنة')],
      explain: ['Notice that the long aa also shortens (raayiḥ → rayḥa): it is the shrink rule from the last page, working together with the drop.'],
    },
    {
      title: 'Where the beat falls',
      station: 'zad',
      layout: 'concept',
      scene: 'es3Stress',
      lines: [
        'Say مدرسة the way many learners do: MAD-ra-sa, the beat at the start.',
        'Cairo moves the beat closer to the end: mad-RA-sa. The same with مكتبة: mak-TA-ba.',
        'Get the beat right and people understand you even when the rest is shaky.',
      ],
      vocab: [{ arabic: 'مكتبة', translit: 'maktába', meaning: 'library, bookshop' }],
      say: [E('madrasa-2', 'مدرسة', 'stress clearly on ra'), E('maktaba', 'مكتبة', 'stress clearly on ta')],
      explain: [
        'Clap the syllables: soft, LOUD, soft. Then say the word over the claps.',
        'Do not teach the full stress rules. One pattern (CVC-CV-CV words) is enough to tune the ear.',
      ],
    },
    {
      title: 'The music of Cairo',
      station: 'zad',
      layout: 'concept',
      scene: 'es3Music',
      lines: [
        'Put the four habits together: endings fall, long vowels shrink, weak vowels drop, the beat moves.',
        'Fusha: إِلَى أَيْنَ أَنْتَ ذَاهِبٌ؟ Nine syllables. Cairo: رايح فين؟ Three.',
        'That is why Cairo sounds fast. It is not faster talking; it is fewer syllables.',
      ],
      say: [F('ila-ayna', 'إِلَى أَيْنَ أَنْتَ ذَاهِبٌ؟', 'careful'), E('rayih-fen', 'رايح فين؟', 'natural, quick')],
      explain: ['Count the syllables together on fingers. The learner should feel the difference, not just see it.'],
      teacherNote: 'The wow: "Egyptians talk fast" turns out to be "Egyptians say fewer syllables". That is something the learner can do.',
    },
    {
      title: 'Book or Cairo?',
      station: 'athar',
      layout: 'game',
      scene: 'es3Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Is this how Fusha says it, or how Cairo says it?',
        bins: [
          { id: 'book', label: 'Fusha', hint: 'the book' },
          { id: 'cairo', label: 'Cairo', hint: 'the street' },
        ],
        cards: [
          { label: 'madrasatun', bin: 'book', why: 'The case ending -un is kept: Fusha.' },
          { label: 'madrása', bin: 'cairo', why: 'No ending, beat on ra: Cairo.' },
          { label: 'kitabha', bin: 'cairo', why: 'The long aa shrank before bh: Cairo.' },
          { label: 'kitaabuhaa', bin: 'book', why: 'Every vowel in place: Fusha.' },
          { label: 'rayḥa', bin: 'cairo', why: 'The weak i dropped: Cairo.' },
          { label: 'baytun', bin: 'book', why: 'Ending and diphthong kept: Fusha (Cairo: beet).' },
        ],
      },
      explain: ['Let the learner say each card aloud before sorting. The result goes into your report.'],
    },
    {
      title: 'Your turn: the announcer',
      station: 'athar',
      layout: 'question',
      scene: 'es3Talk',
      lines: [
        'Be the metro announcer. Read three station names the Cairo way: المحطة الجاية…',
        'Then your teacher asks: إنت رايح فين؟ or إنتي رايحة فين؟ Answer with a place: المدرسة، المكتبة، البيت.',
      ],
      say: [E('mahatta-gaya', 'المحطة الجاية: العتبة.', 'announcer'), E('rayha-fen', 'إنتي رايحة فين؟', 'friendly, to a woman')],
      interaction: { kind: 'ask', prompt: 'Did the beat land on ra in مدرسة, and did رايحة lose its i?', reveal: 'برافو! That is the music of Cairo.' },
      explain: ['Model each answer once, then let the learner repeat at speed. Correct length and stress only.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'es3Mission',
      lines: [
        'Find a 30-second clip of Egyptians talking (a vlog, a series, an interview).',
        'Shadow it: play a sentence, pause, say it back with the same speed and beat. Five sentences.',
      ],
      interaction: { kind: 'choose', prompt: 'What will you shadow?', options: ['A vlog', 'A series or film', 'An interview', 'A cooking video'] },
      explain: ['Next time, ask the learner to perform one sentence from memory.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'es3Next',
      lines: [
        'Mona invites Adam home. Her mother opens the door: أهلاً! البيت بيتك.',
        'Adam hears beet, not bayt. And the day is yoom, not yawm.',
        'Next time: ay becomes ee, aw becomes oo.',
      ],
      say: [E('beet-beetak', 'أهلاً! البيت بيتك.', 'warm mother, welcoming')],
      explain: ['End on the welcome. Ask: what happened to the ay in بيت?'],
    },
  ],
};
