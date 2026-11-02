import type { Lesson } from '../../types';
import { lessonC01TeacherAr } from './l01-teacher-ar.js';

// Rules and spelling: docs/curriculum/franco/RULES.md. Map: docs/curriculum/franco/MAP.md. Words play on tap in the
// Mahmoud Egyptian clone (the clip text is Arabic script, what the clone reads); single sounds are the owner's own.

const E = (id: string, text: string, emotion?: string) => ({ id, text, voice: 'eg' as const, emotion });
const O = (id: string, text: string) => ({ id, text, voice: 'owner' as const, emotion: 'clear, slow, twice' });

export const lessonC01: Lesson = {
  subject: 'literacy-c',
  version: 'adults',
  subjectTitle: 'Reading Franco',
  number: 1,
  title: 'Numbers That Talk',
  titleAr: 'أرقام بتتكلم',
  part: 'Reading Franco',
  minutes: 50,
  goal: 'By the end of this lesson, you will read a family message written in Franco, and know why 3 and 7 are letters.',
  reviewed: false,
  teacherAr: lessonC01TeacherAr,
  outcomes: [
    'Explains what Franco is and why Egyptians write it.',
    'Reads words made of the plain letters (ana, enta, baba, Masr, tamam).',
    'Says the sound of 3 (ع) and of 7 (ح), and tells 3 from a and 7 from h.',
    'Reads a short message with 3 and 7 and answers it.',
  ],
  chapters: [
    { label: 'The message', page: 0 },
    { label: 'What Franco is', page: 3 },
    { label: '3', page: 5 },
    { label: '7', page: 6 },
    { label: 'Read it', page: 8 },
    { label: 'Reply', page: 10 },
    { label: 'My mission', page: 11 },
  ],
  pages: [
    {
      title: 'Numbers That Talk',
      station: 'spark',
      layout: 'cover',
      scene: 'lc1Cover',
      lines: [],
      explain: [
        'Welcome the learner. Ask who they will write to in Egyptian: family, in-laws, friends, a group at work.',
        'Promise them: today you will read your first real message, and by the end you will answer it.',
      ],
    },
    {
      title: 'A message full of numbers',
      station: 'spark',
      layout: 'story',
      scene: 'lc1Message',
      lines: [
        'You have just joined the family group. Tant Hoda, in Cairo, writes first.',
        'Half of it looks like English. The other half looks like a code.',
        'There are numbers in the middle of her words: a 7 here, a 3 there.',
        'She is not counting anything. So what are they doing there?',
      ],
      say: [E('msg-1', 'أهلاً يا حبيبي! عامل إيه؟', 'warm, happy, an aunt greeting her nephew')],
      explain: [
        'This is the hook. Let the learner look at the message without help for ten seconds.',
        'Ask: what can you already read? Most learners find ahlan and ya. Praise it: that is already reading.',
      ],
      teacherNote: 'Do not explain the numbers yet. The question carries the next two pages.',
    },
    {
      title: 'Why a number?',
      station: 'spark',
      layout: 'question',
      scene: 'lc1Why',
      lines: [
        'Egyptian Arabic has sounds that English spelling never needed.',
        'A phone keyboard has no letter for them. So people borrowed something that was already there.',
      ],
      interaction: {
        kind: 'ask',
        prompt: 'Look at the Arabic letters behind the numbers. Why do you think Egyptians picked 3 and 7?',
        reveal: 'Because they look like the Arabic letters: 7 looks like ح, and 3 is ع turned around.',
      },
      explain: [
        'Let the learner guess first. Any guess about shape is close.',
        'Then show it: ح and 7 share the same hook; ع flipped is a 3. Egyptians chose numbers that look like the letter.',
      ],
    },
    {
      title: 'What Franco is',
      station: 'zad',
      layout: 'concept',
      scene: 'lc1What',
      lines: [
        'Franco is Egyptian Arabic written in English letters.',
        'Most sounds have an English letter already: b, t, d, s, m, n, l, r, k, f.',
        'A few sounds are left over, the ones English does not have.',
        'Each of those gets a number that looks like its Arabic letter.',
      ],
      items: ['3 = ع', '7 = ح', '5 = خ', '2 = ء'],
      explain: [
        'Show the keyboard idea: an English keyboard can type almost all of Egyptian. The leftovers get numbers.',
        'Today we learn 3 and 7. The other two (5 and 2) come in the next lessons. Do not teach them yet.',
      ],
      teacherNote: 'This course teaches reading what the family sends. Franco is a habit, not an official spelling; we use one fixed system so the learner never meets two spellings for one sound.',
    },
    {
      title: 'The easy letters first',
      station: 'zad',
      layout: 'concept',
      scene: 'lc1Plain',
      lines: [
        'Before any number, you can already read a lot.',
        'These words use only English letters, and they sound almost as they look.',
        'Read each one, then tap it to hear how Cairo says it.',
      ],
      items: ['ana: I', 'enta: you (to a man)', 'baba: dad', 'mama: mum', 'Masr: Egypt', 'tamam: OK, fine'],
      vocab: [
        { arabic: 'أنا', translit: 'ana', meaning: 'I' },
        { arabic: 'إنت', translit: 'enta', meaning: 'you (to a man)' },
        { arabic: 'بابا', translit: 'baba', meaning: 'dad' },
        { arabic: 'ماما', translit: 'mama', meaning: 'mum' },
        { arabic: 'مصر', translit: 'Masr', meaning: 'Egypt' },
        { arabic: 'تمام', translit: 'tamam', meaning: 'OK, fine' },
      ],
      say: [E('ana', 'أنا'), E('enta', 'إنت'), E('baba', 'بابا'), E('mama', 'ماما'), E('masr', 'مصر'), E('tamam', 'تمام', 'relaxed, smiling')],
      explain: [
        'Let the learner read each word aloud before you play it. Correct only the vowels: Cairo says enta, not inta.',
        'Point out the e in enta: Franco writes the vowel you hear. That is why it is easy to read.',
      ],
    },
    {
      title: '3: the sound from the throat',
      station: 'zad',
      layout: 'concept',
      scene: 'lc1Ayn',
      lines: [
        'Turn the Arabic letter ع around, and you get a 3.',
        'Its sound is made by squeezing the throat, like the start of a gulp.',
        'Say a, then squeeze while you say it. That squeeze is 3.',
        'It is everywhere: in "with", in "on", in the word for Arabic itself.',
      ],
      items: ['ma3a: with', '3ala: on', '3arabi: Arabic', '3eesh: bread'],
      vocab: [
        { arabic: 'مع', translit: 'ma3a', meaning: 'with' },
        { arabic: 'على', translit: '3ala', meaning: 'on' },
        { arabic: 'عربي', translit: '3arabi', meaning: 'Arabic' },
        { arabic: 'عيش', translit: '3eesh', meaning: 'bread (in Egypt, "bread" is the word for life)' },
      ],
      say: [O('sound-3', 'ع'), E('ma3a', 'مع'), E('3ala', 'على'), E('3arabi', 'عربي'), E('3eesh', 'عيش')],
      explain: [
        'Model the sound slowly. Many learners feel it best with a hand on the throat.',
        '3eesh is a gift: Egyptians call bread "life". Ask the learner to remember the word by that.',
      ],
      teacherNote: 'Do not drill the sound to perfection today. Recognising 3 and hearing it is the goal; the throat comes with time.',
    },
    {
      title: '7: the breath that scrapes',
      station: 'zad',
      layout: 'concept',
      scene: 'lc1Ha',
      lines: [
        'The Arabic ح has the same hook as a 7.',
        'It is an h, pushed hard from deep in the throat, like breathing on cold glass.',
        'An English h is soft and from the mouth. 7 is strong and from the throat.',
        'You know one 7 word already: 7abibi.',
      ],
      items: ['7abibi: my dear', 'saba7: morning', '7elw: sweet, nice', '7aga: a thing'],
      vocab: [
        { arabic: 'حبيبي', translit: '7abibi', meaning: 'my dear (to a man or a child)' },
        { arabic: 'صباح', translit: 'saba7', meaning: 'morning' },
        { arabic: 'حلو', translit: '7elw', meaning: 'sweet, nice' },
        { arabic: 'حاجة', translit: '7aga', meaning: 'a thing' },
      ],
      say: [O('sound-7', 'ح'), E('7abibi', 'حبيبي', 'warm'), E('saba7', 'صباح'), E('7elw', 'حلو', 'pleased'), E('7aga', 'حاجة')],
      explain: [
        'Have the learner breathe on their hand: h is warm air from the mouth; 7 is air forced through a narrow throat.',
        '7abibi is the word everyone knows. Use it to anchor the sound.',
      ],
    },
    {
      title: 'One letter, a new word',
      station: 'zad',
      layout: 'concept',
      scene: 'lc1Pairs',
      lines: [
        'Why not just write a and h? Because Egyptians hear the difference.',
        'amal is hope. 3amal is work. One squeeze in the throat, a different word.',
        'hena is here. 7enna is henna. Same letters, a different breath.',
      ],
      items: ['amal: hope ↔ 3amal: work', 'hena: here ↔ 7enna: henna'],
      vocab: [
        { arabic: 'أمل', translit: 'amal', meaning: 'hope' },
        { arabic: 'عمل', translit: '3amal', meaning: 'work' },
        { arabic: 'هنا', translit: 'hena', meaning: 'here' },
        { arabic: 'حنّة', translit: '7enna', meaning: 'henna' },
      ],
      say: [E('amal', 'أمل'), E('3amal', 'عمل'), E('hena', 'هنا'), E('7enna', 'حنّة')],
      explain: [
        'Play each pair twice. Then say one word and let the learner point to which one they heard.',
        'This is the reason Franco needs numbers: without them, hope and work would look the same.',
      ],
    },
    {
      title: "Read Tant Hoda's message",
      station: 'athar',
      layout: 'question',
      scene: 'lc1Read',
      lines: [
        'Back to the family group. Now read her message, word by word.',
        'Tap every word that has a number in it.',
      ],
      say: [E('msg-1', 'أهلاً يا حبيبي! عامل إيه؟', 'warm, happy, an aunt greeting her nephew'), E('3amel-eh', 'عامل إيه؟', 'curious, warm')],
      interaction: {
        kind: 'clues',
        prompt: 'ahlan ya 7abibi! 3amel eh? Which words have a number letter?',
        clues: [
          { label: '7abibi', correct: true },
          { label: '3amel', correct: true },
          { label: 'ahlan', correct: false },
          { label: 'ya', correct: false },
          { label: 'eh', correct: false },
        ],
      },
      explain: [
        'Let the learner read the whole message aloud first: ahlan ya 7abibi! 3amel eh?',
        'Meaning: Hello my dear! How are you? (3amel eh = how are you doing, to a man; to a woman: 3amla eh).',
      ],
    },
    {
      title: 'Short review: 3 or 7?',
      station: 'athar',
      layout: 'game',
      scene: 'lc1Review',
      lines: [],
      interaction: {
        kind: 'sort',
        look: 'row',
        prompt: 'Eight words from the family group. Which number letter does each one have?',
        bins: [
          { id: 'three', label: '3', hint: 'the squeeze, ع' },
          { id: 'seven', label: '7', hint: 'the strong breath, ح' },
        ],
        cards: [
          { label: 'ma3a (with)', bin: 'three', why: 'ma3a: the squeeze in the middle, ع.' },
          { label: '7abibi (my dear)', bin: 'seven', why: '7abibi starts with the strong breath, ح.' },
          { label: 'saba7 (morning)', bin: 'seven', why: 'saba7 ends with ح: saba7 el 5eer is good morning.' },
          { label: '3eesh (bread)', bin: 'three', why: '3eesh starts with ع, the word Egypt uses for bread and life.' },
          { label: '7elw (nice)', bin: 'seven', why: '7elw: the breath, ح.' },
          { label: '3ala (on)', bin: 'three', why: '3ala starts with the squeeze, ع.' },
          { label: '3arabi (Arabic)', bin: 'three', why: '3arabi: ع, like the language itself.' },
          { label: '7aga (a thing)', bin: 'seven', why: '7aga starts with ح.' },
        ],
      },
      explain: [
        'A short review, no timer and no points. The result goes into your lesson report.',
        'Ask the learner to say each word aloud before choosing. Saying it is the skill; the tap is the check.',
      ],
      teacherNote: 'The result is added to your lesson report automatically.',
    },
    {
      title: 'Write back',
      station: 'athar',
      layout: 'question',
      scene: 'lc1Reply',
      lines: [
        'She asked how you are. Answer her in Franco.',
        'el 7amdolellah means thank God, all is well. Add tamam, and ask her back.',
        'Type it, or write it on paper, then read it aloud to your teacher.',
      ],
      vocab: [
        { arabic: 'الحمد لله', translit: 'el 7amdolellah', meaning: 'thank God (the answer to how are you)' },
        { arabic: 'وإنتي؟', translit: 'w enti?', meaning: 'and you? (to a woman)' },
      ],
      say: [E('reply', 'الحمد لله، تمام. وإنتي؟', 'cheerful, polite')],
      interaction: {
        kind: 'ask',
        prompt: 'Write your reply to Tant Hoda. Did you use a 7?',
        reveal: 'el 7amdolellah, tamam. w enti? Well done: your first message in Franco.',
      },
      explain: [
        'Let the learner write it without looking, then compare with the reveal.',
        'w enti is "and you" to a woman. If the learner writes to a man: w enta?',
      ],
    },
    {
      title: 'My mission',
      station: 'ahd',
      layout: 'mission',
      scene: 'lc1Mission',
      lines: [
        'This week, find three Franco words with 3 or 7 in real messages.',
        'A family group, a comment under a video, a friend from Egypt: anywhere counts.',
        'Bonus: send one message in Franco, even just ahlan or 7abibi.',
      ],
      interaction: {
        kind: 'choose',
        prompt: 'Where will you look for your three words?',
        options: ['A family group', 'Comments under Egyptian videos', 'A friend from Egypt', 'Song or film titles'],
      },
      explain: ['Write down where they will look. Start the next lesson by reading the words they found.'],
    },
    {
      title: 'Next time…',
      station: 'ahd',
      layout: 'next',
      scene: 'lc1Next',
      lines: [
        'Tant Hoda writes again, and this time there is a 2 in it.',
        'ne2ablak? Cairo has a sound with no letter at all: the little stop in the middle.',
        'Next time: the 2, and how Cairo swallows the q.',
      ],
      say: [E('ne2ablak', 'نقابلك؟', 'hopeful, asking')],
      explain: ['End on the question. Let the learner guess what the 2 does before the next lesson.'],
    },
  ],
};
