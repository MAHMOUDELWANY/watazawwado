import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { COPPER, CRIMSON, GOLD_SOFT, SANS, SERIF, TEAL_DEEP } from './kit';
import { AR, ESPRESSO, GraphPaper, INK, Label, Logo, Paper, SAND, WHITE } from './V2Ain';

/**
 * V6 · "Drifted? 5 small ways back (no lecture)" carousel, 7 slides at 1080×1350 (Content Calendar, 21 Nov 2026).
 * One frame = one slide: `npx remotion still src/index.ts V6Back out/v6/slide-N.png --frame=N-1`.
 * A friend talking to a friend: no rulings, no blame, no "must". A path of footprints runs through the slides.
 */
export const V6_SLIDES = 7;

const Frame: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <AbsoluteFill>
    <GraphPaper />
    {children}
    <div style={{ position: 'absolute', left: 64, top: 84, background: INK, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 30, borderRadius: 12, padding: '8px 18px' }}>
      {n} / {V6_SLIDES}
    </div>
    <Logo />
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 56, display: 'flex', justifyContent: 'center', gap: 12 }}>
      {Array.from({ length: V6_SLIDES }).map((_, i) => (
        <div key={i} style={{ width: i + 1 === n ? 40 : 14, height: 14, borderRadius: 7, background: i + 1 === n ? CRIMSON : 'rgba(27,21,18,0.2)' }} />
      ))}
    </div>
  </AbsoluteFill>
);

/** Paper footprints walking up the slide; `lit` of `total` are filled in. */
const Steps: React.FC<{ lit: number; total?: number; y?: number }> = ({ lit, total = 5, y = 260 }) => (
  <div style={{ position: 'absolute', left: 90, right: 90, top: y, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
    {Array.from({ length: total }).map((_, i) => (
      <svg key={i} width={120} height={170} viewBox="0 -20 120 170" style={{ transform: `translateY(${i % 2 ? -26 : 0}px) rotate(${i % 2 ? 10 : -10}deg)` }}>
        <path d="M60 18 C 88 18 98 52 94 82 C 90 112 80 138 58 138 C 36 138 28 112 28 82 C 26 52 34 18 60 18 Z"
          fill={i < lit ? [CRIMSON, COPPER, SAND, TEAL_DEEP, ESPRESSO][i] : 'rgba(27,21,18,0.08)'} stroke="#fff" strokeWidth={8} />
        {[[34, 4, 9], [52, -6, 10], [70, -6, 10], [86, 2, 9], [98, 14, 8]].map(([cx, cy, r], k) => (
          <circle key={k} cx={cx} cy={cy} r={r} fill={i < lit ? [CRIMSON, COPPER, SAND, TEAL_DEEP, ESPRESSO][i] : 'rgba(27,21,18,0.08)'} stroke="#fff" strokeWidth={5} />
        ))}
        {i < lit && <text x="60" y="96" textAnchor="middle" fontFamily="Georgia" fontWeight="700" fontSize="44" fill="#fff">{i + 1}</text>}
      </svg>
    ))}
  </div>
);

const Tip: React.FC<{ n: number; color: string; title: React.ReactNode; body: string; art: React.ReactNode }> = ({ n, color, title, body, art }) => (
  <Frame n={n + 1}>
    <Steps lit={n} />
    <Paper seed={'v6t' + n} x={80} y={470} w={920} h={340} color={color} rot={n % 2 ? 1.2 : -1.2}>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 34 }}>
        <div style={{ flex: '0 0 180px', display: 'flex', justifyContent: 'center' }}>{art}</div>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 64, lineHeight: 1.08, color: WHITE }}>{title}</div>
      </div>
    </Paper>
    <div style={{ position: 'absolute', left: 100, right: 100, top: 900, fontFamily: SANS, fontWeight: 500, fontSize: 50, color: '#453D34', lineHeight: 1.4 }}>{body}</div>
  </Frame>
);

const S1: React.FC = () => (
  <Frame n={1}>
    <Paper seed="v6s1" x={70} y={230} w={940} h={640} color={ESPRESSO} rot={-1.2}>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 90 }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 56, color: GOLD_SOFT }}>Drifted?</div>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 92, color: WHITE, lineHeight: 1.06, marginTop: 18 }}>
          You don’t need a lecture.<br />You need a <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>first step.</span>
        </div>
      </div>
    </Paper>
    <Steps lit={0} y={940} />
    <Label at={-100} x={540} y={1170} text="5 small ones, pick any →" size={40} />
  </Frame>
);

const art = {
  surah: (
    <svg width={170} height={130} viewBox="0 0 170 130"><path d="M85 24 C 60 8 28 8 8 16 V 118 C 28 110 60 110 85 124 Z" fill="#fff" />
      <path d="M85 24 C 110 8 142 8 162 16 V 118 C 142 110 110 110 85 124 Z" fill={GOLD_SOFT} />
      {[40, 60, 80].map((y) => <path key={y} d={`M24 ${y} H70 M100 ${y} H146`} stroke="rgba(27,21,18,0.35)" strokeWidth={6} strokeLinecap="round" />)}</svg>
  ),
  clock: (
    <svg width={160} height={160} viewBox="0 0 160 160"><circle cx="80" cy="80" r="66" fill="none" stroke="#fff" strokeWidth={12} />
      <path d="M80 80 L80 14 A66 66 0 0 1 137 47 Z" fill={GOLD_SOFT} /><path d="M80 80 V36 M80 80 L108 92" stroke="#fff" strokeWidth={10} strokeLinecap="round" /></svg>
  ),
  letter: <div style={{ fontFamily: AR, fontSize: 150, color: WHITE, lineHeight: 1 }}>ع</div>,
  ask: <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 170, color: WHITE, lineHeight: 1 }}>?</div>,
  friend: (
    <svg width={170} height={150} viewBox="0 0 170 150"><circle cx="55" cy="40" r="26" fill="#fff" /><path d="M10 150 C 14 96 34 80 55 80 C 76 80 96 96 100 150 Z" fill="#fff" />
      <circle cx="118" cy="46" r="24" fill={GOLD_SOFT} /><path d="M76 150 C 80 102 98 88 118 88 C 138 88 156 102 160 150 Z" fill={GOLD_SOFT} /></svg>
  ),
};

const S2 = () => <Tip n={1} color={CRIMSON} art={art.surah} title={<>One short surah you already <i>half</i>‑know.</>}
  body="The one you learned as a kid and lost halfway. Finish it this week, a few lines a day." />;
const S3 = () => <Tip n={2} color={COPPER} art={art.clock} title={<>Five minutes after one prayer.</>}
  body="Not every prayer. Just one. Stay sitting a little longer and read, or just make du‘a." />;
const S4 = () => <Tip n={3} color={TEAL_DEEP} art={art.letter} title={<>Fix one letter this week.</>}
  body="Pick the one that always slips: ع‎, ق‎ or ح‎. One letter is enough for a week." />;
const S5 = () => <Tip n={4} color={ESPRESSO} art={art.ask} title={<>Ask the question you were embarrassed to ask.</>}
  body="Everyone carries one. Asking it is part of learning, and nobody good will laugh." />;
const S6 = () => <Tip n={5} color={CRIMSON} art={art.friend} title={<>Learn with someone your age.</>}
  body="Coming back is easier when someone is walking the same way." />;

const S7: React.FC = () => (
  <Frame n={7}>
    <Steps lit={5} />
    <Paper seed="v6s7" x={70} y={470} w={940} h={520} color={TEAL_DEEP} rot={-1}>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 100, fontFamily: SERIF, fontWeight: 700, fontSize: 100, lineHeight: 1.06, color: WHITE }}>
        Start where <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>you are.</span>
      </div>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 340, fontFamily: SANS, fontWeight: 500, fontSize: 40, color: WHITE, opacity: 0.9 }}>One step counts. Pick one and save this.</div>
    </Paper>
    <Img src={staticFile('img/zaad-bag.svg')} style={{ position: 'absolute', right: 90, top: 900, width: 170, transform: 'rotate(8deg)', filter: 'drop-shadow(0 8px 10px rgba(40,25,15,0.3))' }} />
    <div style={{ position: 'absolute', left: 90, top: 1080, background: CRIMSON, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 46, padding: '18px 40px', borderRadius: 999,
      border: '8px solid #fff', boxShadow: '0 10px 18px rgba(0,0,0,0.25)' }}>Comment ZAAD for the link</div>
  </Frame>
);

export const V6Back: React.FC = () => {
  const f = useCurrentFrame();
  return [<S1 />, <S2 />, <S3 />, <S4 />, <S5 />, <S6 />, <S7 />][Math.min(f, 6)];
};
