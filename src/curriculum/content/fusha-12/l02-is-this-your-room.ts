import type { Lesson } from '../../types';
import { lessonFT02TeacherAr } from './l02-teacher-ar.js';

// Rules: docs/curriculum/fusha/RULES.md. Map: docs/curriculum/fusha/MAP-12plus.md (Lesson 2: أَ...؟ نَعَمْ / لَا; the dorm).
// Every Arabic word is fully diacritized and plays on tap in the Mahmoud Fusha clone.

const W = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'fusha' as const, emotion });

export const lessonFT02: Lesson = {
  subject: 'fusha-12',
  version: 'teens',
  subjectTitle: 'Fusha Arabic · 12+',
  number: 2,
  title: 'Is This Your Room?',
  titleAr: 'أَهَذِهِ غُرْفَتُكَ؟',
  part: 'Level 1',
  minutes: 50,
  goal: 'By the end of this lesson, you will ask yes-or-no questions in Arabic, answer them in full, and name six things in a room.',
  reviewed: false,
  teacherAr: lessonFT02TeacherAr,
  outcomes: [
    'Follows a short scene in Arabic built on yes-or-no questions.',
    'Makes a question by putting أَ in front of a sentence, with no other change.',
    'Answers نَعَمْ، هَذَا... / لَا، هَذِهِ... with the right هَذَا or هَذِهِ.',
    'Follows a "no" with مَا هَذَا؟ to find the right word.',
    'Knows six new words for a room.',
  ],
  chapters: [
    { label: 'The phone', page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'أَ', page: 3 },
    { label: 'Answers', page: 4 },
    { label: 'The room', page: 5 },
    { label: 'Practice', page: 6 },
    { label: 'My mission', page: 10 },
  ],
  pages: [
    {
      title: 'Is This Your Room?',
      station: 'spark',
      layout: 'cover',
      scene: 'ft2Cover',
      lines: [],
      explain: [
        'Greet the learner in Fusha and ask about the mission: which room did they label, and which words did they use?',
        'Tell them: today Yusuf spends his first night in the dorm, and something goes wrong.',
      ],
    },
    {
      title: 'Whose phone?',
      station: 'spark',
      layout: 'story',
      scene: 'ft2Phone',
      lines: [
        'Last time, Sara held up a phone at the end of class.',
        'She asked Yusuf one question, and he checked his pocket.',
        'Empty. نَعَمْ! He says the one word he is sure of.',
      ],
      say: [W('a-haadha-haatifuka', 'أَهَذَا هَاتِفُكَ؟', 'friendly, holding something up'), W('naam', 'نَعَمْ!', 'relieved'), W('shukran', 'شُكْرًا.', 'grateful')],
      vocab: [
        { arabic: 'هَاتِفٌ', translit: 'hātif', meaning: 'phone' },
        { arabic: 'هَاتِفُكَ', translit: 'hātifuka', meaning: 'your phone (to a man; this ending comes in Lesson 7)' },
        { arabic: 'شُكْرًا', translit: 'shukran', meaning: 'thank you' },
      ],
      explain: [
        'Quick recap of the cliffhanger. Ask: what do you think أَهَذَا هَاتِفُكَ؟ means? Most learners get it from the scene.',
        'Treat هَاتِفُكَ (your phone) as one word for now; the ending ـكَ is taught properly in Lesson 7.',
      ],
    },
    {
      title: 'Listen first: lights out',
      station: 'zad',
      layout: 'story',
      scene: 'ft2Dark',
      lines: [
        'That night, the power goes out in the dorm. Ustadh Kareem comes in with a torch.',
        'Yusuf touches things in the dark and guesses. Listen to every guess.',
        'Every question starts with the same sound. Which one? And what are the two answers?',
      ],
      say: [
        W('d-1', 'أَهَذَا سَرِيرٌ؟', 'unsure, in the dark'),
        W('d-2', 'لَا، هَذَا مَكْتَبٌ.', 'calm, amused'),
        W('d-3', 'أَهَذِهِ نَافِذَةٌ؟', 'unsure'),
        W('d-4', 'نَعَمْ، هَذِهِ نَافِذَةٌ.', 'kind'),
        W('d-5', 'أَهَذَا بَابٌ؟', 'hopeful'),
        W('d-6', 'نَعَمْ! وَهَذَا نُورٌ!', 'happy, the lights come back'),
      ],
      explain: [
        'This is the input. Play the whole scene twice before explaining anything.',
        'Ask in English: what did Yusuf touch? Was he right? What happened at the end? (The light came back: نُورٌ.)',
        'Then ask for the first sound of every question. Let the learner find أَ.',
      ],
      teacherNote: 'Comprehensible input: the torch and the objects carry the meaning. Translate only what cannot be guessed.',
    },
    {
      title: 'One letter makes a question',
      station: 'zad',
      layout: 'concept',
      scene: 'ft2Hamza',
      lines: [
        'English moves words around to ask: "This is a bed" becomes "Is this a bed?"',
        'Arabic moves nothing. It adds one letter at the front: أَ.',
        'هَذَا سَرِيرٌ. → أَهَذَا سَرِيرٌ؟ Same words, same order, one letter more.',
        'In speech, your voice rises at the end. In writing, أَ joins the next word.',
      ],
      vocab: [
        { arabic: 'أَ', translit: 'a', meaning: 'turns a sentence into a yes-or-no question' },
        { arabic: 'سَرِيرٌ', translit: 'sarīr', meaning: 'bed' },
      ],
      say: [W('haadha-sarir', 'هَذَا سَرِيرٌ.'), W('a-haadha-sarir', 'أَهَذَا سَرِيرٌ؟', 'asking, voice rising')],
      explain: [
        'This is the wow of the lesson: English needs a word shuffle, Arabic needs one letter.',
        'Ask the learner to turn three of last lesson\'s sentences into questions: هَذَا كِتَابٌ، هَذِهِ حَقِيبَةٌ، هَذَا قَلَمٌ.',
      ],
    },
    {
      title: 'Answer in full',
      station: 'zad',
      layout: 'concept',
      scene: 'ft2Answers',
      lines: [
        'نَعَمْ is yes. Then say the sentence again, as proof you understood.',
        'لَا is no. Then give the right word, with هَذَا or هَذِهِ.',
        'And when you do not know the right word? Ask: مَا هَذَا؟',
      ],
      vocab: [
        { arabic: 'نَعَمْ', translit: 'na‘am', meaning: 'yes' },
        { arabic: 'لَا', translit: 'lā', meaning: 'no' },
        { arabic: 'مَكْتَبٌ', translit: 'maktab', meaning: 'desk' },
      ],
      say: [W('naam-hiya', 'نَعَمْ، هَذِهِ نَافِذَةٌ.'), W('la-maktab', 'لَا، هَذَا مَكْتَبٌ.'), W('maa-haadha', 'مَا هَذَا؟', 'curious')],
      explain: [
        'Insist on the full answer. نَعَمْ alone is fine in life, but the full sentence is how the structure sticks.',
        'The chain لَا → مَا هَذَا؟ joins today\'s question with last lesson\'s. Practise it twice.',
      ],
    },
    {
      title: 'Six things in the room',
      station: 'zad',
      layout: 'concept',
      scene: 'ft2Words',
      lines: [
        'The lights are back. Here is Yusuf\'s room.',
        'Three words take هَذَا, three take هَذِهِ. The ة tells you which.',
      ],
      items: ['سَرِيرٌ: bed', 'مِصْبَاحٌ: lamp', 'كُرْسِيٌّ: chair', 'خِزَانَةٌ: wardrobe', 'وِسَادَةٌ: pillow', 'مِرْآةٌ: mirror'],
      vocab: [
        { arabic: 'مِصْبَاحٌ', translit: 'miṣbāḥ', meaning: 'lamp' },
        { arabic: 'كُرْسِيٌّ', translit: 'kursiyy', meaning: 'chair' },
        { arabic: 'خِزَانَةٌ', translit: 'khizāna', meaning: 'wardrobe, cupboard' },
        { arabic: 'وِسَادَةٌ', translit: 'wisāda', meaning: 'pillow' },
        { arabic: 'مِرْآةٌ', translit: 'mir’āh', meaning: 'mirror (feminine, without a ة)' },
      ],
      say: [W('sarir', 'سَرِيرٌ'), W('misbah', 'مِصْبَاحٌ'), W('kursi', 'كُرْسِيٌّ'), W('khizana', 'خِزَانَةٌ'), W('wisada', 'وِسَادَةٌ'), W('mirah', 'مِرْآةٌ')],
      explain: [
        'Read each word, then ask هَذَا or هَذِهِ? for it.',
        'مِرْآةٌ is the trap: feminine, but it ends in ـآة. Ask the learner to spot the ة hiding in it.',
      ],
    },
    {
      title: 'By torchlight',
      station: 'athar',
      layout: 'question',
      scene: 'ft2Torch',
      lines: ['The torch lands on something tall with two doors. Yusuf asks: أَهَذَا سَرِيرٌ؟'],
      say: [W('a-haadha-sarir', 'أَهَذَا سَرِيرٌ؟', 'asking, voice rising')],
      interaction: {
        kind: 'clues',
        prompt: 'What does Ustadh Kareem answer?',
        clues: [
          { label: 'لَا، هَذِهِ خِزَانَةٌ.', correct: true },
          { label: 'لَا، هَذَا خِزَانَةٌ.', correct: false },
          { label: 'نَعَمْ، هَذَا سَرِيرٌ.', correct: false },
        ],
      },
      explain: ['The middle option is the trap: the right word with the wrong هَذَا. Ask why it is wrong.'],
    },
    {
      title: 'Yes or no?',
      station: 'athar',
      layout: 'game',
      scene: 'ft2Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        look: 'row',
        prompt: 'Eight questions in Yusuf\'s room. Look at the thing, read the question: نَعَمْ or لَا?',
        bins: [
          { id: 'naam', label: 'نَعَمْ', hint: 'yes' },
          { id: 'la', label: 'لَا', hint: 'no' },
        ],
        cards: [
          { label: 'A bed · أَهَذَا سَرِيرٌ؟', bin: 'naam', why: 'نَعَمْ، هَذَا سَرِيرٌ.' },
          { label: 'A lamp · أَهَذَا كُرْسِيٌّ؟', bin: 'la', why: 'لَا، هَذَا مِصْبَاحٌ.' },
          { label: 'A pillow · أَهَذِهِ وِسَادَةٌ؟', bin: 'naam', why: 'نَعَمْ، هَذِهِ وِسَادَةٌ.' },
          { label: 'A mirror · أَهَذِهِ نَافِذَةٌ؟', bin: 'la', why: 'لَا، هَذِهِ مِرْآةٌ.' },
          { label: 'A desk · أَهَذَا مَكْتَبٌ؟', bin: 'naam', why: 'نَعَمْ، هَذَا مَكْتَبٌ.' },
          { label: 'A wardrobe · أَهَذَا بَابٌ؟', bin: 'la', why: 'لَا، هَذِهِ خِزَانَةٌ.' },
          { label: 'A bag · أَهَذِهِ حَقِيبَةٌ؟', bin: 'naam', why: 'نَعَمْ، هَذِهِ حَقِيبَةٌ.' },
          { label: 'A phone · أَهَذَا كِتَابٌ؟', bin: 'la', why: 'لَا، هَذَا هَاتِفٌ.' },
        ],
      },
      explain: [
        'A short review, no timer and no points. The result goes into your lesson report.',
        'Ask the learner to say the full answer aloud before choosing.',
      ],
      teacherNote: 'The result is added to your lesson report automatically.',
    },
    {
      title: 'When the answer is no',
      station: 'athar',
      layout: 'concept',
      scene: 'ft2Chain',
      lines: [
        'Real conversations do not stop at لَا.',
        'Guess, hear لَا, ask مَا هَذَا؟, learn the word, say it back.',
        'That chain is how you will learn new words from Arabic speakers, with no English at all.',
      ],
      say: [W('c-1', 'أَهَذَا قَلَمٌ؟', 'guessing'), W('c-2', 'لَا.'), W('c-3', 'مَا هَذَا؟', 'curious'), W('c-4', 'هَذَا مِفْتَاحٌ.'), W('c-5', 'مِفْتَاحٌ! شُكْرًا.', 'pleased, learning')],
      explain: [
        'Model the chain with a real object the learner has not learned (a remote, a cup).',
        'Point out that this chain lets them keep learning outside class, from any Arabic speaker.',
      ],
    },
    {
      title: 'Your turn: lights out',
      station: 'athar',
      layout: 'question',
      scene: 'ft2Talk',
      lines: [
        'Your teacher holds things just out of sight of the camera. You guess with أَ.',
        'If the answer is لَا, keep the chain going: مَا هَذَا؟',
      ],
      say: [W('a-haadha-sarir', 'أَهَذَا سَرِيرٌ؟', 'asking, voice rising'), W('maa-haadha', 'مَا هَذَا؟', 'curious')],
      interaction: { kind: 'ask', prompt: 'Five guesses, then swap. Did every answer start with نَعَمْ or لَا, and use هَذَا or هَذِهِ right?', reveal: 'مُمْتَازٌ! You just learned a word in Arabic, from Arabic.' },
      explain: ['Use things from your room the learner has not learned, so the chain brings in real new words. Swap after five.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'ft2Mission',
      lines: [
        'Play the guessing game with someone at home: one guesses with أَ, the other answers نَعَمْ or لَا.',
        'Add one new word to your sticky notes, learned with مَا هَذَا؟',
      ],
      interaction: { kind: 'choose', prompt: 'Which new word will you go hunting for?', options: ['Something in the kitchen', 'Something on my desk', 'Something in the bathroom', 'Something outside'] },
      explain: ['Start the next lesson with the new word they found and how they found it.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'ft2Next',
      lines: [
        'Morning. Sara shows Yusuf the campus from the dorm\'s roof.',
        'She points at a building far away. Not هَذَا: it is too far.',
        'Next time: near and far, هَذَا and ذَلِكَ.',
      ],
      say: [W('dhalika', 'ذَلِكَ', 'pointing far')],
      explain: ['End on the far building. Ask the learner how English says "this" and "that", and guess what Arabic does.'],
    },
  ],
};
