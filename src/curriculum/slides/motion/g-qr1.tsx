import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Svg, Draw, Chip, Badge, DEEP } from './kit';
import { Hear, QURAN_FONT, useQuranFont } from '../Say';

/**
 * Quran Reading · Lesson 1 · Reading Al-Fatiha from the Page. The Adults stage with the Mushaf panel (green and gold) as
 * this subject's hero: each ayah sits on the panel, the reciter plays on tap, a gold line sweeps under the words right to
 * left (the finger following), and the reading focus is lifted out large with its mark in crimson.
 */

const MUSHAF = '#0E5A4B';
const Z = '‍';

function Q({ children, size, color = INK_TEXT, clip, style }: { children: React.ReactNode; size: number; color?: string; clip?: string; style?: React.CSSProperties }) {
  useQuranFont();
  const text = <span lang="ar" dir="rtl" style={{ fontFamily: QURAN_FONT, fontSize: size, lineHeight: 1.9, color, whiteSpace: 'nowrap', ...style }}>{children}</span>;
  return clip ? <Hear id={clip}>{text}</Hear> : text;
}

function Panel({ x, y, w, h, children }: { x: number; y: number; w: number; h: number; children?: React.ReactNode }) {
  return (
    <motion.div className="absolute flex flex-col items-center justify-center rounded-[18px]" style={{ left: x, top: y, width: w, height: h, background: MUSHAF, boxShadow: `inset 0 0 0 6px ${GOLD}, inset 0 0 0 10px ${MUSHAF}, inset 0 0 0 12px ${GOLD}88, 0 30px 60px -30px rgba(10,40,30,0.7)` }}
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
      {children}
    </motion.div>
  );
}

const glow = (on: boolean) => (on ? { color: GOLD, textShadow: `0 0 18px ${GOLD}` } : undefined);

/** Sound rings on the panel corner: listen first. */
function Listen({ x, y }: { x: number; y: number }) {
  const reduce = useReduce();
  return (
    <Svg>
      {[0, 1, 2].map((i) => (
        <motion.circle key={i} cx={x} cy={y} r={20} fill="none" stroke={GOLD} strokeWidth={3} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}
          initial={{ scale: 0.6, opacity: 0.9 }} animate={reduce ? { scale: 1.4, opacity: 0.5 } : { scale: [0.6, 2], opacity: [0.9, 0] }} transition={{ duration: 1.6, delay: i * 0.35, repeat: reduce ? 0 : Infinity, repeatDelay: 0.3 }} />
      ))}
    </Svg>
  );
}

/**
 * One reading page: the ayah (or two) on the panel (listen), a gold line sweeping under it right to left (follow), and
 * the focus word lifted out big with its mark coloured (read). `focus` and `note` arrive on the later lines.
 */
function ReadingStage({ lines, ayat, focus, note, focusAt = 2, noteAt = 3 }: {
  lines: number;
  ayat: { clip: string; text: (on: boolean) => React.ReactNode }[];
  focus: React.ReactNode;
  note: string;
  focusAt?: number;
  noteAt?: number;
}) {
  if (lines === 0) return null;
  const on = lines >= focusAt;
  const h = ayat.length > 2 ? 330 : ayat.length > 1 ? 280 : 200;
  return (
    <>
      <Panel x={830} y={190} w={660} h={h}>
        {ayat.map((a, i) => <Q key={i} size={ayat.length > 1 ? 40 : 52} color="#F6E3B8" clip={a.clip}>{a.text(on)}</Q>)}
      </Panel>
      {lines === 1 && <Listen x={1460} y={220} />}
      {lines === 1 && <Chip x={1160} y={210 + h + 20} color={MUSHAF} delay={0.4}>1 · listen: tap the ayah</Chip>}
      {lines >= 2 && (
        <Svg>
          <Draw d={`M 1460 ${190 + h + 14} L 860 ${190 + h + 14}`} color={GOLD} width={5} dur={2.2} glow />
          <motion.g initial={{ x: 0 }} animate={{ x: -600 }} transition={{ duration: 2.2, ease: [0.65, 0, 0.35, 1] }}><circle cx={1460} cy={190 + h + 14} r={10} fill={GOLD} /></motion.g>
        </Svg>
      )}
      {on && (
        <motion.div key={lines >= 3 ? 'b' : 'a'} className="absolute flex flex-col items-center" style={{ left: 830, top: 190 + h + 50, width: 660 }} initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 0.8, duration: 0.8, ease }}>
          <div className="rounded-[22px]" style={{ padding: '0 34px', background: '#FFFDF8', boxShadow: `0 0 0 3px ${GOLD}, 0 20px 40px -24px rgba(60,30,10,0.6)` }}>
            <Q size={ayat.length > 1 ? 74 : 86} color={INK_TEXT}>{focus}</Q>
          </div>
        </motion.div>
      )}
      {lines >= noteAt && <Chip x={1160} y={Math.min(740, 190 + h + 200)} color={CRIMSON} delay={0.3}>{note}</Chip>}
    </>
  );
}

const Red = ({ children }: { children: React.ReactNode }) => <span style={{ color: CRIMSON }}>{children}</span>;

/* ---------- spark ---------- */

export function Qr1CoverGraphic(_: GraphicProps) {
  return (
    <Panel x={880} y={250} w={600} h={330}>
      <Q size={44} color="#F6E3B8">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</Q>
      <Q size={44} color="#F6E3B8">ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ</Q>
    </Panel>
  );
}

/** Five prayers as columns of rak'at; each column's first rak'ah lights: seventeen Fatihas a day. */
export function Qr1SeventeenGraphic({ lines }: GraphicProps) {
  const prayers = [{ n: 'Fajr', r: 2 }, { n: 'Dhuhr', r: 4 }, { n: 'Asr', r: 4 }, { n: 'Maghrib', r: 3 }, { n: 'Isha', r: 4 }];
  let k = 0;
  return (
    <>
      {lines >= 1 && (
        <div className="absolute flex items-end gap-8" style={{ left: 860, top: 200, height: 380 }}>
          {prayers.map((p) => (
            <div key={p.n} className="flex flex-col-reverse items-center gap-2">
              <span className="mt-2 font-sans font-bold" style={{ fontSize: 18, color: INK_TEXT }}>{p.n}</span>
              {Array.from({ length: p.r }, (_, i) => {
                const idx = k++;
                return (
                  <motion.span key={i} className="block rounded-[10px]" style={{ width: 82, height: 54, background: GOLD, boxShadow: `0 0 18px ${GOLD}66` }}
                    initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + idx * 0.12, duration: 0.4 }} />
                );
              })}
            </div>
          ))}
        </div>
      )}
      {lines >= 1 && (
        <motion.div className="absolute flex items-baseline gap-3" style={{ left: 1330, top: 610 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }}>
          <span className="font-serif" style={{ fontSize: 96, lineHeight: 1, color: CRIMSON }}>17</span>
          <span className="font-sans font-bold" style={{ fontSize: 20, color: INK_TEXT }}>Fatihas</span>
        </motion.div>
      )}
      {lines >= 2 && <Chip x={1060} y={680} delay={0.2}>from memory… and from the page?</Chip>}
      {lines >= 3 && (
        <motion.div className="absolute" style={{ left: 860, top: 730 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Q size={40} color={MUSHAF}>بِسْمِ ٱللَّهِ</Q>
        </motion.div>
      )}
    </>
  );
}

/* ---------- zad ---------- */

/** Listen, follow, read: three cards that light up in turn. */
export function Qr1MovesGraphic({ lines, items }: GraphicProps) {
  const cards = [
    { icon: 'bell', title: 'Listen', sub: 'the reciter, once', c: GOLD },
    { icon: 'pen', title: 'Follow', sub: 'finger under the words', c: TEAL },
    { icon: 'chat', title: 'Read', sub: 'alone; your teacher marks it', c: CRIMSON },
  ];
  const shown = Math.max(items, lines >= 1 ? 1 : 0);
  return (
    <>
      <div className="absolute flex gap-6" style={{ left: 840, top: 260, direction: 'rtl' }}>
        {cards.slice(0, shown).map((c, i) => (
          <motion.div key={c.title} className="flex flex-col items-center gap-3 rounded-[24px]" style={{ width: 200, padding: '26px 10px', background: '#FFFDF8', boxShadow: i === shown - 1 ? `0 0 0 4px ${c.c}, 0 24px 44px -26px rgba(60,30,10,0.6)` : '0 24px 44px -26px rgba(60,30,10,0.6)' }}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <span className="font-serif" style={{ fontSize: 30, color: c.c }}>{i + 1}</span>
            <span className="font-sans font-black" style={{ fontSize: 28, color: INK_TEXT }}>{c.title}</span>
            <span className="text-center font-sans font-semibold" style={{ fontSize: 17, color: soft('light') }}>{c.sub}</span>
          </motion.div>
        ))}
      </div>
      {items >= 3 && (
        <div className="pointer-events-none absolute flex gap-4" style={{ left: 900, top: 600 }}>
          {[{ t: 'smooth', c: TEAL }, { t: 'paused', c: GOLD }, { t: 'helped', c: CRIMSON }].map((m, i) => (
            <motion.span key={m.t} className="rounded-full px-5 py-2 font-sans font-bold text-white" style={{ fontSize: 18, background: m.c }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.15 }}>{m.t}</motion.span>
          ))}
          <span className="self-center font-sans font-semibold" style={{ fontSize: 17, color: soft('light') }}>your teacher's marks</span>
        </div>
      )}
    </>
  );
}

export function Qr1Ayah1Graphic({ lines }: GraphicProps) {
  return (
    <ReadingStage lines={lines}
      ayat={[{ clip: 'fatiha-1', text: (on) => <>بِسْمِ ٱللَّهِ <span style={glow(on)}>ٱلرَّحْمَـٰنِ</span> ٱلرَّحِيمِ</> }]}
      focus={<>ٱلرَّحْمَ{Z}<Red>{Z}ـٰ{Z}</Red>{Z}نِ</>} note="ar-raḥmān · the small alif is a long aa" />
  );
}

export function Qr1Ayah2Graphic({ lines }: GraphicProps) {
  return (
    <ReadingStage lines={lines}
      ayat={[
        { clip: 'fatiha-2', text: (on) => <>ٱلْحَمْدُ لِلَّهِ رَبِّ <span style={glow(on)}>ٱلْعَـٰلَمِينَ</span></> },
        { clip: 'fatiha-3', text: () => <>ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</> },
      ]}
      focus={<>ٱلْعَ{Z}<Red>{Z}ـٰ{Z}</Red>{Z}لَمِينَ</>} note="al-'aalameen · ayah 3: read it before you hear it" />
  );
}

export function Qr1Ayah4Graphic({ lines }: GraphicProps) {
  return (
    <ReadingStage lines={lines}
      ayat={[{ clip: 'fatiha-4', text: (on) => <><span style={glow(on)}>مَـٰلِكِ</span> <span style={glow(lines >= 3)}>يَوْمِ</span> ٱلدِّينِ</> }]}
      focus={lines >= 3 ? <>يَ{Z}<Red>{Z}وْ</Red>مِ</> : <>مَ{Z}<Red>{Z}ـٰ{Z}</Red>{Z}لِكِ</>} note="maaliki · yawmi: the still waw glides" />
  );
}

export function Qr1Ayah5Graphic({ lines }: GraphicProps) {
  return (
    <ReadingStage lines={lines}
      ayat={[{ clip: 'fatiha-5', text: (on) => <><span style={glow(on)}>إِيَّاكَ</span> نَعْبُدُ وَ<span style={glow(lines >= 3)}>إِيَّاكَ</span> نَسْتَعِينُ</> }]}
      focus={<>إِ<Red>يَّ{Z}</Red>{Z}اكَ</>} note="iyyaaka · twice in the ayah, the same way" />
  );
}

export function Qr1Ayah6Graphic({ lines }: GraphicProps) {
  const step = lines >= 4 ? 3 : lines >= 3 ? 2 : 1;
  const focus = step === 3 ? <>ٱلضَّ{Z}<Red>{Z}آ</Red>لِّينَ</> : step === 2 ? <>ٱلصِّ{Z}<Red>{Z}رَٰ</Red>طَ</> : <><Red>ٱ</Red>هْدِنَا</>;
  const note = step === 3 ? 'the wavy line: hold it long' : step === 2 ? 'as-siraat · the small alif on the ر' : 'starting here? read it ihdinaa';
  return (
    <ReadingStage lines={lines}
      ayat={[
        { clip: 'fatiha-6', text: (on) => <><span style={glow(on && step === 1)}>ٱهْدِنَا</span> <span style={glow(step === 2)}>ٱلصِّرَٰطَ</span> ٱلْمُسْتَقِيمَ</> },
        { clip: 'fatiha-7', text: () => <>صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ</> },
        { clip: 'fatiha-7', text: () => <>غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا <span style={glow(step === 3)}>ٱلضَّآلِّينَ</span></> },
      ]}
      focus={<React.Fragment key={step}>{focus}</React.Fragment>} note={note} noteAt={2} />
  );
}

/* ---------- athar ---------- */

/** The seven ayat as rows, each with its teacher's mark slot; marks drop in as the learner reads. */
export function Qr1ReadGraphic({ lines, interaction }: GraphicProps) {
  const ayat = ['بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ', 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', 'مَـٰلِكِ يَوْمِ ٱلدِّينِ', 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ…'];
  const marks = [TEAL, TEAL, TEAL, GOLD, TEAL, GOLD, CRIMSON];
  if (lines === 0) return null;
  return (
    <div className="absolute flex flex-col gap-2" style={{ left: 830, top: 180, width: 660 }}>
      {ayat.map((a, i) => (
        <motion.div key={i} className="flex items-center justify-between rounded-[14px]" style={{ padding: '0 18px', height: 72, background: MUSHAF }}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08, duration: 0.5, ease }}>
          <motion.span className="block rounded-full" style={{ width: 26, height: 26, border: `3px solid ${GOLD}` }} initial={false}
            animate={{ background: interaction || lines >= 2 ? (interaction ? marks[i] : 'transparent') : 'transparent' }} transition={{ delay: interaction ? 0.3 + i * 0.3 : 0 }} />
          <Q size={30} color="#F6E3B8">{a}</Q>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------- ahd ---------- */

export function Qr1MissionGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Panel x={900} y={200} w={520} h={340}>
        <Q size={40} color="#F6E3B8">ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ</Q>
        <Q size={40} color="#F6E3B8">ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</Q>
      </Panel>
      {lines >= 2 && (
        <Svg>
          <Draw d="M 1380 410 L 940 410" color={GOLD} width={5} dur={2} glow />
          <motion.g initial={{ x: 0 }} animate={{ x: -440 }} transition={{ duration: 2, ease: [0.65, 0, 0.35, 1] }}>
            <path d="M 1380 470 l -10 -54 a 10 10 0 0 1 20 0 l 0 30 l 22 4 a 10 10 0 0 1 8 12 l -6 34 z" fill="#E8C9A6" stroke="#B98F66" strokeWidth={2} />
          </motion.g>
        </Svg>
      )}
      {lines >= 1 && <Badge x={1460} y={640} name="book" size={90} color={MUSHAF} delay={0.3} />}
      {lines >= 1 && <Chip x={1160} y={620} color={MUSHAF} delay={0.5}>once a day, from the page</Chip>}
    </>
  );
}

export function Qr1NextGraphic({ lines }: GraphicProps) {
  return (
    <>
      {lines >= 1 && (
        <motion.div className="absolute rounded-[18px]" style={{ left: 900, top: 200, width: 520, height: 520, background: MUSHAF, boxShadow: `inset 0 0 0 6px ${GOLD}` }} initial={{ rotateY: -60, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 1, ease }}>
          <span className="absolute font-sans font-bold uppercase" style={{ left: 30, top: 22, fontSize: 14, letterSpacing: '0.16em', color: GOLD }}>the last page</span>
        </motion.div>
      )}
      {lines >= 2 && (
        <>
          <motion.div className="absolute rounded-[12px] text-center" style={{ left: 960, top: 280, width: 400, padding: '10px 0', border: `2px solid ${GOLD}` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <span lang="ar" style={{ fontFamily: 'var(--font-display-ar)', fontWeight: 800, fontSize: 40, color: GOLD }}>سورة الفلق</span>
          </motion.div>
          <motion.div className="absolute rounded-[12px] text-center" style={{ left: 960, top: 500, width: 400, padding: '10px 0', border: `2px solid ${GOLD}` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <span lang="ar" style={{ fontFamily: 'var(--font-display-ar)', fontWeight: 800, fontSize: 40, color: GOLD }}>سورة الناس</span>
          </motion.div>
        </>
      )}
      {lines >= 3 && <Chip x={1160} y={760} color={DEEP} delay={0.3}>An-Nas and Al-Falaq</Chip>}
    </>
  );
}
