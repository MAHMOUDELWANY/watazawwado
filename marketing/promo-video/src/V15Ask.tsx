import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { COPPER, CRIMSON, GOLD_SOFT, SANS, SERIF, TEAL_DEEP } from './kit';
import { ESPRESSO, INK, Label, Paper, SAND, WHITE } from './V2Ain';
import { CFrame } from './V10Screen';
import { ZadStill } from './reel';

/**
 * V15 · "3 questions to ask after Quran class", 5 slides at 1080×1350 (Content Calendar, 30 Nov 2026).
 * Parents of children, pillar 4 (parent playbook). One frame = one slide. No promised outcome.
 */
export const V15_SLIDES = 5;
const N = V15_SLIDES;

const Bubble: React.FC<{ x: number; y: number; w: number; text: string; color: string; ink: string; tail?: 'l' | 'r'; size?: number }> = ({ x, y, w, text, color, ink, tail = 'l', size = 64 }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, background: color, color: ink, borderRadius: 44, padding: '34px 44px', fontFamily: SERIF, fontWeight: 700, fontSize: size,
    lineHeight: 1.1, border: '8px solid #fff', boxShadow: '0 12px 20px rgba(0,0,0,0.22)' }}>
    {text}
    <div style={{ position: 'absolute', bottom: -34, [tail === 'l' ? 'left' : 'right']: 70, width: 0, height: 0, borderLeft: '26px solid transparent', borderRight: '26px solid transparent', borderTop: `40px solid ${color}` } as React.CSSProperties} />
  </div>
);

const S1: React.FC = () => (
  <CFrame n={1} total={N}>
    <Paper seed="v15s1" x={70} y={200} w={940} h={640} color={ESPRESSO} rot={-1}>{null}</Paper>
    <Bubble x={130} y={280} w={700} text="“How was Quran class?”" color={WHITE} ink={INK} />
    <Bubble x={560} y={560} w={360} text="“Fine.”" color={CRIMSON} ink={WHITE} tail="r" size={84} />
    <div style={{ position: 'absolute', left: 90, right: 90, top: 900, fontFamily: SERIF, fontWeight: 700, fontSize: 66, lineHeight: 1.1, color: INK }}>
      Every week, the <span style={{ fontStyle: 'italic', color: CRIMSON }}>same</span> answer?
    </div>
    <Label at={-100} x={480} y={1110} text="Try one of these instead →" size={44} />
    <ZadStill emote="think" k={60} x={880} y={1080} size={420} />
  </CFrame>
);

const Q: React.FC<{ n: number; k: string; color: string; q: string; why: string }> = ({ n, k, color, q, why }) => (
  <CFrame n={n} total={N}>
    <Paper seed={'v15q' + n} x={70} y={200} w={940} h={600} color={color} rot={n % 2 ? 1 : -1}>
      <div style={{ position: 'absolute', left: 70, top: 70, width: 96, height: 96, borderRadius: 99, background: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: SERIF, fontWeight: 700, fontSize: 56, color }}>{k}</div>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 200, fontFamily: SERIF, fontWeight: 700, fontSize: 78, lineHeight: 1.1, color: WHITE }}>{q}</div>
    </Paper>
    <div style={{ position: 'absolute', left: 90, right: 90, top: 870, fontFamily: SANS, fontWeight: 500, fontSize: 46, lineHeight: 1.4, color: '#453D34' }}>{why}</div>
  </CFrame>
);

const S5: React.FC = () => (
  <CFrame n={5} total={N}>
    <Paper seed="v15s5" x={70} y={260} w={940} h={560} color={SAND} rot={-1}>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 90, fontFamily: SERIF, fontWeight: 700, fontSize: 78, lineHeight: 1.06, color: INK }}>
        Pick <span style={{ fontStyle: 'italic', color: CRIMSON }}>one.</span> Pack it for after class.
      </div>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 360, fontFamily: SANS, fontWeight: 500, fontSize: 44, lineHeight: 1.4, color: INK }}>
        Then listen. A short answer is still an answer.
      </div>
    </Paper>
    <Img src={staticFile('img/zaad-bag.svg')} style={{ position: 'absolute', right: 90, top: 1010, width: 190, transform: 'rotate(8deg)', filter: 'drop-shadow(0 8px 10px rgba(40,25,15,0.3))' }} />
    <ZadStill emote="wave" k={40} x={850} y={930} size={400} />
    <div style={{ position: 'absolute', left: 90, top: 1000, background: INK, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 44, padding: '16px 36px', borderRadius: 999,
      border: '8px solid #fff', boxShadow: '0 10px 18px rgba(0,0,0,0.25)' }}>Save this for after class</div>
  </CFrame>
);

export const V15Ask: React.FC = () => {
  const f = useCurrentFrame();
  return [
    <S1 />,
    <Q n={2} k="1" color={TEAL_DEEP} q="“What’s one thing today’s ayah asks us to do?”" why="Not just the words. Pick one small thing and try it together this week." />,
    <Q n={3} k="2" color={COPPER} q="“Can you read me one line, the way your teacher does?”" why="Kids love being the teacher. You get to hear the progress for yourself." />,
    <Q n={4} k="3" color={CRIMSON} q="“What did your teacher say you did well?”" why="It keeps the good part of class fresh, and it shows you care about more than the mistakes." />,
    <S5 />,
  ][Math.min(f, N - 1)];
};
