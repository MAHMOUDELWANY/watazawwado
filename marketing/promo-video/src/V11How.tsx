import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { COPPER, CRIMSON, GOLD, GOLD_SOFT, SANS, SERIF, TEAL_DEEP } from './kit';
import { ESPRESSO, INK, Label, Paper, SAND, WHITE } from './V2Ain';
import { CFrame } from './V10Screen';

/**
 * V11 · "How it works with us", pinned carousel, 6 slides at 1080×1350 (Content Calendar, 26 Nov 2026).
 * One frame = one slide: `npx remotion still src/index.ts V11How out/v11/slide-N.png --frame=N-1`.
 * The real journey (STRATEGY §8: waitlist → invitation → choose teacher → free 30-min trial → same-day report → weekly
 * lessons). Screens are drawn from the site's steps with example data and labelled "Example". No prices (MK-01).
 */
export const V11_SLIDES = 6;

const Phone: React.FC<{ x: number; y: number; rot?: number; children: React.ReactNode }> = ({ x, y, rot = -2, children }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: 520, height: 780, borderRadius: 60, background: INK, padding: 18, transform: `rotate(${rot}deg)`,
    boxShadow: '0 26px 40px rgba(40,25,15,0.38)' }}>
    <div style={{ width: '100%', height: '100%', borderRadius: 44, background: '#FAF7F2', overflow: 'hidden', padding: '56px 34px 0', boxSizing: 'border-box' }}>{children}</div>
  </div>
);
const H: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 38, color: INK, lineHeight: 1.15 }}>{children}</div>;
const P: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 24, color: '#6B6158', marginTop: 10, lineHeight: 1.35 }}>{children}</div>;
const Row: React.FC<{ on?: boolean; children: React.ReactNode }> = ({ on, children }) => (
  <div style={{ marginTop: 18, borderRadius: 22, background: WHITE, border: `4px solid ${on ? CRIMSON : 'rgba(27,21,18,0.12)'}`, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16,
    fontFamily: SANS, fontWeight: 700, fontSize: 28, color: INK, boxShadow: on ? '0 0 0 6px rgba(197,31,36,0.12)' : 'none' }}>{children}</div>
);

const Step: React.FC<{ n: number; k: string; color: string; title: React.ReactNode; body: string; phone: React.ReactNode }> = ({ n, k, color, title, body, phone }) => (
  <CFrame n={n} total={V11_SLIDES}>
    <div style={{ position: 'absolute', left: 90, top: 200, width: 400 }}>
      <div style={{ width: 110, height: 110, borderRadius: 99, background: color, border: '8px solid #fff', boxShadow: '0 8px 14px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 62, color: WHITE }}>{k}</div>
      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 64, lineHeight: 1.08, color: INK, marginTop: 26 }}>{title}</div>
      <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 38, lineHeight: 1.38, color: '#453D34', marginTop: 20 }}>{body}</div>
    </div>
    <Paper seed={'v11p' + n} x={500} y={220} w={520} h={900} color={color} rot={2}>{null}</Paper>
    <div style={{ position: 'absolute', left: 0, top: 0, transform: 'scale(0.86)', transformOrigin: '760px 600px', width: 1080, height: 1350 }}>{phone}</div>
    <Label at={-100} x={790} y={1150} text="Example" size={34} rot={4} under={false} />
  </CFrame>
);

const S1: React.FC = () => (
  <CFrame n={1} total={V11_SLIDES}>
    <div style={{ position: 'absolute', left: 90, top: 200, background: CRIMSON, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 34, borderRadius: 999, padding: '10px 26px', transform: 'rotate(-2deg)' }}>📌 Start here</div>
    <Paper seed="v11s1" x={70} y={300} w={940} h={480} color={TEAL_DEEP} rot={-1}>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 100, fontFamily: SERIF, fontWeight: 700, fontSize: 110, lineHeight: 1.04, color: WHITE }}>
        How it works <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>with us</span>
      </div>
    </Paper>
    <div style={{ position: 'absolute', left: 90, right: 90, top: 860, display: 'flex', justifyContent: 'space-between' }}>
      {[CRIMSON, COPPER, SAND, TEAL_DEEP, ESPRESSO].map((c, i) => (
        <div key={i} style={{ width: 150, height: 150, borderRadius: 99, background: c, border: '8px solid #fff', boxShadow: '0 8px 14px rgba(0,0,0,0.2)', transform: `translateY(${i % 2 ? -20 : 0}px)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 70, color: WHITE }}>{i + 1}</div>
      ))}
    </div>
    <Label at={-100} x={540} y={1120} text="5 steps, swipe →" size={40} />
  </CFrame>
);

const S2 = () => (
  <Step n={2} k="1" color={CRIMSON} title={<>Pack your zaad.</>} body="Join the waitlist, for you or for your child. It takes a minute."
    phone={<div style={{ position: 'absolute', left: 520, top: 260 }}><Phone x={0} y={0}>
      <H>Join the waitlist</H><P>We open in small waves. We’ll invite you when yours opens.</P>
      <Row on>👧 For my child</Row><Row>🙋 For me</Row>
      <div style={{ marginTop: 26, background: CRIMSON, color: WHITE, borderRadius: 999, textAlign: 'center', padding: '18px 0', fontFamily: SANS, fontWeight: 700, fontSize: 30 }}>Join</div>
    </Phone></div>} />
);

const S3 = () => (
  <Step n={3} k="2" color={COPPER} title={<>Choose your teacher.</>} body="When your wave opens, you pick from real profiles. You meet them before the first class."
    phone={<div style={{ position: 'absolute', left: 520, top: 260 }}><Phone x={0} y={0}>
      <H>Choose your teacher</H><P>These teachers teach this subject and have free time.</P>
      <Row on><Img src={staticFile('img/ustadh-mahmoud.jpg')} style={{ width: 70, height: 70, borderRadius: 99, objectFit: 'cover', border: `3px solid ${GOLD}` }} />Ustadh Mahmoud</Row>
      <Row><div style={{ width: 70, height: 70, borderRadius: 99, background: '#E8E1D4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEAL_DEEP, fontSize: 34 }}>✦</div>A female teacher</Row>
    </Phone></div>} />
);

const S4 = () => (
  <Step n={4} k="3" color={SAND} title={<>A free 30‑minute trial.</>} body="One real lesson with your teacher, so you can see how it feels."
    phone={<div style={{ position: 'absolute', left: 520, top: 260 }}><Phone x={0} y={0}>
      <H>Trial lesson</H><P>Thursday · 5:00 pm</P>
      <div style={{ marginTop: 26, height: 300, borderRadius: 26, background: '#8C7D6E', position: 'relative', overflow: 'hidden' }}>
        <svg width="100%" height="100%" viewBox="0 0 400 300"><circle cx="200" cy="120" r="56" fill={INK} /><path d="M100 300 C 110 220 160 190 200 190 C 240 190 290 220 300 300 Z" fill={INK} /></svg>
        <div style={{ position: 'absolute', right: 16, top: 16, background: CRIMSON, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 26, borderRadius: 10, padding: '4px 12px' }}>30:00</div>
      </div>
      <div style={{ marginTop: 22, fontFamily: SANS, fontWeight: 700, fontSize: 30, color: TEAL_DEEP }}>Free</div>
    </Phone></div>} />
);

const S5 = () => (
  <Step n={5} k="4" color={TEAL_DEEP} title={<>A report the same day.</>} body="Level, goals and a plan, written by your teacher."
    phone={<div style={{ position: 'absolute', left: 520, top: 260 }}><Phone x={0} y={0}>
      <H>Trial report · Yusuf</H><P>From Ustadh Mahmoud</P>
      {[['Level', 'Reads short words, mixes up ق‎ and ك‎'], ['Goal', 'Juz ‘Amma with Tajweed'], ['Plan', 'Two lessons a week, start with the letters']].map(([a, b]) => (
        <div key={a} style={{ marginTop: 18, borderRadius: 20, background: WHITE, border: '4px solid rgba(27,21,18,0.1)', padding: '14px 18px' }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24, color: CRIMSON }}>{a}</div>
          <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 26, color: INK, marginTop: 4 }}>{b}</div>
        </div>
      ))}
    </Phone></div>} />
);

const S6: React.FC = () => (
  <CFrame n={6} total={V11_SLIDES}>
    <div style={{ position: 'absolute', left: 90, top: 200, width: 110, height: 110, borderRadius: 99, background: ESPRESSO, border: '8px solid #fff', boxShadow: '0 8px 14px rgba(0,0,0,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 62, color: WHITE }}>5</div>
    <div style={{ position: 'absolute', left: 90, right: 90, top: 340, fontFamily: SERIF, fontWeight: 700, fontSize: 80, lineHeight: 1.08, color: INK }}>Then, every week:</div>
    {['1‑on‑1 lessons with the same teacher', 'A report after every class', 'We message you first'].map((s, i) => (
      <div key={s} style={{ position: 'absolute', left: 90, right: 90, top: 500 + i * 130, display: 'flex', alignItems: 'center', gap: 22, fontFamily: SANS, fontWeight: 700, fontSize: 46, color: INK }}>
        <div style={{ width: 64, height: 64, borderRadius: 99, background: [CRIMSON, COPPER, TEAL_DEEP][i], color: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, border: '6px solid #fff' }}>✓</div>{s}
      </div>
    ))}
    <Img src={staticFile('img/zaad-bag.svg')} style={{ position: 'absolute', left: 415, top: 920, width: 220, filter: 'drop-shadow(0 10px 14px rgba(40,25,15,0.3))' }} />
    <div style={{ position: 'absolute', top: 1150, width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ background: CRIMSON, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 42, padding: '14px 36px', borderRadius: 999, border: '8px solid #fff', boxShadow: '0 10px 18px rgba(0,0,0,0.25)' }}>Pack your zaad · Link in bio</div>
    </div>
  </CFrame>
);

export const V11How: React.FC = () => {
  const f = useCurrentFrame();
  return [<S1 />, <S2 />, <S3 />, <S4 />, <S5 />, <S6 />][Math.min(f, 5)];
};
