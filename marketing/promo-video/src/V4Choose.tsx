import React from 'react';
import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import { COPPER, CRIMSON, FPS, GOLD, GOLD_SOFT, SANS, SERIF, Sfx, TEAL_DEEP, clamp, io } from './kit';
import { BigCard, ESPRESSO, GraphPaper, INK, Label, Logo, Paper, SAND, WHITE } from './V2Ain';

/**
 * V4 · "You choose the teacher" (Content Calendar, 19 Nov 2026). Voice-free, on-screen text and sound only.
 * Retention method: a moment (a stranger logs in) → the consequence (you meet them when your child does) →
 * what changes here (you choose first, from the real onboarding step) → one thing to do (ask to see the person).
 * The onboarding card copies the real step (StudentOnboardingPage "Choose your teacher"), example data only.
 * The female teacher is mentioned in words, never shown (content RULES §4.3).
 */
export const V4_TOTAL = Math.round(25 * FPS);
const t = (s: number) => Math.round(s * FPS);
const SC = { hook: 0, cons: 3.6, flip: 7.6, pick: 9.8, ask: 18.0, end: 21.2 };

const Border: React.FC = () => {
  const f = useCurrentFrame();
  const p = Math.min(1, f / (V4_TOTAL - 1));
  const m = 14, r = 44;
  const d = `M 540 ${m} H ${1080 - m - r} A ${r} ${r} 0 0 1 ${1080 - m} ${m + r} V ${1920 - m - r} A ${r} ${r} 0 0 1 ${1080 - m - r} ${1920 - m}
    H ${m + r} A ${r} ${r} 0 0 1 ${m} ${1920 - m - r} V ${m + r} A ${r} ${r} 0 0 1 ${m + r} ${m} H 540`;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs><linearGradient id="prog4" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={CRIMSON} /><stop offset="0.4" stopColor={COPPER} /><stop offset="0.7" stopColor={GOLD} /><stop offset="1" stopColor={TEAL_DEEP} /></linearGradient></defs>
      <path d={d} fill="none" stroke="rgba(27,21,18,0.10)" strokeWidth={10} />
      <path d={d} fill="none" stroke="url(#prog4)" strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
    </svg>
  );
};

const Slide: React.FC<{ dur: number; children: React.ReactNode; from?: 1 | -1 }> = ({ dur, children, from = 1 }) => {
  const f = useCurrentFrame();
  const inP = spring({ frame: f, fps: FPS, config: { damping: 15, mass: 0.7 } });
  const outP = io(f, dur - 7, dur, 0, 1, (n) => n * n);
  return <AbsoluteFill style={{ transform: `translateX(${from * (1 - inP) * 1100 - outP * 1200 * from}px) rotate(${(1 - inP) * 4 * from - outP * 3}deg) scale(${1 + (f / Math.max(dur, 1)) * 0.05})` }}>{children}</AbsoluteFill>;
};

/** A video-call tile with a question-mark silhouette. */
const CallTile: React.FC<{ x: number; y: number; w: number; label: string; who?: 'stranger' | 'you' }> = ({ x, y, w, label, who = 'stranger' }) => {
  const h = w * 0.75;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 26, background: who === 'stranger' ? '#5A514A' : '#8C7D6E', border: '10px solid #fff',
      boxShadow: '0 14px 22px rgba(0,0,0,0.3)', overflow: 'hidden', filter: who === 'stranger' ? 'grayscale(1)' : 'none' }}>
      <svg width={w} height={h} viewBox="0 0 400 300">
        <circle cx="200" cy="120" r="56" fill={INK} />
        <path d="M100 300 C 110 220 160 190 200 190 C 240 190 290 220 300 300 Z" fill={INK} />
        {who === 'stranger' && <text x="200" y="142" textAnchor="middle" fontFamily="Georgia" fontWeight="700" fontSize="70" fill="#8C8279">?</text>}
      </svg>
      <div style={{ position: 'absolute', left: 16, bottom: 14, background: 'rgba(0,0,0,0.55)', color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 26, borderRadius: 8, padding: '4px 12px' }}>{label}</div>
    </div>
  );
};

const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const tile = spring({ frame: f - t(1.6), fps: FPS, config: { damping: 10 } });
  return (
    <AbsoluteFill>
      <BigCard color={SAND} seed="v4hook">
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 64, color: INK, opacity: io(f, 0, 8), textAlign: 'center' }}>Your child’s first Quran class.</div>
        <div style={{ height: 480 }} />
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 84, color: CRIMSON, whiteSpace: 'nowrap', transform: `scale(${spring({ frame: f - t(2.2), fps: FPS, config: { damping: 9 } })})` }}>A stranger logs in.</div>
      </BigCard>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${tile})`, transformOrigin: '540px 900px' }}>
        <CallTile x={320} y={650} w={440} label="Teacher" />
      </div>
    </AbsoluteFill>
  );
};

const Cons: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Paper seed="v4cons" x={60} y={330} w={960} h={900} color={ESPRESSO} rot={-1}>{null}</Paper>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `translateY(${(1 - spring({ frame: f - 3, fps: FPS, config: { damping: 12 } })) * 300}px)` }}>
        <CallTile x={110} y={440} w={420} label="Teacher" />
        <CallTile x={560} y={520} w={400} label="Your child" who="you" />
      </div>
      <div style={{ position: 'absolute', left: 110, right: 110, top: 900, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 70, color: WHITE, lineHeight: 1.12,
        opacity: io(f, 12, 22) }}>You meet the teacher at the same moment your child does.</div>
    </AbsoluteFill>
  );
};

const Flip: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <BigCard color={CRIMSON} seed="v4flip">
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 90, color: WHITE }}>Here, you meet them</div>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 240, color: GOLD_SOFT, lineHeight: 1, transform: `scale(${spring({ frame: f - 14, fps: FPS, config: { damping: 8 } })})` }}>first.</div>
    </BigCard>
  );
};

/** The real onboarding step, drawn as a phone screen with example data. */
const Pick: React.FC = () => {
  const f = useCurrentFrame();
  const L = (s: number) => t(s - SC.pick);
  const phone = spring({ frame: f, fps: FPS, config: { damping: 14 } });
  const cur = { x: interpolate(f, [L(11.6), L(12.6)], [820, 470], { ...clamp, easing: (n) => 1 - (1 - n) ** 3 }), y: interpolate(f, [L(11.6), L(12.6)], [1500, 700], { ...clamp, easing: (n) => 1 - (1 - n) ** 3 }) };
  const tap = f >= L(12.75);
  const tapK = interpolate(f, [L(12.75), L(12.85), L(13.1)], [0, 1, 0], clamp);
  const chat = spring({ frame: f - L(14.2), fps: FPS, config: { damping: 11 } });
  const card = (y: number, selected: boolean, children: React.ReactNode) => (
    <div style={{ position: 'absolute', left: 40, right: 40, top: y, height: 190, borderRadius: 28, background: WHITE, border: `5px solid ${selected ? CRIMSON : 'rgba(27,21,18,0.12)'}`,
      boxShadow: selected ? `0 0 0 8px rgba(197,31,36,0.15), 0 12px 20px rgba(0,0,0,0.12)` : '0 6px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 26, padding: '0 28px',
      transform: `scale(${selected ? 1 + tapK * 0.04 : 1})` }}>{children}</div>
  );
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 160, top: 250, width: 760, height: 1180, borderRadius: 70, background: INK, padding: 22, transform: `translateY(${(1 - phone) * 900}px) rotate(${-2 + (1 - phone) * 8}deg)`,
        boxShadow: '0 30px 60px rgba(40,25,15,0.4)' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 52, background: '#FAF7F2', overflow: 'hidden' }}>
          <div style={{ padding: '70px 40px 0' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 46, color: INK }}>Choose your teacher</div>
            <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 27, color: '#6B6158', marginTop: 12, lineHeight: 1.35 }}>
              These teachers teach this subject and have free time. Your teacher gets your sign-up and a chat opens between you.
            </div>
          </div>
          {card(330, tap, (
            <>
              <Img src={staticFile('img/ustadh-mahmoud.jpg')} style={{ width: 120, height: 120, borderRadius: 99, objectFit: 'cover', border: `4px solid ${GOLD}` }} />
              <div>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, color: INK }}>Ustadh Mahmoud</div>
                <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 24, color: '#6B6158', marginTop: 6 }}>Quran · Tajweed · Arabic · Zad Path</div>
              </div>
              {tap && <div style={{ marginLeft: 'auto', width: 56, height: 56, borderRadius: 99, background: CRIMSON, color: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 700 }}>✓</div>}
            </>
          ))}
          {card(545, false, (
            <>
              <div style={{ width: 120, height: 120, borderRadius: 99, background: '#E8E1D4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 56, color: TEAL_DEEP, fontWeight: 700 }}>✦</div>
              <div>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, color: INK }}>A female teacher</div>
                <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 24, color: '#6B6158', marginTop: 6 }}>if you’d rather</div>
              </div>
            </>
          ))}
          {/* the chat that opens */}
          <div style={{ position: 'absolute', left: 40, right: 40, top: 790, opacity: chat, transform: `translateY(${(1 - chat) * 80}px)` }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24, color: '#6B6158', marginBottom: 12 }}>Chat · Ustadh Mahmoud</div>
            <div style={{ background: TEAL_DEEP, color: WHITE, borderRadius: '26px 26px 26px 8px', padding: '20px 26px', fontFamily: SANS, fontWeight: 500, fontSize: 30, lineHeight: 1.3, maxWidth: 560 }}>
              Salam! Tell me a little about Yusuf before our first lesson.
            </div>
          </div>
        </div>
      </div>
      <Label at={L(14.4)} x={760} y={1300} text="Example" size={34} rot={4} under={false} />
      {/* cursor */}
      {f >= L(11.5) && f < L(15) && (
        <svg width={90} height={110} viewBox="0 0 90 110" style={{ position: 'absolute', left: cur.x, top: cur.y, transform: `scale(${1 - tapK * 0.15})`, filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.3))' }}>
          <path d="M8 6 L8 86 L28 68 L42 100 L56 94 L42 62 L68 62 Z" fill={WHITE} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        </svg>
      )}
      {tapK > 0 && <div style={{ position: 'absolute', left: 470 - 60 * tapK, top: 700 - 60 * tapK, width: 120 * tapK, height: 120 * tapK, borderRadius: 99, border: `6px solid ${CRIMSON}`, opacity: 1 - tapK * 0.5 }} />}
    </AbsoluteFill>
  );
};

const Ask: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <BigCard color={WHITE} seed="v4ask">
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 60, color: INK, opacity: io(f, 0, 8) }}>wherever you book,</div>
      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 120, color: INK, lineHeight: 1.05, textAlign: 'center', marginTop: 20 }}>ask to see</div>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 170, color: CRIMSON, lineHeight: 1, transform: `scale(${spring({ frame: f - 14, fps: FPS, config: { damping: 8 } })})` }}>the person.</div>
    </BigCard>
  );
};

const End: React.FC = () => {
  const f = useCurrentFrame();
  const bag = spring({ frame: f - 30, fps: FPS, config: { damping: 9 } });
  const zip = io(f, 44, 60);
  return (
    <AbsoluteFill>
      <Paper seed="v4end" x={70} y={300} w={940} h={520} color={TEAL_DEEP} rot={-1}>
        <div style={{ position: 'absolute', left: 70, right: 70, top: 110, fontFamily: SERIF, fontWeight: 700, fontSize: 84, lineHeight: 1.1, color: WHITE }}>
          Nobody should learn their deen from a <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>stranger.</span>
        </div>
      </Paper>
      <div style={{ position: 'absolute', left: 390, top: 900, width: 300, transform: `scale(${bag}) translateY(${(1 - bag) * -300}px)` }}>
        <Img src={staticFile('img/zaad-bag.svg')} style={{ width: 300, filter: 'drop-shadow(0 12px 16px rgba(0,0,0,0.3))' }} />
        <svg width={300} height={272} viewBox="0 0 210 190" style={{ position: 'absolute', left: 0, top: 0 }}>
          {zip > 0 && <path d={`M40 80 H${40 + 130 * zip}`} stroke={GOLD_SOFT} strokeWidth={9} strokeLinecap="round" strokeDasharray="10 7" />}
        </svg>
      </div>
      <div style={{ position: 'absolute', top: 1230, width: '100%', textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 70, color: INK, opacity: io(f, 36, 46) }}>Pack your zaad</div>
      <div style={{ position: 'absolute', top: 1340, width: '100%', display: 'flex', justifyContent: 'center', opacity: io(f, 54, 64) }}>
        <div style={{ background: CRIMSON, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 48, padding: '16px 42px', borderRadius: 999, border: '8px solid #fff', boxShadow: '0 10px 18px rgba(0,0,0,0.3)' }}>Link in bio</div>
      </div>
    </AbsoluteFill>
  );
};

export const V4Choose: React.FC = () => {
  const seq = (a: number, b: number, el: React.ReactNode, from: 1 | -1 = 1) => (
    <Sequence from={t(a)} durationInFrames={t(b) - t(a)}><Slide dur={t(b) - t(a)} from={from}>{el}</Slide></Sequence>
  );
  const cuts = [SC.cons, SC.flip, SC.pick, SC.ask, SC.end];
  return (
    <AbsoluteFill>
      <GraphPaper />
      {seq(SC.hook, SC.cons, <Hook />)}
      {seq(SC.cons, SC.flip, <Cons />, -1)}
      {seq(SC.flip, SC.pick, <Flip />)}
      {seq(SC.pick, SC.ask, <Pick />, -1)}
      {seq(SC.ask, SC.end, <Ask />)}
      <Sequence from={t(SC.end)}><Slide dur={99999} from={-1}><End /></Slide></Sequence>
      <Border />
      <Logo />
      {/* sound only, no voice, no music */}
      {cuts.map((s) => <Sfx key={s} at={t(s) - 3} src="paper/slide.mp3" volume={0.4} />)}
      {[SC.flip, SC.ask].map((s) => <Sfx key={'t' + s} at={t(s) - 2} src="paper/tear-s.mp3" volume={0.35} />)}
      <Sfx at={t(1.6)} src="wv/notification-ding.wav" volume={0.3} />
      <Sfx at={t(2.2)} src="wv/dull-thud.wav" volume={0.35} />
      <Sfx at={t(SC.cons) + 3} src="paper/slap-s.mp3" volume={0.35} />
      <Sfx at={t(SC.flip) + 14} src="wv/bass-impact.wav" volume={0.3} />
      <Sfx at={t(SC.pick)} src="wv/swish-whoosh-large.wav" volume={0.25} />
      <Sfx at={t(12.75)} src="wv/mouse-click-2.wav" volume={0.45} />
      <Sfx at={t(14.2)} src="wv/message-pop-reply.wav" volume={0.4} />
      <Sfx at={t(SC.ask) + 14} src="wv/bass-impact.wav" volume={0.3} />
      <Sfx at={t(SC.end) + 30} src="wv/pop-hand.wav" volume={0.35} />
      <Sfx at={t(SC.end) + 44} src="paper/marker-s.mp3" volume={0.35} />
      <Sfx at={t(SC.end) + 54} src="wv/dull-thud.wav" volume={0.3} />
    </AbsoluteFill>
  );
};
