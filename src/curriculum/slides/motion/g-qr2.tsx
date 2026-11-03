import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Svg, Draw, Chip, Badge } from './kit';
import { Q, Panel, ReadingStage, MUSHAF, Red, glow } from './g-qr1';

/**
 * Quran Reading · Lesson 2 · The Last Two Surahs. Same Mushaf panel and three moves as Lesson 1 (listen, follow, read).
 * The motion for the reading focus: two copies of a letter slide together into one with a shadda, and the word splits
 * into its beats at the doubled letter (rab | bi). Ayat play the reciter on tap.
 */

const CARD = '#FFFDF8';
const SHADOW = '0 18px 34px -24px rgba(60,30,10,0.6)';

/* ---------- spark ---------- */

export function Qr2CoverGraphic(_: GraphicProps) {
  return (
    <Panel x={900} y={250} w={580} h={300}>
      <Q size={44} color="#F6E3B8" clip="nas-1">قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ</Q>
      <Q size={44} color="#F6E3B8">مَلِكِ ٱلنَّاسِ</Q>
    </Panel>
  );
}

/** Al-Fatiha's opening on the panel, with a gold "paused" tag waiting for the learner's weak ayat. */
export function Qr2WarmGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Panel x={860} y={200} w={620} h={300}>
        <Q size={40} color="#F6E3B8" clip="fatiha-1">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</Q>
        <Q size={40} color="#F6E3B8">ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ</Q>
      </Panel>
      {lines >= 2 && <Chip x={1170} y={540} color={GOLD} delay={0.3}>paused last time? read it first</Chip>}
    </>
  );
}

/* ---------- zad ---------- */

/** Two baa's slide together into one with a shadda; then the word splits at it into two beats. */
export function Qr2ShaddaGraphic({ lines, items }: GraphicProps) {
  const merged = lines >= 1;
  const words = [{ w: 'بِرَبِّ', beats: 'bi-rab | bi', clip: 'nas-1' }, { w: 'شَرِّ', beats: 'shar | ri', clip: 'falaq-2' }, { w: 'ٱلنَّاسِ', beats: 'an | naa | si', clip: 'nas-1' }];
  return (
    <>
      {merged && items === 0 && (
        <div className="absolute flex items-center justify-center" style={{ left: 820, top: 220, width: 680, height: 220 }}>
          {[0, 1].map((i) => (
            <motion.span key={i} className="absolute inline-block rounded-[24px]" style={{ padding: '0 30px', background: CARD, boxShadow: SHADOW }}
              initial={{ x: i ? 150 : -150, opacity: 1 }} animate={{ x: 0, opacity: i ? 0 : 1 }} transition={{ duration: 0.9, delay: 0.5, ease }}>
              <Q size={110}>{i ? 'ب' : 'بّ'}</Q>
            </motion.span>
          ))}
        </div>
      )}
      {merged && items === 0 && <Chip x={1160} y={470} color={CRIMSON} delay={0.6}>shadda ّ = the letter twice</Chip>}
      {lines >= 2 && items === 0 && (
        <motion.div className="absolute flex items-center gap-4" style={{ left: 900, top: 560 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {['rab', 'bi'].map((b, i) => (
            <React.Fragment key={b}>
              {i === 1 && <span className="block rounded-full" style={{ width: 6, height: 60, background: GOLD }} />}
              <span className="inline-block rounded-[18px] font-sans font-black" style={{ padding: '8px 22px', fontSize: 40, background: i ? TEAL : CRIMSON, color: '#fff' }}>{b}</span>
            </React.Fragment>
          ))}
          <span className="font-sans font-bold" style={{ fontSize: 20, color: soft('light'), marginLeft: 10 }}>close, then open</span>
        </motion.div>
      )}
      {words.slice(0, items).map((w, i) => (
        <motion.div key={i} className="absolute flex items-center gap-6 rounded-[22px]" style={{ left: 860, top: 200 + i * 170, width: 600, padding: '0 26px', background: CARD, boxShadow: SHADOW }}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease }}>
          <Q size={74} clip={w.clip}>{w.w}</Q>
          <span className="font-sans font-black" style={{ fontSize: 30, color: CRIMSON }}>{w.beats}</span>
        </motion.div>
      ))}
    </>
  );
}

export function Qr2Nas1Graphic({ lines }: GraphicProps) {
  return (
    <ReadingStage lines={lines}
      ayat={[
        { clip: 'nas-1', text: (on) => <>قُلْ أَعُوذُ <span style={glow(on)}>بِرَبِّ</span> <span style={glow(on)}>ٱلنَّاسِ</span></> },
        { clip: 'nas-2', text: (on) => <>مَلِكِ <span style={glow(lines >= 3 && on)}>ٱلنَّاسِ</span></> },
        { clip: 'nas-3', text: (on) => <>إِلَـٰهِ <span style={glow(lines >= 3 && on)}>ٱلنَّاسِ</span></> },
      ]}
      focus={<Red>بِرَبِّ ٱلنَّاسِ</Red>} note="bi-rab-bin-naas · ayat 2 and 3: read before you hear" />
  );
}

export function Qr2Nas4Graphic({ lines }: GraphicProps) {
  const step = lines >= 3 ? 2 : 1;
  return (
    <ReadingStage lines={lines}
      ayat={[
        { clip: 'nas-4', text: (on) => <>مِن <span style={glow(on && step === 1)}>شَرِّ</span> ٱلْوَسْوَاسِ <span style={glow(on && step === 1)}>ٱلْخَنَّاسِ</span></> },
        { clip: 'nas-5', text: (on) => <><span style={glow(on && step === 2)}>ٱلَّذِى</span> يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ</> },
        { clip: 'nas-6', text: (on) => <>مِنَ <span style={glow(on && step === 1)}>ٱلْجِنَّةِ</span> وَٱلنَّاسِ</> },
      ]}
      focus={<React.Fragment key={step}>{step === 2 ? <Red>ٱلَّذِى</Red> : <Red>ٱلْخَنَّاسِ</Red>}</React.Fragment>}
      note={step === 2 ? 'al-ladhee · the lam is doubled' : 'al-khan-naas · al-jin-nah'} noteAt={2} />
  );
}

/** The six ayat of An-Nas as rows; their endings light up one by one, all "-aas". */
export function Qr2RhymeGraphic({ lines }: GraphicProps) {
  const ayat = ['قُلْ أَعُوذُ بِرَبِّ', 'مَلِكِ', 'إِلَـٰهِ', 'مِن شَرِّ ٱلْوَسْوَاسِ', 'ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ', 'مِنَ ٱلْجِنَّةِ وَ'];
  const ends = ['ٱلنَّاسِ', 'ٱلنَّاسِ', 'ٱلنَّاسِ', 'ٱلْخَنَّاسِ', 'ٱلنَّاسِ', 'ٱلنَّاسِ'];
  if (lines === 0) return null;
  return (
    <>
      <div className="absolute flex flex-col gap-2" style={{ left: 830, top: 180, width: 560 }}>
        {ayat.map((a, i) => (
          <motion.div key={i} className="flex items-center justify-end gap-3 rounded-[14px]" dir="rtl" style={{ padding: '0 18px', height: 72, background: MUSHAF, justifyContent: 'flex-start' }}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08, duration: 0.5, ease }}>
            <Q size={28} color="#F6E3B8">{a}</Q>
            <motion.span initial={false} animate={{ scale: lines >= 2 ? 1.08 : 1 }} transition={{ delay: lines >= 2 ? 0.3 + i * 0.25 : 0 }}>
              <Q size={30} color={lines >= 2 ? GOLD : '#F6E3B8'} style={lines >= 2 ? { textShadow: `0 0 16px ${GOLD}` } : undefined}>{ends[i]}</Q>
            </motion.span>
          </motion.div>
        ))}
      </div>
      {lines >= 2 && <Chip x={1450} y={300} color={GOLD} delay={1.8}>-aas</Chip>}
      {lines >= 3 && <Chip x={1450} y={460} color={CRIMSON} delay={0.2}>5 × ٱلنَّاسِ</Chip>}
    </>
  );
}

export function Qr2Falaq1Graphic({ lines }: GraphicProps) {
  return (
    <ReadingStage lines={lines}
      ayat={[
        { clip: 'falaq-1', text: (on) => <>قُلْ أَعُوذُ <span style={glow(on && lines < 3)}>بِرَبِّ</span> ٱلْفَلَقِ</> },
        { clip: 'falaq-2', text: (on) => <>مِن <span style={glow(on && lines >= 3)}>شَرِّ</span> مَا خَلَقَ</> },
        { clip: 'falaq-3', text: (on) => <>وَمِن <span style={glow(on && lines >= 3)}>شَرِّ</span> غَاسِقٍ إِذَا وَقَبَ</> },
      ]}
      focus={<React.Fragment key={lines >= 3 ? 'b' : 'a'}>{lines >= 3 ? <Red>شَرِّ</Red> : <Red>بِرَبِّ ٱلْفَلَقِ</Red>}</React.Fragment>}
      note={lines >= 3 ? 'shar-ri · four times in the surah' : 'the same opening as An-Nas'} noteAt={2} />
  );
}

/** The hardest word breaks into four beats that light one by one, then close back into the word. */
export function Qr2Falaq4Graphic({ lines }: GraphicProps) {
  const beats = ['an', 'naf', 'faa', 'thaat'];
  return (
    <>
      <ReadingStage lines={Math.min(lines, 2)}
        ayat={[
          { clip: 'falaq-4', text: (on) => <>وَمِن شَرِّ <span style={glow(on)}>ٱلنَّفَّـٰثَـٰتِ</span> فِى ٱلْعُقَدِ</> },
          { clip: 'falaq-5', text: () => <>وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ</> },
        ]}
        focus={<Red>ٱلنَّفَّـٰثَـٰتِ</Red>} note="" noteAt={9} />
      {lines >= 3 && (
        <div className="absolute flex items-center gap-3" style={{ left: 900, top: 700 }}>
          {beats.map((b, i) => (
            <motion.span key={b} className="inline-block rounded-[16px] font-sans font-black" style={{ padding: '6px 18px', fontSize: 30, color: '#fff', background: [TEAL, CRIMSON, GOLD, TEAL][i] }}
              initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.3 + i * 0.4, type: 'spring', bounce: 0.4 }}>{b}</motion.span>
          ))}
          <motion.span className="font-sans font-bold" style={{ fontSize: 22, color: INK_TEXT }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>→ an-naf-faa-thaat</motion.span>
        </div>
      )}
    </>
  );
}

/* ---------- athar ---------- */

/** The eleven ayat in two panels, Al-Falaq and An-Nas; the teacher's marks drop in as the learner reads. */
export function Qr2ReadGraphic({ lines, interaction }: GraphicProps) {
  if (lines === 0) return null;
  const falaq = ['قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ', 'مِن شَرِّ مَا خَلَقَ', 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', 'وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ', 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ'];
  const nas = ['قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ', 'مَلِكِ ٱلنَّاسِ', 'إِلَـٰهِ ٱلنَّاسِ', 'مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ', 'ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ', 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ'];
  const marks = [TEAL, TEAL, GOLD, CRIMSON, TEAL, TEAL, TEAL, TEAL, GOLD, GOLD, TEAL];
  const col = (title: string, rows: string[], x: number, off: number) => (
    <div className="absolute flex flex-col gap-1" style={{ left: x, top: 170, width: 340 }}>
      <span className="font-sans font-bold uppercase" style={{ fontSize: 13, letterSpacing: '0.16em', color: MUSHAF }}>{title}</span>
      {rows.map((a, i) => (
        <motion.div key={i} className="flex items-center justify-between rounded-[12px]" style={{ padding: '0 12px', height: 54, background: MUSHAF }}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (off + i) * 0.06, duration: 0.5, ease }}>
          <motion.span className="block shrink-0 rounded-full" style={{ width: 20, height: 20, border: `3px solid ${GOLD}` }} initial={false}
            animate={{ background: interaction ? marks[off + i] : 'transparent' }} transition={{ delay: interaction ? 0.3 + (off + i) * 0.2 : 0 }} />
          <Q size={20} color="#F6E3B8">{a}</Q>
        </motion.div>
      ))}
    </div>
  );
  return (
    <>
      {col('Al-Falaq', falaq, 1170, 0)}
      {col('An-Nas', nas, 810, 5)}
    </>
  );
}

/* ---------- ahd ---------- */

export function Qr2MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Panel x={900} y={200} w={520} h={300}>
        <Q size={38} color="#F6E3B8">قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ</Q>
        <Q size={38} color="#F6E3B8">قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ</Q>
      </Panel>
      {lines >= 2 && <Badge x={1160} y={620} name="clock" size={110} color={MUSHAF} delay={0.2} />}
      {lines >= 2 && <Chip x={1160} y={700} color={MUSHAF} delay={0.5}>the same moment every day</Chip>}
    </>
  );
}

/** The page turns back one leaf to Al-Ikhlas; tanween marks glow at the word ends. */
export function Qr2NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <motion.div className="absolute" style={{ left: 900, top: 220 }} initial={{ rotateY: 60, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 1, ease }}>
          <Panel x={0} y={0} w={520} h={260}>
            <Q size={40} color="#F6E3B8" clip="ikhlas-4">وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ</Q>
          </Panel>
        </motion.div>
      )}
      {lines >= 2 && <Chip x={1160} y={530} color={GOLD} delay={0.3}>-an · -in · -un</Chip>}
      {lines >= 3 && (
        <Svg><Draw d="M 1180 600 Q 1260 660 1340 600" color={GOLD} width={3} dash="3 9" dur={0.8} /></Svg>
      )}
    </>
  );
}
