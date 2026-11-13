import React from 'react';
import { AbsoluteFill, Img, Sequence, spring, staticFile, useCurrentFrame } from 'remotion';
import { CRIMSON, FPS, GOLD_SOFT, SANS, SERIF, Sfx, TEAL_DEEP, io } from './kit';
import { AR, ESPRESSO, GraphPaper, INK, Label, Logo, Paper, SAND, WHITE } from './V2Ain';
import { Border, Slide } from './V5Meal';

/**
 * V7 · "ق vs ك, the two K's" (Content Calendar, 22 Nov 2026). Voiced by the owner's own recording (public/vo-v7.mp3);
 * SC is retimed to its word timings. Syllables and two everyday words only, no ayat (RULES §1).
 * Hook: one letter turns قَلْب (heart) into كَلْب (dog). Then where each letter sits, a drill, the word test.
 */
export const V7_TOTAL = Math.round(37 * FPS);
const t = (s: number) => Math.round(s * FPS);
export const SC = { hook: 0, words: 5.5, kaf: 10.0, qaf: 16.0, drill: 22.0, test: 29.0, end: 33.0 };

/** Side view of a head with the mouth open: the tongue, the roof, and a glowing dot where the letter is made. */
const Mouth: React.FC<{ dot: 'k' | 'q' | 'both'; p: number }> = ({ dot, p }) => {
  const f = useCurrentFrame();
  const glow = 0.6 + 0.4 * Math.sin(f / 4);
  const Dot = ({ x, y, c, l }: { x: number; y: number; c: string; l: string }) => (
    <g opacity={p}>
      <circle cx={x} cy={y} r={34 * glow + 10} fill={c} opacity={0.25} />
      <circle cx={x} cy={y} r={24} fill={c} stroke="#fff" strokeWidth={6} />
      <text x={x} y={y - 50} textAnchor="middle" fontFamily="ThmanyahSerif, serif" fontSize="96" fontWeight="700" fill={c} stroke="#fff" strokeWidth={10} paintOrder="stroke">{l}</text>
    </g>
  );
  return (
    <svg width={860} height={760} viewBox="0 0 860 760" style={{ overflow: 'visible', filter: 'drop-shadow(0 14px 16px rgba(40,25,15,0.25))' }}>
      {/* the inside of the mouth, seen from the side: teeth on the left, throat on the right */}
      <path d="M60 300 C 60 150 220 110 450 110 C 640 110 760 170 790 300 L 790 740 L 640 740 L 640 470 C 520 520 300 540 60 520 Z" fill={WHITE} stroke="#fff" strokeWidth={10} />
      <path d="M90 300 C 90 180 230 150 450 150 C 620 150 730 200 750 310 L 750 740 L 680 740 L 680 450 C 540 500 300 510 90 490 Z" fill={ESPRESSO} />
      {/* roof: hard part, then the soft part at the back */}
      <path d="M90 300 C 90 180 230 150 450 150 C 540 150 600 160 640 180" stroke="#F2C9B5" strokeWidth={22} fill="none" strokeLinecap="round" />
      <path d="M640 180 C 700 210 740 250 750 320" stroke="#E8A48C" strokeWidth={22} fill="none" strokeLinecap="round" />
      {/* teeth */}
      <rect x="70" y="250" width="44" height="70" rx="12" fill="#fff" />
      <rect x="70" y="420" width="44" height="70" rx="12" fill="#fff" />
      {/* tongue */}
      <path d="M120 470 C 220 380 420 290 580 280 C 660 276 700 330 690 420 L 680 520 C 520 520 300 520 120 500 Z" fill={CRIMSON} stroke="#fff" strokeWidth={6} />
      <text x="92" y="610" fontFamily="ThmanyahSans, sans-serif" fontSize="34" fontWeight="700" fill={INK}>teeth</text>
      <text x="805" y="640" fontFamily="ThmanyahSans, sans-serif" fontSize="34" fontWeight="700" fill={INK}>throat</text>
      <text x="300" y="95" fontFamily="ThmanyahSans, sans-serif" fontSize="34" fontWeight="700" fill={INK}>roof of the mouth</text>
      {(dot === 'k' || dot === 'both') && <Dot x={580} y={215} c={TEAL_DEEP} l="ك" />}
      {(dot === 'q' || dot === 'both') && <Dot x={722} y={300} c={CRIMSON} l="ق" />}
    </svg>
  );
};

const WordCard: React.FC<{ ar: string; tr: string; en: string; icon: string; color: string; x: number; y: number; rot: number; s: number }> = ({ ar, tr, en, icon, color, x, y, rot, s }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: 440, transform: `rotate(${rot}deg) scale(${s})` }}>
    <Paper seed={'v7' + tr} x={0} y={0} w={440} h={520} color={color} rot={0}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <div style={{ fontSize: 120, lineHeight: 1 }}>{icon}</div>
        <div style={{ fontFamily: AR, fontSize: 130, color: WHITE, lineHeight: 1.3 }}>{ar}</div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 52, color: GOLD_SOFT }}>{tr}</div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: WHITE }}>{en}</div>
      </div>
    </Paper>
  </div>
);

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const flip = io(f, t(2.6), t(3.2));
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 220, textAlign: 'center' }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 70, color: INK, opacity: io(f, 0, 8) }}>Arabic has two K’s.</div>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 84, color: CRIMSON, marginTop: 14, transform: `scale(${spring({ frame: f - t(1.4), fps: FPS, config: { damping: 9 } })})` }}>
          Mix them up…
        </div>
      </div>
      <div style={{ position: 'absolute', left: 320, top: 620, width: 440, transform: `perspective(1400px) rotateY(${flip * 180}deg)`, transformStyle: 'preserve-3d' }}>
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
          <WordCard ar="قَلْب" tr="qalb" en="heart" icon="❤️" color={CRIMSON} x={0} y={0} rot={0} s={1} />
        </div>
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <WordCard ar="كَلْب" tr="kalb" en="dog" icon="🐕" color={TEAL_DEEP} x={0} y={0} rot={0} s={1} />
        </div>
      </div>
      <div style={{ position: 'absolute', top: 1260, width: '100%', textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 70, color: INK, opacity: io(f, t(3.3), t(3.7)) }}>
        …and your heart becomes a dog.
      </div>
    </AbsoluteFill>
  );
};

const Words: React.FC = () => {
  const f = useCurrentFrame();
  const a = spring({ frame: f - 2, fps: FPS, config: { damping: 12 } });
  const b = spring({ frame: f - 30, fps: FPS, config: { damping: 12 } });
  return (
    <AbsoluteFill>
      <WordCard ar="قَلْب" tr="qalb" en="heart" icon="❤️" color={CRIMSON} x={70} y={420} rot={-4} s={a} />
      <WordCard ar="كَلْب" tr="kalb" en="dog" icon="🐕" color={TEAL_DEEP} x={570} y={480} rot={4} s={b} />
      <Label at={t(3)} x={540} y={1150} text="One letter apart" size={60} />
    </AbsoluteFill>
  );
};

const Place: React.FC<{ which: 'k' | 'q' }> = ({ which }) => {
  const f = useCurrentFrame();
  const k = which === 'k';
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 210 }}>
        <div style={{ fontFamily: AR, fontSize: 180, color: k ? TEAL_DEEP : CRIMSON, lineHeight: 1.25 }}>{k ? 'ك' : 'ق'}</div>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 72, color: INK, marginTop: 0, lineHeight: 1.1 }}>
          {k ? <>The K you already know.</> : <>Further back, where you’d gargle.</>}
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 44, color: '#453D34', marginTop: 14 }}>
          {k ? 'Back of the tongue, just under the roof of the mouth. Light.' : 'The very back of the tongue, at the soft palate. Deep and heavy.'}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 110, top: 840, transform: `translateY(${(1 - spring({ frame: f - 4, fps: FPS, config: { damping: 14 } })) * 600}px)` }}>
        <Mouth dot={k ? 'k' : 'both'} p={io(f, t(1.2), t(1.6))} />
      </div>
    </AbsoluteFill>
  );
};

const DRILL = ['كَا', 'قَا', 'كَا', 'قَا'];
const Drill: React.FC = () => {
  const f = useCurrentFrame();
  const beat = 1.25;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 220, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 80, color: INK }}>Try it with me</div>
      <div style={{ position: 'absolute', left: 90, right: 90, top: 470, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        {DRILL.map((s, i) => {
          const at = t(1.0 + i * beat);
          const on = spring({ frame: f - at, fps: FPS, config: { damping: 8 } });
          const q = s.startsWith('ق');
          return (
            <div key={i} style={{ height: 360, borderRadius: 34, background: q ? CRIMSON : TEAL_DEEP, border: '10px solid #fff', boxShadow: '0 12px 20px rgba(0,0,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.6 + 0.4 * on}) rotate(${(i % 2 ? 2 : -2) * on}deg)`, opacity: Math.min(1, on * 1.4) }}>
              <span style={{ fontFamily: AR, fontSize: 190, color: WHITE, transform: q ? `translateY(${Math.sin(f / 3) * 3}px)` : undefined }}>{s}</span>
            </div>
          );
        })}
      </div>
      <Label at={t(6.0)} x={540} y={1300} text="Feel the ق sit deeper?" size={56} />
    </AbsoluteFill>
  );
};

const Test: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 220, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 80, color: INK }}>
        Now the <span style={{ color: CRIMSON, fontStyle: 'italic' }}>real test</span>
      </div>
      <WordCard ar="كَلْب" tr="kalb" en="dog" icon="🐕" color={TEAL_DEEP} x={70} y={480} rot={-4} s={spring({ frame: f - 6, fps: FPS, config: { damping: 12 } })} />
      <WordCard ar="قَلْب" tr="qalb" en="heart" icon="❤️" color={CRIMSON} x={570} y={520} rot={4} s={spring({ frame: f - t(1.6), fps: FPS, config: { damping: 9 } })} />
    </AbsoluteFill>
  );
};

const End: React.FC = () => {
  const f = useCurrentFrame();
  const bag = spring({ frame: f - 24, fps: FPS, config: { damping: 9 } });
  const zip = io(f, 40, 56);
  return (
    <AbsoluteFill>
      <Paper seed="v7end" x={70} y={300} w={940} h={520} color={ESPRESSO} rot={-1}>
        <div style={{ position: 'absolute', left: 70, right: 70, top: 110, fontFamily: SERIF, fontWeight: 700, fontSize: 84, lineHeight: 1.1, color: WHITE }}>
          Save this, and say <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>qalb</span> right tonight.
        </div>
      </Paper>
      <div style={{ position: 'absolute', left: 390, top: 900, width: 300, transform: `scale(${bag}) translateY(${(1 - bag) * -300}px)` }}>
        <Img src={staticFile('img/zaad-bag.svg')} style={{ width: 300, filter: 'drop-shadow(0 12px 16px rgba(0,0,0,0.3))' }} />
        <svg width={300} height={272} viewBox="0 0 210 190" style={{ position: 'absolute', left: 0, top: 0 }}>
          {zip > 0 && <path d={`M40 80 H${40 + 130 * zip}`} stroke={GOLD_SOFT} strokeWidth={9} strokeLinecap="round" strokeDasharray="10 7" />}
        </svg>
      </div>
      <div style={{ position: 'absolute', top: 1230, width: '100%', textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 70, color: INK, opacity: io(f, 32, 42) }}>Pack your zaad</div>
      <div style={{ position: 'absolute', top: 1340, width: '100%', display: 'flex', justifyContent: 'center', opacity: io(f, 50, 60) }}>
        <div style={{ background: CRIMSON, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 48, padding: '16px 42px', borderRadius: 999, border: '8px solid #fff', boxShadow: '0 10px 18px rgba(0,0,0,0.3)' }}>Link in bio</div>
      </div>
    </AbsoluteFill>
  );
};

export const V7Qaf: React.FC = () => {
  const seq = (a: number, b: number, el: React.ReactNode, from: 1 | -1 = 1) => (
    <Sequence from={t(a)} durationInFrames={t(b) - t(a)}><Slide dur={t(b) - t(a)} from={from}>{el}</Slide></Sequence>
  );
  const cuts = [SC.words, SC.kaf, SC.qaf, SC.drill, SC.test, SC.end];
  return (
    <AbsoluteFill>
      <GraphPaper />
      {seq(SC.hook, SC.words, <Hook />)}
      {seq(SC.words, SC.kaf, <Words />, -1)}
      {seq(SC.kaf, SC.qaf, <Place which="k" />)}
      {seq(SC.qaf, SC.drill, <Place which="q" />, -1)}
      {seq(SC.drill, SC.test, <Drill />)}
      {seq(SC.test, SC.end, <Test />, -1)}
      <Sequence from={t(SC.end)}><Slide dur={99999} from={-1}><End /></Slide></Sequence>
      <Border total={V7_TOTAL} />
      <Logo />
      {/* VO: the owner's recording goes in here once it arrives: <Audio src={staticFile('vo-v7.mp3')} /> */}
      {cuts.map((s) => <Sfx key={s} at={t(s) - 3} src="paper/slide.mp3" volume={0.35} />)}
      <Sfx at={t(2.6)} src="wv/swish-whoosh-large.wav" volume={0.3} />
      <Sfx at={t(SC.words) + 2} src="paper/slap-s.mp3" volume={0.3} />
      <Sfx at={t(SC.words) + 30} src="paper/slap-s.mp3" volume={0.3} />
      {DRILL.map((_, i) => <Sfx key={'d' + i} at={t(SC.drill + 1.0 + i * 1.25)} src="wv/pop-hand.wav" volume={0.3} />)}
      <Sfx at={t(SC.end) + 24} src="wv/pop-hand.wav" volume={0.3} />
      <Sfx at={t(SC.end) + 40} src="paper/marker-s.mp3" volume={0.3} />
    </AbsoluteFill>
  );
};
