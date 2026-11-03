import React from 'react';
import { motion } from 'motion/react';
import { ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';
import { INK_TEXT, soft, type GraphicProps } from './Stage';
import { Svg, Draw, Person, Chip, Badge, DEEP } from './kit';
import { Hear } from '../Say';
import { ArText, Say, Tile, Skyline, Building, Street, Stairs, useMirror, GROUND, ADAM, SAYED, MONA } from './g-ea1';

/**
 * Egyptian Arabic · Adults · Lesson 2 · Where Are You From? Same Cairo building and cast as Lesson 1. The motion carries
 * the lesson's two ideas: منين is من + فين glued, answered in the question's slot; and a country becomes a person with
 * one ending that follows the person (ـي / ـية). Every Arabic word plays on tap; the Franco track mirrors the rows.
 */

export const ELDER = '#8C6A9E';
const CARD = '#FFFDF8';
const SHADOW = '0 18px 34px -24px rgba(60,30,10,0.6)';

function Label({ x, y, children, color = soft('light') }: { x: number; y: number; children: React.ReactNode; color?: string }) {
  return <span className="pointer-events-none absolute font-sans font-bold uppercase" style={{ left: x, top: y, fontSize: 15, letterSpacing: '0.16em', color }}>{children}</span>;
}

/* ---------- spark ---------- */

/** A dashed route comes from far away to the Cairo building; the question it carries is the lesson. */
export function Ea2CoverGraphic(_: GraphicProps) {
  return (
    <>
      <Skyline opacity={0.4} />
      <Building x={1150} w={330} delay={0.3} />
      <Street />
      <Badge x={1450} y={560} name="globe" size={100} color={TEAL} delay={0.6} />
      <Svg><Draw d="M 1430 500 Q 1440 330 1330 300" color={GOLD} width={3} dash="3 10" delay={1} dur={1.4} /></Svg>
      <Say x={1300} y={420} id="inta-minen" text="إنت منين؟" align="right" delay={2} width={220} accent />
    </>
  );
}

/** Mona asks from the stairs; Adam's answer comes out in English; then the question word is opened up. */
export function Ea2StairsGraphic({ lines }: GraphicProps) {
  return (
    <>
      <Street />
      <Stairs />
      <Person x={1020} y={GROUND} scale={1.05} color={ADAM} />
      <Person x={1300} y={GROUND - 140} scale={1.0} color={MONA} hijab flip />
      {lines >= 1 && lines < 3 && <Say x={1300} y={420} id="inta-minen" text="إنت منين؟" align="right" delay={0.3} width={210} accent />}
      {lines === 1 && <Say x={1020} y={560} text={<span className="font-sans font-bold" style={{ fontSize: 26 }}>England…</span>} thought delay={1.2} width={170} />}
      {lines >= 2 && lines < 3 && <Chip x={1020} y={520} color={TEAL} delay={0.2}>this time, in Egyptian</Chip>}
      {lines >= 3 && (
        <Tile x={1150} y={300} size={90} hot={lines >= 4}>
          <Hear id="inta-minen">من<span style={{ color: lines >= 4 ? TEAL : INK_TEXT, transition: 'color 0.6s' }}>ين</span></Hear>
        </Tile>
      )}
      {lines >= 4 && <Chip x={1150} y={400} color={TEAL} delay={0.4}>فين · where?</Chip>}
    </>
  );
}

/** At the stairs, three people, three places; each exchange replaces the last, then each person gets their place. */
export function Ea2ListenGraphic({ lines }: GraphicProps) {
  const k = Math.min(lines, 3);
  return (
    <>
      <Building x={790} w={300} />
      <Street />
      <Person x={1000} y={GROUND} scale={1.05} color={SAYED} />
      <Person x={1210} y={GROUND} scale={1.05} color={ADAM} />
      <Person x={1420} y={GROUND} scale={1.0} color={MONA} hijab flip />
      {k === 1 && (
        <React.Fragment key="a">
          <Say x={1420} y={560} id="l-minen" text="إنت منين يا آدم؟" align="right" delay={0.6} width={290} />
          <Say x={1210} y={420} id="l-ana-min" text="أنا من إنجلترا. وإنتي؟" delay={1.8} width={300} />
        </React.Fragment>
      )}
      {k === 2 && (
        <React.Fragment key="b">
          <Say x={1420} y={560} id="l-mona" text="أنا من هنا، من القاهرة." align="right" width={300} />
          <Say x={1000} y={400} id="l-sayed" text="وأنا من أسوان!" delay={1.4} width={230} accent />
        </React.Fragment>
      )}
      {k === 3 && (
        <>
          <Chip x={1000} y={520} color={SAYED}>Aswan</Chip>
          <Chip x={1210} y={520} color={ADAM} delay={0.2}>England</Chip>
          <Chip x={1420} y={520} color={MONA} delay={0.4}>Cairo</Chip>
        </>
      )}
    </>
  );
}

/* ---------- zad ---------- */

/** من and فين slide into one word; it takes the end of the question; the answer drops into the same slot. */
export function Ea2MinenGraphic({ lines }: GraphicProps) {
  const X = useMirror();
  return (
    <>
      {lines >= 1 && lines < 2 && (
        <>
          <Tile x={X(1320)} y={300} color={TEAL} from={{ x: X(0) ? -120 : 120, y: 0 }}><Hear id="min">من</Hear></Tile>
          <span className="pointer-events-none absolute font-sans font-black" style={{ left: 1130, top: 270, fontSize: 44, color: GOLD }}>+</span>
          <Tile x={X(960)} y={300} color={CRIMSON} from={{ x: X(0) ? 120 : -120, y: 0 }}><Hear id="fen">فين</Hear></Tile>
          <Tile x={1140} y={470} size={80} hot delay={1}><Hear id="minen">منين؟</Hear></Tile>
        </>
      )}
      {lines >= 2 && (
        <>
          <Label x={800} y={220}>Question</Label>
          <Tile x={X(1330)} y={270}><Hear id="inta-minen">إنت</Hear></Tile>
          <Tile x={X(1060)} y={270} hot from={{ x: 0, y: 200 }}>منين؟</Tile>
        </>
      )}
      {lines >= 3 && (
        <>
          <Svg>
            <Draw d={`M ${X(1330)} 316 L ${X(1330)} 410`} color={GOLD} width={3} dash="4 8" delay={0.2} dur={0.5} />
            <Draw d={`M ${X(1060)} 316 L ${X(1060)} 410`} color={GOLD} width={3} dash="4 8" delay={0.2} dur={0.5} />
          </Svg>
          <Label x={800} y={420} color={CRIMSON}>Answer</Label>
          <Tile x={X(1330)} y={460} color={TEAL} delay={0.4}>أنا</Tile>
          <Tile x={X(1060)} y={460} color={CRIMSON} from={{ x: 0, y: -190 }} delay={0.7}>من إنجلترا</Tile>
        </>
      )}
      {lines >= 4 && (
        <>
          <Tile x={1140} y={640} size={52} delay={0.2}><Hear id="ana-min-hina">أنا من هنا.</Hear></Tile>
          <Chip x={1140} y={710} color={TEAL} delay={0.5}>= I'm a local</Chip>
        </>
      )}
    </>
  );
}

/** Six pins drop on a strip of the world, west to east, each one a country you can hear. */
export function Ea2CountriesGraphic({ lines, items }: GraphicProps) {
  const pins = [
    { x: 840, y: 360, t: 'كندا', id: 'kanada' }, { x: 930, y: 470, t: 'أمريكا', id: 'amrika' }, { x: 1090, y: 330, t: 'إنجلترا', id: 'ingiltira' },
    { x: 1200, y: 410, t: 'ألمانيا', id: 'almanya' }, { x: 1330, y: 540, t: 'مصر', id: 'masr' }, { x: 1450, y: 600, t: 'السعودية', id: 'saudiyya' },
  ];
  const order = [4, 2, 1, 0, 3, 5]; // the slide's item order: Egypt, England, America, Canada, Germany, Saudi Arabia
  const shown = new Set(order.slice(0, items));
  return (
    <>
      <Svg>
        <Draw d="M 790 420 C 900 300, 1000 520, 1110 380 S 1300 470, 1380 560 S 1480 640, 1520 600" color={DEEP} width={2} dash="2 9" opacity={0.4} dur={1.6} />
      </Svg>
      {lines >= 2 && <Chip x={1150} y={720} color={TEAL} delay={0.3}>west → east</Chip>}
      {pins.map((p, i) => shown.has(i) && (
        <motion.div key={p.id} className="absolute flex flex-col items-center" style={{ left: p.x - 80, top: p.y - 110, width: 160 }}
          initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.45 }}>
          <span className="rounded-[16px]" style={{ padding: '2px 16px', background: CARD, boxShadow: p.id === 'masr' ? `0 0 0 3px ${CRIMSON}, ${SHADOW}` : SHADOW }}><Hear id={p.id}><ArText size={36}>{p.t}</ArText></Hear></span>
          <span className="mt-1 block rounded-full" style={{ width: 22, height: 22, background: p.id === 'masr' ? CRIMSON : GOLD, boxShadow: `0 0 16px 4px ${GOLD}66` }} />
        </motion.div>
      ))}
    </>
  );
}

/** Sayed names Adam and Mona; then the country takes one ending for a man and one for a woman. */
export function Ea2MasriGraphic({ lines }: GraphicProps) {
  const X = useMirror();
  if (lines < 2) {
    return (
      <>
        <Street />
        <Person x={1000} y={GROUND} scale={1.05} color={ADAM} />
        <Person x={1200} y={GROUND} scale={1.1} color={SAYED} />
        <Person x={1400} y={GROUND} scale={1.0} color={MONA} hijab flip />
        {lines >= 1 && (
          <>
            <Say x={1200} y={540} id="inta-ingilizi" text="إنت إنجليزي!" width={220} delay={0.3} />
            <Say x={1400} y={430} id="hiyya-masriyya" text="وهي مصرية." align="right" width={210} delay={1.5} accent />
          </>
        )}
      </>
    );
  }
  return (
    <>
      <Tile x={X(1370)} y={300}><Hear id="masr">مصر</Hear></Tile>
      <span className="pointer-events-none absolute font-sans font-black" style={{ left: 1205, top: 270, fontSize: 44, color: GOLD }}>+</span>
      <Tile x={X(1090)} y={300} color={TEAL} delay={0.2}>ـي</Tile>
      <span className="pointer-events-none absolute font-sans font-black" style={{ left: X(910) - 20, top: 270, fontSize: 44, color: soft('light') }}>=</span>
      <Tile x={X(840)} y={300} hot delay={0.5}><Hear id="masri">مصري</Hear></Tile>
      <Chip x={X(840)} y={360} color={TEAL} delay={0.7}>a man</Chip>
      {lines >= 3 && (
        <>
          <Tile x={X(1370)} y={520}><Hear id="masr">مصر</Hear></Tile>
          <span className="pointer-events-none absolute font-sans font-black" style={{ left: 1205, top: 490, fontSize: 44, color: GOLD }}>+</span>
          <Tile x={X(1090)} y={520} color={GOLD} delay={0.2}>ـية</Tile>
          <span className="pointer-events-none absolute font-sans font-black" style={{ left: X(910) - 20, top: 490, fontSize: 44, color: soft('light') }}>=</span>
          <Tile x={X(840)} y={520} hot delay={0.5}><Hear id="masriyya">مصرية</Hear></Tile>
          <Chip x={X(840)} y={580} color="#B07A1E" delay={0.7}>a woman</Chip>
        </>
      )}
      {lines >= 4 && <Chip x={1230} y={700} color={TEAL} delay={0.3}>any country + ـي / ـية</Chip>}
    </>
  );
}

/** Four rows, country → a man / a woman; America shows off its extra ـاني; yes and no close the page. */
export function Ea2EndingsGraphic({ lines, items }: GraphicProps) {
  const X = useMirror();
  const rows = [
    { c: 'مصر', m: 'مصري', w: 'مصرية', im: 'masri', iw: 'masriyya', ic: 'masr' },
    { c: 'كندا', m: 'كندي', w: 'كندية', im: 'kanadi', iw: 'kanadiyya', ic: 'kanada' },
    { c: 'ألمانيا', m: 'ألماني', w: 'ألمانية', im: 'almani', iw: 'almaniyya', ic: 'almanya' },
    { c: 'أمريكا', m: 'أمريكاني', w: 'أمريكانية', im: 'amrikani', iw: 'amrikaniyya', ic: 'amrika' },
  ];
  const n = Math.max(items, lines >= 1 ? 1 : 0);
  return (
    <>
      <Label x={X(1340) - (X(0) ? 60 : 0)} y={170}>Country</Label>
      <Label x={X(1080) - (X(0) ? 60 : 0)} y={170} color={TEAL}>A man</Label>
      <Label x={X(840) - (X(0) ? 60 : 0)} y={170} color="#B07A1E">A woman</Label>
      {rows.slice(0, n).map((r, i) => {
        const y = 250 + i * 120;
        const rebel = i === 3 && lines >= 2;
        return (
          <React.Fragment key={r.c}>
            <Tile x={X(1380)} y={y} size={40}><Hear id={r.ic}>{r.c}</Hear></Tile>
            <Tile x={X(1120)} y={y} size={40} color={TEAL} delay={0.2} hot={rebel}><Hear id={r.im}>{r.m}</Hear></Tile>
            <Tile x={X(870)} y={y} size={40} color="#B07A1E" delay={0.35} hot={rebel}><Hear id={r.iw}>{r.w}</Hear></Tile>
          </React.Fragment>
        );
      })}
      {lines >= 2 && n >= 4 && <Chip x={1140} y={662} color={CRIMSON} delay={0.3}>America: ـاني</Chip>}
      {lines >= 3 && (
        <>
          <Tile x={X(1250)} y={770} size={40} color={TEAL} delay={0.2}><Hear id="aywa">أيوه</Hear></Tile>
          <Tile x={X(1050)} y={770} size={40} color={CRIMSON} delay={0.4}><Hear id="la">لأ</Hear></Tile>
        </>
      )}
    </>
  );
}

/** Sayed's question; then one letter, two sounds: the book's j and Cairo's g, and three words that carry it. */
export function Ea2GimGraphic({ lines }: GraphicProps) {
  if (lines < 2) {
    return (
      <>
        <Building x={790} w={300} />
        <Street />
        <Person x={950} y={GROUND} scale={1.1} color={SAYED} />
        <Person x={1300} y={GROUND} scale={1.05} color={ADAM} flip />
        {lines >= 1 && <Say x={950} y={540} id="inta-gidid" text="إنت جديد هنا؟" width={250} delay={0.3} accent />}
      </>
    );
  }
  return (
    <>
      <motion.div className="absolute flex items-center justify-center rounded-[34px]" style={{ left: 1040, top: 190, width: 200, height: 200, background: CARD, boxShadow: `0 0 0 4px ${GOLD}, ${SHADOW}` }}
        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.4 }}>
        <span lang="ar" style={{ fontFamily: 'var(--font-display-ar)', fontWeight: 800, fontSize: 140, color: DEEP, lineHeight: 1 }}>ج</span>
      </motion.div>
      <Svg>
        <Draw d="M 1080 400 Q 960 450 900 520" color={soft('light')} width={3} delay={0.4} dur={0.7} />
        {lines >= 3 && <Draw d="M 1200 400 Q 1320 450 1380 520" color={CRIMSON} width={4} delay={0.2} dur={0.7} />}
      </Svg>
      <motion.div className="absolute flex flex-col items-center" style={{ left: 790, top: 520, width: 220 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: lines >= 3 ? 0.5 : 1, y: 0 }} transition={{ delay: 0.8 }}>
        <span className="font-sans font-black" style={{ fontSize: 64, color: INK_TEXT }}>j</span>
        <span className="font-sans font-bold uppercase" style={{ fontSize: 14, letterSpacing: '0.16em', color: soft('light') }}>the book · jadiid</span>
      </motion.div>
      {lines >= 3 && (
        <motion.div className="absolute flex flex-col items-center" style={{ left: 1270, top: 520, width: 220 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <span className="font-sans font-black" style={{ fontSize: 64, color: CRIMSON }}>g</span>
          <span className="font-sans font-bold uppercase" style={{ fontSize: 14, letterSpacing: '0.16em', color: CRIMSON }}>Cairo · gidiid</span>
        </motion.div>
      )}
      {lines >= 4 && (
        <>
          <Tile x={900} y={730} size={42} delay={0.1}><Hear id="gamil">جميل</Hear></Tile>
          <Tile x={1140} y={730} size={42} delay={0.25}><Hear id="gidid">جديد</Hear></Tile>
          <Tile x={1380} y={730} size={42} delay={0.4}><Hear id="gama">جامعة</Hear></Tile>
        </>
      )}
    </>
  );
}

/** Adam asks three people; each gets their own form of the question, the elder raised on a gold step. */
export function Ea2PoliteGraphic({ lines, items }: GraphicProps) {
  const people = [
    { x: 880, color: '#6E8B5A', hijab: false, id: 'inta-minen', q: 'إنت منين؟', lift: false },
    { x: 1110, color: MONA, hijab: true, id: 'inti-minen', q: 'إنتي منين؟', lift: false },
    { x: 1360, color: ELDER, hijab: true, id: 'hadritik-minen', q: 'حضرتِك منين؟', lift: true },
  ];
  const n = Math.max(items, lines >= 2 ? 2 : lines >= 1 ? 1 : 0);
  return (
    <>
      <Street />
      {people.slice(0, Math.max(n, lines >= 1 ? 3 : 0)).map((p, i) => {
        const asked = i < n;
        return (
          <React.Fragment key={p.id}>
            {p.lift && asked && (
              <motion.div className="absolute rounded-t-[10px]" style={{ left: p.x - 85, top: GROUND - 46, width: 170, height: 46, background: `linear-gradient(180deg, ${GOLD}, #C98A22)`, boxShadow: `0 0 40px 6px ${GOLD}66` }}
                initial={{ scaleY: 0, originY: 1 }} animate={{ scaleY: 1 }} transition={{ duration: 0.7, ease }} />
            )}
            <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={false} animate={{ y: p.lift && asked ? -46 : 0 }} transition={{ duration: 0.7, ease }}>
              <Person x={p.x} y={GROUND} scale={p.lift ? 1.05 : 1} color={p.color} hijab={p.hijab} dim={!asked} glow={p.lift && asked} />
            </motion.div>
            {asked && <Say x={p.x} y={p.lift ? 410 : 545} id={p.id} text={p.q} width={220} delay={0.3} accent={p.lift} align={p.lift ? 'right' : 'left'} />}
          </React.Fragment>
        );
      })}
      {lines >= 3 && <Chip x={1000} y={220} color={CRIMSON} delay={0.3}>حضرتك works with every question</Chip>}
      {items >= 3 && <Say x={1360} y={300} id="ana-min-tanta" text="أنا من طنطا." align="right" width={200} delay={1} />}
    </>
  );
}

/* ---------- athar ---------- */

/** The roof party: lights strung across, three guests, and the four moves of the conversation ticking off. */
export function Ea2TalkGraphic({ lines, interaction }: GraphicProps) {
  const moves = ['Greet them', 'Ask: منين؟', 'Answer: أنا من...', 'Say it back: مصري / كندية'];
  const guests = [{ x: 1000, c: '#6E8B5A', h: false, l: 'Egypt' }, { x: 1220, c: TEAL, h: true, l: 'Canada' }, { x: 1440, c: ELDER, h: true, l: 'Tanta · حضرتك' }];
  return (
    <>
      <Svg>
        <Draw d="M 780 200 Q 1150 300 1520 200" color={DEEP} width={2} opacity={0.5} dur={1} />
        {Array.from({ length: 9 }, (_, i) => {
          const t = (i + 0.5) / 9;
          const x = 780 + 740 * t;
          const y = (1 - t) * (1 - t) * 200 + 2 * (1 - t) * t * 300 + t * t * 200;
          return <motion.circle key={i} cx={x} cy={y + 10} r={8} fill={i % 2 ? GOLD : CRIMSON} initial={{ opacity: 0 }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.12 }} />;
        })}
      </Svg>
      <Street />
      {guests.map((g, i) => (
        <React.Fragment key={g.l}>
          <Person x={g.x} y={GROUND} scale={0.95} color={g.c} hijab={g.h} delay={i * 0.15} />
          {lines >= 1 && <Chip x={g.x} y={GROUND - 250} color={g.c} delay={0.3 + i * 0.2}>{g.l}</Chip>}
        </React.Fragment>
      ))}
      <Person x={830} y={GROUND} scale={1.05} color={ADAM} />
      <Chip x={830} y={GROUND - 260}>you</Chip>
      {lines >= 2 && (
        <div className="absolute flex flex-col gap-3" style={{ left: 790, top: 250, width: 380 }}>
          {moves.map((m, i) => (
            <motion.div key={m} className="flex items-center gap-3 rounded-[16px]" style={{ padding: '8px 14px', background: CARD, boxShadow: '0 14px 28px -22px rgba(60,30,10,0.6)' }}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15, duration: 0.5, ease }}>
              <motion.span className="flex shrink-0 items-center justify-center rounded-full font-sans font-black text-white" style={{ width: 28, height: 28, fontSize: 15 }}
                initial={false} animate={{ background: interaction ? TEAL : 'rgba(31,22,18,0.18)' }} transition={{ delay: interaction ? 0.3 + i * 0.35 : 0 }}>✓</motion.span>
              <span className="font-sans font-semibold" style={{ fontSize: 18, color: INK_TEXT }}>{m}</span>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- ahd ---------- */

/** منين goes out to three people; a city, not a country, comes back from each. */
export function Ea2MissionGraphic({ lines }: GraphicProps) {
  const spots = [{ x: 880, y: 260, icon: 'chat', city: 'Alexandria' }, { x: 1380, y: 260, icon: 'phone', city: 'Mansoura' }, { x: 1400, y: 600, icon: 'house', city: 'Aswan' }];
  return (
    <>
      <Person x={1130} y={720} scale={1.05} color={ADAM} />
      {lines >= 1 && spots.map((s, i) => (
        <React.Fragment key={s.icon}>
          <Svg><Draw d={`M 1130 470 L ${s.x} ${s.y}`} color={GOLD} width={3} dash="3 10" delay={0.2 + i * 0.3} dur={0.8} /></Svg>
          <Badge x={s.x} y={s.y} name={s.icon} size={92} color={i === 0 ? CRIMSON : TEAL} delay={0.6 + i * 0.3} />
          <motion.div className="absolute" style={{ left: 1100, top: 440 }} initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: s.x - 1130, y: s.y - 470, opacity: [0, 1, 0] }} transition={{ duration: 1.6, delay: 1 + i * 0.3, ease }}>
            <ArText size={30} color={DEEP}>منين؟</ArText>
          </motion.div>
          {lines >= 2 && <Chip x={s.x} y={s.y + 58} color={TEAL} delay={0.4 + i * 0.25}>{s.city}</Chip>}
        </React.Fragment>
      ))}
    </>
  );
}

/** A knock, a covered plate, the cover lifts: إيه ده؟ */
export function Ea2NextGraphic({ lines }: GraphicProps) {
  const open = lines >= 2;
  return (
    <>
      <Building x={790} w={320} />
      <Street />
      <Person x={1180} y={GROUND} scale={1.05} color={ADAM} flip />
      {lines >= 1 && <Person x={1400} y={GROUND} scale={1.0} color={ELDER} hijab delay={0.2} />}
      {lines >= 1 && (
        <div className="absolute" style={{ left: 1250, top: 560 }}>
          <span className="absolute block rounded-full" style={{ left: 0, top: 30, width: 120, height: 16, background: '#E9DCC3', boxShadow: SHADOW }} />
          <motion.span className="absolute block" style={{ left: 14, top: -14, width: 92, height: 46, borderRadius: '50px 50px 6px 6px', background: 'linear-gradient(180deg, #D9C9A8, #B9A27A)' }}
            initial={false} animate={{ y: open ? -60 : 0, rotate: open ? -20 : 0, opacity: open ? 0.8 : 1 }} transition={{ duration: 0.8, ease }} />
          {open && <motion.span className="absolute block rounded-full" style={{ left: 30, top: 12, width: 60, height: 22, background: '#C9772E' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} />}
        </div>
      )}
      {open && <Say x={1180} y={540} id="eh-da" text="إيه ده؟" width={180} delay={0.6} accent />}
      {lines >= 3 && (
        <>
          <Chip x={1330} y={230} color={CRIMSON} delay={0.2}>ده · this (masculine)</Chip>
          <Chip x={1330} y={280} color={DEEP} delay={0.4}>دي · this (feminine)</Chip>
        </>
      )}
    </>
  );
}
