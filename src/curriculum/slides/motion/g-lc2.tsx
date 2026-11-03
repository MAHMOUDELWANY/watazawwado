import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { soft, type GraphicProps } from './Stage';
import { Svg, Draw, Person, Chip, Badge } from './kit';
import { Hear } from '../Say';
import { Word, Phone, Msg, NumberTile, WordCard, Throat } from './g-lc1';

/**
 * Literacy C · Reading Franco · Lesson 2 · The Cairo Hamza. The same family-group phone as Lesson 1. The motion carries
 * the lesson's idea: a 2 is a stop in the throat, and in Cairo most 2s are a ق that the city swallowed: the q falls
 * off the word and a 2 takes its place.
 */

const CARD = '#FFFDF8';
const SHADOW = '0 18px 34px -24px rgba(60,30,10,0.6)';

/** Tant Hoda's new message, word by word; 2-words glow when `glow`. */
function Message({ glow = false }: { glow?: boolean }) {
  return (
    <Hear id="msg-2">
      <span className="flex flex-wrap gap-x-2" style={{ textAlign: 'left' }}>
        {['ne2ablak', 'bokra', '3ala', 'el', '2ahwa?'].map((w) => <Word key={w} t={w} glow={glow && w.includes('2')} size={26} />)}
      </span>
    </Hear>
  );
}

/** Earlier chat, so the phone shows a conversation that continues from Lesson 1. */
function Earlier() {
  return (
    <>
      <Msg who="Tant Hoda"><Word t="ahlan ya 7abibi! 3amel eh?" size={18} wrap /></Msg>
      <Msg sent><Word t="el 7amdolellah, tamam. w enti?" size={18} color="#fff" wrap /></Msg>
    </>
  );
}

/** A Fusha q word turning into Cairo's: the q card drops away and a gold 2 lands in its place. */
function Swallow({ x, y, rest, ar, id, delay = 0, done }: { x: number; y: number; rest: string; ar: string; id: string; delay?: number; done: boolean }) {
  return (
    <motion.div className="absolute flex items-center gap-4" style={{ left: x, top: y }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease }}>
      <span lang="ar" className="rounded-[16px] px-4" style={{ fontFamily: 'var(--font-display-ar)', fontWeight: 800, fontSize: 40, background: CARD, boxShadow: SHADOW }}>{ar}</span>
      <span className="font-sans font-black" style={{ fontSize: 28, color: soft('light') }}>→</span>
      <Hear id={id}>
        <span className="relative inline-flex items-baseline rounded-[16px] px-4" style={{ background: CARD, boxShadow: SHADOW }}>
          <motion.span className="font-sans font-black" style={{ fontSize: 40, color: done ? GOLD : CRIMSON }} initial={false} animate={done ? { y: [0, 30, 0], opacity: [1, 0, 1] } : { y: 0, opacity: 1 }} transition={{ duration: 1, delay: delay + 0.3 }}>
            {done ? '2' : 'q'}
          </motion.span>
          <span className="font-sans font-black" style={{ fontSize: 40 }}>{rest}</span>
        </span>
      </Hear>
    </motion.div>
  );
}

/* ---------- spark ---------- */

export function Lc2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Phone x={1120}>
        <Earlier />
        <Msg who="Tant Hoda" delay={0.8}><Message glow /></Msg>
      </Phone>
      <NumberTile x={900} y={360} n="2" ar="ء" size={170} delay={1.4} />
    </>
  );
}

export function Lc2MessageGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Phone x={1120} typing={lines < 1}>
        <Earlier />
        {lines >= 1 && <Msg who="Tant Hoda" delay={0.3}><Message glow={lines >= 2} /></Msg>}
      </Phone>
      {lines >= 2 && <Chip x={920} y={330} color={GOLD} delay={0.3}>ne2ablak</Chip>}
      {lines >= 3 && <Chip x={920} y={390} color={GOLD} delay={0.3}>2ahwa</Chip>}
      {lines >= 2 && <span className="pointer-events-none absolute font-sans font-black" style={{ left: 880, top: 440, fontSize: 90, color: CRIMSON }}>?</span>}
    </>
  );
}

/* ---------- zad ---------- */

/** The throat with the stop lit, then the 2 over its ء, then the stop words. */
export function Lc2StopGraphic({ lines, items }: GraphicProps) {
  const words = [{ t: 'so2al', m: 'a question', id: 'so2al' }, { t: 'sa2al', m: 'he asked', id: 'sa2al' }, { t: 'mas2ala', m: 'a matter', id: 'mas2ala' }];
  return (
    <>
      {lines >= 1 && lines < 3 && <Throat x={120} y={0} />}
      {lines >= 1 && lines < 3 && <Chip x={1120} y={300} color={GOLD} delay={0.4}>uh · oh: the stop</Chip>}
      {lines >= 2 && <NumberTile x={1400} y={300} n="2" ar="ء" size={160} delay={0.2} />}
      {lines >= 2 && <Hear id="sound-2"><span className="absolute whitespace-nowrap rounded-full px-3 font-sans font-bold" style={{ left: 1355, top: 400, fontSize: 16, background: CARD, boxShadow: `0 0 0 2px ${GOLD}`, pointerEvents: 'auto' }}>hear it</span></Hear>}
      {lines >= 3 && words.slice(0, Math.max(items, 3)).map((w, i) => <WordCard key={w.id} x={900 + i * 240} y={520} t={w.t} meaning={w.m} id={w.id} delay={i * 0.2} />)}
    </>
  );
}

/** ق words: the q falls off, a 2 lands; the Quran keeps its q. */
export function Lc2QafGraphic({ lines }: GraphicProps) {
  const rows = [{ rest: 'alb', ar: 'قلب', id: '2alb' }, { rest: 'ahwa', ar: 'قهوة', id: '2ahwa' }, { rest: 'alam', ar: 'قلم', id: '2alam' }, { rest: 'oul', ar: 'قول', id: '2oul' }];
  const shown = lines >= 3 ? 4 : lines >= 2 ? 2 : 0;
  return (
    <>
      {lines >= 1 && <NumberTile x={1420} y={240} n="ق" ar="" size={130} />}
      {lines >= 1 && <Chip x={1420} y={320} color={CRIMSON} delay={0.3}>Fusha: q</Chip>}
      {rows.slice(0, shown).map((r, i) => <Swallow key={r.id} x={900} y={180 + i * 110} rest={r.rest} ar={r.ar} id={r.id} done delay={i * 0.25} />)}
      {lines >= 4 && (
        <motion.div className="absolute flex items-center gap-3 rounded-[18px] px-5 py-2" style={{ left: 900, top: 650, background: CARD, boxShadow: `0 0 0 3px ${TEAL}` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Hear id="el-quran"><Word t="el Qur2an" size={36} glow /></Hear>
          <span className="font-sans font-bold" style={{ fontSize: 16, color: TEAL }}>keeps its q</span>
        </motion.div>
      )}
    </>
  );
}

/** Heart and dog, pen and flag: each pair on a see-saw card. */
export function Lc2PairsGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <>
          <WordCard x={1040} y={220} t="2alb" meaning="heart" id="2alb" />
          <WordCard x={1320} y={220} t="kalb" meaning="dog" id="kalb" delay={0.3} />
          <Badge x={1040} y={400} name="heart" size={80} color={CRIMSON} delay={0.5} />
          <span className="pointer-events-none absolute font-sans font-black" style={{ left: 1160, top: 250, fontSize: 40, color: soft('light') }}>≠</span>
        </>
      )}
      {lines >= 2 && (
        <>
          <WordCard x={1040} y={520} t="2alam" meaning="pen" id="2alam" />
          <WordCard x={1320} y={520} t="3alam" meaning="flag" id="3alam" delay={0.3} />
          <span className="pointer-events-none absolute font-sans font-black" style={{ left: 1160, top: 550, fontSize: 40, color: soft('light') }}>≠</span>
        </>
      )}
    </>
  );
}

/** el always apart: the article as its own tile in front of each word. */
export function Lc2ElGraphic({ lines }: GraphicProps) {
  const words = [{ t: 'beet', m: 'the house', id: 'el-beet' }, { t: 'bab', m: 'the door', id: 'el-bab' }, { t: '2ahwa', m: 'the coffee', id: 'el-2ahwa' }, { t: 'shams', m: 'the sun', id: 'el-shams' }];
  const shown = lines >= 2 ? 4 : lines >= 1 ? 1 : 0;
  return (
    <>
      {words.slice(0, shown).map((w, i) => (
        <motion.div key={w.id} className="absolute flex items-center gap-3" style={{ left: 940, top: 190 + i * 120 }} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2, duration: 0.6, ease }}>
          <span className="rounded-[14px] px-4 font-sans font-black" style={{ fontSize: 38, background: TEAL, color: '#fff' }}>el</span>
          <Hear id={w.id}><span className="rounded-[14px] px-4" style={{ background: CARD, boxShadow: SHADOW, display: 'inline-block' }}><Word t={w.t} size={38} glow /></span></Hear>
          <span className="font-sans font-semibold" style={{ fontSize: 18, color: soft('light') }}>{w.m}</span>
        </motion.div>
      ))}
      {lines >= 3 && <Chip x={1180} y={690} color={GOLD} delay={0.3}>said esh-shams · written el shams</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

export function Lc2ReadGraphic({ lines }: GraphicProps) {
  return (
    <Phone x={1130}>
      <Earlier />
      <Msg who="Tant Hoda"><Message glow={lines >= 1} /></Msg>
    </Phone>
  );
}

export function Lc2ReplyGraphic({ lines, interaction }: GraphicProps) {
  const sent = interaction;
  return (
    <>
      <Phone x={1080}>
        <Msg who="Tant Hoda"><Message /></Msg>
        {sent && <Msg sent delay={0.3}><Hear id="reply-2"><Word t="aywa, akeed! el sa3a kam?" size={22} color="#fff" wrap /></Hear></Msg>}
      </Phone>
      {lines >= 2 && (
        <>
          <Chip x={900} y={300} color={TEAL} delay={0.2}>aywa: yes</Chip>
          <Chip x={900} y={350} color={TEAL} delay={0.4}>akeed: of course</Chip>
          <Chip x={900} y={400} color={CRIMSON} delay={0.6}>el sa3a kam? what time?</Chip>
        </>
      )}
    </>
  );
}

/* ---------- ahd ---------- */

export function Lc2MissionGraphic({ lines }: GraphicProps) {
  const found = [{ t: '2alb', k: 'ق' }, { t: 'so2al', k: 'ء' }, { t: '2ahwa', k: 'ق' }];
  return (
    <>
      <Person x={1000} y={760} scale={1.0} color={TEAL} />
      {lines >= 1 && found.map((f, i) => (
        <motion.div key={f.t} className="absolute flex items-center gap-3 rounded-[18px] px-4 py-2" style={{ left: 1150, top: 240 + i * 110, background: CARD, boxShadow: SHADOW }} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.3, duration: 0.6, ease }}>
          <Word t={f.t} size={34} glow />
          {lines >= 2 && <motion.span lang="ar" className="rounded-full px-3" style={{ fontFamily: 'var(--font-display-ar)', fontWeight: 800, fontSize: 28, background: f.k === 'ق' ? CRIMSON : GOLD, color: '#fff' }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.2, type: 'spring', bounce: 0.5 }}>{f.k}</motion.span>}
        </motion.div>
      ))}
      {lines >= 1 && <Svg><Draw d="M 1040 520 Q 1080 400 1140 300" color={GOLD} width={3} dash="3 10" dur={0.8} /></Svg>}
    </>
  );
}

export function Lc2NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Phone x={1080} typing={lines < 1}>
        <Msg who="Tant Hoda"><Message /></Msg>
        <Msg sent><Word t="aywa, akeed! el sa3a kam?" size={20} color="#fff" wrap /></Msg>
        {lines >= 1 && <Msg who="Tant Hoda" delay={0.4}><Hear id="5alas"><Word t="5alas, el sa3a 5amsa!" glow={lines >= 2} size={26} wrap /></Hear></Msg>}
      </Phone>
      {lines >= 2 && <NumberTile x={900} y={360} n="5" ar="خ" show={lines >= 3} size={170} />}
      {lines >= 3 && <Chip x={900} y={470} color={CRIMSON} delay={0.4}>next time</Chip>}
    </>
  );
}
