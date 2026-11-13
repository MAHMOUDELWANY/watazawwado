import React from 'react';
import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import { COPPER, CRIMSON, FPS, GOLD, GOLD_SOFT, SANS, SERIF, Sfx, TEAL_DEEP, clamp, io } from './kit';
import { AR, BigCard, ESPRESSO, GraphPaper, INK, Label, Logo, Paper, SAND, WHITE } from './V2Ain';

/**
 * V5 · "3 words your kids hear at every meal" (Content Calendar, 20 Nov 2026). Voiced by the owner's own recording
 * (public/vo-v5.mp3); SC holds the scene starts in seconds and is retimed to the recording's word timings.
 * Retention method: a moment (dinner) → the gap (they say it, do they know it?) → three words, each tied to a
 * moment at the table → one thing to do tonight.
 */
export const V5_TOTAL = Math.round(33 * FPS);
const t = (s: number) => Math.round(s * FPS);
export const SC = { hook: 0, w1: 4.2, w2: 11.5, w3: 17.8, recap: 25.0, end: 29.0 };

const WORDS = [
  { ar: 'بِسْمِ اللهِ', tr: 'Bismillah', mean: 'In the name of Allah', when: 'Before the first bite', color: CRIMSON },
  { ar: 'الْحَمْدُ لِلهِ', tr: 'Alhamdulillah', mean: 'All praise is for Allah', when: 'When the plate is empty', color: TEAL_DEEP },
  { ar: 'جَزَاكَ اللهُ خَيْرًا', tr: 'JazakAllahu khayran', mean: 'May Allah reward you with good', when: 'To whoever made dinner', color: COPPER },
];

/** Progress ribbon around the frame; shared by the motion videos after V4. */
export const Border: React.FC<{ total: number }> = ({ total }) => {
  const f = useCurrentFrame();
  const p = Math.min(1, f / (total - 1));
  const m = 14, r = 44;
  const d = `M 540 ${m} H ${1080 - m - r} A ${r} ${r} 0 0 1 ${1080 - m} ${m + r} V ${1920 - m - r} A ${r} ${r} 0 0 1 ${1080 - m - r} ${1920 - m}
    H ${m + r} A ${r} ${r} 0 0 1 ${m} ${1920 - m - r} V ${m + r} A ${r} ${r} 0 0 1 ${m + r} ${m} H 540`;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs><linearGradient id="prog5" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={CRIMSON} /><stop offset="0.4" stopColor={COPPER} /><stop offset="0.7" stopColor={GOLD} /><stop offset="1" stopColor={TEAL_DEEP} /></linearGradient></defs>
      <path d={d} fill="none" stroke="rgba(27,21,18,0.10)" strokeWidth={10} />
      <path d={d} fill="none" stroke="url(#prog5)" strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
    </svg>
  );
};

export const Slide: React.FC<{ dur: number; children: React.ReactNode; from?: 1 | -1 }> = ({ dur, children, from = 1 }) => {
  const f = useCurrentFrame();
  const inP = spring({ frame: f, fps: FPS, config: { damping: 15, mass: 0.7 } });
  const outP = io(f, dur - 7, dur, 0, 1, (n) => n * n);
  return <AbsoluteFill style={{ transform: `translateX(${from * (1 - inP) * 1100 - outP * 1200 * from}px) rotate(${(1 - inP) * 4 * from - outP * 3}deg) scale(${1 + (f / Math.max(dur, 1)) * 0.05})` }}>{children}</AbsoluteFill>;
};

/** A paper plate seen from above; `food` 1 = full, 0 = empty. */
export const Plate: React.FC<{ x: number; y: number; r?: number; food?: number; rot?: number }> = ({ x, y, r = 170, food = 1, rot = 0 }) => (
  <svg width={r * 2 + 40} height={r * 2 + 40} viewBox={`-20 -20 ${r * 2 + 40} ${r * 2 + 40}`} style={{ position: 'absolute', left: x - r - 20, top: y - r - 20, transform: `rotate(${rot}deg)`, overflow: 'visible' }}>
    <circle cx={r} cy={r + 10} r={r} fill="rgba(40,25,15,0.25)" />
    <circle cx={r} cy={r} r={r} fill="#fff" />
    <circle cx={r} cy={r} r={r * 0.74} fill="#F3EEE6" />
    <g opacity={food} transform={`translate(${r} ${r}) scale(${0.6 + 0.4 * food}) translate(${-r} ${-r})`}>
      <ellipse cx={r - 30} cy={r - 10} rx={r * 0.42} ry={r * 0.34} fill={SAND} />
      <circle cx={r + 50} cy={r + 30} r={r * 0.2} fill={CRIMSON} />
      <circle cx={r - 10} cy={r + 55} r={r * 0.14} fill={TEAL_DEEP} />
      <circle cx={r + 40} cy={r - 50} r={r * 0.11} fill={COPPER} />
    </g>
    {food < 0.3 && <path d={`M ${r - 60} ${r + 20} q 30 -18 60 0 t 60 0`} stroke="rgba(27,21,18,0.18)" strokeWidth={8} fill="none" strokeLinecap="round" />}
  </svg>
);

/** A cut-out hand holding a fork, sliding in from the right. */
const ForkHand: React.FC<{ p: number; x: number; y: number; rot?: number }> = ({ p, x, y, rot = -20 }) => (
  <svg width={520} height={260} viewBox="0 0 520 260" style={{ position: 'absolute', left: x + (1 - p) * 700, top: y, transform: `rotate(${rot}deg)`, filter: 'drop-shadow(0 10px 10px rgba(40,25,15,0.3))' }}>
    <g stroke="#fff" strokeWidth={10} strokeLinejoin="round" paintOrder="stroke">
      <rect x="20" y="118" width="240" height="20" rx="10" fill="#B9B3AA" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x="0" y={100 + i * 12} width="60" height="7" rx="3.5" fill="#B9B3AA" />)}
      <path d="M240 96 C 270 80 330 78 380 90 L 520 96 L 520 186 L 380 192 C 330 200 280 196 250 172 C 236 160 232 112 240 96 Z" fill="#D99A78" />
      <path d="M262 112 C 290 104 320 104 344 112" stroke="#A8634A" strokeWidth={5} fill="none" />
      <path d="M258 150 C 288 144 318 146 340 154" stroke="#A8634A" strokeWidth={5} fill="none" />
    </g>
  </svg>
);

/** A cooking pot with paper steam. */
const Pot: React.FC<{ x: number; y: number; steam: number }> = ({ x, y, steam }) => (
  <svg width={420} height={420} viewBox="0 0 420 420" style={{ position: 'absolute', left: x, top: y, overflow: 'visible', filter: 'drop-shadow(0 12px 12px rgba(40,25,15,0.3))' }}>
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M ${140 + i * 70} 150 c -30 -40 30 -60 0 -100`} stroke="#fff" strokeWidth={16} strokeLinecap="round" fill="none"
        opacity={0.85 * steam} transform={`translate(0 ${-((steam * 40 + i * 13) % 30)})`} />
    ))}
    <rect x="40" y="170" width="340" height="40" rx="20" fill={ESPRESSO} stroke="#fff" strokeWidth={10} />
    <path d="M60 205 H360 V330 Q360 380 310 380 H110 Q60 380 60 330 Z" fill={CRIMSON} stroke="#fff" strokeWidth={10} />
    <rect x="10" y="230" width="60" height="26" rx="13" fill={ESPRESSO} stroke="#fff" strokeWidth={8} />
    <rect x="350" y="230" width="60" height="26" rx="13" fill={ESPRESSO} stroke="#fff" strokeWidth={8} />
  </svg>
);

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const bubble = (i: number, x: number, y: number) => {
    const s = spring({ frame: f - 14 - i * 8, fps: FPS, config: { damping: 9 } });
    const known = io(f, t(2.6), t(3.0));
    return (
      <div key={i} style={{ position: 'absolute', left: x, top: y, transform: `scale(${s}) rotate(${[-4, 3, -2][i]}deg)` }}>
        <div style={{ background: WHITE, border: `6px solid ${INK}`, borderRadius: 34, padding: '14px 28px', fontFamily: AR, fontSize: 54, color: INK, boxShadow: '0 10px 16px rgba(40,25,15,0.25)', whiteSpace: 'nowrap' }}>
          {WORDS[i].ar}
        </div>
        <div style={{ position: 'absolute', right: -24, top: -28, width: 66, height: 66, borderRadius: 99, background: CRIMSON, border: '6px solid #fff', color: WHITE,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 42, transform: `scale(${known})` }}>?</div>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <Paper seed="v5table" x={40} y={680} w={1000} h={860} color="#B7794C" rot={-1}>{null}</Paper>
      <Plate x={300} y={940} r={150} rot={10} />
      <Plate x={770} y={1020} r={150} rot={-20} />
      <Plate x={520} y={1340} r={150} />
      {bubble(0, 110, 720)}
      {bubble(1, 560, 820)}
      {bubble(2, 250, 1170)}
      <div style={{ position: 'absolute', left: 90, right: 90, top: 210, textAlign: 'center' }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 60, color: INK, opacity: io(f, 0, 8) }}>Your kids already say these at dinner.</div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 92, color: CRIMSON, marginTop: 14, transform: `scale(${spring({ frame: f - t(2.4), fps: FPS, config: { damping: 9 } })})` }}>Do they know what they mean?</div>
      </div>
    </AbsoluteFill>
  );
};

const Word: React.FC<{ i: number; dur: number }> = ({ i, dur }) => {
  const f = useCurrentFrame();
  const w = WORDS[i];
  const card = spring({ frame: f - 4, fps: FPS, config: { damping: 12 } });
  const scene = spring({ frame: f - 10, fps: FPS, config: { damping: 14 } });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 80, top: 180, background: INK, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 40, borderRadius: 14, padding: '10px 24px' }}>{i + 1} / 3</div>
      <div style={{ position: 'absolute', left: 80, top: 270, fontFamily: SANS, fontWeight: 700, fontSize: 52, color: INK, opacity: io(f, 2, 10) }}>{w.when}</div>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `translateY(${(1 - card) * -500}px) rotate(${(1 - card) * -6}deg)` }}>
        <Paper seed={'v5w' + i} x={70} y={380} w={940} h={470} color={w.color} rot={i % 2 ? 1.2 : -1.2}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: AR, fontSize: i === 2 ? 128 : 160, color: WHITE, lineHeight: 1.3, direction: 'rtl' }}>{w.ar}</div>
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 62, color: GOLD_SOFT, opacity: io(f, t(1.0), t(1.4)) }}>{w.tr}</div>
          </div>
        </Paper>
      </div>
      <Label at={t(2.2)} x={540} y={930} text={`“${w.mean}”`} size={56} rot={-1.5} />
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `translateY(${(1 - scene) * 700}px)` }}>
        <Paper seed={'v5s' + i} x={110} y={1080} w={860} h={560} color={SAND} rot={i % 2 ? -1 : 1}>{null}</Paper>
        {i === 0 && <><Plate x={540} y={1360} r={190} /><ForkHand p={io(f, t(1.6), t(2.4))} x={480} y={1210} /></>}
        {i === 1 && <Plate x={540} y={1360} r={190} food={interpolate(f, [t(1.2), t(3.2)], [1, 0], clamp)} />}
        {i === 2 && <Pot x={330} y={1150} steam={Math.min(1, f / 20)} />}
      </div>
    </AbsoluteFill>
  );
};

const Recap: React.FC = () => {
  const f = useCurrentFrame();
  const bag = spring({ frame: f - 4, fps: FPS, config: { damping: 12 } });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 240, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 96, color: INK, lineHeight: 1.1 }}>
        Three words.<br /><span style={{ color: CRIMSON, fontStyle: 'italic' }}>Three meals a day.</span>
      </div>
      {WORDS.map((w, i) => {
        const fly = io(f, 18 + i * 12, 40 + i * 12);
        const x = interpolate(fly, [0, 1], [140 + i * 300, 470]);
        const y = interpolate(fly, [0, 1], [700, 1180]) - Math.sin(fly * Math.PI) * 240;
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, transform: `scale(${1 - fly * 0.6}) rotate(${fly * 30}deg)`, opacity: 1 - io(f, 38 + i * 12, 42 + i * 12),
            background: w.color, color: WHITE, border: '7px solid #fff', borderRadius: 26, padding: '10px 22px', fontFamily: AR, fontSize: 46, whiteSpace: 'nowrap', boxShadow: '0 10px 16px rgba(0,0,0,0.25)' }}>{w.ar}</div>
        );
      })}
      <div style={{ position: 'absolute', left: 390, top: 1100, width: 300, transform: `scale(${bag * (1 + 0.06 * Math.sin(f / 3) * io(f, 40, 70, 1, 0))})` }}>
        <Img src={staticFile('img/zaad-bag.svg')} style={{ width: 300, filter: 'drop-shadow(0 12px 16px rgba(0,0,0,0.3))' }} />
      </div>
    </AbsoluteFill>
  );
};

const End: React.FC = () => {
  const f = useCurrentFrame();
  const bag = spring({ frame: f - 24, fps: FPS, config: { damping: 9 } });
  const zip = io(f, 40, 56);
  return (
    <AbsoluteFill>
      <Paper seed="v5end" x={70} y={300} w={940} h={520} color={TEAL_DEEP} rot={-1}>
        <div style={{ position: 'absolute', left: 70, right: 70, top: 110, fontFamily: SERIF, fontWeight: 700, fontSize: 84, lineHeight: 1.1, color: WHITE }}>
          Say one at dinner tonight, and tell them <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>what it means.</span>
        </div>
      </Paper>
      <div style={{ position: 'absolute', left: 390, top: 900, width: 300, transform: `scale(${bag}) translateY(${(1 - bag) * -300}px)` }}>
        <Img src={staticFile('img/zaad-bag.svg')} style={{ width: 300, filter: 'drop-shadow(0 12px 16px rgba(0,0,0,0.3))' }} />
        <svg width={300} height={272} viewBox="0 0 210 190" style={{ position: 'absolute', left: 0, top: 0 }}>
          {zip > 0 && <path d={`M40 80 H${40 + 130 * zip}`} stroke={GOLD_SOFT} strokeWidth={9} strokeLinecap="round" strokeDasharray="10 7" />}
        </svg>
      </div>
      <div style={{ position: 'absolute', top: 1230, width: '100%', textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 70, color: INK, opacity: io(f, 32, 42) }}>Pack your zaad</div>
      <div style={{ position: 'absolute', top: 1340, width: '100%', display: 'flex', justifyContent: 'center', opacity: io(f, 50, 60) }}>
        <div style={{ background: CRIMSON, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 48, padding: '16px 42px', borderRadius: 999, border: '8px solid #fff', boxShadow: '0 10px 18px rgba(0,0,0,0.3)' }}>Link in bio</div>
      </div>
    </AbsoluteFill>
  );
};

export const V5Meal: React.FC = () => {
  const seq = (a: number, b: number, el: React.ReactNode, from: 1 | -1 = 1) => (
    <Sequence from={t(a)} durationInFrames={t(b) - t(a)}><Slide dur={t(b) - t(a)} from={from}>{el}</Slide></Sequence>
  );
  const cuts = [SC.w1, SC.w2, SC.w3, SC.recap, SC.end];
  return (
    <AbsoluteFill>
      <GraphPaper />
      {seq(SC.hook, SC.w1, <Hook />)}
      {seq(SC.w1, SC.w2, <Word i={0} dur={t(SC.w2 - SC.w1)} />, -1)}
      {seq(SC.w2, SC.w3, <Word i={1} dur={t(SC.w3 - SC.w2)} />)}
      {seq(SC.w3, SC.recap, <Word i={2} dur={t(SC.recap - SC.w3)} />, -1)}
      {seq(SC.recap, SC.end, <Recap />)}
      <Sequence from={t(SC.end)}><Slide dur={99999} from={-1}><End /></Slide></Sequence>
      <Border total={V5_TOTAL} />
      <Logo />
      {/* VO: the owner's recording goes in here once it arrives: <Audio src={staticFile('vo-v5.mp3')} /> */}
      {cuts.map((s) => <Sfx key={s} at={t(s) - 3} src="paper/slide.mp3" volume={0.35} />)}
      {[0, 1, 2].map((i) => <Sfx key={'p' + i} at={14 + i * 8} src="wv/pop-hand.wav" volume={0.3} />)}
      {[SC.w1, SC.w2, SC.w3].map((s) => <Sfx key={'s' + s} at={t(s) + 4} src="paper/slap-s.mp3" volume={0.3} />)}
      {[SC.w1, SC.w2, SC.w3].map((s) => <Sfx key={'m' + s} at={t(s + 2.2)} src="paper/marker-s.mp3" volume={0.3} />)}
      <Sfx at={t(SC.end) + 24} src="wv/pop-hand.wav" volume={0.3} />
      <Sfx at={t(SC.end) + 40} src="paper/marker-s.mp3" volume={0.3} />
    </AbsoluteFill>
  );
};
