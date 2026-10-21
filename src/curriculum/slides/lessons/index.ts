import type React from 'react';
import type { Lesson, SceneId } from '../../types';
import type { Built } from '../Scenes';
import { PillarsBuild, RootsGrow, SittingStudy, IhsanLight } from '../Scenes';
import { DoorsWonder, ClassroomWhisper, JiddoTea, MadinahLight } from './l01';
import { TwoCaptains, OrbitsOrder, ShahadaWords, OneHeart, StarPieces, NeedsChain, ReciteLamp, CoverDawn, SunClimb, LampsGlow, DuaLight, CoachShows, CompassDrop } from './l03';
import { DoorsBreathe, TypingDots, WhyListOpens, DawnRays, SandPassesBy, CushionsStudy, PillarsRise, AsksAndConfirms, SixAroundHeart, NoOneWatching, FarLight, LightOpens, ThreeDoorsBuild, FootprintsCircle, RootsUnder, ListOnDesk, BigBang } from './t01';
import { ThreeWaysBuild, CastleClues, ThreeWaysQuran, SkyStars, KeyFits, DesertLook, BabyGlow, CamelKit, CastleSparkle, CrashBricks, BoatRipples, MagnifierDrop, CoverStars, HandStudy, LadybirdWalk, JiddoRecall } from './l02';

/* Which scene build acts out a page, by scene id (docs/curriculum/RULES.md §1.10). Each lesson adds its scenes in its
   own file (lessons/lNN.tsx) and lists them here; the slide compositions look them up instead of naming scenes. */

/** Concept pages (layout 'concept'): the picture builds one item at a time. */
export const BUILDS: Partial<Record<SceneId, React.ComponentType<{ labels: (string | null)[]; label: string }>>> = {
  pillars: PillarsBuild, roots: RootsGrow,
  threeWays: ThreeWaysBuild, castleClues: CastleClues, camel: CamelKit,
  twoCaptains: TwoCaptains, oneHeart: OneHeart, starPieces: StarPieces,
  tDoors: ThreeDoorsBuild,
};

/** Evidence pages (layout 'evidence'): a large annotated study beside the Arabic. */
export const STUDIES: Partial<Record<SceneId, React.ComponentType<{ v: Built; label: string }>>> = {
  sitting: SittingStudy, drawing: IhsanLight,
  threeWays: ThreeWaysQuran, sky: SkyStars, lock: KeyFits, desert: DesertLook, baby: BabyGlow,
  orbits: OrbitsOrder, shahada: ShahadaWords, recite: ReciteLamp, needs: NeedsChain,
  tSitting: CushionsStudy, tPillars: PillarsRise, tSix: SixAroundHeart, tIhsan: NoOneWatching, tReveal: LightOpens, tFathers: FootprintsCircle,
};

/** Motion over the painting on cover, story, question and cliffhanger pages. On a question page the painting then shows
 *  at full strength (or the moment stands alone when the scene has no painting, like the hand). */
export const MOMENTS: Partial<Record<SceneId, React.ComponentType<{ v: Built; lesson: Lesson }>>> = {
  lego: CastleSparkle, crash: CrashBricks, boat: BoatRipples, window: CoverStars, hand: HandStudy, park: LadybirdWalk, doors: JiddoRecall,
  doorsHero: DoorsWonder, chalkboard: ClassroomWhisper, jiddo: JiddoTea, madinah: MadinahLight,
  oneSun: CoverDawn, sunrise: SunClimb, masjidNight: LampsGlow, dua: DuaLight, football: CoachShows,
  tDoors: DoorsBreathe, tCanteen: TypingDots, tWhyList: WhyListOpens, tMadinah: DawnRays, tStranger: SandPassesBy, tTruth: AsksAndConfirms,
  tReveal: FarLight, tKnowWhy: RootsUnder, tNight: ListOnDesk, tNext: BigBang,
};

/** Today's provision dropped into Jiddo's bag on the Ahd page, by lesson number. */
export const PACKED: Record<number, React.ComponentType<{ v: Built }>> = { 2: MagnifierDrop, 3: CompassDrop };
