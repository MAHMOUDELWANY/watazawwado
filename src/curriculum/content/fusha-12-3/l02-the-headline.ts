import type { Lesson } from '../../types';
import { lessonFT302TeacherAr } from './l02-teacher-ar.js';

// Rules: docs/curriculum/fusha/RULES.md. Map: docs/curriculum/fusha/MAP-level-3.md (Lesson 2: the passive; 12+ theme: a
// news headline). Institute cast. Past and present passive of sound verbs and of Forms II and IV; the stand-in subject
// (نَائِبُ ٱلْفَاعِلِ) takes the doer's ـُ. Every Arabic word fully diacritized.

const W = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'fusha' as const, emotion });

export const lessonFT302: Lesson = {
  subject: 'fusha-12-3',
  version: 'teens',
  subjectTitle: 'Fusha Arabic · 12+ · Level 3',
  number: 2,
  title: 'The Headline',
  titleAr: 'ٱلْعُنْوَانُ',
  part: 'Level 3',
  minutes: 50,
  goal: 'By the end of this lesson, you will read and write passive headlines, past and present, and ask who is missing from them.',
  reviewed: false,
  teacherAr: lessonFT302TeacherAr,
  outcomes: [
    'Forms the past passive (فُعِلَ) and the present passive (يُفْعَلُ) of a sound verb.',
    'Moves the object into the doer\'s place, with its ـُ (نَائِبُ ٱلْفَاعِلِ).',
    'Recognises the passive of Forms II and IV: عُلِّمَ، أُرْسِلَ، يُرْسَلُ.',
    'Rewrites a passive headline as an active sentence, and says what the passive leaves out.',
  ],
  chapters: [
    { label: 'Warm-up', page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'The passive', page: 3 },
    { label: 'Reading the news', page: 7 },
    { label: 'Practice', page: 9 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'The Headline',
      station: 'spark',
      layout: 'cover',
      scene: 'fy2Cover',
      lines: [],
      explain: [
        'Check the mission: the three يُـ verbs. Solve the one the learner could not, together.',
        'Tell them: today we read the news, and look for the person the news does not name.',
      ],
    },
    {
      title: 'Morning news',
      station: 'spark',
      layout: 'story',
      scene: 'fy2News',
      lines: [
        'Before class, Sara reads the city news app aloud. Ustadh Kareem lets her.',
        'Every headline tells you what happened: a road, a school, a library.',
        'None of them tells you who did it. Yusuf notices first.',
      ],
      explain: ['Ask: when you read headlines in English, how often do they say who did something? ("Road opened", "Mistakes were made").'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'fy2Story',
      lines: [
        'Listen twice. What was opened, and what is being built?',
        'What does Yusuf want to know, twice?',
        'How does Ustadh Kareem answer him?',
      ],
      say: [
        W('story-1', 'فُتِحَ طَرِيقٌ جَدِيدٌ فِي ٱلْمَدِينَةِ.', 'young woman, reading news'),
        W('story-2', 'مَنْ فَتَحَهُ؟', 'young man, curious'),
        W('story-3', 'لَا يُذْكَرُ ٱلْفَاعِلُ. ٱلْمُهِمُّ ٱلطَّرِيقُ.', 'teacher, calm'),
        W('story-4', 'وَتُبْنَى مَدْرَسَةٌ جَدِيدَةٌ بِجَانِبِهِ.', 'young woman, reading news'),
        W('story-5', 'وَمَتَى يُفْتَحُ ٱلْمَطَارُ؟', 'young man, teasing'),
        W('story-6', 'هَذَا سُؤَالٌ صَعْبٌ!', 'teacher, laughing'),
      ],
      explain: [
        'Play the scene twice. Ask in English: what was opened? (a road). What is being built? (a school beside it).',
        'Then: what does Yusuf keep asking? (who did it; when the airport opens). Kareem: "the doer is not mentioned; the road is what matters".',
      ],
      teacherNote: 'Input first. Kareem\'s answer, لَا يُذْكَرُ ٱلْفَاعِلُ, is itself a passive. Point it out after the second listening.',
    },
    {
      title: 'The past passive',
      station: 'zad',
      layout: 'concept',
      scene: 'fy2Past',
      lines: [
        'In the past, the passive switches the vowels to u then i: فَعَلَ → فُعِلَ.',
        'فَتَحَ, he opened → فُتِحَ, it was opened. كَتَبَ → كُتِبَ. ذَكَرَ, he mentioned → ذُكِرَ, it was mentioned.',
        'The person endings from Level 2 stay the same: فُتِحَتِ ٱلْمَكْتَبَةُ, the library was opened.',
      ],
      vocab: [
        { arabic: 'فُتِحَ', translit: 'futiḥa', meaning: 'it was opened' },
        { arabic: 'ذُكِرَ', translit: 'dhukira', meaning: 'it was mentioned' },
        { arabic: 'فُتِحَتْ', translit: 'futiḥat', meaning: 'she (it) was opened' },
      ],
      say: [W('fataha', 'فَتَحَ'), W('futiha', 'فُتِحَ'), W('dhakara', 'ذَكَرَ'), W('dhukira', 'ذُكِرَ'), W('futihat-maktaba', 'فُتِحَتِ ٱلْمَكْتَبَةُ.')],
      explain: ['Drill by ear: you say the active, the learner answers with the passive. Then reverse.'],
    },
    {
      title: 'The present passive',
      station: 'zad',
      layout: 'concept',
      scene: 'fy2Present',
      lines: [
        'In the present, the front letter takes a u and the middle letter an a: يَفْعَلُ → يُفْعَلُ.',
        'يَفْتَحُ, he opens → يُفْتَحُ, it is opened. يَذْكُرُ → يُذْكَرُ, it is mentioned: لَا يُذْكَرُ ٱلْفَاعِلُ.',
        'Sara\'s second headline: تُبْنَى مَدْرَسَةٌ, a school is being built. The تُـ is for a feminine "she" thing.',
      ],
      vocab: [
        { arabic: 'يُفْتَحُ', translit: 'yuftaḥu', meaning: 'it is opened' },
        { arabic: 'يُذْكَرُ', translit: 'yudhkaru', meaning: 'it is mentioned' },
        { arabic: 'تُبْنَى', translit: 'tubnā', meaning: 'she (it) is being built' },
      ],
      say: [W('yaftahu', 'يَفْتَحُ'), W('yuftahu', 'يُفْتَحُ'), W('yudhkaru', 'يُذْكَرُ'), W('tubna', 'تُبْنَى مَدْرَسَةٌ.')],
      explain: [
        'Contrast with Lesson 1: there, يُـ meant "a pattern verb". Here يُـ with an a in the middle means passive. The middle vowel decides.',
        'تُبْنَى is from بَنَى, a weak verb; give it as a word, not a rule.',
      ],
    },
    {
      title: 'The stand-in',
      station: 'zad',
      layout: 'concept',
      scene: 'fy2Stand',
      lines: [
        'Active: فَتَحَتِ ٱلْبَلَدِيَّةُ ٱلطَّرِيقَ. The council opened the road; the road ends in ـَ.',
        'Passive: the doer leaves, and the road steps into its place: فُتِحَ ٱلطَّرِيقُ. Now it ends in ـُ.',
        'Grammar calls it نَائِبُ ٱلْفَاعِلِ, the doer\'s stand-in. It takes the doer\'s seat and the doer\'s vowel.',
      ],
      vocab: [
        { arabic: 'نَائِبُ ٱلْفَاعِلِ', translit: 'nāʾibu l-fāʿil', meaning: 'the doer\'s stand-in (subject of a passive verb)' },
        { arabic: 'ٱلْبَلَدِيَّةُ', translit: 'al-baladiyyah', meaning: 'the town council' },
      ],
      say: [W('fatahat-baladiyya', 'فَتَحَتِ ٱلْبَلَدِيَّةُ ٱلطَّرِيقَ.'), W('futiha-tariq', 'فُتِحَ ٱلطَّرِيقُ.')],
      explain: [
        'Link to Level 2, Lesson 3: the doer\'s job takes ـُ (أَبُو), the done-to takes ـَ (أَبَا). The road changes job, so it changes vowel.',
        'Ask the learner to say both sentences and hear ٱلطَّرِيقَ / ٱلطَّرِيقُ.',
      ],
    },
    {
      title: 'Patterns have passives',
      station: 'zad',
      layout: 'concept',
      scene: 'fy2Forms',
      lines: [
        'The Lesson 1 patterns switch the same way: u on the first vowel, i before the last letter.',
        'عَلَّمَ → عُلِّمَ, he was taught. أَرْسَلَ → أُرْسِلَ, it was sent.',
        'In the present, the middle vowel becomes a: يُرْسِلُ, he sends → يُرْسَلُ, it is sent.',
      ],
      vocab: [
        { arabic: 'عُلِّمَ', translit: 'ʿullima', meaning: 'he was taught' },
        { arabic: 'أُرْسِلَ', translit: 'ursila', meaning: 'it was sent' },
        { arabic: 'يُرْسَلُ', translit: 'yursalu', meaning: 'it is sent' },
      ],
      say: [W('ullima', 'عُلِّمَ'), W('ursila', 'أُرْسِلَ'), W('yursilu', 'يُرْسِلُ'), W('yursalu', 'يُرْسَلُ')],
      explain: ['يُرْسِلُ / يُرْسَلُ differ by one vowel only. Say them in pairs until the learner hears it.'],
    },
    {
      title: 'Who is missing?',
      station: 'zad',
      layout: 'concept',
      scene: 'fy2Missing',
      lines: [
        'The passive is useful when the doer is unknown, obvious, or not important: كُتِبَ ٱلْكِتَابُ فِي ٱلْقَرْنِ ٱلْعَاشِرِ.',
        'But it can also hide someone. "Mistakes were made" sounds very different from "I made mistakes".',
        'So when you read a passive headline, ask Yusuf\'s question: مَنْ فَعَلَ ذَلِكَ؟',
      ],
      say: [W('kutiba-kitab', 'كُتِبَ ٱلْكِتَابُ فِي ٱلْقَرْنِ ٱلْعَاشِرِ.'), W('man-faala', 'مَنْ فَعَلَ ذَلِكَ؟', 'curious, a little sharp')],
      explain: [
        'Discuss: which headline is fairer, "a road was closed" or "the council closed a road"? Why might a writer choose one?',
        'This is reading skill, not politics. Keep the examples neutral.',
      ],
      teacherNote: 'The wow: grammar as a reading tool. The learner leaves able to spot what a sentence chooses not to say.',
    },
    {
      title: 'Decode three headlines',
      station: 'zad',
      layout: 'concept',
      scene: 'fy2Read',
      lines: [
        'فُتِحَتْ مَكْتَبَةٌ جَدِيدَةٌ لِلْأَطْفَالِ. A new children\'s library was opened.',
        'يُغْلَقُ ٱلشَّارِعُ يَوْمَ ٱلْجُمُعَةِ. The street is closed on Friday.',
        'عُلِّمَ أَلْفُ طِفْلٍ ٱلسِّبَاحَةَ هَذَا ٱلصَّيْفَ. A thousand children were taught to swim this summer.',
      ],
      say: [W('h-1', 'فُتِحَتْ مَكْتَبَةٌ جَدِيدَةٌ لِلْأَطْفَالِ.', 'newsreader'), W('h-2', 'يُغْلَقُ ٱلشَّارِعُ يَوْمَ ٱلْجُمُعَةِ.', 'newsreader'), W('h-3', 'عُلِّمَ أَلْفُ طِفْلٍ ٱلسِّبَاحَةَ هَذَا ٱلصَّيْفَ.', 'newsreader')],
      explain: [
        'For each headline: find the passive verb, say past or present, name the stand-in, and guess the missing doer.',
        'The English lines are the meaning; let the learner try before reading them.',
      ],
    },
    {
      title: 'Active or passive?',
      station: 'athar',
      layout: 'game',
      scene: 'fy2Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        prompt: 'Is the verb active (doer named) or passive (doer hidden)?',
        bins: [
          { id: 'active', label: 'فَتَحَ', hint: 'active' },
          { id: 'passive', label: 'فُتِحَ', hint: 'passive' },
        ],
        cards: [
          { label: 'يُرْسَلُ ٱلْبَرِيدُ صَبَاحًا.', bin: 'passive', why: 'يُرْسَلُ: u then a, the mail is sent.' },
          { label: 'يُرْسِلُ ٱلْمُدِيرُ ٱلْبَرِيدَ.', bin: 'active', why: 'يُرْسِلُ: the manager sends; i in the middle.' },
          { label: 'ذُكِرَ ٱسْمُهَا فِي ٱلْخَبَرِ.', bin: 'passive', why: 'ذُكِرَ: u then i, her name was mentioned.' },
          { label: 'كَتَبَتْ سَارَةُ ٱلْمَقَالَةَ.', bin: 'active', why: 'Sara wrote the article: the doer is named.' },
          { label: 'تُبْنَى مَدْرَسَةٌ جَدِيدَةٌ.', bin: 'passive', why: 'تُبْنَى: a school is being built.' },
          { label: 'عَلَّمَ ٱلْأُسْتَاذُ ٱلطُّلَّابَ.', bin: 'active', why: 'The teacher taught the students: active Form II.' },
        ],
      },
      explain: ['Ask the learner to read the verb aloud with its vowels before choosing. The result goes into your report.'],
    },
    {
      title: 'Your turn: the newsroom',
      station: 'athar',
      layout: 'question',
      scene: 'fy2Talk',
      lines: [
        'Your teacher reads you a passive headline. Rewrite it as an active sentence, naming a doer.',
        'Then give your teacher an active sentence, and let them turn it passive.',
      ],
      say: [W('futiha-tariq-2', 'فُتِحَ طَرِيقٌ جَدِيدٌ.', 'newsreader')],
      interaction: { kind: 'ask', prompt: 'Did the stand-in change its vowel when it moved?', reveal: 'مُمْتَازٌ! You can read the news, and what it leaves out.' },
      explain: ['Use verbs from the lesson only. Correct the noun\'s final vowel when it changes job; that is the real skill here.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'fy2Mission',
      lines: [
        'Find three passive verbs in real Arabic headlines (a news site, a TV ticker, a social post).',
        'For each one, write who you think the missing doer is.',
      ],
      interaction: { kind: 'choose', prompt: 'Where will you look?', options: ['A news website', 'A TV news ticker', 'Social media', 'A newspaper'] },
      explain: ['Next time, read the headlines together. Check the vowels with a vowelled source if you can.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'fy2Next',
      lines: [
        'Debate club. The motion: "Phones should be banned at school."',
        'Sara stands up: إِنَّ ٱلْهَاتِفَ مُفِيدٌ. Yusuf answers: لَكِنَّ ٱلطُّلَّابَ لَا يَدْرُسُونَ!',
        'Next time: إِنَّ and her sisters, small words that win arguments and change endings.',
      ],
      say: [W('inna-hatif', 'إِنَّ ٱلْهَاتِفَ مُفِيدٌ.', 'young woman, confident')],
      explain: ['End on the motion. Ask: which side would the learner take, and why? Note ٱلْهَاتِفَ after إِنَّ.'],
    },
  ],
};
