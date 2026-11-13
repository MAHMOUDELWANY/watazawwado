import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { COPPER, CRIMSON, GOLD_SOFT, SANS, SERIF, TEAL_DEEP } from './kit';
import { ESPRESSO, GraphPaper, INK, Label, Logo, Paper, SAND, WHITE } from './V2Ain';

/**
 * V8 · "Why we're building Watazawwado", pinned carousel, 8 slides at 1080×1350 (Content Calendar, 23 Nov 2026).
 * One frame = one slide: `npx remotion still src/index.ts V8Why out/v8/slide-N.png --frame=N-1`.
 * The family is the hero, the academy speaks as "we". Promises use BRAND.md §3 honest wording; no prices.
 */
export const V8_SLIDES = 8;

const Frame: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <AbsoluteFill>
    <GraphPaper />
    {children}
    <div style={{ position: 'absolute', left: 64, top: 84, background: INK, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 30, borderRadius: 12, padding: '8px 18px' }}>
      {n} / {V8_SLIDES}
    </div>
    <Logo />
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 56, display: 'flex', justifyContent: 'center', gap: 12 }}>
      {Array.from({ length: V8_SLIDES }).map((_, i) => (
        <div key={i} style={{ width: i + 1 === n ? 40 : 14, height: 14, borderRadius: 7, background: i + 1 === n ? CRIMSON : 'rgba(27,21,18,0.2)' }} />
      ))}
    </div>
  </AbsoluteFill>
);

const Big: React.FC<{ top: number; children: React.ReactNode; size?: number; color?: string }> = ({ top, children, size = 84, color = INK }) => (
  <div style={{ position: 'absolute', left: 90, right: 90, top, fontFamily: SERIF, fontWeight: 700, fontSize: size, lineHeight: 1.08, color }}>{children}</div>
);
const Body: React.FC<{ top: number; children: React.ReactNode }> = ({ top, children }) => (
  <div style={{ position: 'absolute', left: 90, right: 90, top, fontFamily: SANS, fontWeight: 500, fontSize: 46, lineHeight: 1.4, color: '#453D34' }}>{children}</div>
);

/** A video-call tile; `swap` greys it and stamps a new question mark on it. */
const Tile: React.FC<{ x: number; y: number; w: number; label: string; grey?: boolean; rot?: number }> = ({ x, y, w, label, grey, rot = 0 }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: w * 0.75, borderRadius: 24, background: grey ? '#5A514A' : '#8C7D6E', border: '10px solid #fff',
    boxShadow: '0 12px 20px rgba(0,0,0,0.28)', overflow: 'hidden', transform: `rotate(${rot}deg)`, filter: grey ? 'grayscale(1)' : 'none' }}>
    <svg width="100%" height="100%" viewBox="0 0 400 300">
      <circle cx="200" cy="120" r="56" fill={INK} /><path d="M100 300 C 110 220 160 190 200 190 C 240 190 290 220 300 300 Z" fill={INK} />
      {grey && <text x="200" y="142" textAnchor="middle" fontFamily="Georgia" fontWeight="700" fontSize="70" fill="#8C8279">?</text>}
    </svg>
    <div style={{ position: 'absolute', left: 14, bottom: 12, background: 'rgba(0,0,0,0.55)', color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 24, borderRadius: 8, padding: '4px 12px' }}>{label}</div>
  </div>
);

const S1: React.FC = () => (
  <Frame n={1}>
    <div style={{ position: 'absolute', left: 90, top: 200, background: CRIMSON, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 34, borderRadius: 999, padding: '10px 26px', transform: 'rotate(-2deg)' }}>📌 Start here</div>
    <Paper seed="v8s1" x={70} y={300} w={940} h={640} color={ESPRESSO} rot={-1}>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 90, fontFamily: SERIF, fontWeight: 700, fontSize: 104, lineHeight: 1.04, color: WHITE }}>
        Why we’re building <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>Watazawwado</span>
      </div>
      <div style={{ position: 'absolute', left: 70, right: 70, bottom: 80, fontFamily: SANS, fontWeight: 500, fontSize: 42, color: WHITE, opacity: 0.9 }}>Not just lessons. A mentor who stays.</div>
    </Paper>
    <Img src={staticFile('img/zaad-bag.svg')} style={{ position: 'absolute', right: 100, top: 1000, width: 170, transform: 'rotate(8deg)', filter: 'drop-shadow(0 8px 10px rgba(40,25,15,0.3))' }} />
    <Label at={-100} x={360} y={1120} text="The short story, swipe →" size={40} />
  </Frame>
);

const S2: React.FC = () => (
  <Frame n={2}>
    <Big top={230}>We kept hearing the same <span style={{ color: CRIMSON, fontStyle: 'italic' }}>two stories</span> from parents.</Big>
    <Paper seed="v8s2a" x={110} y={640} w={400} h={420} color={SAND} rot={-3}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 230, color: WHITE }}>1</div>
    </Paper>
    <Paper seed="v8s2b" x={570} y={680} w={400} h={420} color={TEAL_DEEP} rot={3}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 230, color: WHITE }}>2</div>
    </Paper>
  </Frame>
);

const S3: React.FC = () => (
  <Frame n={3}>
    <Paper seed="v8s3" x={70} y={220} w={940} h={560} color={SAND} rot={1}>{null}</Paper>
    <Tile x={130} y={280} w={380} label="Teacher · Sept" rot={-3} />
    <Tile x={560} y={330} w={380} label="Teacher · Nov" grey rot={3} />
    <div style={{ position: 'absolute', left: 470, top: 470, fontFamily: SERIF, fontWeight: 700, fontSize: 110, color: CRIMSON }}>→</div>
    <Big top={850} size={72}>The teacher changed, and nobody asked them.</Big>
    <Body top={1040}>Their child started over with someone new. Again.</Body>
  </Frame>
);

const S4: React.FC = () => (
  <Frame n={4}>
    <Paper seed="v8s4" x={70} y={220} w={940} h={560} color={TEAL_DEEP} rot={-1}>
      <div style={{ position: 'absolute', left: 300, top: 50, width: 340, height: 460, borderRadius: 50, background: INK, padding: 16, transform: 'rotate(-4deg)' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 36, background: '#FAF7F2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, color: '#8C8279' }}>No new messages</div>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 90, color: 'rgba(27,21,18,0.2)' }}>…</div>
        </div>
      </div>
    </Paper>
    <Big top={850} size={72}>They never knew what happened in class.</Big>
    <Body top={1040}>Was it a good lesson? They had to ask, every time.</Body>
  </Frame>
);

const S5: React.FC = () => (
  <Frame n={5}>
    <Paper seed="v8s5" x={70} y={300} w={940} h={620} color={CRIMSON} rot={-1}>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 120, fontFamily: SERIF, fontWeight: 700, fontSize: 100, lineHeight: 1.06, color: WHITE }}>
        Nobody should learn their deen from a <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>stranger.</span>
      </div>
    </Paper>
    <Body top={1010}>So we built an academy around the relationship.</Body>
  </Frame>
);

const PROMISES = [
  { k: '1', t: 'You choose the teacher', b: 'from a real profile, before the first class.', c: CRIMSON },
  { k: '2', t: 'We never change your teacher on our side', b: 'and a teacher who leaves gives two months’ notice.', c: COPPER },
  { k: '3', t: 'A report after every class', b: 'what they learned and what comes next.', c: SAND },
  { k: '4', t: 'We message you first', b: 'before you have to ask.', c: TEAL_DEEP },
];
const S6: React.FC = () => (
  <Frame n={6}>
    <Big top={200} size={76}>What we do instead</Big>
    {PROMISES.map((p, i) => (
      <div key={p.k} style={{ position: 'absolute', left: 90, right: 90, top: 330 + i * 245, display: 'flex', gap: 28, alignItems: 'flex-start', transform: `rotate(${i % 2 ? 0.6 : -0.6}deg)` }}>
        <div style={{ flex: '0 0 92px', height: 92, borderRadius: 99, background: p.c, border: '7px solid #fff', boxShadow: '0 8px 14px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 52, color: WHITE }}>{p.k}</div>
        <div>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 48, color: INK, lineHeight: 1.1 }}>{p.t}</div>
          <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 36, color: '#453D34', marginTop: 8 }}>{p.b}</div>
        </div>
      </div>
    ))}
  </Frame>
);

const S7: React.FC = () => (
  <Frame n={7}>
    <Big top={220}>We open in <span style={{ color: CRIMSON, fontStyle: 'italic' }}>small waves.</span></Big>
    <div style={{ position: 'absolute', left: 110, right: 110, top: 470, display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 14 }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <svg key={i} viewBox="0 0 40 52" width="100%"><circle cx="20" cy="13" r="11" fill={i % 3 === 0 ? CRIMSON : i % 3 === 1 ? TEAL_DEEP : SAND} />
          <path d="M3 52 C 4 34 12 27 20 27 C 28 27 36 34 37 52 Z" fill={i % 3 === 0 ? CRIMSON : i % 3 === 1 ? TEAL_DEEP : SAND} /></svg>
      ))}
    </div>
    <Body top={700}>The first wave is 20 learners, so every family gets our full attention.</Body>
    <Body top={900}>Ustadh Mahmoud, our founder, teaches too, and every teacher here works the same way.</Body>
  </Frame>
);

const S8: React.FC = () => (
  <Frame n={8}>
    <Paper seed="v8s8" x={70} y={260} w={940} h={520} color={TEAL_DEEP} rot={-1}>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 110, fontFamily: SERIF, fontWeight: 700, fontSize: 100, lineHeight: 1.06, color: WHITE }}>
        Want a place in the <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>first wave?</span>
      </div>
    </Paper>
    <Img src={staticFile('img/zaad-bag.svg')} style={{ position: 'absolute', left: 415, top: 820, width: 250, filter: 'drop-shadow(0 10px 14px rgba(40,25,15,0.3))' }} />
    <div style={{ position: 'absolute', top: 1060, width: '100%', textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 60, color: INK }}>Pack your zaad</div>
    <div style={{ position: 'absolute', top: 1150, width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: CRIMSON, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 42, padding: '14px 36px', borderRadius: 999, border: '8px solid #fff', boxShadow: '0 10px 18px rgba(0,0,0,0.25)' }}>Comment ZAAD to join the waitlist</div>
    </div>
  </Frame>
);

export const V8Why: React.FC = () => {
  const f = useCurrentFrame();
  return [<S1 />, <S2 />, <S3 />, <S4 />, <S5 />, <S6 />, <S7 />, <S8 />][Math.min(f, 7)];
};
