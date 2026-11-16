import React from 'react';
import { ArCard, Beat, Big, Chips, Loop, Num, Quote, Reel, reelTotal, Word, CRIMSON, TEAL_DEEP } from './reel';
import RAW from './words-v12.json';

/**
 * V12 v2 · "3 Quran words you already know" (27 Nov 2026). Ayat shown as text only (Saheeh International), copied from the
 * quran.ai checks in V12Words.tsx: 36:58, 103:3, 21:107. Loops: "#3 you've said a thousand times", "which one do you say most?".
 */
const W = RAW as Word[];
export const R12_TOTAL = reelTotal(W);

const beats: Beat[] = [
  { w: 0, bg: { img: 'thumbs/v12.png' }, el: (f, d) => <Big f={f} dark={d} lines={['You already know', '*3 words*', 'from the Quran.']} size={116} top={300} />, zad: { emote: 'wave', x: 540, y: 1290, size: 460, at: 0 } },
  { w: 8, bg: 'ink', el: (f, d) => <Big f={f} dark={d} lines={['You just don’t know', 'you *know* them 😏']} size={104} top={480} />, zad: { emote: 'spin', x: 800, y: 1260, size: 360 } },
  { w: 15, bg: 'crimson', el: (f) => <Loop f={f} text="#3: you’ve said it a thousand times." sub="stay for it 👀" top={400} />, zad: { emote: 'think', x: 540, y: 1180, size: 440 } },
  { w: 27, bg: 'teal', el: (f, d, t) => <><Num f={f} n={1} label="walking into any room" dark={d} top={200} />{f >= t(35) - 2 && <ArCard f={f - t(35) + 2} ar="سَلَام" tr="Salam" mean="peace" top={700} size={200} color={TEAL_DEEP} />}</> },
  { w: 37, bg: 'cream', el: (f) => <Quote f={f} ar="سَلَـٰمٌ قَوْلًا مِّن رَّبٍّ رَّحِيمٍ" en="“Peace,” a word from a Merciful Lord." source="Ya-Sin 36:58 · Saheeh International" top={380} enAt={10} /> },
  { w: 48, bg: 'sand', el: (f, d, t) => <><Num f={f} n={2} label="stuck in traffic, mom whispered it" dark={d} top={200} />{f >= t(56) - 2 && <ArCard f={f - t(56) + 2} ar="صَبْر" tr="Sabr" mean="patience" top={700} size={200} color={CRIMSON} />}</> },
  { w: 58, bg: 'cream', el: (f) => <Quote f={f} ar="… وَتَوَاصَوْا۟ بِٱلصَّبْرِ" en="… and advised each other to patience." source="Al-Asr 103:3 · the surah’s last words" top={400} enAt={10} /> },
  { w: 63, bg: 'ink', el: (f, d) => <Num f={f} n={3} label="in every du’a you’ve ever heard…" dark={d} top={300} />, zad: { emote: 'search', x: 540, y: 1180, size: 420, at: 6 } },
  { w: 72, bg: 'crimson', el: (f) => <ArCard f={f} ar="رَحْمَة" tr="Rahmah" mean="mercy" top={420} size={220} color={CRIMSON} />, zad: { emote: 'love', x: 820, y: 1300, size: 320, at: 8 } },
  { w: 74, bg: 'cream', el: (f) => <Quote f={f} ar="وَمَآ أَرْسَلْنَـٰكَ إِلَّا رَحْمَةً لِّلْعَـٰلَمِينَ" en="And We have not sent you except as a mercy to the worlds." source="Al-Anbiya 21:107 · Saheeh International" top={360} enAt={10} /> },
  { w: 86, bg: 'teal', el: (f, d) => <Big f={f} dark={d} lines={['You didn’t study them.', 'You *grew up* with them.']} size={100} top={420} />, zad: { emote: 'proud', x: 540, y: 1180, size: 420 } },
  { w: 97, bg: 'sand', el: (f, d) => <><Big f={f} dark={d} lines={['Which one do you', 'say the *most?* 💬']} size={100} top={220} /><Chips f={f} items={['Salam', 'Sabr', 'Rahmah']} top={600} /></>,
    zad: { emote: 'point', x: 860, y: 1330, size: 300, flip: true } },
];

export const R12Words: React.FC = () => <Reel vo="vo-v12.mp3" words={W} beats={beats} outro={{ w: 109, next: 'Follow Zad for the next pack.' }} />;
