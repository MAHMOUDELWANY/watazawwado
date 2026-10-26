import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Svg, Draw, Person, Chip, Badge, DEEP } from './kit';
import { Hear, QURAN_FONT, useQuranFont } from '../Say';

/**
 * Tajweed · Level 1 · Lesson 1 · Every Letter Has a Right. The Adults paper stage with the Mushaf's green and gold as
 * this subject's accent. Ayat are Tanzil Uthmani text in Amiri Quran and play the reciter on tap; rules appear as colour
 * layers on the real text. The Prophet ﷺ, Jibril and the companions are never drawn: they are names on points of light.
 */

const MUSHAF = '#0E5A4B';
const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800, direction: 'rtl' };

/** Uthmani text in the Mushaf font; playable when `clip` names one of the page's clips. */
function Q({ children, size, color = INK_TEXT, clip, style }: { children: React.ReactNode; size: number; color?: string; clip?: string; style?: React.CSSProperties }) {
  useQuranFont();
  const text = <span lang="ar" dir="rtl" style={{ fontFamily: QURAN_FONT, fontSize: size, lineHeight: 1.9, color, whiteSpace: 'nowrap', ...style }}>{children}</span>;
  return clip ? <Hear id={clip}>{text}</Hear> : text;
}

/** A Mushaf panel: deep green with a gold frame. */
function Panel({ x, y, w, h, children, delay = 0 }: { x: number; y: number; w: number; h: number; children?: React.ReactNode; delay?: number }) {
  return (
    <motion.div className="absolute flex flex-col items-center justify-center rounded-[18px]" style={{ left: x, top: y, width: w, height: h, background: MUSHAF, boxShadow: `inset 0 0 0 6px ${GOLD}, inset 0 0 0 10px ${MUSHAF}, inset 0 0 0 12px ${GOLD}88, 0 30px 60px -30px rgba(10,40,30,0.7)` }}
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay, ease }}>
      {children}
    </motion.div>
  );
}

/** A point of light with a name under it (people who are never drawn). */
function Light({ x, y, label, delay = 0, size = 22, above = false }: { x: number; y: number; label: string; delay?: number; size?: number; above?: boolean }) {
  return (
    <motion.div className={`pointer-events-none absolute flex items-center ${above ? 'flex-col-reverse' : 'flex-col'}`} style={{ left: x - 80, top: above ? y - size / 2 - 40 : y - size / 2, width: 160 }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay, ease }}>
      <span className="rounded-full" style={{ width: size, height: size, background: '#FFF4D6', boxShadow: `0 0 26px 10px ${GOLD}AA` }} />
      <span className={`${above ? 'mb-3' : 'mt-3'} text-center font-sans font-bold`} style={{ fontSize: 17, lineHeight: 1.2, color: INK_TEXT }}>{label}</span>
    </motion.div>
  );
}

/* ---------- spark ---------- */

export function Tj1CoverGraphic(_: GraphicProps) {
  const reduce = useReduce();
  return (
    <>
      <Panel x={880} y={300} w={600} h={260} delay={0.2}>
        <Q size={64} color="#F6E3B8">قُلْ هُوَ ٱللَّهُ أَحَدٌ</Q>
      </Panel>
      <Svg>
        {[0, 1, 2].map((i) => (
          <motion.path key={i} d={`M ${900 + i * 30} 640 Q ${1180} ${600 - i * 30} ${1460 - i * 30} 640`} fill="none" stroke={GOLD} strokeWidth={3} opacity={0.6}
            initial={{ pathLength: 0 }} animate={reduce ? { pathLength: 1 } : { pathLength: [0, 1, 1], opacity: [0.6, 0.6, 0] }} transition={{ duration: 2.4, delay: 0.8 + i * 0.4, repeat: reduce ? 0 : Infinity }} />
        ))}
      </Svg>
    </>
  );
}

/** A side view of the mouth: ق sits at the very back, ك a little forward; one small move changes heart into dog. */
export function Tj1QalbGraphic({ lines }: GraphicProps) {
  const front = lines >= 2;
  const pt = front ? { x: 1150, y: 392 } : { x: 1018, y: 448 };
  return (
    <>
      <Svg>
        <Draw d="M 1470 430 Q 1420 380 1300 368 Q 1140 356 1040 410 Q 975 450 968 640" color={INK_TEXT} width={6} dur={1.4} opacity={0.75} />
        <Draw d="M 1470 470 Q 1390 505 1250 505 Q 1110 505 1050 545 Q 1018 575 1018 640" color={INK_TEXT} width={6} delay={0.3} dur={1.4} opacity={0.75} />
        <Draw d="M 1470 430 Q 1500 450 1470 470" color={CRIMSON} width={6} delay={0.8} dur={0.5} />
      </Svg>
      <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ left: 1430, top: 520, fontSize: 14, letterSpacing: '0.16em', color: soft('light') }}>lips</span>
      <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ left: 900, top: 660, fontSize: 14, letterSpacing: '0.16em', color: soft('light') }}>throat</span>
      {lines >= 1 && (
        <motion.span className="pointer-events-none absolute rounded-full" style={{ left: -18, top: -18, width: 36, height: 36, background: front ? TEAL : CRIMSON, boxShadow: `0 0 26px 8px ${front ? TEAL : CRIMSON}66` }}
          initial={false} animate={{ x: pt.x, y: pt.y }} transition={{ duration: 1, ease }} />
      )}
      {lines === 1 && (
        <>
          <motion.div className="absolute flex items-center gap-5" style={{ left: 860, top: 200 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Hear id="qalb"><span lang="ar" style={{ ...AR, fontSize: 90, color: CRIMSON }}>قَلْب</span></Hear>
            <span className="font-sans font-bold" style={{ fontSize: 26, color: INK_TEXT }}>heart</span>
          </motion.div>
          <Badge x={1300} y={250} name="heart" size={80} />
        </>
      )}
      {lines >= 2 && (
        <motion.div key="kalb" className="absolute flex items-center gap-5" style={{ left: 860, top: 200 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Hear id="kalb"><span lang="ar" style={{ ...AR, fontSize: 90, color: TEAL }}>كَلْب</span></Hear>
          <span className="font-sans font-bold" style={{ fontSize: 26, color: INK_TEXT }}>dog</span>
          {lines >= 3 && <span className="font-sans font-semibold" style={{ fontSize: 20, color: soft('light') }}>· one small move, a new word</span>}
        </motion.div>
      )}
      {lines >= 3 && <Svg><Draw d="M 1018 448 Q 1080 400 1150 392" color={GOLD} width={3} dash="4 8" dur={0.8} /></Svg>}
      {lines >= 4 && <Chip x={1200} y={740} color={MUSHAF} delay={0.2}>that care, on the Quran: tajweed · تَجْوِيد</Chip>}
    </>
  );
}

/* ---------- zad ---------- */

/** The word tarteelan given its time, then the chain of recitation: points of light from Jibril to your teacher, to you. */
export function Tj1TarteelGraphic({ lines }: GraphicProps) {
  const chain = [
    { x: 840, label: 'Jibril' },
    { x: 980, label: 'The Prophet ﷺ' },
    { x: 1120, label: 'his companions' },
    { x: 1260, label: 'teacher after teacher' },
    { x: 1400, label: 'your teacher' },
  ];
  return (
    <>
      {lines >= 1 && (
        <div className="absolute flex justify-center gap-7" style={{ left: 820, top: 190, width: 680, direction: 'rtl' }}>
          {['تَ', 'رْ', 'تِ', 'ي', 'لًا'].map((c, i) => (
            <motion.span key={i} style={{ fontFamily: QURAN_FONT, fontSize: 96, lineHeight: 1.6, color: i === 0 ? CRIMSON : DEEP }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.35, duration: 0.5 }}>{c}</motion.span>
          ))}
        </div>
      )}
      {lines >= 1 && <Chip x={1160} y={380} color={MUSHAF} delay={2}>each letter in its place</Chip>}
      {lines >= 2 && (
        <>
          <Svg><Draw d={`M ${chain[0].x} 560 L ${chain[lines >= 3 ? 4 : 2].x} 560`} color={GOLD} width={3} dur={1.4} /></Svg>
          {chain.slice(0, lines >= 3 ? 5 : 3).map((c, i) => <Light key={c.label} x={c.x} y={560} label={c.label} above={i % 2 === 1} delay={0.2 + i * 0.3} />)}
        </>
      )}
      {lines >= 3 && (
        <>
          <Svg><Draw d="M 1400 560 Q 1440 600 1450 640" color={GOLD} width={3} delay={1.6} dur={0.6} /></Svg>
          <Person x={1450} y={770} scale={0.6} color={TEAL} glow delay={1.9} />
          <Chip x={1360} y={720} color={TEAL} delay={2.1}>you</Chip>
        </>
      )}
    </>
  );
}

/** One letter alone (its right: where it starts, how it sounds), then its neighbours arrive and pull on it (its due). */
export function Tj1RightGraphic({ lines, items }: GraphicProps) {
  if (lines === 0) return null;
  const due = items >= 2;
  return (
    <>
      <motion.div className="absolute flex items-center justify-center" style={{ left: 1060, top: 330, width: 160, height: 160 }} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}>
        <Q size={110} color={CRIMSON}>نْ</Q>
      </motion.div>
      {(lines >= 2 || items >= 1) && (
        <>
          <motion.span className="pointer-events-none absolute rounded-full" style={{ left: 1030, top: 300, width: 220, height: 220, border: `4px solid ${GOLD}` }} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7, ease }} />
          <Chip x={1140} y={250} color={GOLD} delay={0.3}>its right · حَقّه</Chip>
        </>
      )}
      {(lines >= 3 || due) && (
        <>
          <motion.div className="absolute" style={{ left: 1330, top: 350 }} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease }}><Q size={84} color={INK_TEXT}>مِ</Q></motion.div>
          <motion.div className="absolute" style={{ left: 870, top: 350 }} initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2, ease }}><Q size={84} color={INK_TEXT}>بَ</Q></motion.div>
          <Svg>
            <Draw d="M 1320 420 L 1260 420" color={TEAL} width={4} delay={0.6} dur={0.4} />
            <Draw d="M 960 420 L 1020 420" color={TEAL} width={4} delay={0.8} dur={0.4} />
          </Svg>
          <Chip x={1140} y={560} color={TEAL} delay={1}>its due · مُسْتَحَقّه</Chip>
        </>
      )}
      {due && (
        <motion.p className="pointer-events-none absolute m-0 text-center font-sans font-semibold" style={{ left: 840, top: 640, width: 600, fontSize: 21, color: INK_TEXT }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          In مِنۢ بَعْد, the noon before baa is read as a meem. Neighbours change how a letter is said.
        </motion.p>
      )}
    </>
  );
}

/** Two readers, both honoured: the fluent one beside a line of light; the halting one with two rewards; then the road between. */
export function Tj1StumbleGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <>
          <Person x={940} y={620} scale={0.95} color={MUSHAF} />
          <Svg><Draw d="M 870 380 L 1010 380" color={GOLD} width={3} glow /></Svg>
          <Chip x={940} y={330} color={GOLD} delay={0.3}>skilled: with the noble scribes</Chip>
          <Person x={1330} y={620} scale={0.95} color={TEAL} delay={0.2} />
        </>
      )}
      {lines >= 2 && [0, 1].map((i) => (
        <motion.span key={i} className="pointer-events-none absolute rounded-full" style={{ left: 1290 + i * 60, top: 360, width: 26, height: 26, background: GOLD, boxShadow: `0 0 22px 6px ${GOLD}AA` }}
          initial={{ scale: 0, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.3 + i * 0.4 }} />
      ))}
      {lines >= 2 && <Chip x={1330} y={410} color={TEAL} delay={1}>struggling: two rewards</Chip>}
      {lines >= 3 && (
        <>
          <Svg><Draw d="M 880 720 L 1400 720" color={INK_TEXT} width={3} dash="2 10" opacity={0.5} /><Draw d="M 1400 720 L 880 720" color={GOLD} width={5} dur={1.6} delay={0.4} /></Svg>
          <span className="pointer-events-none absolute font-sans font-bold" style={{ left: 1360, top: 740, fontSize: 18, color: soft('light') }}>halting</span>
          <span className="pointer-events-none absolute font-sans font-bold" style={{ left: 860, top: 740, fontSize: 18, color: GOLD }}>skill</span>
          <motion.span className="pointer-events-none absolute rounded-full" style={{ left: 1388, top: 708, width: 24, height: 24, background: TEAL }} initial={{ scale: 0 }} animate={{ scale: 1 }} />
        </>
      )}
    </>
  );
}

/** Two cards: a clear mistake breaks the word itself; a hidden one leaves the word whole but dims its colour. */
export function Tj1MistakesGraphic({ lines, items }: GraphicProps) {
  const card = (x: number, title: string, color: string, delay: number, children: React.ReactNode) => (
    <motion.div className="absolute flex flex-col items-center rounded-[22px]" style={{ left: x, top: 220, width: 320, height: 420, padding: '20px 0', background: '#FFFDF8', boxShadow: `0 0 0 4px ${color}, 0 24px 44px -26px rgba(60,30,10,0.6)` }}
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease }}>
      <span className="font-sans font-black uppercase" style={{ fontSize: 18, letterSpacing: '0.16em', color }}>{title}</span>
      {children}
    </motion.div>
  );
  return (
    <>
      {(lines >= 2 || items >= 1) && card(1160, 'Clear', CRIMSON, 0, (
        <>
          <div className="relative mt-10">
            <span lang="ar" style={{ ...AR, fontSize: 96, color: INK_TEXT }}>قَلْب</span>
            <motion.span className="absolute" style={{ left: -10, top: 66, height: 6, background: CRIMSON, transform: 'rotate(-12deg)' }} initial={{ width: 0 }} animate={{ width: 200 }} transition={{ delay: 0.6, duration: 0.5 }} />
          </div>
          <span lang="ar" style={{ ...AR, fontSize: 56, color: CRIMSON }}>كَلْب</span>
          <span className="mt-4 px-6 text-center font-sans font-semibold" style={{ fontSize: 18, color: INK_TEXT }}>the word changes</span>
        </>
      ))}
      {(lines >= 3 || items >= 2) && card(800, 'Hidden', GOLD, 0.1, (
        <>
          <motion.div className="mt-10" initial={{ opacity: 1 }} animate={{ opacity: [1, 0.45] }} transition={{ delay: 0.8, duration: 1 }}>
            <Q size={70}>أَحَدٌ</Q>
          </motion.div>
          <span className="px-6 text-center font-sans font-semibold" style={{ fontSize: 18, color: INK_TEXT }}>the word stays; the bounce at the end is missing</span>
        </>
      ))}
      {lines === 1 && items === 0 && (
        <Svg>
          <Draw d="M 980 420 L 1300 420" color={INK_TEXT} width={4} />
          <Draw d="M 1140 420 L 1140 620" color={INK_TEXT} width={4} delay={0.3} />
          <motion.g initial={{ rotate: 0 }} animate={{ rotate: -6 }} style={{ transformOrigin: '1140px 420px' }} transition={{ delay: 0.8, duration: 0.8 }}>
            <circle cx={1000} cy={470} r={34} fill={CRIMSON} opacity={0.85} />
            <circle cx={1280} cy={460} r={20} fill={GOLD} opacity={0.85} />
          </motion.g>
        </Svg>
      )}
      {items >= 1 && <Chip x={1320} y={680} color={CRIMSON}>لَحْن جَلِيّ · fix first</Chip>}
      {items >= 2 && <Chip x={960} y={680} color={GOLD}>لَحْن خَفِيّ · rule by rule</Chip>}
    </>
  );
}

/** The wow: Al-Ikhlas on the Mushaf panel; each item switches on one layer of sound in its own colour. */
export function Tj1LayersGraphic({ lines, items }: GraphicProps) {
  if (lines === 0) return null;
  const bounce = items >= 1 ? CRIMSON : undefined;
  const silent = items >= 2;
  const merge = items >= 3;
  const base = '#F6E3B8';
  const hot = (on: boolean | string | undefined, c: string) => (on ? { color: c, textShadow: `0 0 18px ${c}` } : undefined);
  return (
    <>
      <Panel x={830} y={200} w={660} h={490}>
        <div className="flex flex-col items-center" style={{ gap: 0 }}>
          <Q size={58} color={base} clip="ikhlas-1">قُلْ هُوَ ٱللَّهُ أَحَ‍<span style={hot(bounce, '#FF8A7A')}>‍دٌ</span></Q>
          <Q size={58} color={base} clip="ikhlas-2">ٱللَّهُ ٱ<span style={silent ? { color: 'rgba(246,227,184,0.22)' } : undefined}>ل‍</span><span style={hot(silent, '#7FE3D2')}>‍صَّ‍</span>‍مَ‍<span style={hot(bounce, '#FF8A7A')}>‍دُ</span></Q>
          <Q size={58} color={base} clip="ikhlas-3">لَمْ يَلِدْ وَلَمْ يُولَ‍<span style={hot(bounce, '#FF8A7A')}>‍دْ</span></Q>
          <Q size={58} color={base} clip="ikhlas-4">وَلَمْ يَكُ‍<span style={hot(merge, GOLD)}>‍ن لَّ‍</span>‍هُۥ كُفُوًا أَحَ‍<span style={hot(bounce, '#FF8A7A')}>‍دٌۢ</span></Q>
        </div>
      </Panel>
      {lines >= 2 && items === 0 && <Chip x={1160} y={720} color={MUSHAF} delay={0.3}>tap an ayah to hear the reciter</Chip>}
      <div className="pointer-events-none absolute flex gap-3" style={{ left: 840, top: 712 }}>
        {items >= 1 && <motion.span className="rounded-full px-4 py-2 font-sans font-bold text-white" style={{ fontSize: 17, background: CRIMSON }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>the bounce · qalqalah</motion.span>}
        {items >= 2 && <motion.span className="rounded-full px-4 py-2 font-sans font-bold text-white" style={{ fontSize: 17, background: TEAL }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>the silent laam</motion.span>}
        {items >= 3 && <motion.span className="rounded-full px-4 py-2 font-sans font-bold" style={{ fontSize: 17, background: GOLD, color: INK_TEXT }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>the merge · idgham</motion.span>}
      </div>
    </>
  );
}

/** The isti'adha as a doorway: an arch of light the reading walks through, at the start of a surah or in its middle. */
export function Tj1IstiadhaGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <>
          <Svg>
            <Draw d="M 1000 760 L 1000 420 Q 1000 260 1140 260 Q 1280 260 1280 420 L 1280 760" color={GOLD} width={6} glow dur={1.6} />
          </Svg>
          <motion.div className="absolute text-center" style={{ left: 840, top: 180, width: 600 }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <Hear id="istiadha"><span lang="ar" style={{ ...AR, fontSize: 38, color: DEEP }}>أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ</span></Hear>
          </motion.div>
          <Person x={1140} y={740} scale={0.9} color={TEAL} delay={1.2} />
        </>
      )}
      {lines >= 2 && (
        <>
          <Chip x={900} y={520} color={MUSHAF} delay={0.2}>start of a surah</Chip>
          <Chip x={1380} y={520} color={MUSHAF} delay={0.4}>or its middle</Chip>
          <Chip x={1140} y={762} color={GOLD} delay={0.6}>once, when you begin</Chip>
        </>
      )}
    </>
  );
}

/** 114 surahs light up with the basmalah, all but one: At-Tawbah stays dark; then a mid-surah start shows it optional. */
export function Tj1BasmalahGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  if (lines === 0) return null;
  const cols = 19;
  return (
    <>
      <motion.div className="absolute text-center" style={{ left: 840, top: 170, width: 640 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Q size={48} color={MUSHAF} clip="fatiha-1">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</Q>
      </motion.div>
      <div className="absolute grid" style={{ left: 840, top: 300, width: 640, gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6, direction: 'rtl' }}>
        {Array.from({ length: 114 }, (_, i) => {
          const tawbah = i === 8;
          const on = !tawbah;
          return (
            <motion.span key={i} className="block rounded-[4px]" style={{ height: 26, boxShadow: tawbah && lines >= 2 ? `0 0 0 3px ${CRIMSON}` : undefined }}
              initial={{ background: 'rgba(31,22,18,0.1)' }} animate={{ background: on ? GOLD : 'rgba(31,22,18,0.25)' }} transition={{ delay: reduce ? 0 : 0.4 + i * 0.012, duration: 0.3 }} />
          );
        })}
      </div>
      {lines >= 2 && <Chip x={1290} y={460} color={CRIMSON} delay={0.3}>Surah 9 · At-Tawbah</Chip>}
      {lines >= 3 && (
        <>
          <motion.div className="absolute rounded-[14px]" style={{ left: 940, top: 560, width: 440, height: 150, background: '#FFFDF8', boxShadow: '0 18px 34px -24px rgba(60,30,10,0.6)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {[0, 1, 2, 3].map((r) => <span key={r} className="absolute rounded-full" style={{ left: 30, right: 30, top: 28 + r * 28, height: 6, background: 'rgba(31,22,18,0.12)' }} />)}
            <motion.span className="absolute rounded-full" style={{ right: 26, top: 74, width: 18, height: 18, background: TEAL }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }} />
          </motion.div>
          <Chip x={1160} y={730} color={TEAL} delay={0.8}>starting mid-surah: basmalah optional</Chip>
        </>
      )}
    </>
  );
}

/* ---------- athar ---------- */

/** You and your teacher, the first ayah between you; the reciter first, then your voice. */
export function Tj1ReciteGraphic({ lines, interaction }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <Panel x={900} y={190} w={520} h={150}>
          <Q size={52} color="#F6E3B8" clip="ikhlas-1">قُلْ هُوَ ٱللَّهُ أَحَدٌ</Q>
        </Panel>
      )}
      <Person x={960} y={760} scale={1} color={MUSHAF} />
      <Person x={1360} y={760} scale={1} color={TEAL} delay={0.15} />
      <Chip x={960} y={780} delay={0.3}>teacher</Chip>
      <Chip x={1360} y={780} color={TEAL} delay={0.4}>you</Chip>
      {lines >= 2 && (
        <Svg>
          {[0, 1, 2].map((i) => <Draw key={i} d={`M ${1300 - i * 14} ${470 + i * 26} Q ${1160} ${430 + i * 26} ${1020 + i * 14} ${470 + i * 26}`} color={interaction ? TEAL : GOLD} width={3} delay={0.2 + i * 0.2} dur={0.8} />)}
        </Svg>
      )}
    </>
  );
}

/* ---------- ahd ---------- */

/** Seven days: each one listen, then recite; an ear waits for the bounce. */
export function Tj1MissionGraphic({ lines }: GraphicProps) {
  const days = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  return (
    <>
      {lines >= 1 && (
        <div className="absolute flex gap-3" style={{ left: 820, top: 260 }}>
          {days.map((d, i) => (
            <motion.div key={d} className="flex flex-col items-center gap-2 rounded-[16px]" style={{ width: 86, padding: '12px 0', background: '#FFFDF8', boxShadow: '0 14px 28px -20px rgba(60,30,10,0.6)' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5, ease }}>
              <span className="font-sans font-bold" style={{ fontSize: 16, color: soft('light') }}>{d}</span>
              <span className="flex items-center justify-center rounded-full font-sans font-black text-white" style={{ width: 30, height: 30, fontSize: 14, background: GOLD }}>1</span>
              <span className="flex items-center justify-center rounded-full font-sans font-black text-white" style={{ width: 30, height: 30, fontSize: 14, background: TEAL }}>2</span>
            </motion.div>
          ))}
        </div>
      )}
      {lines >= 1 && (
        <div className="pointer-events-none absolute flex gap-6" style={{ left: 840, top: 470 }}>
          <span className="font-sans font-bold" style={{ fontSize: 18, color: GOLD }}>1 · listen to the reciter</span>
          <span className="font-sans font-bold" style={{ fontSize: 18, color: TEAL }}>2 · recite it yourself</span>
        </div>
      )}
      {lines >= 2 && (
        <>
          <Badge x={1000} y={630} name="bell" size={96} color={MUSHAF} delay={0.2} />
          <motion.div className="absolute" style={{ left: 1080, top: 590 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <Q size={50} color={INK_TEXT}>أَحَ‍<span style={{ color: CRIMSON }}>‍دْ</span></Q>
            <span className="ml-4 font-sans font-bold" style={{ fontSize: 20, color: CRIMSON }}>· hear the bounce?</span>
          </motion.div>
        </>
      )}
    </>
  );
}

/** The five qalqalah letters, each one bouncing. */
export function Tj1NextGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  const letters = ['ق', 'ط', 'ب', 'ج', 'د'];
  return (
    <>
      {lines >= 1 && (
        <motion.div className="absolute" style={{ left: 880, top: 220 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Q size={58} color={INK_TEXT}>أَحَ‍<span style={{ color: CRIMSON }}>‍دْ</span> · ٱلصَّمَ‍<span style={{ color: CRIMSON }}>‍دْ</span> · يُولَ‍<span style={{ color: CRIMSON }}>‍دْ</span> · أَحَ‍<span style={{ color: CRIMSON }}>‍دْ</span></Q>
        </motion.div>
      )}
      {lines >= 2 && (
        <div className="absolute flex gap-8" style={{ left: 880, top: 420, direction: 'rtl' }}>
          {letters.map((l, i) => (
            <motion.span key={l} style={{ ...AR, fontSize: 120, lineHeight: 1, color: i % 2 ? CRIMSON : MUSHAF }}
              initial={{ opacity: 0, y: 40 }} animate={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -34, 0] }}
              transition={reduce ? { delay: i * 0.15 } : { delay: 0.3 + i * 0.18, duration: 0.7, repeat: Infinity, repeatDelay: 1.6, ease: 'easeOut' }}>{l}</motion.span>
          ))}
        </div>
      )}
      {lines >= 3 && <Chip x={1160} y={680} strong delay={0.4}>qalqalah · قَلْقَلَة</Chip>}
    </>
  );
}
