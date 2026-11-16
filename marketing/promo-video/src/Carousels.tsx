import React from 'react';
import { Card, Deck, SETTLED as S } from './deck';
import { Big, Bubble, Loop, Num, SANS, GOLD_SOFT } from './reel';

/**
 * Carousels rebuilt in the Shorts style (owner, 2026-11-16). Copy kept from the approved first versions; each deck
 * opens on a hook + loop sticker and ends on our PACKED slide with the next pack.
 */
export const Sub: React.FC<{ dark: boolean; text: string; top: number; size?: number }> = ({ dark, text, top, size = 44 }) => (
  <div style={{ position: 'absolute', left: 90, right: 90, top, textAlign: 'center', fontFamily: SANS, fontWeight: 500, fontSize: size, lineHeight: 1.35, color: dark ? '#F3E9DC' : '#453D34' }}>{text}</div>
);
const point = (n: number, bg: Card['bg'], lines: string[], sub: string, zad: Card['zad'], size = 92, swipe?: string): Card => ({
  bg, zad, swipe,
  el: (d) => <><Num f={S} n={n} label="" dark={d} top={170} /><Big f={S} dark={d} lines={lines} size={size} top={450} /><Sub dark={d} text={sub} top={450 + lines.length * size * 1.1 + 50} /></>,
});
const side = (x = 830, y = 1090, size = 340) => ({ x, y, size });
const stranger = <>Nobody should learn their deen from a <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>stranger.</span></>;

/* V3 · 18 Nov · "Who's teaching your child?" */
const C3: Card[] = [
  { bg: 'teal', zad: { emote: 'think', ...side(540, 1060, 420) },
    el: (d) => <><Big f={S} dark={d} lines={['What’s the *name*', 'of the person', 'teaching your child', 'the Quran?']} size={92} top={180} /><Loop f={S} text="#3 most parents never ask 👀" top={640} /></> },
  point(1, 'cream', ['Their name,', 'and their *story.*'], 'Not “a teacher from our team”. A person: where they learned, who taught them, and why they teach.', { emote: 'search', ...side() }, 104),
  { bg: 'ink', zad: { emote: 'love', ...side(170, 1190, 240) },
    el: (d) => <><Num f={S} n={2} label="" dark={d} top={170} /><Big f={S} dark={d} lines={['How they *correct*', 'a mistake.']} size={96} top={440} />
      <Bubble f={S} who="✗ The sigh" text="“No. Again.”" top={640} /><Bubble f={S} who="✓ The teacher" text="“Very close. Once more, together.”" top={860} /></> },
  point(3, 'crimson', ['Will they still be', 'there in *six months?*'], 'Every new teacher starts from zero: your child’s name, their pace, what they love.', { emote: 'oops', ...side() }, 96),
];

/* V6 · 21 Nov · "Drifted? 5 small ways back" */
const C6: Card[] = [
  { bg: 'ink', zad: { emote: 'wave', ...side(540, 1060, 420) },
    el: (d) => <><Big f={S} dark={d} lines={['Drifted?', 'You don’t need a lecture.', 'You need a *first step.*']} size={92} top={200} /><Loop f={S} text="5 small ones. #4 takes courage 👀" top={640} /></> },
  point(1, 'crimson', ['One short surah', 'you already *half*-know.'], 'The one you learned as a kid and lost halfway. Finish it this week, a few lines a day.', { emote: 'point', ...side(), flip: true }, 90),
  point(2, 'copper', ['Five minutes after', '*one* prayer.'], 'Not every prayer. Just one. Stay sitting a little longer and read, or just make du‘a.', { emote: 'think', ...side() }, 96),
  point(3, 'teal', ['Fix *one letter*', 'this week.'], 'Pick the one that always slips (Ayn, Qaf or Haa). One letter is enough for a week.', { emote: 'search', ...side() }, 104),
  point(4, 'ink', ['Ask the question', 'you were *embarrassed*', 'to ask.'], 'Everyone carries one. Asking it is part of learning, and nobody good will laugh.', { emote: 'oops', ...side() }, 78),
  point(5, 'sand', ['Learn with someone', '*your age.*'], 'Coming back is easier when someone is walking the same way.', { emote: 'love', ...side() }, 96),
];

/* V8 · 23 Nov · "Why we're building Watazawwado" (pinned) */
const C8: Card[] = [
  { bg: 'ink', zad: { emote: 'wave', ...side(540, 1060, 420) },
    el: (d) => <><Big f={S} dark={d} lines={['📌 Why we’re', 'building', '*Watazawwado*']} size={104} top={190} /><Loop f={S} text="It started with 2 stories 👀" top={640} /></> },
  point(1, 'crimson', ['The teacher changed,', 'and *nobody* asked them.'], 'Their child started over with someone new. Again.', { emote: 'oops', ...side() }, 88),
  point(2, 'copper', ['They never knew', 'what happened *in class.*'], 'Was it a good lesson? They had to ask, every time.', { emote: 'think', ...side() }, 92),
  { bg: 'teal', zad: { emote: 'proud', ...side(540, 1090, 380) },
    el: (d) => <><Big f={S} dark={d} lines={['So we built', 'an academy around', 'the *relationship.*']} size={76} top={170} />
      <Sub dark={d} size={42} top={470} text="✓ You choose the teacher, from a real profile, before the first class" />
      <Sub dark={d} size={42} top={610} text="✓ We never change your teacher on our side" />
      <Sub dark={d} size={42} top={700} text="✓ A report after every class" />
      <Sub dark={d} size={42} top={790} text="✓ We message you first, before you have to ask" /></> },
  { bg: 'sand', swipe: 'ARE YOU IN?', zad: { emote: 'cheer', ...side() },
    el: (d) => <><Big f={S} dark={d} lines={['We open in', '*small waves.*']} size={116} top={200} />
      <Sub dark={d} top={520} text="The first wave is 20 learners, so every family gets our full attention." />
      <Sub dark={d} top={700} size={38} text="Ustadh Mahmoud, our founder, teaches too, and every teacher here works the same way." /></> },
];

export const C3_SLIDES = C3.length + 1;
export const C6_SLIDES = C6.length + 1;
export const C8_SLIDES = C8.length + 1;
export const C3Teacher: React.FC = () => <Deck cards={C3} outro={{ line: stranger, ask: 'Can you fill in the name tag? Tell us 👇', next: 'Would you hand your child to a stranger?' }} />;
export const C6Back: React.FC = () => <Deck cards={C6} outro={{ line: <>Start where <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>you</span> are. One step counts.</>, ask: 'Comment ZAAD for the link 👇', next: 'The letter that turns your heart… into a dog.' }} />;
export const C8Why: React.FC = () => <Deck cards={C8} outro={{ line: <>Want a place in the <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>first wave?</span></>, ask: 'Comment ZAAD to join the waitlist 👇', next: 'Ten years with the Prophet ﷺ… and not one “uff”.' }} />;
