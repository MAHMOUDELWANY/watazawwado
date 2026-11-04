import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Chip, Person } from './kit';
import { Say, ADAM, MONA } from './g-ea1';
import { BookCard, StreetCard } from './g-es1';

/**
 * Egyptian Arabic · Sounds · Lesson 3 · Short and Stressed. New device: the rhythm track. Each syllable is a block in
 * Latin letters (the music, not the spelling): long syllables are wide, the stressed one stands tall. The Cairo habits
 * happen to the blocks: endings fall off the end, long blocks shrink, weak blocks pop, the tall block moves.
 */

const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';
const BOOK = '#5A4636';
const CAIRO = TEAL;

type Syl = { t: string; long?: boolean; stress?: boolean; gone?: boolean };

/** A row of syllable blocks centred at (x, y). Fusha blocks are paper; Cairo blocks are teal. */
function Track({ x, y, syl, cairo = false, delay = 0, unit = 70 }: { x: number; y: number; syl: Syl[]; cairo?: boolean; delay?: number; unit?: number }) {
  const shown = syl.filter((s) => !s.gone);
  const widths = syl.map((s) => (s.gone ? 0 : (s.long ? 1.6 : 1) * unit));
  const total = widths.reduce((a, b) => a + b, 0) + (shown.length - 1) * 8;
  let cur = x - total / 2;
  return (
    <>
      {syl.map((s, i) => {
        const w = widths[i];
        const left = cur;
        if (!s.gone) cur += w + 8;
        const h = s.stress ? 84 : 56;
        return (
          <motion.span key={i} className="pointer-events-none absolute flex items-center justify-center rounded-[12px] font-sans font-black"
            style={{ top: y - h / 2, height: h, fontSize: s.stress ? 26 : 20, background: cairo ? (s.stress ? CAIRO : `${CAIRO}cc`) : (s.stress ? '#E8D5B4' : '#F3E7D2'), color: cairo ? '#fff' : BOOK, boxShadow: s.stress ? `0 0 0 3px ${cairo ? '#fff' : BOOK}, ${SHADOW}` : SHADOW, overflow: 'hidden', whiteSpace: 'nowrap' }}
            initial={{ opacity: 0, y: 20, left, width: w }} animate={{ opacity: s.gone ? 0 : 1, y: s.gone ? 80 : 0, left, width: w }} transition={{ duration: 0.6, delay: delay + i * 0.08, ease }}>
            {s.t}
          </motion.span>
        );
      })}
    </>
  );
}

/** A metro carriage, for the scene pages. */
function Carriage() {
  return (
    <motion.div className="pointer-events-none absolute rounded-[30px]" style={{ left: 810, top: 360, width: 700, height: 260, background: '#D7DEE2', boxShadow: SHADOW }} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, ease }}>
      {[0, 1, 2, 3].map((i) => <span key={i} className="absolute rounded-[8px]" style={{ left: 40 + i * 165, top: 36, width: 125, height: 90, background: '#9FB3BF' }} />)}
      <span className="absolute" style={{ left: 0, top: 200, width: 700, height: 10, background: CRIMSON }} />
    </motion.div>
  );
}

/* ---------- spark ---------- */

export function Es3CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Track x={1160} y={280} syl={[{ t: 'mad' }, { t: 'ra' }, { t: 'sa' }, { t: 'tun' }]} />
      <Track x={1160} y={430} cairo delay={0.8} syl={[{ t: 'mad' }, { t: 'RA', stress: true }, { t: 'sa' }]} />
      <Chip x={1450} y={280} color={BOOK} delay={0.4}>book</Chip>
      <Chip x={1450} y={430} color={CAIRO} delay={1.2}>Cairo</Chip>
      <Person x={1000} y={800} scale={1} color={ADAM} delay={0.2} />
      <Person x={1300} y={800} scale={1} color={MONA} hijab delay={0.3} />
    </>
  );
}

export function Es3RecallGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <StreetCard x={1380} y={290} word="تلاتة" id="talata" sound="talaata" size={34} />
      <StreetCard x={1160} y={290} word="دهب" id="dahab" sound="dahab" size={34} delay={0.2} />
      <BookCard x={940} y={290} word="ذكي" id="zaki" sound="zaki" size={34} delay={0.4} />
      {lines >= 2 && <Track x={1160} y={500} cairo delay={0.2} syl={[{ t: '♪' }, { t: '♪', stress: true }, { t: '♪' }]} />}
      {lines >= 2 && <Chip x={1160} y={590} color={GOLD} delay={0.8}>today: the music</Chip>}
    </>
  );
}

export function Es3MetroGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Carriage />
      <BookCard x={1160} y={220} word="مَحَطَّةُ ٱلسَّادَاتِ" size={32} delay={0.3} />
      <Person x={980} y={800} scale={1.05} color={ADAM} />
      {lines >= 2 && <StreetCard x={1160} y={305} word="المحطة الجاية: السادات." size={28} delay={0.2} />}
      {lines >= 3 && <Person x={1340} y={800} scale={1} color={MONA} hijab delay={0.1} />}
    </>
  );
}

/* ---------- zad ---------- */

export function Es3StoryGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Carriage />
      <Person x={980} y={800} scale={1.05} color={ADAM} />
      <Person x={1340} y={800} scale={1} color={MONA} hijab />
      {k === 1 && (
        <React.Fragment key="a">
          <StreetCard x={1160} y={250} word="المحطة الجاية: السادات." id="story-1" size={28} delay={0.2} />
          <Say x={980} y={560} id="story-2" text="مَحَطَّةُ ٱلسَّادَاتِ." width={240} size={24} delay={1.8} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={1340} y={560} id="story-3" text="إنت رايح فين يا آدم؟" align="right" width={240} size={24} delay={0.3} />
          <Say x={980} y={440} id="story-4" text="رايح المدرسة… مدرسة!" width={260} size={24} accent delay={1.8} />
        </React.Fragment>
      )}
      {k === 3 && (
        <React.Fragment key="c">
          <Say x={1340} y={560} id="story-5" text="برافو! الكلام هنا أسرع، والآخر بيقع." align="right" width={340} size={22} accent delay={0.3} />
        </React.Fragment>
      )}
    </>
  );
}

/** The case ending block drops off the end of the track. */
export function Es3EndingsGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const cut = lines >= 2;
  return (
    <>
      <Track x={1160} y={250} cairo={cut} syl={[{ t: 'mad' }, { t: cut ? 'RA' : 'ra', stress: cut }, { t: 'sa' }, { t: 'tun', gone: cut }]} />
      <Track x={1160} y={400} cairo={cut} delay={0.2} syl={[{ t: 'ki' }, { t: 'taab', long: true, stress: cut }, { t: 'un', gone: cut }]} />
      <Track x={1160} y={550} cairo={cut} delay={0.4} syl={[{ t: cut ? 'beet' : 'bay', long: cut, stress: cut }, { t: 'tun', gone: cut }]} />
      {cut && <Chip x={1160} y={660} color={CAIRO} delay={0.8}>madrása · kitaab · beet</Chip>}
      {lines >= 3 && <Chip x={1160} y={720} color={GOLD} delay={0.3}>the grammar stays in your head</Chip>}
    </>
  );
}

/** A long block shrinks when two consonants follow. */
export function Es3ShrinkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Track x={1160} y={250} syl={[{ t: 'ki' }, { t: 'taa' , long: true }, { t: 'bu' }, { t: 'haa', long: true }]} />
      {lines >= 2 && <Track x={1160} y={380} cairo delay={0.2} syl={[{ t: 'ki' }, { t: 'TAB', stress: true }, { t: 'ha' }]} />}
      {lines >= 2 && <StreetCard x={1440} y={380} word="كتابها" id="kitabha" size={30} delay={0.6} />}
      {lines >= 3 && (
        <>
          <Track x={1100} y={540} cairo delay={0.1} syl={[{ t: 'baab', long: true, stress: true }]} />
          <Track x={1100} y={640} cairo delay={0.3} syl={[{ t: 'BAB', stress: true }, { t: 'ha' }]} />
          <StreetCard x={1380} y={540} word="باب" id="baab" size={30} delay={0.5} />
          <StreetCard x={1380} y={640} word="بابها" id="babha" size={30} delay={0.7} />
        </>
      )}
    </>
  );
}

/** A weak vowel block pops out of the middle. */
export function Es3DropGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Track x={1160} y={250} cairo syl={[{ t: 'RAA', long: true, stress: true }, { t: 'yiḥ' }]} />
      <StreetCard x={1440} y={250} word="رايح" id="rayih" size={30} delay={0.4} />
      {lines >= 1 && <Track x={1160} y={390} cairo delay={0.4} syl={[{ t: 'RAY', stress: true }, { t: 'i', gone: true }, { t: 'ḥa' }]} />}
      {lines >= 1 && <StreetCard x={1440} y={390} word="رايحة" id="rayha" size={30} delay={0.8} />}
      {lines >= 2 && (
        <>
          <Track x={1100} y={540} cairo delay={0.1} syl={[{ t: 'SAA', long: true, stress: true }, { t: 'kin' }]} />
          <Track x={1100} y={640} cairo delay={0.3} syl={[{ t: 'SAK', stress: true }, { t: 'na' }]} />
          <StreetCard x={1380} y={540} word="ساكن" id="sakin" size={30} delay={0.5} />
          <StreetCard x={1380} y={640} word="ساكنة" id="sakna" size={30} delay={0.7} />
        </>
      )}
      {lines >= 3 && <Chip x={1160} y={730} color={CRIMSON} delay={0.3}>a weak vowel between two strong ones: gone</Chip>}
    </>
  );
}

/** The tall block moves from the start towards the end. */
export function Es3StressGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  const cairo = lines >= 2;
  return (
    <>
      <Track x={1160} y={280} cairo={cairo} syl={[{ t: cairo ? 'mad' : 'MAD', stress: !cairo }, { t: cairo ? 'RA' : 'ra', stress: cairo }, { t: 'sa' }]} />
      {cairo && <StreetCard x={1440} y={280} word="مدرسة" id="madrasa-2" size={30} delay={0.5} />}
      {cairo && <Track x={1160} y={430} cairo delay={0.3} syl={[{ t: 'mak' }, { t: 'TA', stress: true }, { t: 'ba' }]} />}
      {cairo && <StreetCard x={1440} y={430} word="مكتبة" id="maktaba" size={30} delay={0.8} />}
      {lines >= 3 && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="pointer-events-none absolute rounded-full" style={{ left: 1080 + i * 80, top: 560, width: i === 1 ? 60 : 36, height: i === 1 ? 60 : 36, background: i === 1 ? CAIRO : `${CAIRO}66` }}
              initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 0.3 + i * 0.3, duration: 0.5 }} />
          ))}
          <Chip x={1160} y={660} color={GOLD} delay={1.2}>soft · LOUD · soft</Chip>
        </>
      )}
    </>
  );
}

/** The wow: nine Fusha blocks collapse into three Cairo blocks. */
export function Es3MusicGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Chip x={1160} y={190} color={soft('light')}>endings · shrink · drop · beat</Chip>
      {lines >= 2 && (
        <>
          <Track x={1160} y={300} unit={56} syl={[{ t: 'i' }, { t: 'laa', long: true }, { t: 'ay' }, { t: 'na' }, { t: 'an' }, { t: 'ta' }, { t: 'dhaa', long: true }, { t: 'hi' }, { t: 'bun' }]} />
          <BookCard x={1160} y={390} word="إِلَى أَيْنَ أَنْتَ ذَاهِبٌ؟" id="ila-ayna" size={28} delay={0.4} />
          <Track x={1160} y={520} cairo delay={0.8} syl={[{ t: 'RAA', long: true, stress: true }, { t: 'yiḥ' }, { t: 'feen', long: true }]} />
          <StreetCard x={1160} y={610} word="رايح فين؟" id="rayih-fen" size={30} delay={1.2} />
        </>
      )}
      {lines >= 3 && (
        <>
          <Chip x={950} y={700} color={BOOK} delay={0.2}>9 syllables</Chip>
          <Chip x={1370} y={700} color={CAIRO} delay={0.4}>3 syllables</Chip>
        </>
      )}
    </>
  );
}

/* ---------- athar ---------- */

export function Es3TalkGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <Carriage />
      <StreetCard x={1160} y={250} word="المحطة الجاية: العتبة." id="mahatta-gaya" size={28} delay={0.2} />
      <Person x={980} y={800} scale={1.05} color={ADAM} />
      {lines >= 2 && <Person x={1340} y={800} scale={1} color={MONA} hijab delay={0.1} />}
      {lines >= 2 && <Say x={1340} y={560} id="rayha-fen" text="إنتي رايحة فين؟" align="right" width={210} size={26} delay={0.4} />}
    </>
  );
}

export function Es3MissionGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[20px]" style={{ left: 900, top: 190, width: 520, height: 300, background: '#2A1E18', boxShadow: SHADOW }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <span className="absolute" style={{ left: 230, top: 120, width: 0, height: 0, borderTop: '30px solid transparent', borderBottom: '30px solid transparent', borderLeft: `50px solid ${CAIRO}` }} />
        <span className="absolute font-sans font-bold" style={{ left: 20, top: 260, fontSize: 16, color: '#fff' }}>0:30</span>
      </motion.div>
      {lines >= 2 && (
        <>
          <Track x={1160} y={580} cairo delay={0.2} syl={[{ t: 'play' }, { t: 'pause', long: true, stress: true }, { t: 'say' }]} />
          <Chip x={1160} y={680} color={GOLD} delay={0.6}>play · pause · say it back · ×5</Chip>
        </>
      )}
      <span className="hidden">{INK_TEXT}</span>
    </>
  );
}

export function Es3NextGraphic({ lines }: GraphicProps) {
  if (lines < 1) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-t-[80px]" style={{ left: 1200, top: 330, width: 200, height: 470, background: '#7A4A2A' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} />
      <Person x={980} y={800} scale={1.05} color={ADAM} />
      <Person x={1300} y={800} scale={1} color={CRIMSON} hijab delay={0.2} />
      <Say x={1300} y={560} id="beet-beetak" text="أهلاً! البيت بيتك." align="right" width={240} size={26} accent delay={0.4} />
      {lines >= 2 && (
        <>
          <Track x={900} y={300} delay={0.2} syl={[{ t: 'bay' }, { t: 'tun' }]} />
          <Track x={900} y={400} cairo delay={0.5} syl={[{ t: 'BEET', long: true, stress: true }]} />
        </>
      )}
      {lines >= 3 && <Chip x={900} y={480} color={CRIMSON} delay={0.3}>ay → ee · aw → oo</Chip>}
    </>
  );
}
