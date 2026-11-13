import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame } from 'remotion';
import { COPPER, CRIMSON, FPS, GOLD, GOLD_SOFT, SANS, SERIF, Sfx, TEAL_DEEP, clamp, io } from './kit';

/**
 * V2 · Fix one letter: ع (Content Calendar, 17 Nov 2026).
 * Look: paper-cutout explainer (owner's reference 2026-11-13, docs/design/INSPIRATION.md "Paper cut-out explainer"):
 * graph paper, torn paper cards, white-bordered stickers, red pins and string, a black caption chip. Our palette only.
 * Voice: public/vo-v2.mp3 = owner's English clone (a, b, c) + Fusha clone for the syllables (f1, f2).
 */
export const V2_TOTAL = Math.round(46.5 * FPS);
const t = (s: number) => Math.round(s * FPS);

const INK = '#1B1512';
const ESPRESSO = '#3B2219';
const SAND = '#D9A441';
const CREAM = '#ECE6DB';
const AR = 'ThmanyahSerif, "Noto Naskh Arabic", serif';

const CUES: [string, number, number][] = [
  ['English has no ع', 0.3, 2.3],
  ['so most of us read it like a plain “a”', 2.67, 5.6],
  ['Here’s the fix', 6.0, 7.1],
  ['ع comes from the middle of your throat', 7.37, 9.9],
  ['Try this', 10.08, 10.9],
  ['Say “aah”', 11.23, 12.9],
  ['Now gently squeeze the middle of your throat…', 13.25, 16.2],
  ['like you’re about to lift something heavy', 16.34, 18.9],
  ['Feel that little buzz?', 19.19, 20.4],
  ['That’s it', 20.69, 21.6],
  ['Listen to the difference', 21.85, 23.4],
  ['Now you', 28.7, 30.1],
  ['Repeat after me', 30.41, 31.8],
  ['One letter at a time', 37.3, 39.2],
  ['That’s how it sticks', 39.48, 40.9],
  ['Pack your zaad', 41.17, 42.4],
  ['The next letter’s waiting…', 42.56, 44.2],
  ['link in bio', 44.37, 46.5],
];
const S = { hook: 0, place: 6.0, buzz: 13.0, listen: 21.6, you: 28.6, end: 37.1 };
const F1 = [['أَ', 23.5], ['عَ', 25.04], ['أَ', 26.48], ['عَ', 27.61]] as const;
const F2 = [['عَ', 31.9], ['عِ', 34.33], ['عُ', 36.17]] as const;

/* ---------- paper kit ---------- */

/** A jagged polygon for torn paper, as a CSS clip-path. */
const torn = (seed: string, amp = 1.2, n = 18) => {
  const pts: string[] = [];
  const j = (i: number, k: string) => (random(`${seed}${k}${i}`) - 0.5) * amp;
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${Math.max(0, j(i, 't') + amp / 2)}%`);
  for (let i = 0; i <= n; i++) pts.push(`${100 - Math.max(0, j(i, 'r') + amp / 2)}% ${(i / n) * 100}%`);
  for (let i = n; i >= 0; i--) pts.push(`${(i / n) * 100}% ${100 - Math.max(0, j(i, 'b') + amp / 2)}%`);
  for (let i = n; i >= 0; i--) pts.push(`${Math.max(0, j(i, 'l') + amp / 2)}% ${(i / n) * 100}%`);
  return `polygon(${pts.join(',')})`;
};

/** Torn paper card: a white torn backing with a coloured torn face, soft shadow. */
const Paper: React.FC<{ seed: string; x: number; y: number; w: number; h: number; color: string; rot?: number; children?: React.ReactNode; style?: React.CSSProperties }> =
  ({ seed, x, y, w, h, color, rot = 0, children, style }) => (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg)`, filter: 'drop-shadow(0 10px 14px rgba(40,25,15,0.28))', ...style }}>
      <div style={{ position: 'absolute', inset: -10, background: '#FBF8F2', clipPath: torn(seed + 'w', 1.6) }} />
      <div style={{ position: 'absolute', inset: 0, background: color, clipPath: torn(seed, 1.4),
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1.5px), radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1.5px)',
        backgroundSize: '7px 7px, 11px 11px' }} />
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </div>
  );

/** A white-bordered sticker that pops in at `at` (frames, local). */
const Sticker: React.FC<{ at: number; x: number; y: number; size?: number; rot?: number; children: React.ReactNode; bg?: string }> =
  ({ at, x, y, size = 260, rot = 0, children, bg = '#FBF8F2' }) => {
    const f = useCurrentFrame();
    const p = spring({ frame: f - at, fps: FPS, config: { damping: 11, mass: 0.6 } });
    if (f < at) return null;
    return (
      <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size * 0.16, background: bg,
        border: '10px solid #FFFFFF', boxShadow: '0 12px 22px rgba(40,25,15,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${p}) rotate(${rot + (1 - p) * -14}deg)` }}>{children}</div>
    );
  };

/** Red map pin. */
const Pin: React.FC<{ x: number; y: number; on?: number }> = ({ x, y, on = 1 }) => (
  <div style={{ position: 'absolute', left: x - 13, top: y - 13, width: 26, height: 26, borderRadius: 99, opacity: on,
    background: `radial-gradient(circle at 35% 35%, #FF7A7A, ${CRIMSON} 60%, #7A1013)`, boxShadow: '0 4px 6px rgba(0,0,0,0.35)' }} />
);

/** Red string from a to b, drawn by progress. */
const String_: React.FC<{ a: [number, number]; b: [number, number]; p: number }> = ({ a, b, p }) => (
  <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    <path d={`M${a[0]} ${a[1]} Q ${(a[0] + b[0]) / 2} ${Math.max(a[1], b[1]) + 40} ${b[0]} ${b[1]}`} fill="none" stroke={CRIMSON} strokeWidth={4}
      pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
  </svg>
);

/** Torn white label with ink text and a red marker underline. */
const Label: React.FC<{ at: number; x: number; y: number; text: string; size?: number; rot?: number; under?: boolean }> = ({ at, x, y, text, size = 64, rot = -2, under = true }) => {
  const f = useCurrentFrame();
  const p = spring({ frame: f - at, fps: FPS, config: { damping: 13 } });
  const u = io(f, at + 8, at + 20);
  if (f < at) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, 0) rotate(${rot}deg) scale(${0.6 + 0.4 * p})`, opacity: p,
      filter: 'drop-shadow(0 8px 10px rgba(40,25,15,0.25))' }}>
      <div style={{ background: '#FBF8F2', clipPath: torn(text, 3), padding: `${size * 0.3}px ${size * 0.6}px`, fontFamily: SANS, fontWeight: 700, fontSize: size, color: INK, whiteSpace: 'nowrap', position: 'relative' }}>
        {text}
        {under && <div style={{ position: 'absolute', left: size * 0.5, bottom: size * 0.22, height: size * 0.16, width: `calc(${u * 100}% - ${size}px)`, background: CRIMSON, opacity: 0.9 }} />}
      </div>
    </div>
  );
};

const GraphPaper: React.FC = () => (
  <AbsoluteFill style={{ background: CREAM }}>
    <AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(120,100,80,0.10) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(120,100,80,0.10) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px' }} />
    <AbsoluteFill style={{ background: 'radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(90,70,50,0.18))' }} />
  </AbsoluteFill>
);

const Logo: React.FC = () => (
  <div style={{ position: 'absolute', right: 56, top: 70, width: 130, height: 130, border: '2.5px solid rgba(27,21,18,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(251,248,242,0.6)' }}>
    <Img src={staticFile('img/logo-clean.png')} style={{ width: 104, objectFit: 'contain' }} />
  </div>
);

/** Black caption chip at the bottom, like the reference. */
const Caption: React.FC = () => {
  const f = useCurrentFrame();
  const cue = CUES.find(([, s, e]) => f >= t(s) - 2 && f < t(e));
  if (!cue) return null;
  const p = spring({ frame: f - (t(cue[1]) - 2), fps: FPS, config: { damping: 15, mass: 0.5 } });
  const parts = cue[0].split(/(ع)/);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1480, display: 'flex', justifyContent: 'center', opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ maxWidth: 900, background: INK, color: '#FBF8F2', borderRadius: 18, padding: '18px 34px', fontFamily: SANS, fontWeight: 700, fontSize: 56, lineHeight: 1.2, textAlign: 'center',
        boxShadow: '0 10px 20px rgba(0,0,0,0.25)' }}>
        {parts.map((x, i) => x === 'ع' ? <span key={i} style={{ fontFamily: AR, color: GOLD_SOFT, fontSize: 66 }}>ع</span> : <React.Fragment key={i}>{x}</React.Fragment>)}
      </div>
    </div>
  );
};

/** Scene wrapper: the card slides in from the right and leaves to the left, like paper moved on a desk. */
const Slide: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const inP = spring({ frame: f, fps: FPS, config: { damping: 16, mass: 0.8 } });
  const outP = io(f, dur - 8, dur, 0, 1, (n) => n * n);
  return <AbsoluteFill style={{ transform: `translateX(${(1 - inP) * 1100 - outP * 1200}px) rotate(${(1 - inP) * 4 - outP * 3}deg)` }}>{children}</AbsoluteFill>;
};

/* ---------- 1. Hook: ع is not "a" ---------- */
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const x = io(f, t(4.0), t(4.4));
  return (
    <AbsoluteFill>
      <Paper seed="hook" x={70} y={300} w={940} h={900} color={TEAL_DEEP} rot={-1.5}>
        <Sticker at={6} x={210} y={420} size={280} rot={-6}><span style={{ fontFamily: AR, fontWeight: 700, fontSize: 230, color: CRIMSON, lineHeight: 1, marginTop: -30 }}>ع</span></Sticker>
        <Sticker at={t(2.7)} x={730} y={420} size={280} rot={5}><span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 220, color: INK, lineHeight: 1, marginTop: -30 }}>a</span></Sticker>
        <div style={{ position: 'absolute', left: 420, top: 360, fontFamily: SANS, fontWeight: 700, fontSize: 130, color: '#FBF8F2', opacity: io(f, t(3.2), t(3.5)) }}>=</div>
        <svg width={200} height={200} style={{ position: 'absolute', left: 370, top: 330, overflow: 'visible' }}>
          <path d="M20 20 L180 180" stroke={CRIMSON} strokeWidth={26} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - x} />
          <path d="M180 20 L20 180" stroke={CRIMSON} strokeWidth={26} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - io(f, t(4.3), t(4.7))} />
        </svg>
      </Paper>
      <Label at={t(4.7)} x={540} y={1060} text="Fix one letter · 1" size={58} />
    </AbsoluteFill>
  );
};

/* ---------- 2–3. The throat: a faceless silhouette, three pins ---------- */
const PTS = { top: [470, 640] as [number, number], mid: [478, 780] as [number, number], deep: [470, 920] as [number, number] };
const Silhouette: React.FC<{ buzz?: number; heavy?: number }> = ({ buzz = 0, heavy = 0 }) => {
  const f = useCurrentFrame();
  return (
    <>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        {/* head in profile facing right, neck, shoulders: plain silhouette, no face */}
        <path fill={INK} d="M300 420 C300 290 400 230 480 235 C580 240 640 320 640 410 L672 470 L640 485 L650 540 C650 580 620 595 580 590 L560 640
          L560 960 C700 980 820 1040 860 1180 L180 1180 C220 1040 320 980 400 960 L400 700 C330 650 300 540 300 420 Z" />
        <path d="M470 600 L478 780 L470 940" stroke={COPPER} strokeWidth={22} strokeLinecap="round" fill="none" opacity={0.85} />
      </svg>
      {buzz > 0 && [0, 1, 2].map((i) => {
        const k = (f / 9 + i / 3) % 1;
        return <div key={i} style={{ position: 'absolute', left: PTS.mid[0] - (40 + k * 120), top: PTS.mid[1] - (24 + k * 70), width: 2 * (40 + k * 120), height: 2 * (24 + k * 70),
          borderRadius: '50%', border: `5px solid ${GOLD}`, opacity: (1 - k) * buzz }} />;
      })}
      <div style={{ position: 'absolute', left: PTS.mid[0] - 30, top: PTS.mid[1] - 30, width: 60, height: 60, borderRadius: 99, background: GOLD,
        opacity: 0.4 + 0.6 * buzz, filter: 'blur(8px)', transform: `scale(${1 + 0.15 * Math.sin(f / 2.5) * buzz})` }} />
      {/* the heavy box the voice mentions */}
      {heavy > 0 && (
        <div style={{ position: 'absolute', left: 120, top: 1040 - heavy * 40, opacity: Math.min(1, heavy * 2) }}>
          <div style={{ width: 170, height: 130, background: COPPER, border: '8px solid #FFFFFF', borderRadius: 14, boxShadow: '0 10px 18px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 40, color: '#FBF8F2' }}>20 kg</div>
        </div>
      )}
    </>
  );
};
const ZoneTag: React.FC<{ at: number; y: number; title: string; ar: string; hot?: boolean; from: [number, number] }> = ({ at, y, title, ar, hot, from }) => {
  const f = useCurrentFrame();
  const p = io(f, at, at + 12);
  return (
    <>
      <Pin x={from[0]} y={from[1]} on={p} />
      <String_ a={from} b={[700, y + 60]} p={p} />
      <Sticker at={at + 4} x={850} y={y + 60} size={hot ? 270 : 210} rot={hot ? 3 : -3} bg={hot ? '#FFF6E2' : '#FBF8F2'}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: AR, fontWeight: 700, fontSize: hot ? 110 : 80, lineHeight: 1.1, color: hot ? CRIMSON : ESPRESSO }}>{ar}</div>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: hot ? 30 : 24, color: INK }}>{title}</div>
        </div>
      </Sticker>
    </>
  );
};
const Place: React.FC = () => {
  const local = (s: number) => t(s - S.place);
  return (
    <AbsoluteFill>
      <Paper seed="throat" x={60} y={210} w={960} h={1040} color={SAND} rot={1}>{null}</Paper>
      <AbsoluteFill><Silhouette /></AbsoluteFill>
      <ZoneTag at={local(7.6)} y={420} title="top" ar="غ خ" from={PTS.top} />
      <ZoneTag at={local(8.0)} y={700} title="middle" ar="ع ح" hot from={PTS.mid} />
      <ZoneTag at={local(8.4)} y={980} title="deepest" ar="ء هـ" from={PTS.deep} />
    </AbsoluteFill>
  );
};
const Buzz: React.FC = () => {
  const f = useCurrentFrame();
  const local = (s: number) => t(s - S.buzz);
  const buzz = io(f, local(13.6), local(15.4));
  const heavy = io(f, local(16.4), local(17.4));
  return (
    <AbsoluteFill>
      <Paper seed="buzz" x={60} y={210} w={960} h={1040} color={TEAL_DEEP} rot={-1}>{null}</Paper>
      <AbsoluteFill><Silhouette buzz={buzz} heavy={heavy} /></AbsoluteFill>
      <Label at={local(19.2)} x={790} y={460} text="buzz?" size={70} rot={4} />
      <Sticker at={local(20.7)} x={800} y={760} size={190} rot={6} bg={TEAL_DEEP}>
        <svg width={110} height={110} viewBox="0 0 100 100"><path d="M18 52 L42 74 L84 26" stroke="#FBF8F2" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round"
          pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - io(f, local(20.75), local(21.1))} /></svg>
      </Sticker>
    </AbsoluteFill>
  );
};

/* ---------- 4. Listen: أ vs ع ---------- */
const activeAt = (f: number, s: number, len = 0.9) => interpolate(f, [t(s) - 3, t(s), t(s + len), t(s + len) + 6], [0, 1, 1, 0], clamp);
const Wave: React.FC<{ on: number; x: number; y: number }> = ({ on, x, y }) => {
  const f = useCurrentFrame();
  return (
    <svg width={160} height={120} style={{ position: 'absolute', left: x, top: y, opacity: on }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const h = 20 + 70 * Math.abs(Math.sin(f / 3 + i * 1.3)) * on;
        return <rect key={i} x={10 + i * 30} y={60 - h / 2} width={16} height={h} rx={8} fill={CRIMSON} />;
      })}
    </svg>
  );
};
const Listen: React.FC = () => {
  const lf = useCurrentFrame();
  const f = lf + t(S.listen);
  const hamza = Math.max(activeAt(f, F1[0][1]), activeAt(f, F1[2][1]));
  const ain = Math.max(activeAt(f, F1[1][1]), activeAt(f, F1[3][1]));
  const card = (glyph: string, label: string, on: number, x: number, color: string, seed: string) => (
    <Paper seed={seed} x={x} y={430 + (1 - on) * 0} w={440} h={700} color={color} rot={x < 300 ? -2 : 2} style={{ transform: `rotate(${x < 300 ? -2 : 2}deg) scale(${1 + 0.06 * on})` }}>
      <div style={{ position: 'absolute', left: 50, top: 70, width: 340, height: 360, background: '#FBF8F2', border: '10px solid #fff', borderRadius: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 22px rgba(0,0,0,0.25)' }}>
        <span style={{ fontFamily: AR, fontWeight: 700, fontSize: 250, color: on > 0.5 ? CRIMSON : INK, lineHeight: 1, marginTop: -40 }}>{glyph}</span>
      </div>
      <div style={{ position: 'absolute', top: 470, width: '100%', textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 40, color: '#FBF8F2' }}>{label}</div>
      <Wave on={on} x={140} y={540} />
    </Paper>
  );
  return (
    <AbsoluteFill>
      <Label at={4} x={540} y={250} text="Listen" size={70} />
      {card('أَ', 'a clean stop', hamza, 70, ESPRESSO, 'la')}
      {card('عَ', 'squeezed, buzzing', ain, 570, TEAL_DEEP, 'lb')}
    </AbsoluteFill>
  );
};

/* ---------- 5. Your turn: عَ عِ عُ ---------- */
const You: React.FC = () => {
  const f = useCurrentFrame() + t(S.you);
  return (
    <AbsoluteFill>
      <Label at={4} x={540} y={250} text="Your turn" size={70} />
      <Paper seed="you" x={50} y={460} w={980} h={720} color={ESPRESSO} rot={-1}>{null}</Paper>
      {F2.map(([g, s], i) => {
        const act = activeAt(f, s, 0.6);
        const ring = io(f, t(s + 0.6), t(s + 1.9), 0, 1, (n) => n);
        const cx = 210 + i * 330;
        return (
          <React.Fragment key={i}>
            <Sticker at={10 + i * 5} x={cx} y={760} size={270} rot={[-5, 3, -2][i]} bg={act > 0.5 ? '#FFF6E2' : '#FBF8F2'}>
              <span style={{ fontFamily: AR, fontWeight: 700, fontSize: 190, color: act > 0.5 ? CRIMSON : INK, lineHeight: 1, marginTop: -26 }}>{g}</span>
            </Sticker>
            <svg width={120} height={120} style={{ position: 'absolute', left: cx - 60, top: 960, opacity: ring > 0 && ring < 1 ? 1 : 0 }}>
              <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(251,248,242,0.25)" strokeWidth="10" />
              <circle cx="60" cy="60" r="44" fill="none" stroke={GOLD} strokeWidth="10" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ring}
                transform="rotate(-90 60 60)" strokeLinecap="round" />
            </svg>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- 6. End: one letter at a time, pack your zaad ---------- */
const End: React.FC = () => {
  const f = useCurrentFrame();
  const local = (s: number) => t(s - S.end);
  const drop = spring({ frame: f - local(41.0), fps: FPS, config: { damping: 9, mass: 0.8 } });
  const tap = spring({ frame: f - local(44.4), fps: FPS, config: { damping: 12 } });
  return (
    <AbsoluteFill>
      <Label at={6} x={540} y={300} text="One letter at a time" size={72} />
      <Paper seed="end" x={190} y={560} w={700} h={620} color={TEAL_DEEP} rot={1.5}>
        <div style={{ position: 'absolute', left: 200, top: 120 + (1 - drop) * -500, opacity: Math.min(1, drop * 3), transform: `rotate(${(1 - drop) * 20}deg)` }}>
          <Img src={staticFile('img/zaad-bag.svg')} style={{ width: 300, filter: 'drop-shadow(0 0 0 #fff) drop-shadow(0 12px 16px rgba(0,0,0,0.35))' }} />
        </div>
        <div style={{ position: 'absolute', bottom: 70, width: '100%', textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 64, color: '#FBF8F2', opacity: io(f, local(41.3), local(41.8)) }}>
          Pack your zaad
        </div>
      </Paper>
      <div style={{ position: 'absolute', top: 1260, width: '100%', display: 'flex', justifyContent: 'center', opacity: tap, transform: `scale(${0.6 + 0.4 * tap}) rotate(-2deg)` }}>
        <div style={{ background: CRIMSON, color: '#FBF8F2', fontFamily: SANS, fontWeight: 700, fontSize: 52, padding: '18px 44px', borderRadius: 999, border: '8px solid #fff',
          boxShadow: '0 10px 18px rgba(0,0,0,0.3)' }}>Link in bio</div>
      </div>
    </AbsoluteFill>
  );
};

export const V2Ain: React.FC = () => {
  const seq = (from: number, to: number, el: React.ReactNode) => (
    <Sequence from={t(from)} durationInFrames={t(to) - t(from)}><Slide dur={t(to) - t(from)}>{el}</Slide></Sequence>
  );
  return (
    <AbsoluteFill>
      <GraphPaper />
      {seq(S.hook, S.place, <Hook />)}
      {seq(S.place, S.buzz, <Place />)}
      {seq(S.buzz, S.listen, <Buzz />)}
      {seq(S.listen, S.you, <Listen />)}
      {seq(S.you, S.end, <You />)}
      <Sequence from={t(S.end)}><Slide dur={99999}><End /></Slide></Sequence>
      <Logo />
      <Caption />
      <Audio src={staticFile('vo-v2.mp3')} />
      {/* restrained paper sounds, well under the voice; no music (RULES §1.6) */}
      {[S.place, S.buzz, S.listen, S.you, S.end].map((s) => <Sfx key={s} at={t(s) - 2} src="page.mp3" volume={0.22} />)}
      <Sfx at={t(4.05)} src="pen.mp3" volume={0.25} />
      <Sfx at={t(8.0)} src="pop.mp3" volume={0.2} />
      <Sfx at={t(20.75)} src="correct.mp3" volume={0.18} />
      <Sfx at={t(41.1)} src="thud.mp3" volume={0.25} />
      <Sfx at={t(44.4)} src="el/tap.mp3" volume={0.2} />
    </AbsoluteFill>
  );
};
