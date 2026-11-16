import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { COPPER, CRIMSON, GOLD_SOFT, SANS, SERIF, TEAL_DEEP } from './kit';
import { ESPRESSO, INK, Label, Paper, SAND, WHITE } from './V2Ain';
import { CFrame } from './V10Screen';
import { ZadStill } from './reel';

/**
 * V14 · "Learning with no audience: why 1-on-1 feels different", 4 slides at 1080×1350 (Content Calendar, 29 Nov 2026).
 * Young adults 18-35, pillar 3 (come back, no lecture). One frame = one slide.
 */
export const V14_SLIDES = 4;
const N = V14_SLIDES;

/** Rows of desks seen from above, every seat turned toward one bubble. */
const Room: React.FC = () => (
  <svg width={940} height={600} viewBox="0 0 940 600" style={{ position: 'absolute', left: 70, top: 200 }}>
    {Array.from({ length: 3 }).map((_, r) => Array.from({ length: 5 }).map((__, c) => {
      const x = 110 + c * 170, y = 280 + r * 110;
      return <g key={`${r}${c}`}><rect x={x - 50} y={y} width={100} height={46} rx={8} fill="rgba(255,255,255,0.18)" /><circle cx={x} cy={y - 18} r={18} fill="rgba(255,255,255,0.35)" /></g>;
    }))}
    <path d="M330 40 H610 Q640 40 640 70 V170 Q640 200 610 200 H500 L470 250 L455 200 H330 Q300 200 300 170 V70 Q300 40 330 40 Z" fill={WHITE} />
    <text x="470" y="140" textAnchor="middle" fontFamily="ThmanyahSerif, Georgia" fontWeight="700" fontSize="64" fill={CRIMSON}>…uh?</text>
  </svg>
);

const S1: React.FC = () => (
  <CFrame n={1} total={N}>
    <Paper seed="v14s1" x={70} y={200} w={940} h={600} color={ESPRESSO} rot={-1}>{null}</Paper>
    <Room />
    <ZadStill emote="oops" k={45} x={900} y={1200} size={330} />
    <div style={{ position: 'absolute', left: 90, right: 90, top: 860, fontFamily: SERIF, fontWeight: 700, fontSize: 66, lineHeight: 1.12, color: INK }}>
      Remember reading out loud in class, and <span style={{ fontStyle: 'italic', color: CRIMSON }}>everyone</span> heard the mistake?
    </div>
  </CFrame>
);

const S2: React.FC = () => (
  <CFrame n={2} total={N}>
    <Paper seed="v14s2" x={70} y={220} w={940} h={760} color={SAND} rot={1}>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 110, fontFamily: SERIF, fontWeight: 700, fontSize: 84, lineHeight: 1.08, color: INK }}>
        For a lot of us, that’s where it <span style={{ fontStyle: 'italic', color: CRIMSON }}>stopped.</span>
      </div>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 420, fontFamily: SANS, fontWeight: 500, fontSize: 46, lineHeight: 1.4, color: INK }}>
        We still cared. We just got tired of being watched while we learned.
      </div>
    </Paper>
    <Label at={-100} x={470} y={1060} text="So what changes one-on-one? →" size={44} />
    <ZadStill emote="think" k={60} x={880} y={1060} size={380} />
  </CFrame>
);

const S3: React.FC = () => (
  <CFrame n={3} total={N}>
    <div style={{ position: 'absolute', left: 90, right: 90, top: 190, fontFamily: SERIF, fontWeight: 700, fontSize: 76, color: INK }}>One-on-one means:</div>
    {[
      ['No audience.', 'Just you and your teacher. Nobody waiting for you to slip.', TEAL_DEEP],
      ['Your pace.', 'One letter a week is fine. Nobody is ahead of you.', COPPER],
      ['A kind correction.', 'Your teacher fixes it, and you both move on.', CRIMSON],
    ].map(([h, b, c], i) => (
      <div key={h} style={{ position: 'absolute', left: 90, right: 90, top: 340 + i * 270, display: 'flex', gap: 30, alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 96px', height: 96, borderRadius: 99, background: c, border: '7px solid #fff', boxShadow: '0 8px 14px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 54, color: WHITE }}>✓</div>
        <div>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 62, color: INK, lineHeight: 1.1 }}>{h}</div>
          <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 40, color: '#453D34', lineHeight: 1.35, marginTop: 8 }}>{b}</div>
        </div>
      </div>
    ))}
  </CFrame>
);

const S4: React.FC = () => (
  <CFrame n={4} total={N}>
    <Paper seed="v14s4" x={70} y={260} w={940} h={560} color={TEAL_DEEP} rot={-1}>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 100, fontFamily: SERIF, fontWeight: 700, fontSize: 88, lineHeight: 1.08, color: WHITE }}>
        Someone your age who <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>gets you.</span>
      </div>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 380, fontFamily: SANS, fontWeight: 700, fontSize: 52, color: WHITE }}>No lectures. Start where you are.</div>
    </Paper>
    <Img src={staticFile('img/zaad-bag.svg')} style={{ position: 'absolute', right: 90, top: 1010, width: 190, transform: 'rotate(8deg)', filter: 'drop-shadow(0 8px 10px rgba(40,25,15,0.3))' }} />
    <ZadStill emote="wave" k={40} x={850} y={930} size={400} />
    <div style={{ position: 'absolute', left: 90, top: 1000, background: CRIMSON, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 46, padding: '16px 38px', borderRadius: 999,
      border: '8px solid #fff', boxShadow: '0 10px 18px rgba(0,0,0,0.25)' }}>Comment ZAAD</div>
  </CFrame>
);

export const V14Audience: React.FC = () => {
  const f = useCurrentFrame();
  return [<S1 />, <S2 />, <S3 />, <S4 />][Math.min(f, N - 1)];
};
