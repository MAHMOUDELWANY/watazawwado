import React from 'react';
import { motion } from 'motion/react';
import { ease, GOLD, CRIMSON, TEAL } from '../cinema/Cinema';
import { useReduce } from './Stage';
import { make, CountUp, Quote, BONE } from './g-se1';

/**
 * Seerah · Teens & Adults · Episodes 2 and 3, in the look of Episode 1 (g-se1.tsx): the owner's still fills the stage
 * (docs/curriculum/seerah/IMAGE-PROMPTS.md, folders teens-ep02 / teens-ep03), the Arabic key term in gold, the cards
 * one per build step. Motion only where it explains: the caravan line where the slowest donkey takes the lead; the
 * years of the desert childhood; the road north that stops at al-Abwa; the age to the day; the hands that held him,
 * one after another. The Prophet ﷺ and the companions are never shown.
 */

const E2 = 'seerah-teens/ep02';
const E3 = 'seerah-teens/ep03';
const DIM = 'rgba(246,241,232,0.35)';

/** The caravan on the way home: six riders on a line; the gold one (Halimah's donkey) starts last and moves to the front. */
function Race({ lines }: { lines: number }) {
  const reduce = useReduce();
  const xs = [820, 900, 980, 1060, 1140, 1220];
  const lead = lines >= 2;
  return (
    <svg className="pointer-events-none absolute inset-0" viewBox="0 0 1600 900" width="100%" height="100%">
      <motion.line x1={780} y1={330} x2={1460} y2={330} stroke={DIM} strokeWidth={3} strokeDasharray="4 12" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease }} />
      <text x={1470} y={338} fill={BONE} fontSize={18} fontWeight={700}>home ›</text>
      {xs.map((x, i) => (
        <motion.circle key={i} cx={0} cy={330} r={12} fill="rgba(246,241,232,0.55)" initial={{ x: x - 40, opacity: 0 }} animate={{ x: lead ? x - 60 : x, opacity: 1 }} transition={{ duration: reduce ? 0 : 1.6, delay: 0.2 + i * 0.06, ease }} />
      ))}
      <motion.g initial={{ x: 760, opacity: 0 }} animate={{ x: lead ? 1340 : 760, opacity: 1 }} transition={{ duration: reduce ? 0 : 2.2, delay: 0.4, ease }}>
        <circle cx={0} cy={330} r={18} fill={GOLD} style={{ filter: `drop-shadow(0 0 14px ${GOLD})` }} />
        <text x={0} y={296} fill={GOLD} fontSize={16} fontWeight={700} textAnchor="middle">{lead ? 'first' : 'last'}</text>
      </motion.g>
    </svg>
  );
}

/** A gold line of ages; each mark lights as its line is read. */
function Years({ marks, lines }: { marks: { age: string; label: string; at: number }[]; lines: number }) {
  const x0 = 800, x1 = 1460, y = 300;
  return (
    <svg className="pointer-events-none absolute inset-0" viewBox="0 0 1600 900" width="100%" height="100%">
      <motion.line x1={x0} y1={y} x2={x1} y2={y} stroke={`${GOLD}88`} strokeWidth={3} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease }} />
      {marks.map((m, i) => {
        const x = x0 + ((x1 - x0) * i) / Math.max(1, marks.length - 1);
        const on = lines >= m.at;
        return (
          <motion.g key={m.age} initial={{ opacity: 0 }} animate={{ opacity: on ? 1 : 0.3 }} transition={{ duration: 0.6 }}>
            <circle cx={x} cy={y} r={on ? 12 : 7} fill={on ? GOLD : DIM} />
            <text x={x} y={y - 26} fill={BONE} fontSize={30} fontFamily="var(--font-serif)" textAnchor="middle">{m.age}</text>
            <text x={x} y={y + 40} fill={on ? GOLD : DIM} fontSize={15} fontWeight={700} textAnchor="middle" style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>{m.label}</text>
          </motion.g>
        );
      })}
    </svg>
  );
}

/** The road north: Makkah to Yathrib (500 km); on the way back the line stops at al-Abwa. */
function Road({ back = false, lines }: { back?: boolean; lines: number }) {
  const mk = { x: 1300, y: 740 }, yt = { x: 1180, y: 370 }, ab = { x: 1215, y: 510 };
  return (
    <svg className="pointer-events-none absolute inset-0" viewBox="0 0 1600 900" width="100%" height="100%">
      <rect x={1060} y={330} width={360} height={460} rx={18} fill="rgba(12,8,6,0.55)" stroke={`${GOLD}44`} />
      <motion.path d={`M ${mk.x} ${mk.y} C 1330 630, 1150 480, ${yt.x} ${yt.y}`} fill="none" stroke={GOLD} strokeWidth={4} strokeLinecap="round" strokeDasharray={back ? '2 10' : undefined}
        initial={{ pathLength: back ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, ease }} />
      {back && lines >= 2 && (
        <motion.path d={`M ${yt.x} ${yt.y} C 1190 420, 1205 470, ${ab.x} ${ab.y}`} fill="none" stroke={CRIMSON} strokeWidth={5} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease }} />
      )}
      {[{ p: mk, t: 'Makkah' }, { p: yt, t: 'Yathrib' }].map(({ p, t }) => (
        <g key={t}><circle cx={p.x} cy={p.y} r={10} fill={BONE} /><text x={p.x + 18} y={p.y + 6} fill={BONE} fontSize={20} fontWeight={700}>{t}</text></g>
      ))}
      {back && lines >= 2 && (
        <motion.g initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2, type: 'spring', bounce: 0.3 }} style={{ transformBox: 'fill-box' as never, transformOrigin: '50% 50%' }}>
          <circle cx={ab.x} cy={ab.y} r={13} fill={CRIMSON} />
          <text x={ab.x - 22} y={ab.y + 7} fill={CRIMSON} fontSize={20} fontWeight={700} textAnchor="end">al-Abwa</text>
        </motion.g>
      )}
      {!back && lines >= 2 && <text x={1030} y={580} fill={GOLD} fontSize={52} fontFamily="var(--font-serif)" textAnchor="end">500 km</text>}
    </svg>
  );
}

/** The hands that held him: four lamps on a line, lit one after another; the last line draws one light over them all. */
function Chain({ lines }: { lines: number }) {
  const who = ['His mother', 'Halimah', 'His grandfather', 'His uncle'];
  const x0 = 830, gap = 200, y = 360;
  return (
    <svg className="pointer-events-none absolute inset-0" viewBox="0 0 1600 900" width="100%" height="100%">
      {who.map((w, i) => (
        <motion.g key={w} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.45, duration: 0.6, ease }}>
          {i > 0 && <motion.line x1={x0 + gap * (i - 1) + 22} y1={y} x2={x0 + gap * i - 22} y2={y} stroke={GOLD} strokeWidth={3} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 + i * 0.45, duration: 0.5 }} />}
          <circle cx={x0 + gap * i} cy={y} r={18} fill={GOLD} style={{ filter: `drop-shadow(0 0 12px ${GOLD})` }} />
          <text x={x0 + gap * i} y={y + 48} fill={BONE} fontSize={17} fontWeight={700} textAnchor="middle">{w}</text>
        </motion.g>
      ))}
      {lines >= 3 && (
        <motion.path d={`M ${x0} ${y - 40} Q ${x0 + gap * 1.5} ${y - 190} ${x0 + gap * 3} ${y - 40}`} fill="none" stroke={TEAL} strokeWidth={4} strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.4, ease }} />
      )}
      {lines >= 3 && <motion.text x={x0 + gap * 1.5} y={y - 130} fill={TEAL} fontSize={22} fontWeight={800} textAnchor="middle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>Allah, over every one of them</motion.text>}
    </svg>
  );
}

/* ---------- Episode 2 ---------- */
export const Se2CoverGraphic = make({ folder: E2, still: 'cover', term: 'مُرْضِعَةُ البَادِيَة' });
export const Se2CustomGraphic = make({ folder: E2, still: 'custom', term: 'الاِسْتِرْضَاعُ فِي البَادِيَة' });
export const Se2DroughtGraphic = make({ folder: E2, still: 'drought', term: 'سَنَةٌ شَهْبَاء', tint: CRIMSON });
export const Se2CaravanGraphic = make({ folder: E2, still: 'caravan', term: 'نِسَاءُ بَنِي سَعْد' });
export const Se2NightGraphic = make({ folder: E2, still: 'night-cry', term: 'لَيْلَةُ الجُوع' });
export const Se2PassedGraphic = make({ folder: E2, still: 'passed-by', term: 'يَتِيم', tint: CRIMSON });
export const Se2LanesGraphic = make({ folder: E2, still: 'lanes', term: 'أَزِقَّةُ مَكَّة' });
export const Se2DoorwayGraphic = make({ folder: E2, still: 'doorway', term: 'حَلِيمَةُ السَّعْدِيَّة' });
export const Se2HarithGraphic = make({
  folder: E2, still: 'harith', term: 'عَسَى اللهُ أَنْ يَجْعَلَ لَنَا فِيهِ بَرَكَة',
  extra: ({ lines }) => lines >= 1 && <Quote kicker="The words that turned a choice into trust" text="There is no harm in it. Perhaps Allah will bless us through him." by="Al-Harith to Halimah · her account, reported by Ibn Ishaq" />,
});
export const Se2MilkGraphic = make({ folder: E2, still: 'milk', term: 'البَرَكَة' });
export const Se2DonkeyGraphic = make({ folder: E2, still: 'donkey', term: 'الأَتَانُ القَمْرَاء', extra: ({ lines }) => <Race lines={lines} /> });
export const Se2GreenGraphic = make({ folder: E2, still: 'green', term: 'أَرْضٌ خَضْرَاء', tint: TEAL });
export const Se2SeedGraphic = make({ folder: E2, still: 'seed', term: 'سِرُّ البَرَكَة', tint: TEAL });
export const Se2HazeGraphic = make({
  folder: E2, still: 'haze', term: 'سَنَتَانِ وَأَكْثَر',
  extra: ({ lines }) => <Years lines={lines} marks={[{ age: '0', label: 'to the desert', at: 0 }, { age: '2', label: 'weaned', at: 1 }, { age: '4–5', label: 'still with Halimah', at: 3 }]} />,
});
export const Se2HillsGraphic = make({ folder: E2, still: 'hills', term: 'الشَّيْمَاء', tint: TEAL });
export const Se2BasinGraphic = make({ folder: E2, still: 'basin', term: 'شَقُّ الصَّدْر' });
export const Se2VesselGraphic = make({ folder: E2, still: 'vessel', term: 'طَهَارَةُ القَلْب', tint: TEAL });
export const Se2MissionGraphic = make({ folder: E2, still: 'lunch', term: 'زَادِي' });
export const Se2NextGraphic = make({ folder: E2, still: 'abwa-road', term: 'الطَّرِيقُ إِلَى يَثْرِب', tint: CRIMSON });

/* ---------- Episode 3 ---------- */
export const Se3CoverGraphic = make({ folder: E3, still: 'cover', term: 'ثَلَاثَةُ وَدَاعَات' });
export const Se3HomeGraphic = make({ folder: E3, still: 'sandals', term: 'آمِنَةُ بِنْتُ وَهْب' });
export const Se3JourneyGraphic = make({ folder: E3, still: 'journey', term: 'الرِّحْلَةُ إِلَى يَثْرِب', extra: ({ lines }) => <Road lines={lines} /> });
export const Se3PalmsGraphic = make({ folder: E3, still: 'palms', term: 'يَثْرِب', tint: TEAL });
export const Se3TentGraphic = make({ folder: E3, still: 'lone-tent', term: 'الأَبْوَاء', tint: CRIMSON, extra: ({ lines }) => <Road back lines={lines} /> });
export const Se3FootprintsGraphic = make({ folder: E3, still: 'footprints', term: 'يَتِيمُ الأَبَوَيْن', tint: CRIMSON });
export const Se3WayHomeGraphic = make({ folder: E3, still: 'way-home', term: 'عَبْدُ المُطَّلِب' });
export const Se3MattressGraphic = make({ folder: E3, still: 'mattress', term: 'فِرَاشُ عَبْدِ المُطَّلِب', tint: CRIMSON });
export const Se3WallGraphic = make({
  folder: E3, still: 'wall', term: 'دَعُوا ابْنِي',
  extra: ({ lines }) => lines >= 1 && <Quote kicker="The words of a grandfather" text="Leave my grandson. By Allah, this boy will have a great standing." by="Abdul-Muttalib to his sons · Ibn Hisham" />,
});
export const Se3StaffGraphic = make({
  folder: E3, still: 'staff', term: 'الوَدَاعُ الثَّانِي',
  extra: ({ lines }) => lines >= 2 && <CountUp to={8} x={110} y={300} label="years · 2 months · 10 days" />,
});
export const Se3ChainGraphic = make({ folder: E3, still: 'mourners', term: 'فَآوَى', tint: TEAL, extra: ({ lines }) => lines >= 1 && <Chain lines={lines} /> });
export const Se3UncleGraphic = make({
  folder: E3, still: 'uncle-house', term: 'أَبُو طَالِب',
  extra: ({ lines }) => lines >= 3 && <CountUp to={40} x={110} y={300} label="years of protection" />,
});
export const Se3CloudsGraphic = make({ folder: E3, still: 'clouds', term: 'الاِسْتِسْقَاء', tint: TEAL });
export const Se3RainGraphic = make({ folder: E3, still: 'rain', term: 'الغَيْث', tint: TEAL });
export const Se3DuhaGraphic = make({ folder: E3, still: 'duha', term: 'وَالضُّحَى' });
export const Se3GraveGraphic = make({ folder: E3, still: 'grave-visit', term: 'قَبْرُ أُمِّه' });
export const Se3ShoulderGraphic = make({ folder: E3, still: 'shoulder', term: 'لَسْتَ وَحْدَك', tint: TEAL });
export const Se3MissionGraphic = make({ folder: E3, still: 'bag', term: 'زَادِي' });
export const Se3NextGraphic = make({ folder: E3, still: 'north', term: 'إِلَى الشَّام' });
