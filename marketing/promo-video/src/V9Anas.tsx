import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import { CRIMSON, FPS, GOLD, GOLD_SOFT, SANS, SERIF, Sfx, TEAL_DEEP, clamp, io } from './kit';
import { AR, BigCard, ESPRESSO, GraphPaper, INK, Label, Logo, Marker, Paper, SAND, WHITE } from './V2Ain';
import { Border, Slide } from './V5Meal';
import { makeVO } from './captions';
import V9W from './words-v9.json';

/**
 * V9 · "Ten years, not one uff" (Content Calendar, 24 Nov 2026). Parents of children, pillar 2.
 * Voice: public/vo-v9.mp3 = owner's English clone + the hadith in the Fusha clone, from 0.3 s.
 * Hadith: Sahih al-Bukhari 6038 (also Muslim 2309), wording checked 2026-11-16. Only the verified opening is shown.
 * Retention method: a moment (a spill) → the consequence (kids remember the sigh) → the turn (Anas, ten years,
 * not one "uff") → one thing tonight (swap the sigh for a question). No people drawn: objects only (content RULES §1.5).
 */
const vo = makeVO(V9W as [string, number, number][]);
export const V9_TOTAL = Math.round(58.8 * FPS);
const t = (s: number) => Math.round(s * FPS);
export const SC = { hook: 0, sigh: 6.2, story: 15.6, hadith: 21.9, once: 35.9, tonight: 41.3, end: 50.7 };

/** A cup that tips over and spills. */
const Cup: React.FC<{ tip: number; spill: number }> = ({ tip, spill }) => (
  <svg width={760} height={560} viewBox="0 0 760 560" style={{ position: 'absolute', left: 160, top: 640 }}>
    <ellipse cx={380 + 140 * spill} cy={470} rx={40 + 250 * spill} ry={14 + 46 * spill} fill="#C9A27A" opacity={0.85 * Math.min(1, spill * 3)} />
    <g transform={`rotate(${tip * 88} 300 440)`}>
      <path d="M220 220 L380 220 L360 440 L240 440 Z" fill={WHITE} stroke={INK} strokeWidth={10} strokeLinejoin="round" />
      <path d="M380 270 C 450 270 450 380 372 380" fill="none" stroke={INK} strokeWidth={10} />
      <path d="M226 250 L374 250" stroke={TEAL_DEEP} strokeWidth={14} opacity={1 - spill} />
    </g>
  </svg>
);

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const tip = spring({ frame: f - t(1.9), fps: FPS, config: { damping: 10, mass: 0.8 } });
  const spill = io(f, t(2.1), t(3.2));
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 250, textAlign: 'center' }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 62, color: INK, opacity: io(f, 0, 8), lineHeight: 1.15 }}>The last time your child spilled something…</div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 82, color: CRIMSON, marginTop: 24, lineHeight: 1.1,
          transform: `scale(${spring({ frame: f - t(4.0), fps: FPS, config: { damping: 9 } })})` }}>what was the first sound you made?</div>
      </div>
      <Cup tip={tip} spill={spill} />
    </AbsoluteFill>
  );
};

const Sigh: React.FC = () => {
  const f = useCurrentFrame();
  const bub = spring({ frame: f - t(2.8), fps: FPS, config: { damping: 9 } });
  const grey = io(f, t(5.8), t(6.6));
  return (
    <AbsoluteFill>
      <Paper seed="v9sigh" x={60} y={260} w={960} h={1080} color={ESPRESSO} rot={-1}>
        <div style={{ position: 'absolute', left: 70, right: 70, top: 70, fontFamily: SANS, fontWeight: 700, fontSize: 54, color: GOLD_SOFT, opacity: io(f, 4, 14) }}>For most of us, it’s a sigh.</div>
      </Paper>
      <div style={{ position: 'absolute', left: 150, top: 470, width: 780, transform: `scale(${bub}) rotate(${-3 * bub}deg)`, transformOrigin: '20% 100%', filter: `grayscale(${grey})` }}>
        <svg width={780} height={560} viewBox="0 0 780 560">
          <path d="M60 40 H720 Q760 40 760 80 V380 Q760 420 720 420 H260 L140 530 L170 420 H60 Q20 420 20 380 V80 Q20 40 60 40 Z" fill={WHITE} stroke={INK} strokeWidth={10} />
        </svg>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 170, color: CRIMSON, lineHeight: 1 }}>Ugh.</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 270, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 56, color: INK, opacity: io(f, t(3.6), t(3.9)) }}>Why did you do that?</div>
      </div>
      <Label at={t(5.9)} x={540} y={1130} text="They remember the sigh." size={56} rot={2} />
    </AbsoluteFill>
  );
};

/** Palm trees and flat roofs, a quiet Madinah-like skyline (no people, no buildings of worship). */
const Skyline: React.FC = () => (
  <svg width={1000} height={360} viewBox="0 0 1000 360" style={{ position: 'absolute', left: 40, top: 860 }}>
    <path d="M0 360 V250 H120 V200 H260 V260 H380 V180 H520 V240 H660 V210 H800 V260 H1000 V360 Z" fill="rgba(0,0,0,0.22)" />
  </svg>
);

const Story: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.round(interpolate(f, [t(2.9), t(3.8)], [1, 10], clamp));
  return (
    <BigCard color={TEAL_DEEP} seed="v9story">
      <Skyline />
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 64, color: WHITE, opacity: io(f, 2, 10) }}>A boy named <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: GOLD_SOFT }}>Anas</span></div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 52, color: WHITE, opacity: io(f, t(0.9), t(1.3)), marginTop: 10 }}>served the Prophet</div>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 260, color: GOLD_SOFT, lineHeight: 1, marginTop: 20, opacity: io(f, t(2.8), t(3.0)) }}>{n}</div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 80, color: WHITE, opacity: io(f, t(3.4), t(3.7)) }}>years.</div>
      </div>
    </BigCard>
  );
};

const Hadith: React.FC = () => {
  const f = useCurrentFrame();
  const card = spring({ frame: f, fps: FPS, config: { damping: 14 } });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `translateY(${(1 - card) * 400}px)` }}>
        <Paper seed="v9had" x={70} y={300} w={940} h={1060} color={WHITE} rot={0.6}>
          <div style={{ position: 'absolute', left: 60, right: 60, top: 80, direction: 'rtl', textAlign: 'center', fontFamily: AR, fontSize: 84, lineHeight: 1.7, color: INK }}>
            خَدَمْتُ النَّبِيَّ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ عَشْرَ سِنِينَ، فَمَا قَالَ لِي: <span style={{ color: CRIMSON }}>أُفٍّ</span>
          </div>
          <div style={{ position: 'absolute', left: 120, right: 120, top: 600, height: 6, background: GOLD, opacity: io(f, t(6.6), t(7.0)) }} />
          <div style={{ position: 'absolute', left: 70, right: 70, top: 650, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 62, lineHeight: 1.25, color: INK,
            opacity: io(f, t(6.8), t(7.3)) }}>
            “I served the Prophet for ten years, and he never said to me: <span style={{ color: CRIMSON }}>uff</span>.”
          </div>
        </Paper>
      </div>
      <Label at={t(12.5)} x={540} y={1300} text="Sahih al-Bukhari 6038" size={50} rot={-1.5} />
    </AbsoluteFill>
  );
};

const Once: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <BigCard color={CRIMSON} seed="v9once">
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 120, color: WHITE, opacity: io(f, 2, 10) }}>Not once.</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 30, marginTop: 30 }}>
        <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 130, color: GOLD_SOFT }}>uff</span>
        <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 240, color: WHITE, transform: `scale(${spring({ frame: f - t(1.2), fps: FPS, config: { damping: 7 } })})`, display: 'inline-block' }}>× 0</span>
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 50, color: WHITE, marginTop: 30, opacity: io(f, t(1.2), t(1.6)) }}>ten years of a boy’s mistakes</div>
    </BigCard>
  );
};

const Tonight: React.FC = () => {
  const f = useCurrentFrame();
  const strike = io(f, t(4.0), t(4.6));
  const lines = (y: number) => <div style={{ position: 'absolute', left: 60, right: 60, top: y, height: 3, background: 'rgba(8,125,145,0.25)' }} />;
  return (
    <AbsoluteFill>
      <Paper seed="v9note" x={110} y={270} w={860} h={1140} color={WHITE} rot={-1.2}>
        {[260, 400, 540, 680, 820, 960].map((y) => <React.Fragment key={y}>{lines(y)}</React.Fragment>)}
        <div style={{ position: 'absolute', left: 70, top: 70, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 76, color: TEAL_DEEP }}>Tonight:</div>
        <div style={{ position: 'absolute', left: 70, top: 200, fontFamily: SANS, fontWeight: 700, fontSize: 52, color: INK, opacity: io(f, t(1.2), t(1.6)) }}>when something spills…</div>
        <div style={{ position: 'absolute', left: 70, top: 330, fontFamily: SERIF, fontWeight: 700, fontSize: 96, color: '#8C8279', opacity: io(f, t(2.6), t(3.0)) }}>“Ugh.”</div>
        <Marker d="M60 400 L330 380" p={strike} w={16} />
        <div style={{ position: 'absolute', left: 70, top: 480, fontFamily: SERIF, fontWeight: 700, fontSize: 104, color: CRIMSON, lineHeight: 1.05,
          transform: `scale(${spring({ frame: f - t(6.2), fps: FPS, config: { damping: 9 } })})`, transformOrigin: '0 50%' }}>“Are you okay?”</div>
        <div style={{ position: 'absolute', left: 70, top: 720, fontFamily: SANS, fontWeight: 700, fontSize: 52, color: INK, opacity: io(f, t(7.3), t(7.7)) }}>Then clean it up together.</div>
      </Paper>
    </AbsoluteFill>
  );
};

const End: React.FC = () => {
  const f = useCurrentFrame();
  const bag = spring({ frame: f - 168, fps: FPS, config: { damping: 9 } });
  const zip = io(f, 178, 196);
  return (
    <AbsoluteFill>
      <Paper seed="v9end" x={70} y={280} w={940} h={600} color={TEAL_DEEP} rot={-1}>
        <div style={{ position: 'absolute', left: 70, right: 70, top: 90, fontFamily: SERIF, fontWeight: 700, fontSize: 80, lineHeight: 1.12, color: WHITE }}>
          Ten years without one <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>uff.</span>
          <div style={{ fontSize: 62, marginTop: 24, opacity: io(f, t(2.1), t(2.5)) }}>We can manage one evening.</div>
        </div>
      </Paper>
      <Label at={t(4.6)} x={540} y={940} text="Save this" size={62} rot={-3} />
      <div style={{ position: 'absolute', left: 390, top: 1080, width: 300, transform: `scale(${bag}) translateY(${(1 - bag) * -300}px)` }}>
        <Img src={staticFile('img/zaad-bag.svg')} style={{ width: 300, filter: 'drop-shadow(0 12px 16px rgba(0,0,0,0.3))' }} />
        <svg width={300} height={272} viewBox="0 0 210 190" style={{ position: 'absolute', left: 0, top: 0 }}>
          {zip > 0 && <path d={`M40 80 H${40 + 130 * zip}`} stroke={GOLD_SOFT} strokeWidth={9} strokeLinecap="round" strokeDasharray="10 7" />}
        </svg>
      </div>
      <div style={{ position: 'absolute', top: 1440, width: '100%', textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 70, color: INK, opacity: io(f, 172, 182) }}>Pack your zaad</div>
    </AbsoluteFill>
  );
};

/** Captions in the lower third, except on the hadith card and the end card (both carry the words as big type). */
const V9Captions: React.FC = () => {
  const f = useCurrentFrame();
  const off = (f >= t(SC.hadith) && f < t(SC.once)) || f >= t(SC.end);
  return off ? null : <vo.Captions dark={() => false} top={1560} />;
};

export const V9Anas: React.FC = () => {
  const seq = (a: number, b: number, el: React.ReactNode, from: 1 | -1 = 1) => (
    <Sequence from={t(a)} durationInFrames={t(b) - t(a)}><Slide dur={t(b) - t(a)} from={from}>{el}</Slide></Sequence>
  );
  const cuts = [SC.sigh, SC.story, SC.hadith, SC.once, SC.tonight, SC.end];
  return (
    <AbsoluteFill>
      <GraphPaper />
      {seq(SC.hook, SC.sigh, <Hook />)}
      {seq(SC.sigh, SC.story, <Sigh />, -1)}
      {seq(SC.story, SC.hadith, <Story />)}
      {seq(SC.hadith, SC.once, <Hadith />, -1)}
      {seq(SC.once, SC.tonight, <Once />)}
      {seq(SC.tonight, SC.end, <Tonight />, -1)}
      <Sequence from={t(SC.end)}><Slide dur={99999} from={1}><End /></Slide></Sequence>
      <Border total={V9_TOTAL} />
      <Logo />
      <V9Captions />
      <Sequence from={9}><Audio src={staticFile('vo-v9.mp3')} /></Sequence>
      {/* effects 14-20 dB under the voice; none while the hadith is read */}
      {cuts.filter((s) => s !== SC.once).map((s) => <Sfx key={s} at={t(s) - 3} src="paper/slide.mp3" volume={0.16} />)}
      <Sfx at={t(2.0)} src="wv/dull-thud.wav" volume={0.18} />
      <Sfx at={t(SC.sigh + 2.8)} src="paper/slap-s.mp3" volume={0.16} />
      <Sfx at={t(SC.story + 3.8)} src="wv/tick-sound.wav" volume={0.12} />
      <Sfx at={t(SC.once + 1.2)} src="wv/bass-impact.wav" volume={0.15} />
      <Sfx at={t(SC.tonight + 4.0)} src="paper/marker-s.mp3" volume={0.18} />
      <Sfx at={t(SC.end) + 168} src="wv/pop-hand.wav" volume={0.16} />
      <Sfx at={t(SC.end) + 178} src="paper/marker-s.mp3" volume={0.16} />
    </AbsoluteFill>
  );
};
