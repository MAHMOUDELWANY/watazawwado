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
import { LawCoverGraphic, LawTrainGraphic, LawSignGraphic, LawWorldGraphic, LawRtlGraphic, Law28Graphic, LawHandsGraphic, LawDotsGraphic, LawMarksGraphic, LawSoundsGraphic, LawAlifGraphic, LawTrueGraphic, LawReadGraphic, LawStampGraphic, LawNextGraphic } from '../motion/g-law';
import { LwtCoverGraphic, LwtCityGraphic, LwtMessageGraphic, LwtWorldGraphic, LwtRtlGraphic, Lwt28Graphic, LwtHandsGraphic, LwtDotsGraphic, LwtMarksGraphic, LwtSoundsGraphic, LwtAlifGraphic, LwtTrueGraphic, LwtReadGraphic, LwtBlockGraphic, LwtNextGraphic } from '../motion/g-lwt';
import { LwaCoverGraphic, LwaMapGraphic, LwaSignGraphic, LwaWorldGraphic, LwaRtlGraphic, Lwa28Graphic, LwaHandsGraphic, LwaDotsGraphic, LwaMarksGraphic, LwaSoundsGraphic, LwaAlifGraphic, LwaTrueGraphic, LwaReadGraphic, LwaMilestoneGraphic, LwaNextGraphic } from '../motion/g-lwa';
import { La1CoverGraphic, La1NoteGraphic, La1GuessGraphic, La1AlifGraphic, La1BaaGraphic, La1TaaGraphic, La1ThaaGraphic, La1TrickGraphic, La1FindGraphic, La1WordGraphic, La1MissionGraphic, La1NextGraphic } from '../motion/g-la1';
import { Fk1CoverGraphic, Fk1GameGraphic, Fk1StoryGraphic, Fk1HaadhaGraphic, Fk1MaaGraphic, Fk1ManGraphic, Fk1WordsGraphic, Fk1SpotGraphic, Fk1TalkGraphic, Fk1MissionGraphic, Fk1NextGraphic } from '../motion/g-fk1';
import { Lc1CoverGraphic, Lc1MessageGraphic, Lc1WhyGraphic, Lc1WhatGraphic, Lc1PlainGraphic, Lc1AynGraphic, Lc1HaGraphic, Lc1PairsGraphic, Lc1ReadGraphic, Lc1ReplyGraphic, Lc1MissionGraphic, Lc1NextGraphic } from '../motion/g-lc1';
import { Lc2CoverGraphic, Lc2MessageGraphic, Lc2StopGraphic, Lc2QafGraphic, Lc2PairsGraphic, Lc2ElGraphic, Lc2ReadGraphic, Lc2ReplyGraphic, Lc2MissionGraphic, Lc2NextGraphic } from '../motion/g-lc2';
import { Ea2CoverGraphic, Ea2StairsGraphic, Ea2ListenGraphic, Ea2MinenGraphic, Ea2CountriesGraphic, Ea2MasriGraphic, Ea2EndingsGraphic, Ea2GimGraphic, Ea2PoliteGraphic, Ea2TalkGraphic, Ea2MissionGraphic, Ea2NextGraphic } from '../motion/g-ea2';
import { Ea3CoverGraphic, Ea3PlateGraphic, Ea3ListenGraphic, Ea3DaDiGraphic, Ea3TaGraphic, Ea3FlatGraphic, Ea3PeopleGraphic, Ea3RecapGraphic, Ea3TalkGraphic, Ea3MissionGraphic, Ea3NextGraphic } from '../motion/g-ea3';
import { Fk2CoverGraphic, Fk2RecallGraphic, Fk2BoxGraphic, Fk2StoryGraphic, Fk2HamzaGraphic, Fk2YesGraphic, Fk2AnimalsGraphic, Fk2ShadowGraphic, Fk2TalkGraphic, Fk2MissionGraphic, Fk2NextGraphic } from '../motion/g-fk2';
import { Fk3CoverGraphic, Fk3RecallGraphic, Fk3ParkGraphic, Fk3StoryGraphic, Fk3NearGraphic, Fk3QuestionsGraphic, Fk3WordsGraphic, Fk3TalkGraphic, Fk3MissionGraphic, Fk3NextGraphic } from '../motion/g-fk3';
import { Ft2CoverGraphic, Ft2PhoneGraphic, Ft2DarkGraphic, Ft2HamzaGraphic, Ft2AnswersGraphic, Ft2WordsGraphic, Ft2TorchGraphic, Ft2ChainGraphic, Ft2TalkGraphic, Ft2MissionGraphic, Ft2NextGraphic } from '../motion/g-ft2';
import { Ft3CoverGraphic, Ft3RoofGraphic, Ft3ListenGraphic, Ft3FarGraphic, Ft3TilkaGraphic, Ft3GridGraphic, Ft3WordsGraphic, Ft3TalkGraphic, Ft3MissionGraphic, Ft3NextGraphic } from '../motion/g-ft3';
import { Lb2CoverGraphic, Lb2RecallGraphic, Lb2FastGraphic, Lb2StandGraphic, Lb2ClapsGraphic, Lb2HadhaGraphic, Lb2WawGraphic, Lb2YaaGraphic, Lb2SpotGraphic, Lb2AlongGraphic, Lb2MissionGraphic, Lb2NextGraphic } from '../motion/g-lb2';
import { La3CoverGraphic, La3NoteGraphic, La3GuessGraphic, La3HaaGraphic, La3JeemGraphic, La3KhaaGraphic, La3TrickGraphic, La3FindGraphic, La3WordGraphic, La3MissionGraphic, La3NextGraphic, Lq3CoverGraphic, Lq3MessageGraphic, Lq3CupsGraphic, Lq3HooksGraphic, Lq3RuleGraphic, Lq3WordsGraphic, Lq3MissionGraphic, Lq3NextGraphic } from '../motion/g-la3';
import { Lb3CoverGraphic, Lb3RecallGraphic, Lb3MysteryGraphic, Lb3ZeroGraphic, Lb3GroupGraphic, Lb3AsrGraphic, Lb3AnaGraphic, Lb3SpotGraphic, Lb3AlongGraphic, Lb3MissionGraphic, Lb3NextGraphic } from '../motion/g-lb3';
import { Qr2CoverGraphic, Qr2WarmGraphic, Qr2ShaddaGraphic, Qr2Nas1Graphic, Qr2Nas4Graphic, Qr2RhymeGraphic, Qr2Falaq1Graphic, Qr2Falaq4Graphic, Qr2ReadGraphic, Qr2MissionGraphic, Qr2NextGraphic } from '../motion/g-qr2';
import { Qr3CoverGraphic, Qr3WarmGraphic, Qr3TanweenGraphic, Qr3Ikhlas1Graphic, Qr3Ikhlas3Graphic, Qr3StopGraphic, Qr3Masad1Graphic, Qr3Masad4Graphic, Qr3ReadGraphic, Qr3MissionGraphic, Qr3NextGraphic } from '../motion/g-qr3';
import { Tm1CoverGraphic, Tm1PairsGraphic, Tm1ListenGraphic, Tm1FindGraphic, Tm1FiveGraphic, Tm1JawfGraphic, Tm1HalqGraphic, Tm1LisanGraphic, Tm1LipsNoseGraphic, Tm1FatihaGraphic, Tm1ReciteGraphic, Tm1MissionGraphic, Tm1NextGraphic } from '../motion/g-tm1';
import { Tm2CoverGraphic, Tm2RecallGraphic, Tm2FloorsGraphic, Tm2DeepGraphic, Tm2MidGraphic, Tm2NearGraphic, Tm2PatternGraphic, Tm2MeaningGraphic, Tm2SlipsGraphic, Tm2VoiceGraphic, Tm2ReciteGraphic, Tm2MissionGraphic, Tm2NextGraphic } from '../motion/g-tm2';
import { Tm3CoverGraphic, Tm3RecallGraphic, Tm3ZoomGraphic, Tm3QafGraphic, Tm3KafGraphic, Tm3BounceGraphic, Tm3IkhlasGraphic, Tm3SlipsGraphic, Tm3ReciteGraphic, Tm3MissionGraphic, Tm3NextGraphic } from '../motion/g-tm3';
import { Tr1CoverGraphic, Tr1RulerGraphic, Tr1CausesGraphic, Tr1NaturalGraphic, Tr1HamzaGraphic, Tr1SukoonGraphic, Tr1SmallGraphic, Tr1RankedGraphic, Tr1EvidenceGraphic, Tr1SixGraphic, Tr1ReciteGraphic, Tr1MissionGraphic, Tr1NextGraphic } from '../motion/g-tr1';
import { Tr2CoverGraphic, Tr2BreathGraphic, Tr2KnowGraphic, Tr2FourGraphic, Tr2CompleteGraphic, Tr2GoodGraphic, Tr2WrongGraphic, Tr2StartGraphic, Tr2SignsGraphic, Tr2ReciteGraphic, Tr2MissionGraphic, Tr2NextGraphic } from '../motion/g-tr2';
import { Tr3CoverGraphic, Tr3WeightsGraphic, Tr3VowelGraphic, Tr3BeforeGraphic, Tr3StopGraphic, Tr3SameGraphic, Tr3WaslGraphic, Tr3IstilaGraphic, Tr3BothGraphic, Tr3ReciteGraphic, Tr3MissionGraphic, Tr3NextGraphic } from '../motion/g-tr3';
import { Fv1CoverGraphic, Fv1SaturdayGraphic, Fv1StoryGraphic, Fv1EndingGraphic, Fv1YouGraphic, Fv1ManyGraphic, Fv1EightGraphic, Fv1VerbsGraphic, Fv1TalkGraphic, Fv1MissionGraphic, Fv1NextGraphic, Fw1CoverGraphic, Fw1MondayGraphic, Fw1StoryGraphic, Fw1OneGraphic, Fw1GroupGraphic, Fw1EightGraphic, Fw1VerbsGraphic, Fw1TalkGraphic, Fw1MissionGraphic, Fw1NextGraphic } from '../motion/g-fv1';
import { Fv2CoverGraphic, Fv2RecallGraphic, Fv2MondayGraphic, Fv2StoryGraphic, Fv2IGraphic, Fv2HeSheGraphic, Fv2WeGraphic, Fv2FrontGraphic, Fv2VerbsGraphic, Fv2TalkGraphic, Fv2MissionGraphic, Fv2NextGraphic, Fw2CoverGraphic, Fw2WeekGraphic, Fw2StoryGraphic, Fw2LettersGraphic, Fw2OneGraphic, Fw2ManyGraphic, Fw2BothGraphic, Fw2PairsGraphic, Fw2TalkGraphic, Fw2MissionGraphic, Fw2NextGraphic } from '../motion/g-fv2';
import { Fv3CoverGraphic, Fv3RecallGraphic, Fv3AlbumGraphic, Fv3StoryGraphic, Fv3FatherGraphic, Fv3BrotherGraphic, Fv3AfterGraphic, Fv3KunyaGraphic, Fv3DhuGraphic, Fv3TalkGraphic, Fv3MissionGraphic, Fv3NextGraphic, Fw3CoverGraphic, Fw3BreakGraphic, Fw3StoryGraphic, Fw3FiveGraphic, Fw3UGraphic, Fw3AGraphic, Fw3IGraphic, Fw3JobsGraphic, Fw3KunyaGraphic, Fw3TalkGraphic, Fw3MissionGraphic, Fw3NextGraphic } from '../motion/g-fv3';
import { Fx1CoverGraphic, Fx1RecallGraphic, Fx1BikeGraphic, Fx1StoryGraphic, Fx1RootGraphic, Fx1TwoGraphic, Fx1ThreeGraphic, Fx1MouldGraphic, Fx1PresentGraphic, Fx1TalkGraphic, Fx1MissionGraphic, Fx1NextGraphic, Fy1CoverGraphic, Fy1BoardGraphic, Fy1StoryGraphic, Fy1PatternGraphic, Fy1TwoGraphic, Fy1ThreeGraphic, Fy1FourGraphic, Fy1LadderGraphic, Fy1DictionaryGraphic, Fy1TalkGraphic, Fy1MissionGraphic, Fy1NextGraphic } from '../motion/g-fx1';
import { Fx2CoverGraphic, Fx2RecallGraphic, Fx2CrashGraphic, Fx2StoryGraphic, Fx2WasGraphic, Fx2SwitchGraphic, Fx2SheGraphic, Fx2GoneGraphic, Fx2WhyGraphic, Fx2TalkGraphic, Fx2MissionGraphic, Fx2NextGraphic, Fy2CoverGraphic, Fy2NewsGraphic, Fy2StoryGraphic, Fy2PastGraphic, Fy2PresentGraphic, Fy2StandGraphic, Fy2FormsGraphic, Fy2MissingGraphic, Fy2ReadGraphic, Fy2TalkGraphic, Fy2MissionGraphic, Fy2NextGraphic } from '../motion/g-fx2';
import { Fx3CoverGraphic, Fx3RecallGraphic, Fx3TrialGraphic, Fx3StoryGraphic, Fx3InnaGraphic, Fx3SeesawGraphic, Fx3LakinnaGraphic, Fx3HuGraphic, Fx3VerdictGraphic, Fx3TalkGraphic, Fx3MissionGraphic, Fx3NextGraphic, Fy3CoverGraphic, Fy3MotionGraphic, Fy3StoryGraphic, Fy3InnaGraphic, Fy3SeesawGraphic, Fy3LakinnaGraphic, Fy3MoodsGraphic, Fy3PronounsGraphic, Fy3SixGraphic, Fy3TalkGraphic, Fy3MissionGraphic, Fy3NextGraphic } from '../motion/g-fx3';
import { Es1CoverGraphic, Es1LostGraphic, Es1StoryGraphic, Es1QafGraphic, Es1GuessGraphic, Es1KeepGraphic, Es1JimGraphic, Es1ThousandGraphic, Es1SentenceGraphic, Es1TalkGraphic, Es1MissionGraphic, Es1NextGraphic } from '../motion/g-es1';
import { Es2CoverGraphic, Es2RecallGraphic, Es2GoldGraphic, Es2StoryGraphic, Es2ThaGraphic, Es2DhalGraphic, Es2BookGraphic, Es2ZhaGraphic, Es2LayersGraphic, Es2TalkGraphic, Es2MissionGraphic, Es2NextGraphic } from '../motion/g-es2';
import { Es3CoverGraphic, Es3RecallGraphic, Es3MetroGraphic, Es3StoryGraphic, Es3EndingsGraphic, Es3ShrinkGraphic, Es3DropGraphic, Es3StressGraphic, Es3MusicGraphic, Es3TalkGraphic, Es3MissionGraphic, Es3NextGraphic } from '../motion/g-es3';
import { Tj2CoverGraphic, Tj2RecallGraphic, Tj2FiveGraphic, Tj2WhyGraphic, Tj2SmallGraphic, Tj2BigGraphic, Tj2BiggestGraphic, Tj2MistakesGraphic, Tj2SpotGraphic, Tj2ReciteGraphic, Tj2MissionGraphic, Tj2NextGraphic } from '../motion/g-tj2';
import { Tj3CoverGraphic, Tj3RecallGraphic, Tj3DoorsGraphic, Tj3ThroatGraphic, Tj3IzharGraphic, Tj3TanweenGraphic, Tj3WhyGraphic, Tj3MushafGraphic, Tj3MistakesGraphic, Tj3SpotGraphic, Tj3ReciteGraphic, Tj3MissionGraphic, Tj3NextGraphic } from '../motion/g-tj3';
import { Ea1CoverGraphic, Ea1BookGraphic, Ea1DoorGraphic, Ea1PairsGraphic, Ea1EhGraphic, Ea1MonaGraphic, Ea1SuffixGraphic, Ea1HadraGraphic, Ea1SorryGraphic, Ea1ByeGraphic, Ea1TalkGraphic, Ea1MissionGraphic, Ea1NextGraphic } from '../motion/g-ea1';
import { Lt1CoverGraphic, Lt1SignGraphic, Lt1GuessGraphic, Lt1AlifGraphic, Lt1BaaGraphic, Lt1TaaGraphic, Lt1ThaaGraphic, Lt1SystemGraphic, Lt1FindGraphic, Lt1WordGraphic, Lt1MissionGraphic, Lt1NextGraphic } from '../motion/g-lt1';
import { Tj1CoverGraphic, Tj1QalbGraphic, Tj1TarteelGraphic, Tj1RightGraphic, Tj1StumbleGraphic, Tj1MistakesGraphic, Tj1LayersGraphic, Tj1IstiadhaGraphic, Tj1BasmalahGraphic, Tj1ReciteGraphic, Tj1MissionGraphic, Tj1NextGraphic } from '../motion/g-tj1';
import { Qr1CoverGraphic, Qr1SeventeenGraphic, Qr1MovesGraphic, Qr1Ayah1Graphic, Qr1Ayah2Graphic, Qr1Ayah4Graphic, Qr1Ayah5Graphic, Qr1Ayah6Graphic, Qr1ReadGraphic, Qr1MissionGraphic, Qr1NextGraphic } from '../motion/g-qr1';
import { En1CoverGraphic, En1GardenGraphic, En1SGraphic, En1AGraphic, En1TGraphic, En1BlendGraphic, En1FindGraphic, En1ReadGraphic, En1MissionGraphic, En1NextGraphic } from '../motion/g-en1';
import { Ft1CoverGraphic, Ft1ArriveGraphic, Ft1ListenGraphic, Ft1HaadhihiGraphic, Ft1MaaManGraphic, Ft1NoIsGraphic, Ft1WordsGraphic, Ft1TalkGraphic, Ft1MissionGraphic, Ft1NextGraphic } from '../motion/g-ft1';
import { Lq1CoverGraphic, Lq1MessageGraphic, Lq1GuessGraphic, Lq1AlifGraphic, Lq1ThreeGraphic, Lq1SpeedGraphic, Lq1RuleGraphic, Lq1WordGraphic, Lq1WriteGraphic, Lq1MissionGraphic, Lq1NextGraphic } from '../motion/g-lq1';
import { Ek1CoverGraphic, Ek1DoorGraphic, Ek1ListenGraphic, Ek1HelloGraphic, Ek1IsmiGraphic, Ek1AkIkGraphic, Ek1ByeGraphic, Ek1TalkGraphic, Ek1MissionGraphic, Ek1NextGraphic } from '../motion/g-egy';
import { Et1CoverGraphic, Et1ClubGraphic, Et1ListenGraphic, Et1HowGraphic, Et1EndingGraphic, Et1HiGraphic, Et1NamesGraphic, Et1TalkGraphic, Et1MissionGraphic, Et1NextGraphic } from '../motion/g-egy';
import { Ek2CoverGraphic, Ek2QuestionGraphic, Ek2ListenGraphic, Ek2MinenGraphic, Ek2MapGraphic, Ek2MasriGraphic, Ek2TalkGraphic, Ek2MissionGraphic, Ek2NextGraphic, Et2CoverGraphic, Et2ShirtGraphic, Et2ListenGraphic, Et2MinenGraphic, Et2AslGraphic, Et2NatGraphic, Et2TalkGraphic, Et2MissionGraphic, Et2NextGraphic } from '../motion/g-egy2';
import { Ek3CoverGraphic, Ek3BoxGraphic, Ek3ListenGraphic, Ek3DaDiGraphic, Ek3TaGraphic, Ek3ThingsGraphic, Ek3TalkGraphic, Ek3MissionGraphic, Ek3NextGraphic, Et3CoverGraphic, Et3BagGraphic, Et3ListenGraphic, Et3DaDiGraphic, Et3TaGraphic, Et3StuffGraphic, Et3TalkGraphic, Et3MissionGraphic, Et3NextGraphic } from '../motion/g-egy3';
import { Eg1CoverGraphic, Eg1CafeGraphic, Eg1ListenGraphic, Eg1ImGraphic, Eg1YoureGraphic, Eg1NameGraphic, Eg1ByeGraphic, Eg1TalkGraphic, Eg1MissionGraphic, Eg1NextGraphic } from '../motion/g-eng';
import { Ex1CoverGraphic, Ex1ShortGraphic, Ex1BandsGraphic, Ex1Part1Graphic, Ex1AreGraphic, Ex1LengthGraphic, Ex1LinkGraphic, Ex1TimedGraphic, Ex1MissionGraphic, Ex1NextGraphic } from '../motion/g-eng';
import { Sk1ScalesGraphic, Sk1MissionGraphic } from '../motion/g-sk1';
import { Se1CoverGraphic, Se1EmpiresGraphic, Se1JahiliyyahGraphic, Se1MakkahGraphic, Se1AbrahaGraphic, Se1QullaysGraphic, Se1ScalesGraphic, Se1MarchGraphic, Se1CampGraphic, Se1WalkGraphic, Se1TentGraphic, Se1TrustGraphic, Se1KneelGraphic, Se1SpearGraphic, Se1BirdsGraphic, Se1FilGraphic, Se1AftermathGraphic, Se1CradleGraphic, Se1MissionGraphic, Se1NextGraphic } from '../motion/g-se1';
import { Se2CoverGraphic, Se2CustomGraphic, Se2DroughtGraphic, Se2CaravanGraphic, Se2NightGraphic, Se2PassedGraphic, Se2LanesGraphic, Se2DoorwayGraphic, Se2HarithGraphic, Se2MilkGraphic, Se2DonkeyGraphic, Se2GreenGraphic, Se2SeedGraphic, Se2HazeGraphic, Se2HillsGraphic, Se2BasinGraphic, Se2VesselGraphic, Se2MissionGraphic, Se2NextGraphic, Se3CoverGraphic, Se3HomeGraphic, Se3JourneyGraphic, Se3PalmsGraphic, Se3TentGraphic, Se3FootprintsGraphic, Se3WayHomeGraphic, Se3MattressGraphic, Se3WallGraphic, Se3StaffGraphic, Se3ChainGraphic, Se3UncleGraphic, Se3CloudsGraphic, Se3RainGraphic, Se3DuhaGraphic, Se3GraveGraphic, Se3ShoulderGraphic, Se3MissionGraphic, Se3NextGraphic , Se4CoverGraphic, Se4MarketGraphic, Se4RopeGraphic, Se4RouteGraphic, Se4BusraGraphic, Se4CellGraphic, Se4CloudGraphic, Se4FeastGraphic, Se4DoorGraphic, Se4ScrollsGraphic, Se4PassGraphic, Se4LanternGraphic, Se4BookGraphic, Se4ForkGraphic, Se4WalletGraphic, Se4MissionGraphic, Se4NextGraphic } from '../motion/g-se23';
import { Sk2CoverGraphic, Sk2DryGraphic, Sk2TripGraphic, Sk2TownGraphic, Sk2AskGraphic, Sk2DoorGraphic, Sk2MilkGraphic, Sk2RaceGraphic, Sk2GreenGraphic, Sk2HillsGraphic, Sk2BasinGraphic, Sk2MissionGraphic, Sk2NextGraphic, Sk3CoverGraphic, Sk3JourneyGraphic, Sk3PalmsGraphic, Sk3TentGraphic, Sk3AskGraphic, Sk3RugGraphic, Sk3StaffGraphic, Sk3HomeGraphic, Sk3CloudsGraphic, Sk3RainGraphic, Sk3DuhaGraphic, Sk3MissionGraphic, Sk3NextGraphic , Sk4CoverGraphic, Sk4YardGraphic, Sk4RoadGraphic, Sk4MonasteryGraphic, Sk4CloudGraphic, Sk4TreeGraphic, Sk4FeastGraphic, Sk4AskGraphic, Sk4DoorGraphic, Sk4MercyGraphic, Sk4BackGraphic, Sk4MissionGraphic, Sk4NextGraphic , Sk1PicCoverGraphic, Sk1PicMakkahGraphic, Sk1PicAbrahaGraphic, Sk1PicMarchGraphic, Sk1PicHillsGraphic, Sk1PicKneelGraphic, Sk1PicBirdsGraphic, Sk1PicFilGraphic, Sk1PicBabyGraphic, Sk1PicNextGraphic } from '../motion/g-sk23';
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
  // Literacy A · Kids · Lesson 1 · Welcome to Arabic (the Letter Train)
  lawCover: onStage({ tone: 'light', Graphic: LawCoverGraphic }),
  lawTrain: onStage({ tone: 'light', Graphic: LawTrainGraphic }),
  lawSign: onStage({ tone: 'light', Graphic: LawSignGraphic, keepOnAsk: true }),
  lawWorld: onStage({ tone: 'light', Graphic: LawWorldGraphic }),
  lawRtl: onStage({ tone: 'light', Graphic: LawRtlGraphic }),
  law28: onStage({ tone: 'light', Graphic: Law28Graphic }),
  lawHands: onStage({ tone: 'light', Graphic: LawHandsGraphic }),
  lawDots: onStage({ tone: 'light', Graphic: LawDotsGraphic }),
  lawMarks: onStage({ tone: 'light', Graphic: LawMarksGraphic }),
  lawSounds: onStage({ tone: 'light', Graphic: LawSoundsGraphic }),
  lawAlif: onStage({ tone: 'light', Graphic: LawAlifGraphic }),
  lawTrue: onStage({ tone: 'light', Graphic: LawTrueGraphic }),
  lawRead: onStage({ tone: 'light', Graphic: LawReadGraphic }),
  lawStamp: onStage({ tone: 'light', Graphic: LawStampGraphic }),
  lawNext: onStage({ tone: 'light', Graphic: LawNextGraphic }),
  // Literacy A · Teens · Lesson 1 · Welcome to Arabic (Decode the City)
  lwtCover: onStage({ tone: 'dark', Graphic: LwtCoverGraphic }),
  lwtCity: onStage({ tone: 'dark', Graphic: LwtCityGraphic }),
  lwtMessage: onStage({ tone: 'dark', Graphic: LwtMessageGraphic, keepOnAsk: true }),
  lwtWorld: onStage({ tone: 'dark', Graphic: LwtWorldGraphic }),
  lwtRtl: onStage({ tone: 'dark', Graphic: LwtRtlGraphic }),
  lwt28: onStage({ tone: 'dark', Graphic: Lwt28Graphic }),
  lwtHands: onStage({ tone: 'dark', Graphic: LwtHandsGraphic }),
  lwtDots: onStage({ tone: 'dark', Graphic: LwtDotsGraphic }),
  lwtMarks: onStage({ tone: 'dark', Graphic: LwtMarksGraphic }),
  lwtSounds: onStage({ tone: 'dark', Graphic: LwtSoundsGraphic }),
  lwtAlif: onStage({ tone: 'dark', Graphic: LwtAlifGraphic }),
  lwtTrue: onStage({ tone: 'dark', Graphic: LwtTrueGraphic }),
  lwtRead: onStage({ tone: 'dark', Graphic: LwtReadGraphic }),
  lwtBlock: onStage({ tone: 'dark', Graphic: LwtBlockGraphic }),
  lwtNext: onStage({ tone: 'dark', Graphic: LwtNextGraphic }),
  // Literacy A · Adults · Lesson 1 · Welcome to Arabic (the Reading Map)
  lwaCover: onStage({ tone: 'light', Graphic: LwaCoverGraphic }),
  lwaMap: onStage({ tone: 'light', Graphic: LwaMapGraphic }),
  lwaSign: onStage({ tone: 'light', Graphic: LwaSignGraphic, keepOnAsk: true }),
  lwaWorld: onStage({ tone: 'light', Graphic: LwaWorldGraphic }),
  lwaRtl: onStage({ tone: 'light', Graphic: LwaRtlGraphic }),
  lwa28: onStage({ tone: 'light', Graphic: Lwa28Graphic }),
  lwaHands: onStage({ tone: 'light', Graphic: LwaHandsGraphic }),
  lwaDots: onStage({ tone: 'light', Graphic: LwaDotsGraphic }),
  lwaMarks: onStage({ tone: 'light', Graphic: LwaMarksGraphic }),
  lwaSounds: onStage({ tone: 'light', Graphic: LwaSoundsGraphic }),
  lwaAlif: onStage({ tone: 'light', Graphic: LwaAlifGraphic }),
  lwaTrue: onStage({ tone: 'light', Graphic: LwaTrueGraphic }),
  lwaRead: onStage({ tone: 'light', Graphic: LwaReadGraphic }),
  lwaMilestone: onStage({ tone: 'light', Graphic: LwaMilestoneGraphic }),
  lwaNext: onStage({ tone: 'light', Graphic: LwaNextGraphic }),
  // Literacy A · Kids · Lesson 2 (first prototype, look A, letter friends)
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
  en1Cover: onStage({ tone: 'light', Graphic: En1CoverGraphic }), en1Garden: onStage({ tone: 'light', Graphic: En1GardenGraphic }),
  en1S: onStage({ tone: 'light', Graphic: En1SGraphic }), en1A: onStage({ tone: 'light', Graphic: En1AGraphic }), en1T: onStage({ tone: 'light', Graphic: En1TGraphic }),
  en1Blend: onStage({ tone: 'light', Graphic: En1BlendGraphic }), en1Find: onStage({ tone: 'light', Graphic: En1FindGraphic }),
  en1Read: onStage({ tone: 'light', Graphic: En1ReadGraphic }), en1Mission: onStage({ tone: 'light', Graphic: En1MissionGraphic }),
  en1Next: onStage({ tone: 'light', Graphic: En1NextGraphic }),

  qr1Cover: onStage({ tone: 'light', Graphic: Qr1CoverGraphic }), qr1Seventeen: onStage({ tone: 'light', Graphic: Qr1SeventeenGraphic }),
  qr1Moves: onStage({ tone: 'light', Graphic: Qr1MovesGraphic }), qr1Ayah1: onStage({ tone: 'light', Graphic: Qr1Ayah1Graphic }),
  qr1Ayah2: onStage({ tone: 'light', Graphic: Qr1Ayah2Graphic }), qr1Ayah4: onStage({ tone: 'light', Graphic: Qr1Ayah4Graphic }),
  qr1Ayah5: onStage({ tone: 'light', Graphic: Qr1Ayah5Graphic }), qr1Ayah6: onStage({ tone: 'light', Graphic: Qr1Ayah6Graphic }),
  qr1Read: onStage({ tone: 'light', Graphic: Qr1ReadGraphic, keepOnAsk: true }), qr1Mission: onStage({ tone: 'light', Graphic: Qr1MissionGraphic }),
  qr1Next: onStage({ tone: 'light', Graphic: Qr1NextGraphic }),

  tj1Cover: onStage({ tone: 'light', Graphic: Tj1CoverGraphic }), tj1Qalb: onStage({ tone: 'light', Graphic: Tj1QalbGraphic }),
  tj1Tarteel: onStage({ tone: 'light', Graphic: Tj1TarteelGraphic, marks: ['tarteel'] }), tj1Right: onStage({ tone: 'light', Graphic: Tj1RightGraphic }),
  tj1Stumble: onStage({ tone: 'light', Graphic: Tj1StumbleGraphic }), tj1Mistakes: onStage({ tone: 'light', Graphic: Tj1MistakesGraphic }),
  tj1Layers: onStage({ tone: 'light', Graphic: Tj1LayersGraphic }), tj1Istiadha: onStage({ tone: 'light', Graphic: Tj1IstiadhaGraphic, marks: ['seek refuge'] }),
  tj1Basmalah: onStage({ tone: 'light', Graphic: Tj1BasmalahGraphic }), tj1Recite: onStage({ tone: 'light', Graphic: Tj1ReciteGraphic, keepOnAsk: true }),
  tj1Mission: onStage({ tone: 'light', Graphic: Tj1MissionGraphic }), tj1Next: onStage({ tone: 'light', Graphic: Tj1NextGraphic }),

  lt1Cover: onStage({ tone: 'light', Graphic: Lt1CoverGraphic }), lt1Sign: onStage({ tone: 'light', Graphic: Lt1SignGraphic }),
  lt1Guess: onStage({ tone: 'light', Graphic: Lt1GuessGraphic, keepOnAsk: true }), lt1Alif: onStage({ tone: 'light', Graphic: Lt1AlifGraphic }),
  lt1Baa: onStage({ tone: 'light', Graphic: Lt1BaaGraphic }), lt1Taa: onStage({ tone: 'light', Graphic: Lt1TaaGraphic }),
  lt1Thaa: onStage({ tone: 'light', Graphic: Lt1ThaaGraphic }), lt1System: onStage({ tone: 'light', Graphic: Lt1SystemGraphic }),
  lt1Find: onStage({ tone: 'light', Graphic: Lt1FindGraphic }), lt1Word: onStage({ tone: 'light', Graphic: Lt1WordGraphic }),
  lt1Mission: onStage({ tone: 'light', Graphic: Lt1MissionGraphic }), lt1Next: onStage({ tone: 'light', Graphic: Lt1NextGraphic }),

  lc1Cover: onStage({ tone: 'light', Graphic: Lc1CoverGraphic }), lc1Message: onStage({ tone: 'light', Graphic: Lc1MessageGraphic }),
  lc1Why: onStage({ tone: 'light', Graphic: Lc1WhyGraphic, keepOnAsk: true }), lc1What: onStage({ tone: 'light', Graphic: Lc1WhatGraphic }),
  lc1Plain: onStage({ tone: 'light', Graphic: Lc1PlainGraphic }), lc1Ayn: onStage({ tone: 'light', Graphic: Lc1AynGraphic }),
  lc1Ha: onStage({ tone: 'light', Graphic: Lc1HaGraphic }), lc1Pairs: onStage({ tone: 'light', Graphic: Lc1PairsGraphic }),
  lc1Read: onStage({ tone: 'light', Graphic: Lc1ReadGraphic }), lc1Reply: onStage({ tone: 'light', Graphic: Lc1ReplyGraphic, keepOnAsk: true }),
  lc1Mission: onStage({ tone: 'light', Graphic: Lc1MissionGraphic }), lc1Next: onStage({ tone: 'light', Graphic: Lc1NextGraphic }),
  lc2Cover: onStage({ tone: 'light', Graphic: Lc2CoverGraphic }),
  lc2Message: onStage({ tone: 'light', Graphic: Lc2MessageGraphic }),
  lc2Stop: onStage({ tone: 'light', Graphic: Lc2StopGraphic }),
  lc2Qaf: onStage({ tone: 'light', Graphic: Lc2QafGraphic }),
  lc2Pairs: onStage({ tone: 'light', Graphic: Lc2PairsGraphic }),
  lc2El: onStage({ tone: 'light', Graphic: Lc2ElGraphic }),
  lc2Read: onStage({ tone: 'light', Graphic: Lc2ReadGraphic }),
  lc2Reply: onStage({ tone: 'light', Graphic: Lc2ReplyGraphic, keepOnAsk: true }),
  lc2Mission: onStage({ tone: 'light', Graphic: Lc2MissionGraphic }),
  lc2Next: onStage({ tone: 'light', Graphic: Lc2NextGraphic }),
  ea2Cover: onStage({ tone: 'light', Graphic: Ea2CoverGraphic }), ea2Stairs: onStage({ tone: 'light', Graphic: Ea2StairsGraphic }),
  ea2Listen: onStage({ tone: 'light', Graphic: Ea2ListenGraphic }), ea2Minen: onStage({ tone: 'light', Graphic: Ea2MinenGraphic }),
  ea2Countries: onStage({ tone: 'light', Graphic: Ea2CountriesGraphic }), ea2Masri: onStage({ tone: 'light', Graphic: Ea2MasriGraphic }),
  ea2Endings: onStage({ tone: 'light', Graphic: Ea2EndingsGraphic }), ea2Gim: onStage({ tone: 'light', Graphic: Ea2GimGraphic }),
  ea2Polite: onStage({ tone: 'light', Graphic: Ea2PoliteGraphic }), ea2Talk: onStage({ tone: 'light', Graphic: Ea2TalkGraphic, keepOnAsk: true }),
  ea2Mission: onStage({ tone: 'light', Graphic: Ea2MissionGraphic }), ea2Next: onStage({ tone: 'light', Graphic: Ea2NextGraphic }),
  ea3Cover: onStage({ tone: 'light', Graphic: Ea3CoverGraphic }),
  ea3Plate: onStage({ tone: 'light', Graphic: Ea3PlateGraphic }),
  ea3Listen: onStage({ tone: 'light', Graphic: Ea3ListenGraphic }),
  ea3DaDi: onStage({ tone: 'light', Graphic: Ea3DaDiGraphic }),
  ea3Ta: onStage({ tone: 'light', Graphic: Ea3TaGraphic }),
  ea3Flat: onStage({ tone: 'light', Graphic: Ea3FlatGraphic }),
  ea3People: onStage({ tone: 'light', Graphic: Ea3PeopleGraphic }),
  ea3Recap: onStage({ tone: 'light', Graphic: Ea3RecapGraphic }),
  ea3Talk: onStage({ tone: 'light', Graphic: Ea3TalkGraphic, keepOnAsk: true }),
  ea3Mission: onStage({ tone: 'light', Graphic: Ea3MissionGraphic }),
  ea3Next: onStage({ tone: 'light', Graphic: Ea3NextGraphic }),
  fk2Cover: onStage({ tone: 'light', Graphic: Fk2CoverGraphic }), fk2Recall: onStage({ tone: 'light', Graphic: Fk2RecallGraphic }),
  fk2Box: onStage({ tone: 'light', Graphic: Fk2BoxGraphic }), fk2Story: onStage({ tone: 'light', Graphic: Fk2StoryGraphic }),
  fk2Hamza: onStage({ tone: 'light', Graphic: Fk2HamzaGraphic }), fk2Yes: onStage({ tone: 'light', Graphic: Fk2YesGraphic }),
  fk2Animals: onStage({ tone: 'light', Graphic: Fk2AnimalsGraphic }), fk2Shadow: onStage({ tone: 'light', Graphic: Fk2ShadowGraphic }),
  fk2Talk: onStage({ tone: 'light', Graphic: Fk2TalkGraphic, keepOnAsk: true }), fk2Mission: onStage({ tone: 'light', Graphic: Fk2MissionGraphic }),
  fk2Next: onStage({ tone: 'light', Graphic: Fk2NextGraphic }),
  fk3Cover: onStage({ tone: 'light', Graphic: Fk3CoverGraphic }),
  fk3Recall: onStage({ tone: 'light', Graphic: Fk3RecallGraphic }),
  fk3Park: onStage({ tone: 'light', Graphic: Fk3ParkGraphic }),
  fk3Story: onStage({ tone: 'light', Graphic: Fk3StoryGraphic }),
  fk3Near: onStage({ tone: 'light', Graphic: Fk3NearGraphic }),
  fk3Questions: onStage({ tone: 'light', Graphic: Fk3QuestionsGraphic }),
  fk3Words: onStage({ tone: 'light', Graphic: Fk3WordsGraphic }),
  fk3Talk: onStage({ tone: 'light', Graphic: Fk3TalkGraphic, keepOnAsk: true }),
  fk3Mission: onStage({ tone: 'light', Graphic: Fk3MissionGraphic }),
  fk3Next: onStage({ tone: 'light', Graphic: Fk3NextGraphic }),
  ft2Cover: onStage({ tone: 'dark', Graphic: Ft2CoverGraphic }), ft2Phone: onStage({ tone: 'light', Graphic: Ft2PhoneGraphic }),
  ft2Dark: onStage({ tone: 'dark', Graphic: Ft2DarkGraphic }), ft2Hamza: onStage({ tone: 'light', Graphic: Ft2HamzaGraphic }),
  ft2Answers: onStage({ tone: 'light', Graphic: Ft2AnswersGraphic }), ft2Words: onStage({ tone: 'light', Graphic: Ft2WordsGraphic }),
  ft2Torch: onStage({ tone: 'dark', Graphic: Ft2TorchGraphic }), ft2Chain: onStage({ tone: 'light', Graphic: Ft2ChainGraphic }),
  ft2Talk: onStage({ tone: 'light', Graphic: Ft2TalkGraphic, keepOnAsk: true }), ft2Mission: onStage({ tone: 'light', Graphic: Ft2MissionGraphic }),
  ft2Next: onStage({ tone: 'light', Graphic: Ft2NextGraphic }),
  ft3Cover: onStage({ tone: 'light', Graphic: Ft3CoverGraphic }),
  ft3Roof: onStage({ tone: 'light', Graphic: Ft3RoofGraphic }),
  ft3Listen: onStage({ tone: 'light', Graphic: Ft3ListenGraphic }),
  ft3Far: onStage({ tone: 'light', Graphic: Ft3FarGraphic }),
  ft3Tilka: onStage({ tone: 'light', Graphic: Ft3TilkaGraphic }),
  ft3Grid: onStage({ tone: 'light', Graphic: Ft3GridGraphic }),
  ft3Words: onStage({ tone: 'light', Graphic: Ft3WordsGraphic }),
  ft3Talk: onStage({ tone: 'light', Graphic: Ft3TalkGraphic, keepOnAsk: true }),
  ft3Mission: onStage({ tone: 'light', Graphic: Ft3MissionGraphic }),
  ft3Next: onStage({ tone: 'light', Graphic: Ft3NextGraphic }),
  lb2Cover: onStage({ tone: 'light', Graphic: Lb2CoverGraphic }), lb2Recall: onStage({ tone: 'light', Graphic: Lb2RecallGraphic }),
  lb2Fast: onStage({ tone: 'light', Graphic: Lb2FastGraphic }), lb2Stand: onStage({ tone: 'light', Graphic: Lb2StandGraphic }),
  lb2Claps: onStage({ tone: 'light', Graphic: Lb2ClapsGraphic }), lb2Hadha: onStage({ tone: 'light', Graphic: Lb2HadhaGraphic }),
  lb2Waw: onStage({ tone: 'light', Graphic: Lb2WawGraphic }), lb2Yaa: onStage({ tone: 'light', Graphic: Lb2YaaGraphic, marks: ['food'] }),
  lb2Spot: onStage({ tone: 'light', Graphic: Lb2SpotGraphic }), lb2Along: onStage({ tone: 'light', Graphic: Lb2AlongGraphic, keepOnAsk: true }),
  lb2Mission: onStage({ tone: 'light', Graphic: Lb2MissionGraphic }), lb2Next: onStage({ tone: 'light', Graphic: Lb2NextGraphic }),
  la3Cover: onStage({ tone: 'light', Graphic: La3CoverGraphic }),
  la3Note: onStage({ tone: 'light', Graphic: La3NoteGraphic }),
  la3Guess: onStage({ tone: 'light', Graphic: La3GuessGraphic, keepOnAsk: true }),
  la3Haa: onStage({ tone: 'light', Graphic: La3HaaGraphic }),
  la3Jeem: onStage({ tone: 'light', Graphic: La3JeemGraphic }),
  la3Khaa: onStage({ tone: 'light', Graphic: La3KhaaGraphic }),
  la3Trick: onStage({ tone: 'light', Graphic: La3TrickGraphic }),
  la3Find: onStage({ tone: 'light', Graphic: La3FindGraphic }),
  la3Word: onStage({ tone: 'light', Graphic: La3WordGraphic }),
  la3Mission: onStage({ tone: 'light', Graphic: La3MissionGraphic }),
  la3Next: onStage({ tone: 'light', Graphic: La3NextGraphic }),
  lq3Cover: onStage({ tone: 'light', Graphic: Lq3CoverGraphic }),
  lq3Message: onStage({ tone: 'light', Graphic: Lq3MessageGraphic }),
  lq3Cups: onStage({ tone: 'light', Graphic: Lq3CupsGraphic }),
  lq3Haa: onStage({ tone: 'light', Graphic: La3HaaGraphic }),
  lq3Hooks: onStage({ tone: 'light', Graphic: Lq3HooksGraphic }),
  lq3Rule: onStage({ tone: 'light', Graphic: Lq3RuleGraphic }),
  lq3Find: onStage({ tone: 'light', Graphic: La3FindGraphic }),
  lq3Words: onStage({ tone: 'light', Graphic: Lq3WordsGraphic }),
  lq3Mission: onStage({ tone: 'light', Graphic: Lq3MissionGraphic }),
  lq3Next: onStage({ tone: 'light', Graphic: Lq3NextGraphic }),
  lt3Cover: onStage({ tone: 'light', Graphic: Lq3CoverGraphic }),
  lt3Message: onStage({ tone: 'light', Graphic: Lq3MessageGraphic }),
  lt3Cups: onStage({ tone: 'light', Graphic: Lq3CupsGraphic }),
  lt3Haa: onStage({ tone: 'light', Graphic: La3HaaGraphic }),
  lt3Hooks: onStage({ tone: 'light', Graphic: Lq3HooksGraphic }),
  lt3Rule: onStage({ tone: 'light', Graphic: Lq3RuleGraphic }),
  lt3Find: onStage({ tone: 'light', Graphic: La3FindGraphic }),
  lt3Words: onStage({ tone: 'light', Graphic: Lq3WordsGraphic }),
  lt3Mission: onStage({ tone: 'light', Graphic: Lq3MissionGraphic }),
  lt3Next: onStage({ tone: 'light', Graphic: Lq3NextGraphic }),
  lb3Cover: onStage({ tone: 'light', Graphic: Lb3CoverGraphic }),
  lb3Recall: onStage({ tone: 'light', Graphic: Lb3RecallGraphic }),
  lb3Mystery: onStage({ tone: 'light', Graphic: Lb3MysteryGraphic }),
  lb3Zero: onStage({ tone: 'light', Graphic: Lb3ZeroGraphic }),
  lb3Group: onStage({ tone: 'light', Graphic: Lb3GroupGraphic }),
  lb3Asr: onStage({ tone: 'light', Graphic: Lb3AsrGraphic }),
  lb3Ana: onStage({ tone: 'light', Graphic: Lb3AnaGraphic }),
  lb3Spot: onStage({ tone: 'light', Graphic: Lb3SpotGraphic }),
  lb3Along: onStage({ tone: 'light', Graphic: Lb3AlongGraphic, keepOnAsk: true }),
  lb3Mission: onStage({ tone: 'light', Graphic: Lb3MissionGraphic }),
  lb3Next: onStage({ tone: 'light', Graphic: Lb3NextGraphic }),
  qr2Cover: onStage({ tone: 'light', Graphic: Qr2CoverGraphic }), qr2Warm: onStage({ tone: 'light', Graphic: Qr2WarmGraphic }),
  qr2Shadda: onStage({ tone: 'light', Graphic: Qr2ShaddaGraphic }), qr2Nas1: onStage({ tone: 'light', Graphic: Qr2Nas1Graphic }),
  qr2Nas4: onStage({ tone: 'light', Graphic: Qr2Nas4Graphic }), qr2Rhyme: onStage({ tone: 'light', Graphic: Qr2RhymeGraphic }),
  qr2Falaq1: onStage({ tone: 'light', Graphic: Qr2Falaq1Graphic }), qr2Falaq4: onStage({ tone: 'light', Graphic: Qr2Falaq4Graphic }),
  qr2Read: onStage({ tone: 'light', Graphic: Qr2ReadGraphic, keepOnAsk: true }), qr2Mission: onStage({ tone: 'light', Graphic: Qr2MissionGraphic }),
  qr2Next: onStage({ tone: 'light', Graphic: Qr2NextGraphic }),
  qr3Cover: onStage({ tone: 'light', Graphic: Qr3CoverGraphic }),
  qr3Warm: onStage({ tone: 'light', Graphic: Qr3WarmGraphic }),
  qr3Tanween: onStage({ tone: 'light', Graphic: Qr3TanweenGraphic }),
  qr3Ikhlas1: onStage({ tone: 'light', Graphic: Qr3Ikhlas1Graphic }),
  qr3Ikhlas3: onStage({ tone: 'light', Graphic: Qr3Ikhlas3Graphic }),
  qr3Stop: onStage({ tone: 'light', Graphic: Qr3StopGraphic }),
  qr3Masad1: onStage({ tone: 'light', Graphic: Qr3Masad1Graphic }),
  qr3Masad4: onStage({ tone: 'light', Graphic: Qr3Masad4Graphic }),
  qr3Read: onStage({ tone: 'light', Graphic: Qr3ReadGraphic, keepOnAsk: true }),
  qr3Mission: onStage({ tone: 'light', Graphic: Qr3MissionGraphic }),
  qr3Next: onStage({ tone: 'light', Graphic: Qr3NextGraphic }),
  // Tajweed · Level 2 · Lesson 1 · The Map of the Mouth
  tm1Cover: onStage({ tone: 'light', Graphic: Tm1CoverGraphic }), tm1Pairs: onStage({ tone: 'light', Graphic: Tm1PairsGraphic }),
  tm1Listen: onStage({ tone: 'light', Graphic: Tm1ListenGraphic }), tm1Find: onStage({ tone: 'light', Graphic: Tm1FindGraphic }),
  tm1Five: onStage({ tone: 'light', Graphic: Tm1FiveGraphic }), tm1Jawf: onStage({ tone: 'light', Graphic: Tm1JawfGraphic }),
  tm1Halq: onStage({ tone: 'light', Graphic: Tm1HalqGraphic }), tm1Lisan: onStage({ tone: 'light', Graphic: Tm1LisanGraphic }),
  tm1LipsNose: onStage({ tone: 'light', Graphic: Tm1LipsNoseGraphic }), tm1Fatiha: onStage({ tone: 'light', Graphic: Tm1FatihaGraphic }),
  tm1Recite: onStage({ tone: 'light', Graphic: Tm1ReciteGraphic, keepOnAsk: true }), tm1Mission: onStage({ tone: 'light', Graphic: Tm1MissionGraphic }),
  tm1Next: onStage({ tone: 'light', Graphic: Tm1NextGraphic }),
  // Tajweed · Level 2 · Lesson 2 · The Throat
  tm2Cover: onStage({ tone: 'light', Graphic: Tm2CoverGraphic }), tm2Recall: onStage({ tone: 'light', Graphic: Tm2RecallGraphic }),
  tm2Floors: onStage({ tone: 'light', Graphic: Tm2FloorsGraphic }), tm2Deep: onStage({ tone: 'light', Graphic: Tm2DeepGraphic }),
  tm2Mid: onStage({ tone: 'light', Graphic: Tm2MidGraphic }), tm2Near: onStage({ tone: 'light', Graphic: Tm2NearGraphic }),
  tm2Pattern: onStage({ tone: 'light', Graphic: Tm2PatternGraphic }), tm2Meaning: onStage({ tone: 'light', Graphic: Tm2MeaningGraphic }),
  tm2Slips: onStage({ tone: 'light', Graphic: Tm2SlipsGraphic }), tm2Voice: onStage({ tone: 'light', Graphic: Tm2VoiceGraphic }),
  tm2Recite: onStage({ tone: 'light', Graphic: Tm2ReciteGraphic, keepOnAsk: true }), tm2Mission: onStage({ tone: 'light', Graphic: Tm2MissionGraphic }),
  tm2Next: onStage({ tone: 'light', Graphic: Tm2NextGraphic }),
  // Tajweed · Level 2 · Lesson 3 · The Deepest Tongue
  tm3Cover: onStage({ tone: 'light', Graphic: Tm3CoverGraphic }), tm3Recall: onStage({ tone: 'light', Graphic: Tm3RecallGraphic }),
  tm3Zoom: onStage({ tone: 'light', Graphic: Tm3ZoomGraphic }), tm3Qaf: onStage({ tone: 'light', Graphic: Tm3QafGraphic }),
  tm3Kaf: onStage({ tone: 'light', Graphic: Tm3KafGraphic }), tm3Bounce: onStage({ tone: 'light', Graphic: Tm3BounceGraphic }),
  tm3Ikhlas: onStage({ tone: 'light', Graphic: Tm3IkhlasGraphic }), tm3Slips: onStage({ tone: 'light', Graphic: Tm3SlipsGraphic }),
  tm3Recite: onStage({ tone: 'light', Graphic: Tm3ReciteGraphic, keepOnAsk: true }), tm3Mission: onStage({ tone: 'light', Graphic: Tm3MissionGraphic }),
  tm3Next: onStage({ tone: 'light', Graphic: Tm3NextGraphic }),
  // Tajweed · Level 3 · Lesson 1 · Every Stretch, Ranked
  tr1Cover: onStage({ tone: 'light', Graphic: Tr1CoverGraphic }), tr1Ruler: onStage({ tone: 'light', Graphic: Tr1RulerGraphic }),
  tr1Causes: onStage({ tone: 'light', Graphic: Tr1CausesGraphic }), tr1Natural: onStage({ tone: 'light', Graphic: Tr1NaturalGraphic }),
  tr1Hamza: onStage({ tone: 'light', Graphic: Tr1HamzaGraphic }), tr1Sukoon: onStage({ tone: 'light', Graphic: Tr1SukoonGraphic }),
  tr1Small: onStage({ tone: 'light', Graphic: Tr1SmallGraphic }), tr1Ranked: onStage({ tone: 'light', Graphic: Tr1RankedGraphic }),
  tr1Evidence: onStage({ tone: 'light', Graphic: Tr1EvidenceGraphic }), tr1Six: onStage({ tone: 'light', Graphic: Tr1SixGraphic }),
  tr1Recite: onStage({ tone: 'light', Graphic: Tr1ReciteGraphic, keepOnAsk: true }), tr1Mission: onStage({ tone: 'light', Graphic: Tr1MissionGraphic }),
  tr1Next: onStage({ tone: 'light', Graphic: Tr1NextGraphic }),
  // Tajweed · Level 3 · Lesson 2 · Stop and Start
  tr2Cover: onStage({ tone: 'light', Graphic: Tr2CoverGraphic }), tr2Breath: onStage({ tone: 'light', Graphic: Tr2BreathGraphic }),
  tr2Know: onStage({ tone: 'light', Graphic: Tr2KnowGraphic }), tr2Four: onStage({ tone: 'light', Graphic: Tr2FourGraphic }),
  tr2Complete: onStage({ tone: 'light', Graphic: Tr2CompleteGraphic }), tr2Good: onStage({ tone: 'light', Graphic: Tr2GoodGraphic }),
  tr2Wrong: onStage({ tone: 'light', Graphic: Tr2WrongGraphic }), tr2Start: onStage({ tone: 'light', Graphic: Tr2StartGraphic }),
  tr2Signs: onStage({ tone: 'light', Graphic: Tr2SignsGraphic }), tr2Recite: onStage({ tone: 'light', Graphic: Tr2ReciteGraphic, keepOnAsk: true }),
  tr2Mission: onStage({ tone: 'light', Graphic: Tr2MissionGraphic }), tr2Next: onStage({ tone: 'light', Graphic: Tr2NextGraphic }),
  // Tajweed · Level 3 · Lesson 3 · Raa in Full
  tr3Cover: onStage({ tone: 'light', Graphic: Tr3CoverGraphic }), tr3Weights: onStage({ tone: 'light', Graphic: Tr3WeightsGraphic }),
  tr3Vowel: onStage({ tone: 'light', Graphic: Tr3VowelGraphic }), tr3Before: onStage({ tone: 'light', Graphic: Tr3BeforeGraphic }),
  tr3Stop: onStage({ tone: 'light', Graphic: Tr3StopGraphic }), tr3Same: onStage({ tone: 'light', Graphic: Tr3SameGraphic }),
  tr3Wasl: onStage({ tone: 'light', Graphic: Tr3WaslGraphic }), tr3Istila: onStage({ tone: 'light', Graphic: Tr3IstilaGraphic }),
  tr3Both: onStage({ tone: 'light', Graphic: Tr3BothGraphic }), tr3Recite: onStage({ tone: 'light', Graphic: Tr3ReciteGraphic, keepOnAsk: true }),
  tr3Mission: onStage({ tone: 'light', Graphic: Tr3MissionGraphic }), tr3Next: onStage({ tone: 'light', Graphic: Tr3NextGraphic }),
  // Fusha · Level 2 · Lesson 1 (Kids fv1, 12+ fw1)
  fv1Cover: onStage({ tone: 'light', Graphic: Fv1CoverGraphic }),
  fv1Saturday: onStage({ tone: 'light', Graphic: Fv1SaturdayGraphic }),
  fv1Story: onStage({ tone: 'light', Graphic: Fv1StoryGraphic }),
  fv1Ending: onStage({ tone: 'light', Graphic: Fv1EndingGraphic }),
  fv1You: onStage({ tone: 'light', Graphic: Fv1YouGraphic }),
  fv1Many: onStage({ tone: 'light', Graphic: Fv1ManyGraphic }),
  fv1Eight: onStage({ tone: 'light', Graphic: Fv1EightGraphic }),
  fv1Verbs: onStage({ tone: 'light', Graphic: Fv1VerbsGraphic }),
  fv1Talk: onStage({ tone: 'light', Graphic: Fv1TalkGraphic, keepOnAsk: true }),
  fv1Mission: onStage({ tone: 'light', Graphic: Fv1MissionGraphic }),
  fv1Next: onStage({ tone: 'light', Graphic: Fv1NextGraphic }),
  fw1Cover: onStage({ tone: 'light', Graphic: Fw1CoverGraphic }),
  fw1Monday: onStage({ tone: 'light', Graphic: Fw1MondayGraphic }),
  fw1Story: onStage({ tone: 'light', Graphic: Fw1StoryGraphic }),
  fw1One: onStage({ tone: 'light', Graphic: Fw1OneGraphic }),
  fw1Group: onStage({ tone: 'light', Graphic: Fw1GroupGraphic }),
  fw1Eight: onStage({ tone: 'light', Graphic: Fw1EightGraphic }),
  fw1Verbs: onStage({ tone: 'light', Graphic: Fw1VerbsGraphic }),
  fw1Talk: onStage({ tone: 'light', Graphic: Fw1TalkGraphic, keepOnAsk: true }),
  fw1Mission: onStage({ tone: 'light', Graphic: Fw1MissionGraphic }),
  fw1Next: onStage({ tone: 'light', Graphic: Fw1NextGraphic }),
  // Fusha · Level 2 · Lesson 2 (Kids fv2, 12+ fw2)
  fv2Cover: onStage({ tone: 'light', Graphic: Fv2CoverGraphic }),
  fv2Recall: onStage({ tone: 'light', Graphic: Fv2RecallGraphic }),
  fv2Monday: onStage({ tone: 'light', Graphic: Fv2MondayGraphic }),
  fv2Story: onStage({ tone: 'light', Graphic: Fv2StoryGraphic }),
  fv2I: onStage({ tone: 'light', Graphic: Fv2IGraphic }),
  fv2HeShe: onStage({ tone: 'light', Graphic: Fv2HeSheGraphic }),
  fv2We: onStage({ tone: 'light', Graphic: Fv2WeGraphic }),
  fv2Front: onStage({ tone: 'light', Graphic: Fv2FrontGraphic }),
  fv2Verbs: onStage({ tone: 'light', Graphic: Fv2VerbsGraphic }),
  fv2Talk: onStage({ tone: 'light', Graphic: Fv2TalkGraphic, keepOnAsk: true }),
  fv2Mission: onStage({ tone: 'light', Graphic: Fv2MissionGraphic }),
  fv2Next: onStage({ tone: 'light', Graphic: Fv2NextGraphic }),
  fw2Cover: onStage({ tone: 'light', Graphic: Fw2CoverGraphic }),
  fw2Week: onStage({ tone: 'light', Graphic: Fw2WeekGraphic }),
  fw2Story: onStage({ tone: 'light', Graphic: Fw2StoryGraphic }),
  fw2Letters: onStage({ tone: 'light', Graphic: Fw2LettersGraphic }),
  fw2One: onStage({ tone: 'light', Graphic: Fw2OneGraphic }),
  fw2Many: onStage({ tone: 'light', Graphic: Fw2ManyGraphic }),
  fw2Both: onStage({ tone: 'light', Graphic: Fw2BothGraphic }),
  fw2Pairs: onStage({ tone: 'light', Graphic: Fw2PairsGraphic }),
  fw2Talk: onStage({ tone: 'light', Graphic: Fw2TalkGraphic, keepOnAsk: true }),
  fw2Mission: onStage({ tone: 'light', Graphic: Fw2MissionGraphic }),
  fw2Next: onStage({ tone: 'light', Graphic: Fw2NextGraphic }),
  // Fusha · Level 2 · Lesson 3 (Kids fv3, 12+ fw3)
  fv3Cover: onStage({ tone: 'light', Graphic: Fv3CoverGraphic }),
  fv3Recall: onStage({ tone: 'light', Graphic: Fv3RecallGraphic }),
  fv3Album: onStage({ tone: 'light', Graphic: Fv3AlbumGraphic }),
  fv3Story: onStage({ tone: 'light', Graphic: Fv3StoryGraphic }),
  fv3Father: onStage({ tone: 'light', Graphic: Fv3FatherGraphic }),
  fv3Brother: onStage({ tone: 'light', Graphic: Fv3BrotherGraphic }),
  fv3After: onStage({ tone: 'light', Graphic: Fv3AfterGraphic }),
  fv3Kunya: onStage({ tone: 'light', Graphic: Fv3KunyaGraphic }),
  fv3Dhu: onStage({ tone: 'light', Graphic: Fv3DhuGraphic }),
  fv3Talk: onStage({ tone: 'light', Graphic: Fv3TalkGraphic, keepOnAsk: true }),
  fv3Mission: onStage({ tone: 'light', Graphic: Fv3MissionGraphic }),
  fv3Next: onStage({ tone: 'light', Graphic: Fv3NextGraphic }),
  fw3Cover: onStage({ tone: 'light', Graphic: Fw3CoverGraphic }),
  fw3Break: onStage({ tone: 'light', Graphic: Fw3BreakGraphic }),
  fw3Story: onStage({ tone: 'light', Graphic: Fw3StoryGraphic }),
  fw3Five: onStage({ tone: 'light', Graphic: Fw3FiveGraphic }),
  fw3U: onStage({ tone: 'light', Graphic: Fw3UGraphic }),
  fw3A: onStage({ tone: 'light', Graphic: Fw3AGraphic }),
  fw3I: onStage({ tone: 'light', Graphic: Fw3IGraphic }),
  fw3Jobs: onStage({ tone: 'light', Graphic: Fw3JobsGraphic }),
  fw3Kunya: onStage({ tone: 'light', Graphic: Fw3KunyaGraphic }),
  fw3Talk: onStage({ tone: 'light', Graphic: Fw3TalkGraphic, keepOnAsk: true }),
  fw3Mission: onStage({ tone: 'light', Graphic: Fw3MissionGraphic }),
  fw3Next: onStage({ tone: 'light', Graphic: Fw3NextGraphic }),
  // Fusha · Level 3 · Lesson 1 (Kids fx1, 12+ fy1)
  fx1Cover: onStage({ tone: 'light', Graphic: Fx1CoverGraphic }),
  fx1Recall: onStage({ tone: 'light', Graphic: Fx1RecallGraphic }),
  fx1Bike: onStage({ tone: 'light', Graphic: Fx1BikeGraphic }),
  fx1Story: onStage({ tone: 'light', Graphic: Fx1StoryGraphic }),
  fx1Root: onStage({ tone: 'light', Graphic: Fx1RootGraphic }),
  fx1Two: onStage({ tone: 'light', Graphic: Fx1TwoGraphic }),
  fx1Three: onStage({ tone: 'light', Graphic: Fx1ThreeGraphic }),
  fx1Mould: onStage({ tone: 'light', Graphic: Fx1MouldGraphic }),
  fx1Present: onStage({ tone: 'light', Graphic: Fx1PresentGraphic }),
  fx1Talk: onStage({ tone: 'light', Graphic: Fx1TalkGraphic, keepOnAsk: true }),
  fx1Mission: onStage({ tone: 'light', Graphic: Fx1MissionGraphic }),
  fx1Next: onStage({ tone: 'light', Graphic: Fx1NextGraphic }),
  fy1Cover: onStage({ tone: 'light', Graphic: Fy1CoverGraphic }),
  fy1Board: onStage({ tone: 'light', Graphic: Fy1BoardGraphic }),
  fy1Story: onStage({ tone: 'light', Graphic: Fy1StoryGraphic }),
  fy1Pattern: onStage({ tone: 'light', Graphic: Fy1PatternGraphic }),
  fy1Two: onStage({ tone: 'light', Graphic: Fy1TwoGraphic }),
  fy1Three: onStage({ tone: 'light', Graphic: Fy1ThreeGraphic }),
  fy1Four: onStage({ tone: 'light', Graphic: Fy1FourGraphic }),
  fy1Ladder: onStage({ tone: 'light', Graphic: Fy1LadderGraphic }),
  fy1Dictionary: onStage({ tone: 'light', Graphic: Fy1DictionaryGraphic }),
  fy1Talk: onStage({ tone: 'light', Graphic: Fy1TalkGraphic, keepOnAsk: true }),
  fy1Mission: onStage({ tone: 'light', Graphic: Fy1MissionGraphic }),
  fy1Next: onStage({ tone: 'light', Graphic: Fy1NextGraphic }),
  // Fusha · Level 3 · Lesson 2 (Kids fx2, 12+ fy2)
  fx2Cover: onStage({ tone: 'light', Graphic: Fx2CoverGraphic }),
  fx2Recall: onStage({ tone: 'light', Graphic: Fx2RecallGraphic }),
  fx2Crash: onStage({ tone: 'light', Graphic: Fx2CrashGraphic }),
  fx2Story: onStage({ tone: 'light', Graphic: Fx2StoryGraphic }),
  fx2Was: onStage({ tone: 'light', Graphic: Fx2WasGraphic }),
  fx2Switch: onStage({ tone: 'light', Graphic: Fx2SwitchGraphic }),
  fx2She: onStage({ tone: 'light', Graphic: Fx2SheGraphic }),
  fx2Gone: onStage({ tone: 'light', Graphic: Fx2GoneGraphic }),
  fx2Why: onStage({ tone: 'light', Graphic: Fx2WhyGraphic }),
  fx2Talk: onStage({ tone: 'light', Graphic: Fx2TalkGraphic, keepOnAsk: true }),
  fx2Mission: onStage({ tone: 'light', Graphic: Fx2MissionGraphic }),
  fx2Next: onStage({ tone: 'light', Graphic: Fx2NextGraphic }),
  fy2Cover: onStage({ tone: 'light', Graphic: Fy2CoverGraphic }),
  fy2News: onStage({ tone: 'light', Graphic: Fy2NewsGraphic }),
  fy2Story: onStage({ tone: 'light', Graphic: Fy2StoryGraphic }),
  fy2Past: onStage({ tone: 'light', Graphic: Fy2PastGraphic }),
  fy2Present: onStage({ tone: 'light', Graphic: Fy2PresentGraphic }),
  fy2Stand: onStage({ tone: 'light', Graphic: Fy2StandGraphic }),
  fy2Forms: onStage({ tone: 'light', Graphic: Fy2FormsGraphic }),
  fy2Missing: onStage({ tone: 'light', Graphic: Fy2MissingGraphic }),
  fy2Read: onStage({ tone: 'light', Graphic: Fy2ReadGraphic }),
  fy2Talk: onStage({ tone: 'light', Graphic: Fy2TalkGraphic, keepOnAsk: true }),
  fy2Mission: onStage({ tone: 'light', Graphic: Fy2MissionGraphic }),
  fy2Next: onStage({ tone: 'light', Graphic: Fy2NextGraphic }),
  // Fusha · Level 3 · Lesson 3 (Kids fx3, 12+ fy3)
  fx3Cover: onStage({ tone: 'light', Graphic: Fx3CoverGraphic }),
  fx3Recall: onStage({ tone: 'light', Graphic: Fx3RecallGraphic }),
  fx3Trial: onStage({ tone: 'light', Graphic: Fx3TrialGraphic }),
  fx3Story: onStage({ tone: 'light', Graphic: Fx3StoryGraphic }),
  fx3Inna: onStage({ tone: 'light', Graphic: Fx3InnaGraphic }),
  fx3Seesaw: onStage({ tone: 'light', Graphic: Fx3SeesawGraphic }),
  fx3Lakinna: onStage({ tone: 'light', Graphic: Fx3LakinnaGraphic }),
  fx3Hu: onStage({ tone: 'light', Graphic: Fx3HuGraphic }),
  fx3Verdict: onStage({ tone: 'light', Graphic: Fx3VerdictGraphic }),
  fx3Talk: onStage({ tone: 'light', Graphic: Fx3TalkGraphic, keepOnAsk: true }),
  fx3Mission: onStage({ tone: 'light', Graphic: Fx3MissionGraphic }),
  fx3Next: onStage({ tone: 'light', Graphic: Fx3NextGraphic }),
  fy3Cover: onStage({ tone: 'light', Graphic: Fy3CoverGraphic }),
  fy3Motion: onStage({ tone: 'light', Graphic: Fy3MotionGraphic }),
  fy3Story: onStage({ tone: 'light', Graphic: Fy3StoryGraphic }),
  fy3Inna: onStage({ tone: 'light', Graphic: Fy3InnaGraphic }),
  fy3Seesaw: onStage({ tone: 'light', Graphic: Fy3SeesawGraphic }),
  fy3Lakinna: onStage({ tone: 'light', Graphic: Fy3LakinnaGraphic }),
  fy3Moods: onStage({ tone: 'light', Graphic: Fy3MoodsGraphic }),
  fy3Pronouns: onStage({ tone: 'light', Graphic: Fy3PronounsGraphic }),
  fy3Six: onStage({ tone: 'light', Graphic: Fy3SixGraphic }),
  fy3Talk: onStage({ tone: 'light', Graphic: Fy3TalkGraphic, keepOnAsk: true }),
  fy3Mission: onStage({ tone: 'light', Graphic: Fy3MissionGraphic }),
  fy3Next: onStage({ tone: 'light', Graphic: Fy3NextGraphic }),
  // Egyptian · Sounds · Lesson 1
  es1Cover: onStage({ tone: 'light', Graphic: Es1CoverGraphic }),
  es1Lost: onStage({ tone: 'light', Graphic: Es1LostGraphic }),
  es1Story: onStage({ tone: 'light', Graphic: Es1StoryGraphic }),
  es1Qaf: onStage({ tone: 'light', Graphic: Es1QafGraphic }),
  es1Guess: onStage({ tone: 'light', Graphic: Es1GuessGraphic }),
  es1Keep: onStage({ tone: 'light', Graphic: Es1KeepGraphic }),
  es1Jim: onStage({ tone: 'light', Graphic: Es1JimGraphic }),
  es1Thousand: onStage({ tone: 'light', Graphic: Es1ThousandGraphic }),
  es1Sentence: onStage({ tone: 'light', Graphic: Es1SentenceGraphic }),
  es1Talk: onStage({ tone: 'light', Graphic: Es1TalkGraphic, keepOnAsk: true }),
  es1Mission: onStage({ tone: 'light', Graphic: Es1MissionGraphic }),
  es1Next: onStage({ tone: 'light', Graphic: Es1NextGraphic }),
  // Egyptian · Sounds · Lesson 2
  es2Cover: onStage({ tone: 'light', Graphic: Es2CoverGraphic }),
  es2Recall: onStage({ tone: 'light', Graphic: Es2RecallGraphic }),
  es2Gold: onStage({ tone: 'light', Graphic: Es2GoldGraphic }),
  es2Story: onStage({ tone: 'light', Graphic: Es2StoryGraphic }),
  es2Tha: onStage({ tone: 'light', Graphic: Es2ThaGraphic }),
  es2Dhal: onStage({ tone: 'light', Graphic: Es2DhalGraphic }),
  es2Book: onStage({ tone: 'light', Graphic: Es2BookGraphic }),
  es2Zha: onStage({ tone: 'light', Graphic: Es2ZhaGraphic }),
  es2Layers: onStage({ tone: 'light', Graphic: Es2LayersGraphic }),
  es2Talk: onStage({ tone: 'light', Graphic: Es2TalkGraphic, keepOnAsk: true }),
  es2Mission: onStage({ tone: 'light', Graphic: Es2MissionGraphic }),
  es2Next: onStage({ tone: 'light', Graphic: Es2NextGraphic }),
  es3Cover: onStage({ tone: 'light', Graphic: Es3CoverGraphic }),
  es3Recall: onStage({ tone: 'light', Graphic: Es3RecallGraphic }),
  es3Metro: onStage({ tone: 'light', Graphic: Es3MetroGraphic }),
  es3Story: onStage({ tone: 'light', Graphic: Es3StoryGraphic }),
  es3Endings: onStage({ tone: 'light', Graphic: Es3EndingsGraphic }),
  es3Shrink: onStage({ tone: 'light', Graphic: Es3ShrinkGraphic }),
  es3Drop: onStage({ tone: 'light', Graphic: Es3DropGraphic }),
  es3Stress: onStage({ tone: 'light', Graphic: Es3StressGraphic }),
  es3Music: onStage({ tone: 'light', Graphic: Es3MusicGraphic }),
  es3Talk: onStage({ tone: 'light', Graphic: Es3TalkGraphic, keepOnAsk: true }),
  es3Mission: onStage({ tone: 'light', Graphic: Es3MissionGraphic }),
  es3Next: onStage({ tone: 'light', Graphic: Es3NextGraphic }),
  tj2Cover: onStage({ tone: 'light', Graphic: Tj2CoverGraphic }), tj2Recall: onStage({ tone: 'light', Graphic: Tj2RecallGraphic }),
  tj2Five: onStage({ tone: 'light', Graphic: Tj2FiveGraphic }), tj2Why: onStage({ tone: 'light', Graphic: Tj2WhyGraphic }),
  tj2Small: onStage({ tone: 'light', Graphic: Tj2SmallGraphic }), tj2Big: onStage({ tone: 'light', Graphic: Tj2BigGraphic }),
  tj2Biggest: onStage({ tone: 'light', Graphic: Tj2BiggestGraphic }), tj2Mistakes: onStage({ tone: 'light', Graphic: Tj2MistakesGraphic }),
  tj2Spot: onStage({ tone: 'light', Graphic: Tj2SpotGraphic }), tj2Recite: onStage({ tone: 'light', Graphic: Tj2ReciteGraphic, keepOnAsk: true }),
  tj2Mission: onStage({ tone: 'light', Graphic: Tj2MissionGraphic }), tj2Next: onStage({ tone: 'light', Graphic: Tj2NextGraphic }),
  tj3Cover: onStage({ tone: 'light', Graphic: Tj3CoverGraphic }),
  tj3Recall: onStage({ tone: 'light', Graphic: Tj3RecallGraphic }),
  tj3Doors: onStage({ tone: 'light', Graphic: Tj3DoorsGraphic }),
  tj3Throat: onStage({ tone: 'light', Graphic: Tj3ThroatGraphic }),
  tj3Izhar: onStage({ tone: 'light', Graphic: Tj3IzharGraphic }),
  tj3Tanween: onStage({ tone: 'light', Graphic: Tj3TanweenGraphic }),
  tj3Why: onStage({ tone: 'light', Graphic: Tj3WhyGraphic }),
  tj3Mushaf: onStage({ tone: 'light', Graphic: Tj3MushafGraphic }),
  tj3Mistakes: onStage({ tone: 'light', Graphic: Tj3MistakesGraphic }),
  tj3Spot: onStage({ tone: 'light', Graphic: Tj3SpotGraphic }),
  tj3Recite: onStage({ tone: 'light', Graphic: Tj3ReciteGraphic, keepOnAsk: true }),
  tj3Mission: onStage({ tone: 'light', Graphic: Tj3MissionGraphic }),
  tj3Next: onStage({ tone: 'light', Graphic: Tj3NextGraphic }),
  ea1Cover: onStage({ tone: 'light', Graphic: Ea1CoverGraphic }), ea1Book: onStage({ tone: 'light', Graphic: Ea1BookGraphic }),
  ea1Door: onStage({ tone: 'light', Graphic: Ea1DoorGraphic }), ea1Pairs: onStage({ tone: 'light', Graphic: Ea1PairsGraphic }),
  ea1Eh: onStage({ tone: 'light', Graphic: Ea1EhGraphic }), ea1Mona: onStage({ tone: 'light', Graphic: Ea1MonaGraphic }),
  ea1Suffix: onStage({ tone: 'light', Graphic: Ea1SuffixGraphic }), ea1Hadra: onStage({ tone: 'light', Graphic: Ea1HadraGraphic }),
  ea1Sorry: onStage({ tone: 'light', Graphic: Ea1SorryGraphic }), ea1Bye: onStage({ tone: 'light', Graphic: Ea1ByeGraphic }),
  ea1Talk: onStage({ tone: 'light', Graphic: Ea1TalkGraphic, keepOnAsk: true }), ea1Mission: onStage({ tone: 'light', Graphic: Ea1MissionGraphic }),
  ea1Next: onStage({ tone: 'light', Graphic: Ea1NextGraphic }),

  ft1Cover: onStage({ tone: 'light', Graphic: Ft1CoverGraphic }),
  ft1Arrive: onStage({ tone: 'light', Graphic: Ft1ArriveGraphic }),
  ft1Listen: onStage({ tone: 'light', Graphic: Ft1ListenGraphic }),
  ft1Haadhihi: onStage({ tone: 'light', Graphic: Ft1HaadhihiGraphic }),
  ft1MaaMan: onStage({ tone: 'light', Graphic: Ft1MaaManGraphic }),
  ft1NoIs: onStage({ tone: 'light', Graphic: Ft1NoIsGraphic }),
  ft1Words: onStage({ tone: 'light', Graphic: Ft1WordsGraphic }),
  ft1Talk: onStage({ tone: 'light', Graphic: Ft1TalkGraphic, keepOnAsk: true }),
  ft1Mission: onStage({ tone: 'light', Graphic: Ft1MissionGraphic }),
  ft1Next: onStage({ tone: 'light', Graphic: Ft1NextGraphic }),

  lq1Cover: onStage({ tone: 'light', Graphic: Lq1CoverGraphic }),
  lq1Message: onStage({ tone: 'light', Graphic: Lq1MessageGraphic }),
  lq1Guess: onStage({ tone: 'light', Graphic: Lq1GuessGraphic, keepOnAsk: true }),
  lq1Alif: onStage({ tone: 'light', Graphic: Lq1AlifGraphic }),
  lq1Three: onStage({ tone: 'light', Graphic: Lq1ThreeGraphic }),
  lq1Speed: onStage({ tone: 'light', Graphic: Lq1SpeedGraphic }),
  lq1Rule: onStage({ tone: 'light', Graphic: Lq1RuleGraphic }),
  lq1Word: onStage({ tone: 'light', Graphic: Lq1WordGraphic }),
  lq1Write: onStage({ tone: 'light', Graphic: Lq1WriteGraphic, keepOnAsk: true }),
  lq1Mission: onStage({ tone: 'light', Graphic: Lq1MissionGraphic }),
  lq1Next: onStage({ tone: 'light', Graphic: Lq1NextGraphic }),

  ek1Cover: onStage({ tone: 'light', Graphic: Ek1CoverGraphic }),
  ek1Door: onStage({ tone: 'light', Graphic: Ek1DoorGraphic }),
  ek1Listen: onStage({ tone: 'light', Graphic: Ek1ListenGraphic }),
  ek1Hello: onStage({ tone: 'light', Graphic: Ek1HelloGraphic }),
  ek1Ismi: onStage({ tone: 'light', Graphic: Ek1IsmiGraphic }),
  ek1AkIk: onStage({ tone: 'light', Graphic: Ek1AkIkGraphic }),
  ek1Bye: onStage({ tone: 'light', Graphic: Ek1ByeGraphic }),
  ek1Talk: onStage({ tone: 'light', Graphic: Ek1TalkGraphic, keepOnAsk: true }),
  ek1Mission: onStage({ tone: 'light', Graphic: Ek1MissionGraphic }),
  ek1Next: onStage({ tone: 'light', Graphic: Ek1NextGraphic }),

  et1Cover: onStage({ tone: 'light', Graphic: Et1CoverGraphic }),
  et1Club: onStage({ tone: 'light', Graphic: Et1ClubGraphic }),
  et1Listen: onStage({ tone: 'light', Graphic: Et1ListenGraphic }),
  et1How: onStage({ tone: 'light', Graphic: Et1HowGraphic }),
  et1Ending: onStage({ tone: 'light', Graphic: Et1EndingGraphic }),
  et1Hi: onStage({ tone: 'light', Graphic: Et1HiGraphic }),
  et1Names: onStage({ tone: 'light', Graphic: Et1NamesGraphic }),
  et1Talk: onStage({ tone: 'light', Graphic: Et1TalkGraphic, keepOnAsk: true }),
  et1Mission: onStage({ tone: 'light', Graphic: Et1MissionGraphic }),
  et1Next: onStage({ tone: 'light', Graphic: Et1NextGraphic }),

  ek2Cover: onStage({ tone: 'light', Graphic: Ek2CoverGraphic }),
  ek2Question: onStage({ tone: 'light', Graphic: Ek2QuestionGraphic }),
  ek2Listen: onStage({ tone: 'light', Graphic: Ek2ListenGraphic }),
  ek2Minen: onStage({ tone: 'light', Graphic: Ek2MinenGraphic }),
  ek2Map: onStage({ tone: 'light', Graphic: Ek2MapGraphic }),
  ek2Masri: onStage({ tone: 'light', Graphic: Ek2MasriGraphic }),
  ek2Talk: onStage({ tone: 'light', Graphic: Ek2TalkGraphic, keepOnAsk: true }),
  ek2Mission: onStage({ tone: 'light', Graphic: Ek2MissionGraphic }),
  ek2Next: onStage({ tone: 'light', Graphic: Ek2NextGraphic }),

  et2Cover: onStage({ tone: 'light', Graphic: Et2CoverGraphic }),
  et2Shirt: onStage({ tone: 'light', Graphic: Et2ShirtGraphic }),
  et2Listen: onStage({ tone: 'light', Graphic: Et2ListenGraphic }),
  et2Minen: onStage({ tone: 'light', Graphic: Et2MinenGraphic }),
  et2Asl: onStage({ tone: 'light', Graphic: Et2AslGraphic }),
  et2Nat: onStage({ tone: 'light', Graphic: Et2NatGraphic }),
  et2Talk: onStage({ tone: 'light', Graphic: Et2TalkGraphic, keepOnAsk: true }),
  et2Mission: onStage({ tone: 'light', Graphic: Et2MissionGraphic }),
  et2Next: onStage({ tone: 'light', Graphic: Et2NextGraphic }),

  ek3Cover: onStage({ tone: 'light', Graphic: Ek3CoverGraphic }),
  ek3Box: onStage({ tone: 'light', Graphic: Ek3BoxGraphic }),
  ek3Listen: onStage({ tone: 'light', Graphic: Ek3ListenGraphic }),
  ek3DaDi: onStage({ tone: 'light', Graphic: Ek3DaDiGraphic }),
  ek3Ta: onStage({ tone: 'light', Graphic: Ek3TaGraphic }),
  ek3Things: onStage({ tone: 'light', Graphic: Ek3ThingsGraphic }),
  ek3Talk: onStage({ tone: 'light', Graphic: Ek3TalkGraphic, keepOnAsk: true }),
  ek3Mission: onStage({ tone: 'light', Graphic: Ek3MissionGraphic }),
  ek3Next: onStage({ tone: 'light', Graphic: Ek3NextGraphic }),

  et3Cover: onStage({ tone: 'light', Graphic: Et3CoverGraphic }),
  et3Bag: onStage({ tone: 'light', Graphic: Et3BagGraphic }),
  et3Listen: onStage({ tone: 'light', Graphic: Et3ListenGraphic }),
  et3DaDi: onStage({ tone: 'light', Graphic: Et3DaDiGraphic }),
  et3Ta: onStage({ tone: 'light', Graphic: Et3TaGraphic }),
  et3Stuff: onStage({ tone: 'light', Graphic: Et3StuffGraphic }),
  et3Talk: onStage({ tone: 'light', Graphic: Et3TalkGraphic, keepOnAsk: true }),
  et3Mission: onStage({ tone: 'light', Graphic: Et3MissionGraphic }),
  et3Next: onStage({ tone: 'light', Graphic: Et3NextGraphic }),

  eg1Cover: onStage({ tone: 'light', Graphic: Eg1CoverGraphic }),
  eg1Cafe: onStage({ tone: 'light', Graphic: Eg1CafeGraphic }),
  eg1Listen: onStage({ tone: 'light', Graphic: Eg1ListenGraphic }),
  eg1Im: onStage({ tone: 'light', Graphic: Eg1ImGraphic }),
  eg1Youre: onStage({ tone: 'light', Graphic: Eg1YoureGraphic }),
  eg1Name: onStage({ tone: 'light', Graphic: Eg1NameGraphic }),
  eg1Bye: onStage({ tone: 'light', Graphic: Eg1ByeGraphic }),
  eg1Talk: onStage({ tone: 'light', Graphic: Eg1TalkGraphic, keepOnAsk: true }),
  eg1Mission: onStage({ tone: 'light', Graphic: Eg1MissionGraphic }),
  eg1Next: onStage({ tone: 'light', Graphic: Eg1NextGraphic }),

  ex1Cover: onStage({ tone: 'light', Graphic: Ex1CoverGraphic }),
  ex1Short: onStage({ tone: 'light', Graphic: Ex1ShortGraphic }),
  ex1Bands: onStage({ tone: 'light', Graphic: Ex1BandsGraphic }),
  ex1Part1: onStage({ tone: 'light', Graphic: Ex1Part1Graphic }),
  ex1Are: onStage({ tone: 'light', Graphic: Ex1AreGraphic }),
  ex1Length: onStage({ tone: 'light', Graphic: Ex1LengthGraphic }),
  ex1Link: onStage({ tone: 'light', Graphic: Ex1LinkGraphic }),
  ex1Timed: onStage({ tone: 'light', Graphic: Ex1TimedGraphic, keepOnAsk: true }),
  ex1Mission: onStage({ tone: 'light', Graphic: Ex1MissionGraphic }),
  ex1Next: onStage({ tone: 'light', Graphic: Ex1NextGraphic }),

  sk1Cover: onStage({ tone: 'light', Graphic: Sk1PicCoverGraphic }),
  sk1Makkah: onStage({ tone: 'light', Graphic: Sk1PicMakkahGraphic }),
  sk1Abraha: onStage({ tone: 'light', Graphic: Sk1PicAbrahaGraphic }),
  sk1Scales: onStage({ tone: 'light', Graphic: Sk1ScalesGraphic, keepOnAsk: true }),
  sk1March: onStage({ tone: 'light', Graphic: Sk1PicMarchGraphic }),
  sk1Hills: onStage({ tone: 'light', Graphic: Sk1PicHillsGraphic }),
  sk1Kneel: onStage({ tone: 'light', Graphic: Sk1PicKneelGraphic }),
  sk1Birds: onStage({ tone: 'light', Graphic: Sk1PicBirdsGraphic }),
  sk1Fil: onStage({ tone: 'light', Graphic: Sk1PicFilGraphic }),
  sk1Baby: onStage({ tone: 'light', Graphic: Sk1PicBabyGraphic }),
  sk1Mission: onStage({ tone: 'light', Graphic: Sk1MissionGraphic }),
  sk1Next: onStage({ tone: 'light', Graphic: Sk1PicNextGraphic }),

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
  se4Cover: onStage({ tone: 'dark', Graphic: Se4CoverGraphic }),
  se4Market: onStage({ tone: 'dark', Graphic: Se4MarketGraphic }),
  se4Rope: onStage({ tone: 'dark', Graphic: Se4RopeGraphic }),
  se4Route: onStage({ tone: 'dark', Graphic: Se4RouteGraphic }),
  se4Busra: onStage({ tone: 'dark', Graphic: Se4BusraGraphic }),
  se4Cell: onStage({ tone: 'dark', Graphic: Se4CellGraphic }),
  se4Cloud: onStage({ tone: 'dark', Graphic: Se4CloudGraphic }),
  se4Feast: onStage({ tone: 'dark', Graphic: Se4FeastGraphic }),
  se4Door: onStage({ tone: 'dark', Graphic: Se4DoorGraphic, keepOnAsk: true }),
  se4Scrolls: onStage({ tone: 'dark', Graphic: Se4ScrollsGraphic }),
  se4Pass: onStage({ tone: 'dark', Graphic: Se4PassGraphic }),
  se4Lantern: onStage({ tone: 'dark', Graphic: Se4LanternGraphic }),
  se4Book: onStage({ tone: 'dark', Graphic: Se4BookGraphic }),
  se4Fork: onStage({ tone: 'dark', Graphic: Se4ForkGraphic }),
  se4Wallet: onStage({ tone: 'dark', Graphic: Se4WalletGraphic }),
  se4Mission: onStage({ tone: 'dark', Graphic: Se4MissionGraphic }),
  se4Next: onStage({ tone: 'dark', Graphic: Se4NextGraphic }),
  sk4Cover: onStage({ tone: 'light', Graphic: Sk4CoverGraphic }),
  sk4Yard: onStage({ tone: 'light', Graphic: Sk4YardGraphic }),
  sk4Road: onStage({ tone: 'light', Graphic: Sk4RoadGraphic }),
  sk4Monastery: onStage({ tone: 'light', Graphic: Sk4MonasteryGraphic }),
  sk4Cloud: onStage({ tone: 'light', Graphic: Sk4CloudGraphic }),
  sk4Tree: onStage({ tone: 'light', Graphic: Sk4TreeGraphic }),
  sk4Feast: onStage({ tone: 'light', Graphic: Sk4FeastGraphic }),
  sk4Ask: onStage({ tone: 'light', Graphic: Sk4AskGraphic, keepOnAsk: true }),
  sk4Door: onStage({ tone: 'light', Graphic: Sk4DoorGraphic }),
  sk4Mercy: onStage({ tone: 'light', Graphic: Sk4MercyGraphic }),
  sk4Back: onStage({ tone: 'light', Graphic: Sk4BackGraphic }),
  sk4Mission: onStage({ tone: 'light', Graphic: Sk4MissionGraphic }),
  sk4Next: onStage({ tone: 'light', Graphic: Sk4NextGraphic }),
  se2Cover: onStage({ tone: 'dark', Graphic: Se2CoverGraphic }),
  se2Custom: onStage({ tone: 'dark', Graphic: Se2CustomGraphic }),
  se2Drought: onStage({ tone: 'dark', Graphic: Se2DroughtGraphic }),
  se2Caravan: onStage({ tone: 'dark', Graphic: Se2CaravanGraphic }),
  se2Night: onStage({ tone: 'dark', Graphic: Se2NightGraphic }),
  se2Passed: onStage({ tone: 'dark', Graphic: Se2PassedGraphic, keepOnAsk: true }),
  se2Lanes: onStage({ tone: 'dark', Graphic: Se2LanesGraphic }),
  se2Doorway: onStage({ tone: 'dark', Graphic: Se2DoorwayGraphic }),
  se2Harith: onStage({ tone: 'dark', Graphic: Se2HarithGraphic }),
  se2Milk: onStage({ tone: 'dark', Graphic: Se2MilkGraphic }),
  se2Donkey: onStage({ tone: 'dark', Graphic: Se2DonkeyGraphic }),
  se2Green: onStage({ tone: 'dark', Graphic: Se2GreenGraphic }),
  se2Seed: onStage({ tone: 'dark', Graphic: Se2SeedGraphic }),
  se2Haze: onStage({ tone: 'dark', Graphic: Se2HazeGraphic }),
  se2Hills: onStage({ tone: 'dark', Graphic: Se2HillsGraphic }),
  se2Basin: onStage({ tone: 'dark', Graphic: Se2BasinGraphic }),
  se2Vessel: onStage({ tone: 'dark', Graphic: Se2VesselGraphic, keepOnAsk: true }),
  se2Mission: onStage({ tone: 'dark', Graphic: Se2MissionGraphic }),
  se2Next: onStage({ tone: 'dark', Graphic: Se2NextGraphic }),
  se3Cover: onStage({ tone: 'dark', Graphic: Se3CoverGraphic }),
  se3Home: onStage({ tone: 'dark', Graphic: Se3HomeGraphic }),
  se3Journey: onStage({ tone: 'dark', Graphic: Se3JourneyGraphic }),
  se3Palms: onStage({ tone: 'dark', Graphic: Se3PalmsGraphic }),
  se3Tent: onStage({ tone: 'dark', Graphic: Se3TentGraphic }),
  se3Footprints: onStage({ tone: 'dark', Graphic: Se3FootprintsGraphic, keepOnAsk: true }),
  se3WayHome: onStage({ tone: 'dark', Graphic: Se3WayHomeGraphic }),
  se3Mattress: onStage({ tone: 'dark', Graphic: Se3MattressGraphic }),
  se3Wall: onStage({ tone: 'dark', Graphic: Se3WallGraphic }),
  se3Staff: onStage({ tone: 'dark', Graphic: Se3StaffGraphic }),
  se3Chain: onStage({ tone: 'dark', Graphic: Se3ChainGraphic }),
  se3Uncle: onStage({ tone: 'dark', Graphic: Se3UncleGraphic }),
  se3Clouds: onStage({ tone: 'dark', Graphic: Se3CloudsGraphic }),
  se3Rain: onStage({ tone: 'dark', Graphic: Se3RainGraphic }),
  se3Duha: onStage({ tone: 'dark', Graphic: Se3DuhaGraphic }),
  se3Grave: onStage({ tone: 'dark', Graphic: Se3GraveGraphic }),
  se3Shoulder: onStage({ tone: 'dark', Graphic: Se3ShoulderGraphic }),
  se3Mission: onStage({ tone: 'dark', Graphic: Se3MissionGraphic }),
  se3Next: onStage({ tone: 'dark', Graphic: Se3NextGraphic }),
  sk2Cover: onStage({ tone: 'light', Graphic: Sk2CoverGraphic }),
  sk2Dry: onStage({ tone: 'light', Graphic: Sk2DryGraphic }),
  sk2Trip: onStage({ tone: 'light', Graphic: Sk2TripGraphic }),
  sk2Town: onStage({ tone: 'light', Graphic: Sk2TownGraphic }),
  sk2Ask: onStage({ tone: 'light', Graphic: Sk2AskGraphic, keepOnAsk: true }),
  sk2Door: onStage({ tone: 'light', Graphic: Sk2DoorGraphic }),
  sk2Milk: onStage({ tone: 'light', Graphic: Sk2MilkGraphic }),
  sk2Race: onStage({ tone: 'light', Graphic: Sk2RaceGraphic }),
  sk2Green: onStage({ tone: 'light', Graphic: Sk2GreenGraphic }),
  sk2Hills: onStage({ tone: 'light', Graphic: Sk2HillsGraphic }),
  sk2Basin: onStage({ tone: 'light', Graphic: Sk2BasinGraphic }),
  sk2Mission: onStage({ tone: 'light', Graphic: Sk2MissionGraphic }),
  sk2Next: onStage({ tone: 'light', Graphic: Sk2NextGraphic }),
  sk3Cover: onStage({ tone: 'light', Graphic: Sk3CoverGraphic }),
  sk3Journey: onStage({ tone: 'light', Graphic: Sk3JourneyGraphic }),
  sk3Palms: onStage({ tone: 'light', Graphic: Sk3PalmsGraphic }),
  sk3Tent: onStage({ tone: 'light', Graphic: Sk3TentGraphic }),
  sk3Ask: onStage({ tone: 'light', Graphic: Sk3AskGraphic, keepOnAsk: true }),
  sk3Rug: onStage({ tone: 'light', Graphic: Sk3RugGraphic }),
  sk3Staff: onStage({ tone: 'light', Graphic: Sk3StaffGraphic }),
  sk3Home: onStage({ tone: 'light', Graphic: Sk3HomeGraphic }),
  sk3Clouds: onStage({ tone: 'light', Graphic: Sk3CloudsGraphic }),
  sk3Rain: onStage({ tone: 'light', Graphic: Sk3RainGraphic }),
  sk3Duha: onStage({ tone: 'light', Graphic: Sk3DuhaGraphic }),
  sk3Mission: onStage({ tone: 'light', Graphic: Sk3MissionGraphic }),
  sk3Next: onStage({ tone: 'light', Graphic: Sk3NextGraphic }),
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
