import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { type GraphicProps } from './Stage';
import { Chip, Person } from './kit';
import { ArText, Say, Skyline, ADAM, SAYED } from './g-ea1';
import { BookCard, StreetCard, Twin, Dial } from './g-es1';

/**
 * Egyptian Arabic · Sounds · Lesson 2 · Th and Dh. Same twins as Lesson 1 (book card → street sign). New pieces: a
 * profile of the teeth where the tongue tip either peeks out (Fusha th, dh) or stays behind (Cairo t, d); and the wow,
 * two layers of the city: the old street layer where ث / ذ became t / d, and the newer book layer where they became s / z.
 */

const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';
const BOOK = '#5A4636';
const JEWELLER = '#B4552F';
const STREET = '#8B5A36';
const LEARNED = '#3E6FA8';

/** Teeth in profile; `out` puts the tongue tip between them (th), otherwise it stays behind (t). */
function Teeth({ x, y, out, label, delay = 0 }: { x: number; y: number; out: boolean; label: string; delay?: number }) {
  return (
    <motion.div className="pointer-events-none absolute flex flex-col items-center" style={{ left: x - 90, top: y - 80 }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.6, ease }}>
      <svg viewBox="0 0 180 140" width={180} height={140}>
        <path d="M 20 40 Q 90 10 160 40 L 160 62 L 20 62 Z" fill="#E9B8A6" />
        <path d="M 20 100 Q 90 130 160 100 L 160 78 L 20 78 Z" fill="#E9B8A6" />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={110 + i * 12} y={50} width={10} height={16} rx={2} fill="#fff" />)}
        {[0, 1, 2, 3].map((i) => <rect key={`b${i}`} x={110 + i * 12} y={74} width={10} height={14} rx={2} fill="#fff" />)}
        <motion.path initial={false} animate={{ d: out ? 'M 30 70 Q 120 58 172 70 Q 120 82 30 74 Z' : 'M 30 70 Q 90 60 104 70 Q 90 80 30 74 Z' }} transition={{ duration: 0.6, delay: delay + 0.3 }} fill={CRIMSON} />
      </svg>
      <span className="font-sans font-bold" style={{ fontSize: 18, color: out ? BOOK : TEAL }}>{label}</span>
    </motion.div>
  );
}

/* ---------- spark ---------- */

export function Es2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Skyline opacity={0.2} />
      <Twin y={290} f="ذَهَبٌ" fs="dhahab" e="دهب" es="dahab" delay={0.4} />
      <Twin y={440} f="ثَلَاثَةٌ" fs="thalaatha" e="تلاتة" es="talaata" delay={1} />
      <motion.span className="pointer-events-none absolute rounded-full" style={{ left: 1140, top: 610, width: 80, height: 80, border: `12px solid ${GOLD}` }} initial={{ scale: 0, rotate: -60 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 1.4, type: 'spring' }} />
    </>
  );
}

export function Es2RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <StreetCard x={1000} y={300} word="قهوة" id="ahwa" sound="'ahwa" size={38} />
      <StreetCard x={1300} y={300} word="جميل" id="gamiil" sound="gamiil" size={38} delay={0.2} />
      {lines >= 2 && (
        <>
          <Teeth x={1150} y={560} out label="tongue between the teeth" delay={0.2} />
          <motion.span className="pointer-events-none absolute" style={{ left: 1290, top: 520 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}><ArText size={60} color={BOOK}>ث ذ</ArText></motion.span>
        </>
      )}
    </>
  );
}

export function Es2GoldGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[16px]" style={{ left: 1160, top: 380, width: 340, height: 300, background: '#3B2A22', boxShadow: `inset 0 0 0 10px ${GOLD}, ${SHADOW}` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="absolute rounded-full" style={{ left: 40 + (i % 3) * 95, top: 60 + Math.floor(i / 3) * 110, width: 46, height: 46, border: `8px solid ${GOLD}` }} />)}
      </motion.div>
      <Person x={900} y={800} scale={1.05} color={ADAM} />
      <Person x={1040} y={800} scale={1.02} color={SAYED} delay={0.15} />
      {lines >= 2 && <Person x={1330} y={800} scale={1} color={JEWELLER} delay={0.1} />}
      {lines >= 3 && <Chip x={1330} y={330} color={GOLD} delay={0.3}>3000 → ?</Chip>}
    </>
  );
}

/* ---------- zad ---------- */

export function Es2StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[12px]" style={{ left: 1150, top: 690, width: 360, height: 34, background: STREET }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <Person x={900} y={800} scale={1.05} color={ADAM} />
      <Person x={1330} y={800} scale={1} color={JEWELLER} />
      {k >= 3 && <Person x={1060} y={800} scale={1.02} color={SAYED} delay={0.1} />}
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={900} y={560} id="story-1" text="أُرِيدُ خَاتَمًا مِنَ ٱلذَّهَبِ." width={280} size={24} delay={0.3} />
          <Say x={1330} y={440} id="story-2" text="دهب؟ عندنا دهب جميل. بتلات آلاف." align="right" width={330} size={22} accent delay={1.8} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={900} y={560} id="story-3" text="ثَلَاثَةُ آلَافٍ؟ هَذَا كَثِيرٌ!" width={280} size={24} delay={0.3} />
          <Say x={1330} y={440} id="story-4" text="إنت ذكي يا أستاذ! خلاص، بألفين وتمنمية." align="right" width={350} size={22} accent delay={1.8} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={1060} y={560} id="story-5" text="مبروك يا آدم! أمك هتفرح." width={280} size={24} accent delay={0.3} />
        </React.Fragment>
      )}
    </>
  );
}

export function Es2ThaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Teeth x={1350} y={300} out label="Fusha: th" />
      {lines >= 2 && <Teeth x={1000} y={300} out={false} label="Cairo: t" delay={0.1} />}
      {lines >= 2 && <Twin y={470} f="ثَلَاثَةٌ" fid="thalatha-f" fs="thalaatha" e="تلاتة" eid="talata" es="talaata" size={36} />}
      {lines >= 3 && (
        <>
          <StreetCard x={1000} y={610} word="كتير" id="kitir" sound="kitiir" size={36} delay={0.2} />
          <StreetCard x={1250} y={610} word="تلج" id="talg" sound="talg" size={36} delay={0.4} />
          <Chip x={1130} y={700} color={TEAL} delay={0.7}>often written with ت</Chip>
        </>
      )}
    </>
  );
}

export function Es2DhalGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Dial x={1170} y={270} letter="ذ" book="dh" cairo="d" on={lines >= 2} />
      {lines >= 2 && (
        <>
          <Twin y={470} f="ذَهَبٌ" fid="dhahab-f" fs="dhahab" e="دهب" eid="dahab" es="dahab" size={36} />
          <Twin y={590} f="ذَيْلٌ" fs="dhayl" e="ديل" eid="deel" es="deel" size={36} delay={0.4} />
        </>
      )}
      {lines >= 3 && (
        <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-[10px]" style={{ left: 1010, top: 680, width: 300, height: 70, background: '#2B2A28', boxShadow: `inset 0 0 0 4px ${GOLD}` }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <ArText size={32} color={GOLD}>مجوهرات الدهب</ArText>
        </motion.div>
      )}
    </>
  );
}

/** Book words: the same letters, a second path to s and z. */
export function Es2BookGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Dial x={1170} y={260} letter="ث" book="th" cairo="t … or s" on />
      {lines >= 2 && (
        <>
          <StreetCard x={1380} y={470} word="ثورة" id="sawra" sound="sawra" size={34} />
          <StreetCard x={1150} y={470} word="مثلاً" id="masalan" sound="masalan" size={34} delay={0.2} />
          <StreetCard x={920} y={470} word="ذكي" id="zaki" sound="zaki" size={34} delay={0.4} />
        </>
      )}
      {lines >= 3 && <Chip x={1150} y={590} color={LEARNED} delay={0.3}>learned words: from books, news, religion</Chip>}
    </>
  );
}

export function Es2ZhaGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Dial x={1170} y={260} letter="ظ" book="dh (heavy)" cairo="d or z" on={lines >= 2} />
      {lines >= 2 && (
        <>
          <Person x={980} y={800} scale={1} color={ADAM} />
          <Say x={980} y={560} id="dahr" text="ضهري واجعني." width={200} size={26} delay={0.3} />
          <Chip x={980} y={420} color={STREET} delay={0.6}>old word: d</Chip>
        </>
      )}
      {lines >= 3 && (
        <>
          <StreetCard x={1340} y={500} word="ظريف" id="zariif" sound="zariif" size={36} delay={0.2} />
          <Chip x={1340} y={580} color={LEARNED} delay={0.5}>book word: z</Chip>
        </>
      )}
    </>
  );
}

/** The wow: two layers of the city. Words drop into the street layer or the book layer. */
export function Es2LayersGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const street = [['تلاتة', 'talaata'], ['دهب', 'dahab'], ['كتير', 'kitiir']];
  const book = [['ثقافة', 'saqaafa'], ['إذاعة', "izaa'a"], ['ذكي', 'zaki']];
  return (
    <>
      <Skyline opacity={0.25} />
      <motion.div className="pointer-events-none absolute rounded-[18px]" style={{ left: 820, top: 560, width: 680, height: 200, background: `${STREET}22`, boxShadow: `inset 0 0 0 3px ${STREET}66` }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} />
      <span className="pointer-events-none absolute font-sans font-black uppercase" style={{ left: 840, top: 570, fontSize: 15, letterSpacing: 2, color: STREET }}>old street layer · t / d</span>
      {lines >= 2 && street.map(([w, s], i) => <StreetCard key={w} x={980 + i * 200} y={670} word={w} sound={s} size={32} delay={0.2 + i * 0.2} />)}
      {lines >= 3 && (
        <>
          <motion.div className="pointer-events-none absolute rounded-[18px]" style={{ left: 820, top: 330, width: 680, height: 200, background: `${LEARNED}18`, boxShadow: `inset 0 0 0 3px ${LEARNED}55` }} initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} />
          <span className="pointer-events-none absolute font-sans font-black uppercase" style={{ left: 840, top: 340, fontSize: 15, letterSpacing: 2, color: LEARNED }}>newer book layer · s / z</span>
          {book.map(([w, s], i) => <BookCard key={w} x={980 + i * 200} y={440} word={w} sound={s} size={32} delay={0.3 + i * 0.2} />)}
        </>
      )}
    </>
  );
}

/* ---------- athar ---------- */

export function Es2TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[12px]" style={{ left: 1150, top: 690, width: 360, height: 34, background: STREET }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <Person x={900} y={800} scale={1.05} color={ADAM} />
      <Person x={1330} y={800} scale={1} color={JEWELLER} delay={0.1} />
      <Say x={900} y={560} id="bikam" text="ده بكام؟" width={150} size={28} delay={0.3} />
      {lines >= 2 && (
        <>
          <Say x={1330} y={440} text="بتلات آلاف." align="right" width={200} size={26} delay={0.2} />
          <Say x={900} y={430} id="kitir-awi" text="ده كتير أوي!" width={200} size={28} accent delay={1.2} />
        </>
      )}
    </>
  );
}

export function Es2MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      {[['دهب', 960, 260], ['تلاجات', 1260, 300], ['كتير', 1050, 470]].map(([w, x, y], i) => (
        <motion.div key={w as string} className="pointer-events-none absolute flex items-center justify-center rounded-[10px]" style={{ left: (x as number) - 110, top: (y as number) - 40, width: 220, height: 80, background: i === 1 ? TEAL : '#2B2A28', boxShadow: `inset 0 0 0 4px ${GOLD}, ${SHADOW}` }} initial={{ opacity: 0, rotate: -4 }} animate={{ opacity: 1, rotate: 0 }} transition={{ delay: 0.2 + i * 0.2 }}>
          <ArText size={44} color={i === 1 ? '#fff' : GOLD}>{w as string}</ArText>
        </motion.div>
      ))}
      {lines >= 2 && (
        <>
          <Chip x={1000} y={620} color={STREET} delay={0.2}>1 street word</Chip>
          <Chip x={1300} y={620} color={LEARNED} delay={0.4}>1 book word</Chip>
        </>
      )}
    </>
  );
}

export function Es2NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[30px]" style={{ left: 820, top: 300, width: 680, height: 260, background: '#D7DEE2', boxShadow: SHADOW }} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, ease }}>
        {[0, 1, 2, 3].map((i) => <span key={i} className="absolute rounded-[8px]" style={{ left: 40 + i * 160, top: 40, width: 120, height: 90, background: '#9FB3BF' }} />)}
      </motion.div>
      <Person x={1000} y={800} scale={1.05} color={ADAM} />
      {lines >= 1 && <BookCard x={1250} y={240} word="مَحَطَّةُ ٱلسَّادَاتِ" size={30} delay={0.4} />}
      {lines >= 2 && <StreetCard x={1250} y={640} word="المحطة الجاية: السادات." id="mahatta" size={28} delay={0.3} />}
      {lines >= 3 && <Chip x={1300} y={730} color={CRIMSON} delay={0.3}>shorter vowels · the Cairo stress</Chip>}
    </>
  );
}
