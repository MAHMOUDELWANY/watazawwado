import React from 'react';
import { Card, Deck, SETTLED as S } from './deck';
import { Big, Loop, Num, SANS, GOLD_SOFT } from './reel';

/** V1 v2 · "5 questions before you book a Quran teacher" (16 Nov 2026) in the Shorts style. Loops: "#5 takes nerve", "the bold one" swipe tag. */
const Sub: React.FC<{ dark: boolean; text: string; top: number }> = ({ dark, text, top }) => (
  <div style={{ position: 'absolute', left: 90, right: 90, top, textAlign: 'center', fontFamily: SANS, fontWeight: 500, fontSize: 44, lineHeight: 1.35, color: dark ? '#F3E9DC' : '#453D34' }}>{text}</div>
);
const Q = (n: number, bg: Card['bg'], lines: string[], sub: string, zad: Card['zad'], size = 92): Card => ({
  bg,
  zad,
  el: (d) => <><Num f={S} n={n} label="" dark={d} top={170} /><Big f={S} dark={d} lines={lines} size={size} top={450} /><Sub dark={d} text={sub} top={790} /></>,
});

export const C1_CARDS: Card[] = [
  { bg: 'crimson', zad: { emote: 'search', x: 540, y: 1060, size: 420 },
    el: (d) => <><Big f={S} dark={d} lines={['Booking a', 'Quran teacher?', 'Ask these *5* first.']} size={104} top={190} /><Loop f={S} text="#5 takes nerve 👀" top={600} /></> },
  Q(1, 'teal', ['Can I *meet* the teacher', 'before class 1?'], 'Their name, their background, how they teach. You’re choosing a person, not a timetable.', { emote: 'point', x: 830, y: 1090, size: 340, flip: true }),
  Q(2, 'cream', ['Same teacher', '*every* week?'], 'Every new teacher starts from zero with your child: their name, their pace, what they love.', { emote: 'think', x: 830, y: 1090, size: 340 }, 104),
  Q(3, 'copper', ['What will you tell me', 'after class, *without*', 'me asking?'], 'You shouldn’t have to chase anyone to find out how it went.', { emote: 'love', x: 830, y: 1090, size: 340 }, 84),
  { ...Q(4, 'sand', ['Will you check what', 'my child *already*', 'knows?'], 'Going over what they already know is the quickest way to lose them.', { emote: 'search', x: 830, y: 1090, size: 340 }, 84), swipe: 'THE BOLD ONE' },
  Q(5, 'ink', ['Can I *sit in*', 'on a lesson?'], 'A good teacher doesn’t mind being watched.', { emote: 'proud', x: 540, y: 1070, size: 380 }, 110),
];

export const C1_SLIDES = C1_CARDS.length + 1;
export const C1Questions: React.FC = () => (
  <Deck cards={C1_CARDS} outro={{
    line: <>Nobody should learn their deen from a <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>stranger.</span></>,
    ask: 'Which one did nobody answer for you? Tell us 👇',
    next: 'The first letter of “Arabic”… and why it’s so hard.',
  }} />
);
