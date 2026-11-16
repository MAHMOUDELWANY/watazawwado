import React from 'react';
import { interpolate, spring } from 'remotion';
import { Beat, Big, Bubble, Loop, Quote, Reel, reelTotal, Word, GOLD_SOFT, INK, SANS, SERIF, WHITE, CRIMSON } from './reel';
import { clamp, FPS } from './kit';
import RAW from './words-v9.json';

/**
 * V9 v2 · "Ten years. Not one uff." (24 Nov 2026). Sahih al-Bukhari 6038 (Anas ibn Malik), the Arabic is the mahmoud-fusha clip.
 * Loops: "who was that man? wait for the boy's own words", "how many uffs this week?". No people drawn.
 */
const W = RAW as Word[];
export const R9_TOTAL = reelTotal(W);

/** A counter that rolls up to 10 years, with "uff × 0" stamped under it. */
const Counter: React.FC<{ f: number; dark: boolean }> = ({ f, dark }) => {
  const n = Math.round(interpolate(f, [0, 22], [0, 10], clamp));
  const s = spring({ frame: f - 40, fps: FPS, config: { damping: 8 } });
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 230, textAlign: 'center' }}>
      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 340, lineHeight: 1, color: dark ? WHITE : INK }}>{n}</div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 70, letterSpacing: 8, color: GOLD_SOFT }}>YEARS</div>
      <div style={{ display: 'inline-block', marginTop: 50, padding: '14px 44px', border: `10px solid ${CRIMSON}`, borderRadius: 24, background: WHITE, fontFamily: SERIF, fontWeight: 700, fontSize: 110,
        color: CRIMSON, transform: `rotate(-6deg) scale(${s})` }}>“uff” × 0</div>
    </div>
  );
};

/** Things that go wrong in ten years, each stamped, then "0 sighs". */
const Tally: React.FC<{ f: number; t: (w: number) => number }> = ({ f, t }) => (
  <div style={{ position: 'absolute', left: 90, right: 90, top: 300 }}>
    {[['🫖 Broken things', 0], ['📝 Forgotten errands', t(17)], ['🤍 Sighs heard: 0', t(26)]].map(([s, at], i) => {
      const p = spring({ frame: f - (at as number), fps: FPS, config: { damping: 10 } });
      return (
        <div key={i} style={{ marginBottom: 40, padding: '36px 46px', borderRadius: 30, background: i === 2 ? CRIMSON : WHITE, color: i === 2 ? WHITE : INK, fontFamily: SERIF, fontWeight: 700, fontSize: 70,
          transform: `translateX(${(1 - p) * -500}px) rotate(${i === 2 ? -2 : 0}deg)`, opacity: p, boxShadow: '0 16px 28px rgba(0,0,0,0.2)' }}>{s}</div>
      );
    })}
  </div>
);

const HADITH = 'خَدَمْتُ النَّبِيَّ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ عَشْرَ سِنِينَ، فَمَا قَالَ لِي: أُفٍّ';

const beats: Beat[] = [
  { w: 0, bg: 'ink', el: (f, d) => <Counter f={f} dark={d} />, zad: { emote: 'oops', x: 820, y: 1290, size: 340, at: 30 } },
  { w: 5, bg: { img: 'thumbs/v9.png' }, el: (f, d) => <Big f={f} dark={d} lines={['A little boy.', 'One man.', '*10 whole years.*']} size={116} top={330} /> },
  { w: 15, bg: 'cream', el: (f, d, t) => <Tally f={f} t={(w) => t(w)} /> },
  { w: 27, bg: 'crimson', el: (f) => <Loop f={f} text="Who was that man?" sub="wait for the boy’s own words 👀" top={420} />, zad: { emote: 'think', x: 540, y: 1150, size: 460 } },
  { w: 40, bg: 'sand', el: (f, d, t) => <><Big f={f} dark={d} lines={['Be honest:', 'how many *“uffs”*', 'this week?']} size={110} top={280} />{f >= t(49) && <Big f={f - t(49)} dark={d} lines={['Yeah… me too 😅']} size={86} top={800} />}</>,
    zad: { emote: 'oops', x: 820, y: 1300, size: 320, at: 30 } },
  { w: 52, bg: 'ink', el: (f, d) => <Big f={f} dark={d} lines={['Anas said:']} size={130} top={560} /> },
  { w: 58, bg: 'cream', quiet: true, noCaps: true, el: (f) => <Quote f={f} ar={HADITH} source="Anas ibn Malik · Sahih al-Bukhari 6038" top={420} arSize={88} /> },
  { w: 59, bg: 'cream', el: (f) => <Quote f={f + 30} ar={HADITH} arSize={64} en="“I served the Prophet ﷺ for ten years, and he never once said ‘uff’ to me.”" source="Sahih al-Bukhari 6038" top={260} enAt={30} /> },
  { w: 78, bg: 'teal', el: (f, d, t) => <><Big f={f} dark={d} lines={['The swap:', 'sigh → *a question*']} size={96} top={240} />{f >= t(91) - 8 && <Bubble f={f - (t(91) - 8)} who="You, next spill" text="Are you okay? 🤍" top={720} />}</>,
    zad: { emote: 'love', x: 820, y: 1300, size: 320, at: 10 } },
];

export const R9Anas: React.FC = () => <Reel vo="vo-v9.mp3" words={W} beats={beats} outro={{ w: 94, next: '3 Quran words… you already know.' }} />;
