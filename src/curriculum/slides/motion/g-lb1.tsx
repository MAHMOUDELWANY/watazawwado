import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { useReduce, INK_TEXT, soft, type GraphicProps } from './Stage';
import { Cut, Chip, Svg, Draw, DEEP } from './kit';
import { Hear, QURAN_FONT, useQuranFont } from '../Say';

/**
 * Literacy B · Lesson 1 · Same Letters, New Marks (Kids look). The Zad Kids cast watch and react; the Mushaf, its page
 * map, the ayah circles, the helper marks and the journey of Uthman's copies are drawn in code. Uthman (may Allah be
 * pleased with him) is never drawn: he is a name and a point of light. Ayat use Amiri Quran and play the reciter on tap.
 */

const KIDS = 'zad-kids/characters';
const MUSHAF_GREEN = '#0E5A4B';

/** Uthmani text in the Mushaf font; playable when `clip` names one of the page's clips. */
function Q({ children, size, color = INK_TEXT, clip, style }: { children: React.ReactNode; size: number; color?: string; clip?: string; style?: React.CSSProperties }) {
  useQuranFont();
  const text = <span lang="ar" dir="rtl" style={{ fontFamily: QURAN_FONT, fontSize: size, lineHeight: 1.9, color, whiteSpace: 'nowrap', ...style }}>{children}</span>;
  return clip ? <Hear id={clip}>{text}</Hear> : text;
}

/** A soft gold ring that pulses on something the learner should look at. */
function Pulse({ x, y, r = 34, color = GOLD, delay = 0 }: { x: number; y: number; r?: number; color?: string; delay?: number }) {
  const reduce = useReduce();
  return (
    <motion.span className="pointer-events-none absolute rounded-full" style={{ left: x - r, top: y - r, width: r * 2, height: r * 2, border: `4px solid ${color}`, boxShadow: `0 0 24px ${color}88` }}
      initial={{ scale: 0.3, opacity: 0 }} animate={reduce ? { scale: 1, opacity: 1 } : { scale: [0.9, 1.15, 0.9], opacity: 1 }}
      transition={reduce ? { duration: 0.3, delay } : { duration: 1.6, repeat: Infinity, delay }} />
  );
}

/** A closed or open book: the storybook (warm) or the Mushaf (deep green with a gold frame). */
function Book({ x, y, w, mushaf = false, open = false, delay = 0, children }: { x: number; y: number; w: number; mushaf?: boolean; open?: boolean; delay?: number; children?: React.ReactNode }) {
  const h = w * 0.72;
  return (
    <motion.div className="pointer-events-none absolute" style={{ left: x - w / 2, top: y - h / 2, width: w, height: h }}
      initial={{ opacity: 0, y: 30, rotate: -4 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ type: 'spring', bounce: 0.3, duration: 1, delay }}>
      <div className="absolute inset-0 rounded-[14px]" style={{ background: mushaf ? MUSHAF_GREEN : '#E8774A', boxShadow: '0 30px 50px -26px rgba(60,30,10,0.55)' }} />
      {open ? (
        <div className="absolute flex" style={{ inset: 10, gap: 8 }}>
          {[0, 1].map((i) => (
            <div key={i} className="flex-1 rounded-[8px]" style={{ background: mushaf ? '#FBF4E2' : '#FFFDF8', boxShadow: mushaf ? `inset 0 0 0 3px ${GOLD}66` : undefined }} />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">{children}</div>
        </div>
      ) : (
        <div className="absolute rounded-[10px]" style={{ inset: 14, border: `3px solid ${mushaf ? GOLD : '#FFE0C2'}` }}>
          {mushaf && <div className="absolute inset-0 flex items-center justify-center" style={{ color: GOLD, fontFamily: QURAN_FONT, fontSize: w * 0.16 }}>ٱلْقُرْءَان</div>}
        </div>
      )}
    </motion.div>
  );
}

/** The two new marks lifted out of ٱلرَّحْمَـٰنِ, each with a question tag. */
function MarkTags({ y }: { y: number }) {
  return (
    <div className="pointer-events-none absolute flex justify-center gap-10" style={{ left: 840, top: y, width: 600 }}>
      {['ٱ', 'ـٰ'].map((m, i) => (
        <motion.div key={m} className="flex items-center justify-center gap-3 rounded-full" style={{ width: 150, height: 84, background: '#FFFDF8', boxShadow: `0 14px 30px -18px rgba(60,30,10,0.6), 0 0 0 3px ${GOLD}` }}
          initial={{ y: -60, opacity: 0, scale: 0.6 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.45, duration: 1, delay: 0.7 + i * 0.3 }}>
          <span lang="ar" style={{ fontFamily: QURAN_FONT, fontSize: 52, lineHeight: 1, color: CRIMSON }}>{m === 'ـٰ' ? 'ـٰـ' : m}</span>
          <span className="rounded-full font-sans font-black text-white" style={{ fontSize: 22, width: 36, height: 36, lineHeight: '36px', textAlign: 'center', background: CRIMSON }}>?</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------- cover ---------- */

/** The storybook and the Mushaf side by side; little marks rise off the Mushaf and sparkle. */
export function LbCoverGraphic(_: GraphicProps) {
  const reduce = useReduce();
  const marks = ['ٱ', 'ـٰ', 'ۥ', '۝', 'ۢ'];
  return (
    <>
      <Book x={980} y={560} w={300} open delay={0.3}><span lang="ar" style={{ fontFamily: 'var(--font-display-ar)', fontWeight: 800, fontSize: 52, color: INK_TEXT }}>بَيْت</span></Book>
      <Book x={1330} y={520} w={340} mushaf open delay={0.6}><Q size={48}>ٱلرَّحْمَـٰنِ</Q></Book>
      {marks.map((m, i) => (
        <motion.span key={i} className="pointer-events-none absolute" style={{ left: 1240 + i * 46, top: 330, fontFamily: QURAN_FONT, fontSize: 54, color: GOLD, textShadow: `0 0 16px ${GOLD}` }}
          initial={{ opacity: 0, y: 120 }} animate={reduce ? { opacity: 1, y: 0 } : { opacity: [0, 1, 1], y: [120, 0, -10] }}
          transition={{ duration: 1.6, delay: 1.2 + i * 0.25, ease }}>{m}</motion.span>
      ))}
      <Cut src={`${KIDS}/yusuf-think`} x={830} y={830} h={250} delay={0.9} />
    </>
  );
}

/* ---------- spark ---------- */

/** Yusuf reads his storybook easily (words glide past with ticks), Jiddo brings the Mushaf, and the first word stops him. */
export function LbStuckGraphic({ lines }: GraphicProps) {
  const words = ['بَيْت', 'قَلَم', 'كِتَاب', 'شَمْس'];
  return (
    <>
      {lines >= 1 && lines < 3 && (
        <>
          <Book x={1100} y={420} w={360} open><span /></Book>
          {words.map((w, i) => (
            <motion.div key={w} className="pointer-events-none absolute flex items-center gap-3" style={{ left: 960 + (i % 2) * 150, top: 330 + Math.floor(i / 2) * 90 }}
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 + i * 0.35, ease }}>
              <span lang="ar" style={{ fontFamily: 'var(--font-display-ar)', fontWeight: 800, fontSize: 44, color: INK_TEXT }}>{w}</span>
              <motion.span className="font-sans font-black" style={{ color: TEAL, fontSize: 30 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.6 + i * 0.35 }}>✓</motion.span>
            </motion.div>
          ))}
        </>
      )}
      {lines >= 2 && lines < 3 && <Book x={1330} y={660} w={200} mushaf delay={0.4} />}
      {lines >= 2 && <Cut src={`${KIDS}/jiddo-stand`} x={1450} y={830} h={300} delay={0.2} />}
      {lines >= 3 && (
        <>
          <Book x={1080} y={430} w={520} mushaf open><Q size={86}>ٱلرَّحْمَـٰنِ</Q></Book>
          {/* the two marks Yusuf has never seen: the little head on the alif and the standing alif */}
          <MarkTags y={600} />
        </>
      )}
      <Cut src={`${KIDS}/${lines >= 3 ? 'yusuf-surprised' : 'yusuf-stand'}`} x={860} y={830} h={260} delay={0.1} />
    </>
  );
}

/** The 28 letters he knows fill in; then the marks lift off the word and float with question tags. */
export function LbGuessGraphic({ lines }: GraphicProps) {
  const letters = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'.split('');
  return (
    <>
      {lines >= 1 && (
        <div className="pointer-events-none absolute grid" style={{ left: 820, top: 200, width: 640, gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, direction: 'rtl' }}>
          {letters.map((l, i) => (
            <motion.span key={l} className="flex items-center justify-center rounded-[14px]" style={{ height: 58, background: '#FFFDF8', boxShadow: '0 8px 18px -12px rgba(60,30,10,0.5)', fontFamily: 'var(--font-display-ar)', fontWeight: 800, fontSize: 32, color: lines >= 2 ? soft('light') : CRIMSON }}
              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: lines >= 2 ? 0.45 : 1, scale: 1 }} transition={{ duration: 0.4, delay: lines >= 2 ? 0 : i * 0.04 }}>{l}</motion.span>
          ))}
        </div>
      )}
      {lines >= 2 && (
        <>
          <motion.div className="pointer-events-none absolute text-center" style={{ left: 840, top: 470, width: 600 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
            <Q size={96}>ٱلرَّحْمَـٰنِ</Q>
          </motion.div>
          <MarkTags y={650} />
        </>
      )}
      <Cut src={`${KIDS}/maryam-think`} x={1480} y={830} h={240} delay={0.4} />
    </>
  );
}

/* ---------- zad ---------- */

/** Learn, then teach: Yusuf learns (a light comes to him), then passes it to Maryam; the name Uthman lights up as a star. */
export function LbBestGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Cut src={`${KIDS}/yusuf-point`} x={1020} y={800} h={280} />
      {lines >= 1 && <Chip x={1020} y={480} strong>learning</Chip>}
      {lines >= 2 && (
        <>
          <Svg><Draw d="M 1080 600 C 1160 540, 1240 540, 1310 600" color={GOLD} width={5} glow /></Svg>
          <Cut src={`${KIDS}/maryam-happy`} x={1340} y={800} h={240} delay={0.4} />
          <Chip x={1340} y={520} color={TEAL} delay={0.8}>teaching</Chip>
        </>
      )}
      {lines >= 3 && (
        <motion.div className="pointer-events-none absolute flex flex-col items-center" style={{ left: 1080, top: 190, width: 300 }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease }}>
          <span className="rounded-full" style={{ width: 26, height: 26, background: '#FFF6DC', boxShadow: `0 0 40px 16px ${GOLD}AA` }} />
          <span className="mt-4 font-serif" style={{ fontSize: 44, color: INK_TEXT }}>Uthman</span>
          <span lang="ar" style={{ fontFamily: 'var(--font-display-ar)', fontWeight: 700, fontSize: 22, color: DEEP }}>عثمان رضي الله عنه</span>
        </motion.div>
      )}
    </>
  );
}

/** One open Mushaf page drawn large; the four parts of its map light up one by one with a label. */
export function LbMapGraphic({ lines, items }: GraphicProps) {
  if (lines === 0) return null;
  const L = 860, T = 170, W = 560, H = 620;
  const parts = [
    { y: T + 70, label: 'Surah name', ar: 'اسم السورة' },
    { y: T + 160, label: 'Bismillah', ar: 'البسملة' },
    { y: T + 330, label: 'Ayah circle', ar: 'نهاية الآية' },
    { y: T + 110, label: 'Juz marker', ar: 'علامة الجزء' },
  ];
  const lit = (i: number) => items >= i + 1;
  return (
    <>
      <div className="pointer-events-none absolute rounded-[18px]" style={{ left: L, top: T, width: W, height: H, background: '#FBF4E2', boxShadow: `0 40px 70px -40px rgba(60,30,10,0.6), inset 0 0 0 10px ${MUSHAF_GREEN}, inset 0 0 0 14px ${GOLD}` }} />
      {/* surah name cartouche */}
      <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-full" style={{ left: L + 90, top: T + 40, width: W - 180, height: 64, background: lit(0) ? MUSHAF_GREEN : '#E9DEC4', transition: 'background 0.6s' }}>
        <Q size={34} color={lit(0) ? GOLD : '#9A8B6E'}>سُورَةُ ٱلْفَاتِحَةِ</Q>
      </motion.div>
      {/* basmala */}
      <div className="pointer-events-none absolute text-center" style={{ left: L + 40, top: T + 116, width: W - 80, opacity: lit(1) ? 1 : 0.45, transition: 'opacity 0.6s' }}>
        <Q size={38} clip="fatiha-1">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ ۝١</Q>
      </div>
      {/* text lines with circles */}
      <div className="pointer-events-none absolute flex flex-col items-center" style={{ left: L + 40, top: T + 210, width: W - 80, gap: 6, opacity: 0.85 }}>
        <Q size={32}>ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ ۝٢</Q>
        <Q size={32}>ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ ۝٣ مَـٰلِكِ يَوْمِ ٱلدِّينِ ۝٤</Q>
        <Q size={32}>إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝٥</Q>
      </div>
      {/* juz marker in the margin */}
      <motion.div className="pointer-events-none absolute flex items-center justify-center rounded-full font-bold" style={{ left: L + W - 20, top: T + 90, width: 64, height: 64, background: lit(3) ? GOLD : '#E9DEC4', color: '#fff', fontFamily: 'var(--font-display-ar)', fontSize: 15, transition: 'background 0.6s' }}>الجزء ١</motion.div>
      {lit(2) && <Pulse x={L + 92} y={T + 262} r={28} />}
      {parts.map((p, i) => lit(i) && (
        <motion.div key={p.label} className="pointer-events-none absolute flex items-center gap-2" style={{ left: i === 3 ? L + W + 52 : 760, top: p.y - 18 }}
          initial={{ opacity: 0, x: i === 3 ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease }}>
          <span className="rounded-full font-sans font-extrabold text-white" style={{ padding: '6px 12px', fontSize: 16, background: [CRIMSON, TEAL, GOLD, CRIMSON][i] }}>{p.label}</span>
        </motion.div>
      ))}
    </>
  );
}

/** A full stop becomes the ayah circle; the circles of Al-Fatiha count to seven; each one breathes. */
export function LbCircleGraphic({ lines }: GraphicProps) {
  const ayat = ['بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ', 'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ', 'مَـٰلِكِ يَوْمِ ٱلدِّينِ', 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ ...'];
  const digits = '١٢٣٤٥٦٧';
  const reduce = useReduce();
  return (
    <>
      {lines === 1 && (
        <motion.div className="pointer-events-none absolute flex items-center gap-10" style={{ left: 880, top: 380 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="font-serif" style={{ fontSize: 64, color: INK_TEXT }}>The end<span style={{ color: CRIMSON }}>.</span></span>
          <motion.span className="font-sans font-black" style={{ fontSize: 50, color: GOLD }} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}>→</motion.span>
          <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.4, delay: 1 }}><Q size={110} color={MUSHAF_GREEN}>۝</Q></motion.span>
        </motion.div>
      )}
      {lines >= 2 && (
        <div className="pointer-events-none absolute flex flex-col items-end" style={{ left: 800, top: 170, width: 640, gap: 0 }}>
          {ayat.map((a, i) => (
            <motion.div key={i} className="flex items-center gap-3" style={{ direction: 'rtl' }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.18 }}>
              <span style={{ position: 'relative' }}>
                <Q size={44} color={MUSHAF_GREEN}>{`۝${digits[i]}`}</Q>
                {lines >= 4 && !reduce && (
                  <motion.span className="absolute rounded-full" style={{ inset: 8, border: `3px solid ${TEAL}` }} animate={{ scale: [1, 1.5], opacity: [0.8, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4 }} />
                )}
              </span>
              <Q size={30} clip={i === 1 ? 'fatiha-2' : undefined}>{a}</Q>
            </motion.div>
          ))}
        </div>
      )}
      {lines >= 3 && (
        <motion.div className="pointer-events-none absolute flex flex-col items-center" style={{ left: 820, top: 560, width: 200 }} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.45, delay: 1.3 }}>
          <span className="font-serif" style={{ fontSize: 120, lineHeight: 1, color: CRIMSON }}>7</span>
          <span className="font-sans font-extrabold" style={{ fontSize: 20, color: soft('light') }}>ayat in Al-Fatiha</span>
        </motion.div>
      )}
      {lines >= 4 && <Chip x={920} y={770} color={TEAL}>stop and breathe</Chip>}
    </>
  );
}

/** Three word cards; on each, its helper mark glows and says its one-line job. */
export function LbHelpersGraphic({ lines, items }: GraphicProps) {
  const cards = [
    { word: 'ٱلرَّحْمَـٰنِ', clip: 'fatiha-3', mark: 'ٱ', job: 'skip me when you join', color: CRIMSON, at: { x: 214, y: 46 } },
    { word: 'ٱلرَّحْمَـٰنِ', clip: 'fatiha-3', mark: 'ـٰ', job: 'stretch: aa', color: TEAL, at: { x: 92, y: 36 } },
    { word: 'لَهُۥ', clip: 'ikhlas-4', mark: 'ۥ', job: 'stretch: oo', color: GOLD, at: { x: 70, y: 66 } },
  ];
  return (
    <>
      {lines >= 1 && items === 0 && (
        <motion.div className="pointer-events-none absolute flex gap-8" style={{ left: 860, top: 380 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {['ٱ', 'ـٰ', 'ۥ'].map((m, i) => (
            <motion.span key={m} className="flex items-center justify-center rounded-[26px]" style={{ width: 150, height: 150, background: '#FFFDF8', boxShadow: '0 20px 40px -24px rgba(60,30,10,0.5)' }}
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4, delay: 0.2 + i * 0.2 }}>
              <Q size={84} color={[CRIMSON, TEAL, GOLD][i]}>{m}</Q>
            </motion.span>
          ))}
        </motion.div>
      )}
      {cards.slice(0, items).map((c, i) => (
        <motion.div key={i} className="absolute rounded-[26px]" style={{ left: 780 + i * 250, top: 230 + (i % 2) * 40, width: 230, padding: '10px 14px 16px', background: '#FFFDF8', boxShadow: `0 24px 46px -26px rgba(60,30,10,0.55), 0 0 0 4px ${c.color}` }}
          initial={{ opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.9 }}>
          <div className="relative flex justify-center"><Q size={64} clip={c.clip}>{c.word}</Q></div>
          <div className="mt-1 text-center"><Q size={40} color={c.color}>{c.mark}</Q></div>
          <p className="m-0 text-center font-sans font-extrabold" style={{ fontSize: 22, color: c.color }}>{c.job}</p>
        </motion.div>
      ))}
      <Cut src={`${KIDS}/${items >= 1 ? 'maryam-point' : 'maryam-stand'}`} x={1460} y={830} h={240} delay={0.3} />
    </>
  );
}

/** Madinah in the middle; the copies travel to four cities; then one long road to the Mushaf on your table. */
export function LbUthmanGraphic({ lines }: GraphicProps) {
  const M = { x: 1010, y: 560 };
  const cities = [
    { n: 'Makkah', x: 1080, y: 720 },
    { n: 'Sham', x: 940, y: 240 },
    { n: 'Kufa', x: 1250, y: 300 },
    { n: 'Basra', x: 1390, y: 410 },
  ];
  return (
    <>
      <Svg>
        {lines >= 2 && cities.map((c, i) => (
          <Draw key={c.n} d={`M ${M.x} ${M.y} Q ${(M.x + c.x) / 2 + 40} ${(M.y + c.y) / 2 - 40}, ${c.x} ${c.y}`} color={GOLD} width={4} dash="2 10" delay={0.2 + i * 0.25} />
        ))}
        {lines >= 3 && <Draw d={`M ${M.x} ${M.y} C 1200 600, 1320 640, 1430 700`} color={CRIMSON} width={5} glow delay={0.2} dur={1.6} />}
      </Svg>
      <motion.div className="pointer-events-none absolute flex flex-col items-center" style={{ left: M.x - 70, top: M.y - 22, width: 140 }}>
        <span className="rounded-full" style={{ width: 22, height: 22, background: '#FFF6DC', boxShadow: `0 0 30px 12px ${GOLD}AA` }} />
        <span className="mt-1 font-sans font-extrabold" style={{ fontSize: 20, color: INK_TEXT }}>Madinah</span>
        {lines >= 1 && <motion.span className="font-sans font-bold" style={{ fontSize: 15, color: CRIMSON }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Uthman’s copies</motion.span>}
      </motion.div>
      {lines >= 2 && cities.map((c, i) => (
        <React.Fragment key={c.n}>
          <motion.div className="pointer-events-none absolute" style={{ left: c.x - 22, top: c.y - 30 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.9 + i * 0.25 }}>
            <Book x={22} y={18} w={50} mushaf />
          </motion.div>
          <Chip x={c.x} y={c.y + 14} delay={1 + i * 0.25}>{c.n}</Chip>
        </React.Fragment>
      ))}
      {lines >= 3 && (
        <>
          <Book x={1440} y={650} w={170} mushaf open delay={1.4}><Q size={22}>ٱلرَّحْمَـٰنِ</Q></Book>
          <Chip x={1440} y={740} strong delay={1.6}>your Mushaf</Chip>
        </>
      )}
      {lines >= 4 && ['ٱ', 'ـٰ', 'ۥ'].map((m, i) => (
        <motion.span key={m} className="pointer-events-none absolute" style={{ left: 1390 + i * 40, top: 540, fontFamily: QURAN_FONT, fontSize: 40, color: GOLD, textShadow: `0 0 14px ${GOLD}` }}
          initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.2, duration: 0.6 }}>{m}</motion.span>
      ))}
    </>
  );
}

/* ---------- athar ---------- */

/** The Fatiha page, waiting while the learner hunts for the helpers on the cards. */
export function LbSpotGraphic({ lines, interaction }: GraphicProps) {
  if (lines === 0 && !interaction) return null;
  return (
    <>
      <Book x={1130} y={460} w={560} mushaf open><div className="flex flex-col items-center"><Q size={34}>ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ</Q><Q size={34}>مَـٰلِكِ يَوْمِ ٱلدِّينِ</Q></div></Book>
      <Cut src={`${KIDS}/yusuf-think`} x={1450} y={830} h={240} delay={0.3} />
    </>
  );
}

/** The ayah large; a finger moves word by word from right to left; the standing alif stretches like a spring. */
export function LbAlongGraphic({ lines }: GraphicProps) {
  const reduce = useReduce();
  if (lines === 0) return <Cut src={`${KIDS}/yusuf-point`} x={1460} y={830} h={240} delay={0.3} />;
  return (
    <>
      <motion.div className="absolute text-center" style={{ left: 780, top: 300, width: 720 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease }}>
        <Q size={70} clip="fatiha-2b">ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ</Q>
        <p className="m-0 font-sans font-bold" style={{ fontSize: 18, color: soft('light') }}>tap the ayah to listen</p>
      </motion.div>
      {lines >= 1 && (
        <motion.span className="pointer-events-none absolute" style={{ top: 430, fontSize: 52 }} initial={{ left: 1420 }} animate={reduce ? { left: 1420 } : { left: [1420, 1240, 1110, 860] }} transition={{ duration: 4, repeat: reduce ? 0 : Infinity, repeatDelay: 1 }}>☝️</motion.span>
      )}
      {lines >= 2 && (
        <motion.div className="pointer-events-none absolute flex items-center" style={{ left: 880, top: 560 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="font-sans font-extrabold" style={{ fontSize: 30, color: TEAL }}>ʿaa</span>
          <motion.span className="mx-2 rounded-full" style={{ height: 10, background: TEAL, width: 60 }} animate={reduce ? { width: 160 } : { width: [60, 200, 60] }} transition={{ duration: 2, repeat: reduce ? 0 : Infinity }} />
          <span className="font-sans font-extrabold" style={{ fontSize: 30, color: TEAL }}>lameen</span>
        </motion.div>
      )}
      <Cut src={`${KIDS}/yusuf-point`} x={1460} y={830} h={240} delay={0.3} />
    </>
  );
}

/* ---------- ahd ---------- */

/** Jiddo with the open Mushaf and the week's checklist: three circles and one standing alif. */
export function LbMissionGraphic({ lines }: GraphicProps) {
  if (lines === 0) return <Cut src={`${KIDS}/jiddo-explain`} x={1430} y={830} h={300} delay={0.4} />;
  const tasks = [{ m: '۝', t: 'Ayah circle' }, { m: '۝', t: 'Ayah circle' }, { m: '۝', t: 'Ayah circle' }, { m: 'ـٰ', t: 'Standing alif' }];
  return (
    <>
      <Book x={1080} y={360} w={380} mushaf open delay={0.2}><Q size={30}>سُورَةُ ٱلْفَاتِحَةِ</Q></Book>
      <div className="pointer-events-none absolute flex flex-col gap-3" style={{ left: 900, top: 560 }}>
        {tasks.map((k, i) => (
          <motion.div key={i} className="flex items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.2 }}>
            <span className="flex items-center justify-center rounded-[8px]" style={{ width: 36, height: 36, border: `3px solid ${TEAL}`, background: '#FFFDF8' }} />
            <Q size={30} color={MUSHAF_GREEN}>{k.m}</Q>
            <span className="font-sans font-extrabold" style={{ fontSize: 20, color: INK_TEXT }}>{k.t}</span>
          </motion.div>
        ))}
      </div>
      <Cut src={`${KIDS}/jiddo-explain`} x={1430} y={830} h={300} delay={0.4} />
    </>
  );
}

/** A tiny alif stands on a letter; a question mark; then it rises and stretches into a long line. */
export function LbNextGraphic({ lines }: GraphicProps) {
  return (
    <>
      <div className="pointer-events-none absolute text-center" style={{ left: 820, top: 260, width: 520 }}>
        <Q size={150} color={INK_TEXT}>مَـٰلِكِ</Q>
      </div>
      {lines >= 1 && <Pulse x={1150} y={400} r={70} />}
      {lines >= 2 && (
        <motion.span className="pointer-events-none absolute rounded-full font-sans font-black text-white" style={{ left: 1150, top: 230, width: 64, height: 64, lineHeight: '64px', textAlign: 'center', fontSize: 38, background: CRIMSON }}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>?</motion.span>
      )}
      {lines >= 3 && (
        <motion.div className="pointer-events-none absolute rounded-full" style={{ left: 880, top: 640, height: 12, background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD}, ${TEAL})` }}
          initial={{ width: 20 }} animate={{ width: 400 }} transition={{ duration: 1.4, ease }} />
      )}
      <Cut src={`${KIDS}/maryam-point`} x={1460} y={830} h={250} delay={0.3} />
    </>
  );
}
