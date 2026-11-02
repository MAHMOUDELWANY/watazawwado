import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, useReduce, type GraphicProps } from './Stage';
import { Svg, Draw, Chip, Badge, Person, DEEP } from './kit';
import { Hear } from '../Say';

/**
 * Literacy C · Reading Franco · Lesson 1 · Numbers That Talk. Adults paper stage; the running scene is a phone: Tant
 * Hoda texts the family group from Cairo. The motion carries one idea: a number in a word is a letter, chosen because it
 * looks like the Arabic letter behind it (7 = ح, 3 = ع turned around). Words play on tap.
 */

const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800 };
const CARD = '#FFFDF8';
const SHADOW = '0 18px 34px -24px rgba(60,30,10,0.6)';
const NUM = /([2357])/;

/** A Franco word with its number letters picked out in gold when `glow`. */
function Word({ t, glow = false, size = 30, color = INK_TEXT, wrap = false }: { t: string; glow?: boolean; size?: number; color?: string; wrap?: boolean }) {
  return (
    <span className="font-sans font-extrabold" style={{ fontSize: size, color, whiteSpace: wrap ? 'normal' : 'nowrap' }}>
      {t.split(NUM).map((p, i) => (NUM.test(p) && p.length === 1
        ? <motion.span key={i} initial={false} animate={{ color: glow ? '#C98A22' : color, textShadow: glow ? `0 0 18px ${GOLD}` : '0 0 0 transparent' }} transition={{ duration: 0.5 }}>{p}</motion.span>
        : <React.Fragment key={i}>{p}</React.Fragment>))}
    </span>
  );
}

/** The phone: Tant Hoda's chat in the family group. Children are the messages, stacked from the top. */
function Phone({ x = 1060, y = 170, children, delay = 0, typing = false }: { x?: number; y?: number; children?: React.ReactNode; delay?: number; typing?: boolean }) {
  return (
    <motion.div className="absolute" style={{ left: x, top: y, width: 380, height: 610, borderRadius: 48, background: '#1F1612', padding: 12, boxShadow: '0 40px 70px -40px rgba(40,20,10,0.8)' }}
      initial={{ opacity: 0, y: 60, rotate: 3 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.9, delay, ease }}>
      <div className="relative flex h-full flex-col overflow-hidden" style={{ borderRadius: 38, background: '#F4EEE4' }}>
        <div className="flex items-center gap-3" style={{ padding: '22px 18px 12px', background: TEAL }}>
          <span className="flex items-center justify-center rounded-full font-sans font-black text-white" style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.25)', fontSize: 18 }}>F</span>
          <div className="flex flex-col">
            <span className="font-sans font-bold text-white" style={{ fontSize: 18 }}>Family</span>
            <span className="font-sans text-white" style={{ fontSize: 13, opacity: 0.85 }}>{typing ? 'Tant Hoda is typing…' : 'Tant Hoda, Mama, you'}</span>
          </div>
        </div>
        <div className="flex flex-col gap-3" style={{ padding: 16 }}>{children}</div>
      </div>
    </motion.div>
  );
}

/** A chat bubble in the phone: received (left, paper) or sent (right, teal). */
function Msg({ children, sent = false, delay = 0, who }: { children: React.ReactNode; sent?: boolean; delay?: number; who?: string }) {
  return (
    <motion.div className="flex flex-col" style={{ alignSelf: sent ? 'flex-end' : 'flex-start', maxWidth: 300 }}
      initial={{ opacity: 0, y: 16, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.3, duration: 0.7, delay }}>
      {who && <span className="font-sans font-bold" style={{ fontSize: 13, color: CRIMSON, marginLeft: 10 }}>{who}</span>}
      <div style={{ padding: '10px 16px', borderRadius: sent ? '20px 20px 4px 20px' : '20px 20px 20px 4px', background: sent ? TEAL : CARD, color: sent ? '#fff' : INK_TEXT, boxShadow: SHADOW }}>{children}</div>
    </motion.div>
  );
}

/** Tant Hoda's first message, word by word: plain words can be underlined, number words glow. */
function FirstMessage({ glow = false, plain = false, id = 'msg-1' }: { glow?: boolean; plain?: boolean; id?: string }) {
  const words = [{ t: 'ahlan' }, { t: 'ya' }, { t: '7abibi!' }, { t: '3amel' }, { t: 'eh?' }];
  return (
    <Hear id={id}>
      <span className="flex flex-wrap gap-x-2" style={{ textAlign: 'left' }}>
        {words.map((w) => {
          const num = NUM.test(w.t);
          return (
            <span key={w.t} className="relative">
              <Word t={w.t} glow={glow && num} size={26} />
              {plain && !num && <motion.span className="absolute left-0 right-0 rounded-full" style={{ bottom: -2, height: 3, background: TEAL }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, ease }} />}
            </span>
          );
        })}
      </span>
    </Hear>
  );
}

/** A big tile: a number letter with its Arabic letter as a shadow behind it. `flip` shows ع turned into 3. */
function NumberTile({ x, y, n, ar, show = true, flip = false, size = 190, delay = 0 }: { x: number; y: number; n: string; ar: string; show?: boolean; flip?: boolean; size?: number; delay?: number }) {
  return (
    <motion.div className="absolute flex items-center justify-center rounded-[34px]" style={{ left: x - size / 2, top: y - size / 2, width: size, height: size, background: CARD, boxShadow: SHADOW }}
      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.35, delay }}>
      <motion.span lang="ar" className="absolute" style={{ ...AR, fontSize: size * 0.62, color: DEEP, lineHeight: 1 }}
        initial={false} animate={{ opacity: show ? 0.22 : 0, scaleX: flip ? -1 : 1 }} transition={{ duration: 0.9, ease }}>{ar}</motion.span>
      <span className="relative font-sans font-black" style={{ fontSize: size * 0.56, color: CRIMSON, lineHeight: 1 }}>{n}</span>
    </motion.div>
  );
}

/** A word card: Franco on top (number letters in gold), the meaning under it; plays on tap. */
function WordCard({ x, y, t, meaning, id, delay = 0, w = 220 }: { x: number; y: number; t: string; meaning: string; id: string; delay?: number; w?: number }) {
  return (
    <motion.div className="absolute flex flex-col items-center rounded-[22px]" style={{ left: x - w / 2, top: y, width: w, padding: '12px 8px', background: CARD, boxShadow: SHADOW }}
      initial={{ opacity: 0, y: 24, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.3, delay }}>
      <Hear id={id}><Word t={t} glow size={36} /></Hear>
      <span className="font-sans font-semibold" style={{ fontSize: 17, color: soft('light') }}>{meaning}</span>
    </motion.div>
  );
}

/** The side of a head, the throat lit where the sound is made (the same drawing as Reading Arabic's throat page). */
function Throat({ x = 0, y = 0, breath = false, mouth = false }: { x?: number; y?: number; breath?: boolean; mouth?: boolean }) {
  const reduce = useReduce();
  return (
    <Svg>
      <motion.g transform={`translate(${x} ${y})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
        <path d="M 860 800 C 870 720, 930 700, 955 690 L 955 600 C 905 590, 880 545, 880 485 C 880 410, 935 360, 1000 360 C 1070 360, 1120 410, 1120 480 C 1120 500, 1140 520, 1132 532 C 1124 544, 1112 540, 1110 556 C 1108 590, 1080 600, 1040 598 L 1032 690 C 1060 700, 1120 720, 1130 800 Z"
          fill="#EAD2B6" stroke="#C9A889" strokeWidth={3} />
        <motion.circle cx={mouth ? 1118 : 990} cy={mouth ? 545 : 625} r={mouth ? 16 : 28} fill={mouth ? TEAL : GOLD} style={{ filter: `drop-shadow(0 0 14px ${mouth ? TEAL : GOLD})` }}
          initial={{ opacity: 0 }} animate={reduce ? { opacity: 0.9 } : { opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: reduce ? 0 : Infinity }} />
        {breath && [0, 1, 2].map((i) => (
          <motion.path key={i} d={`M ${1150 + i * 26} ${505 - i * 16} q 18 ${28 + i * 16} 0 ${56 + i * 32}`} fill="none" stroke={mouth ? TEAL : CRIMSON} strokeWidth={mouth ? 3 : 6} strokeLinecap="round"
            initial={{ opacity: 0 }} animate={reduce ? { opacity: 1 } : { opacity: [0, 1, 0] }} transition={{ duration: 1.4, delay: 0.3 + i * 0.2, repeat: reduce ? 0 : Infinity }} />
        ))}
      </motion.g>
    </Svg>
  );
}

/* ---------- spark ---------- */

/** The phone rises; Tant Hoda's first words arrive, and the 7 in them glows over its Arabic letter. */
export function Lc1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Phone x={1080} delay={0.3}>
        <Msg who="Tant Hoda" delay={1.3}><Word t="ahlan ya 7abibi!" glow size={26} /></Msg>
      </Phone>
      <motion.span lang="ar" className="pointer-events-none absolute" style={{ ...AR, left: 880, top: 220, fontSize: 220, color: DEEP, opacity: 0.12 }}
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 0.12, y: 0 }} transition={{ duration: 1.4, delay: 1.8, ease }}>ح</motion.span>
      <motion.span className="pointer-events-none absolute font-sans font-black" style={{ left: 890, top: 280, fontSize: 170, color: CRIMSON }}
        initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4, delay: 2.2 }}>7</motion.span>
    </>
  );
}

/** The message arrives; what you can read is underlined; the numbers glow; then they lift out as a question. */
export function Lc1MessageGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Phone x={1080} typing={lines < 1}>
        <motion.span className="self-center rounded-full font-sans" style={{ fontSize: 13, padding: '4px 12px', background: 'rgba(31,22,18,0.08)', color: soft('light') }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>You joined the group</motion.span>
        {lines >= 1 && <Msg who="Tant Hoda" delay={0.4}><FirstMessage glow={lines >= 3} plain={lines === 2} /></Msg>}
      </Phone>
      {lines === 2 && <Chip x={900} y={360} color={TEAL} delay={0.4}>you can read these</Chip>}
      {lines >= 3 && (
        <>
          <NumberTile x={880} y={300} n="7" ar="ح" show={false} size={150} delay={0.2} />
          <NumberTile x={880} y={520} n="3" ar="ع" show={false} size={150} delay={0.4} />
        </>
      )}
      {lines >= 4 && (
        <>
          <Chip x={880} y={395} color={CRIMSON} delay={0.2}>a letter?</Chip>
          <Chip x={880} y={615} color={CRIMSON} delay={0.4}>a letter?</Chip>
        </>
      )}
    </>
  );
}

/** Why a number: the English keyboard has no key for two sounds; the Arabic letters appear behind 7 and 3, and ع turns. */
export function Lc1WhyGraphic({ lines, interaction }: GraphicProps) {
  const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  return (
    <>
      {lines >= 1 && (
        <motion.div className="absolute flex flex-col items-center gap-2" style={{ left: 820, top: 560, width: 660 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
          {rows.map((r) => (
            <div key={r} className="flex gap-2">
              {[...r].map((c) => <span key={c} className="flex items-center justify-center rounded-[8px] font-sans font-bold" style={{ width: 52, height: 52, fontSize: 22, background: CARD, color: INK_TEXT, boxShadow: '0 6px 12px -8px rgba(60,30,10,0.6)' }}>{c}</span>)}
            </div>
          ))}
          <span className="mt-1 font-sans font-bold uppercase" style={{ fontSize: 14, letterSpacing: '0.16em', color: soft('light') }}>no key for ح or ع</span>
        </motion.div>
      )}
      <NumberTile x={1150} y={330} n="7" ar="ح" show={lines >= 2 || interaction} />
      <NumberTile x={1400} y={330} n="3" ar="ع" show={lines >= 2 || interaction} flip={interaction} delay={0.15} />
      {interaction && (
        <>
          <Chip x={1150} y={450} color={TEAL} delay={0.4}>same hook</Chip>
          <Chip x={1400} y={450} color={TEAL} delay={0.8}>ع turned around</Chip>
        </>
      )}
    </>
  );
}

/* ---------- zad ---------- */

/** An Arabic word drops its letters on to English keys; four sounds are left with no key, and numbers take them. */
export function Lc1WhatGraphic({ lines, items }: GraphicProps) {
  const letters = [{ ar: 'م', en: 'M' }, { ar: 'ص', en: 'a s' }, { ar: 'ر', en: 'r' }];
  const left = [{ ar: 'ع', n: '3' }, { ar: 'ح', n: '7' }, { ar: 'خ', n: '5' }, { ar: 'ء', n: '2' }];
  const plain = 'btdsmnlrkf';
  const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  return (
    <>
      {lines >= 1 && lines < 2 && (
        <div className="absolute flex items-end gap-6" dir="rtl" style={{ left: 940, top: 260 }}>
          {letters.map((l, i) => (
            <div key={l.ar} className="flex flex-col items-center gap-3">
              <motion.span lang="ar" style={{ ...AR, fontSize: 110, color: DEEP, lineHeight: 1 }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }}>{l.ar}</motion.span>
              <motion.span className="font-sans font-black" style={{ fontSize: 44, color: TEAL }} initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.25, ease }}>{l.en}</motion.span>
            </div>
          ))}
          <motion.span className="self-center font-sans font-black" style={{ fontSize: 40, color: CRIMSON, marginRight: 24 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>= Masr</motion.span>
        </div>
      )}
      {lines >= 2 && (
        <motion.div className="absolute flex flex-col items-center gap-2" style={{ left: 820, top: 520, width: 660 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
          {rows.map((r) => (
            <div key={r} className="flex gap-2">
              {[...r].map((c, i) => {
                const on = plain.includes(c);
                return (
                  <motion.span key={c} className="flex items-center justify-center rounded-[8px] font-sans font-bold" style={{ width: 52, height: 52, fontSize: 22, color: INK_TEXT, boxShadow: '0 6px 12px -8px rgba(60,30,10,0.6)' }}
                    initial={{ background: CARD }} animate={{ background: on ? '#BFE6EC' : CARD }} transition={{ delay: on ? 0.4 + i * 0.05 : 0 }}>{c}</motion.span>
                );
              })}
            </div>
          ))}
        </motion.div>
      )}
      {lines >= 3 && left.map((l, i) => {
        const x = 900 + i * 160;
        const paired = items > i;
        return (
          <React.Fragment key={l.ar}>
            <motion.div className="absolute flex flex-col items-center" style={{ left: x - 60, top: 200, width: 120 }} initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.15, type: 'spring', bounce: 0.4 }}>
              <span className="flex items-center justify-center rounded-[24px]" style={{ width: 110, height: 110, background: CARD, boxShadow: paired ? `0 0 0 4px ${GOLD}, ${SHADOW}` : `0 0 0 3px ${CRIMSON}55, ${SHADOW}` }}>
                <span lang="ar" style={{ ...AR, fontSize: 70, color: DEEP }}>{l.ar}</span>
              </span>
              {!paired && <span className="mt-2 font-sans font-bold uppercase" style={{ fontSize: 13, letterSpacing: '0.14em', color: CRIMSON }}>no key</span>}
            </motion.div>
            {lines >= 4 && (
              <motion.span className="absolute flex items-center justify-center rounded-[16px] font-sans font-black" style={{ left: x - 36, top: 360, width: 72, height: 72, fontSize: 46, background: paired ? GOLD : CARD, color: paired ? '#fff' : CRIMSON, boxShadow: SHADOW }}
                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.2, type: 'spring', bounce: 0.4 }}>{l.n}</motion.span>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

/** Six words you can already read, each a card that plays; the written vowels light up. */
export function Lc1PlainGraphic({ lines, items }: GraphicProps) {
  const words = [
    { t: 'ana', m: 'I', id: 'ana' }, { t: 'enta', m: 'you (to a man)', id: 'enta' }, { t: 'baba', m: 'dad', id: 'baba' },
    { t: 'mama', m: 'mum', id: 'mama' }, { t: 'Masr', m: 'Egypt', id: 'masr' }, { t: 'tamam', m: 'OK, fine', id: 'tamam' },
  ];
  const n = Math.max(items, lines >= 2 ? 3 : 0);
  return (
    <>
      {lines >= 1 && <Badge x={1140} y={230} name="phone" size={90} color={TEAL} />}
      {words.slice(0, n).map((w, i) => <WordCard key={w.id} x={900 + (i % 3) * 240} y={320 + Math.floor(i / 3) * 170} t={w.t} meaning={w.m} id={w.id} delay={items ? 0.1 : i * 0.15} />)}
      {lines >= 3 && <Chip x={1140} y={680} color={TEAL} delay={0.3}>tap a word to hear it</Chip>}
    </>
  );
}

/** ع turns around and becomes 3; the throat lights where it is made; then the words that carry it. */
export function Lc1AynGraphic({ lines, items }: GraphicProps) {
  const words = [{ t: 'ma3a', m: 'with', id: 'ma3a' }, { t: '3ala', m: 'on', id: '3ala' }, { t: '3arabi', m: 'Arabic', id: '3arabi' }, { t: '3eesh', m: 'bread, life', id: '3eesh' }];
  const showWords = items > 0;
  return (
    <>
      {!showWords && (
        <>
          <div className="absolute" style={{ left: lines >= 2 ? 1330 : 1300, top: 300, transition: 'left 0.8s cubic-bezier(0.22,1,0.36,1)' }}>
            <NumberTile x={0} y={0} n="3" ar="ع" show flip={lines >= 1} size={220} />
          </div>
          {lines >= 2 && <Throat x={-60} y={-30} />}
          {lines >= 2 && <Chip x={930} y={720} color={GOLD}>squeeze here</Chip>}
          {lines >= 2 && <div className="absolute" style={{ left: 1200, top: 450 }}><Hear id="sound-3"><span className="rounded-full font-sans font-bold text-white" style={{ padding: '8px 18px', fontSize: 20, background: CRIMSON }}>🔊 the 3 sound</span></Hear></div>}
          {lines >= 3 && (
            <motion.div className="absolute flex items-center gap-4" style={{ left: 1170, top: 560 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease }}>
              <span className="font-sans font-black" style={{ fontSize: 56, color: soft('light') }}>a</span>
              <span className="font-sans font-black" style={{ fontSize: 34, color: CRIMSON }}>→</span>
              <Word t="3a" glow size={56} />
            </motion.div>
          )}
        </>
      )}
      {showWords && (
        <>
          <NumberTile x={1140} y={260} n="3" ar="ع" show flip size={150} />
          {words.slice(0, items).map((w, i) => <WordCard key={w.id} x={910 + (i % 2) * 460} y={400 + Math.floor(i / 2) * 160} t={w.t} meaning={w.m} id={w.id} w={240} delay={0.1} />)}
        </>
      )}
      {lines >= 4 && !showWords && <Chip x={1140} y={180} color={TEAL}>ma3a · 3ala · 3arabi</Chip>}
    </>
  );
}

/** 7 slides on to ح's hook; the throat pushes hard air; a soft h from the mouth beside it; then the words. */
export function Lc1HaGraphic({ lines, items }: GraphicProps) {
  const words = [{ t: '7abibi', m: 'my dear', id: '7abibi' }, { t: 'saba7', m: 'morning', id: 'saba7' }, { t: '7elw', m: 'sweet, nice', id: '7elw' }, { t: '7aga', m: 'a thing', id: '7aga' }];
  if (items > 0) {
    return (
      <>
        <NumberTile x={1140} y={260} n="7" ar="ح" size={150} />
        {words.slice(0, items).map((w, i) => <WordCard key={w.id} x={910 + (i % 2) * 460} y={400 + Math.floor(i / 2) * 160} t={w.t} meaning={w.m} id={w.id} w={240} delay={0.1} />)}
      </>
    );
  }
  return (
    <>
      <motion.span lang="ar" className="pointer-events-none absolute" style={{ ...AR, left: 1180, top: 150, fontSize: 260, color: DEEP, lineHeight: 1 }}
        initial={false} animate={{ opacity: lines >= 1 ? 0.18 : 1, x: lines >= 2 ? 60 : 0, scale: lines >= 2 ? 0.6 : 1 }} transition={{ duration: 0.9, ease }}>ح</motion.span>
      {lines >= 1 && (
        <motion.span className="pointer-events-none absolute font-sans font-black" style={{ left: 1200, top: 180, fontSize: 230, color: CRIMSON, lineHeight: 1 }}
          initial={{ opacity: 0, x: 120 }} animate={{ opacity: 1, x: lines >= 2 ? 90 : 0, scale: lines >= 2 ? 0.6 : 1 }} transition={{ duration: 0.9, ease }}>7</motion.span>
      )}
      {lines >= 2 && <Throat x={-60} y={-30} breath />}
      {lines >= 2 && <div className="absolute" style={{ left: 1190, top: 470 }}><Hear id="sound-7"><span className="rounded-full font-sans font-bold text-white" style={{ padding: '8px 18px', fontSize: 20, background: CRIMSON }}>🔊 the 7 sound</span></Hear></div>}
      {lines >= 3 && (
        <>
          <Chip x={930} y={720} color={CRIMSON}>7: strong, from the throat</Chip>
          <Chip x={1330} y={600} color={TEAL} delay={0.3}>h: soft, from the mouth</Chip>
        </>
      )}
      {lines >= 4 && <div className="absolute" style={{ left: 1210, top: 660 }}><Hear id="7abibi"><Word t="7abibi" glow size={52} /></Hear></div>}
    </>
  );
}

/** Two pairs on a balance: one squeeze or one breath turns hope into work, here into henna. */
export function Lc1PairsGraphic({ lines, items }: GraphicProps) {
  const pairs = [
    { a: 'amal', am: 'hope', ia: 'amal', b: '3amal', bm: 'work', ib: '3amal' },
    { a: 'hena', am: 'here', ia: 'hena', b: '7enna', bm: 'henna', ib: '7enna' },
  ];
  const rows = Math.max(items, lines >= 2 ? 1 : 0, lines >= 3 ? 2 : 0);
  return (
    <>
      {pairs.slice(0, rows).map((p, i) => {
        const y = 250 + i * 250;
        return (
          <React.Fragment key={p.a}>
            <WordCard x={940} y={y} t={p.a} meaning={p.am} id={p.ia} w={240} />
            <motion.span className="absolute font-sans font-black" style={{ left: 1110, top: y + 20, fontSize: 40, color: GOLD }} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}>≠</motion.span>
            <WordCard x={1320} y={y} t={p.b} meaning={p.bm} id={p.ib} w={240} delay={0.8} />
          </React.Fragment>
        );
      })}
      {lines >= 1 && rows === 0 && (
        <motion.div className="absolute flex items-center gap-6" style={{ left: 900, top: 360 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="font-sans font-black" style={{ fontSize: 120, color: soft('light') }}>a</span>
          <span className="font-sans font-black" style={{ fontSize: 60, color: GOLD }}>≠</span>
          <span className="font-sans font-black" style={{ fontSize: 120, color: CRIMSON }}>3</span>
          <span className="font-sans font-black" style={{ fontSize: 120, color: soft('light'), marginLeft: 40 }}>h</span>
          <span className="font-sans font-black" style={{ fontSize: 60, color: GOLD }}>≠</span>
          <span className="font-sans font-black" style={{ fontSize: 120, color: CRIMSON }}>7</span>
        </motion.div>
      )}
    </>
  );
}

/* ---------- athar ---------- */

/** The message again, every word on its own: the learner taps the ones with a number letter. */
export function Lc1ReadGraphic({ lines }: GraphicProps) {
  return (
    <Phone x={1130}>
      <Msg who="Tant Hoda"><FirstMessage glow={lines >= 2} /></Msg>
    </Phone>
  );
}

/** The reply is typed into the box, word by word, then sent: the first message in Franco. */
export function Lc1ReplyGraphic({ lines, interaction }: GraphicProps) {
  const typed = lines >= 3 || interaction ? 'el 7amdolellah, tamam. w enti?' : lines >= 2 ? 'el 7amdolellah, tamam.' : '';
  const sent = interaction;
  return (
    <>
      <Phone x={1080}>
        <Msg who="Tant Hoda"><FirstMessage /></Msg>
        {sent && <Msg sent delay={0.3}><Hear id="reply"><Word t={typed} size={22} color="#fff" wrap /></Hear></Msg>}
      </Phone>
      {lines >= 1 && !sent && (
        <motion.div className="absolute flex items-center gap-2" style={{ left: 1104, top: 700, width: 332 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex-1 rounded-full font-sans" style={{ padding: '10px 16px', minHeight: 44, background: CARD, boxShadow: `0 0 0 2px ${TEAL}` }}>
            <motion.span key={typed} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Word t={typed || ' '} size={17} /></motion.span>
            <motion.span className="inline-block" style={{ width: 2, height: 20, background: TEAL, marginLeft: 2, verticalAlign: 'middle' }} animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          </div>
          <span className="flex items-center justify-center rounded-full font-sans font-black text-white" style={{ width: 44, height: 44, background: TEAL }}>➤</span>
        </motion.div>
      )}
      {lines >= 2 && <Chip x={900} y={300} color={CRIMSON} delay={0.3}>el 7amdolellah: thank God</Chip>}
      {lines >= 3 && <Chip x={900} y={350} color={TEAL} delay={0.3}>w enti? and you?</Chip>}
    </>
  );
}

/* ---------- ahd ---------- */

/** Three places where Franco lives; a word with a 3 or a 7 flies back from each into your list. */
export function Lc1MissionGraphic({ lines }: GraphicProps) {
  const spots = [{ x: 900, y: 260, icon: 'chat', label: 'the family group', w: '7abibi' }, { x: 1380, y: 260, icon: 'globe', label: 'comments', w: '3ala' }, { x: 1400, y: 600, icon: 'phone', label: 'a friend', w: 'saba7' }];
  return (
    <>
      <Person x={1130} y={760} scale={1.0} color={TEAL} />
      {lines >= 1 && spots.map((s, i) => (
        <React.Fragment key={s.icon}>
          <Svg><Draw d={`M 1130 520 L ${s.x} ${s.y}`} color={GOLD} width={3} dash="3 10" delay={0.2 + i * 0.3} dur={0.8} /></Svg>
          <Badge x={s.x} y={s.y} name={s.icon} size={92} color={i === 0 ? CRIMSON : TEAL} delay={0.5 + i * 0.3} />
          <Chip x={s.x} y={s.y + 56} delay={0.7 + i * 0.3}>{s.label}</Chip>
          {lines >= 2 && (
            <motion.div className="absolute" style={{ left: s.x - 40, top: s.y - 20 }} initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: 860 - s.x, y: 520 + i * 54 - s.y, opacity: 1 }} transition={{ duration: 1.4, delay: 0.4 + i * 0.4, ease }}>
              <Word t={s.w} glow size={30} />
            </motion.div>
          )}
        </React.Fragment>
      ))}
      {lines >= 2 && <span className="absolute font-sans font-bold uppercase" style={{ left: 820, top: 480, fontSize: 14, letterSpacing: '0.16em', color: soft('light') }}>my words</span>}
    </>
  );
}

/** A new message with a 2 in it; the 2 glows over a letter we have not met yet. */
export function Lc1NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Phone x={1080} typing={lines < 1}>
        <Msg who="Tant Hoda"><FirstMessage /></Msg>
        <Msg sent><Word t="el 7amdolellah, tamam. w enti?" size={20} color="#fff" wrap /></Msg>
        {lines >= 1 && <Msg who="Tant Hoda" delay={0.4}><Hear id="ne2ablak"><Word t="ne2ablak?" glow={lines >= 2} size={30} /></Hear></Msg>}
      </Phone>
      {lines >= 2 && <NumberTile x={900} y={360} n="2" ar="ء" show={lines >= 3} size={170} />}
      {lines >= 3 && <Chip x={900} y={470} color={CRIMSON} delay={0.4}>next time</Chip>}
    </>
  );
}
