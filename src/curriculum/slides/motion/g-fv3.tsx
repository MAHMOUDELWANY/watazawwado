import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Cut, Chip, Person, Icon, Svg, Draw } from './kit';
import { ArText, SayBubble } from './g-lang';
import { Hear } from '../Say';

/**
 * Fusha · Level 2 · Lesson 3 (Kids: My Father, Your Brother; 12+: The Video Call). The five nouns. One device for both:
 * a whole-word tile whose long vowel shows its job, one colour per vowel (ـُو teal, ـَا gold, ـِي crimson). When a
 * little word (إِلَى، مَعَ، عَلَى) slides in before it, the tile swaps whole from its u-form to its i-form. Kids find the
 * words in Jiddo's sepia photo album; 12+ hear them on Sara's family video call.
 */

const CAST = 'zad-kids/characters';
const CARD = '#FFFDF8';
const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';
const SEPIA = '#E9DCC3';
const KAREEM = '#6E8B5A';
const U = TEAL;
const A = GOLD;
const I = CRIMSON;

/** A whole Arabic word on a card, centred at (x, y). */
function Word({ x, y, children, color = INK_TEXT, id, size = 52, delay = 0, dim = false, ring = true }: { x: number; y: number; children: string; color?: string; id?: string; size?: number; delay?: number; dim?: boolean; ring?: boolean }) {
  const body = <span className="inline-block whitespace-nowrap rounded-[22px]" style={{ padding: '0 22px', background: CARD, boxShadow: ring ? `0 0 0 4px ${color}, ${SHADOW}` : SHADOW }}><ArText size={size} color={color}>{children}</ArText></span>;
  return (
    <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <motion.div key={children} initial={{ opacity: 0, scale: 0.6, filter: 'blur(6px)' }} animate={{ opacity: dim ? 0.3 : 1, scale: 1, filter: 'blur(0px)' }} transition={{ type: 'spring', bounce: 0.4, duration: 0.8, delay }}>
        {id ? <Hear id={id}>{body}</Hear> : body}
      </motion.div>
    </div>
  );
}

/** A round vowel badge: the long vowel and its job. */
function Vowel({ x, y, v, job, color, delay = 0 }: { x: number; y: number; v: string; job?: string; color: string; delay?: number }) {
  return (
    <div className="pointer-events-none absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <motion.div className="flex items-center gap-2 whitespace-nowrap rounded-full" style={{ padding: '2px 16px 2px 6px', background: color, boxShadow: SHADOW }}
        initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.5, duration: 0.7, delay }}>
        <span className="rounded-full" style={{ background: CARD, padding: '0 14px' }}><ArText size={40} color={color}>{v}</ArText></span>
        {job && <span className="font-sans font-bold" style={{ fontSize: 22, color: '#fff' }}>{job}</span>}
      </motion.div>
    </div>
  );
}

/** A sepia photo in a white frame, tilted; children draw inside it. `hot` lifts and rings it. */
function Photo({ x, y, w = 220, h = 170, tilt = 0, hot = false, dim = false, delay = 0, children }: { x: number; y: number; w?: number; h?: number; tilt?: number; hot?: boolean; dim?: boolean; delay?: number; children?: React.ReactNode }) {
  return (
    <motion.div className="pointer-events-none absolute overflow-hidden" style={{ left: x - w / 2, top: y - h / 2, width: w, height: h, background: SEPIA, borderRadius: 6, boxShadow: `0 0 0 10px ${CARD}, ${hot ? `0 0 0 16px ${GOLD}, ` : ''}${SHADOW}`, filter: 'sepia(0.35)' }}
      initial={{ opacity: 0, y: 24, rotate: tilt - 6 }} animate={{ opacity: dim ? 0.45 : 1, y: hot ? -10 : 0, rotate: tilt, scale: hot ? 1.06 : 1 }} transition={{ duration: 0.7, delay, ease }}>
      {children}
    </motion.div>
  );
}

/** A faceless figure drawn inside a photo (head and shoulders), in sepia tones. */
function Sitter({ cx, cy, s = 1, color = '#8B6A4A', small = false }: { cx: number; cy: number; s?: number; color?: string; small?: boolean }) {
  const r = (small ? 14 : 20) * s;
  return (
    <svg className="absolute" viewBox="0 0 100 100" width={100 * s} height={100 * s} style={{ left: cx - 50 * s, top: cy - 50 * s, overflow: 'visible' }}>
      <circle cx={50} cy={small ? 46 : 36} r={r / s} fill="#C9AE8C" />
      <path d={small ? 'M 30 100 L 34 66 Q 50 58 66 66 L 70 100 Z' : 'M 22 100 L 26 62 Q 50 50 74 62 L 78 100 Z'} fill={color} />
    </svg>
  );
}

/** A little cat drawn in a photo or on the stage. */
function Kitten({ x, y, s = 1, tail = false }: { x: number; y: number; s?: number; tail?: boolean }) {
  return (
    <svg className="pointer-events-none absolute" viewBox="0 0 120 80" width={120 * s} height={80 * s} style={{ left: x - 60 * s, top: y - 40 * s, overflow: 'visible' }}>
      <ellipse cx={58} cy={56} rx={30} ry={18} fill="#8B6A4A" />
      <circle cx={30} cy={36} r={15} fill="#8B6A4A" />
      <path d="M 18 28 L 20 12 L 30 22 Z M 40 22 L 42 10 L 34 20 Z" fill="#8B6A4A" />
      <motion.path d="M 86 54 C 112 50, 118 20, 100 6" fill="none" stroke={tail ? GOLD : '#8B6A4A'} strokeWidth={tail ? 9 : 7} strokeLinecap="round"
        initial={{ pathLength: tail ? 0 : 1 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 0.3 }} />
    </svg>
  );
}

/** A small tile in a sentence strip. */
function Chunk({ x, y, children, color = INK_TEXT, hot = false, delay = 0, from }: { x: number; y: number; children: string; color?: string; hot?: boolean; delay?: number; from?: number }) {
  return (
    <div className="pointer-events-none absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <motion.span key={children} className="inline-block whitespace-nowrap rounded-[16px]" style={{ padding: '0 16px', background: hot ? color : CARD, boxShadow: hot ? SHADOW : `0 0 0 2px ${color}55, ${SHADOW}` }}
        initial={{ opacity: 0, y: from ?? 16, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.45, duration: 0.7, delay }}>
        <ArText size={38} color={hot ? '#fff' : color}>{children}</ArText>
      </motion.span>
    </div>
  );
}

/* =================== Kids =================== */

/** Jiddo's open album: two facing pages with photos. */
function Album({ dim = false, children }: { dim?: boolean; children?: React.ReactNode }) {
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: 820, top: 170, width: 680, height: 350 }} initial={{ opacity: 0, rotateX: 40, y: 40 }} animate={{ opacity: dim ? 0.5 : 1, rotateX: 0, y: 0 }} transition={{ duration: 0.9, ease }}>
      <div className="absolute rounded-[14px]" style={{ inset: 0, background: '#7A4A2E', boxShadow: SHADOW }} />
      <div className="absolute rounded-l-[10px]" style={{ left: 14, top: 12, width: 322, height: 326, background: '#F3E7D2' }} />
      <div className="absolute rounded-r-[10px]" style={{ right: 14, top: 12, width: 322, height: 326, background: '#F3E7D2' }} />
      <div className="absolute" style={{ left: 336, top: 12, width: 8, height: 326, background: 'linear-gradient(90deg, #D9C7A8, #F3E7D2)' }} />
      {children}
    </motion.div>
  );
}

/** The three photos inside the album, in album coordinates. */
function Photos({ hot }: { hot?: 'boy' | 'man' | 'cat' }) {
  return (
    <>
      <Photo x={175} y={105} w={180} h={130} tilt={-4} hot={hot === 'boy'} dim={!!hot && hot !== 'boy'} delay={0.3}><Sitter cx={90} cy={80} s={0.85} small color="#6E8B5A" /></Photo>
      <Photo x={505} y={170} w={220} h={170} tilt={3} hot={hot === 'man'} dim={!!hot && hot !== 'man'} delay={0.5}><Sitter cx={75} cy={100} s={1} color="#5A4636" /><Sitter cx={150} cy={103} s={0.95} color="#8B6A4A" /></Photo>
      <Photo x={175} y={260} w={190} h={110} tilt={-2} hot={hot === 'cat'} dim={!!hot && hot !== 'cat'} delay={0.7}><Kitten x={95} y={58} s={0.85} tail={hot === 'cat'} /></Photo>
    </>
  );
}

export function Fv3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Album><Photos /></Album>
      <Cut src={`${CAST}/jiddo-sit`} x={900} y={830} h={220} delay={0.4} />
      <Word x={1180} y={680} color={U} size={46} delay={1}>أَبُو يُوسُفَ</Word>
      <Word x={1420} y={680} color={U} size={46} delay={1.2}>أَخُو مَرْيَمَ</Word>
    </>
  );
}

export function Fv3RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cut src={`${CAST}/jiddo-stand`} x={900} y={830} h={300} />
      <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-[24px]" style={{ left: 1300, top: 300, width: 130, height: 130, background: CARD, boxShadow: `0 0 0 3px ${TEAL}66, ${SHADOW}` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Icon name="moon" size={70} color={TEAL} />
      </motion.div>
      <Word x={1150} y={520} id="yadhhabu-jiddi" color={GOLD} size={50} delay={0.5}>يَذْهَبُ</Word>
      {lines >= 2 && <Cut src={`${CAST}/yusuf-brave`} x={1420} y={830} h={250} delay={0.1} />}
      {lines >= 2 && <Word x={1300} y={640} color={TEAL} size={40} delay={0.4}>أَذْهَبُ…</Word>}
    </>
  );
}

export function Fv3AlbumGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Album>{lines >= 2 && <Photos />}</Album>
      <Cut src={`${CAST}/jiddo-sit`} x={900} y={830} h={220} />
      {lines >= 3 && (
        <>
          <Cut src={`${CAST}/yusuf-think`} x={1180} y={830} h={230} delay={0.1} />
          <Cut src={`${CAST}/maryam-amazed`} x={1400} y={830} h={230} delay={0.25} />
        </>
      )}
    </>
  );
}

/** Each answer lifts its photo from the album. */
export function Fv3StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  const hot = k === 1 ? 'boy' : k === 2 ? 'man' : k === 3 ? 'cat' : undefined;
  return (
    <>
      <Album><Photos hot={hot} /></Album>
      <Cut src={`${CAST}/jiddo-explain`} x={890} y={830} h={210} />
      <Cut src={`${CAST}/${k === 1 ? 'maryam-amazed' : 'maryam-happy'}`} x={1250} y={830} h={200} />
      <Cut src={`${CAST}/${k === 2 ? 'yusuf-point' : 'yusuf-think'}`} x={1430} y={830} h={200} />
      {k === 1 && (
        <React.Fragment key="a">
          <SayBubble x={1440} y={575} id="story-1" text="مَنْ هَذَا ٱلْوَلَدُ يَا جِدِّي؟" align="right" width={290} size={22} delay={0.3} />
          <SayBubble x={880} y={625} id="story-2" text="هَذَا أَحْمَدُ، أَبُو يُوسُفَ وَمَرْيَمَ!" width={330} size={22} accent delay={1.8} />
          <SayBubble x={1240} y={640} id="story-3" text="أَبِي صَغِيرٌ!" width={160} size={24} delay={2.4} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <SayBubble x={1440} y={590} id="story-4" text="وَمَنْ هَذَا؟" align="right" width={170} size={24} delay={0.3} />
          <SayBubble x={880} y={625} id="story-5" text="هَذَا أَخِي سَعِيدٌ." width={240} size={24} accent delay={1.6} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <SayBubble x={880} y={625} id="story-6" text="وَهَذَا قِطٌّ ذُو ذَيْلٍ طَوِيلٍ!" width={320} size={22} accent delay={0.4} />
        </React.Fragment>
      )}
    </>
  );
}

/** A father, my father, Yusuf's father: the same photo, three ways to name it. */
export function Fv3FatherGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Photo x={1180} y={330} w={240} h={190} tilt={-3}><Sitter cx={120} cy={110} s={1.2} color="#5A4636" /></Photo>
      <Word x={1180} y={500} id="ab" color={INK_TEXT} size={44} delay={0.4} ring={false}>أَبٌ</Word>
      {lines >= 1 && <Word x={960} y={290} id="abi" color={CRIMSON} size={40} delay={0.8}>أَبِي</Word>}
      {lines >= 1 && <Chip x={960} y={340} color={CRIMSON} delay={1}>my father</Chip>}
      {lines >= 2 && (
        <>
          <Cut src={`${CAST}/yusuf-stand`} x={1420} y={830} h={240} delay={0.1} />
          <Svg><Draw d="M 1270 420 C 1340 470, 1380 520, 1410 570" color={U} width={4} delay={0.3} dur={0.8} /></Svg>
          <Word x={1180} y={620} id="abu-yusuf" color={U} size={50} delay={0.8}>أَبُو يُوسُفَ</Word>
          <Vowel x={1180} y={705} v="ـُو" job="before a name" color={U} delay={1.2} />
        </>
      )}
      {lines >= 3 && <Cut src={`${CAST}/maryam-happy`} x={880} y={830} h={220} delay={0.1} />}
      {lines >= 3 && <SayBubble x={880} y={590} text="أَبِي!" width={110} size={30} delay={0.5} />}
    </>
  );
}

/** Yusuf beside Maryam: أَخُو مَرْيَمَ. Jiddo's own brother waits in the photo. */
export function Fv3BrotherGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cut src={`${CAST}/yusuf-brave`} x={1120} y={830} h={260} />
      <Word x={1120} y={330} id="akh" color={INK_TEXT} size={42} ring={false}>أَخٌ</Word>
      <Word x={1120} y={430} id="akhi" color={CRIMSON} size={40} delay={0.4}>أَخِي</Word>
      {lines >= 2 && (
        <>
          <Cut src={`${CAST}/maryam-happy`} x={1380} y={830} h={240} delay={0.1} />
          <Svg><Draw d="M 1180 600 Q 1260 560 1330 600" color={U} width={4} delay={0.3} dur={0.6} /></Svg>
          <Word x={1300} y={230} id="akhu-maryam" color={U} size={46} delay={0.6}>أَخُو مَرْيَمَ</Word>
        </>
      )}
      {lines >= 3 && (
        <>
          <Photo x={890} y={330} w={190} h={150} tilt={-4} delay={0.1}><Sitter cx={95} cy={90} s={1} color="#8B6A4A" /></Photo>
          <Word x={890} y={500} color={U} size={34} delay={0.5}>أَخِي سَعِيدٌ</Word>
          <Cut src={`${CAST}/jiddo-sit`} x={890} y={830} h={190} delay={0.2} />
        </>
      )}
    </>
  );
}

/** The sentence strip: a little word slides in before the noun, and its u turns into an i. */
export function Fv3AfterGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const after = lines >= 2;
  return (
    <>
      <div className="pointer-events-none absolute flex gap-3" style={{ right: 1600 - 1490, top: 190, flexDirection: 'row-reverse' }}>
        {['مَعَ', 'إِلَى', 'لِـ'].map((w, i) => (
          <motion.span key={w} className="rounded-[14px]" style={{ padding: '0 16px', background: I, boxShadow: SHADOW }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.15 }}>
            <ArText size={34} color="#fff">{w}</ArText>
          </motion.span>
        ))}
      </div>
      <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={false} animate={{ x: after ? -170 : 0 }} transition={{ duration: 0.8, ease }}>
        <Word x={1150} y={400} color={after ? I : U} size={52} id={after ? 'ila-abi-ahmad' : 'abu-ahmad'} delay={after ? 0.8 : 0.4}>{after ? 'أَبِي أَحْمَدَ' : 'أَبُو أَحْمَدَ'}</Word>
        <Vowel x={1150} y={500} v={after ? 'ـِي' : 'ـُو'} color={after ? I : U} delay={after ? 1.1 : 0.7} />
      </motion.div>
      {after && (
        <>
          <Chunk x={1420} y={400} color={INK_TEXT} delay={0.1}>يَذْهَبُ يُوسُفُ</Chunk>
          <Chunk x={1210} y={400} color={I} hot from={-120} delay={0.4}>إِلَى</Chunk>
        </>
      )}
      <Cut src={`${CAST}/jiddo-stand`} x={900} y={830} h={260} dim={lines >= 3} />
      {lines >= 3 && (
        <>
          <Word x={1060} y={640} color={CRIMSON} size={40} delay={0.2}>أَبِي</Word>
          <Chip x={1060} y={690} color={soft('light')} delay={0.4}>my father</Chip>
          <Word x={1340} y={640} color={I} size={40} delay={0.5}>أَبِي أَحْمَدَ</Word>
          <Chip x={1340} y={690} color={I} delay={0.7}>a name follows</Chip>
        </>
      )}
    </>
  );
}

/** The family tree: Ahmad's name climbs up to become part of Jiddo's. */
export function Fv3KunyaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cut src={`${CAST}/jiddo-stand`} x={1150} y={520} h={300} />
      <Person x={1150} y={760} scale={0.7} color="#5A4636" delay={0.3} />
      <Chip x={1150} y={772} color="#5A4636" delay={0.5}>أَحْمَدُ</Chip>
      <Svg><Draw d="M 1150 600 L 1150 540" color={GOLD} width={4} delay={0.6} dur={0.4} /></Svg>
      {lines >= 2 && (
        <>
          <Svg><Draw d="M 1220 760 C 1380 680, 1380 300, 1240 260" color={GOLD} width={4} dash="4 10" delay={0.2} dur={1.2} glow /></Svg>
          <Word x={1150} y={200} id="abu-ahmad" color={U} size={48} delay={1}>أَبُو أَحْمَدَ</Word>
          <Chip x={1380} y={430} color={GOLD} delay={1.3}>kunya</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <Person x={890} y={520} scale={0.95} color={CRIMSON} hijab delay={0.2} />
          <Word x={890} y={250} id="umm-ahmad" color={CRIMSON} size={40} delay={0.6}>أُمُّ أَحْمَدَ</Word>
          <motion.span className="pointer-events-none absolute flex items-center justify-center rounded-full font-sans font-black" style={{ left: 1390, top: 560, width: 70, height: 70, background: GOLD, color: '#fff', fontSize: 34 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1, type: 'spring', bounce: 0.5 }}>?</motion.span>
          <Chip x={1425} y={650} color={GOLD} delay={1.2}>your parents?</Chip>
        </>
      )}
    </>
  );
}

/** ذُو: the cat's tail lights up; Jiddo's beard gets its label. */
export function Fv3DhuGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Word x={1150} y={220} id="dhu" color={U} size={60}>ذُو</Word>
      <Chip x={1150} y={280} color={U} delay={0.3}>the one with…</Chip>
      {lines >= 2 && (
        <>
          <Kitten x={950} y={560} s={2} tail />
          <Word x={950} y={700} id="qitt-dhu-dhayl" color={INK_TEXT} size={34} delay={0.6} ring={false}>قِطٌّ ذُو ذَيْلٍ طَوِيلٍ</Word>
        </>
      )}
      {lines >= 3 && (
        <>
          <Cut src={`${CAST}/jiddo-advice`} x={1360} y={680} h={300} delay={0.1} />
          <Word x={1360} y={740} id="rajul-dhu-lihya" color={INK_TEXT} size={30} delay={0.5} ring={false}>رَجُلٌ ذُو لِحْيَةٍ بَيْضَاءَ</Word>
        </>
      )}
    </>
  );
}

export function Fv3TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Photo x={1250} y={340} w={340} h={240} tilt={2}>
        <Sitter cx={90} cy={150} s={1.2} color="#5A4636" />
        <Sitter cx={190} cy={160} s={1.1} color={CRIMSON} />
        <Sitter cx={270} cy={175} s={0.9} small color={TEAL} />
      </Photo>
      <Cut src={`${CAST}/yusuf-point`} x={900} y={830} h={260} />
      <SayBubble x={900} y={590} id="haadha-abi" text="هَذَا أَبِي." width={160} size={28} delay={0.4} />
      {lines >= 2 && <Word x={1250} y={560} color={U} size={38} delay={0.3}>أَبِي أَبُو…</Word>}
    </>
  );
}

export function Fv3MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Cut src={`${CAST}/maryam-happy`} x={900} y={830} h={250} />
      <SayBubble x={900} y={600} text="يَا أَبَا…!" width={160} size={30} accent delay={0.4} />
      {lines >= 2 && (
        <motion.div className="pointer-events-none absolute rounded-[10px]" style={{ left: 1080, top: 220, width: 400, height: 460, background: CARD, boxShadow: SHADOW }} initial={{ opacity: 0, rotate: 4, y: 30 }} animate={{ opacity: 1, rotate: 2, y: 0 }} transition={{ duration: 0.8, ease }}>
          <Sitter cx={120} cy={170} s={1.3} color="#5A4636" />
          <Sitter cx={280} cy={190} s={1} small color={TEAL} />
          <span className="absolute" style={{ left: 70, top: 280 }}><ArText size={34} color={CRIMSON}>أَبِي</ArText></span>
          <span className="absolute" style={{ left: 240, top: 280 }}><ArText size={34} color={CRIMSON}>أَخِي</ArText></span>
        </motion.div>
      )}
    </>
  );
}

/** Yusuf's messy room. */
export function Fv3NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const toys = [['ball', 1040, 720, GOLD], ['book', 1150, 770, CRIMSON], ['doll', 1250, 700, TEAL], ['socks', 1330, 770, GOLD], ['glasses', 1000, 630, TEAL]] as const;
  return (
    <>
      <Cut src={`${CAST}/jiddo-advice`} x={880} y={830} h={300} />
      {toys.map(([n, x, y, c], i) => (
        <motion.div key={n} className="pointer-events-none absolute" style={{ left: x - 30, top: y - 30 }} initial={{ opacity: 0, rotate: -40, y: -60 }} animate={{ opacity: 1, rotate: (i % 2 ? 1 : -1) * 18, y: 0 }} transition={{ delay: 0.2 + i * 0.1, type: 'spring', bounce: 0.4 }}>
          <Icon name={n} size={60} color={c} />
        </motion.div>
      ))}
      {lines >= 2 && (
        <>
          <Cut src={`${CAST}/yusuf-sad`} x={1440} y={830} h={250} delay={0.1} />
          <SayBubble x={880} y={540} text="هَلْ رَتَّبْتَ غُرْفَتَكَ؟" width={270} size={26} delay={0.3} />
          <SayBubble x={1450} y={560} id="ma-rattabtuha" text="لَا، مَا رَتَّبْتُهَا… بَعْدُ!" align="right" width={300} size={26} accent delay={1.6} />
        </>
      )}
      {lines >= 3 && <Chip x={1150} y={200} color={CRIMSON} delay={0.3}>not · didn't · not yet</Chip>}
    </>
  );
}

/* =================== 12+ =================== */

/** Sara's phone on a video call; `who` decides who is on screen. */
function Phone({ x = 1180, y = 190, w = 300, h = 480, father = true, brother = true, delay = 0 }: { x?: number; y?: number; w?: number; h?: number; father?: boolean; brother?: boolean; delay?: number }) {
  return (
    <motion.div className="pointer-events-none absolute overflow-hidden rounded-[34px]" style={{ left: x, top: y, width: w, height: h, background: 'linear-gradient(180deg, #2E3D48, #4A5D6A)', boxShadow: `0 0 0 10px ${INK_TEXT}, ${SHADOW}` }}
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay, ease }}>
      {father && <svg className="absolute" viewBox="0 0 100 100" width={200} height={200} style={{ left: 10, top: h - 210 }}><circle cx={50} cy={34} r={16} fill="#E9C29A" /><path d="M 20 100 L 24 60 Q 50 48 76 60 L 80 100 Z" fill="#8B5A36" /></svg>}
      {brother && <svg className="absolute" viewBox="0 0 100 100" width={130} height={130} style={{ right: 10, top: h - 140 }}><circle cx={50} cy={40} r={15} fill="#E9C29A" /><path d="M 28 100 L 32 66 Q 50 56 68 66 L 72 100 Z" fill={TEAL} /></svg>}
    </motion.div>
  );
}

export function Fw3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Phone />
      <Person x={900} y={800} scale={1.02} color={GOLD} hijab />
      <Word x={1060} y={720} color={U} size={42} delay={0.9}>أَبُو عُمَرَ</Word>
      <Word x={1330} y={720} color={A} size={42} delay={1.1}>أَبَا عُمَرَ</Word>
    </>
  );
}

export function Fw3BreakGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={900} y={800} scale={1.02} color={GOLD} hijab />
      <Person x={1060} y={800} scale={1} color={TEAL} delay={0.15} />
      {lines === 1 && (
        <motion.div className="pointer-events-none absolute" style={{ left: 1260, top: 380 }} animate={{ rotate: [0, -12, 12, -12, 0] }} transition={{ duration: 0.6, repeat: 3, delay: 0.4 }}>
          <Icon name="phone" size={110} color={INK_TEXT} />
        </motion.div>
      )}
      {lines >= 2 && <Phone x={1200} delay={0.1} />}
      {lines >= 3 && (
        <>
          <Word x={1000} y={240} color={U} size={34} delay={0.2}>أَبُو</Word>
          <Word x={1000} y={330} color={A} size={34} delay={0.4}>أَبَا</Word>
          <Word x={1000} y={420} color={I} size={34} delay={0.6}>أَبِي</Word>
          <Chip x={1000} y={480} color={soft('light')} delay={0.9}>three endings, one person</Chip>
        </>
      )}
    </>
  );
}

export function Fw3StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Phone x={1260} y={170} w={240} h={380} />
      <Person x={880} y={800} scale={1} color={GOLD} hijab />
      <Person x={1040} y={800} scale={1} color={TEAL} delay={0.1} />
      {k >= 3 && <Person x={1420} y={800} scale={1.02} color={KAREEM} delay={0.1} />}
      {k === 1 && (
        <React.Fragment key="a">
          <SayBubble x={880} y={560} id="story-1" text="هَذَا أَبِي، وَهَذَا أَخِي ٱلصَّغِيرُ عُمَرُ." width={330} size={22} delay={0.3} />
          <SayBubble x={1250} y={320} id="story-2" text="أَهْلًا يَا يُوسُفُ! أَنَا أَبُو عُمَرَ." align="right" width={300} size={22} accent delay={2} />
          <Word x={1080} y={420} color={U} size={36} delay={2.6}>أَبُو عُمَرَ</Word>
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <SayBubble x={1060} y={560} id="story-3" text="تَشَرَّفْنَا يَا أَبَا عُمَرَ!" align="right" width={280} size={24} delay={0.3} />
          <SayBubble x={1250} y={320} id="story-4" text="وَأَنَا أَخُو سَارَةَ!" align="right" width={220} size={24} accent delay={1.8} />
          <Word x={1080} y={420} color={A} size={36} delay={0.9}>أَبَا عُمَرَ</Word>
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <SayBubble x={1420} y={600} id="story-5" text="سَلِّمِي عَلَى أَبِي عُمَرَ يَا سَارَةُ." align="right" width={320} size={22} delay={0.3} />
          <SayBubble x={880} y={560} id="story-6" text="إِنْ شَاءَ ٱللَّهُ، يَا أُسْتَاذُ." width={230} size={22} accent delay={2} />
          <Word x={1080} y={420} color={I} size={36} delay={0.9}>أَبِي عُمَرَ</Word>
        </React.Fragment>
      )}
    </>
  );
}

/** Five cards; alone and with "my" they stay plain; with a noun after them they grow a long vowel. */
export function Fw3FiveGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const five = [['أَبٌ', 'ab', 'father'], ['أَخٌ', 'akh', 'brother'], ['حَمٌ', 'ham', 'father-in-law'], ['فَمٌ', 'fam', 'mouth'], ['ذُو', 'dhu', 'having']] as const;
  return (
    <>
      {five.map(([w, id, en], i) => (
        <React.Fragment key={id}>
          <Word x={1440 - i * 140} y={260} id={id} color={INK_TEXT} size={40} delay={0.15 * i}>{w}</Word>
          <span className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap font-sans font-bold" style={{ left: 1440 - i * 140, top: 305, fontSize: 17, color: soft('light') }}>{en}</span>
        </React.Fragment>
      ))}
      {lines >= 2 && (
        <>
          <Word x={1330} y={440} color={INK_TEXT} size={38} ring={false}>أَبٌ</Word>
          <Word x={1130} y={440} color={CRIMSON} size={38} delay={0.2}>أَبِي</Word>
          <Chip x={1230} y={500} color={soft('light')} delay={0.4}>alone · with "my": ordinary</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <Word x={1200} y={640} id="abu-umar" color={U} size={54} delay={0.2}>أَبُو عُمَرَ</Word>
          <Vowel x={950} y={640} v="ـُو" job="+ a noun" color={U} delay={0.6} />
        </>
      )}
    </>
  );
}

/** One lane for one vowel: a label, the example tiles, and who is doing what. */
function Lane({ v, job, color }: { v: string; job: string; color: string }) {
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[28px]" style={{ left: 800, top: 170, width: 700, height: 560, background: `${color}10`, boxShadow: `inset 0 0 0 3px ${color}44` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
      <Vowel x={1150} y={220} v={v} job={job} color={color} />
    </>
  );
}

export function Fw3UGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Lane v="ـُو" job="the doer · what it is about" color={U} />
      <Person x={1150} y={700} scale={0.9} color="#8B5A36" delay={0.2} />
      {lines >= 2 && (
        <>
          <Word x={1300} y={340} color={U} size={38} delay={0.1}>أَنَا أَبُو عُمَرَ.</Word>
          <Word x={990} y={340} id="jaa-abu-umar" color={U} size={38} delay={0.4}>جَاءَ أَبُو عُمَرَ.</Word>
          <Word x={1150} y={440} id="akhu-sarah" color={U} size={38} delay={0.7}>هَذَا أَخُو سَارَةَ.</Word>
        </>
      )}
      {lines >= 3 && <Chip x={1150} y={510} color={U} delay={0.3}>names · introductions · news</Chip>}
    </>
  );
}

export function Fw3AGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Lane v="ـَا" job="done to · called with يَا" color={A} />
      <Person x={920} y={720} scale={0.9} color={TEAL} />
      <Person x={1380} y={720} scale={0.9} color="#8B5A36" delay={0.2} />
      <Svg><Draw d="M 980 520 Q 1150 440 1320 520" color={A} width={4} dash="3 10" delay={0.4} dur={0.9} /></Svg>
      <Word x={1150} y={340} id="raaytu-aba-umar" color={A} size={42} delay={0.6}>رَأَيْتُ أَبَا عُمَرَ.</Word>
      {lines >= 2 && <Word x={1150} y={440} id="ya-aba-umar" color={A} size={42} delay={0.2}>يَا أَبَا عُمَرَ!</Word>}
      {lines >= 3 && (
        <>
          <Chip x={920} y={560} color={TEAL} delay={0.2}>I saw</Chip>
          <Chip x={1380} y={560} color={A} delay={0.4}>he was seen</Chip>
        </>
      )}
    </>
  );
}

export function Fw3IGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Lane v="ـِي" job="after a little word · after an owner" color={I} />
      <div className="pointer-events-none absolute flex gap-2" style={{ right: 1600 - 1470, top: 290, flexDirection: 'row-reverse' }}>
        {['فِي', 'مِنْ', 'إِلَى', 'عَلَى', 'مَعَ'].map((w, i) => (
          <motion.span key={w} className="rounded-[12px]" style={{ padding: '0 12px', background: I }} initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
            <ArText size={28} color="#fff">{w}</ArText>
          </motion.span>
        ))}
      </div>
      <Word x={1150} y={400} id="ala-abi-umar" color={I} size={42} delay={0.6}>عَلَى أَبِي عُمَرَ</Word>
      {lines >= 2 && (
        <>
          <Word x={1150} y={520} id="baytu-akhi-sarah" color={I} size={42} delay={0.2}>بَيْتُ أَخِي سَارَةَ</Word>
          <Chip x={1150} y={580} color={soft('light')} delay={0.5}>the house of Sara's brother</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <Word x={1330} y={670} color={CRIMSON} size={36} delay={0.2} ring={false}>أَبِي</Word>
          <Chip x={1330} y={705} color={soft('light')} delay={0.4}>my father</Chip>
          <Word x={980} y={670} color={I} size={36} delay={0.5}>أَبِي عُمَرَ</Word>
          <Chip x={980} y={705} color={I} delay={0.7}>a noun follows</Chip>
        </>
      )}
    </>
  );
}

/** Two columns that match: the five-noun's long vowels and an ordinary noun's short ones. */
export function Fw3JobsGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const rows = [
    { five: 'أَبُو', plain: 'ٱلْوَلَدُ', id: 'al-waladu', job: 'doer', c: U },
    { five: 'أَبَا', plain: 'ٱلْوَلَدَ', id: 'al-walada', job: 'done to', c: A },
    { five: 'أَبِي', plain: 'ٱلْوَلَدِ', id: 'al-waladi', job: 'after a word', c: I },
  ];
  return (
    <>
      {rows.map((r, i) => (
        <React.Fragment key={r.five}>
          <span className="pointer-events-none absolute font-sans font-bold" style={{ left: 830, top: 270 + i * 150, fontSize: 22, color: r.c }}>{r.job}</span>
          <Word x={1360} y={290 + i * 150} color={r.c} size={46} delay={0.15 * i}>{r.five}</Word>
          {lines >= 2 && <Word x={1100} y={290 + i * 150} id={r.id} color={r.c} size={46} delay={0.3 + 0.15 * i} ring={false}>{r.plain}</Word>}
          {lines >= 2 && <Svg><Draw d={`M 1270 ${290 + i * 150} L 1200 ${290 + i * 150}`} color={r.c} width={3} dash="3 7" delay={0.5 + 0.15 * i} dur={0.4} /></Svg>}
        </React.Fragment>
      ))}
      <span className="pointer-events-none absolute -translate-x-1/2 font-sans font-black uppercase" style={{ left: 1360, top: 190, fontSize: 15, letterSpacing: 2, color: soft('light') }}>long vowels</span>
      {lines >= 2 && <span className="pointer-events-none absolute -translate-x-1/2 font-sans font-black uppercase" style={{ left: 1100, top: 190, fontSize: 15, letterSpacing: 2, color: soft('light') }}>short vowels</span>}
      {lines >= 3 && <Chip x={1150} y={720} color={CRIMSON} delay={0.3}>the five nouns say the case out loud</Chip>}
    </>
  );
}

export function Fw3KunyaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={900} y={760} scale={0.95} color="#8B5A36" />
      <Person x={1010} y={760} scale={0.6} color={TEAL} delay={0.2} />
      <Svg><Draw d="M 1010 640 C 1040 520, 980 420, 940 380" color={GOLD} width={4} dash="4 9" delay={0.4} dur={0.9} /></Svg>
      <Word x={940} y={330} color={U} size={40} delay={0.9}>أَبُو عُمَرَ</Word>
      {lines >= 2 && (
        <>
          <Kitten x={1330} y={500} s={1.4} />
          <Word x={1330} y={330} id="abu-hurayra" color={U} size={40} delay={0.4}>أَبُو هُرَيْرَةَ</Word>
          <Chip x={1330} y={390} color={GOLD} delay={0.7}>father of the little cat</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <Word x={1280} y={640} id="dhu-ilm" color={INK_TEXT} size={38} delay={0.2} ring={false}>رَجُلٌ ذُو عِلْمٍ</Word>
          <div className="pointer-events-none absolute flex gap-3" style={{ left: 1180, top: 700 }}>
            <span className="rounded-full" style={{ padding: '0 14px', background: U }}><ArText size={28} color="#fff">ذُو</ArText></span>
            <span className="rounded-full" style={{ padding: '0 14px', background: A }}><ArText size={28} color="#fff">ذَا</ArText></span>
            <span className="rounded-full" style={{ padding: '0 14px', background: I }}><ArText size={28} color="#fff">ذِي</ArText></span>
          </div>
        </>
      )}
    </>
  );
}

export function Fw3TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Phone x={1200} y={190} h={440} brother={false} />
      <Person x={900} y={800} scale={1} color={TEAL} />
      <SayBubble x={900} y={570} text="هَذَا أَبِي، وَهُوَ أَبُو…" width={260} size={24} delay={0.3} />
      {lines >= 2 && <SayBubble x={1350} y={680} id="ahlan-ya-aba" text="أَهْلًا يَا أَبَا عُمَرَ!" align="right" width={260} size={24} accent delay={0.3} />}
    </>
  );
}

export function Fw3MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const rows = [['أَبُو عُمَرَ طَبِيبٌ.', U], ['رَأَيْتُ أَبَا عُمَرَ.', A], ['جَلَسْتُ مَعَ أَبِي عُمَرَ.', I]] as const;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[16px]" style={{ left: 900, top: 190, width: 540, height: 540, background: CARD, boxShadow: SHADOW, backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 69px, #E6D8C0 69px 71px)' }}
        initial={{ opacity: 0, rotate: 3, y: 30 }} animate={{ opacity: 1, rotate: 1, y: 0 }} transition={{ duration: 0.8, ease }} />
      {rows.slice(0, lines >= 2 ? 3 : 1).map(([t, c], i) => (
        <motion.span key={t} className="pointer-events-none absolute" style={{ right: 1600 - 1400, top: 250 + i * 72 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.3 }}>
          <ArText size={34} color={c}>{t}</ArText>
        </motion.span>
      ))}
    </>
  );
}

/** Exam week: three ways to say no on three cards. */
export function Fw3NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Person x={900} y={800} scale={1.02} color={KAREEM} />
      <Person x={1400} y={800} scale={1} color={TEAL} delay={0.15} />
      <SayBubble x={900} y={560} text="هَلْ دَرَسْتَ؟" width={180} size={28} delay={0.3} />
      {lines >= 2 && ['لَا أَدْرُسُ', 'مَا دَرَسْتُ', 'لَمْ أَدْرُسْ'].map((t, i) => (
        <Word key={t} x={1150 + (i - 1) * 0} y={250 + i * 100} color={[U, A, I][i]} size={40} delay={0.3 + i * 0.3} id={i === 2 ? 'lam-adrus' : undefined}>{t}</Word>
      ))}
      {lines >= 3 && <Chip x={1150} y={560} color={CRIMSON} delay={0.3}>three kinds of "not"</Chip>}
    </>
  );
}
