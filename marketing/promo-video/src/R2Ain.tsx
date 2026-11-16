import React from 'react';
import { ArCard, Beat, Big, Loop, Reel, reelTotal, Word, CRIMSON, ESPRESSO, TEAL_DEEP } from './reel';
import RAW from './words-r2.json';

/**
 * V2 v2 · "The first letter of Arabic" (17 Nov 2026), rebuilt on the Shorts engine. Fusha clips: عَلِمَ / أَلِمَ (new,
 * mahmoud-fusha) and the owner-approved syllables from public/v2/f1, f2. Loops: "5-second test at the end", "where does
 * Ayn come from?". Arabic beats are quiet (no effect over Arabic sounds).
 */
const W = RAW as Word[];
export const R2_TOTAL = reelTotal(W);

const beats: Beat[] = [
  { w: 0, bg: { img: 'thumbs/v2.png' }, el: (f, d) => <Big f={f} dark={d} lines={['You’ve said this word', '*1,000* times…']} size={110} top={300} />, zad: { emote: 'oops', x: 540, y: 1290, size: 460, at: 0 } },
  { w: 7, bg: 'crimson', el: (f, d) => <Big f={f} dark={d} lines={['…and never', 'its *first letter.*']} size={130} top={420} />, zad: { emote: 'think', x: 800, y: 1260, size: 360 } },
  { w: 12, bg: 'cream', el: (f) => <ArCard f={f} ar="عَرَبِي" tr="Arabic" mean="starts with…" top={380} size={170} color={CRIMSON} /> },
  { w: 17, bg: 'ink', el: (f) => <ArCard f={f} ar="ع" tr="Ayn" mean="a sound English doesn’t have" top={300} size={300} color={CRIMSON} />, zad: { emote: 'search', x: 540, y: 1200, size: 420, at: 6 } },
  { w: 23, bg: 'teal', el: (f, d) => <Big f={f} dark={d} lines={['One sound', 'changes the', '*meaning.*']} size={130} top={380} /> },
  { w: 28, bg: 'cream', quiet: true, el: (f) => <ArCard f={f} ar="عَلِمَ" tr="‘alima" mean="he knew" top={380} size={230} color={TEAL_DEEP} />, zad: { emote: 'proud', x: 820, y: 1300, size: 320 } },
  { w: 35, bg: 'crimson', quiet: true, el: (f) => <ArCard f={f} ar="أَلِمَ" tr="alima" mean="he was in pain 😣" top={380} size={230} color={ESPRESSO} />, zad: { emote: 'oops', x: 820, y: 1300, size: 340, at: 10 } },
  { w: 47, bg: 'sand', el: (f, d) => <Big f={f} dark={d} lines={['One sound.', '*Two* meanings. 😳']} size={124} top={480} /> },
  { w: 50, bg: 'crimson', el: (f) => <Loop f={f} text="A 5-second test at the end." sub="check yours 👀" top={420} />, zad: { emote: 'point', x: 540, y: 1180, size: 440 } },
  { w: 62, bg: 'ink', el: (f, d) => <Big f={f} dark={d} lines={['So where does', '*Ayn* come from?']} size={120} top={420} />, zad: { emote: 'think', x: 540, y: 1200, size: 420 } },
  { w: 68, bg: 'cream', el: (f, d) => <Big f={f} dark={d} lines={['Not your', '*mouth.* ✗']} size={150} top={460} /> },
  { w: 71, bg: 'teal', el: (f, d) => <Big f={f} dark={d} lines={['Your *throat!*', 'Squeeze the middle…', '…and let it *buzz.*']} size={104} top={360} />, zad: { emote: 'clap', x: 800, y: 1250, size: 360 } },
  { w: 83, bg: 'ink', quiet: true, el: (f) => <ArCard f={f} ar="أَ  ·  عَ" tr="a clean stop  ·  a squeezed buzz" top={380} size={200} color={TEAL_DEEP} /> },
  { w: 85, bg: 'copper', quiet: true, el: (f) => <ArCard f={f} ar="عَ  عِ  عُ" tr="‘a  ·  ‘i  ·  ‘u" mean="every vowel" top={380} size={200} color={CRIMSON} /> },
  { w: 90, bg: 'crimson', el: (f, d) => <Big f={f} dark={d} lines={['5-second', '*TEST* ⏱']} size={170} top={360} />, zad: { emote: 'cheer', x: 540, y: 1180, size: 460 } },
  { w: 92, bg: 'sand', el: (f, d) => <Big f={f} dark={d} lines={['✋ Hand on', 'your throat.', 'Say *Ayn.*']} size={124} top={360} /> },
  { w: 98, bg: 'ink', el: (f, d) => <Big f={f} dark={d} lines={['Feel a', '*buzz?*']} size={170} top={420} />, zad: { emote: 'search', x: 800, y: 1250, size: 360 } },
  { w: 101, bg: 'teal', el: (f, d) => <Big f={f} dark={d} lines={['That’s', '*Ayn!* ✓']} size={180} top={400} />, zad: { emote: 'clap', x: 540, y: 1200, size: 440 } },
  { w: 103, bg: 'cream', el: (f, d) => <Big f={f} dark={d} lines={['No buzz?', 'Squeeze a', '*little more.*']} size={124} top={380} />, zad: { emote: 'wave', x: 800, y: 1250, size: 360 } },
];

export const R2Ain: React.FC = () => <Reel vo="vo-r2.mp3" words={W} beats={beats} outro={{ w: 109, next: 'Who’s really teaching your child?' }} />;
