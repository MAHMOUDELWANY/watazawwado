import type React from 'react';
import type { Lesson, SceneId } from '../../types';
import type { Built } from '../Scenes';
import { PillarsBuild, RootsGrow, SittingStudy, IhsanLight } from '../Scenes';
import { ThreeWaysBuild, CastleClues, ThreeWaysQuran, SkyStars, KeyFits, LookFour, CamelKit, CastleSparkle, CrashBricks, BoatRipples, MagnifierDrop } from './l02';

/* Which scene build acts out a page, by scene id (docs/curriculum/RULES.md §1.10). Each lesson adds its scenes in its
   own file (lessons/lNN.tsx) and lists them here; the slide compositions look them up instead of naming scenes. */

/** Concept pages (layout 'concept'): the picture builds one item at a time. */
export const BUILDS: Partial<Record<SceneId, React.ComponentType<{ labels: (string | null)[]; label: string }>>> = {
  pillars: PillarsBuild, roots: RootsGrow,
  threeWays: ThreeWaysBuild, castleClues: CastleClues, camel: CamelKit,
};

/** Evidence pages (layout 'evidence'): a large annotated study beside the Arabic. */
export const STUDIES: Partial<Record<SceneId, React.ComponentType<{ v: Built; label: string }>>> = {
  sitting: SittingStudy, drawing: IhsanLight,
  threeWays: ThreeWaysQuran, sky: SkyStars, lock: KeyFits, look: LookFour,
};

/** Motion over the painting on story, question, mission and cliffhanger pages. */
export const MOMENTS: Partial<Record<SceneId, React.ComponentType<{ v: Built; lesson: Lesson }>>> = {
  lego: CastleSparkle, crash: CrashBricks, boat: BoatRipples,
};

/** Today's provision dropped into Jiddo's bag on the Ahd page, by lesson number. */
export const PACKED: Record<number, React.ComponentType<{ v: Built }>> = { 2: MagnifierDrop };
