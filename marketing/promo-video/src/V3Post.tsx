import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { CRIMSON, GOLD_SOFT, SANS, SERIF, TEAL_DEEP } from './kit';
import { AR, ESPRESSO, GraphPaper, INK, Label, Logo, Paper, SAND, WHITE } from './V2Ain';

/**
 * V3 · "Who's teaching your child?" carousel, 5 slides at 1080×1350 (Content Calendar, 18 Nov 2026).
 * One frame = one slide: `npx remotion still src/index.ts V3Post out/v3/slide-N.png --frame=N-1`.
 * Paper cut-out house look; the empty name tag opens the loop on slide 1 and closes it on slide 5.
 */
export const V3_SLIDES = 5;

const Frame: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <AbsoluteFill>
    <GraphPaper />
    {children}
    <div style={{ position: 'absolute', left: 64, top: 84, background: INK, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 30, borderRadius: 12, padding: '8px 18px' }}>
      {n} / {V3_SLIDES}
    </div>
    <Logo />
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 56, display: 'flex', justifyContent: 'center', gap: 12 }}>
      {Array.from({ length: V3_SLIDES }).map((_, i) => (
        <div key={i} style={{ width: i + 1 === n ? 40 : 14, height: 14, borderRadius: 7, background: i + 1 === n ? CRIMSON : 'rgba(27,21,18,0.2)' }} />
      ))}
    </div>
  </AbsoluteFill>
);

/** "Hello, my name is ___" sticker. */
const NameTag: React.FC<{ x: number; y: number; rot?: number; name?: string; scale?: number }> = ({ x, y, rot = -4, name, scale = 1 }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: 560, transform: `rotate(${rot}deg) scale(${scale})`, transformOrigin: 'center',
    borderRadius: 28, overflow: 'hidden', border: '10px solid #fff', boxShadow: '0 14px 24px rgba(40,25,15,0.3)', background: WHITE }}>
    <div style={{ background: CRIMSON, color: WHITE, textAlign: 'center', padding: '20px 0 14px' }}>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 64, letterSpacing: 4 }}>HELLO</div>
      <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 30 }}>my name is</div>
    </div>
    <div style={{ height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {name
        ? <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 84, color: INK }}>{name}</span>
        : <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 120, color: 'rgba(27,21,18,0.18)' }}>?</span>}
      <div style={{ position: 'absolute', left: 50, right: 50, bottom: 46, height: 4, background: 'rgba(27,21,18,0.25)' }} />
    </div>
  </div>
);

const Head: React.FC<{ k: string; title: string; body: string; top?: number }> = ({ k, title, body, top = 760 }) => (
  <div style={{ position: 'absolute', left: 90, right: 90, top }}>
    <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 150, color: CRIMSON, lineHeight: 0.9 }}>{k}</div>
    <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 74, color: INK, lineHeight: 1.08, marginTop: 10 }}>{title}</div>
    <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 40, color: '#453D34', lineHeight: 1.35, marginTop: 22 }}>{body}</div>
  </div>
);

const S1: React.FC = () => (
  <Frame n={1}>
    <Paper seed="v3s1" x={70} y={230} w={940} h={620} color={TEAL_DEEP} rot={-1.5}>{null}</Paper>
    <NameTag x={260} y={270} />
    <div style={{ position: 'absolute', left: 90, right: 90, top: 880 }}>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44, color: CRIMSON }}>Quick question.</div>
      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 68, color: INK, lineHeight: 1.1, marginTop: 12 }}>
        What’s the name of the person teaching your child the Quran?
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 36, color: '#453D34', marginTop: 26 }}>3 things worth knowing about them →</div>
    </div>
  </Frame>
);

const S2: React.FC = () => (
  <Frame n={2}>
    <Paper seed="v3s2" x={140} y={230} w={800} h={500} color={SAND} rot={1.5}>
      {/* an ID card: faceless silhouette and lines */}
      <div style={{ position: 'absolute', left: 120, top: 90, width: 560, height: 320, background: WHITE, border: '10px solid #fff', borderRadius: 26,
        boxShadow: '0 12px 22px rgba(40,25,15,0.3)', transform: 'rotate(-3deg)' }}>
        <svg width={170} height={210} viewBox="0 0 170 210" style={{ position: 'absolute', left: 36, top: 44 }}>
          <rect x="0" y="0" width="170" height="210" rx="18" fill="#E8E1D4" />
          <circle cx="85" cy="78" r="42" fill={INK} />
          <path d="M20 210 C 25 150 60 128 85 128 C 110 128 145 150 150 210 Z" fill={INK} />
        </svg>
        {[60, 110, 160, 210].map((y, i) => <div key={i} style={{ position: 'absolute', left: 250, top: y, height: 18, width: [230, 190, 210, 150][i], borderRadius: 9,
          background: i === 0 ? CRIMSON : 'rgba(27,21,18,0.18)' }} />)}
      </div>
    </Paper>
    <Head k="1" title="Their name, and their story" body="Not “a teacher from our team”. A person: where they learned, who taught them, and why they teach." />
  </Frame>
);

const Bubble: React.FC<{ x: number; y: number; text: string; good: boolean; rot: number }> = ({ x, y, text, good, rot }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg)`, filter: good ? 'none' : 'grayscale(1)', opacity: good ? 1 : 0.85 }}>
    <div style={{ background: good ? WHITE : '#DDD6CA', border: `6px solid ${INK}`, borderRadius: 36, padding: '22px 34px', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700,
      fontSize: 50, color: INK, maxWidth: 620, boxShadow: '0 10px 18px rgba(40,25,15,0.25)' }}>{text}</div>
    <div style={{ position: 'absolute', right: -26, top: -26, width: 70, height: 70, borderRadius: 99, background: good ? TEAL_DEEP : CRIMSON, border: '6px solid #fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 40 }}>{good ? '✓' : '✕'}</div>
  </div>
);
const S3: React.FC = () => (
  <Frame n={3}>
    <Paper seed="v3s3" x={70} y={230} w={940} h={520} color={ESPRESSO} rot={-1}>{null}</Paper>
    <Bubble x={130} y={270} text="“No. Again.”" good={false} rot={-3} />
    <Bubble x={300} y={470} text="“Very close. Once more, together.”" good rot={2} />
    <Head k="2" title="How they correct a mistake" body="Gently, again and again? Or with a sigh? Children remember how a correction felt long after the lesson." />
  </Frame>
);

const S4: React.FC = () => (
  <Frame n={4}>
    <Paper seed="v3s4" x={140} y={230} w={800} h={500} color={TEAL_DEEP} rot={1}>
      {/* six month pages, the same name tag on each */}
      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => (
        <div key={m} style={{ position: 'absolute', left: 60 + (i % 3) * 230, top: 50 + Math.floor(i / 3) * 210, width: 200, height: 180, background: WHITE, borderRadius: 16,
          border: '7px solid #fff', boxShadow: '0 8px 14px rgba(0,0,0,0.25)', transform: `rotate(${[-3, 2, -1, 3, -2, 1][i]}deg)`, overflow: 'hidden' }}>
          <div style={{ background: CRIMSON, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 30, textAlign: 'center', padding: '6px 0' }}>{m}</div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 34, lineHeight: 1.05, color: INK, textAlign: 'center', marginTop: 22, }}>same<br />teacher</div>
        </div>
      ))}
    </Paper>
    <Head k="3" title="Will they still be there in six months?" body="Every new teacher starts from zero: your child’s name, their pace, what they love." />
  </Frame>
);

const S5: React.FC = () => (
  <Frame n={5}>
    <Paper seed="v3s5" x={70} y={230} w={940} h={600} color={CRIMSON} rot={-1}>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 120, fontFamily: SERIF, fontWeight: 700, fontSize: 92, lineHeight: 1.08, color: WHITE }}>
        Nobody should learn their deen from a <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>stranger.</span>
      </div>
    </Paper>
    <NameTag x={260} y={760} rot={3} scale={0.82} />
    <Label at={-100} x={540} y={1150} text="Can you fill in the name tag? Tell us below." size={38} />
    <Img src={staticFile('img/zaad-bag.svg')} style={{ position: 'absolute', right: 70, top: 690, width: 150, transform: 'rotate(8deg)', filter: 'drop-shadow(0 8px 10px rgba(40,25,15,0.3))' }} />
  </Frame>
);

export const V3Post: React.FC = () => {
  const f = useCurrentFrame();
  return [<S1 />, <S2 />, <S3 />, <S4 />, <S5 />][Math.min(f, 4)];
};
export { AR };
