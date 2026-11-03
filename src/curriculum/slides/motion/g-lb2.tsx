import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, useReduce, type GraphicProps } from './Stage';
import { Cut, Chip, Badge, Svg, Draw, DEEP } from './kit';
import { Q, Book } from './g-lb1';

/**
 * Literacy B · Lesson 2 · The Alif That Stands Up (Kids look, the Zad Kids cast). The motion carries one idea: a helper
 * mark asks the voice to stretch, and the stretch is drawn as a gold bar that grows for two beats under the long sound.
 * Ayat use Amiri Quran and play the reciter on tap.
 */

const KIDS = 'zad-kids/characters';
const CARD = '#FFFDF8';
const SHADOW = '0 18px 34px -24px rgba(60,30,10,0.6)';

/** A word card in the Mushaf font with a stretch bar under it that fills in two beats. */
function StretchCard({ x, y, word, clip, sound, color = GOLD, delay = 0, size = 64, w = 300 }: { x: number; y: number; word: string; clip?: string; sound: string; color?: string; delay?: number; size?: number; w?: number }) {
  const reduce = useReduce();
  return (
    <motion.div className="absolute flex flex-col items-center rounded-[24px]" style={{ left: x - w / 2, top: y, width: w, padding: '4px 10px 14px', background: CARD, boxShadow: SHADOW }}
      initial={{ opacity: 0, y: 24, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.35, delay }}>
      <Q size={size} clip={clip}>{word}</Q>
      <div className="flex items-center gap-2" style={{ width: '80%' }}>
        {[0, 1].map((b) => (
          <motion.span key={b} className="block flex-1 rounded-full" style={{ height: 10, background: color, transformOrigin: 'left' }}
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduce ? 0 : 0.45, delay: delay + 0.6 + b * 0.5, ease: 'linear' }} />
        ))}
        <span className="font-sans font-black" style={{ fontSize: 22, color }}>{sound}</span>
      </div>
    </motion.div>
  );
}

/* ---------- spark ---------- */

/** ar-Rahmaan in the Mushaf script; a gold ring pulses on the little alif standing on the meem; Maryam looks up at it. */
export function Lb2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <motion.div className="absolute" style={{ left: 820, top: 230 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }}>
        <span className="inline-block rounded-[28px]" style={{ padding: '0 40px', background: CARD, boxShadow: SHADOW }}><Q size={120} clip="fatiha-3">ٱلرَّحْمَـٰنِ</Q></span>
      </motion.div>
      <Chip x={1060} y={430} color={GOLD} delay={1.2}>a little alif, standing on the meem</Chip>
      <Cut src={`${KIDS}/maryam-amazed`} x={1400} y={830} h={300} delay={0.6} />
    </>
  );
}

/** Three helpers come back as cards; each lights up with its job when its turn comes. */
export function Lb2RecallGraphic({ items }: GraphicProps) {
  const helpers = [{ g: 'ٱ', job: 'skip me' }, { g: 'مَـٰ', job: 'stretch' }, { g: 'هُۥ', job: '"oo"' }];
  return (
    <>
      <div className="absolute flex gap-8" dir="rtl" style={{ left: 900, top: 240 }}>
        {helpers.map((h, i) => {
          const on = items > i;
          return (
            <motion.div key={h.g} className="flex flex-col items-center justify-center rounded-[28px]" style={{ width: 170, height: 200, background: CARD, boxShadow: on ? `0 0 0 4px ${GOLD}, ${SHADOW}` : SHADOW }}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0, scale: on ? 1.05 : 1 }} transition={{ type: 'spring', bounce: 0.35, delay: items ? 0 : 0.2 + i * 0.15 }}>
              <Q size={90} color={CRIMSON}>{h.g}</Q>
              <span className="font-sans font-black" style={{ fontSize: 22, color: on ? INK_TEXT : 'transparent' }}>{h.job}</span>
            </motion.div>
          );
        })}
      </div>
      <Cut src={`${KIDS}/yusuf-think`} x={1430} y={830} h={260} />
    </>
  );
}

/** Maryam rushes through Bismillah; Jiddo points; the tiny standing alif on the meem lights up. */
export function Lb2FastGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Book x={1130} y={330} w={560} mushaf open><Q size={40} clip="fatiha-1">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</Q></Book>}
      <Cut src={`${KIDS}/maryam-happy`} x={860} y={830} h={290} />
      {lines >= 1 && (
        <motion.div className="absolute" style={{ left: 800, top: 470 }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: [0, 8, 0] }} transition={{ duration: 0.5, repeat: 2 }}>
          <span className="inline-block rounded-[18px] font-sans font-black" style={{ padding: '6px 16px', fontSize: 26, background: CARD, boxShadow: SHADOW }}>"ar-Rahmani…" 💨</span>
        </motion.div>
      )}
      {lines >= 2 && <Cut src={`${KIDS}/jiddo-explain`} x={1430} y={830} h={320} delay={0.1} />}
      {lines >= 2 && <Chip x={1130} y={560} color={CRIMSON} delay={0.4}>look at the meem of ar-Rahmaan</Chip>}
      {lines >= 3 && <Chip x={1130} y={610} color={GOLD} delay={0.2}>who is standing there?</Chip>}
    </>
  );
}

/* ---------- zad ---------- */

/** Three Fatiha words, each with its two-beat stretch bar filling under it. */
export function Lb2StandGraphic({ lines, items }: GraphicProps) {
  const words = [{ w: 'ٱلرَّحْمَـٰنِ', c: 'fatiha-3', s: 'maa' }, { w: 'مَـٰلِكِ', c: 'fatiha-4', s: 'maa' }, { w: 'ٱلْعَـٰلَمِينَ', c: 'fatiha-2', s: '‘aa' }];
  return (
    <>
      {lines >= 1 && items === 0 && (
        <motion.div className="absolute flex items-end gap-10" style={{ left: 900, top: 260 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex flex-col items-center"><Q size={110}>ا</Q><span className="font-sans font-bold" style={{ fontSize: 18, color: soft('light') }}>alif, standing beside</span></div>
          <span className="font-sans font-black" style={{ fontSize: 50, color: GOLD }}>=</span>
          <div className="flex flex-col items-center"><Q size={110} color={CRIMSON}>مَـٰ</Q><span className="font-sans font-bold" style={{ fontSize: 18, color: CRIMSON }}>alif, standing on top</span></div>
        </motion.div>
      )}
      {lines >= 2 && items === 0 && <Chip x={1140} y={560} color={GOLD} delay={0.3}>it says: stretch me</Chip>}
      {words.slice(0, items).map((w, i) => <StretchCard key={w.c} x={1150} y={180 + i * 200} word={w.w} clip={w.c} sound={w.s} size={58} w={380} delay={0.1} />)}
      <Cut src={`${KIDS}/maryam-point`} x={1460} y={830} h={250} />
    </>
  );
}

/** One clap for a short sound, two for a long one: the beats light up in time under ma and maa. */
export function Lb2ClapsGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  const row = (label: string, beats: number, y: number, color: string, delay: number) => (
    <motion.div className="absolute flex items-center gap-6" style={{ left: 880, top: y }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.6, ease }}>
      <span className="inline-block rounded-[20px]" style={{ width: 170, textAlign: 'center', background: CARD, boxShadow: SHADOW }}><Q size={70} color={color}>{label}</Q></span>
      {Array.from({ length: beats }, (_, b) => (
        <motion.span key={b} className="flex items-center justify-center rounded-full" style={{ width: 84, height: 84, background: color, boxShadow: `0 0 24px ${color}88` }}
          initial={{ scale: 0 }} animate={reduce ? { scale: 1 } : { scale: [0, 1.15, 1] }} transition={{ delay: delay + 0.5 + b * 0.5, duration: 0.4 }}>
          <span style={{ fontSize: 40 }}>👏</span>
        </motion.span>
      ))}
    </motion.div>
  );
  return (
    <>
      {lines >= 2 && row('مَ', 1, 230, TEAL, 0)}
      {lines >= 2 && row('مَا', 2, 420, CRIMSON, 0.6)}
      {lines >= 1 && lines < 2 && <Badge x={1150} y={430} name="heart" size={140} color={CRIMSON} />}
      {lines >= 3 && (
        <Svg>
          <Draw d="M 860 680 L 960 680 L 990 620 L 1020 740 L 1050 680 L 1180 680 L 1210 620 L 1240 740 L 1270 680 L 1460 680" color={CRIMSON} width={4} dur={1.4} />
        </Svg>
      )}
      {lines >= 3 && <Chip x={1150} y={760} color={CRIMSON} delay={0.8}>two beats, like a heartbeat</Chip>}
    </>
  );
}

/** The storybook's هذا next to the Mushaf's هَـٰذَا: the hidden alif sound appears as a gold ghost, then stands up. */
export function Lb2HadhaGraphic({ lines }: GraphicProps) {
  return (
    <>
      <motion.div className="absolute flex flex-col items-center rounded-[26px]" style={{ left: 820, top: 220, width: 300, padding: '18px 0', background: '#FFF3D6', boxShadow: SHADOW }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <span className="font-sans font-bold uppercase" style={{ fontSize: 15, letterSpacing: '0.16em', color: soft('light') }}>storybook</span>
        <span lang="ar" dir="rtl" style={{ fontFamily: 'var(--font-display-ar)', fontWeight: 800, fontSize: 90, color: INK_TEXT }}>
          ه{lines >= 2 && <motion.span style={{ color: GOLD }} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.6] }} transition={{ duration: 1.2 }}>ـا</motion.span>}ذا
        </span>
        {lines >= 2 && <span className="font-sans font-bold" style={{ fontSize: 18, color: GOLD }}>a long "aa" you hear but cannot see</span>}
      </motion.div>
      {lines >= 3 && (
        <>
          <Svg><Draw d="M 1130 320 L 1200 320" color={CRIMSON} width={4} dur={0.5} /><Draw d="M 1186 308 L 1202 320 L 1186 332" color={CRIMSON} width={4} delay={0.4} dur={0.3} /></Svg>
          <motion.div className="absolute flex flex-col items-center rounded-[26px]" style={{ left: 1220, top: 220, width: 300, padding: '18px 0', background: CARD, boxShadow: `0 0 0 4px ${CRIMSON}, ${SHADOW}` }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <span className="font-sans font-bold uppercase" style={{ fontSize: 15, letterSpacing: '0.16em', color: CRIMSON }}>Mushaf</span>
            <Q size={90} clip="quraysh-3">هَـٰذَا</Q>
          </motion.div>
        </>
      )}
      {lines >= 4 && <Chip x={1170} y={520} color={TEAL} delay={0.2}>the Mushaf shows what the storybook hides</Chip>}
      <Cut src={`${KIDS}/yusuf-surprised`} x={1180} y={830} h={250} delay={0.2} />
    </>
  );
}

/** لَهُۥ and يَرَهُۥ: the small waw lights and the "oo" bar fills under each. */
export function Lb2WawGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <motion.div className="absolute flex items-center gap-6" style={{ left: 880, top: 220 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="inline-block rounded-[22px]" style={{ padding: '0 26px', background: CARD, boxShadow: SHADOW }}><Q size={84}>هُ</Q></span>
          <span className="font-sans font-black" style={{ fontSize: 40, color: GOLD }}>+</span>
          <span className="inline-block rounded-[22px]" style={{ padding: '0 26px', background: CARD, boxShadow: `0 0 0 4px ${TEAL}, ${SHADOW}` }}><Q size={84} color={TEAL}>ۥ</Q></span>
          <span className="font-sans font-black" style={{ fontSize: 40, color: GOLD }}>=</span>
          <span className="font-sans font-black" style={{ fontSize: 44, color: TEAL }}>hoo</span>
        </motion.div>
      )}
      {lines >= 2 && <StretchCard x={1000} y={430} word="لَّهُۥ" clip="ikhlas-4" sound="hoo" color={TEAL} w={260} />}
      {lines >= 3 && <StretchCard x={1300} y={430} word="يَرَهُۥ" clip="zalzalah-7" sound="hoo" color={TEAL} w={260} delay={0.2} />}
      <Cut src={`${KIDS}/yusuf-listen`} x={1450} y={830} h={240} />
    </>
  );
}

/** The ayah about food: a plate, the word طَعَامِهِۦٓ with its "ee" bar, then the second helper found in ٱلْإِنسَـٰنُ. */
export function Lb2YaaGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Badge x={1380} y={300} name="bowl" size={130} color={GOLD} />
      {lines >= 1 && <StretchCard x={1060} y={250} word="طَعَامِهِۦٓ" clip="abasa-24" sound="hee" color={CRIMSON} w={340} />}
      {lines >= 2 && <StretchCard x={1060} y={470} word="ٱلْإِنسَـٰنُ" clip="abasa-24" sound="saa" w={340} delay={0.2} />}
      {lines >= 3 && <Chip x={1380} y={420} color={TEAL} delay={0.3}>Bismillah 🍽️</Chip>}
    </>
  );
}

/* ---------- athar ---------- */

/** The ayah on a Mushaf page; the learner hunts the three stretches. */
export function Lb2SpotGraphic({ lines, interaction }: GraphicProps) {
  return (
    <>
      {(lines >= 1 || interaction) && <Book x={1130} y={360} w={560} mushaf open><Q size={40} clip="abasa-24">فَلْيَنظُرِ ٱلْإِنسَـٰنُ إِلَىٰ طَعَامِهِۦٓ</Q></Book>}
      <Cut src={`${KIDS}/maryam-think`} x={1460} y={830} h={260} />
    </>
  );
}

/** Yusuf follows the line with his finger while the reciter reads; each stretch lights as he passes it. */
export function Lb2AlongGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Book x={1120} y={340} w={560} mushaf open><Q size={40} clip="abasa-24b">فَلْيَنظُرِ ٱلْإِنسَـٰنُ إِلَىٰ طَعَامِهِۦٓ</Q></Book>}
      {lines >= 2 && ['saa', 'laa', 'hee'].map((t, i) => <Chip key={t} x={980 + i * 140} y={560} color={GOLD} delay={0.4 + i * 0.5}>{`${t} · 2 beats`}</Chip>)}
      <Cut src={`${KIDS}/yusuf-point`} x={1430} y={830} h={280} />
    </>
  );
}

/* ---------- ahd ---------- */

/** Al-Fatiha's first four ayat; four gold rings count the standing alifs one by one. */
export function Lb2MissionGraphic({ lines }: GraphicProps) {
  const rows = ['بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ', 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', 'مَـٰلِكِ يَوْمِ ٱلدِّينِ'];
  return (
    <>
      {lines >= 1 && <motion.div className="absolute flex flex-col items-end gap-1 rounded-[24px]" dir="rtl" style={{ left: 840, top: 180, width: 520, padding: '18px 30px', background: '#FBF4E2', boxShadow: `inset 0 0 0 4px ${GOLD}66, ${SHADOW}` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {rows.map((r) => <Q key={r} size={34}>{r}</Q>)}
      </motion.div>}
      {lines >= 2 && [1, 2, 3, 4].map((n, i) => (
        <motion.span key={n} className="absolute flex items-center justify-center rounded-full font-sans font-black text-white" style={{ left: 1390, top: 200 + i * 66, width: 44, height: 44, fontSize: 22, background: GOLD }}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.4, type: 'spring', bounce: 0.5 }}>{n}</motion.span>
      ))}
      <Cut src={`${KIDS}/maryam-happy`} x={1100} y={830} h={250} delay={0.3} />
    </>
  );
}

/** Surah Quraysh: an alif with a tiny circle; the reciter skips it; Yusuf is puzzled. */
export function Lb2NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && <Book x={1100} y={330} w={520} mushaf open><Q size={42} clip="quraysh-3b">فَلْيَعْبُدُوا۟ رَبَّ هَـٰذَا ٱلْبَيْتِ</Q></Book>}
      {lines >= 2 && <Chip x={1100} y={560} color={CRIMSON} delay={0.2}>the alif after the waw: written… but silent?</Chip>}
      <Cut src={`${KIDS}/yusuf-surprised`} x={1450} y={830} h={270} />
      {lines >= 3 && <span className="pointer-events-none absolute font-sans font-black" style={{ left: 1390, top: 470, fontSize: 70, color: DEEP }}>?</span>}
    </>
  );
}
