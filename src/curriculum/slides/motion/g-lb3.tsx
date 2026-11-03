import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Cut, Chip, Badge, DEEP } from './kit';
import { Q, Book } from './g-lb1';

/**
 * Literacy B · Lesson 3 · Written, Not Read (Kids look, the Zad Kids cast). The motion carries one idea: a letter wearing
 * a little zero is crossed by a "mute" bar and the reading line jumps over it; the sound ends before it. Stretching
 * helpers (last lesson) keep their gold bars, so the child sees "stretch" and "skip" side by side.
 */

const KIDS = 'zad-kids/characters';
const CARD = '#FFFDF8';
const SHADOW = '0 18px 34px -24px rgba(60,30,10,0.6)';

/** A word card with how it is read under it; `skip` shows a crimson "skip" tag, otherwise a gold "stretch" tag. */
function ReadCard({ x, y, word, reading, skip = true, clip, delay = 0, size = 60, w = 340 }: { x: number; y: number; word: string; reading: string; skip?: boolean; clip?: string; delay?: number; size?: number; w?: number }) {
  return (
    <motion.div className="absolute flex flex-col items-center rounded-[24px]" style={{ left: x - w / 2, top: y, width: w, padding: '4px 10px 12px', background: CARD, boxShadow: SHADOW }}
      initial={{ opacity: 0, y: 24, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.35, delay }}>
      <Q size={size} clip={clip}>{word}</Q>
      <div className="flex items-center gap-3">
        <span className="font-sans font-black" style={{ fontSize: 24, color: INK_TEXT }}>{reading}</span>
        <span className="rounded-full px-3 font-sans font-black text-white" style={{ fontSize: 15, background: skip ? CRIMSON : GOLD }}>{skip ? 'skip' : 'stretch'}</span>
      </div>
    </motion.div>
  );
}

/** A big zero sign: a ring with "0" and a muted speaker. */
function Zero({ x, y, oval = false, delay = 0 }: { x: number; y: number; oval?: boolean; delay?: number }) {
  return (
    <motion.div className="absolute flex flex-col items-center" style={{ left: x - 80, top: y - 80, width: 160 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.45, delay }}>
      <span className="flex items-center justify-center" style={{ width: oval ? 120 : 140, height: oval ? 90 : 140, borderRadius: oval ? '45%' : '50%', border: `10px solid ${CRIMSON}`, background: CARD }}>
        <span className="font-sans font-black" style={{ fontSize: 40, color: CRIMSON }}>0</span>
      </span>
      <span className="mt-2 font-sans font-black" style={{ fontSize: 18, color: CRIMSON }}>{oval ? 'skip when you read on' : 'zero sound'}</span>
    </motion.div>
  );
}

/** A Mushaf paper strip for a long ayah: the line wraps inside it. */
function Paper({ x, y, w, children, delay = 0 }: { x: number; y: number; w: number; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div className="absolute rounded-[24px]" dir="rtl" style={{ left: x, top: y, width: w, padding: '14px 30px', background: '#FBF4E2', boxShadow: `inset 0 0 0 4px ${GOLD}66, ${SHADOW}`, textAlign: 'center' }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease }}>
      {children}
    </motion.div>
  );
}

const ASR = 'إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّـٰلِحَـٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ';

/* ---------- spark ---------- */

export function Lb3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <motion.div className="absolute" style={{ left: 960, top: 280 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }}>
        <span className="inline-block rounded-[28px]" style={{ padding: '0 40px', background: CARD, boxShadow: SHADOW }}><Q size={110} clip="quraysh-3">فَلْيَعْبُدُوا۟</Q></span>
      </motion.div>
      <Chip x={1160} y={480} color={CRIMSON} delay={1.2}>written… but silent</Chip>
      <Cut src={`${KIDS}/yusuf-surprised`} x={1420} y={830} h={290} delay={0.6} />
    </>
  );
}

export function Lb3RecallGraphic({ items }: GraphicProps) {
  const helpers = [{ g: 'مَـٰ', job: 'aa' }, { g: 'هُۥ', job: 'oo' }, { g: 'هِۦ', job: 'ee' }];
  return (
    <>
      <div className="absolute flex gap-8" dir="rtl" style={{ left: 900, top: 240 }}>
        {helpers.map((h, i) => {
          const on = items > i;
          return (
            <motion.div key={h.g} className="flex flex-col items-center justify-center rounded-[28px]" style={{ width: 170, height: 200, background: CARD, boxShadow: on ? `0 0 0 4px ${GOLD}, ${SHADOW}` : SHADOW }}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0, scale: on ? 1.05 : 1 }} transition={{ type: 'spring', bounce: 0.35, delay: items ? 0 : 0.2 + i * 0.15 }}>
              <Q size={90} color={GOLD}>{h.g}</Q>
              <span className="font-sans font-black" style={{ fontSize: 26, color: on ? INK_TEXT : 'transparent' }}>{h.job}</span>
            </motion.div>
          );
        })}
      </div>
      <Cut src={`${KIDS}/maryam-think`} x={1430} y={830} h={260} />
    </>
  );
}

export function Lb3MysteryGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Book x={1100} y={300} w={540} mushaf open><Q size={42} clip="quraysh-3">فَلْيَعْبُدُوا۟ رَبَّ هَـٰذَا ٱلْبَيْتِ</Q></Book>}
      <Cut src={`${KIDS}/yusuf-think`} x={860} y={830} h={280} />
      {lines >= 2 && (
        <motion.div className="absolute" style={{ left: 790, top: 450 }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-block rounded-[18px] font-sans font-black" style={{ padding: '6px 16px', fontSize: 26, background: CARD, boxShadow: SHADOW }}>"falya‘budoo-a?"</span>
        </motion.div>
      )}
      {lines >= 3 && <Cut src={`${KIDS}/jiddo-explain`} x={1430} y={830} h={320} delay={0.1} />}
      {lines >= 3 && <Chip x={1100} y={560} color={GOLD} delay={0.5}>listen: does he say it?</Chip>}
    </>
  );
}

/* ---------- zad ---------- */

export function Lb3ZeroGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Zero x={1360} y={300} />}
      {lines >= 1 && (
        <motion.span className="absolute inline-block rounded-[22px]" style={{ left: 880, top: 220, padding: '0 26px', background: CARD, boxShadow: SHADOW }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Q size={110} color={CRIMSON}>ا۟</Q>
        </motion.span>
      )}
      {lines >= 2 && <ReadCard x={1060} y={430} word="فَلْيَعْبُدُوا۟" reading="fal-ya‘-bu-doo" clip="quraysh-3" w={420} />}
      {lines >= 3 && <Badge x={1400} y={620} name="scroll" size={100} color={DEEP} delay={0.2} />}
      {lines >= 3 && <Chip x={1400} y={690} color={DEEP} delay={0.4}>written as the Companions wrote it</Chip>}
    </>
  );
}

export function Lb3GroupGraphic({ lines, items }: GraphicProps) {
  const words = [{ w: 'ءَامَنُوا۟', r: 'aa-ma-noo' }, { w: 'وَعَمِلُوا۟', r: 'wa-‘a-mi-loo' }, { w: 'وَتَوَاصَوْا۟', r: 'wa-ta-waa-saw' }];
  return (
    <>
      {lines >= 1 && items === 0 && (
        <motion.div className="absolute flex items-center gap-6" style={{ left: 900, top: 260 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="inline-block rounded-[22px] px-6" style={{ background: CARD, boxShadow: SHADOW }}><Q size={96} color={TEAL}>ـُوا۟</Q></span>
          <span className="font-sans font-black" style={{ fontSize: 26, color: soft('light') }}>"they" + a silent alif</span>
        </motion.div>
      )}
      {words.slice(0, items).map((w, i) => <ReadCard key={w.w} x={1140} y={180 + i * 190} word={w.w} reading={w.r} clip="asr-3" w={440} delay={0.1} />)}
      <Cut src={`${KIDS}/maryam-point`} x={1460} y={830} h={250} />
    </>
  );
}

/** Al-Asr 3 on the Mushaf page; four zeros counted; then two hearts: believe, and do good. */
export function Lb3AsrGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Paper x={860} y={190} w={620}><Q size={36} clip="asr-3" style={{ whiteSpace: 'normal' }}>{ASR}</Q></Paper>}
      {lines >= 1 && [1, 2, 3, 4].map((n, i) => (
        <motion.span key={n} className="absolute flex items-center justify-center rounded-full font-sans font-black text-white" style={{ left: 900 + i * 90, top: 420, width: 54, height: 54, fontSize: 24, background: CRIMSON }}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.4, type: 'spring', bounce: 0.5 }}>{n}</motion.span>
      ))}
      {lines >= 2 && (
        <>
          <Badge x={1000} y={600} name="heart" size={100} color={CRIMSON} delay={0.2} />
          <Chip x={1000} y={670} color={CRIMSON} delay={0.4}>they believed</Chip>
          <Badge x={1260} y={600} name="gift" size={100} color={TEAL} delay={0.5} />
          <Chip x={1260} y={670} color={TEAL} delay={0.7}>and they did good</Chip>
        </>
      )}
    </>
  );
}

export function Lb3AnaGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <motion.span className="absolute inline-block rounded-[22px]" style={{ left: 900, top: 210, padding: '0 30px', background: CARD, boxShadow: SHADOW }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Q size={110}>أَنَا۠</Q>
        </motion.span>
      )}
      {lines >= 1 && <Zero x={1360} y={290} oval delay={0.4} />}
      {lines >= 2 && <ReadCard x={1060} y={430} word="أَنَا۠" reading="ana (short)" w={300} />}
      {lines >= 3 && <Book x={1120} y={600} w={520} mushaf open><Q size={36} clip="kafirun-4">وَلَآ أَنَا۠ عَابِدٌ مَّا عَبَدتُّمْ</Q></Book>}
    </>
  );
}

/* ---------- athar ---------- */

export function Lb3SpotGraphic({ lines, interaction }: GraphicProps) {
  return (
    <>
      {(lines >= 1 || interaction) && (
        <>
          <Zero x={1000} y={330} />
          <motion.span className="absolute inline-block rounded-[22px] px-6" style={{ left: 1200, top: 260, background: CARD, boxShadow: `0 0 0 4px ${GOLD}, ${SHADOW}` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Q size={80} color={GOLD}>مَـٰ</Q>
          </motion.span>
          <Chip x={1270} y={430} color={GOLD} delay={0.5}>read: stretch</Chip>
        </>
      )}
      <Cut src={`${KIDS}/maryam-think`} x={1460} y={830} h={260} />
    </>
  );
}

export function Lb3AlongGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Book x={1120} y={340} w={560} mushaf open><Q size={42} clip="quraysh-3">فَلْيَعْبُدُوا۟ رَبَّ هَـٰذَا ٱلْبَيْتِ</Q></Book>}
      {lines >= 2 && (
        <>
          <Chip x={1290} y={560} color={CRIMSON} delay={0.4}>doo · skip the alif</Chip>
          <Chip x={1000} y={560} color={GOLD} delay={0.9}>haa · 2 beats</Chip>
        </>
      )}
      <Cut src={`${KIDS}/yusuf-point`} x={1460} y={830} h={260} />
    </>
  );
}

/* ---------- ahd ---------- */

export function Lb3MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Paper x={860} y={190} w={620}><Q size={36} style={{ whiteSpace: 'normal' }}>{ASR}</Q></Paper>}
      {lines >= 2 && [0, 1, 2, 3].map((i) => (
        <motion.span key={i} className="absolute flex items-center justify-center rounded-full" style={{ left: 900 + i * 110, top: 460, width: 70, height: 70, border: `6px solid ${CRIMSON}`, background: CARD }}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.3, type: 'spring', bounce: 0.5 }}>
          <span className="font-sans font-black" style={{ fontSize: 24, color: CRIMSON }}>0</span>
        </motion.span>
      ))}
      <Cut src={`${KIDS}/maryam-happy`} x={1430} y={830} h={250} delay={0.3} />
    </>
  );
}

export function Lb3NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Book x={1100} y={300} w={520} mushaf open><Q size={42} clip="fatiha-2">ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ</Q></Book>}
      {lines >= 1 && <Chip x={1100} y={520} color={TEAL} delay={0.3}>the alif with a little head: ٱ</Chip>}
      <Cut src={`${KIDS}/maryam-amazed`} x={1450} y={830} h={270} />
      {lines >= 2 && <span className="pointer-events-none absolute font-sans font-black" style={{ left: 1390, top: 470, fontSize: 70, color: DEEP }}>?</span>}
    </>
  );
}
