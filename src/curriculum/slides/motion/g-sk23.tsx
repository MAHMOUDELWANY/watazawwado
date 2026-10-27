import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Cut, Chip, Bubble } from './kit';
import { asset } from '../Art';

/**
 * Seerah · Kids · Episodes 2 and 3 on the Kids paper stage. The story is carried by the owner's painted pictures
 * (docs/curriculum/seerah/IMAGE-PROMPTS.md, kids-ep02 / kids-ep03) in a storybook frame; the Zad Kids cast stand beside
 * it and react (they never narrate: the teacher tells the story). Motion only where it explains: the slowest donkey
 * moving to the front, the road north, the three lamps going out one by one. The Prophet ﷺ is never drawn.
 */

const CAST = 'zad-kids/characters';

/** The painted picture in a paper frame; a warm sand card until the picture arrives. */
function Picture({ src }: { src: string }) {
  const [ok, setOk] = useState(false);
  const reduce = useReduce();
  return (
    <motion.div className="pointer-events-none absolute overflow-hidden" style={{ left: 770, top: 200, width: 600, height: 400, borderRadius: 28, border: '10px solid #FFFDF8', boxShadow: '0 30px 60px -28px rgba(60,20,10,0.45)', background: 'linear-gradient(160deg, #F7E3BC 0%, #EBC88E 100%)', rotate: -1.2 }}
      initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, ease }}>
      <motion.img src={asset(`${src}.webp`)} alt="" draggable={false} onLoad={() => setOk(true)} onError={() => setOk(false)}
        className="absolute inset-0 h-full w-full object-cover" initial={{ scale: 1.02 }} animate={{ opacity: ok ? 1 : 0, scale: reduce ? 1.02 : 1.07 }} transition={{ opacity: { duration: 0.8 }, scale: { duration: 18, ease: 'linear' } }} />
    </motion.div>
  );
}

type Opts = {
  pic: string;
  /** Cast poses by build step: poses[i] shows from line i on (the last one stays). */
  poses?: string[];
  flip?: boolean;
  extra?: (p: GraphicProps) => React.ReactNode;
};

/** A story page: the picture, the page's items as chips under it, one cast member reacting. */
function make({ pic, poses = ['yusuf-listen'], flip = false, extra }: Opts) {
  return function SeerahKidsPage(p: GraphicProps) {
    const pose = poses[Math.min(poses.length - 1, Math.max(0, p.lines - 1))];
    return (
      <>
        <Picture src={pic} />
        {extra?.(p)}
        {p.labels.slice(0, p.items).map((l, i) => <Chip key={l} x={900 + i * 260} y={690} strong={i === p.labels.length - 1} delay={0.1}>{l}</Chip>)}
        <Cut src={`${CAST}/${pose}`} x={1440} y={812} h={300} flip={flip} delay={0.5} />
      </>
    );
  };
}

/** The caravan on the way home: the gold dot (the slow donkey) starts last and moves to the front. */
function Race({ lines }: { lines: number }) {
  const reduce = useReduce();
  const lead = lines >= 1;
  return (
    <svg className="pointer-events-none absolute inset-0" viewBox="0 0 1600 900" width="100%" height="100%">
      <line x1={820} y1={660} x2={1300} y2={660} stroke={soft('light')} strokeWidth={3} strokeDasharray="4 12" />
      <text x={1310} y={667} fill={INK_TEXT} fontSize={18} fontWeight={700}>home ›</text>
      {[900, 970, 1040, 1110].map((x, i) => (
        <motion.circle key={x} cx={0} cy={660} r={11} fill="#B9A58A" initial={{ x }} animate={{ x: lead ? x - 50 : x }} transition={{ duration: reduce ? 0 : 1.6, delay: i * 0.05, ease }} />
      ))}
      <motion.circle cx={0} cy={660} r={17} fill={GOLD} initial={{ x: 830 }} animate={{ x: lead ? 1240 : 830 }} transition={{ duration: reduce ? 0 : 2, delay: 0.4, ease }} style={{ filter: `drop-shadow(0 0 10px ${GOLD})` }} />
    </svg>
  );
}

/** A dotted road from Makkah (south) to Yathrib (north), drawn under the picture. */
function Route() {
  return (
    <svg className="pointer-events-none absolute inset-0" viewBox="0 0 1600 900" width="100%" height="100%">
      <motion.path d="M 860 700 C 980 640, 1120 720, 1260 650" fill="none" stroke={TEAL} strokeWidth={5} strokeLinecap="round" strokeDasharray="2 14" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 0.6, ease }} />
      <text x={840} y={740} fill={INK_TEXT} fontSize={20} fontWeight={800} textAnchor="middle">Makkah</text>
      <motion.text x={1270} y={630} fill={TEAL} fontSize={20} fontWeight={800} textAnchor="middle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }}>Yathrib</motion.text>
    </svg>
  );
}

/** Three little lamps under the picture; `out` of them have gone out (left to right), with a curl of smoke. */
function Lamps({ out }: { out: number }) {
  return (
    <svg className="pointer-events-none absolute inset-0" viewBox="0 0 1600 900" width="100%" height="100%">
      {[0, 1, 2].map((i) => {
        const x = 960 + i * 150, y = 700, off = i < out;
        return (
          <g key={i}>
            <path d={`M ${x - 40} ${y} Q ${x} ${y + 34} ${x + 40} ${y} Z`} fill="#B8743C" />
            <motion.ellipse cx={x} cy={y - 16} rx={10} ry={20} fill={GOLD} initial={false} animate={{ opacity: off ? 0 : 1, scaleY: off ? 0.2 : 1 }} transition={{ duration: 0.9, delay: 0.4 + i * 0.3 }} style={{ filter: `drop-shadow(0 0 12px ${GOLD})` }} />
            {off && <motion.path d={`M ${x} ${y - 10} q -10 -20 0 -40 q 10 -20 0 -40`} fill="none" stroke="rgba(31,22,18,0.35)" strokeWidth={3} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.2, delay: 0.8 + i * 0.3 }} />}
          </g>
        );
      })}
    </svg>
  );
}

/** A question page with no picture: two of the cast think about it. */
function asks(left: string, right: string, thought: string) {
  return function SeerahKidsAsk(_: GraphicProps) {
    return (
      <>
        <Cut src={`${CAST}/${left}`} x={1000} y={812} h={420} delay={0.2} />
        <Cut src={`${CAST}/${right}`} x={1330} y={812} h={380} flip delay={0.4} />
        <Bubble x={1050} y={210} text={thought} thought delay={0.9} width={300} />
      </>
    );
  };
}

/** The week's mission: the cast cheer it on. */
function mission(a: string, b: string, chip: string) {
  return function SeerahKidsMission(_: GraphicProps) {
    return (
      <>
        <Cut src={`${CAST}/${a}`} x={1020} y={812} h={420} delay={0.2} />
        <Cut src={`${CAST}/${b}`} x={1330} y={812} h={400} flip delay={0.4} />
        <Chip x={1170} y={250} color={CRIMSON} strong delay={0.8}>{chip}</Chip>
      </>
    );
  };
}

/* ---------- Episode 2 ---------- */
const K2 = 'seerah-kids/ep02';
export const Sk2CoverGraphic = make({ pic: `${K2}/cover`, poses: ['maryam-happy'] });
export const Sk2DryGraphic = make({ pic: `${K2}/dry`, poses: ['yusuf-listen', 'yusuf-listen', 'yusuf-sad'] });
export const Sk2TripGraphic = make({ pic: `${K2}/trip`, poses: ['maryam-think'] });
export const Sk2TownGraphic = make({ pic: `${K2}/town`, poses: ['yusuf-listen', 'yusuf-think', 'yusuf-sad'] });
export const Sk2AskGraphic = asks('yusuf-think', 'maryam-think', 'Would I take him?');
export const Sk2DoorGraphic = make({ pic: `${K2}/door`, poses: ['maryam-think', 'maryam-happy', 'maryam-amazed'] });
export const Sk2MilkGraphic = make({ pic: `${K2}/milk`, poses: ['yusuf-surprised', 'yusuf-surprised', 'maryam-amazed'] });
export const Sk2RaceGraphic = make({ pic: `${K2}/race`, poses: ['yusuf-point', 'maryam-amazed'], extra: ({ lines }) => <Race lines={lines} /> });
export const Sk2GreenGraphic = make({ pic: `${K2}/green`, poses: ['maryam-happy'] });
export const Sk2HillsGraphic = make({ pic: `${K2}/hills`, poses: ['yusuf-listen', 'maryam-happy'] });
export const Sk2BasinGraphic = make({ pic: `${K2}/basin`, poses: ['yusuf-listen', 'maryam-amazed', 'jiddo-explain'] });
export const Sk2MissionGraphic = mission('yusuf-brave', 'maryam-happy', 'Pick the one nobody picks!');
export const Sk2NextGraphic = make({ pic: `${K2}/road`, poses: ['yusuf-think'] });

/* ---------- Episode 3 ---------- */
const K3 = 'seerah-kids/ep03';
export const Sk3CoverGraphic = make({ pic: `${K3}/cover`, poses: ['yusuf-listen'], extra: () => <Lamps out={0} /> });
export const Sk3JourneyGraphic = make({ pic: `${K3}/journey`, poses: ['yusuf-listen'], extra: ({ lines }) => lines >= 2 && <Route /> });
export const Sk3PalmsGraphic = make({ pic: `${K3}/palms`, poses: ['maryam-happy', 'maryam-happy', 'maryam-amazed'] });
export const Sk3TentGraphic = make({ pic: `${K3}/tent`, poses: ['yusuf-listen', 'yusuf-sad', 'maryam-dua'], extra: ({ lines }) => lines >= 2 && <Lamps out={1} /> });
export const Sk3AskGraphic = asks('yusuf-sad', 'jiddo-advice', 'Who helps me?');
export const Sk3RugGraphic = make({ pic: `${K3}/rug`, poses: ['jiddo-stand', 'jiddo-explain', 'maryam-happy'] });
export const Sk3StaffGraphic = make({ pic: `${K3}/staff`, poses: ['yusuf-sad'], extra: () => <Lamps out={2} /> });
export const Sk3HomeGraphic = make({ pic: `${K3}/home`, poses: ['yusuf-listen', 'maryam-happy'] });
export const Sk3CloudsGraphic = make({ pic: `${K3}/clouds`, poses: ['yusuf-think', 'yusuf-surprised'] });
export const Sk3RainGraphic = make({ pic: `${K3}/rain`, poses: ['maryam-amazed', 'yusuf-point'] });
export const Sk3DuhaGraphic = make({ pic: `${K3}/sunrise`, poses: ['maryam-dua'] });
export const Sk3MissionGraphic = mission('maryam-happy', 'yusuf-brave', 'Make someone feel at home!');
export const Sk3NextGraphic = make({ pic: `${K3}/caravan`, poses: ['yusuf-point'] });
