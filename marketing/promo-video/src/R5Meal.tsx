import React from 'react';
import { ArCard, Beat, Big, Chips, Loop, Num, Reel, reelTotal, Word, CRIMSON, TEAL_DEEP } from './reel';
import RAW from './words-v5.json';

/** V5 v2 · "3 Arabic words your kids say every day" (20 Nov 2026). Loops: "#3 makes the cook smile", the after-meal quiz. */
const W = RAW as Word[];
export const R5_TOTAL = reelTotal(W);

const beats: Beat[] = [
  { w: 0, bg: { img: 'thumbs/v5.png' }, el: (f, d) => <Big f={f} dark={d} lines={['Your kids say', '*3 Arabic words*', 'every day.']} size={116} top={300} />, zad: { emote: 'wave', x: 540, y: 1290, size: 460, at: 0 } },
  { w: 8, bg: 'ink', el: (f, d) => <Big f={f} dark={d} lines={['Do they know', 'what they', '*MEAN?*']} size={140} top={360} />, zad: { emote: 'think', x: 800, y: 1250, size: 360 } },
  { w: 15, bg: 'crimson', el: (f) => <Loop f={f} text="#3 makes the cook smile." sub="wait for it 👀" top={420} />, zad: { emote: 'search', x: 540, y: 1180, size: 440 } },
  { w: 24, bg: 'cream', el: (f, d, t) => <><Num f={f} n={1} label="before the first bite" dark={d} top={200} />{f >= t(29) - 2 && <ArCard f={f - t(29) + 2} ar="بِسْمِ اللَّهِ" tr="Bismillah" mean="In the name of Allah" top={700} size={150} color={TEAL_DEEP} />}</> },
  { w: 35, bg: 'sand', el: (f, d) => <Big f={f} dark={d} lines={['…even on a', '*plate of pasta* 🍝']} size={116} top={480} />, zad: { emote: 'love', x: 540, y: 1150, size: 420 } },
  { w: 41, bg: 'teal', el: (f, d, t) => <><Num f={f} n={2} label="when the plate is empty" dark={d} top={200} />{f >= t(47) - 2 && <ArCard f={f - t(47) + 2} ar="الْحَمْدُ لِلَّهِ" tr="Alhamdulillah" mean="All praise is for Allah" top={700} size={150} color={TEAL_DEEP} />}</> },
  { w: 53, bg: 'ink', el: (f, d) => <><Num f={f} n={3} label="most kids never say it…" dark={d} top={260} /></>, zad: { emote: 'oops', x: 540, y: 1100, size: 440, at: 8 } },
  { w: 60, bg: 'crimson', el: (f, d, t) => <><Big f={f} dark={d} lines={['To whoever', 'made the food:']} size={96} top={220} />{f >= t(65) - 2 && <ArCard f={f - t(65) + 2} ar="جَزَاكَ اللَّهُ خَيْرًا" tr="JazakAllahu khayran" mean="May Allah reward you with good" top={560} size={130} color={CRIMSON} />}</> },
  { w: 73, bg: 'sand', el: (f, d) => <Big f={f} dark={d} lines={['Now watch', 'the cook’s *face* 😄']} size={120} top={460} />, zad: { emote: 'cheer', x: 540, y: 1160, size: 460 } },
  { w: 78, bg: 'ink', el: (f, d, t) => <><Big f={f} dark={d} lines={['Quick quiz:', 'which one comes', '*AFTER* the meal?']} size={92} top={200} /><Chips f={f} items={['Bismillah', 'Alhamdulillah', 'JazakAllahu khayran']} top={640} pick={1} pickAt={t(86)} dark /></>,
    zad: { emote: 'think', x: 860, y: 1330, size: 300 } },
];

export const R5Meal: React.FC = () => <Reel vo="vo-v5.mp3" words={W} beats={beats} outro={{ w: 90, next: 'The one letter that turns your heart… into a dog.' }} />;
