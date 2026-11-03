import type { Lesson } from '../../types';
import { lessonFT202TeacherAr } from './l02-teacher-ar.js';

// Rules: docs/curriculum/fusha/RULES.md. Map: docs/curriculum/fusha/MAP-level-2.md (Lesson 2: the present verb; 12+ theme:
// a timetable at the institute). Institute cast (Yusuf, Sara, Ustadh Kareem). Sound verbs only; eight persons as in
// Lesson 1 (أَنَا، أَنْتَ، أَنْتِ، هُوَ، هِيَ، نَحْنُ، أَنْتُمْ، هُمْ). Every Arabic word fully diacritized.

const W = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'fusha' as const, emotion });

export const lessonFT202: Lesson = {
  subject: 'fusha-12-2',
  version: 'teens',
  subjectTitle: 'Fusha Arabic · 12+ · Level 2',
  number: 2,
  title: 'The Timetable',
  titleAr: 'ٱلْجَدْوَلُ',
  part: 'Level 2',
  minutes: 45,
  goal: 'By the end of this lesson, you will talk about your week, building the present verb for every person.',
  reviewed: false,
  teacherAr: lessonFT202TeacherAr,
  outcomes: [
    'Knows the four front letters of the present verb: أَ، نَ، يَ، تَ.',
    'Builds the present for eight persons, including تَدْرُسِينَ، تَدْرُسُونَ، يَدْرُسُونَ.',
    'Learns each verb as a pair (كَتَبَ يَكْتُبُ) because the middle vowel changes.',
    'Asks مَتَى تَدْرُسُ؟ and describes a week in five sentences.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'The front letters', page: 3 },
    { label: 'Pairs', page: 7 },
    { label: 'Practice', page: 8 },
    { label: 'My mission', page: 10 },
  ],
  pages: [
    {
      title: 'The Timetable',
      station: 'spark',
      layout: 'cover',
      scene: 'fw2Cover',
      lines: [],
      explain: [
        'Ask about the mission: did the learner write the three-person story from last time? Read one sentence together.',
        'Tell them: last time was the past. Today is the verb for habits, timetables and right now.',
      ],
    },
    {
      title: 'A new week',
      station: 'spark',
      layout: 'story',
      scene: 'fw2Week',
      lines: [
        'The trip is over. A new term starts, and the new timetable is pinned on the board.',
        'Ustadh Kareem wants to know who is free when, so he can plan a study group.',
        'The verbs you hear will not be about yesterday. Listen to how they begin.',
      ],
      explain: ['Ask: what is on your timetable this week? Which day is the busiest? Keep it in English for now.'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'fw2Story',
      lines: [
        'Listen twice. When does Sara study? When does she work?',
        'What does Yusuf do in the mornings?',
        'When can they all meet, and what do the students do after class?',
      ],
      say: [
        W('story-1', 'مَتَى تَدْرُسِينَ يَا سَارَةُ؟', 'teacher, planning'),
        W('story-2', 'أَدْرُسُ فِي ٱلصَّبَاحِ، وَأَعْمَلُ فِي ٱلْمَسَاءِ.', 'young woman'),
        W('story-3', 'وَأَنْتَ يَا يُوسُفُ؟', 'teacher'),
        W('story-4', 'أَلْعَبُ كُرَةَ ٱلْقَدَمِ فِي ٱلصَّبَاحِ.', 'young man, a bit guilty'),
        W('story-5', 'إِذَنْ نَدْرُسُ مَعًا يَوْمَ ٱلْأَحَدِ.', 'teacher, deciding'),
        W('story-6', 'وَبَعْدَ ٱلدَّرْسِ يَذْهَبُ ٱلطُّلَّابُ إِلَى ٱلْمَكْتَبَةِ.', 'teacher, smiling'),
      ],
      explain: [
        'Play the scene twice. Ask in English: when does Sara study and work? What does Yusuf do in the mornings? When will they meet?',
        'Then ask: did anyone say ذَهَبْتُ or دَرَسْتُ? What do these verbs start with instead?',
      ],
      teacherNote: 'Comprehensible input: the timetable on the stage carries the meaning. Explain nothing until the second listening is done.',
    },
    {
      title: 'Four front letters',
      station: 'zad',
      layout: 'concept',
      scene: 'fw2Letters',
      lines: [
        'The past puts the person at the back. The present puts it at the front.',
        'Only four letters can stand there: أَ، نَ، يَ، تَ.',
        'Arabic students remember them as one word: أَنَيْتُ. If a verb starts with one of them, check: it may be the present.',
      ],
      vocab: [
        { arabic: 'أَدْرُسُ', translit: 'adrusu', meaning: 'I study' },
        { arabic: 'نَدْرُسُ', translit: 'nadrusu', meaning: 'we study' },
        { arabic: 'يَدْرُسُ', translit: 'yadrusu', meaning: 'he studies' },
        { arabic: 'تَدْرُسُ', translit: 'tadrusu', meaning: 'she studies / you study (m)' },
      ],
      say: [W('adrusu', 'أَدْرُسُ'), W('nadrusu', 'نَدْرُسُ'), W('yadrusu', 'يَدْرُسُ'), W('tadrusu', 'تَدْرُسُ'), W('anaytu', 'أَنَيْتُ', 'slow, as a memory word')],
      explain: [
        'Write أ ن ي ت in a column and let the learner read the memory word.',
        'Warn gently: not every word starting with these letters is a present verb (تُفَّاحٌ is an apple). It is a clue, not a rule.',
      ],
    },
    {
      title: 'One person',
      station: 'zad',
      layout: 'concept',
      scene: 'fw2One',
      lines: [
        'I: أَدْرُسُ. He: يَدْرُسُ. She: تَدْرُسُ.',
        'You, to a man: تَدْرُسُ, the same as "she". The context tells them apart.',
        'You, to a woman: تَدْرُسِينَ. Front and back: تَـ at the start, ـِينَ at the end.',
      ],
      vocab: [{ arabic: 'تَدْرُسِينَ', translit: 'tadrusīna', meaning: 'you study (to a woman)' }],
      say: [W('tadrusina', 'تَدْرُسِينَ'), W('mata-tadrusina', 'مَتَى تَدْرُسِينَ؟', 'asking a woman')],
      explain: [
        'Ask the learner the question in both forms: مَتَى تَدْرُسُ؟ and مَتَى تَدْرُسِينَ؟ Who could each one be for?',
        'تَدْرُسِينَ is the first form that changes at both ends. The next page has two more.',
      ],
    },
    {
      title: 'More than one',
      station: 'zad',
      layout: 'concept',
      scene: 'fw2Many',
      lines: [
        'We: نَدْرُسُ. Only the front changes.',
        'You all: تَدْرُسُونَ. They: يَدْرُسُونَ. Front letter plus ـُونَ at the back.',
        'Listen to the ending ـُونَ: it means "more than one person", and you will hear it everywhere.',
      ],
      vocab: [
        { arabic: 'تَدْرُسُونَ', translit: 'tadrusūna', meaning: 'you all study' },
        { arabic: 'يَدْرُسُونَ', translit: 'yadrusūna', meaning: 'they study' },
      ],
      say: [W('tadrusuna', 'تَدْرُسُونَ'), W('yadrusuna', 'يَدْرُسُونَ'), W('yadhhabuna', 'ٱلطُّلَّابُ يَذْهَبُونَ إِلَى ٱلْمَكْتَبَةِ.')],
      explain: [
        'Connect it to Lesson 1: ذَهَبُوا ended in ـُوا; يَذْهَبُونَ ends in ـُونَ. Same "they" idea, a cousin of the ending.',
        'When the verb comes first (يَذْهَبُ ٱلطُّلَّابُ), it stays singular. Mention it only if the learner asks about story-6.',
      ],
    },
    {
      title: 'Back and front',
      station: 'zad',
      layout: 'concept',
      scene: 'fw2Both',
      lines: [
        'Put the two tables side by side, past and present, the same eight people.',
        'The past wears its "who" at the back. The present wears it at the front, and three people wear it at both ends.',
        'So the first letter tells you the time, and the last letters tell you how many.',
      ],
      explain: [
        'Read across the two tables row by row: دَرَسْتُ / أَدْرُسُ, دَرَسْنَا / نَدْرُسُ, دَرَسُوا / يَدْرُسُونَ.',
        'Ask: which persons have letters at both ends in the present? (أَنْتِ، أَنْتُمْ، هُمْ).',
      ],
      teacherNote: 'The wow: two tables the learner can now read across. It turns sixteen forms into two simple ideas.',
    },
    {
      title: 'Learn verbs in pairs',
      station: 'zad',
      layout: 'concept',
      scene: 'fw2Pairs',
      lines: [
        'One thing the endings do not tell you: the vowel in the middle of the present.',
        'ذَهَبَ يَذْهَبُ, with a. كَتَبَ يَكْتُبُ, with u. جَلَسَ يَجْلِسُ, with i.',
        'So every new verb is learnt as a pair, past and present. Dictionaries list them that way.',
      ],
      vocab: [
        { arabic: 'كَتَبَ يَكْتُبُ', translit: 'kataba yaktubu', meaning: 'to write' },
        { arabic: 'جَلَسَ يَجْلِسُ', translit: 'jalasa yajlisu', meaning: 'to sit' },
        { arabic: 'عَمِلَ يَعْمَلُ', translit: 'ʿamila yaʿmalu', meaning: 'to work' },
        { arabic: 'دَرَسَ يَدْرُسُ', translit: 'darasa yadrusu', meaning: 'to study' },
      ],
      say: [W('dhahaba-yadhhabu', 'ذَهَبَ يَذْهَبُ'), W('kataba-yaktubu', 'كَتَبَ يَكْتُبُ'), W('jalasa-yajlisu', 'جَلَسَ يَجْلِسُ'), W('amila-yamalu', 'عَمِلَ يَعْمَلُ'), W('darasa-yadrusu', 'دَرَسَ يَدْرُسُ')],
      explain: [
        'Say each pair as one breath, like a name and surname: كَتَبَ يَكْتُبُ.',
        'The learner adds these to the deck as pairs. Quiz: "past كَتَبَ, so the present?"',
      ],
    },
    {
      title: 'Yesterday or every day?',
      station: 'athar',
      layout: 'game',
      scene: 'fw2Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Is each sentence about yesterday (past) or every day (present)?',
        bins: [
          { id: 'past', label: 'أَمْسِ', hint: 'yesterday' },
          { id: 'present', label: 'كُلَّ يَوْمٍ', hint: 'every day' },
        ],
        cards: [
          { label: 'تَدْرُسِينَ فِي ٱلصَّبَاحِ.', bin: 'present', why: 'تَـ in front and ـِينَ at the back: present, you (f) study.' },
          { label: 'دَرَسْنَا فِي ٱلْمَكْتَبَةِ.', bin: 'past', why: 'ـْنَا at the back: past, we studied.' },
          { label: 'يَعْمَلُونَ فِي ٱلْمَسَاءِ.', bin: 'present', why: 'يَـ in front, ـُونَ at the back: present, they work.' },
          { label: 'جَلَسَتْ فِي ٱلْمَقْهَى.', bin: 'past', why: 'ـَتْ at the back: past, she sat.' },
          { label: 'أَكْتُبُ ٱلدَّرْسَ.', bin: 'present', why: 'أَ in front: present, I write.' },
          { label: 'رَجَعُوا إِلَى ٱلْبَيْتِ.', bin: 'past', why: 'ـُوا at the back: past, they went back.' },
        ],
      },
      explain: ['Ask the learner to name the person for each card too. The result goes into your report.'],
    },
    {
      title: 'Your turn: your week',
      station: 'athar',
      layout: 'question',
      scene: 'fw2Talk',
      lines: [
        'Plan a study group with your teacher. Ask: مَتَى تَدْرُسُ؟ or مَتَى تَدْرُسِينَ؟ and مَتَى تَعْمَلُ؟',
        'Answer about your own week, then agree on a day: نَدْرُسُ مَعًا يَوْمَ...',
      ],
      say: [W('mata-tadrusu', 'مَتَى تَدْرُسُ؟', 'asking a man'), W('mata-tamalu', 'مَتَى تَعْمَلُ؟', 'asking a man')],
      interaction: { kind: 'ask', prompt: 'Did you find a day? Say it in one sentence with نَـ.', reveal: 'مُمْتَازٌ! You planned a week in Arabic.' },
      explain: ['Give the days if needed: يَوْمَ ٱلسَّبْتِ، ٱلْأَحَدِ، ٱلِٱثْنَيْنِ، ٱلثُّلَاثَاءِ، ٱلْأَرْبِعَاءِ، ٱلْخَمِيسِ، ٱلْجُمُعَةِ. Accept any day the learner can say.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'fw2Mission',
      lines: [
        'Write your real timetable in Arabic: five sentences, five different verbs.',
        'Put one person other than you in it: أُخْتِي تَعْمَلُ... or أَصْدِقَائِي يَلْعَبُونَ...',
      ],
      interaction: { kind: 'choose', prompt: 'Where will you write it?', options: ['In my notebook', 'On my phone', 'On a sticky note by my desk', 'As a message to my teacher'] },
      explain: ['Next time, read the timetable together and check the front letters.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'fw2Next',
      lines: [
        'Sara is on a video call with her family. Her little brother waves at the camera.',
        'She says: هَذَا أَخِي. Then her father appears: وَهَذَا أَبِي. But Ustadh Kareem says أَبُو سَارَةَ.',
        'Next time: five nouns that change their ending in a way no other noun does.',
      ],
      say: [W('abu-sarah', 'هَذَا أَبُو سَارَةَ.', 'teacher, friendly')],
      explain: ['End on أَبِي and أَبُو. Ask: why might the same word end in two ways?'],
    },
  ],
};
