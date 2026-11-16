import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, spring, staticFile, useCurrentFrame } from 'remotion';
import { COPPER, CRIMSON, FPS, GOLD, GOLD_SOFT, SANS, SERIF, Sfx, TEAL_DEEP, io } from './kit';
import { AR, BigCard, GraphPaper, INK, Label, Logo, Paper, SAND, WHITE } from './V2Ain';
import { Border, Slide } from './V5Meal';
import { makeVO } from './captions';
import V12W from './words-v12.json';

/**
 * V12 · "3 Quranic words you already know" (Content Calendar, 27 Nov 2026). Young adults, pillar 2.
 * Voice: public/vo-v12.mp3 (owner's English clone, eleven_v4), from 0.3 s. No ayah is recited: the ayat are shown as
 * text only (quran.ai fetch_quran, ar-uthmani-hafs) with Saheeh International (fetch_translation), checked 2026-11-16.
 * 103:3 is shown as its closing phrase with an ellipsis.
 */
const vo = makeVO(V12W as [string, number, number][]);
export const V12_TOTAL = Math.round(49.8 * FPS);
const t = (s: number) => Math.round(s * FPS);
export const SC = { hook: 0, w1: 5.8, w2: 16.8, w3: 27.5, recap: 38.7, end: 42.4 };

type W = { n: number; ar: string; tr: string; mean: string; hint: string; ayahAr: string; ayahEn: string; ref: string; color: string; at: [number, number, number, number] };
const WORDS: W[] = [
  { n: 1, ar: 'سَلَام', tr: 'Salam', mean: 'peace', hint: 'Every time you walk into a room', ayahAr: 'سَلَـٰمٌ قَوْلًا مِّن رَّبٍّ رَّحِيمٍ', ayahEn: '“Peace,” a word from a Merciful Lord.', ref: 'Ya-Sin 36:58', color: TEAL_DEEP, at: [3.9, 4.8, 5.9, 7.5] },
  { n: 2, ar: 'صَبْر', tr: 'Sabr', mean: 'patience', hint: 'Every time you were stuck in traffic', ayahAr: '… وَتَوَاصَوْا۟ بِٱلصَّبْرِ', ayahEn: '… and advised each other to patience.', ref: 'Al-Asr 103:3', color: COPPER, at: [4.3, 5.0, 6.3, 8.3] },
  { n: 3, ar: 'رَحْمَة', tr: 'Rahmah', mean: 'mercy', hint: 'In every dua you’ve heard', ayahAr: 'وَمَآ أَرْسَلْنَـٰكَ إِلَّا رَحْمَةً لِّلْعَـٰلَمِينَ', ayahEn: 'And We have not sent you, [O Muḥammad], except as a mercy to the worlds.', ref: 'Al-Anbiya 21:107', color: CRIMSON, at: [3.96, 4.5, 5.6, 7.2] },
];

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 260, textAlign: 'center' }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 66, color: INK, opacity: io(f, 0, 8), lineHeight: 1.15 }}>You already know</div>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 150, color: CRIMSON, lineHeight: 1, transform: `scale(${spring({ frame: f - t(0.9), fps: FPS, config: { damping: 8 } })})` }}>3 words</div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 66, color: INK, opacity: io(f, t(1.6), t(2.0)) }}>from the Quran.</div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 70, color: TEAL_DEEP, marginTop: 40, opacity: io(f, t(3.4), t(3.8)) }}>You just don’t know you know them.</div>
      </div>
      {[0, 1, 2].map((i) => {
        const s = spring({ frame: f - t(1.2) - i * 5, fps: FPS, config: { damping: 10 } });
        return (
          <div key={i} style={{ position: 'absolute', left: 120 + i * 290, top: 1060, width: 250, height: 330, transform: `scale(${s}) rotate(${(i - 1) * 6}deg)`, borderRadius: 26,
            background: [TEAL_DEEP, COPPER, CRIMSON][i], border: '10px solid #fff', boxShadow: '0 14px 22px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: SERIF, fontWeight: 700, fontSize: 140, color: 'rgba(255,255,255,0.85)' }}>?</div>
        );
      })}
    </AbsoluteFill>
  );
};

const Word: React.FC<{ w: W }> = ({ w }) => {
  const f = useCurrentFrame();
  const [tw, tm, ta, te] = w.at.map(t);
  const pop = spring({ frame: f - tw, fps: FPS, config: { damping: 8 } });
  const ayah = spring({ frame: f - ta, fps: FPS, config: { damping: 13 } });
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 80, top: 240, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ background: INK, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 34, borderRadius: 10, padding: '6px 16px' }}>{w.n} / 3</div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 46, color: INK, opacity: io(f, 4, 12) }}>{w.hint}…</div>
      </div>
      <Paper seed={'v12' + w.n} x={110} y={360} w={860} h={520} color={w.color} rot={w.n % 2 ? -1.5 : 1.5}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: AR, fontSize: 210, color: WHITE, lineHeight: 1.2, transform: `scale(${pop})` }}>{w.ar}</div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 70, color: GOLD_SOFT, opacity: io(f, tw, tw + 6) }}>{w.tr}</div>
        </div>
      </Paper>
      <Label at={tm} x={540} y={850} text={`= ${w.mean}`} size={64} rot={-2} />
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: Math.min(1, ayah * 1.3), transform: `translateY(${(1 - ayah) * 200}px)` }}>
        <Paper seed={'v12a' + w.n} x={80} y={1010} w={920} h={560} color={WHITE} rot={0.5}>
          <div style={{ position: 'absolute', left: 50, right: 50, top: 50, direction: 'rtl', textAlign: 'center', fontFamily: AR, fontSize: w.ayahAr.length > 30 ? 62 : 74, lineHeight: 1.7, color: INK }}>{w.ayahAr}</div>
          <div style={{ position: 'absolute', left: 60, right: 60, top: 290, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 46, lineHeight: 1.25, color: INK, opacity: io(f, te, te + 8) }}>{w.ayahEn}</div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 30, color: '#6B6158' }}>{w.ref} · Saheeh International</div>
        </Paper>
      </div>
    </AbsoluteFill>
  );
};

const Recap: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <BigCard color={SAND} seed="v12recap">
      <div style={{ display: 'flex', gap: 34, direction: 'rtl' }}>
        {WORDS.map((w, i) => (
          <div key={i} style={{ fontFamily: AR, fontSize: 120, color: INK, transform: `scale(${spring({ frame: f - i * 5, fps: FPS, config: { damping: 9 } })})` }}>{w.ar}</div>
        ))}
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 58, color: INK, marginTop: 30, opacity: io(f, t(0.9), t(1.3)) }}>You didn’t study them.</div>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 92, color: CRIMSON, opacity: io(f, t(2.0), t(2.4)) }}>You grew up with them.</div>
    </BigCard>
  );
};

const End: React.FC = () => {
  const f = useCurrentFrame();
  const bag = spring({ frame: f - 152, fps: FPS, config: { damping: 9 } });
  const zip = io(f, 162, 178);
  return (
    <AbsoluteFill>
      <Paper seed="v12end" x={70} y={280} w={940} h={600} color={TEAL_DEEP} rot={-1}>
        <div style={{ position: 'absolute', left: 70, right: 70, top: 90, fontFamily: SERIF, fontWeight: 700, fontSize: 74, lineHeight: 1.12, color: WHITE }}>
          Next time you open the Quran, look for one of them.
          <div style={{ fontSize: 62, marginTop: 24, color: GOLD_SOFT, fontStyle: 'italic', opacity: io(f, t(2.9), t(3.3)) }}>A friend on the page.</div>
        </div>
      </Paper>
      <div style={{ position: 'absolute', left: 390, top: 1000, width: 300, transform: `scale(${bag}) translateY(${(1 - bag) * -300}px)` }}>
        <Img src={staticFile('img/zaad-bag.svg')} style={{ width: 300, filter: 'drop-shadow(0 12px 16px rgba(0,0,0,0.3))' }} />
        <svg width={300} height={272} viewBox="0 0 210 190" style={{ position: 'absolute', left: 0, top: 0 }}>
          {zip > 0 && <path d={`M40 80 H${40 + 130 * zip}`} stroke={GOLD_SOFT} strokeWidth={9} strokeLinecap="round" strokeDasharray="10 7" />}
        </svg>
      </div>
      <div style={{ position: 'absolute', top: 1380, width: '100%', textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 70, color: INK, opacity: io(f, 156, 166) }}>Pack your zaad</div>
      <div style={{ position: 'absolute', top: 1490, width: '100%', display: 'flex', justifyContent: 'center', opacity: io(f, 170, 180) }}>
        <div style={{ background: GOLD, color: INK, fontFamily: SANS, fontWeight: 700, fontSize: 44, padding: '14px 40px', borderRadius: 999, border: '8px solid #fff' }}>Save this</div>
      </div>
    </AbsoluteFill>
  );
};

const V12Captions: React.FC = () => {
  const f = useCurrentFrame();
  return f >= t(SC.w1) && f < t(SC.recap) ? <vo.Captions dark={() => false} top={1640} /> : null;
};

export const V12Words: React.FC = () => {
  const seq = (a: number, b: number, el: React.ReactNode, from: 1 | -1 = 1) => (
    <Sequence from={t(a)} durationInFrames={t(b) - t(a)}><Slide dur={t(b) - t(a)} from={from}>{el}</Slide></Sequence>
  );
  const cuts = [SC.w1, SC.w2, SC.w3, SC.recap, SC.end];
  return (
    <AbsoluteFill>
      <GraphPaper />
      {seq(SC.hook, SC.w1, <Hook />)}
      {seq(SC.w1, SC.w2, <Word w={WORDS[0]} />, -1)}
      {seq(SC.w2, SC.w3, <Word w={WORDS[1]} />)}
      {seq(SC.w3, SC.recap, <Word w={WORDS[2]} />, -1)}
      {seq(SC.recap, SC.end, <Recap />)}
      <Sequence from={t(SC.end)}><Slide dur={99999} from={-1}><End /></Slide></Sequence>
      <Border total={V12_TOTAL} />
      <Logo />
      <V12Captions />
      <Sequence from={9}><Audio src={staticFile('vo-v12.mp3')} /></Sequence>
      {cuts.map((s) => <Sfx key={s} at={t(s) - 3} src="paper/slide.mp3" volume={0.16} />)}
      <Sfx at={t(0.9)} src="wv/pop-hand.wav" volume={0.16} />
      {[SC.w1, SC.w2, SC.w3].map((s, i) => <Sfx key={'m' + s} at={t(s + WORDS[i].at[1])} src="paper/marker-s.mp3" volume={0.16} />)}
      <Sfx at={t(SC.end) + 152} src="wv/pop-hand.wav" volume={0.16} />
      <Sfx at={t(SC.end) + 162} src="paper/marker-s.mp3" volume={0.16} />
    </AbsoluteFill>
  );
};
