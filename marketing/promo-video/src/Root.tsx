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

export const Root: React.FC = () => (
  <>
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
  </>
);
