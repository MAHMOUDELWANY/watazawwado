import type { Lesson } from '../../types';
import { lessonET02TeacherAr } from './l02-teacher-ar.js';

// Rules: docs/curriculum/egyptian/RULES.md. Map: docs/curriculum/egyptian/MAP.md (Teens: the summer club; Lesson 2 =
// منين؟ أنا من... ، أصلاً من، ـي / ـية, the Cairo g). Every Arabic line plays on tap in the Mahmoud Egyptian clone.

const E = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'eg' as const, emotion });

export const lessonET02: Lesson = {
  subject: 'egyptian-teens',
  version: 'teens',
  subjectTitle: 'Egyptian Arabic · Teens',
  number: 2,
  title: 'Where Are You From?',
  titleAr: 'إنت منين؟',
  part: 'Beginner',
  minutes: 45,
  goal: 'By the end of this lesson, you will say where you live and where your family is originally from, and turn any country into a nationality.',
  reviewed: false,
  teacherAr: lessonET02TeacherAr,
  outcomes: [
    'Asks إنت منين؟ / إنتي منين؟ and answers أنا من...',
    'Says where the family is originally from: بس أصلاً من مصر.',
    'Makes a nationality with ـي for a guy and ـية for a girl, and knows the rebel أمريكاني.',
    'Hears the Cairo g: جديد = gidiid.',
  ],
  chapters: [
    { label: 'The shirt', page: 0 },
    { label: 'Listen first', page: 2 },
    { label: 'From where', page: 3 },
    { label: 'Originally', page: 4 },
    { label: 'Nationalities', page: 5 },
    { label: 'Practice', page: 7 },
    { label: 'My mission', page: 9 },
  ],
  pages: [
    {
      title: 'Where Are You From?',
      station: 'spark',
      layout: 'cover',
      scene: 'et2Cover',
      lines: [],
      explain: [
        'Greet in Egyptian: إزيّك؟ عامل / عاملة إيه؟ Ask about the mission: who answered the message, and what did they say?',
        'Tell them: today is about the question every Egyptian asks in the first minute.',
      ],
    },
    {
      title: 'The shirt',
      station: 'spark',
      layout: 'story',
      scene: 'et2Shirt',
      lines: [
        'Omar\'s football shirt says CANADA in big letters.',
        'Nour points at it: إنت منين؟',
        'The answer is not as simple as it looks. Omar was born in Canada, but his family is from Egypt.',
      ],
      say: [E('nour-minen', 'إنت منين؟', 'curious, friendly girl')],
      explain: ['Ask the learner: how do you answer "where are you from" in English, when your family is from somewhere else? Most heritage teens have an answer ready.'],
    },
    {
      title: 'Listen first',
      station: 'zad',
      layout: 'story',
      scene: 'et2Listen',
      lines: [
        'Listen twice. Where is each one from?',
        'Omar gives a two-part answer. Which word does he use for "originally"?',
        'Karim jumps in with a joke. What is it?',
      ],
      say: [
        E('d-1', 'إنت منين يا عمر؟', 'curious girl'),
        E('d-2', 'أنا من كندا، بس أصلاً من مصر.', 'a bit proud, relaxed'),
        E('d-3', 'بجد؟ يعني إنت مصري!', 'surprised, happy girl'),
        E('d-4', 'مصري جديد! نسخة كندي!', 'joking guy, laughing'),
      ],
      explain: [
        'Play the scene twice before translating. Ask: what does Nour decide Omar is? (مصري.)',
        'Karim\'s joke: "a new Egyptian, Canadian edition". Teens like it; let them explain it.',
      ],
    },
    {
      title: 'From + where',
      station: 'zad',
      layout: 'concept',
      scene: 'et2Minen',
      lines: [
        'منين is من (from) + فين (where), glued together.',
        'The question word sits at the end, like اسمك إيه؟ last time.',
        'Answer in the same slot: أنا من + place. To a girl: إنتي منين؟',
      ],
      vocab: [
        { arabic: 'منين؟', translit: 'minēn?', meaning: 'from where?' },
        { arabic: 'إنت / إنتي منين؟', translit: 'inta / inti minēn?', meaning: 'where are you from? (to a guy / a girl)' },
        { arabic: 'أنا من...', translit: 'ana min...', meaning: 'I am from...' },
      ],
      say: [E('min', 'من'), E('fen', 'فين'), E('inta-minen', 'إنت منين؟', 'curious'), E('inti-minen', 'إنتي منين؟', 'curious')],
      explain: ['Quick drill: ask the learner, then let them ask you with the right ending for you.'],
    },
    {
      title: 'Originally from',
      station: 'zad',
      layout: 'concept',
      scene: 'et2Asl',
      lines: [
        'بس means "but". أصلاً means "originally".',
        'أنا من كندا، بس أصلاً من مصر: two places, one sentence.',
        'Egyptians love this answer. It usually gets: أهلاً! يعني مصري!',
      ],
      vocab: [
        { arabic: 'بس', translit: 'bass', meaning: 'but; also "only, enough"' },
        { arabic: 'أصلاً', translit: 'aṣlan', meaning: 'originally' },
        { arabic: 'بجد؟', translit: 'bi-gadd?', meaning: 'really? seriously?' },
        { arabic: 'يعني', translit: 'ya‘ni', meaning: 'so, I mean' },
      ],
      say: [E('bass', 'بس'), E('aslan', 'أصلاً'), E('d-2', 'أنا من كندا، بس أصلاً من مصر.', 'a bit proud, relaxed'), E('bigad', 'بجد؟', 'surprised')],
      explain: [
        'Let the learner build their own two-part answer with their real places.',
        'بجد uses the Cairo g: bi-gadd. Keep it as a word for now; the sound shift comes on the next page.',
      ],
      teacherNote: 'This is the page heritage teens remember: it lets them say who they are in Egyptian.',
    },
    {
      title: 'Nationalities, and the Cairo g',
      station: 'zad',
      layout: 'concept',
      scene: 'et2Nat',
      lines: [
        'Country + ـي for a guy, ـية for a girl: مصري، مصرية; كندي، كندية.',
        'America is the rebel: أمريكاني، أمريكانية.',
        'And Karim\'s جديد? Cairo says gidiid, with a hard g: the letter ج is g in Cairo.',
      ],
      items: ['مصر ← مصري / مصرية', 'كندا ← كندي / كندية', 'أمريكا ← أمريكاني / أمريكانية'],
      vocab: [
        { arabic: 'مصري / مصرية', translit: 'maṣri / maṣriyya', meaning: 'Egyptian (a guy / a girl)' },
        { arabic: 'كندي / كندية', translit: 'kanadi / kanadiyya', meaning: 'Canadian (a guy / a girl)' },
        { arabic: 'أمريكاني / أمريكانية', translit: 'amrikāni / amrikaniyya', meaning: 'American (a guy / a girl)' },
        { arabic: 'جديد', translit: 'gidīd', meaning: 'new' },
      ],
      say: [E('masri', 'مصري'), E('masriyya', 'مصرية'), E('kanadi', 'كندي'), E('kanadiyya', 'كندية'), E('amrikani', 'أمريكاني', 'amused'), E('gidid', 'جديد')],
      explain: [
        'Fast drill: you say a country and a person, the learner says the nationality.',
        'Mention famous names with ج said the Cairo way: Gamal, Gana. The learner will hear it everywhere.',
      ],
    },
    {
      title: 'Guy or girl?',
      station: 'athar',
      layout: 'game',
      scene: 'et2Sort',
      lines: [],
      interaction: {
        kind: 'sort',
        look: 'row',
        prompt: 'Seven people at the club. Which ending fits: ـي (a guy) or ـية (a girl)?',
        bins: [
          { id: 'i', label: 'ـي', hint: 'a guy' },
          { id: 'iyya', label: 'ـية', hint: 'a girl' },
        ],
        cards: [
          { label: 'Karim, from Cairo', bin: 'i', why: 'A guy: مصري.' },
          { label: 'Nour, from Alexandria', bin: 'iyya', why: 'A girl: مصرية.' },
          { label: 'Omar, born in Canada', bin: 'i', why: 'A guy: كندي، بس أصلاً مصري.' },
          { label: 'The coach\'s daughter, from America', bin: 'iyya', why: 'A girl, and the rebel: أمريكانية.' },
          { label: 'A new player, a guy from England', bin: 'i', why: 'A guy: إنجليزي.' },
          { label: 'Nour\'s cousin Lina, from Canada', bin: 'iyya', why: 'A girl: كندية.' },
          { label: 'The goalkeeper, a guy from Aswan', bin: 'i', why: 'A guy from Egypt: مصري.' },
        ],
      },
      explain: ['A short review with no points. Ask for the full sentence each time: كريم مصري، نور مصرية.'],
      teacherNote: 'The result is added to your lesson report automatically.',
    },
    {
      title: 'Your turn: the new team',
      station: 'athar',
      layout: 'question',
      scene: 'et2Talk',
      lines: [
        'The club makes new teams. Meet two teammates.',
        'Ask منين؟, give your own two-part answer, and say their nationality back.',
      ],
      say: [E('inta-minen', 'إنت منين؟', 'curious'), E('inti-minen', 'إنتي منين؟', 'curious')],
      interaction: { kind: 'ask', prompt: 'Your teacher plays Karim, then Nour. Did you use أصلاً, and the right ending for each?', reveal: 'جامد! You can now say who you are, and where you come from, in Egyptian.' },
      explain: ['Then swap: the learner asks, you answer with a surprising two-part answer of your own.'],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'et2Mission',
      lines: [
        'Write your two-part answer in a message: أنا من...، بس أصلاً من...',
        'Send it to an Egyptian friend or cousin, and see what they answer.',
      ],
      interaction: { kind: 'choose', prompt: 'Who gets the message?', options: ['A cousin', 'A friend', 'A family group chat', 'My teacher'] },
      explain: ['Read the reply together at the start of the next lesson.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'et2Next',
      lines: [
        'After training, Karim opens his bag and pulls out something weird.',
        'Everyone asks at once: إيه ده؟',
        'Next time: ده and دي, and naming your stuff.',
      ],
      say: [E('eh-da', 'إيه ده؟', 'curious, laughing')],
      explain: ['End on the bag. Let the learner guess what Karim pulled out.'],
    },
  ],
};
