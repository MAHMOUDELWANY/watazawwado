import type React from 'react';
import type { Lesson, SceneId } from '../../types';
import type { Built } from '../Scenes';
import { PillarsBuild, RootsGrow, SittingStudy, IhsanLight } from '../Scenes';
import { DoorsWonder, ClassroomWhisper, JiddoTea, MadinahLight } from './l01';
import { TwoCaptains, OrbitsOrder, ShahadaWords, OneHeart, StarPieces, NeedsChain, ReciteLamp, CoverDawn, SunClimb, LampsGlow, DuaLight, CoachShows, CompassDrop } from './l03';
import { DoorsBreathe, TypingDots, WhyListOpens, DawnRays, SandPassesBy, CushionsStudy, PillarsRise, AsksAndConfirms, SixAroundHeart, NoOneWatching, FarLight, LightOpens, ThreeDoorsBuild, FootprintsCircle, RootsUnder, ListOnDesk, BigBang } from './t01';
import { NightSky, ScreenFlare, CauseChain, UniverseBegins, ThreeOptions, AyahThreeSlots, SteadyLine, CakeHowWho, BuiltIn, TheFirst, LookUp, ListCrossed, GameGlow } from './t02';
import { OneSunRises, RecallTicks, TeamOnScreen, TwoBosses, TeamOfThree, LikesRise, PulledCompass, IkhlasStar, LovedHeart, CentreOfLife, ThirdCrossed, LibraryQuestion } from './t03';
import { ShaftOfLight, GapSteps, MadinahMorning, SandAround, CushionsClose, ColumnsRise, SixLights, IhsanSteps, HourglassRuns, FarLightOpens, RingsInward, ShadowsLengthen, CountersFade, SoundToHeart, EyeOpens, CourseArches, MistToSight, LaneTwoStates, MondayPile, CaseLight, NotebookOpens, FirstQuestionSky } from './a01';
import { ThreeWaysBuild, CastleClues, ThreeWaysQuran, SkyStars, KeyFits, DesertLook, BabyGlow, CamelKit, CastleSparkle, CrashBricks, BoatRipples, MagnifierDrop, CoverStars, HandStudy, LadybirdWalk, JiddoRecall } from './l02';

/* Which scene build acts out a page, by scene id (docs/curriculum/RULES.md §1.10). Each lesson adds its scenes in its
   own file (lessons/lNN.tsx) and lists them here; the slide compositions look them up instead of naming scenes. */

/** Concept pages (layout 'concept'): the picture builds one item at a time. */
export const BUILDS: Partial<Record<SceneId, React.ComponentType<{ labels: (string | null)[]; label: string }>>> = {
  pillars: PillarsBuild, roots: RootsGrow,
  threeWays: ThreeWaysBuild, castleClues: CastleClues, camel: CamelKit,
  twoCaptains: TwoCaptains, oneHeart: OneHeart, starPieces: StarPieces,
  tDoors: ThreeDoorsBuild, tl2Chain: CauseChain, tl2Expand: UniverseBegins, tl2Three: ThreeOptions,
  tl3Recall: RecallTicks, tl3Bosses: TwoBosses, tl3Team: TeamOfThree, tl3Center: CentreOfLife,
  a1Gap: GapSteps, a1Levels: RingsInward, a1Horizon: MistToSight, a1Inside: CourseArches,
};

/** Evidence pages (layout 'evidence'): a large annotated study beside the Arabic. */
export const STUDIES: Partial<Record<SceneId, React.ComponentType<{ v: Built; label: string }>>> = {
  sitting: SittingStudy, drawing: IhsanLight,
  threeWays: ThreeWaysQuran, sky: SkyStars, lock: KeyFits, desert: DesertLook, baby: BabyGlow,
  orbits: OrbitsOrder, shahada: ShahadaWords, recite: ReciteLamp, needs: NeedsChain,
  tSitting: CushionsStudy, tPillars: PillarsRise, tSix: SixAroundHeart, tIhsan: NoOneWatching, tReveal: LightOpens, tFathers: FootprintsCircle,
  tl2Tur: AyahThreeSlots, tl2Yaqeen: SteadyLine, tl2Fitrah: BuiltIn, tl2First: TheFirst, tl2Pitch: LookUp,
  tl3Orbits: OrbitsOrder, tl3Shahada: ShahadaWords, tl3Hawa: PulledCompass, tl3Ikhlas: IkhlasStar, tl3Loved: LovedHeart,
  a1Pillars: ColumnsRise, a1Six: SixLights, a1Ihsan: IhsanSteps, a1Hour: HourglassRuns, a1Reveal: FarLightOpens,
  a1Graves: ShadowsLengthen, a1Know: SoundToHeart, a1See: EyeOpens, a1Lane: LaneTwoStates,
};

/** Motion over the painting on cover, story, question and cliffhanger pages. On a question page the painting then shows
 *  at full strength (or the moment stands alone when the scene has no painting, like the hand). */
export const MOMENTS: Partial<Record<SceneId, React.ComponentType<{ v: Built; lesson: Lesson }>>> = {
  lego: CastleSparkle, crash: CrashBricks, boat: BoatRipples, window: CoverStars, hand: HandStudy, park: LadybirdWalk, doors: JiddoRecall,
  doorsHero: DoorsWonder, chalkboard: ClassroomWhisper, jiddo: JiddoTea, madinah: MadinahLight,
  oneSun: CoverDawn, sunrise: SunClimb, masjidNight: LampsGlow, dua: DuaLight, football: CoachShows,
  tDoors: DoorsBreathe, tCanteen: TypingDots, tWhyList: WhyListOpens, tMadinah: DawnRays, tStranger: SandPassesBy, tTruth: AsksAndConfirms,
  tReveal: FarLight, tKnowWhy: RootsUnder, tNight: ListOnDesk, tNext: BigBang,
  tl2Cover: NightSky, tl2Science: ScreenFlare, tl2Kitchen: CakeHowWho, tl2Bench: ListCrossed, tl2Gaming: GameGlow,
  tl3Cover: OneSunRises, tl3Gaming: TeamOnScreen, tl3Likes: LikesRise, tl3Prayer: ThirdCrossed, tl3Library: LibraryQuestion,
  a1Cover: ShaftOfLight, a1Madinah: MadinahMorning,
  a1Stranger: SandAround, a1Cushions: CushionsClose, a1Count: CountersFade, a1Monday: MondayPile, a1Case: CaseLight, a1Case2: CaseLight, a1Case3: CaseLight, a1Case4: CaseLight, a1Notebook: NotebookOpens,
  a1Next: FirstQuestionSky,
};

/** Today's provision dropped into Jiddo's bag on the Ahd page, by lesson number. */
export const PACKED: Record<number, React.ComponentType<{ v: Built }>> = { 2: MagnifierDrop, 3: CompassDrop };
