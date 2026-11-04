import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Chip, Person, Svg, Draw } from './kit';
import { Hear } from '../Say';
import { ArText, Say, Skyline, Building, ADAM, SAYED } from './g-ea1';

/**
 * Egyptian Arabic · Sounds · Lesson 1 · Where Did the Qaf Go? One device for the Sounds course: twins. Every word has a
 * book card (Fusha: cream paper with a spine, ink) and a street card (Cairo: a teal shop sign). The letter that moves sits
 * on a dial between them; its sound tag turns from the book sound to the Cairo one (q → ʼ, j → g). The letter on the
 * page never changes, only how it is said: that is the lesson.
 */

const CARD = '#FFFDF8';
const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';
const BOOK = '#5A4636';
const CAIRO = TEAL;
const WAITER = '#7A5BA6';

/** The book card: a Fusha word on paper with a spine. */
export function BookCard({ x, y, word, id, sound, delay = 0, size = 44, dim = false }: { x: number; y: number; word: string; id?: string; sound?: string; delay?: number; size?: number; dim?: boolean }) {
  const body = (
    <span className="inline-flex flex-col items-center rounded-r-[14px]" style={{ padding: '4px 22px 6px', background: '#F3E7D2', borderLeft: `8px solid ${BOOK}`, boxShadow: SHADOW }}>
      <ArText size={size} color={BOOK}>{word}</ArText>
      {sound && <span className="font-sans font-bold" style={{ fontSize: 18, color: BOOK }}>{sound}</span>}
    </span>
  );
  return (
    <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: dim ? 0.35 : 1, y: 0 }} transition={{ duration: 0.6, delay, ease }}>{id ? <Hear id={id}>{body}</Hear> : body}</motion.div>
    </div>
  );
}

/** The street card: the Cairo word on a teal shop sign. */
export function StreetCard({ x, y, word, id, sound, delay = 0, size = 44 }: { x: number; y: number; word: string; id?: string; sound?: string; delay?: number; size?: number }) {
  const body = (
    <span className="inline-flex flex-col items-center rounded-[14px]" style={{ padding: '4px 22px 6px', background: CAIRO, boxShadow: `0 0 0 4px ${CARD}, ${SHADOW}` }}>
      <ArText size={size} color="#fff">{word}</ArText>
      {sound && <span className="font-sans font-bold" style={{ fontSize: 18, color: '#E7FAFC' }}>{sound}</span>}
    </span>
  );
  return (
    <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.7, rotate: -4 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.45, duration: 0.8, delay }}>{id ? <Hear id={id}>{body}</Hear> : body}</motion.div>
    </div>
  );
}

/** A pair: book card → arrow → street card, on one row at height y (book on the right, read right to left). */
export function Twin({ y, f, fid, fs, e, eid, es, delay = 0, xr = 1360, xl = 980, size = 42 }: { y: number; f: string; fid?: string; fs?: string; e: string; eid?: string; es?: string; delay?: number; xr?: number; xl?: number; size?: number }) {
  return (
    <>
      <BookCard x={xr} y={y} word={f} id={fid} sound={fs} delay={delay} size={size} />
      <Svg><Draw d={`M ${xr - 110} ${y} L ${xl + 110} ${y}`} color={CAIRO} width={3} dash="4 8" delay={delay + 0.3} dur={0.5} /></Svg>
      <StreetCard x={xl} y={y} word={e} id={eid} sound={es} delay={delay + 0.6} size={size} />
    </>
  );
}

/** The dial: one letter, its book sound and its Cairo sound; `cairo` turns the needle. */
export function Dial({ x, y, letter, book, cairo, on, delay = 0 }: { x: number; y: number; letter: string; book: string; cairo: string; on: boolean; delay?: number }) {
  return (
    <>
      <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-full" style={{ left: x - 80, top: y - 80, width: 160, height: 160, background: CARD, boxShadow: `0 0 0 6px ${on ? CAIRO : BOOK}, ${SHADOW}` }}
        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4, delay }}>
        <ArText size={92} color={on ? CAIRO : BOOK}>{letter}</ArText>
      </motion.div>
      <Chip x={x + 140} y={y - 20} color={on ? soft('light') : BOOK} delay={delay + 0.2}>book: {book}</Chip>
      <Chip x={x - 150} y={y - 20} color={on ? CAIRO : soft('light')} delay={delay + 0.4}>Cairo: {cairo}</Chip>
    </>
  );
}

/* ---------- spark ---------- */

export function Es1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Skyline />
      <Twin y={300} f="قَهْوَةٌ" fs="qahwa" e="قهوة" es="'ahwa" delay={0.5} />
      <Twin y={450} f="جَمِيلٌ" fs="jamiil" e="جميل" es="gamiil" delay={1.1} />
      <Person x={1000} y={800} scale={1} color={ADAM} delay={0.2} />
      <Person x={1350} y={800} scale={1} color={SAYED} delay={0.3} />
    </>
  );
}

export function Es1LostGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Skyline opacity={lines >= 2 ? 0.35 : 0.15} />
      <Person x={1000} y={800} scale={1.05} color={ADAM} />
      <BookCard x={1000} y={420} word="أُرِيدُ قَهْوَةً" delay={0.3} size={34} />
      {lines >= 2 && (
        <>
          <Person x={1360} y={800} scale={1} color={WAITER} delay={0.1} />
          <motion.div className="pointer-events-none absolute rounded-[12px]" style={{ left: 1170, top: 690, width: 380, height: 34, background: '#8B5A36' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
          <Say x={1360} y={540} text="!" width={70} size={30} delay={0.5} />
        </>
      )}
      {lines >= 3 && (
        <>
          <Chip x={1180} y={230} color={CRIMSON} delay={0.2}>two sounds</Chip>
          <motion.span className="pointer-events-none absolute flex items-center justify-center rounded-full" style={{ left: 1080, top: 260, width: 90, height: 90, background: CARD, boxShadow: `0 0 0 4px ${CRIMSON}` }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}><ArText size={56} color={CRIMSON}>ق</ArText></motion.span>
          <motion.span className="pointer-events-none absolute flex items-center justify-center rounded-full" style={{ left: 1200, top: 260, width: 90, height: 90, background: CARD, boxShadow: `0 0 0 4px ${CRIMSON}` }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: 'spring' }}><ArText size={56} color={CRIMSON}>ج</ArText></motion.span>
        </>
      )}
    </>
  );
}

/* ---------- zad ---------- */

export function Es1StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Skyline opacity={0.2} />
      <motion.div className="pointer-events-none absolute rounded-[12px]" style={{ left: 1150, top: 690, width: 360, height: 34, background: '#8B5A36' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <Person x={900} y={800} scale={1.05} color={ADAM} />
      <Person x={1330} y={800} scale={1} color={WAITER} />
      {k >= 3 && <Person x={1110} y={800} scale={1.02} color={SAYED} delay={0.1} />}
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={900} y={560} id="story-1" text="أُرِيدُ قَهْوَةً، مِنْ فَضْلِكَ." width={300} size={24} delay={0.3} />
          <Say x={1330} y={440} id="story-2" text="قهوة؟ حاضر يا باشا!" align="right" width={260} size={26} accent delay={1.8} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={900} y={560} id="story-3" text="وَأُرِيدُ قَلَمًا أَيْضًا." width={260} size={24} delay={0.3} />
          <Say x={1330} y={440} id="story-4" text="قلم؟ عندك الكشك اللي جنبنا." align="right" width={300} size={24} accent delay={1.8} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={1110} y={430} id="story-5" text="يا آدم، إنت بتتكلم زي الكتاب! جميل!" width={360} size={24} accent delay={0.3} />
        </React.Fragment>
      )}
    </>
  );
}

/** The dial turns: ق from q to a catch; the throat line shows where the sound is made. */
export function Es1QafGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Dial x={1170} y={290} letter="ق" book="q" cairo="ʼ (a catch)" on={lines >= 2} />
      {lines >= 2 && (
        <Svg>
          <path d="M 1380 420 C 1420 500, 1400 600, 1380 680" fill="none" stroke={soft('light')} strokeWidth={3} />
          <motion.circle cx={1392} cy={620} r={12} fill={CAIRO} initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }} transition={{ delay: 0.6, duration: 0.6 }} />
        </Svg>
      )}
      {lines >= 2 && <Chip x={1290} y={700} color={CAIRO} delay={0.8}>a catch in the throat: uh-oh</Chip>}
      {lines >= 3 && (
        <>
          <Twin y={500} f="قَهْوَةٌ" fid="qahwa-f" fs="qahwa" e="قهوة" eid="ahwa-e" es="'ahwa" xr={1180} xl={880} size={36} />
          <Twin y={610} f="قَلَمٌ" fid="qalam-f" fs="qalam" e="قلم" eid="alam-e" es="'alam" xr={1180} xl={880} size={36} delay={0.5} />
        </>
      )}
    </>
  );
}

/** Five words: the learner predicts, then each street card flips in. */
export function Es1GuessGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const rows = [
    { f: 'قلب', e: 'قلب', s: "'alb", id: 'alb', step: 2 },
    { f: 'قال', e: 'قال', s: "'aal", id: 'aal', step: 2 },
    { f: 'فوق', e: 'فوق', s: "foo'", id: 'foo', step: 2 },
    { f: 'سوق', e: 'سوق', s: "suu'", id: 'suu', step: 3 },
    { f: 'صديق', e: 'صديق', s: "sadii'", id: 'sadii', step: 3 },
  ];
  return (
    <>
      <Chip x={1150} y={180} color={GOLD}>say it first, then tap</Chip>
      {rows.map((r, i) => lines >= r.step && (
        <Twin key={r.id} y={250 + i * 110} f={r.f} e={r.e} eid={r.id} es={r.s} size={34} delay={0.1 * (i % 3)} />
      ))}
    </>
  );
}

/** Words that keep the q: the mushaf, and a newspaper word. */
export function Es1KeepGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Dial x={1170} y={280} letter="ق" book="q" cairo="ʼ" on={false} />
      {lines >= 2 && (
        <>
          <motion.div className="pointer-events-none absolute rounded-[10px]" style={{ left: 1260, top: 440, width: 200, height: 150, background: '#2E5D4B', boxShadow: `inset 0 0 0 6px ${GOLD}, ${SHADOW}` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} />
          <BookCard x={1360} y={650} word="القرآن" id="quraan" sound="il-qur'aan" delay={0.4} size={34} />
          <Chip x={1360} y={720} color={BOOK} delay={0.6}>always q</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <motion.div className="pointer-events-none absolute rounded-[6px]" style={{ left: 880, top: 440, width: 220, height: 150, background: '#EDE7DC', boxShadow: `inset 0 18px 0 ${INK_TEXT}22, ${SHADOW}` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} />
          <BookCard x={990} y={650} word="القضية" id="qadiyya" sound="il-qadiyya" delay={0.4} size={34} />
          <Chip x={990} y={720} color={BOOK} delay={0.6}>formal: often q</Chip>
        </>
      )}
    </>
  );
}

export function Es1JimGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Dial x={1170} y={270} letter="ج" book="j" cairo="g (go)" on={lines >= 1} />
      <BookCard x={1360} y={440} word="جَمِيلٌ" id="jamil-f" sound="jamiil" size={34} delay={0.4} dim={lines >= 2} />
      {lines >= 2 && (
        <>
          <StreetCard x={980} y={440} word="جميل" id="gamiil" sound="gamiil" size={34} delay={0.2} />
          <StreetCard x={1180} y={440} word="جنب" id="gamb" sound="gamb" size={34} delay={0.4} />
        </>
      )}
      {lines >= 3 && (
        <>
          <StreetCard x={1050} y={600} word="جديد" id="gidiid" sound="gidiid" size={34} delay={0.2} />
          <StreetCard x={1290} y={600} word="جامعة" id="gama" sound="gam'a" size={34} delay={0.4} />
        </>
      )}
    </>
  );
}

/** The wow: a wall of book cards flips, card by card, into street signs. */
export function Es1ThousandGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const words = ['قمر', 'قلب', 'طريق', 'جبل', 'جمل', 'قديم', 'شجرة', 'دقيقة', 'جار', 'وقت', 'رجل', 'قريب'];
  return (
    <>
      {words.map((w, i) => {
        const x = 900 + (i % 4) * 170;
        const y = 240 + Math.floor(i / 4) * 140;
        const flipped = lines >= 2;
        return (
          <motion.div key={w} className="pointer-events-none absolute flex items-center justify-center rounded-[12px]" style={{ left: x - 70, top: y - 40, width: 140, height: 80 }}
            initial={{ rotateY: 0, opacity: 0 }} animate={{ rotateY: flipped ? 360 : 0, opacity: 1 }} transition={{ duration: 0.7, delay: flipped ? 0.1 + i * 0.12 : i * 0.05 }}>
            <span className="flex h-full w-full items-center justify-center rounded-[12px]" style={{ background: flipped ? CAIRO : '#F3E7D2', borderLeft: flipped ? undefined : `6px solid ${BOOK}`, boxShadow: SHADOW, transition: 'background 0.3s', transitionDelay: `${0.4 + i * 0.12}s` }}>
              <ArText size={34} color={flipped ? '#fff' : BOOK}>{w}</ArText>
            </span>
          </motion.div>
        );
      })}
      {lines >= 3 && <Chip x={1155} y={700} color={GOLD} delay={0.3}>switch two sounds · keep all your words</Chip>}
    </>
  );
}

export function Es1SentenceGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const words = [['أنا', 0], ['عايز', 0], ['أقعد', 1], ['في', 0], ['القهوة', 1], ['اللي', 0], ['جنب', 2], ['الجامعة', 2]] as const;
  return (
    <>
      <Hear id="sentence">
        <div className="absolute flex flex-wrap justify-center gap-3" style={{ left: 820, top: 260, width: 680, direction: 'rtl' }}>
          {words.map(([w, kind], i) => (
            <motion.span key={i} className="rounded-[14px]" style={{ padding: '2px 14px', background: lines >= 3 && kind ? (kind === 1 ? CRIMSON : CAIRO) : CARD, boxShadow: SHADOW }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
              <ArText size={40} color={lines >= 3 && kind ? '#fff' : INK_TEXT}>{w}</ArText>
            </motion.span>
          ))}
        </div>
      </Hear>
      {lines >= 2 && <Chip x={1160} y={470} color={soft('light')} delay={0.2}>I want to sit in the coffee shop next to the university.</Chip>}
      {lines >= 3 && (
        <>
          <Chip x={1040} y={560} color={CRIMSON} delay={0.3}>ق × 3 = catch</Chip>
          <Chip x={1290} y={560} color={CAIRO} delay={0.5}>ج × 2 = g</Chip>
        </>
      )}
    </>
  );
}

/* ---------- athar ---------- */

export function Es1TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[12px]" style={{ left: 1150, top: 690, width: 360, height: 34, background: '#8B5A36' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <Person x={900} y={800} scale={1.05} color={ADAM} />
      <Person x={1330} y={800} scale={1} color={WAITER} delay={0.1} />
      <Say x={900} y={560} id="wahid-ahwa" text="واحد قهوة، لو سمحت." width={260} size={26} accent delay={0.3} />
      {lines >= 2 && <Say x={900} y={430} id="fen-gama" text="فين الجامعة؟" width={190} size={26} delay={0.3} />}
      {lines >= 2 && <Say x={1330} y={480} text="جنب…" align="right" width={130} size={26} delay={1.2} />}
    </>
  );
}

export function Es1MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[14px]" style={{ left: 900, top: 190, width: 520, height: 520, background: CARD, boxShadow: SHADOW, backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 49px, #E6D8C0 49px 51px)' }} initial={{ opacity: 0, rotate: 3, y: 30 }} animate={{ opacity: 1, rotate: 1, y: 0 }} transition={{ duration: 0.8, ease }} />
      {['قمر', 'قريب', 'جبل', 'طريق', 'جار'].map((w, i) => (
        <motion.div key={w} className="pointer-events-none absolute flex items-center gap-4" style={{ right: 1600 - 1380, top: 220 + i * 50, flexDirection: 'row-reverse' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.15 }}>
          <ArText size={30} color={BOOK}>{w}</ArText>
          {lines >= 2 && <span className="font-sans font-bold" style={{ fontSize: 18, color: CAIRO }}>✓ said</span>}
        </motion.div>
      ))}
      {lines >= 2 && <Chip x={1160} y={520} color={GOLD} delay={0.8}>every day · 10 words</Chip>}
    </>
  );
}

export function Es1NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Building x={1180} w={300} />
      <Person x={900} y={800} scale={1.05} color={ADAM} />
      <motion.span className="pointer-events-none absolute rounded-full" style={{ left: 1040, top: 560, width: 70, height: 70, border: `10px solid ${GOLD}` }} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3, type: 'spring' }} />
      {lines >= 2 && (
        <>
          <BookCard x={1000} y={300} word="ذَهَبٌ" id="dhahab-f" sound="dhahab" size={36} delay={0.1} />
          <StreetCard x={1000} y={440} word="دهب" id="dahab-e" sound="dahab" size={36} delay={0.6} />
          <Person x={1330} y={800} scale={1} color="#B4552F" delay={0.1} />
        </>
      )}
      {lines >= 3 && <Chip x={1000} y={200} color={CRIMSON} delay={0.3}>ث · ذ: where does the th go?</Chip>}
    </>
  );
}
