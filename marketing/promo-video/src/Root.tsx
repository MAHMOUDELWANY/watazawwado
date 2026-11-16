import React from 'react';
import { Composition } from 'remotion';
import { Promo, TOTAL } from './Promo';
import { TikTok, TT_TOTAL } from './TikTok';
import { V2Ain, V2_TOTAL } from './V2Ain';
import { V3Post, V3_SLIDES } from './V3Post';
import { V4Choose, V4_TOTAL } from './V4Choose';
import { V5Meal, V5_TOTAL } from './V5Meal';
import { V6Back, V6_SLIDES } from './V6Back';
import { V7Qaf, V7_TOTAL } from './V7Qaf';
import { V8Why, V8_SLIDES } from './V8Why';
import { V9Anas, V9_TOTAL } from './V9Anas';
import { V10Screen, V10_SLIDES } from './V10Screen';
import { V11How, V11_SLIDES } from './V11How';
import { V12Words, V12_TOTAL } from './V12Words';
import { V13Madd, V13_SLIDES } from './V13Madd';
import { V14Audience, V14_SLIDES } from './V14Audience';
import { Thumbs, THUMBS } from './Thumbs';
import { V15Ask, V15_SLIDES } from './V15Ask';
import { C1Questions, C1_SLIDES } from './C1Questions';
import { C3Teacher, C3_SLIDES, C6Back, C6_SLIDES, C8Why, C8_SLIDES } from './Carousels';
import { C10Screen, C10_SLIDES, C11How, C11_SLIDES, C13Madd, C13_SLIDES, C14Audience, C14_SLIDES, C15Ask, C15_SLIDES } from './Carousels2';
import { R4Choose, R4_TOTAL } from './R4Choose';
import { R5Meal, R5_TOTAL } from './R5Meal';
import { R9Anas, R9_TOTAL } from './R9Anas';
import { R12Words, R12_TOTAL } from './R12Words';
import { R2Ain, R2_TOTAL } from './R2Ain';
import { R7Qaf, R7_TOTAL } from './R7Qaf';
import { ZadClip, zadClipSeconds, type ZadClipProps } from './ZadClip';

export const Root: React.FC = () => (
  <>
    <Composition id="R4Choose" component={R4Choose} durationInFrames={R4_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="R5Meal" component={R5Meal} durationInFrames={R5_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="R9Anas" component={R9Anas} durationInFrames={R9_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="R12Words" component={R12Words} durationInFrames={R12_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="R2Ain" component={R2Ain} durationInFrames={R2_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="R7Qaf" component={R7Qaf} durationInFrames={R7_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="ZadClip" component={ZadClip} fps={30} width={900} height={900} durationInFrames={90}
      defaultProps={{ emote: 'wave' } as ZadClipProps}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.round(zadClipSeconds(props.emote, props.lead) * 30) })} />
    <Composition id="Promo" component={Promo} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="TikTok" component={TikTok} durationInFrames={TT_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="V2Ain" component={V2Ain} durationInFrames={V2_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="V3Post" component={V3Post} durationInFrames={V3_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="V4Choose" component={V4Choose} durationInFrames={V4_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="V5Meal" component={V5Meal} durationInFrames={V5_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="V6Back" component={V6Back} durationInFrames={V6_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="V7Qaf" component={V7Qaf} durationInFrames={V7_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="V8Why" component={V8Why} durationInFrames={V8_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="V9Anas" component={V9Anas} durationInFrames={V9_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="V10Screen" component={V10Screen} durationInFrames={V10_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="V11How" component={V11How} durationInFrames={V11_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="V12Words" component={V12Words} durationInFrames={V12_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="V13Madd" component={V13Madd} durationInFrames={V13_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="V14Audience" component={V14Audience} durationInFrames={V14_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="V15Ask" component={V15Ask} durationInFrames={V15_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="C1Questions" component={C1Questions} durationInFrames={C1_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="C3Teacher" component={C3Teacher} durationInFrames={C3_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="C6Back" component={C6Back} durationInFrames={C6_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="C8Why" component={C8Why} durationInFrames={C8_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="C10Screen" component={C10Screen} durationInFrames={C10_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="C11How" component={C11How} durationInFrames={C11_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="C13Madd" component={C13Madd} durationInFrames={C13_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="C14Audience" component={C14Audience} durationInFrames={C14_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="C15Ask" component={C15Ask} durationInFrames={C15_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="Thumbs" component={Thumbs} durationInFrames={THUMBS.length} fps={30} width={1080} height={1920} />
  </>
);
