import React from 'react';
import { motion } from 'motion/react';
import type { SceneId } from '../../types';
import type { Shot, Light } from '../DepthStill';
import { GlowPath, Node, CountUp, KineticTitle, ease, GOLD, BONE, CRIMSON, TEAL } from './Cinema';
import type { StageDef } from '../motion/Stage';
import { StrangerGraphic, IslamGraphic } from '../motion/graphics';
import { CoverGraphic, MadinahGraphic, HourGraphic, RevealGraphic } from '../motion/g-story';
import { KneesGraphic, IhsanPeopleGraphic, NextPeopleGraphic } from '../motion/g-people';
import { ImanGraphic, LevelsGraphic, GapGraphic, HorizonGraphic, KnowGraphic, SeeGraphic, InsideGraphic } from '../motion/g-levels';
import { KidsStrangerGraphic, KidsCastleGraphic } from '../motion/g-kids';
import { TeensStrangerGraphic, TeensOptionsGraphic, TeensBossesGraphic } from '../motion/g-teens';
import { A2CoverGraphic, A2RecallGraphic, A2QuestionGraphic, A2HawkingGraphic, A2CauseGraphic, A2BeganGraphic, A2ThreeGraphic, A2NothingGraphic, A2ItselfGraphic, A2TurGraphic, A2JubayrGraphic, A2YaqeenGraphic, A2BackGraphic, A2HowGraphic, A2FirstGraphic, A2OrderGraphic, A2SignsGraphic, A2NowGraphic, A2CaseGraphic, A2Case2Graphic, A2Case3Graphic, A2Case4Graphic, A2NotebookGraphic, A2NextGraphic } from '../motion/g-a2';
import { A3CoverGraphic, A3RecallGraphic, A3QuestionGraphic, A3BradyGraphic, A3CarreyGraphic, A3HungerGraphic, A3FitrahGraphic, A3BornGraphic, A3NoiseGraphic, A3SeaGraphic, A3IkrimahGraphic, A3FeelGraphic, A3DankGraphic, A3GhinaGraphic, A3RestGraphic, A3NightGraphic, A3TwoGraphic, A3CaseGraphic, A3Case2Graphic, A3Case3Graphic, A3Case4Graphic, A3NotebookGraphic, A3NextGraphic } from '../motion/g-a3';
import { LookAMeetGraphic, LookAWordGraphic, LookBMeetGraphic, LookBWordGraphic, LookCMeetGraphic, LookCWordGraphic } from '../motion/g-literacy-looks';
import { LbCoverGraphic, LbStuckGraphic, LbGuessGraphic, LbBestGraphic, LbMapGraphic, LbCircleGraphic, LbHelpersGraphic, LbUthmanGraphic, LbSpotGraphic, LbAlongGraphic, LbMissionGraphic, LbNextGraphic } from '../motion/g-lb1';
import { La1CoverGraphic, La1NoteGraphic, La1GuessGraphic, La1AlifGraphic, La1BaaGraphic, La1TaaGraphic, La1ThaaGraphic, La1TrickGraphic, La1FindGraphic, La1WordGraphic, La1MissionGraphic, La1NextGraphic } from '../motion/g-la1';
import { Fk1CoverGraphic, Fk1GameGraphic, Fk1StoryGraphic, Fk1HaadhaGraphic, Fk1MaaGraphic, Fk1ManGraphic, Fk1WordsGraphic, Fk1SpotGraphic, Fk1TalkGraphic, Fk1MissionGraphic, Fk1NextGraphic } from '../motion/g-fk1';
import { Se1CoverGraphic, Se1EmpiresGraphic, Se1JahiliyyahGraphic, Se1MakkahGraphic, Se1AbrahaGraphic, Se1QullaysGraphic, Se1ScalesGraphic, Se1MarchGraphic, Se1CampGraphic, Se1WalkGraphic, Se1TentGraphic, Se1TrustGraphic, Se1KneelGraphic, Se1SpearGraphic, Se1BirdsGraphic, Se1FilGraphic, Se1AftermathGraphic, Se1CradleGraphic, Se1MissionGraphic, Se1NextGraphic } from '../motion/g-se1';
import { LaneGraphic, MondayGraphic, GravesGraphic, CountGraphic, CaseOmarGraphic, CaseLaylaGraphic, CaseColleagueGraphic, CaseOnlineGraphic, NotebookGraphic } from '../motion/g-life';

/**
 * Per-page direction for the Adults cinema pages: which still fills the screen, where the light comes from, the
 * camera and focus for each build step (x, y = where it looks in % of the photo; z = zoom; focus 0 far … 1 near;
 * pan = sideways parallax), and the motion graphics drawn over it. Shot n is used when n build steps are showing.
 */
export type Scene = {
  still: string;
  light?: Light;
  grade?: 'then' | 'now';
  shots: Shot[];
  /** Motion graphics on top of the photo, by build step (k) and item count. */
  overlay?: (s: { k: number; items: number; labels: string[] }) => React.ReactNode;
  /** Where the photo's subject sits, so the text keeps to the other side. */
  textSide?: 'left' | 'right';
  /** A designed motion stage instead of the photo (owner, 2026-10-24): the graphic explains the page step by step. */
  stage?: StageDef;
};

/* ---------- motion-graphic overlays ---------- */

/** Islam: a gold line along the floor; each column's foot ignites with its pillar (positions from the depth map). */
const FEET = [{ x: 618, y: 636 }, { x: 736, y: 664 }, { x: 896, y: 692 }, { x: 1112, y: 722 }, { x: 1466, y: 836 }];
const FLOOR = `M 480 620 C ${FEET[0].x} 620, ${FEET[0].x + 60} 640, ${FEET[1].x} 664 S ${FEET[2].x - 70} 684, ${FEET[2].x} 692 S ${FEET[3].x - 110} 712, ${FEET[3].x} 722 S ${FEET[4].x - 180} 800, ${FEET[4].x} 836`;
const PILLARS = [['الشهادتان', 'The two testimonies'], ['الصلاة', 'Salah'], ['الزكاة', 'Zakah'], ['الصوم', 'Fasting Ramadan'], ['الحج', 'Hajj']];
function PillarsOverlay({ items }: { items: number }) {
  if (items === 0) return null;
  const cur = Math.min(items, 5) - 1;
  return (
    <>
      <GlowPath d={FLOOR} progress={items / 5} />
      {FEET.map((f, i) => <Node key={i} x={f.x} y={f.y} on={i <= cur} current={i === cur} ar={PILLARS[i][0]} en={PILLARS[i][1]} />)}
      <Count n={items} of={5} label="pillars" />
    </>
  );
}

/** A big count in the corner: "3 of 6". */
function Count({ n, of, label }: { n: number; of: number; label: string }) {
  return (
    <motion.div className="absolute flex items-baseline gap-3" style={{ right: 300, top: 64 }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <CountUp to={n} size={92} />
      <span className="font-sans font-semibold" style={{ fontSize: 22, color: 'rgba(246,241,232,0.75)' }}>of {of} {label}</span>
    </motion.div>
  );
}

/** A constellation: each item is a star that lights up and joins the ones before with a thin line (Iman: the unseen). */
const SKY = [{ x: 1000, y: 250 }, { x: 1150, y: 190 }, { x: 1290, y: 260 }, { x: 1240, y: 400 }, { x: 1090, y: 430 }, { x: 1170, y: 320 }];
function ConstellationOverlay({ items, labels }: { items: number; labels: string[] }) {
  if (items === 0) return null;
  const d = SKY.slice(0, items).map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  return (
    <>
      {items > 1 && <GlowPath d={d} progress={1} color="#F6E3B8" width={1.5} />}
      {SKY.slice(0, items).map((p, i) => (
        <motion.div key={i} className="absolute" style={{ left: p.x, top: p.y }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7, ease }}>
          <span className="absolute rounded-full" style={{ left: -7, top: -7, width: 14, height: 14, background: '#FFF4D6', boxShadow: '0 0 22px 8px rgba(255,226,160,0.75)' }} />
          <span className="absolute whitespace-nowrap font-sans font-semibold" style={{ left: 16, top: -12, fontSize: i === items - 1 ? 26 : 18, color: i === items - 1 ? BONE : 'rgba(246,241,232,0.65)', textShadow: '0 2px 14px rgba(0,0,0,0.8)', transition: 'font-size 0.5s' }}>{labels[i]?.split(':')[0]}</span>
        </motion.div>
      ))}
      <Count n={items} of={6} label="pillars of Iman" />
    </>
  );
}

/** A path of steps: each item is a stage on a rising line, lit in turn (levels, the gap, the course road). */
function StepsOverlay({ items, labels, total, origin = { x: 980, y: 720 }, step = { x: 150, y: -150 } }: { items: number; labels: string[]; total: number; origin?: { x: number; y: number }; step?: { x: number; y: number } }) {
  if (items === 0) return null;
  const pts = Array.from({ length: total }, (_, i) => ({ x: origin.x + step.x * i, y: origin.y + step.y * i }));
  const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  return (
    <>
      <GlowPath d={d} progress={(items - 1) / Math.max(1, total - 1)} />
      {pts.map((p, i) => {
        const [word, hint] = (labels[i] || '').split(':').map((s) => s.trim());
        return (
            <React.Fragment key={i}>
              <Node x={p.x} y={p.y} on={i < items} current={i === items - 1} ar="" en="" />
              {i < items && (
                <motion.div className="absolute" style={{ left: p.x + 26, top: p.y - 30, width: 300 }} initial={{ opacity: 0, x: -12 }} animate={{ opacity: i === items - 1 ? 1 : 0.55, x: 0 }} transition={{ duration: 0.6, ease }}>
                  <span className="block font-serif" style={{ fontSize: i === items - 1 ? 40 : 28, color: BONE, lineHeight: 1.05, transition: 'font-size 0.5s' }}>{word}</span>
                  {hint && <span className="block font-sans font-semibold" style={{ fontSize: 18, color: GOLD }}>{hint}</span>}
                </motion.div>
              )}
            </React.Fragment>
          );
      })}
    </>
  );
}

/** The wow: "From hearing to seeing". The two phrases rise huge in Arabic, one under the other, as the camera pushes in. */
function WowOverlay({ items, k }: { items: number; k: number }) {
  return (
    <>
      {items === 0 && k > 0 && <motion.p className="absolute m-0 font-serif italic" style={{ left: 0, right: 0, top: 380, textAlign: 'center', fontSize: 64, color: BONE }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>You heard it.</motion.p>}
      {items >= 1 && <ArabicHero text="كَأنَّك تَراه" sub="as if you see Him" top={250} />}
      {items >= 2 && <ArabicHero text="كَأنَّا رَأيُ عَينٍ" sub="as if we saw it with our own eyes" top={470} delay={0.3} />}
    </>
  );
}

function ArabicHero({ text, sub, top, delay = 0 }: { text: string; sub: string; top: number; delay?: number }) {
  return (
    <motion.div className="absolute text-center" style={{ left: 0, right: 0, top }} initial={{ opacity: 0, scale: 1.25, filter: 'blur(16px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} transition={{ duration: 1.3, delay, ease }}>
      <span lang="ar" dir="rtl" className="block font-bold" style={{ fontFamily: 'var(--font-display-ar)', fontSize: 120, lineHeight: 1.2, backgroundImage: `linear-gradient(100deg, ${CRIMSON}, #E07B3C 35%, ${GOLD} 60%, ${TEAL})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 6px 30px rgba(0,0,0,0.55))' }}>{text}</span>
      <span className="block font-serif italic" style={{ fontSize: 30, color: BONE }}>{sub}</span>
    </motion.div>
  );
}

/** The next-time question, huge, word by word over the night sky. */
function NextOverlay({ k }: { k: number }) {
  return k >= 3 ? <div className="absolute" style={{ left: 760, top: 300, width: 760 }}><KineticTitle text="Is there a Maker at all?" size={92} /></div> : null;
}

/** A Kids or Teens page drawn only as a motion stage (no photo behind it). */
const onStage = (stage: StageDef): Scene => ({ stage, still: '', shots: [] });

/* ---------- the direction for every Adults Lesson 1 page ---------- */

export const SCENES: Partial<Record<SceneId, Scene>> = {
  // Literacy A · Kids · Lesson 1 (look A, letter friends)
  la1Cover: onStage({ tone: 'light', Graphic: La1CoverGraphic }), la1Note: onStage({ tone: 'light', Graphic: La1NoteGraphic }),
  la1Guess: onStage({ tone: 'light', Graphic: La1GuessGraphic, keepOnAsk: true }), la1Alif: onStage({ tone: 'light', Graphic: La1AlifGraphic }),
  la1Baa: onStage({ tone: 'light', Graphic: La1BaaGraphic }), la1Taa: onStage({ tone: 'light', Graphic: La1TaaGraphic }),
  la1Thaa: onStage({ tone: 'light', Graphic: La1ThaaGraphic }), la1Trick: onStage({ tone: 'light', Graphic: La1TrickGraphic }),
  la1Find: onStage({ tone: 'light', Graphic: La1FindGraphic }), la1Word: onStage({ tone: 'light', Graphic: La1WordGraphic }),
  la1Mission: onStage({ tone: 'light', Graphic: La1MissionGraphic }), la1Next: onStage({ tone: 'light', Graphic: La1NextGraphic }),
  // Fusha · Kids · Lesson 1
  fk1Cover: onStage({ tone: 'light', Graphic: Fk1CoverGraphic }), fk1Game: onStage({ tone: 'light', Graphic: Fk1GameGraphic }),
  fk1Story: onStage({ tone: 'light', Graphic: Fk1StoryGraphic }), fk1Haadha: onStage({ tone: 'light', Graphic: Fk1HaadhaGraphic }),
  fk1Maa: onStage({ tone: 'light', Graphic: Fk1MaaGraphic }), fk1Man: onStage({ tone: 'light', Graphic: Fk1ManGraphic }),
  fk1Words: onStage({ tone: 'light', Graphic: Fk1WordsGraphic }), fk1Spot: onStage({ tone: 'light', Graphic: Fk1SpotGraphic }),
  fk1Talk: onStage({ tone: 'light', Graphic: Fk1TalkGraphic, keepOnAsk: true }), fk1Mission: onStage({ tone: 'light', Graphic: Fk1MissionGraphic }),
  fk1Next: onStage({ tone: 'light', Graphic: Fk1NextGraphic }),
  // Seerah · Teens & Adults · Episode 1 (the owner's stills, dark stage)
  se1Cover: onStage({ tone: 'dark', Graphic: Se1CoverGraphic }),
  se1Empires: onStage({ tone: 'dark', Graphic: Se1EmpiresGraphic }),
  se1Jahiliyyah: onStage({ tone: 'dark', Graphic: Se1JahiliyyahGraphic }),
  se1Makkah: onStage({ tone: 'dark', Graphic: Se1MakkahGraphic }),
  se1Abraha: onStage({ tone: 'dark', Graphic: Se1AbrahaGraphic }),
  se1Qullays: onStage({ tone: 'dark', Graphic: Se1QullaysGraphic }),
  se1Scales: onStage({ tone: 'dark', Graphic: Se1ScalesGraphic, keepOnAsk: true }),
  se1March: onStage({ tone: 'dark', Graphic: Se1MarchGraphic }),
  se1Camp: onStage({ tone: 'dark', Graphic: Se1CampGraphic }),
  se1Walk: onStage({ tone: 'dark', Graphic: Se1WalkGraphic }),
  se1Tent: onStage({ tone: 'dark', Graphic: Se1TentGraphic }),
  se1Trust: onStage({ tone: 'dark', Graphic: Se1TrustGraphic }),
  se1Kneel: onStage({ tone: 'dark', Graphic: Se1KneelGraphic }),
  se1Spear: onStage({ tone: 'dark', Graphic: Se1SpearGraphic, keepOnAsk: true }),
  se1Birds: onStage({ tone: 'dark', Graphic: Se1BirdsGraphic }),
  se1Fil: onStage({ tone: 'dark', Graphic: Se1FilGraphic }),
  se1Aftermath: onStage({ tone: 'dark', Graphic: Se1AftermathGraphic }),
  se1Cradle: onStage({ tone: 'dark', Graphic: Se1CradleGraphic }),
  se1Mission: onStage({ tone: 'dark', Graphic: Se1MissionGraphic }),
  se1Next: onStage({ tone: 'dark', Graphic: Se1NextGraphic }),
  // Literacy B · Lesson 1
  lbCover: onStage({ tone: 'light', Graphic: LbCoverGraphic }), lbStuck: onStage({ tone: 'light', Graphic: LbStuckGraphic }),
  lbGuess: onStage({ tone: 'light', Graphic: LbGuessGraphic, keepOnAsk: true }), lbBest: onStage({ tone: 'light', Graphic: LbBestGraphic, marks: ['learn the Quran', 'teach it'] }),
  lbMap: onStage({ tone: 'light', Graphic: LbMapGraphic }), lbCircle: onStage({ tone: 'light', Graphic: LbCircleGraphic }),
  lbHelpers: onStage({ tone: 'light', Graphic: LbHelpersGraphic }), lbUthman: onStage({ tone: 'light', Graphic: LbUthmanGraphic }),
  lbSpot: onStage({ tone: 'light', Graphic: LbSpotGraphic }), lbAlong: onStage({ tone: 'light', Graphic: LbAlongGraphic, keepOnAsk: true }),
  lbMission: onStage({ tone: 'light', Graphic: LbMissionGraphic }), lbNext: onStage({ tone: 'light', Graphic: LbNextGraphic }),
  // Literacy look options (plan Task 3)
  lkA1: onStage({ tone: 'light', Graphic: LookAMeetGraphic }), lkA2: onStage({ tone: 'light', Graphic: LookAWordGraphic }),
  lkB1: onStage({ tone: 'light', Graphic: LookBMeetGraphic }), lkB2: onStage({ tone: 'light', Graphic: LookBWordGraphic }),
  lkC1: onStage({ tone: 'dark', Graphic: LookCMeetGraphic }), lkC2: onStage({ tone: 'dark', Graphic: LookCWordGraphic }),
  a1Cover: {
    stage: { tone: 'dark', Graphic: CoverGraphic }, still: 'cover', light: { x: 82, y: 5, strength: 0.8 }, shots: [{ x: 58, y: 50, z: 1.12, focus: 0.5, pan: -0.5 }] },
  a1Madinah: {
    stage: { tone: 'light', Graphic: MadinahGraphic, marks: ['very white clothes', 'very black hair'] }, still: 'madinah', light: { x: 80, y: 8, strength: 0.6 }, shots: [{ x: 50, y: 55, z: 1.1, focus: 0.5, pan: -0.4 }, { x: 55, y: 50, z: 1.02, focus: 0.35, pan: 0 }, { x: 62, y: 56, z: 1.15, focus: 0.6, pan: 0.3 }, { x: 60, y: 52, z: 1.2, focus: 0.5, pan: 0.2 }] },
  a1Stranger: {
    stage: { tone: 'light', Graphic: StrangerGraphic, marks: ['No sign of travel', 'none of us knew him'], keepOnAsk: true }, still: 'stranger', textSide: 'left', shots: [{ x: 50, y: 55, z: 1.05, focus: 0.3, pan: -0.3 }, { x: 54, y: 52, z: 1.35, focus: 0.2, pan: 0 }, { x: 54, y: 50, z: 1.6, focus: 0.2, pan: 0.2 }] },
  a1Cushions: {
    stage: { tone: 'light', Graphic: KneesGraphic, marks: ['rested his knees against his knees', 'placed his palms on his thighs'] }, still: 'cushions', light: { x: 50, y: 4, strength: 0.8 }, shots: [{ x: 50, y: 60, z: 1.05, focus: 0.7, pan: -0.3 }, { x: 50, y: 66, z: 1.3, focus: 0.85, pan: 0 }, { x: 52, y: 64, z: 1.45, focus: 0.85, pan: 0.2 }, { x: 55, y: 55, z: 1.2, focus: 0.7, pan: 0.1 }] },
  a1Pillars: {
    stage: { tone: 'light', Graphic: IslamGraphic, keepOnAsk: true }, still: 'pillars', light: { x: 62, y: -8, strength: 0.75 }, shots: [{ x: 50, y: 50, z: 1.12, focus: 0.5, pan: -0.6 }, { x: 50, y: 50, z: 1, focus: 0.3 }], overlay: ({ items }) => <PillarsOverlay items={items} /> },
  a1Six: {
    stage: { tone: 'light', Graphic: ImanGraphic }, still: 'window', grade: 'now', light: { x: 91, y: 57, strength: 0.45 }, shots: [{ x: 50, y: 55, z: 1.05, focus: 0.6, pan: -0.4 }, { x: 40, y: 72, z: 1.25, focus: 0.88, pan: -0.3 }, { x: 60, y: 45, z: 1.1, focus: 0.3, pan: 0.1 }, { x: 62, y: 40, z: 1.15, focus: 0.1, pan: 0.2 }], overlay: ({ items, labels }) => <ConstellationOverlay items={items} labels={labels} /> },
  a1Ihsan: {
    stage: { tone: 'dark', Graphic: IhsanPeopleGraphic, marks: ['see'] }, still: 'prayer', grade: 'now', light: { x: 87, y: 12, strength: 0.9 }, shots: [{ x: 50, y: 50, z: 1.05, focus: 0.3, pan: -0.5 }, { x: 52, y: 46, z: 1.25, focus: 0.58, pan: 0 }, { x: 56, y: 62, z: 1.4, focus: 0.62, pan: 0.3 }, { x: 54, y: 44, z: 1.15, focus: 0.45, pan: 0.1 }] },
  a1Hour: {
    stage: { tone: 'dark', Graphic: HourGraphic, keepOnAsk: true }, still: 'hourglass', light: { x: 81, y: 27, strength: 1 }, shots: [{ x: 55, y: 50, z: 1.05, focus: 0.4, pan: 0.5 }, { x: 34, y: 46, z: 1.35, focus: 0.92, pan: -0.3 }, { x: 34, y: 58, z: 1.6, focus: 0.92, pan: -0.2 }, { x: 74, y: 40, z: 1.25, focus: 0.1, pan: 0.4 }] },
  a1Reveal: {
    stage: { tone: 'light', Graphic: RevealGraphic, marks: ['Jibril'] }, still: 'doorway', light: { x: 55, y: 42, strength: 1 }, shots: [{ x: 50, y: 50, z: 1.05, focus: 0.55, pan: -0.4 }, { x: 56, y: 55, z: 1.3, focus: 0.2, pan: 0 }, { x: 60, y: 80, z: 1.55, focus: 0.45, pan: 0.2 }, { x: 56, y: 48, z: 1.15, focus: 0.15, pan: 0.1 }] },
  a1Levels: {
    stage: { tone: 'light', Graphic: LevelsGraphic, keepOnAsk: true }, still: 'above', light: { x: 18, y: 8, strength: 0.3 }, shots: [{ x: 50, y: 50, z: 1.05, focus: 0.75 }, { x: 46, y: 50, z: 1.15, focus: 0.8, pan: -0.3 }, { x: 46, y: 46, z: 1.3, focus: 0.85 }, { x: 46, y: 42, z: 1.55, focus: 0.92, pan: 0.3 }], overlay: ({ items, labels }) => <StepsOverlay items={items} labels={labels} total={3} origin={{ x: 1000, y: 540 }} step={{ x: 120, y: -140 }} /> },
  a1Gap: {
    stage: { tone: 'light', Graphic: GapGraphic }, still: 'shelf', grade: 'now', light: { x: 84, y: 24, strength: 0.6 }, shots: [{ x: 50, y: 50, z: 1.05, focus: 0.5, pan: -0.3 }, { x: 68, y: 38, z: 1.3, focus: 0.55, pan: 0.2 }, { x: 64, y: 62, z: 1.35, focus: 0.76, pan: 0.3 }, { x: 44, y: 56, z: 1.15, focus: 0.84, pan: -0.4 }], overlay: ({ items, labels }) => <StepsOverlay items={items} labels={labels} total={3} origin={{ x: 1000, y: 470 }} step={{ x: 150, y: -115 }} /> },
  a1Horizon: {
    stage: { tone: 'dark', Graphic: HorizonGraphic }, still: 'horizon', light: { x: 50, y: 55, strength: 1 }, shots: [{ x: 50, y: 55, z: 1.05, focus: 0.5 }, { x: 50, y: 55, z: 1.2, focus: 0.3 }, { x: 50, y: 55, z: 1.6, focus: 0.15 }], overlay: ({ items, k }) => <WowOverlay items={items} k={k} /> },
  a1Lane: {
    stage: { tone: 'dark', Graphic: LaneGraphic, marks: ['an hour and an hour'] }, still: 'lane', light: { x: 50, y: 60, strength: 0.7 }, shots: [{ x: 50, y: 55, z: 1.05, focus: 0.5, pan: -0.3 }, { x: 50, y: 55, z: 1.15, focus: 0.4 }, { x: 52, y: 58, z: 1.25, focus: 0.3, pan: 0.2 }, { x: 50, y: 60, z: 1.4, focus: 0.2, pan: 0.2 }, { x: 50, y: 55, z: 1.15, focus: 0.4 }] },
  a1Monday: {
    stage: { tone: 'light', Graphic: MondayGraphic }, still: 'monday', grade: 'now', shots: [{ x: 50, y: 55, z: 1.05, focus: 0.6, pan: -0.3 }, { x: 60, y: 50, z: 1.25, focus: 0.7, pan: 0.1 }, { x: 64, y: 48, z: 1.35, focus: 0.75, pan: 0.2 }, { x: 40, y: 75, z: 1.3, focus: 0.9, pan: -0.2 }] },
  a1Graves: {
    stage: { tone: 'light', Graphic: GravesGraphic, marks: ['Competing for more', 'visit the graves'] }, still: 'graves', light: { x: 85, y: 30, strength: 0.6 }, shots: [{ x: 50, y: 45, z: 1.05, focus: 0.5, pan: -0.3 }, { x: 60, y: 58, z: 1.3, focus: 0.6, pan: 0.2 }, { x: 45, y: 68, z: 1.45, focus: 0.8, pan: -0.1 }, { x: 50, y: 50, z: 1.1, focus: 0.4 }] },
  a1Count: {
    stage: { tone: 'light', Graphic: CountGraphic, marks: ['what you ate and used up', 'what you wore and wore out', 'what you gave in charity and sent ahead'] }, still: 'purse', light: { x: 20, y: 10, strength: 0.4 }, shots: [{ x: 60, y: 60, z: 1.05, focus: 0.7, pan: -0.3 }, { x: 68, y: 62, z: 1.35, focus: 0.86, pan: -0.1 }, { x: 80, y: 45, z: 1.3, focus: 0.8, pan: 0.2 }, { x: 74, y: 74, z: 1.45, focus: 0.95, pan: 0.3 }] },
  a1Know: {
    stage: { tone: 'light', Graphic: KnowGraphic, marks: ['the knowledge of certainty'] }, still: 'listening', grade: 'now', light: { x: 63, y: 24, strength: 0.6 }, shots: [{ x: 50, y: 50, z: 1.05, focus: 0.9, pan: -0.3 }, { x: 44, y: 60, z: 1.25, focus: 0.95, pan: -0.2 }, { x: 62, y: 36, z: 1.4, focus: 0.15, pan: 0.3 }] },
  a1See: {
    stage: { tone: 'dark', Graphic: SeeGraphic, marks: ['the eye of certainty'] }, still: 'train', grade: 'now', light: { x: 93, y: 37, strength: 1 }, shots: [{ x: 40, y: 50, z: 1.05, focus: 0.9, pan: -0.5 }, { x: 62, y: 52, z: 1.25, focus: 0.15, pan: 0.2 }, { x: 78, y: 46, z: 1.45, focus: 0.08, pan: 0.4 }, { x: 66, y: 50, z: 1.2, focus: 0.1, pan: 0.1 }] },
  a1Inside: {
    stage: { tone: 'light', Graphic: InsideGraphic }, still: 'road', light: { x: 31, y: 31, strength: 0.9 }, shots: [{ x: 50, y: 60, z: 1.05, focus: 0.85, pan: -0.3 }, { x: 50, y: 62, z: 1.12, focus: 0.75 }, { x: 52, y: 55, z: 1.25, focus: 0.5 }, { x: 56, y: 50, z: 1.45, focus: 0.3, pan: 0.2 }, { x: 58, y: 46, z: 1.65, focus: 0.15, pan: 0.3 }], overlay: ({ items, labels }) => <StepsOverlay items={items} labels={labels} total={4} origin={{ x: 900, y: 720 }} step={{ x: 150, y: -120 }} /> },
  a1Case: {
    stage: { tone: 'light', Graphic: CaseOmarGraphic, keepOnAsk: true }, still: 'canteen', grade: 'now', shots: [{ x: 60, y: 60, z: 1.05, focus: 0.9, pan: 0.3 }, { x: 80, y: 64, z: 1.25, focus: 0.92, pan: 0.3 }, { x: 50, y: 42, z: 1.3, focus: 0.35, pan: -0.3 }] },
  a1Case2: {
    stage: { tone: 'light', Graphic: CaseLaylaGraphic }, still: 'suitcase', grade: 'now', light: { x: 78, y: 22, strength: 0.4 }, shots: [{ x: 50, y: 55, z: 1.05, focus: 0.8, pan: -0.3 }, { x: 34, y: 72, z: 1.3, focus: 0.9, pan: -0.3 }, { x: 74, y: 28, z: 1.35, focus: 0.1, pan: 0.3 }] },
  a1Case3: {
    stage: { tone: 'light', Graphic: CaseColleagueGraphic, keepOnAsk: true }, still: 'corridor', grade: 'now', light: { x: 92, y: 20, strength: 0.5 }, shots: [{ x: 50, y: 50, z: 1.05, focus: 0.4, pan: 0.3 }, { x: 72, y: 40, z: 1.3, focus: 0.15, pan: 0.3 }, { x: 30, y: 74, z: 1.35, focus: 0.75, pan: -0.2 }] },
  a1Case4: {
    stage: { tone: 'light', Graphic: CaseOnlineGraphic, keepOnAsk: true }, still: 'phone', grade: 'now', light: { x: 63, y: 30, strength: 0.6 }, shots: [{ x: 50, y: 55, z: 1.05, focus: 0.8, pan: -0.3 }, { x: 58, y: 66, z: 1.4, focus: 0.95, pan: 0.2 }, { x: 60, y: 42, z: 1.25, focus: 0.4, pan: 0.3 }, { x: 56, y: 60, z: 1.2, focus: 0.9 }] },
  a1Notebook: {
    stage: { tone: 'light', Graphic: NotebookGraphic }, still: 'notebook', light: { x: 85, y: 12, strength: 0.7 }, shots: [{ x: 70, y: 35, z: 1.05, focus: 0.15, pan: 0.3 }, { x: 62, y: 62, z: 1.2, focus: 0.7 }, { x: 58, y: 70, z: 1.35, focus: 0.9, pan: -0.2 }] },
  a1Next: {
    stage: { tone: 'dark', Graphic: NextPeopleGraphic }, still: 'night', shots: [{ x: 50, y: 50, z: 1.05, focus: 0.2, pan: -0.3 }, { x: 45, y: 45, z: 1.2, focus: 0.1, pan: 0 }, { x: 40, y: 40, z: 1.35, focus: 0.05, pan: 0.2 }], overlay: ({ k }) => <NextOverlay k={k} /> },

  /* Adults Lesson 2 (2026-10-25): every page a motion stage, no stills */
  a2Cover: onStage({ tone: 'dark', Graphic: A2CoverGraphic }),
  a2Recall: onStage({ tone: 'light', Graphic: A2RecallGraphic }),
  a2Question: onStage({ tone: 'light', Graphic: A2QuestionGraphic }),
  a2Hawking: onStage({ tone: 'light', Graphic: A2HawkingGraphic }),
  a2Cause: onStage({ tone: 'light', Graphic: A2CauseGraphic }),
  a2Began: onStage({ tone: 'dark', Graphic: A2BeganGraphic }),
  a2Three: onStage({ tone: 'light', Graphic: A2ThreeGraphic }),
  a2Nothing: onStage({ tone: 'light', Graphic: A2NothingGraphic }),
  a2Itself: onStage({ tone: 'light', Graphic: A2ItselfGraphic }),
  a2Tur: onStage({ tone: 'light', Graphic: A2TurGraphic, marks: ['from nothing', 'the creators'] }),
  a2Jubayr: onStage({ tone: 'dark', Graphic: A2JubayrGraphic, marks: ['my heart almost flew'] }),
  a2Yaqeen: onStage({ tone: 'light', Graphic: A2YaqeenGraphic, marks: ['no certainty'] }),
  a2Back: onStage({ tone: 'light', Graphic: A2BackGraphic }),
  a2How: onStage({ tone: 'light', Graphic: A2HowGraphic }),
  a2First: onStage({ tone: 'light', Graphic: A2FirstGraphic, marks: ['the First'] }),
  a2Order: onStage({ tone: 'dark', Graphic: A2OrderGraphic }),
  a2Signs: onStage({ tone: 'dark', Graphic: A2SignsGraphic, marks: ['on the horizons', 'within themselves'] }),
  a2Now: onStage({ tone: 'dark', Graphic: A2NowGraphic }),
  a2Case: onStage({ tone: 'light', Graphic: A2CaseGraphic }),
  a2Case2: onStage({ tone: 'light', Graphic: A2Case2Graphic }),
  a2Case3: onStage({ tone: 'light', Graphic: A2Case3Graphic }),
  a2Case4: onStage({ tone: 'light', Graphic: A2Case4Graphic }),
  a2Notebook: onStage({ tone: 'light', Graphic: A2NotebookGraphic }),
  a2Next: onStage({ tone: 'dark', Graphic: A2NextGraphic }),

  /* Adults Lesson 3 (2026-10-25) */
  a3Cover: onStage({ tone: 'dark', Graphic: A3CoverGraphic }),
  a3Recall: onStage({ tone: 'light', Graphic: A3RecallGraphic }),
  a3Question: onStage({ tone: 'light', Graphic: A3QuestionGraphic }),
  a3Brady: onStage({ tone: 'light', Graphic: A3BradyGraphic }),
  a3Carrey: onStage({ tone: 'light', Graphic: A3CarreyGraphic }),
  a3Hunger: onStage({ tone: 'light', Graphic: A3HungerGraphic }),
  a3Fitrah: onStage({ tone: 'light', Graphic: A3FitrahGraphic, marks: ['the natural way of Allah', 'no altering'] }),
  a3Born: onStage({ tone: 'light', Graphic: A3BornGraphic, marks: ['on the fitrah'] }),
  a3Noise: onStage({ tone: 'light', Graphic: A3NoiseGraphic }),
  a3Sea: onStage({ tone: 'dark', Graphic: A3SeaGraphic, marks: ['making their worship purely His'] }),
  a3Ikrimah: onStage({ tone: 'dark', Graphic: A3IkrimahGraphic, marks: ['nothing else will save me on land'] }),
  a3Feel: onStage({ tone: 'light', Graphic: A3FeelGraphic }),
  a3Dank: onStage({ tone: 'light', Graphic: A3DankGraphic, marks: ['a cramped life', 'turns away from My remembrance'] }),
  a3Ghina: onStage({ tone: 'light', Graphic: A3GhinaGraphic, marks: ['the richness of the soul'] }),
  a3Rest: onStage({ tone: 'dark', Graphic: A3RestGraphic, marks: ['hearts find rest'] }),
  a3Night: onStage({ tone: 'dark', Graphic: A3NightGraphic }),
  a3Two: onStage({ tone: 'light', Graphic: A3TwoGraphic }),
  a3Case: onStage({ tone: 'light', Graphic: A3CaseGraphic }),
  a3Case2: onStage({ tone: 'light', Graphic: A3Case2Graphic }),
  a3Case3: onStage({ tone: 'light', Graphic: A3Case3Graphic }),
  a3Case4: onStage({ tone: 'light', Graphic: A3Case4Graphic }),
  a3Notebook: onStage({ tone: 'light', Graphic: A3NotebookGraphic }),
  a3Next: onStage({ tone: 'dark', Graphic: A3NextGraphic }),

  /* Kids and Teens motion stages (2026-10-24; prototype pages for the owner) */
  stranger: onStage({ tone: 'light', Graphic: KidsStrangerGraphic, marks: ['dust from a journey', 'none of us knew him'] }),
  castleClues: onStage({ tone: 'light', Graphic: KidsCastleGraphic }),
  tStranger: onStage({ tone: 'light', Graphic: TeensStrangerGraphic, marks: ['no sign of travel', 'none of us knew who he was'] }),
  tl2Three: onStage({ tone: 'light', Graphic: TeensOptionsGraphic }),
  tl3Bosses: onStage({ tone: 'light', Graphic: TeensBossesGraphic }),
};
