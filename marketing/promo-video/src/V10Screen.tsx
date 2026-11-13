import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { COPPER, CRIMSON, GOLD_SOFT, SANS, SERIF, TEAL_DEEP } from './kit';
import { AR, ESPRESSO, GraphPaper, INK, Label, Logo, Paper, SAND, WHITE } from './V2Ain';

/**
 * V10 · "Screen time vs Quran time: a trade, not a fight", 5 slides at 1080×1350 (Content Calendar, 25 Nov 2026).
 * One frame = one slide: `npx remotion still src/index.ts V10Screen out/v10/slide-N.png --frame=N-1`.
 * Parent playbook: three practical ideas, no promised outcome.
 */
export const V10_SLIDES = 5;

/** Carousel frame shared by the carousels from V10 on: counter, engraved logo, page dots. */
export const CFrame: React.FC<{ n: number; total: number; children: React.ReactNode }> = ({ n, total, children }) => (
  <AbsoluteFill>
    <GraphPaper />
    {children}
    <div style={{ position: 'absolute', left: 64, top: 84, background: INK, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 30, borderRadius: 12, padding: '8px 18px' }}>
      {n} / {total}
    </div>
    <Logo />
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 56, display: 'flex', justifyContent: 'center', gap: 12 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: i + 1 === n ? 40 : 14, height: 14, borderRadius: 7, background: i + 1 === n ? CRIMSON : 'rgba(27,21,18,0.2)' }} />
      ))}
    </div>
  </AbsoluteFill>
);

const Tablet: React.FC<{ x: number; y: number; w: number; rot?: number; screen: React.ReactNode }> = ({ x, y, w, rot = 0, screen }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: w * 0.7, borderRadius: 40, background: INK, padding: 18, transform: `rotate(${rot}deg)`,
    boxShadow: '0 20px 30px rgba(40,25,15,0.35)', border: '8px solid #fff' }}>
    <div style={{ width: '100%', height: '100%', borderRadius: 26, overflow: 'hidden', position: 'relative' }}>{screen}</div>
  </div>
);

const Clock: React.FC<{ x: number; y: number; size: number; h: number; m: number }> = ({ x, y, size, h, m }) => {
  const ma = (m / 60) * 360, ha = ((h % 12) / 12) * 360 + (m / 60) * 30;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ position: 'absolute', left: x, top: y, filter: 'drop-shadow(0 10px 12px rgba(40,25,15,0.3))' }}>
      <circle cx="100" cy="100" r="90" fill={WHITE} stroke="#fff" strokeWidth={10} />
      <circle cx="100" cy="100" r="82" fill="none" stroke={INK} strokeWidth={6} />
      <line x1="100" y1="100" x2={100 + 45 * Math.sin((ha * Math.PI) / 180)} y2={100 - 45 * Math.cos((ha * Math.PI) / 180)} stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <line x1="100" y1="100" x2={100 + 66 * Math.sin((ma * Math.PI) / 180)} y2={100 - 66 * Math.cos((ma * Math.PI) / 180)} stroke={CRIMSON} strokeWidth={7} strokeLinecap="round" />
      <circle cx="100" cy="100" r="9" fill={INK} />
    </svg>
  );
};

const Idea: React.FC<{ n: number; k: string; color: string; title: React.ReactNode; body: string; art: React.ReactNode }> = ({ n, k, color, title, body, art }) => (
  <CFrame n={n} total={V10_SLIDES}>
    <Paper seed={'v10' + n} x={70} y={200} w={940} h={520} color={color} rot={n % 2 ? 1 : -1}>{null}</Paper>
    {art}
    <div style={{ position: 'absolute', left: 90, top: 760, display: 'flex', gap: 26, alignItems: 'flex-start', right: 90 }}>
      <div style={{ flex: '0 0 96px', height: 96, borderRadius: 99, background: color, border: '7px solid #fff', boxShadow: '0 8px 14px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 54, color: WHITE }}>{k}</div>
      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 70, lineHeight: 1.08, color: INK }}>{title}</div>
    </div>
    <div style={{ position: 'absolute', left: 212, right: 90, top: 1000, fontFamily: SANS, fontWeight: 500, fontSize: 44, lineHeight: 1.4, color: '#453D34' }}>{body}</div>
  </CFrame>
);

const Cartoon: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #12A4BC, #DA7960)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 110, height: 110, borderRadius: 99, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 0, height: 0, borderLeft: '36px solid #C51F24', borderTop: '22px solid transparent', borderBottom: '22px solid transparent', marginLeft: 10 }} />
    </div>
  </div>
);

const S1: React.FC = () => (
  <CFrame n={1} total={V10_SLIDES}>
    <Paper seed="v10s1" x={70} y={200} w={940} h={600} color={ESPRESSO} rot={-1}>{null}</Paper>
    <Tablet x={170} y={300} w={520} rot={-5} screen={<Cartoon />} />
    <Clock x={720} y={250} size={220} h={6} m={0} />
    <div style={{ position: 'absolute', left: 740, top: 490, fontFamily: SANS, fontWeight: 700, fontSize: 40, color: GOLD_SOFT }}>6 pm</div>
    <div style={{ position: 'absolute', left: 90, right: 90, top: 850, fontFamily: SERIF, fontWeight: 700, fontSize: 64, lineHeight: 1.12, color: INK }}>
      The tablet is on. You say “Quran time”, and the room goes <span style={{ fontStyle: 'italic', color: CRIMSON }}>cold.</span>
    </div>
    <Label at={-100} x={540} y={1160} text="A trade, not a fight. 3 ideas →" size={40} />
  </CFrame>
);

const S2 = () => (
  <Idea n={2} k="1" color={TEAL_DEEP} title={<>Agree before the screen, not in the middle of it.</>}
    body="“Quran first, then the tablet” is easy to agree at 5:50. At 6:15 it’s a fight."
    art={<><Clock x={190} y={300} size={300} h={5} m={50} /><div style={{ position: 'absolute', left: 560, top: 330, background: WHITE, border: `6px solid ${INK}`, borderRadius: 34,
      padding: '18px 30px', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 46, color: INK, transform: 'rotate(3deg)', maxWidth: 380 }}>“Quran first, then tablet. Deal?”</div></>} />
);

const S3 = () => (
  <Idea n={3} k="2" color={COPPER} title={<>Ten minutes first. Then the screen.</>}
    body="Short enough to say yes to. The screen waits; it doesn’t disappear."
    art={<div style={{ position: 'absolute', left: 140, top: 290, display: 'flex', gap: 30, alignItems: 'center' }}>
      <div style={{ width: 340, height: 340, borderRadius: 999, background: WHITE, border: '10px solid #fff', boxShadow: '0 12px 20px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 120, color: CRIMSON, lineHeight: 1 }}>10</div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: INK }}>minutes</div>
      </div>
      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 110, color: WHITE }}>→</div>
      <div style={{ width: 230, height: 160, borderRadius: 26, background: INK, border: '8px solid #fff', overflow: 'hidden', position: 'relative' }}><Cartoon /></div>
    </div>} />
);

const S4 = () => (
  <Idea n={4} k="3" color={SAND} title={<>Let them choose the surah.</>}
    body="A child who picks it owns it. Even if it’s the same one for the fifth night in a row."
    art={<div style={{ position: 'absolute', left: 140, top: 290, display: 'flex', gap: 28 }}>
      {['الفاتحة', 'الإخلاص', 'الفلق', 'الناس'].map((s, i) => (
        <div key={s} style={{ width: 180, height: 250, borderRadius: 22, background: i === 1 ? CRIMSON : WHITE, border: '8px solid #fff', boxShadow: '0 10px 16px rgba(0,0,0,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${[-4, 2, -2, 4][i]}deg) translateY(${i === 1 ? -30 : 0}px)` }}>
          <span style={{ fontFamily: AR, fontSize: 44, color: i === 1 ? WHITE : INK }}>{s}</span>
        </div>
      ))}
    </div>} />
);

const S5: React.FC = () => (
  <CFrame n={5} total={V10_SLIDES}>
    <Paper seed="v10s5" x={70} y={260} w={940} h={560} color={CRIMSON} rot={-1}>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 110, fontFamily: SERIF, fontWeight: 700, fontSize: 100, lineHeight: 1.06, color: WHITE }}>
        What works in <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>your</span> home?
      </div>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 380, fontFamily: SANS, fontWeight: 500, fontSize: 42, color: WHITE, opacity: 0.92 }}>Another parent might need your idea tonight.</div>
    </Paper>
    <Img src={staticFile('img/zaad-bag.svg')} style={{ position: 'absolute', right: 100, top: 880, width: 170, transform: 'rotate(8deg)', filter: 'drop-shadow(0 8px 10px rgba(40,25,15,0.3))' }} />
    <div style={{ position: 'absolute', left: 90, top: 1000, background: INK, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 44, padding: '16px 36px', borderRadius: 999,
      border: '8px solid #fff', boxShadow: '0 10px 18px rgba(0,0,0,0.25)' }}>Tell us in the comments 👇</div>
  </CFrame>
);

export const V10Screen: React.FC = () => {
  const f = useCurrentFrame();
  return [<S1 />, <S2 />, <S3 />, <S4 />, <S5 />][Math.min(f, 4)];
};
