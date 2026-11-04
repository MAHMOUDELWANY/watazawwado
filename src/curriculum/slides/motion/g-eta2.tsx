import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, type GraphicProps } from './Stage';
import { Chip, Person } from './kit';
import { Hear } from '../Say';
import { ArText, Say } from './g-ea1';
import { StreetCard } from './g-es1';
import { Chat } from './g-eti1';
import { VoiceNote } from './g-eti3';

/**
 * Egyptian Arabic · Teens · Advanced · Lesson 2 · That's What They Say. The team chat the night before the tournament:
 * Omar (teal), Karim (gold), Nour (crimson, hijab). New device: the meme card, a picture with the saying as its caption;
 * under it the word-for-word English is struck out and the real meaning slides in.
 */

const OMAR = TEAL;
const KARIM = GOLD;
const NOUR = CRIMSON;
const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';

type Pic = 'bin' | 'clap' | 'white' | 'black' | 'rain' | 'blank';

function Picture({ pic }: { pic: Pic }) {
  return (
    <svg viewBox="0 0 300 180" width="100%" height="100%">
      {pic === 'bin' && (
        <>
          <path d="M 110 80 L 190 80 L 180 168 L 120 168 Z" fill="#9A8F86" />
          <rect x={100} y={70} width={100} height={14} rx={5} fill="#7E746C" />
          <motion.circle r={16} fill="#FFFDF8" stroke={INK_TEXT} strokeWidth={3} initial={{ cx: 40, cy: 30 }} animate={{ cx: [40, 110, 150], cy: [30, 6, 95] }} transition={{ duration: 1.1, delay: 0.6, ease: 'easeIn' }} />
          <text x={40} y={170} fontFamily="sans-serif" fontWeight={900} fontSize={22} fill={INK_TEXT}>VOTE</text>
        </>
      )}
      {pic === 'clap' && (
        <>
          <motion.path d="M 120 160 L 120 70 Q 120 50 135 50 L 140 50 L 140 160 Z" fill="#E2B48C" initial={{ rotate: -14, x: -20 }} animate={{ rotate: [-14, -4, -14, -4], x: [-20, 0, -20, 0] }} style={{ transformOrigin: '130px 160px' }} transition={{ duration: 1.2, delay: 0.6 }} />
          <motion.path d="M 180 160 L 180 70 Q 180 50 165 50 L 160 50 L 160 160 Z" fill="#D9A579" initial={{ rotate: 14, x: 20 }} animate={{ rotate: [14, 4, 14, 4], x: [20, 0, 20, 0] }} style={{ transformOrigin: '170px 160px' }} transition={{ duration: 1.2, delay: 0.6 }} />
        </>
      )}
      {(pic === 'white' || pic === 'black') && (
        <>
          <rect x={70} y={22} width={160} height={140} rx={6} fill={pic === 'white' ? '#FFFDF8' : '#2A1E18'} stroke={INK_TEXT} strokeWidth={4} />
          <rect x={86} y={38} width={128} height={18} rx={3} fill={pic === 'white' ? INK_TEXT : '#FFFDF8'} />
          {[70, 88, 106, 124, 142].map((y) => <rect key={y} x={86} y={y} width={y % 36 === 34 ? 90 : 128} height={6} rx={3} fill={pic === 'white' ? '#CDB898' : '#6B5A4C'} />)}
        </>
      )}
      {pic === 'rain' && (
        <>
          <ellipse cx={150} cy={52} rx={70} ry={30} fill="#9A8F86" /><ellipse cx={110} cy={60} rx={40} ry={24} fill="#9A8F86" /><ellipse cx={192} cy={62} rx={38} ry={22} fill="#9A8F86" />
          {[100, 130, 160, 190, 215].map((x, i) => (
            <motion.rect key={x} x={x} width={4} height={18} rx={2} fill={TEAL} initial={{ y: 84, opacity: 0 }} animate={{ y: [84, 150], opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 + i * 0.15, ease: 'linear' }} />
          ))}
          <circle cx={150} cy={160} r={14} fill="#FFFDF8" stroke={INK_TEXT} strokeWidth={3} />
        </>
      )}
      {pic === 'blank' && <text x={150} y={110} textAnchor="middle" fontFamily="sans-serif" fontWeight={900} fontSize={64} fill="#CDB898">?</text>}
    </svg>
  );
}

/** A meme card centred on x, top at y: picture, the saying as caption, then the literal line (struck once `real` shows) and the real meaning. */
function Meme({ x, y, pic, text, id, literal, real, step = 0, w = 300, delay = 0, tilt = 0 }: {
  x: number; y: number; pic: Pic; text: string; id?: string; literal?: string; real?: string; step?: number; w?: number; delay?: number; tilt?: number;
}) {
  const cap = <ArText size={w > 260 ? 28 : 24} color="#fff">{text}</ArText>;
  return (
    <>
      <motion.div className="absolute overflow-hidden rounded-[16px]" style={{ left: x - w / 2, top: y, width: w, background: '#FFFDF8', border: `5px solid ${INK_TEXT}`, boxShadow: SHADOW }} initial={{ opacity: 0, y: 20, rotate: tilt - 4 }} animate={{ opacity: 1, y: 0, rotate: tilt }} transition={{ type: 'spring', bounce: 0.35, duration: 0.8, delay }}>
        <div style={{ height: w * 0.6 }}><Picture pic={pic} /></div>
        <div className="flex justify-center" style={{ background: INK_TEXT, padding: '2px 0 6px' }}>{id ? <Hear id={id}>{cap}</Hear> : cap}</div>
      </motion.div>
      {literal && step >= 1 && (
        <motion.span className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap font-sans font-bold" style={{ left: x, top: y + w * 0.6 + 70, fontSize: 18, color: '#7E746C' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
          word for word: “{literal}”
          {step >= 2 && <motion.span className="absolute left-0 top-1/2 h-[3px] w-full" style={{ background: CRIMSON, transformOrigin: 'left' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: 0.2, ease }} />}
        </motion.span>
      )}
      {real && step >= 2 && <Chip x={x} y={y + w * 0.6 + 106} color={TEAL} delay={0.7}>{real}</Chip>}
    </>
  );
}

/* ---------- spark ---------- */

export function Eta2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Meme x={1160} y={300} w={200} pic="clap" text="إيد لوحدها…" tilt={-6} delay={0.2} />
      <Meme x={1420} y={290} w={200} pic="rain" text="الحلو ما يكملش" tilt={6} delay={0.4} />
      <Meme x={1290} y={200} w={220} pic="bin" text="اللي فات مات" delay={0.6} />
    </>
  );
}

export function Eta2RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <StreetCard x={1150} y={230} word="معاك حق، بس…" id="maak-haa-bass" size={32} />
      <Person x={950} y={800} scale={1} color={NOUR} hijab />
      <Person x={1350} y={800} scale={1} color={OMAR} />
      {lines >= 2 && (
        <>
          <motion.span className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-[14px] font-sans font-bold" style={{ left: 1150, top: 320, padding: '8px 16px', fontSize: 17, background: '#FFFDF8', color: '#7E746C', boxShadow: SHADOW }} initial={{ opacity: 1, scale: 1 }} animate={{ opacity: 0, scale: 0.3 }} transition={{ duration: 0.6, delay: 1.4, ease }}>I think that… because… and also… but…</motion.span>
          <Say x={950} y={570} text="اللي فات مات!" width={190} size={28} accent delay={1.8} />
        </>
      )}
      {lines >= 3 && <Chip x={1150} y={430} color={GOLD} delay={0.2}>3–4 words = everybody knows</Chip>}
    </>
  );
}

export function Eta2ChatGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const msgs = [
    { t: 'اللي فات مات!', who: 'Karim', c: KARIM },
    { t: 'إيد لوحدها ما تسقفش', who: 'Nour', c: NOUR },
    { t: 'يا خبر أبيض!', who: 'Omar', c: OMAR },
  ];
  return (
    <>
      <Chat msgs={msgs} n={lines >= 2 ? 3 : 1} />
      {lines >= 3 && <Chip x={860} y={420} color={CRIMSON} delay={0.2}>but what do they mean?</Chip>}
    </>
  );
}

/* ---------- zad ---------- */

export function Eta2StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Person x={900} y={800} scale={0.95} color={NOUR} hijab />
      <Person x={1150} y={800} scale={0.95} color={OMAR} />
      <Person x={1400} y={800} scale={0.95} color={KARIM} />
      {k === 1 && <Say key="a" x={1400} y={580} id="story-1" text="اللي فات مات! نور الكابتن، وأنا معاها." align="right" width={420} size={22} accent delay={0.2} />}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={900} y={580} id="story-2" text="إيد لوحدها ما تسقفش يا جماعة. بكرة كلنا مع بعض!" width={500} size={20} delay={0.2} />
          <Say x={1150} y={410} id="story-3" text="يا خبر أبيض! كريم بقى طيب؟!" width={320} size={23} accent delay={1.8} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <div className="pointer-events-none absolute" style={{ left: 1000, top: 170, width: 300, height: 180 }}><Picture pic="rain" /></div>
          <Say x={1400} y={580} id="story-4" text="الماتش اتلغى… مطر. الحلو ما يكملش!" align="right" width={410} size={22} delay={0.6} />
        </React.Fragment>
      )}
    </>
  );
}

export function Eta2FatGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Meme x={1100} y={170} pic="bin" text="اللي فات مات" id="elli-fat" literal="what passed, died" real="forget it, move on" step={lines >= 2 ? 2 : 1} />
      {lines >= 2 && <Person x={1430} y={800} scale={0.95} color={KARIM} delay={0.2} />}
      {lines >= 3 && <Chip x={1100} y={680} color={CRIMSON} delay={0.2}>about things, never a person</Chip>}
    </>
  );
}

/** One hand: silence. Two hands: a clap burst. */
function Hands({ x, y, two }: { x: number; y: number; two: boolean }) {
  return (
    <>
      <div className="pointer-events-none absolute" style={{ left: x - 120, top: y - 100, width: 240, height: 144 }}><Picture pic={two ? 'clap' : 'blank'} /></div>
      {!two && (
        <motion.svg className="pointer-events-none absolute" style={{ left: x - 30, top: y - 90, overflow: 'visible' }} width={60} height={110} initial={{ rotate: -10 }} animate={{ rotate: [-10, 10, -10] }} transition={{ duration: 1, repeat: 2 }}>
          <path d="M 10 110 L 10 20 Q 10 0 30 0 L 40 0 L 40 110 Z" fill="#E2B48C" />
        </motion.svg>
      )}
      {two && [0, 60, 120, 180, 240, 300].map((a) => (
        <motion.span key={a} className="pointer-events-none absolute rounded-full" style={{ left: x - 3, top: y - 70, width: 6, height: 26, background: GOLD, transformOrigin: '3px 60px', rotate: a }} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0, 1, 0] }} transition={{ duration: 1.2, delay: 0.6 }} />
      ))}
    </>
  );
}

export function Eta2HandGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Meme x={960} y={170} pic="clap" text="إيد لوحدها ما تسقفش" id="eed" literal="a hand alone doesn't clap" real="nobody wins alone" step={lines >= 3 ? 2 : 1} />
      {lines >= 2 && <Hands x={1360} y={300} two={false} />}
      {lines >= 2 && <Chip x={1360} y={340} delay={0.4}>one hand: silence</Chip>}
      {lines >= 2 && <Hands x={1360} y={560} two />}
      {lines >= 2 && <Chip x={1360} y={600} color={GOLD} delay={1}>two hands: clap!</Chip>}
    </>
  );
}

export function Eta2NewsGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Meme x={1340} y={190} w={280} pic="white" text="يا خبر أبيض!" id="abyad" literal="oh, white news!" real="no way! (good)" step={2} />
      {lines >= 2 && <Meme x={960} y={190} w={280} pic="black" text="يا خبر إسود!" id="iswed" literal="oh, black news!" real="oh no! (bad)" step={2} delay={0.1} />}
      {lines >= 3 && <Chip x={1150} y={660} color={GOLD} delay={0.2}>one colour changes everything</Chip>}
    </>
  );
}

export function Eta2HelwGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const list: [string, string][] = [['kit washed ✓', TEAL], ['team ready ✓', TEAL], ['…rain ✗', CRIMSON]];
  return (
    <>
      <Meme x={960} y={170} pic="rain" text="الحلو ما يكملش" id="helw" literal="the sweet doesn't finish" real="something always goes wrong" step={lines >= 3 ? 2 : 1} />
      {lines >= 2 && list.map(([t, c], i) => <Chip key={t} x={1380} y={240 + i * 80} color={c} delay={0.3 + i * 0.6}>{t}</Chip>)}
      {lines >= 3 && <Chip x={1380} y={500} color={GOLD} delay={1}>…so smile</Chip>}
    </>
  );
}

/** The wow: a whole paragraph folds into three words. */
export function Eta2ShortGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const folded = lines >= 2;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[18px] font-sans font-bold" style={{ left: 840, top: 190, width: 620, padding: '18px 24px', fontSize: 22, lineHeight: 1.45, background: '#FFFDF8', color: INK_TEXT, boxShadow: SHADOW, transformOrigin: '50% 100%' }}
        initial={{ opacity: 0, y: 16 }} animate={folded ? { opacity: [1, 1, 0], scaleY: [1, 0.12, 0.05], scaleX: [1, 0.6, 0.3], y: [0, 160, 200] } : { opacity: 1, y: 0 }} transition={folded ? { duration: 1.4, delay: 0.4, ease } : { duration: 0.6, ease }}>
        “I lost the vote, and I&apos;m a bit sad. But I won&apos;t let it ruin the team. Nour is captain, I&apos;m with her, so let&apos;s just forget about it and move on.”
      </motion.div>
      {folded && <StreetCard x={1150} y={430} word="اللي فات مات." id="short" size={44} delay={1.6} />}
      {lines >= 3 && (
        <>
          <Chip x={950} y={560} delay={0.2}>32 words</Chip>
          <Chip x={1150} y={560} color={GOLD} delay={0.4}>fold</Chip>
          <Chip x={1350} y={560} color={TEAL} delay={0.6}>3 words</Chip>
        </>
      )}
    </>
  );
}

/* ---------- athar ---------- */

export function Eta2TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const msgs = [{ t: 'نور جابت تلات جوان في التمرين!', who: 'teacher', c: OMAR }];
  const opts = ['اللي فات مات', 'إيد لوحدها…', 'يا خبر أبيض!', 'الحلو ما يكملش'];
  return (
    <>
      <Chat msgs={msgs} n={1} id="news-1" />
      {lines >= 2 && opts.map((o, i) => (
        <div key={o} className="absolute" style={{ left: 870, top: 280 + i * 80, transform: 'translate(-50%, -50%)' }}>
          <motion.span className="inline-flex rounded-full" style={{ padding: '0 16px 2px', background: [KARIM, NOUR, OMAR, '#C0603A'][i], boxShadow: SHADOW }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 + i * 0.15, ease }}><ArText size={22} color="#fff">{o}</ArText></motion.span>
        </div>
      ))}
    </>
  );
}

export function Eta2MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Meme x={1150} y={180} pic="blank" text="…" w={320} />
      {lines >= 2 && <Chip x={1150} y={590} color={TEAL} delay={0.2}>make it · send it · did they laugh?</Chip>}
    </>
  );
}

export function Eta2NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={900} y={800} scale={1} color={KARIM} />
      {lines >= 2 && (
        <>
          <div className="absolute" style={{ left: 1180, top: 300, transform: 'translate(-50%, -50%)' }}><Hear id="fast"><span className="inline-block" style={{ width: 400, height: 64 }} /></Hear></div>
          <VoiceNote x={1180} y={300} delay={0.1} />
          <Chip x={1290} y={350} color={KARIM} delay={0.8}>0:40 · no breath</Chip>
          <Person x={1250} y={800} scale={0.95} color={OMAR} delay={0.2} />
          <Person x={1420} y={800} scale={0.95} color={NOUR} hijab delay={0.3} />
          <Say x={1250} y={580} text="؟؟" width={90} size={28} delay={1.4} />
        </>
      )}
      {lines >= 3 && <Chip x={1010} y={440} color={CRIMSON} delay={0.2}>next: say it again, slower!</Chip>}
    </>
  );
}
