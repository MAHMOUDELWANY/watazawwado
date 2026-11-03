import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Cut, Chip, Person } from './kit';
import { SayBubble } from './g-lang';
import { Hear } from '../Say';

/**
 * Fusha · Level 2 · Lesson 1 (Kids: What Did Everyone Do?; 12+: The Class Trip). One device for both: the past verb as
 * a stem tile that stays still while an ending tile snaps onto its left end (Arabic reads right to left), and a person
 * card that says who. Swapping the stem keeps the ending: the endings are keys for every regular verb.
 */

const CAST = 'zad-kids/characters';
const CARD = '#FFFDF8';
const SHADOW = '0 16px 30px -22px rgba(60,30,10,0.6)';
const AR: React.CSSProperties = { fontFamily: 'var(--font-display-ar)', fontWeight: 800, direction: 'rtl' };
const KAREEM = '#6E8B5A';

/** A stem as its three letters with their vowels; the third letter's mark depends on the person. */
type Stem = [string, string, string];
export const STEMS: Record<string, Stem> = {
  dhahaba: ['ذَ', 'هَ', 'ب'], kataba: ['كَ', 'تَ', 'ب'], akala: ['أَ', 'كَ', 'ل'], shariba: ['شَ', 'رِ', 'ب'], laiba: ['لَ', 'عِ', 'ب'],
  jalasa: ['جَ', 'لَ', 'س'], dakhala: ['دَ', 'خَ', 'ل'], samia: ['سَ', 'مِ', 'ع'], rajaa: ['رَ', 'جَ', 'ع'],
};

type P = { key: string; en: string; ar: string; mark: string; end: string; color: string };
export const PERSONS: Record<string, P> = {
  i: { key: 'i', en: 'I', ar: 'أَنَا', mark: 'ْ', end: 'تُ', color: TEAL },
  youM: { key: 'youM', en: 'you (m)', ar: 'أَنْتَ', mark: 'ْ', end: 'تَ', color: '#2F7FB0' },
  youF: { key: 'youF', en: 'you (f)', ar: 'أَنْتِ', mark: 'ْ', end: 'تِ', color: '#B0477A' },
  he: { key: 'he', en: 'he', ar: 'هُوَ', mark: 'َ', end: '', color: GOLD },
  she: { key: 'she', en: 'she', ar: 'هِيَ', mark: 'َ', end: 'تْ', color: CRIMSON },
  we: { key: 'we', en: 'we', ar: 'نَحْنُ', mark: 'ْ', end: 'نَا', color: '#3E9C6B' },
  youPl: { key: 'youPl', en: 'you all', ar: 'أَنْتُمْ', mark: 'ْ', end: 'تُمْ', color: '#6B5BB0' },
  they: { key: 'they', en: 'they', ar: 'هُمْ', mark: 'ُ', end: 'وا', color: '#8B5A36' },
};
const ORDER = ['i', 'youM', 'youF', 'he', 'she', 'we', 'youPl', 'they'];
export const word = (s: Stem, p: P) => s.join('') + p.mark + p.end;

/** One row: [ending] [stem] [person], read right to left. The ending slides in and locks onto the stem. */
function Row({ stem, p, y, delay = 0, clip, x = 1470 }: { stem: Stem; p: P; y: number; delay?: number; clip?: string; x?: number }) {
  const stemText = stem.join('') + p.mark + (p.end ? 'ـ' : '');
  const tile = (t: string, c: string) => <span lang="ar" style={{ ...AR, fontSize: 46, lineHeight: 1.5, color: c, whiteSpace: 'nowrap' }}>{t}</span>;
  const inner = (
    <>
      <span className="flex flex-col items-center justify-center rounded-[16px]" style={{ width: 118, height: 84, background: p.color, color: '#fff', boxShadow: SHADOW }}>
        <span lang="ar" style={{ ...AR, fontSize: 30, lineHeight: 1.3 }}>{p.ar}</span>
        <span className="font-sans font-bold" style={{ fontSize: 14 }}>{p.en}</span>
      </span>
      <span className="flex items-center" style={{ flexDirection: 'row-reverse' }}>
        <span className="flex items-center justify-center rounded-[16px]" style={{ height: 84, padding: '0 18px', background: CARD, boxShadow: SHADOW, borderRadius: p.end ? '16px 4px 4px 16px' : 16 }}>{tile(stemText, INK_TEXT)}</span>
        {p.end && (
          <motion.span className="flex items-center justify-center" style={{ height: 84, padding: '0 16px', background: CARD, boxShadow: `inset 0 0 0 3px ${p.color}, ${SHADOW}`, borderRadius: '4px 16px 16px 4px' }}
            initial={{ x: -70, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.45, duration: 0.7, delay: delay + 0.35 }}>
            {tile('ـ' + p.end, p.color)}
          </motion.span>
        )}
      </span>
    </>
  );
  // The tap target sits inside the positioned row, so the row keeps its place on the stage.
  return (
    <motion.div className="absolute" style={{ right: 1600 - x, top: y }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease }}>
      {clip ? <Hear id={clip}><span className="flex items-center" style={{ gap: 14, flexDirection: 'row-reverse' }}>{inner}</span></Hear> : <span className="pointer-events-none flex items-center" style={{ gap: 14, flexDirection: 'row-reverse' }}>{inner}</span>}
    </motion.div>
  );
}

/** All eight persons of one stem in a 2 × 4 grid; keyed by stem so a new stem re-deals the endings. */
function Grid({ stem, delay = 0 }: { stem: Stem; delay?: number }) {
  return (
    <>
      {ORDER.map((k, i) => {
        const p = PERSONS[k];
        const col = i < 4 ? 0 : 1, row = i % 4;
        return (
          <motion.div key={stem.join('') + k} className="pointer-events-none absolute flex items-center justify-between rounded-[16px]" style={{ left: col ? 830 : 1170, top: 220 + row * 100, width: 320, height: 82, padding: '0 16px', background: CARD, boxShadow: `inset 6px 0 0 ${p.color}, ${SHADOW}` }}
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: delay + i * 0.07, ease }}>
            <span className="flex flex-col">
              <span lang="ar" style={{ ...AR, fontSize: 22, color: p.color, lineHeight: 1.3 }}>{p.ar}</span>
              <span className="font-sans font-bold" style={{ fontSize: 13, color: soft('light') }}>{p.en}</span>
            </span>
            <span lang="ar" style={{ ...AR, fontSize: 40, lineHeight: 1.5, color: INK_TEXT }}>
              {stem.join('') + p.mark}<span style={{ color: p.color }}>{p.end}</span>
            </span>
          </motion.div>
        );
      })}
    </>
  );
}

const S = STEMS;
const R = (stem: Stem, k: string, i: number, delay = 0, clip?: string) => <Row key={stem.join('') + k} stem={stem} p={PERSONS[k]} y={230 + i * 130} delay={delay} clip={clip} />;

/* =================== Kids =================== */

function Family({ dim = false }: { dim?: boolean }) {
  return (
    <>
      <Cut src={`${CAST}/jiddo-sit`} x={870} y={810} h={250} dim={dim} />
      <Cut src={`${CAST}/maryam-happy`} x={1080} y={810} h={250} delay={0.15} dim={dim} />
      <Cut src={`${CAST}/yusuf-point`} x={1280} y={810} h={250} delay={0.3} dim={dim} />
      <Cut src={`${CAST}/mishmish-sit`} x={1450} y={810} h={140} delay={0.45} dim={dim} />
    </>
  );
}

export function Fv1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Family />
      <Row stem={S.dhahaba} p={PERSONS.i} y={250} delay={0.6} />
    </>
  );
}

export function Fv1SaturdayGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Family />
      {lines >= 2 && <SayBubble x={900} y={530} text="؟" width={90} delay={0.2} />}
      {lines >= 3 && <Chip x={1160} y={330} color={GOLD} delay={0.3}>the same verb, a different ending</Chip>}
    </>
  );
}

export function Fv1StoryGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Family />
      {lines < 3 && <SayBubble x={900} y={540} id="story-1" text="أَيْنَ ذَهَبْتُمُ ٱلْيَوْمَ؟" width={260} size={28} />}
      {lines >= 2 && <SayBubble x={1300} y={400} id="story-2" text="ذَهَبْتُ إِلَى ٱلْمَلْعَبِ." width={250} size={26} align="right" delay={0.2} />}
      {lines >= 2 && <SayBubble x={1100} y={250} id="story-3" text="وَأَنَا ذَهَبْتُ إِلَى ٱلْمَكْتَبَةِ." width={300} size={26} delay={0.5} />}
      {lines >= 3 && <SayBubble x={1450} y={580} id="story-6" text="مِشْمِشٌ ذَهَبَ!" width={170} size={24} align="right" delay={0.2} />}
      {lines >= 3 && <SayBubble x={890} y={540} id="story-7" text="وَأَنَا جَلَسْتُ فِي ٱلْبَيْتِ!" width={260} size={24} accent delay={0.6} />}
    </>
  );
}

export function Fv1EndingGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      {lines === 1 && <Row stem={S.dhahaba} p={PERSONS.he} y={300} />}
      {lines >= 2 && R(S.dhahaba, 'i', 0, 0, 'dhahabtu')}
      {lines >= 2 && R(S.dhahaba, 'he', 1, 0.2, 'dhahaba')}
      {lines >= 3 && R(S.dhahaba, 'she', 2, 0, 'dhahabat')}
      {lines === 1 && <Chip x={1200} y={440} color={GOLD} delay={0.4}>ذَهَبَـ · went</Chip>}
    </>
  );
}

export function Fv1YouGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Cut src={`${CAST}/jiddo-explain`} x={880} y={810} h={260} />
      {R(S.dhahaba, 'youM', 0, 0, 'ayna-dhahabta')}
      {lines >= 2 && R(S.dhahaba, 'youF', 1, 0, 'ayna-dhahabti')}
      {lines >= 3 && <Chip x={1220} y={520} color={INK_TEXT} delay={0.3}>a boy: ـتَ · a girl: ـتِ</Chip>}
    </>
  );
}

export function Fv1ManyGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      {R(S.dhahaba, 'we', 0, 0, 'dhahabna')}
      {lines >= 2 && R(S.dhahaba, 'youPl', 1, 0, 'dhahabtum')}
      {lines >= 3 && R(S.dhahaba, 'they', 2, 0, 'dhahabu')}
    </>
  );
}

export function Fv1EightGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Grid stem={lines >= 2 ? S.kataba : S.dhahaba} />
      <Chip x={1160} y={640} color={lines >= 2 ? CRIMSON : GOLD} delay={0.6}>{lines >= 2 ? 'new verb, the same eight endings' : 'eight people, one verb'}</Chip>
    </>
  );
}

export function Fv1VerbsGraphic({ lines, items }: GraphicProps) {
  if (lines === 0 && items === 0) return null;
  const n = Math.max(items, lines >= 2 ? 3 : 0);
  return (
    <>
      {[S.akala, S.shariba, S.laiba].slice(0, n).map((s, i) => R(s, 'i', i, i * 0.1, ['akaltu', 'sharibtu', 'laibtu'][i]))}
      {lines >= 3 && <Cut src={`${CAST}/yusuf-brave`} x={880} y={810} h={230} />}
    </>
  );
}

export function Fv1TalkGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      {[S.dhahaba, S.akala, S.laiba].map((s, i) => R(s, 'i', i, i * 0.15))}
      <Chip x={1160} y={640} color={TEAL} delay={0.6}>…three things about my Saturday</Chip>
    </>
  );
}

export function Fv1MissionGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Cut src={`${CAST}/maryam-point`} x={900} y={810} h={260} />
      <SayBubble x={960} y={520} id="story-1" text="أَيْنَ ذَهَبْتُمُ ٱلْيَوْمَ؟" width={270} size={28} />
      {lines >= 2 && R(S.dhahaba, 'i', 1, 0.2)}
    </>
  );
}

/** ذَهَبَ, then يَذْهَبُ: the new sound arrives at the start (the right end). */
function Present({ y = 330, delay = 0 }: { y?: number; delay?: number }) {
  return (
    <motion.div className="pointer-events-none absolute flex items-center" style={{ right: 130, top: y, flexDirection: 'row-reverse' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}>
      <motion.span className="flex items-center justify-center" style={{ height: 96, padding: '0 16px', background: CARD, boxShadow: `inset 0 0 0 3px ${CRIMSON}, ${SHADOW}`, borderRadius: '16px 4px 4px 16px' }}
        initial={{ x: 70, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.45, delay: delay + 0.5 }}>
        <span lang="ar" style={{ ...AR, fontSize: 52, lineHeight: 1.5, color: CRIMSON }}>يَـ</span>
      </motion.span>
      <span className="flex items-center justify-center" style={{ height: 96, padding: '0 18px', background: CARD, boxShadow: SHADOW, borderRadius: '4px 16px 16px 4px' }}>
        <span lang="ar" style={{ ...AR, fontSize: 52, lineHeight: 1.5, color: INK_TEXT }}>ـذْهَبُ</span>
      </span>
    </motion.div>
  );
}

export function Fv1NextGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Cut src={`${CAST}/yusuf-stand`} x={880} y={810} h={260} />
      <Row stem={S.dhahaba} p={PERSONS.he} y={220} />
      {lines >= 2 && <Present y={400} />}
      {lines >= 2 && <Chip x={1240} y={540} color={CRIMSON} delay={0.9}>goes: the change is at the start</Chip>}
    </>
  );
}

/* =================== 12+ =================== */

function Class({ dim = false }: { dim?: boolean }) {
  return (
    <>
      <Person x={870} y={800} scale={1.05} color={KAREEM} dim={dim} />
      <Person x={1070} y={800} scale={1} color={TEAL} delay={0.15} dim={dim} />
      <Person x={1260} y={800} scale={1} color={GOLD} hijab delay={0.3} dim={dim} />
      <Person x={1440} y={800} scale={1.02} color={CRIMSON} hijab delay={0.45} dim={dim} />
    </>
  );
}

export function Fw1CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Class />
      <Row stem={S.dhahaba} p={PERSONS.we} y={250} delay={0.6} />
    </>
  );
}

export function Fw1MondayGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Class />
      {lines >= 2 && <SayBubble x={890} y={560} text="؟" width={90} delay={0.2} />}
      {lines >= 3 && <Chip x={1160} y={330} color={GOLD} delay={0.3}>one verb, changing at its end</Chip>}
    </>
  );
}

export function Fw1StoryGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Class />
      {lines < 3 && <SayBubble x={890} y={560} id="story-1" text="مَاذَا فَعَلْتُمْ أَمْسِ؟" width={240} size={28} />}
      {lines >= 2 && <SayBubble x={1080} y={400} id="story-2" text="ذَهَبْنَا إِلَى ٱلْمَدِينَةِ ٱلْقَدِيمَةِ." width={330} size={24} delay={0.2} />}
      {lines >= 2 && <SayBubble x={1270} y={250} id="story-3" text="أَنَا دَخَلْتُ ٱلْمَتْحَفَ وَكَتَبْتُ عَنْهُ." width={340} size={24} align="right" delay={0.5} />}
      {lines >= 3 && <SayBubble x={1080} y={560} id="story-6" text="جَلَسَتْ فِي ٱلْمَقْهَى وَشَرِبَتْ قَهْوَةً." width={330} size={22} accent delay={0.3} />}
    </>
  );
}

export function Fw1OneGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  const rows: [string, string][] = [['i', 'dakhaltu'], ['youM', 'dakhalta'], ['youF', 'dakhalti'], ['he', 'dakhala'], ['she', 'dakhalat']];
  const n = lines >= 3 ? 5 : lines >= 2 ? 3 : 0;
  return (
    <>
      {lines === 1 && <Row stem={S.dakhala} p={PERSONS.he} y={300} />}
      {lines === 1 && <Chip x={1220} y={440} color={GOLD} delay={0.4}>دَخَلَـ · entered</Chip>}
      {rows.slice(0, n).map(([k, c], i) => <Row key={k} stem={S.dakhala} p={PERSONS[k]} y={180 + i * 108} delay={i >= 3 ? (i - 3) * 0.15 : i * 0.15} clip={c} />)}
    </>
  );
}

export function Fw1GroupGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      {R(S.dhahaba, 'we', 0, 0, 'dhahabna')}
      {R(S.dhahaba, 'youPl', 1, 0.2, 'dhahabtum')}
      {R(S.dhahaba, 'they', 2, 0.4, 'dhahabu')}
      {lines >= 2 && <SayBubble x={900} y={600} id="story-1" text="مَاذَا فَعَلْتُمْ؟" width={200} size={26} />}
      {lines >= 3 && <Chip x={1300} y={640} color="#8B5A36" delay={0.3}>ـوا: the alif is written, not read</Chip>}
    </>
  );
}

export function Fw1EightGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  const stem = lines >= 2 ? (lines >= 3 ? S.rajaa : S.kataba) : S.dhahaba;
  return (
    <>
      <Grid stem={stem} />
      <Chip x={1160} y={640} color={lines >= 2 ? CRIMSON : GOLD} delay={0.6}>{lines >= 3 ? 'one stem learned = eight forms owned' : lines >= 2 ? 'swap the stem, keep the endings' : 'the whole past tense of a regular verb'}</Chip>
    </>
  );
}

export function Fw1VerbsGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  const all = [S.dhahaba, S.dakhala, S.jalasa, S.akala, S.shariba, S.kataba, S.samia, S.rajaa];
  const n = lines >= 2 ? 8 : 4;
  return (
    <>
      {all.slice(0, n).map((s, i) => (
        <motion.span key={i} lang="ar" className="pointer-events-none absolute flex items-center justify-center rounded-[16px]" style={{ left: 1310 - (i % 4) * 150, top: 220 + Math.floor(i / 4) * 120, width: 134, height: 92, background: CARD, boxShadow: SHADOW, ...AR, fontSize: 38, lineHeight: 1.5, color: INK_TEXT }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i % 4) * 0.08, ease }}>{s.join('') + 'َ'}</motion.span>
      ))}
      {lines >= 3 && <SayBubble x={1200} y={560} id="story-3" text="دَخَلْتُ ٱلْمَتْحَفَ وَكَتَبْتُ عَنْهُ." width={340} size={26} />}
    </>
  );
}

export function Fw1TalkGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      {R(S.dhahaba, 'i', 0)}
      {R(S.akala, 'i', 1, 0.15)}
      {lines >= 2 && R(S.jalasa, 'she', 2, 0.1)}
    </>
  );
}

export function Fw1MissionGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <motion.div className="pointer-events-none absolute rounded-[20px]" style={{ left: 900, top: 200, width: 540, height: 400, background: CARD, boxShadow: SHADOW, backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 58px, rgba(31,22,18,0.08) 58px 60px)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} />
      {['ذَهَبْتُ…', 'أَكَلْتُ…', 'رَجَعْتُ…'].map((t, i) => (
        <motion.span key={t} lang="ar" className="pointer-events-none absolute" style={{ right: 1600 - 1410, top: 230 + i * 120, ...AR, fontSize: 44, lineHeight: 1.4, color: TEAL }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.25 }}>{t}</motion.span>
      ))}
      {lines >= 2 && <Chip x={1170} y={640} color={GOLD} delay={0.3}>the last day: one line for each person</Chip>}
    </>
  );
}

export function Fw1NextGraphic({ lines }: GraphicProps) {
  if (lines === 0) return null;
  return (
    <>
      <Person x={880} y={800} scale={1.02} color={CRIMSON} hijab />
      <Row stem={S.dhahaba} p={PERSONS.he} y={220} />
      {lines >= 2 && <Present y={400} />}
      {lines >= 2 && <Chip x={1240} y={540} color={CRIMSON} delay={0.9}>every day: the change is at the start</Chip>}
    </>
  );
}
