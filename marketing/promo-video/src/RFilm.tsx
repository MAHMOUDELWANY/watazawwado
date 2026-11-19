import React from 'react';
import { AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame } from 'remotion';
import { ArCard, Background, Beat, Big, Loop, Quote, Word, Zad, isDark, CRIMSON, GOLD_SOFT, INK, SANS, SERIF, TEAL, WHITE, ESPRESSO } from './reel';
import { clamp, FPS, RIBBON } from './kit';
import { Logo } from './V2Ain';
import { fr, makeVO } from './captions';
import AR_WORDS from './words-film-ar.json';
import EN_WORDS from './words-film-en.json';

/**
 * The homepage film (owner, 2026-11-19): made like our Shorts (reel engine: a hard cut per beat, colour fields, slammed
 * lines, 3D Zad moves, kinetic captions), few pictures. Voice: marketing/intro-film/vo/{ar,en}-v5-t1.mp3 (one steady
 * tone, loudness-normalised), timed by Scribe. Ending: the open bag, "pack your Zad", no CTA.
 */

const pop = (f: number, d = 0, damping = 12) => spring({ frame: f - d, fps: FPS, config: { damping, mass: 0.55 } });

/** Pills that land on their words (t = frame of each word, relative to the beat). */
const TimedChips: React.FC<{ f: number; items: [number, string][]; top: number; dark: boolean }> = ({ f, items, top, dark }) => (
  <div style={{ position: 'absolute', left: 90, right: 90, top, display: 'flex', flexDirection: 'column', gap: 28, alignItems: 'center' }}>
    {items.map(([at, label], i) => {
      const p = pop(f, at - 2, 10);
      return (
        <div key={i} style={{ borderRadius: 999, padding: '26px 52px', fontFamily: SANS, fontWeight: 700, fontSize: 58, background: i % 2 ? TEAL : WHITE, color: i % 2 ? WHITE : INK,
          border: `6px solid ${dark ? 'rgba(255,255,255,0.4)' : 'rgba(27,21,18,0.1)'}`, boxShadow: '0 18px 30px rgba(0,0,0,0.25)', opacity: Math.min(1, p * 1.4),
          transform: `translateX(${(1 - p) * (i % 2 ? 320 : -320)}px) rotate(${(i % 2 ? 2 : -2) * p}deg) scale(${0.8 + 0.2 * p})` }}>{label}</div>
      );
    })}
  </div>
);

/** Our real lesson covers: they fly in and fan out; each lifts on its word. */
const Covers: React.FC<{ f: number; items: { src: string; label: string; at: number }[]; rtl: boolean }> = ({ f, items, rtl }) => (
  <div style={{ position: 'absolute', left: 540, top: 820 }}>
    {items.map((c, i) => {
      const mid = (items.length - 1) / 2;
      const o = (rtl ? mid - i : i - mid);
      const p = pop(f, 2 + i * 4, 11);
      const hi = pop(f, c.at - 2, 9);
      const s = 380;
      return (
        <div key={c.src} style={{ position: 'absolute', left: -s / 2, top: -s / 2, width: s, height: s, borderRadius: 40, overflow: 'hidden', border: `10px solid ${WHITE}`,
          boxShadow: `0 30px 50px rgba(0,0,0,0.4), 0 0 ${hi * 70}px rgba(246,213,142,${hi * 0.9})`, zIndex: Math.round(hi * 10) + 5 - Math.round(Math.abs(o)),
          transform: `translate(${o * 250 * p}px, ${(1 - p) * 900 + Math.abs(o) * 30 - hi * 60}px) rotate(${o * 9 * p * (1 - hi * 0.8)}deg) scale(${0.85 + hi * 0.2})` }}>
          <Img src={staticFile(c.src)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '50px 0 18px', textAlign: 'center', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
            fontFamily: SANS, fontWeight: 700, fontSize: 46, color: WHITE }}>{c.label}</div>
        </div>
      );
    })}
  </div>
);

/** A path of five steps that draws itself; each stone lights in turn. */
const Steps: React.FC<{ f: number; at: number; rtl: boolean }> = ({ f, at, rtl }) => {
  const pts = [[150, 1240], [340, 1150], [540, 1200], [740, 1110], [930, 1040]].map(([x, y]) => [rtl ? 1080 - x : x, y]);
  const p = interpolate(f, [at, at + 40], [0, 1], clamp);
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <path d={'M' + pts.map((q) => q.join(' ')).join(' L')} fill="none" stroke={GOLD_SOFT} strokeWidth={10} strokeLinecap="round" strokeDasharray="4 26" opacity={p > 0 ? 1 : 0} />
      {pts.map(([x, y], i) => {
        const s = pop(f, at + i * 7, 8);
        return <g key={i} transform={`translate(${x} ${y}) scale(${s})`}><circle r={46} fill={CRIMSON} stroke={GOLD_SOFT} strokeWidth={8} /><text textAnchor="middle" y={18} fontFamily={SERIF} fontWeight={700} fontSize={52} fill={WHITE}>{i + 1}</text></g>;
      })}
    </svg>
  );
};

/** A word struck through with a red line (what we do not count). */
const Struck: React.FC<{ f: number; text: string; at: number; top: number; rtl: boolean }> = ({ f, text, at, top, rtl }) => {
  const p = pop(f, 0, 12);
  const s = interpolate(f, [at, at + 10], [0, 1], clamp);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, textAlign: 'center', opacity: p, transform: `scale(${0.85 + 0.15 * p})` }}>
      <span style={{ position: 'relative', display: 'inline-block', fontFamily: SERIF, fontWeight: 700, fontSize: 150, color: WHITE, opacity: 1 - 0.45 * s }}>
        {text}
        <span style={{ position: 'absolute', top: '52%', height: 16, borderRadius: 8, background: CRIMSON, width: `${s * 108}%`, [rtl ? 'right' : 'left']: '-4%', transform: 'rotate(-4deg)' }} />
      </span>
    </div>
  );
};

/** Our ending: the open bag in its light, the line, Zad packing, then our name. */
const Ending: React.FC<{ f: number; lines: string[]; name: string; sub: string }> = ({ f, lines, name, sub }) => {
  const z = interpolate(f, [0, 160], [1.12, 1], clamp);
  const card = interpolate(f, [100, 125], [0, 1], clamp);
  return (
    <>
      <AbsoluteFill><Img src={staticFile('thumbs/film.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})` }} />
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(27,21,18,0.75), rgba(27,21,18,0.1) 45%, rgba(27,21,18,0.65))' }} /></AbsoluteFill>
      <Big f={f} dark lines={lines} size={104} top={240} stagger={18} />
      <AbsoluteFill style={{ background: `radial-gradient(60% 45% at 50% 45%, #4A2018, ${ESPRESSO} 60%, #1E120C)`, opacity: card, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <Img src={staticFile('img/zaad-bag.svg')} style={{ width: 300, transform: `scale(${pop(f, 104, 10)}) rotate(${Math.sin(f / 9) * 2}deg)`, filter: 'drop-shadow(0 20px 26px rgba(0,0,0,0.45))' }} />
        <div style={{ marginTop: 40, fontFamily: SERIF, fontWeight: 700, fontSize: 120, background: RIBBON, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', opacity: pop(f, 112) }}>{name}</div>
        <div style={{ marginTop: 10, fontFamily: SANS, fontWeight: 700, fontSize: 44, color: WHITE, opacity: 0.85 * pop(f, 120) }}>{sub}</div>
      </AbsoluteFill>
    </>
  );
};

type Lang = 'ar' | 'en';
const WORDS: Record<Lang, Word[]> = { ar: AR_WORDS as Word[], en: EN_WORDS as Word[] };
const COVER = (k: string) => `img/cur-${k}.webp`;

const BEATS: Record<Lang, (t: (w: number) => number) => Beat[]> = {
  en: () => [
    { w: 0, bg: { img: 'thumbs/film.png' }, el: (f, d) => <Big f={f} dark={d} lines={['If you could carry', '*just one thing*…']} size={116} top={300} />, zad: { emote: 'think', x: 540, y: 1180, size: 440, at: 0 } },
    { w: 7, bg: 'ink', el: (f, d) => <Big f={f} dark={d} lines={['far from', '*home*…']} size={150} top={420} />, zad: { emote: 'search', x: 760, y: 1200, size: 380 } },
    { w: 10, bg: 'crimson', el: (f) => <Loop f={f} text="What would it be?" sub="the answer comes at the end" top={420} />, zad: { emote: 'point', x: 540, y: 1180, size: 420 } },
    { w: 14, bg: 'cream', el: (f, d) => <Big f={f} dark={d} lines={['The things we fear', '*losing most*…']} size={108} top={360} />, zad: { emote: 'oops', x: 540, y: 1150, size: 420 } },
    { w: 20, bg: 'sand', el: (f, d) => <Big f={f} dark={d} lines={['don’t fit in', 'a *suitcase.*']} size={130} top={380} />, zad: { emote: 'think', x: 760, y: 1200, size: 360 } },
    { w: 25, bg: 'teal', el: (f) => <ArCard f={f} ar="كَلَامُ اللهِ" mean="The words of Allah" top={460} size={190} color={CRIMSON} />, zad: { emote: 'love', x: 540, y: 1220, size: 380, at: 6 }, quiet: true },
    { w: 29, bg: 'copper', el: (f) => <ArCard f={f} ar="لِسَانُ أَجْدَادِنَا" mean="the language of our grandparents" top={460} size={150} color={INK} />, zad: { emote: 'proud', x: 760, y: 1240, size: 340, at: 6 } },
    { w: 34, bg: 'ink', el: (f, d) => <Big f={f} dark={d} lines={['a faith we want', 'our children', 'to *keep.*']} size={112} top={340} />, zad: { emote: 'love', x: 540, y: 1220, size: 380 } },
    { w: 42, bg: 'crimson', el: (f, d) => <Big f={f} dark={d} lines={['So we made them', 'a *provision*', 'of their own…']} size={112} top={330} />, zad: { emote: 'cheer', x: 540, y: 1220, size: 420 } },
    { w: 51, bg: 'cream', el: (f, d, t) => <><Big f={f} dark={d} lines={['lessons they can…']} size={100} top={260} /><TimedChips f={f} dark={d} top={520} items={[[t(54), '👀  see'], [t(56), '🎮  play with'], [t(59), '❤️  love']]} /></>,
      zad: { emote: 'clap', x: 540, y: 1250, size: 360 } },
    { w: 60, bg: 'sand', el: (f, d, t) => <><Big f={f} dark={d} lines={['in *our own* lessons']} size={92} top={230} /><Covers f={f} rtl={false} items={[{ src: COVER('quran-reading'), label: 'The Quran', at: t(62) }, { src: COVER('seerah'), label: 'The Seerah', at: t(64) }, { src: COVER('fusha-kids'), label: 'Arabic', at: t(66) }]} /></>, noCaps: true },
    { w: 67, bg: 'teal', el: (f, d, t) => <><Big f={f} dark={d} lines={['a teacher who', '*walks beside them*']} size={104} top={300} /><Steps f={f} at={t(74) - 6} rtl={false} /></>, zad: { emote: 'dash', x: 540, y: 1560, size: 300, at: 4 }, noCaps: true },
    { w: 77, bg: 'ink', el: (f, d, t) => <><Big f={f} dark={d} lines={['We don’t count']} size={100} top={400} /><Struck f={f} text="lessons" at={t(80) + 6} top={600} rtl={false} /></>, zad: { emote: 'think', x: 760, y: 1250, size: 360 } },
    { w: 81, bg: 'cream', el: (f, d, t) => <><Big f={f} dark={d} lines={['we count', '*what stays:*']} size={110} top={220} /><TimedChips f={f} dark={d} top={640} items={[[t(86), 'a verse kept by heart'], [t(91), 'a tongue made right'], [t(95), 'a good habit at home']]} /></>,
      zad: { emote: 'proud', x: 540, y: 1330, size: 300 }, noCaps: true },
    { w: 99, bg: 'cream', el: (f, d, t) => <Quote f={f} ar="فَأَمَّا ٱلزَّبَدُ فَيَذْهَبُ جُفَآءً ۖ وَأَمَّا مَا يَنفَعُ ٱلنَّاسَ فَيَمْكُثُ فِى ٱلْأَرْضِ" en="“As for the foam, it vanishes… but what benefits people remains on the earth.”" source="Ar-Ra‘d 13:17" top={330} arSize={76} enAt={t(105)} />, noCaps: true },
    { w: 113, bg: 'sand', el: (f, d) => <Big f={f} dark={d} lines={['That is', 'the *provision*…']} size={130} top={420} />, zad: { emote: 'proud', x: 540, y: 1220, size: 380 } },
    { w: 117, bg: 'cream', el: (f) => <Quote f={f} ar="وَتَزَوَّدُوا۟ فَإِنَّ خَيْرَ ٱلزَّادِ ٱلتَّقْوَىٰ" en="“Take provision, and the best provision is mindfulness of Allah.”" source="Al-Baqarah 2:197" top={380} arSize={90} enAt={8} />, noCaps: true },
  ],
  ar: () => [
    { w: 0, bg: { img: 'thumbs/film.png' }, el: (f, d) => <Big f={f} dark={d} lines={['لو كان لك أن تحمل', '*شيئًا واحدًا* فقط…']} size={104} top={300} />, zad: { emote: 'think', x: 540, y: 1180, size: 440, at: 0 } },
    { w: 8, bg: 'ink', el: (f, d) => <Big f={f} dark={d} lines={['إلى', '*الغربة*…']} size={160} top={400} />, zad: { emote: 'search', x: 320, y: 1200, size: 380 } },
    { w: 10, bg: 'crimson', el: (f) => <Loop f={f} text="ماذا تحمل؟" sub="الجواب في الآخر" top={440} />, zad: { emote: 'point', x: 540, y: 1180, size: 420 } },
    { w: 12, bg: 'cream', el: (f, d) => <Big f={f} dark={d} lines={['أثمنُ ما نخاف', '*أن نفقده*…']} size={116} top={360} />, zad: { emote: 'oops', x: 540, y: 1150, size: 420 } },
    { w: 17, bg: 'sand', el: (f, d) => <Big f={f} dark={d} lines={['لا تتّسع له', '*حقيبة.*']} size={140} top={380} />, zad: { emote: 'think', x: 320, y: 1200, size: 360 } },
    { w: 21, bg: 'teal', el: (f) => <ArCard f={f} ar="كَلَامُ اللهِ" top={500} size={190} color={CRIMSON} />, zad: { emote: 'love', x: 540, y: 1220, size: 380, at: 6 }, noCaps: true },
    { w: 23, bg: 'copper', el: (f) => <ArCard f={f} ar="وَلِسَانُ أَجْدَادِنَا" top={500} size={150} color={INK} />, zad: { emote: 'proud', x: 320, y: 1240, size: 340, at: 6 }, noCaps: true },
    { w: 25, bg: 'ink', el: (f, d) => <Big f={f} dark={d} lines={['ودينٌ نريده', 'أن *يبقى*', 'في أبنائنا.']} size={118} top={330} />, zad: { emote: 'love', x: 540, y: 1220, size: 380 } },
    { w: 31, bg: 'crimson', el: (f, d) => <Big f={f} dark={d} lines={['لذلك صنعنا لهم', '*زادًا*…']} size={124} top={380} />, zad: { emote: 'cheer', x: 540, y: 1220, size: 420 } },
    { w: 35, bg: 'cream', el: (f, d, t) => <><Big f={f} dark={d} lines={['منهجًا…']} size={110} top={250} /><TimedChips f={f} dark={d} top={520} items={[[t(36), 'يرونه  👀'], [t(37), 'ويلعبون به  🎮'], [t(39), 'ويحبّونه  ❤️']]} /></>,
      zad: { emote: 'clap', x: 540, y: 1250, size: 360 } },
    { w: 40, bg: 'sand', el: (f, d, t) => <><Big f={f} dark={d} lines={['في *دروسنا* نحن']} size={96} top={230} /><Covers f={f} rtl items={[{ src: COVER('quran-reading'), label: 'القرآن', at: t(41) }, { src: COVER('seerah'), label: 'السيرة', at: t(42) }, { src: COVER('fusha-kids'), label: 'العربية', at: t(43) }]} /></>, noCaps: true },
    { w: 44, bg: 'teal', el: (f, d, t) => <><Big f={f} dark={d} lines={['ومعلّمًا', '*يمشي معهم*']} size={116} top={300} /><Steps f={f} at={t(47) - 6} rtl /></>, zad: { emote: 'dash', x: 540, y: 1560, size: 300, at: 4 }, noCaps: true },
    { w: 49, bg: 'ink', el: (f, d, t) => <><Big f={f} dark={d} lines={['لا نعدّ']} size={110} top={400} /><Struck f={f} text="الحصص" at={t(51) + 6} top={600} rtl /></>, zad: { emote: 'think', x: 320, y: 1250, size: 360 } },
    { w: 52, bg: 'cream', el: (f, d, t) => <><Big f={f} dark={d} lines={['بل نعدّ', '*ما يبقى:*']} size={118} top={220} /><TimedChips f={f} dark={d} top={660} items={[[t(56), 'آيةٌ تُحفظ'], [t(58), 'ولسانٌ يستقيم'], [t(60), 'وعادةٌ طيبة في البيت']]} /></>,
      zad: { emote: 'proud', x: 540, y: 1330, size: 300 }, noCaps: true },
    { w: 64, bg: 'cream', el: (f) => <Quote f={f} ar="فَأَمَّا ٱلزَّبَدُ فَيَذْهَبُ جُفَآءً ۖ وَأَمَّا مَا يَنفَعُ ٱلنَّاسَ فَيَمْكُثُ فِى ٱلْأَرْضِ" source="الرعد ١٧" top={420} arSize={90} />, noCaps: true },
    { w: 75, bg: 'sand', el: (f, d) => <Big f={f} dark={d} lines={['وهذا هو', '*الزاد*…']} size={150} top={400} />, zad: { emote: 'proud', x: 540, y: 1220, size: 380 } },
    { w: 78, bg: 'cream', el: (f) => <Quote f={f} ar="وَتَزَوَّدُوا۟ فَإِنَّ خَيْرَ ٱلزَّادِ ٱلتَّقْوَىٰ" source="البقرة ١٩٧" top={480} arSize={104} />, noCaps: true },
  ],
};

const ENDING: Record<Lang, { w: number; lines: string[]; name: string; sub: string }> = {
  en: { w: 127, lines: ['So *pack your Zad*…', 'before too much', 'passes you by.'], name: 'Watazawwado', sub: 'Provision that lasts' },
  ar: { w: 83, lines: ['فجهّز *زادك*…', 'قبل أن يفوتك', 'الكثير.'], name: 'وتزوّدوا', sub: 'زادٌ يبقى، لك ولأهل بيتك' },
};

export const filmTotal = (lang: Lang) => { const W = WORDS[lang]; return fr(W[W.length - 1][2]) + 120; };

export const RFilm: React.FC<{ lang: Lang }> = ({ lang }) => {
  const f = useCurrentFrame();
  const W = WORDS[lang];
  const t = (w: number) => fr(W[w][1]);
  const rtl = lang === 'ar';
  const end = ENDING[lang];
  const all: Beat[] = [...BEATS[lang](t), { w: end.w, bg: 'ink', el: (lf) => <Ending f={lf} lines={end.lines} name={end.name} sub={end.sub} />, zad: { emote: 'check', x: 540, y: 1480, size: 340, at: 30 }, noCaps: true }];
  const starts = all.map((b, i) => (i === 0 ? 0 : t(b.w)));
  let i = starts.length - 1;
  while (i > 0 && f < starts[i]) i--;
  const b = all[i];
  const local = f - starts[i];
  const dark = isDark(b.bg);
  const punch = interpolate(local, [0, 7], [1.07, 1], { ...clamp, easing: (x) => 1 - (1 - x) ** 3 });
  const total = filmTotal(lang);
  const VO = React.useMemo(() => makeVO(W), [lang]);
  return (
    <AbsoluteFill style={{ background: ESPRESSO, overflow: 'hidden', direction: rtl ? 'rtl' : 'ltr' }}>
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        <Background bg={b.bg} local={local} />
        {b.el(local, dark, (w) => t(w) - starts[i])}
        {b.zad && <Zad {...b.zad} from={starts[i] + (b.zad.at ?? 2)} />}
      </AbsoluteFill>
      {!b.noCaps && <VO.Captions dark={() => dark} top={1500} />}
      <div style={{ position: 'absolute', [rtl ? 'right' : 'left']: 0, top: 0, height: 12, width: `${(f / total) * 100}%`, background: RIBBON }} />
      <div style={{ direction: 'ltr' }}><Logo /></div>
      {all.map((x, k) => (k > 0 && !x.quiet ? <Sequence key={k} from={starts[k]} durationInFrames={20}><Audio src={staticFile('sfx/pop.mp3')} volume={0.18} /></Sequence> : null))}
      <Sequence from={fr(0)}><Audio src={staticFile(`vo-film-${lang}.mp3`)} /></Sequence>
    </AbsoluteFill>
  );
};

export const RFilmAr: React.FC = () => <RFilm lang="ar" />;
export const RFilmEn: React.FC = () => <RFilm lang="en" />;
export { GOLD_SOFT };
