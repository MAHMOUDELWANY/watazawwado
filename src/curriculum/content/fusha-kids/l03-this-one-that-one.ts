import type { Lesson } from '../../types';
import { lessonF03TeacherAr } from './l03-teacher-ar.js';

// Rules: docs/curriculum/fusha/RULES.md. Map: docs/curriculum/fusha/MAP.md (Lesson 3: هَذَا / ذَلِكَ; near and far in the
// park). Zad Kids cast. Masculine nouns only: هَذِهِ / تِلْكَ wait for Lesson 8. Every Arabic word fully diacritized.

const W = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'fusha' as const, emotion });

export const lessonF03: Lesson = {
  subject: 'fusha-kids',
  version: 'kids',
  subjectTitle: 'Fusha Arabic · Kids',
  number: 3,
  title: 'This One, That One',
  titleAr: 'هَذَا وَذَلِكَ',
  part: 'Level 1',
  minutes: 45,
  goal: 'By the end of this lesson, you will say هَذَا for things near you and ذَلِكَ for things far away, and ask about both.',
  reviewed: false,
  teacherAr: lessonF03TeacherAr,
  outcomes: [
    'Uses هَذَا for near and ذَلِكَ for far.',
    'Asks مَا ذَلِكَ؟ and أَذَلِكَ...؟ and answers in a full sentence.',
    'Knows six park words: طَائِرٌ، مَسْجِدٌ، بَيْتٌ، جَبَلٌ، قَمَرٌ، وَلَدٌ.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Listen first', page: 3 },
    { label: 'Near and far', page: 4 },
    { label: 'Park words', page: 6 },
    { label: 'Practice', page: 7 },
    { label: 'My mission', page: 9 },
  ],
  pages: [
    {
      title: 'This One, That One',
      station: 'spark',
      layout: 'cover',
      scene: 'fk3Cover',
      lines: [],
      explain: [
        'Greet in Arabic: السَّلَامُ عَلَيْكُمْ. Ask about the mystery box: what was inside, and who guessed right?',
        'Tell them: today we go to the park with Jiddo.',
      ],
    },
    {
      title: 'Remember?',
      station: 'spark',
      layout: 'concept',
      scene: 'fk3Recall',
      lines: [
        'Two quick questions from last time.',
        'Answer with نَعَمْ or لَا, and the whole sentence.',
      ],
      say: [W('a-haadha-qitt', 'أَهَذَا قِطٌّ؟', 'curious'), W('naam-qitt', 'نَعَمْ، هَذَا قِطٌّ.', 'happy'), W('a-haadha-kalb', 'أَهَذَا كَلْبٌ؟', 'curious'), W('la-arnab', 'لَا، هَذَا أَرْنَبٌ.', 'friendly')],
      explain: ['Two minutes. Hold up toys or pictures and ask أَهَذَا...؟'],
    },
    {
      title: 'In the park',
      station: 'spark',
      layout: 'story',
      scene: 'fk3Park',
      lines: [
        'Jiddo takes Yusuf and Maryam to the park.',
        'A little bird lands right next to them.',
        'And far away, on the hill, something is moving. What is it?',
      ],
      explain: ['Ask the child: what is near you right now? And what can you see far away, out of the window?'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'fk3Story',
      lines: [
        'Listen twice. What is near, and what is far?',
        'Maryam asks about the far one. Listen: is the word the same?',
        'Who comes running at the end?',
      ],
      say: [
        W('story-1', 'مَا هَذَا يَا جِدِّي؟', 'curious boy'),
        W('story-2', 'هَذَا طَائِرٌ.', 'warm grandfather'),
        W('story-3', 'وَمَا ذَلِكَ؟', 'curious girl, pointing far'),
        W('story-4', 'ذَلِكَ حِصَانٌ.', 'warm grandfather'),
        W('story-5', 'وَهَذَا مِشْمِشٌ!', 'laughing boy'),
      ],
      explain: [
        'Play the whole scene twice. Ask in English: what was near? (a bird). What was far? (a horse).',
        'Then ask: did Maryam say هَذَا? Let the child find the new word ذَلِكَ.',
      ],
      teacherNote: 'Input first: the pointing hand carries the meaning. Do not translate ذَلِكَ until the child guesses.',
    },
    {
      title: 'Near and far',
      station: 'zad',
      layout: 'concept',
      scene: 'fk3Near',
      lines: [
        'هَذَا: this one, near you. You could touch it.',
        'ذَلِكَ: that one, far away. You point at it.',
        'Near: هَذَا طَائِرٌ. Far: ذَلِكَ حِصَانٌ.',
      ],
      vocab: [
        { arabic: 'هَذَا', translit: 'hādhā', meaning: 'this (near)' },
        { arabic: 'ذَلِكَ', translit: 'dhālika', meaning: 'that (far)' },
      ],
      say: [W('haadha', 'هَذَا', 'close, gentle'), W('dhalika', 'ذَلِكَ', 'pointing far, slow'), W('haadha-tair', 'هَذَا طَائِرٌ.'), W('dhalika-hisan', 'ذَلِكَ حِصَانٌ.')],
      explain: [
        'Play it with your body: hold a pen and say هَذَا قَلَمٌ; point across the room and say ذَلِكَ بَابٌ.',
        'ذَ is said with the tongue between the teeth, like "th" in "that". Let the child see your tongue.',
      ],
    },
    {
      title: 'Asking about far things',
      station: 'zad',
      layout: 'concept',
      scene: 'fk3Questions',
      lines: [
        'Every question you know works with ذَلِكَ too.',
        'مَا ذَلِكَ؟ What is that? مَنْ ذَلِكَ؟ Who is that?',
        'And with أَ: أَذَلِكَ حِصَانٌ؟ Is that a horse?',
      ],
      vocab: [
        { arabic: 'مَا ذَلِكَ؟', translit: 'mā dhālika?', meaning: 'what is that?' },
        { arabic: 'مَنْ ذَلِكَ؟', translit: 'man dhālika?', meaning: 'who is that?' },
        { arabic: 'أَذَلِكَ...؟', translit: 'a-dhālika...?', meaning: 'is that...?' },
      ],
      say: [W('maa-dhalika', 'مَا ذَلِكَ؟', 'curious'), W('man-dhalika', 'مَنْ ذَلِكَ؟', 'curious'), W('a-dhalika-hisan', 'أَذَلِكَ حِصَانٌ؟', 'asking, voice going up'), W('naam-dhalika-hisan', 'نَعَمْ، ذَلِكَ حِصَانٌ.', 'happy')],
      explain: ['Ask about things far from the child and let them answer with ذَلِكَ. Then they ask you.'],
    },
    {
      title: 'Park words',
      station: 'zad',
      layout: 'concept',
      scene: 'fk3Words',
      lines: [
        'Six things in the park. Some are near, some are far.',
        'Tap each one. Say هَذَا or ذَلِكَ, then the word.',
      ],
      items: ['طَائِرٌ: bird', 'وَلَدٌ: boy', 'بَيْتٌ: house', 'مَسْجِدٌ: mosque', 'جَبَلٌ: mountain', 'قَمَرٌ: moon'],
      vocab: [
        { arabic: 'طَائِرٌ', translit: 'ṭā’ir', meaning: 'bird' },
        { arabic: 'وَلَدٌ', translit: 'walad', meaning: 'boy' },
        { arabic: 'بَيْتٌ', translit: 'bayt', meaning: 'house' },
        { arabic: 'مَسْجِدٌ', translit: 'masjid', meaning: 'mosque' },
        { arabic: 'جَبَلٌ', translit: 'jabal', meaning: 'mountain' },
        { arabic: 'قَمَرٌ', translit: 'qamar', meaning: 'moon' },
      ],
      say: [W('haadha-tair', 'هَذَا طَائِرٌ.'), W('haadha-walad', 'هَذَا وَلَدٌ.'), W('haadha-bayt', 'هَذَا بَيْتٌ.'), W('dhalika-masjid', 'ذَلِكَ مَسْجِدٌ.'), W('dhalika-jabal', 'ذَلِكَ جَبَلٌ.'), W('dhalika-qamar', 'ذَلِكَ قَمَرٌ.')],
      explain: ['The moon is the best "far" word: always ذَلِكَ. Ask the child to say it tonight when they see the moon.'],
    },
    {
      title: 'Near or far?',
      station: 'athar',
      layout: 'game',
      scene: 'fk3Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Is it near or far? Choose هَذَا or ذَلِكَ.',
        bins: [
          { id: 'near', label: 'هَذَا', hint: 'near' },
          { id: 'far', label: 'ذَلِكَ', hint: 'far' },
        ],
        cards: [
          { label: 'A pen in your hand', bin: 'near', why: 'Near: هَذَا قَلَمٌ.' },
          { label: 'The moon in the sky', bin: 'far', why: 'Far: ذَلِكَ قَمَرٌ.' },
          { label: 'A cat on your lap', bin: 'near', why: 'Near: هَذَا قِطٌّ.' },
          { label: 'A mosque on the hill', bin: 'far', why: 'Far: ذَلِكَ مَسْجِدٌ.' },
          { label: 'A book on your desk', bin: 'near', why: 'Near: هَذَا كِتَابٌ.' },
          { label: 'A horse across the field', bin: 'far', why: 'Far: ذَلِكَ حِصَانٌ.' },
        ],
      },
      explain: ['Let the child say the full sentence before sorting. The result goes into your report.'],
    },
    {
      title: 'Your turn: point and ask',
      station: 'athar',
      layout: 'question',
      scene: 'fk3Talk',
      lines: [
        'Look around your room. Pick one thing near you and one far away.',
        'Ask your teacher: مَا هَذَا؟ and مَا ذَلِكَ؟ Then your teacher asks you.',
      ],
      say: [W('maa-haadha', 'مَا هَذَا؟', 'curious'), W('maa-dhalika', 'مَا ذَلِكَ؟', 'curious')],
      interaction: { kind: 'ask', prompt: 'Play five rounds. Did you touch for هَذَا and point for ذَلِكَ?', reveal: 'مُمْتَازٌ! Near and far, in Arabic.' },
      explain: ['On a video call, "far" can be something behind the child. Keep it moving: touch, point, touch, point.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'fk3Mission',
      lines: [
        'Tonight, look out of the window with someone at home.',
        'Point at three far things: ذَلِكَ قَمَرٌ، ذَلِكَ بَيْتٌ...',
      ],
      interaction: { kind: 'choose', prompt: 'Who will look with you?', options: ['Mum', 'Dad', 'My brother or sister', 'Grandma or Grandpa'] },
      explain: ['Ask about the window next time: what did they see far away?'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'fk3Next',
      lines: [
        'Back home, Maryam shows Yusuf her room.',
        'Yusuf says بَابٌ, a door. Maryam laughs: no, ٱلْبَابُ, the door, my door!',
        'Next time: the little word ٱلْـ, "the".',
      ],
      say: [W('al-bab', 'ٱلْبَابُ', 'proud girl')],
      explain: ['End on the door. Let the child hear the difference between بَابٌ and ٱلْبَابُ.'],
    },
  ],
};
