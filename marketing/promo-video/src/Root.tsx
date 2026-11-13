import React from 'react';
import { Composition } from 'remotion';
import { Promo, TOTAL } from './Promo';
import { TikTok, TT_TOTAL } from './TikTok';
import { V2Ain, V2_TOTAL } from './V2Ain';
import { V3Post, V3_SLIDES } from './V3Post';
import { V4Choose, V4_TOTAL } from './V4Choose';

export const Root: React.FC = () => (
  <>
    <Composition id="Promo" component={Promo} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="TikTok" component={TikTok} durationInFrames={TT_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="V2Ain" component={V2Ain} durationInFrames={V2_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="V3Post" component={V3Post} durationInFrames={V3_SLIDES} fps={30} width={1080} height={1350} />
    <Composition id="V4Choose" component={V4Choose} durationInFrames={V4_TOTAL} fps={30} width={1080} height={1920} />
  </>
);
