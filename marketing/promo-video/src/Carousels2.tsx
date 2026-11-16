import React from 'react';
import { Card, Deck, SETTLED as S } from './deck';
import { ArCard, Big, Bubble, Loop, Num, GOLD_SOFT } from './reel';
import { Sub } from './Carousels';
import { QWord } from './V13Madd';

/** V10, V11, V13, V14, V15 rebuilt in the Shorts style (owner, 2026-11-16). Quran words in V13 kept from the quran.ai-checked first version. */
const side = (x = 830, y = 1090, size = 340) => ({ x, y, size });
const point = (n: number, bg: Card['bg'], lines: string[], sub: string, zad: Card['zad'], size = 92, swipe?: string): Card => ({
  bg, zad, swipe,
  el: (d) => <><Num f={S} n={n} label="" dark={d} top={170} /><Big f={S} dark={d} lines={lines} size={size} top={450} /><Sub dark={d} text={sub} top={450 + lines.length * size * 1.1 + 50} /></>,
});
const hook = (bg: Card['bg'], lines: string[], loop: string, emote: NonNullable<Card['zad']>['emote'], size = 96): Card => ({
  bg, zad: { emote, ...side(540, 1140, 360) },
  el: (d) => <><Big f={S} dark={d} lines={lines} size={size} top={190} /><Loop f={S} text={loop} top={640} /></>,
});
const gold = (t: string) => <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>{t}</span>;

/* V10 · 25 Nov · Screen time vs Quran time */
const C10: Card[] = [
  hook('ink', ['The tablet is on.', 'You say “Quran time”…', 'the room goes *cold.*'], '#3 works best 👀', 'oops', 90),
  point(1, 'teal', ['Agree *before*', 'the screen.'], '“Quran first, then the tablet” is easy to agree at 5:50. At 6:15 it’s a fight.', { emote: 'think', ...side() }, 104),
  point(2, 'copper', ['*Ten minutes* first.', 'Then the screen.'], 'Short enough to say yes to. The screen waits; it doesn’t disappear.', { emote: 'clap', ...side() }, 96),
  point(3, 'sand', ['Let them *choose*', 'the surah.'], 'A child who picks it owns it. Even if it’s the same one for the fifth night in a row.', { emote: 'love', ...side() }, 104),
];

/* V11 · 26 Nov · How it works with us (pinned) */
const C11: Card[] = [
  hook('teal', ['📌 How it works', '*with us*'], '5 steps. #4 is free 👀', 'wave', 110),
  point(1, 'crimson', ['Pack your *zaad.*'], 'Join the waitlist, for you or for your child. It takes a minute.', { emote: 'dash', ...side() }, 116),
  point(2, 'copper', ['Choose your', '*teacher.*'], 'When your wave opens, you pick from real profiles. You meet them before the first class.', { emote: 'point', ...side(), flip: true }, 110),
  point(3, 'sand', ['A free 30-minute', '*trial.*'], 'One real lesson with your teacher, so you can see how it feels.', { emote: 'cheer', ...side() }, 104),
  point(4, 'teal', ['A report the', '*same day.*'], 'Level, goals and a plan, written by your teacher.', { emote: 'search', ...side() }, 110),
  point(5, 'ink', ['Then, *every week:*'], '1-on-1 lessons with the same teacher · a report after every class · we message you first.', { emote: 'proud', ...side() }, 104),
];

/* V13 · 28 Nov · Madd: why the reciter stretches */
const C13: Card[] = [
  { bg: 'ink', zad: { emote: 'think', ...side(540, 1080, 400) },
    el: (d) => <><Big f={S} dark={d} lines={['Why does the reciter', '*stretch* some sounds?']} size={88} top={190} /><ArCard f={S} ar="بَـــا" top={450} size={170} color={GOLD_SOFT} /></> },
  { bg: 'cream', zad: { emote: 'point', ...side(), flip: true },
    el: (d) => <><Big f={S} dark={d} lines={['Madd means', '*stretch.*']} size={116} top={180} /><ArCard f={S} ar="ا   و   ي" tr="alif · waw · ya" mean="three letters do the stretching" top={480} size={150} /></> },
  { bg: 'teal', zad: { emote: 'search', ...side() },
    el: (d) => <><Big f={S} dark={d} lines={['Each one has a', '*partner* vowel.']} size={96} top={180} /><ArCard f={S} ar="بَا   بُو   بِي" tr="fatha · damma · kasra" mean="practice syllables, not Quran text" top={460} size={140} /></> },
  { ...point(1, 'sand', ['How long?', '*Two counts.*'], 'The natural madd. Tap two fingers while you hold the sound: one, two. Not one. Not five.', { emote: 'clap', ...side() }, 116), swipe: 'YOU KNOW THIS ONE',
    el: (d) => <><Big f={S} dark={d} lines={['How long?', '*Two counts.*']} size={130} top={200} /><Sub dark={d} text="The natural madd. Tap two fingers while you hold the sound: one, two. Not one. Not five." top={520} /></> },
  { bg: 'cream', zad: { emote: 'proud', ...side(150, 1250, 200) },
    el: (d) => <><Big f={S} dark={d} lines={['You already read it', 'in *Bismillah.*']} size={84} top={170} />
      <div style={{ position: 'absolute', inset: 0, transform: 'translateY(-20px) scale(0.92)' }}>
        <QWord before="ٱلرَّحِ" mark="ي" after="مِ" note="ya after kasra: hold it for two" ref="Al-Fatiha 1:1" y={400} />
        <QWord before="ٱلرَّحْمَ" mark="ـٰ" after="نِ" note="the small alif stretches too" ref="Al-Fatiha 1:1" y={690} />
        <QWord before="يُ" mark="و" after="لَدْ" note="waw after damma: two counts" ref="Al-Ikhlas 112:3" y={980} />
      </div></> },
];

/* V14 · 29 Nov · One-on-one, for young adults */
const C14: Card[] = [
  { bg: 'ink', zad: { emote: 'oops', ...side(540, 1080, 400) },
    el: (d) => <><Big f={S} dark={d} lines={['Remember reading', 'out loud in class…', 'and *everyone* heard', 'the mistake?']} size={84} top={180} /><Loop f={S} text="So what changes 1-on-1? 👀" top={680} /></> },
  { bg: 'sand', zad: { emote: 'think', ...side() },
    el: (d) => <><Big f={S} dark={d} lines={['For a lot of us,', 'that’s where it', '*stopped.*']} size={110} top={220} /><Sub dark={d} text="We still cared. We just got tired of being watched while we learned." top={640} /></> },
  point(1, 'teal', ['*No* audience.'], 'Just you and your teacher. Nobody waiting for you to slip.', { emote: 'love', ...side() }, 116),
  point(2, 'copper', ['*Your* pace.'], 'One letter a week is fine. Nobody is ahead of you.', { emote: 'clap', ...side() }, 116),
  { bg: 'crimson', zad: { emote: 'check', ...side(540, 1080, 340) },
    el: (d) => <><Num f={S} n={3} label="" dark={d} top={170} /><Big f={S} dark={d} lines={['A *kind* correction.']} size={104} top={450} />
      <Bubble f={S} who="Your teacher" text="“Close! Once more, together.” 🙂" top={640} /></> },
];

/* V15 · 30 Nov · 3 questions after Quran class */
const C15: Card[] = [
  { bg: 'ink', zad: { emote: 'think', ...side(830, 1130, 340) },
    el: (d) => <><Bubble f={S} who="You" text="“How was Quran class?”" top={200} /><Bubble f={S} who="Your child" text="“Fine.” 😐" top={430} />
      <Big f={S} dark={d} lines={['Every week, the', '*same* answer?']} size={92} top={690} /></>, swipe: 'TRY THESE' },
  point(1, 'teal', ['“What’s one *new word*', 'you learned today?”'], 'One word is easy to answer. It also tells you what the lesson was about.', { emote: 'search', ...side() }, 86),
  point(2, 'copper', ['“Read me one line, the', 'way your *teacher* does?”'], 'Kids love being the teacher. You get to hear the progress for yourself.', { emote: 'cheer', ...side() }, 80),
  point(3, 'crimson', ['“What did your teacher', 'say you did *well?*”'], 'It keeps the good part of class fresh, and shows you care about more than the mistakes.', { emote: 'love', ...side() }, 84),
];

const n = (c: Card[]) => c.length + 1;
export const C10_SLIDES = n(C10), C11_SLIDES = n(C11), C13_SLIDES = n(C13), C14_SLIDES = n(C14), C15_SLIDES = n(C15);
export const C10Screen: React.FC = () => <Deck cards={C10} outro={{ line: <>What works in {gold('your')} home?</>, ask: 'Another parent might need your idea. Tell us 👇', next: 'How it works with us, in 5 steps.' }} />;
export const C11How: React.FC = () => <Deck cards={C11} outro={{ line: <>Pack your {gold('zaad.')} Your first lesson is on us.</>, ask: 'Link in bio 👆', next: '3 Quran words you already know.' }} />;
export const C13Madd: React.FC = () => <Deck cards={C13} outro={{ line: <>Try it {gold('out loud:')} two taps on each stretch.</>, ask: 'Save this for your next read 🔖', next: 'Remember reading out loud in class…?' }} />;
export const C14Audience: React.FC = () => <Deck cards={C14} outro={{ line: <>Someone your age who {gold('gets you.')} Start where you are.</>, ask: 'Comment ZAAD 👇', next: '“How was Quran class?” “Fine.” Sound familiar?' }} />;
export const C15Ask: React.FC = () => <Deck cards={C15} outro={{ line: <>Pick {gold('one.')} Then listen. A short answer is still an answer.</>, ask: 'Save this for after class 🔖', next: 'Follow Zad for the next pack.' }} />;
