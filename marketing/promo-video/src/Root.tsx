import React from 'react';
import { Composition } from 'remotion';
import { Promo, TOTAL } from './Promo';
import { TikTok, TT_TOTAL } from './TikTok';
import { V2Ain, V2_TOTAL } from './V2Ain';

export const Root: React.FC = () => (
  <>
    <Composition id="Promo" component={Promo} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="TikTok" component={TikTok} durationInFrames={TT_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="V2Ain" component={V2Ain} durationInFrames={V2_TOTAL} fps={30} width={1080} height={1920} />
  </>
);
