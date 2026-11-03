import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { soft, type GraphicProps } from './Stage';
import { Chip, Badge } from './kit';
import { Q, Panel, ReadingStage, MUSHAF, Red, glow } from './g-qr1';

/**
 * Quran Reading · Lesson 3 · One and Many. Same Mushaf panel and three moves (listen, follow, read). The motion for the
 * reading focus: the two marks of a tanween release a small gold "n" that rides on the word; at a stop the n falls
 * away (or, for -an, turns into a long aa). Whole words glow, never parts of a word, so the letters keep their joins.
 */

const CARD = '#FFFDF8';
const SHADOW = '0 18px 34px -24px rgba(60,30,10,0.6)';

/** A word card with its reading in beats; `stop` shows the stopped form. */
function Beat({ x, y, word, beats, stop, clip, delay = 0 }: { x: number; y: number; word: string; beats: string; stop?: string; clip?: string; delay?: number }) {
  return (
    <motion.div className="absolute flex items-center gap-6 rounded-[22px]" style={{ left: x, top: y, width: 620, padding: '0 26px', background: CARD, boxShadow: SHADOW }}
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay, ease }}>
      <Q size={64} clip={clip}>{word}</Q>
      <span className="font-sans font-black" style={{ fontSize: 30, color: CRIMSON }}>{beats}</span>
      {stop && (
        <motion.span className="ml-auto rounded-full px-3 font-sans font-black" style={{ fontSize: 24, background: TEAL, color: '#fff' }} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: delay + 0.5, type: 'spring', bounce: 0.4 }}>
          stop: {stop}
        </motion.span>
      )}
    </motion.div>
  );
}

/* ---------- spark ---------- */

export function Qr3CoverGraphic(_: GraphicProps) {
  return (
    <Panel x={900} y={250} w={580} h={300}>
      <Q size={46} color="#F6E3B8" clip="ikhlas-1">قُلْ هُوَ ٱللَّهُ أَحَدٌ</Q>
      <Q size={46} color="#F6E3B8">ٱللَّهُ ٱلصَّمَدُ</Q>
    </Panel>
  );
}

export function Qr3WarmGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Panel x={860} y={200} w={620} h={300}>
        <Q size={40} color="#F6E3B8" clip="falaq-1">قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ</Q>
        <Q size={40} color="#F6E3B8">قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ</Q>
      </Panel>
      {lines >= 2 && <Chip x={1170} y={540} color={GOLD} delay={0.3}>paused last time? read it first</Chip>}
    </>
  );
}

/* ---------- zad ---------- */

/** بٌ بٍ بً as three tiles, each with its sound; then three words from the surahs in beats. */
export function Qr3TanweenGraphic({ lines, items }: GraphicProps) {
  const tiles = [{ t: 'بٌ', s: 'bun', c: TEAL }, { t: 'بٍ', s: 'bin', c: CRIMSON }, { t: 'بً', s: 'ban', c: GOLD }];
  const words = [{ w: 'أَحَدٌ', b: 'a-ha-dun', clip: 'ikhlas-1' }, { w: 'لَهَبٍ', b: 'la-ha-bin', clip: 'masad-3' }, { w: 'نَارًا', b: 'naa-ran', clip: 'masad-3' }];
  return (
    <>
      {lines >= 1 && items === 0 && tiles.slice(0, lines >= 2 ? 3 : 1).map((t, i) => (
        <motion.div key={t.t} className="absolute flex flex-col items-center rounded-[28px]" style={{ left: 1300 - i * 210, top: 230, width: 170, padding: '4px 0 12px', background: CARD, boxShadow: SHADOW }}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.25, duration: 0.6, ease }}>
          <Q size={96}>{t.t}</Q>
          <span className="font-sans font-black" style={{ fontSize: 30, color: t.c, marginTop: 26 }}>{t.s}</span>
        </motion.div>
      ))}
      {lines >= 1 && items === 0 && <Chip x={1090} y={520} color={GOLD} delay={0.4}>two marks = vowel + n</Chip>}
      {lines >= 3 && items === 0 && <Chip x={880} y={580} color={TEAL} delay={0.3}>the alif after two fathas: silent inside the ayah</Chip>}
      {words.slice(0, items).map((w, i) => <Beat key={w.w} x={860} y={200 + i * 170} word={w.w} beats={w.b} clip={w.clip} />)}
    </>
  );
}

export function Qr3Ikhlas1Graphic({ lines }: GraphicProps) {
  return (
    <ReadingStage lines={lines}
      ayat={[
        { clip: 'ikhlas-1', text: (on) => <>قُلْ هُوَ ٱللَّهُ <span style={glow(on && lines < 3)}>أَحَدٌ</span></> },
        { clip: 'ikhlas-2', text: (on) => <>ٱللَّهُ <span style={glow(on && lines >= 3)}>ٱلصَّمَدُ</span></> },
      ]}
      focus={<React.Fragment key={lines >= 3 ? 'b' : 'a'}>{lines >= 3 ? <Red>ٱلصَّمَدُ</Red> : <Red>أَحَدٌ</Red>}</React.Fragment>}
      note={lines >= 3 ? 'as-sa-ma-du · the shadda on the saad' : 'a-ha-dun · two dammas'} noteAt={2} />
  );
}

export function Qr3Ikhlas3Graphic({ lines }: GraphicProps) {
  return (
    <ReadingStage lines={lines}
      ayat={[
        { clip: 'ikhlas-3', text: () => <>لَمْ يَلِدْ وَلَمْ يُولَدْ</> },
        { clip: 'ikhlas-4', text: (on) => <>وَلَمْ <span style={glow(on && lines >= 3)}>يَكُن لَّهُۥ</span> كُفُوًا أَحَدٌۢ</> },
      ]}
      focus={<React.Fragment key={lines >= 3 ? 'b' : 'a'}>{lines >= 3 ? <Red>يَكُن لَّهُۥ</Red> : <Red>لَمْ يَلِدْ</Red>}</React.Fragment>}
      note={lines >= 3 ? 'ya-kul-la-hoo · the shadda swallows the n' : 'lam ya-lid · wa lam yoo-lad'} noteAt={2} />
  );
}

/** Each word reads twice: in the flow with its n, then at a stop, where the n drops (or -an becomes aa). */
export function Qr3StopGraphic({ lines }: GraphicProps) {
  const rows = [
    { w: 'أَحَدٌ', b: 'a-ha-dun', s: 'a-had', clip: 'ikhlas-1' },
    { w: 'لَهَبٍ', b: 'la-ha-bin', s: 'la-hab', clip: 'masad-1' },
    { w: 'كُفُوًا', b: 'ku-fu-wan', s: 'ku-fu-waa', clip: 'ikhlas-4' },
  ];
  const shown = lines >= 3 ? 3 : lines >= 2 ? 2 : 0;
  return (
    <>
      {lines >= 1 && (
        <motion.div className="absolute flex items-center gap-3" style={{ left: 880, top: 170 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Badge x={30} y={30} name="check" size={60} color={TEAL} />
          <span className="font-sans font-bold" style={{ marginLeft: 60, fontSize: 22, color: soft('light') }}>at the end of the ayah, the n goes</span>
        </motion.div>
      )}
      {rows.slice(0, shown).map((r, i) => <Beat key={r.w} x={860} y={260 + i * 160} word={r.w} beats={r.b} stop={r.s} clip={r.clip} delay={i * 0.2} />)}
    </>
  );
}

export function Qr3Masad1Graphic({ lines }: GraphicProps) {
  return (
    <ReadingStage lines={lines}
      ayat={[
        { clip: 'masad-1', text: (on) => <>تَبَّتْ يَدَآ أَبِى <span style={glow(on && lines < 3)}>لَهَبٍ</span> وَتَبَّ</> },
        { clip: 'masad-2', text: () => <>مَآ أَغْنَىٰ عَنْهُ مَالُهُۥ وَمَا كَسَبَ</> },
        { clip: 'masad-3', text: (on) => <>سَيَصْلَىٰ <span style={glow(on && lines >= 3)}>نَارًا</span> ذَاتَ <span style={glow(on && lines >= 3)}>لَهَبٍ</span></> },
      ]}
      focus={<React.Fragment key={lines >= 3 ? 'b' : 'a'}>{lines >= 3 ? <Red>نَارًا · لَهَبٍ</Red> : <Red>لَهَبٍ وَتَبَّ</Red>}</React.Fragment>}
      note={lines >= 3 ? 'naa-ran … la-hab (stop)' : 'la-ha-bin-wa-tab'} noteAt={2} />
  );
}

export function Qr3Masad4Graphic({ lines }: GraphicProps) {
  return (
    <ReadingStage lines={lines}
      ayat={[
        { clip: 'masad-4', text: (on) => <>وَٱمْرَأَتُهُۥ <span style={glow(on && lines < 3)}>حَمَّالَةَ</span> ٱلْحَطَبِ</> },
        { clip: 'masad-5', text: (on) => <>فِى جِيدِهَا <span style={glow(on && lines >= 3)}>حَبْلٌ مِّن</span> مَّسَدٍۭ</> },
      ]}
      focus={<React.Fragment key={lines >= 3 ? 'b' : 'a'}>{lines >= 3 ? <Red>حَبْلٌ مِّن</Red> : <Red>حَمَّالَةَ</Red>}</React.Fragment>}
      note={lines >= 3 ? 'hab-lum-min · the shadda swallows the n' : 'ham-maa-la-ta'} noteAt={2} />
  );
}

/* ---------- athar ---------- */

export function Qr3ReadGraphic({ lines, interaction }: GraphicProps) {
  if (lines === 0) return null;
  const ikhlas = ['قُلْ هُوَ ٱللَّهُ أَحَدٌ', 'ٱللَّهُ ٱلصَّمَدُ', 'لَمْ يَلِدْ وَلَمْ يُولَدْ', 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ'];
  const masad = ['تَبَّتْ يَدَآ أَبِى لَهَبٍ وَتَبَّ', 'مَآ أَغْنَىٰ عَنْهُ مَالُهُۥ وَمَا كَسَبَ', 'سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ', 'وَٱمْرَأَتُهُۥ حَمَّالَةَ ٱلْحَطَبِ', 'فِى جِيدِهَا حَبْلٌ مِّن مَّسَدٍۭ'];
  const marks = [TEAL, TEAL, TEAL, GOLD, TEAL, GOLD, TEAL, TEAL, CRIMSON];
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
      {col('Al-Ikhlas', ikhlas, 1170, 0)}
      {col('Al-Masad', masad, 810, 4)}
    </>
  );
}

/* ---------- ahd ---------- */

export function Qr3MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Panel x={900} y={200} w={520} h={300}>
        <Q size={40} color="#F6E3B8">قُلْ هُوَ ٱللَّهُ أَحَدٌ</Q>
        <Q size={36} color="#F6E3B8">تَبَّتْ يَدَآ أَبِى لَهَبٍ وَتَبَّ</Q>
      </Panel>
      {lines >= 2 && <Badge x={1160} y={620} name="clock" size={110} color={MUSHAF} delay={0.2} />}
      {lines >= 2 && <Chip x={1160} y={700} color={MUSHAF} delay={0.5}>listen for every n</Chip>}
    </>
  );
}

export function Qr3NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <motion.div className="absolute" style={{ left: 900, top: 220 }} initial={{ rotateY: 60, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 1, ease }}>
          <Panel x={0} y={0} w={540} h={260}>
            <Q size={40} color="#F6E3B8" clip="nasr-1">إِذَا <span style={glow(lines >= 2)}>جَآءَ</span> نَصْرُ ٱللَّهِ وَٱلْفَتْحُ</Q>
          </Panel>
        </motion.div>
      )}
      {lines >= 2 && <Chip x={1170} y={530} color={GOLD} delay={0.3}>the wavy line: stretch it</Chip>}
      {lines >= 3 && <Chip x={1170} y={580} color={TEAL} delay={0.3}>next time: madd</Chip>}
    </>
  );
}
