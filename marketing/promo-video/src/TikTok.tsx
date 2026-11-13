import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Backdrop, Burst, clamp, COPPER, CRIMSON, Flash, glass, GOLD, GOLD_SOFT, io, Khatam, PAPER, pulse, RIBBON, ribbonText, SANS, SERIF, Sfx, Shockwave, TEAL, TEAL_DEEP } from './kit';
import { fr, makeVO } from './captions';
import { Arch, Cam, Cursor, glassLight, INK, MUTED, PaperWorld, Scene, Screen, sp, Still } from './Promo';
import WORDS from './words-tiktok.json';

// TikTok cut: the owner's "ask your child one question" script (SCRIPT-tiktok.md), public/vo-tiktok.mp3.
const vo = makeVO(WORDS as [string, number, number][]);
const wf = vo.wf;
export const TT_TOTAL = fr(68.8);

const T = {
  hook: 0, shrug: fr(6.0), plan: fr(9.7), logo: fr(17.3), story: fr(22.9), report: fr(28.3), subjects: fr(35.3),
  teacher: fr(41.8), anywhere: fr(47.7), save: fr(51.4), onus: fr(56.5), link: fr(61.7), payoff: fr(63.4),
};
type K = keyof typeof T;
const ORDER = Object.entries(T).sort((a, b) => a[1] - b[1]);
const dur = (k: K) => { const i = ORDER.findIndex(([n]) => n === k); return (i < ORDER.length - 1 ? ORDER[i + 1][1] : TT_TOTAL) - T[k]; };
const rel = (frame: number, k: K) => frame - T[k];
const isDark = (f: number) => f < T.plan;

/** A chat bubble, parent on the left, child on the right. */
const Bubble: React.FC<{ text: string; me?: boolean; s: number; size?: number; style?: React.CSSProperties }> = ({ text, me, s, size = 58, style }) => (
  <div style={{ padding: '26px 40px', borderRadius: me ? '44px 44px 12px 44px' : '44px 44px 44px 12px', background: me ? TEAL_DEEP : '#fff', color: me ? '#fff' : INK,
    fontFamily: SERIF, fontWeight: 700, fontSize: size, lineHeight: 1.15, transform: `scale(${s})`, transformOrigin: me ? '100% 100%' : '0 100%', opacity: Math.min(1, s),
    boxShadow: '0 30px 70px rgba(0,0,0,0.35)', ...style }}>{text}</div>
);

const Dots: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ display: 'flex', gap: 12, padding: '26px 34px', borderRadius: 40, background: 'rgba(255,255,255,0.9)' }}>
    {[0, 1, 2].map((i) => <div key={i} style={{ width: 18, height: 18, borderRadius: 99, background: MUTED, opacity: 0.3 + 0.7 * Math.abs(Math.sin(f / 6 + i)) }} />)}
  </div>
);

/* ===== 1. "Ask your child ONE question" (night) ===== */
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('hook');
  const tQ = rel(wf('What'), 'hook');
  const q = sp(f, tQ - 2, 11);
  const one = sp(f, rel(wf('one'), 'hook'), 8);
  return (
    <Scene d={d} instant>
      <AbsoluteFill style={{ opacity: 0.75 }}>
        <Img src={staticFile('img/kids-night.webp')} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.35 + f * 0.0025}) translateX(${-f * 0.4}px)` }} />
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(9,7,6,0.65), rgba(9,7,6,0.2) 45%, rgba(9,7,6,0.92))' }} />
      </AbsoluteFill>
      <Cam d={d} from={[4, -8, 1]} to={[0, 6, 1.06]}>
        <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <div style={{ padding: '14px 30px', borderRadius: 999, ...glass, fontFamily: SANS, fontSize: 34, color: GOLD_SOFT, letterSpacing: 2 }}>☾ after Quran class · tonight</div>
        </div>
        <div style={{ position: 'absolute', top: 420, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 300, lineHeight: 1, transform: `scale(${one * (1 - q * 0.6)})`,
          opacity: Math.min(1, one) * (1 - q), filter: `drop-shadow(0 0 40px rgba(229,169,60,0.6))`, ...ribbonText }}>1 ?</div>
        <div style={{ position: 'absolute', left: 90, right: 160, top: 760 }}><Bubble text="What did you learn today?" s={q} size={76} /></div>
        <div style={{ position: 'absolute', left: 120, top: 700, fontFamily: SANS, fontSize: 28, color: GOLD_SOFT, opacity: io(f, tQ, tQ + 8) }}>You</div>
      </Cam>
    </Scene>
  );
};

/* ===== 2. The shrug ===== */
const Shrug: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('shrug');
  const tS = rel(wf('shrug', 0), 'shrug');
  const kid = sp(f, tS - 6, 9);
  const tStay = rel(wf('stay'), 'shrug');
  const freeze = io(f, tStay, tStay + 6);
  return (
    <Scene d={d}>
      <Cam d={d} from={[0, 6, 1]} to={[2, -4, 1.04 + freeze * 0.12]}>
        <div style={{ position: 'absolute', left: 90, right: 160, top: 380, opacity: 0.6 }}><Bubble text="What did you learn today?" s={1} size={58} /></div>
        <div style={{ position: 'absolute', right: 80, top: 640, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
          {f < tS ? <Dots f={f} /> : <Bubble text="…I don't know 🤷" me s={sp(f, tS, 10)} size={64} />}
        </div>
        <Img src={staticFile('img/zayn-shrug.webp')} style={{ position: 'absolute', left: 300, top: 840, width: 480, transform: `translateY(${(1 - kid) * 500}px)`, opacity: Math.min(1, kid),
          filter: `drop-shadow(0 30px 40px rgba(0,0,0,0.6)) grayscale(${freeze}) contrast(${1 + freeze * 0.2})` }} />
        {freeze > 0 && <div style={{ position: 'absolute', inset: 0, border: `${12 * freeze}px solid ${GOLD}`, opacity: 0.6 }} />}
      </Cam>
      <Flash at={d - 3} strength={0.8} />
    </Scene>
  );
};

/* ===== 3. Not your child's fault: you can't see the plan ===== */
const Plan: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('plan');
  const tT = rel(wf('teacher', 0), 'plan'), tB = rel(wf('book', 0), 'plan'), tC = rel(wf("can't"), 'plan');
  const card = sp(f, tC - 4, 11);
  const icon = (kind: 'person' | 'book', x: number, s: number) => (
    <div style={{ position: 'absolute', left: x, top: 380, width: 300, height: 300, borderRadius: 40, ...glassLight, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${s}) translateY(${(1 - s) * 100}px)`, opacity: Math.min(1, s) }}>
      <svg width={180} height={180} viewBox="0 0 100 100">
        {kind === 'book'
          ? <path d="M15 22 Q35 14 50 24 Q65 14 85 22 V80 Q65 72 50 82 Q35 72 15 80 Z M50 24 V82" fill="none" stroke={COPPER} strokeWidth="5" strokeLinejoin="round" />
          : <><circle cx="50" cy="32" r="14" fill="none" stroke={TEAL_DEEP} strokeWidth="5" /><path d="M22 84 Q22 56 50 56 Q78 56 78 84" fill="none" stroke={TEAL_DEEP} strokeWidth="5" /></>}
      </svg>
    </div>
  );
  return (
    <Scene d={d}>
      <Cam d={d} from={[6, -10, 1]} to={[0, 8, 1.05]}>
        {icon('person', 150, sp(f, tT, 11))}
        <div style={{ position: 'absolute', left: 500, top: 480, fontFamily: SERIF, fontSize: 90, color: MUTED, opacity: io(f, tT + 4, tT + 10) }}>+</div>
        {icon('book', 630, sp(f, tB, 11))}
        {/* the plan you can't see */}
        <div style={{ position: 'absolute', left: 120, right: 120, top: 760, height: 520, borderRadius: 40, background: '#fff', padding: 44, transform: `rotateX(${(1 - card) * 60}deg) scale(${card})`, opacity: Math.min(1, card), boxShadow: '0 40px 90px rgba(139,73,53,0.25)', overflow: 'hidden' }}>
          <div style={{ fontFamily: SANS, fontSize: 28, letterSpacing: 3, color: COPPER, fontWeight: 700 }}>THE PLAN</div>
          {[0.9, 0.6, 0.8, 0.5, 0.7].map((w, i) => <div key={i} style={{ marginTop: 26, height: 22, width: `${w * 100}%`, borderRadius: 99, background: 'rgba(139,73,53,0.25)' }} />)}
          <AbsoluteFill style={{ backdropFilter: 'blur(14px)', background: 'rgba(250,247,242,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="150" height="150" viewBox="0 0 24 24" style={{ transform: `scale(${1 + 0.1 * pulse(f, rel(wf('plan'), 'plan'), 10)})` }}>
              <path d="M3 3l18 18M10.6 5.1A10.9 10.9 0 0 1 12 5c5 0 9 4 10 7a12.6 12.6 0 0 1-3.2 4.4M6.6 6.6C4.4 8 2.8 10 2 12c1 3 5 7 10 7a10 10 0 0 0 5.4-1.6" fill="none" stroke={CRIMSON} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </AbsoluteFill>
        </div>
      </Cam>
    </Scene>
  );
};

/* ===== 4. Our own curriculum: the Zad Path ===== */
const Logo: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('logo');
  const logo = sp(f, 2, 12);
  const tCur = rel(wf('curriculum'), 'logo');
  const zad = sp(f, rel(wf('Zad'), 'logo') - 2, 11);
  return (
    <Scene d={d}>
      <Cam d={d} from={[-6, 12, 1]} to={[2, -8, 1.06]}>
        <div style={{ position: 'absolute', left: 540 - 330, top: 330, width: 660, transform: `scale(${0.6 + 0.4 * logo}) rotate(${(1 - logo) * -8}deg)`, opacity: Math.min(1, logo),
          clipPath: `inset(0 ${100 - io(f, 2, 18) * 100}% 0 0)`, filter: 'drop-shadow(0 30px 40px rgba(139,73,53,0.25))' }}>
          <Img src={staticFile('img/logo-clean.png')} style={{ width: '100%' }} />
        </div>
        <div style={{ position: 'absolute', top: 760, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 120, letterSpacing: -2, ...ribbonText, opacity: io(f, 6, 16) }}>Watazawwado</div>
        <div style={{ position: 'absolute', top: 920, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 40, letterSpacing: 6, color: COPPER, opacity: io(f, tCur - 4, tCur + 6) }}>OUR OWN CURRICULUM</div>
        <div style={{ position: 'absolute', top: 1010, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - zad) * 60}px) scale(${0.9 + 0.1 * zad})`, opacity: Math.min(1, zad) }}>
          <div style={{ padding: '22px 46px', borderRadius: 999, background: INK, color: PAPER, fontFamily: SERIF, fontWeight: 700, fontSize: 60 }}>Zad Path <span style={{ color: GOLD }}>·</span> مسار الأثر</div>
        </div>
      </Cam>
      <Burst at={4} x={540} y={520} n={30} spread={480} color={GOLD} />
    </Scene>
  );
};

/* ===== 5. Stories, characters, games, for every age ===== */
const Story: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('story');
  const through = io(f, 6, 34, 0, 1, Easing.inOut(Easing.cubic));
  const tChars = rel(wf('characters'), 'story'), tGames = rel(wf('games'), 'story');
  const tKids = rel(wf('kids'), 'story');
  const shrink = io(f, tKids - 10, tKids + 4, 0, 1, Easing.inOut(Easing.cubic));
  const chars = [{ s: 'maryam-happy.webp', x: -20, y: 900, d: 0 }, { s: 'noor-happy.webp', x: 790, y: 860, d: 3 }, { s: 'jiddo-explain.webp', x: 780, y: 260, d: 6 }];
  const versions = [{ k: 'kids', label: 'Kids', src: 'kids-doors.webp' }, { k: 'teens', label: 'Teens', src: 'teens-stars.webp' }, { k: 'adults', label: 'Adults', src: 'adults-cover.webp' }];
  return (
    <Scene d={d}>
      <Cam d={d} from={[0, -20, 1]} to={[0, 14, 1.03]}>
        <div style={{ position: 'absolute', left: 90, right: 90, top: 300, height: 860, borderRadius: 48, overflow: 'hidden', boxShadow: '0 50px 120px rgba(139,73,53,0.35)', border: '3px solid #fff',
          transform: `translateY(${-shrink * 120}px) scale(${1 - shrink * 0.35})`, transformOrigin: '50% 0%' }}>
          <AbsoluteFill style={{ opacity: 1 - through }}><Img src={staticFile('img/adults-doorway.webp')} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.1 + through * 1.8})`, transformOrigin: '62% 55%' }} /></AbsoluteFill>
          <AbsoluteFill style={{ opacity: through }}><Still src="adults-madinah.webp" f={f} /></AbsoluteFill>
          <AbsoluteFill style={{ background: 'linear-gradient(180deg, transparent 55%, rgba(12,9,7,0.85))' }} />
          <div style={{ position: 'absolute', left: 46, bottom: 50, fontFamily: SERIF, fontWeight: 700, color: PAPER, fontSize: 64 }}>The Man No One Knew</div>
        </div>
        {chars.map((c) => {
          const s = sp(f, tChars + c.d, 9, 0.7) * (1 - shrink);
          return <Img key={c.s} src={staticFile(`img/${c.s}`)} style={{ position: 'absolute', left: c.x, top: c.y + Math.sin((f + c.d * 7) / 10) * 10, width: 300, opacity: Math.min(1, s), transform: `scale(${s})`, filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.35))' }} />;
        })}
        {['Islam', 'Iman', 'Ihsan'].map((t, i) => {
          const s = sp(f, tGames + i * 3, 10) * (1 - shrink);
          return <div key={t} style={{ position: 'absolute', left: 150 + i * 270, top: 1000, padding: '16px 30px', borderRadius: 18, background: TEAL_DEEP, color: '#fff', fontFamily: SANS, fontWeight: 700, fontSize: 40,
            transform: `scale(${s})`, opacity: Math.min(1, s), boxShadow: '0 0 40px rgba(18,164,188,0.6)' }}>✓ {t}</div>;
        })}
        {versions.map((v, i) => {
          const s = sp(f, rel(wf(v.k), 'story') - 4, 11);
          return (
            <div key={v.k} style={{ position: 'absolute', left: 70 + i * 320, top: 820, width: 300, height: 480, borderRadius: '150px 150px 30px 30px', overflow: 'hidden', border: '4px solid #fff',
              transform: `translateY(${(1 - s) * 500}px) rotate(${(i - 1) * 6 * s}deg)`, opacity: Math.min(1, s), boxShadow: '0 30px 60px rgba(139,73,53,0.3)' }}>
              <Img src={staticFile(`img/${v.src}`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(12,9,7,0.85))' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 30, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 56, color: PAPER }}>{v.label}</div>
            </div>
          );
        })}
      </Cam>
    </Scene>
  );
};

/* ===== 6. A report after every class, progress stage by stage ===== */
const Report: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('report');
  const n = sp(f, rel(wf('after', 1), 'report') - 4, 11);
  const rows = ['Lesson 3 · Zad Path, done', 'Tajweed: noon sakinah', 'Homework: 10 min revision'];
  const tR = rel(wf('report'), 'report');
  const tProg = rel(wf('progress'), 'report');
  const toProg = io(f, tProg - 10, tProg + 4, 0, 1, Easing.inOut(Easing.cubic));
  const big = io(f, tProg - 4, tProg + 30, 0, 72, Easing.out(Easing.cubic));
  const tStage = rel(wf('stage', 0), 'report');
  return (
    <Scene d={d}>
      <Cam d={d} from={[-8, 14, 1]} to={[6, -10, 1.05]}>
        <div style={{ position: 'absolute', left: 80, right: 80, top: 330, borderRadius: 40, padding: '34px 40px', ...glassLight, opacity: Math.min(1, n) * (1 - toProg),
          transform: `translateY(${(1 - n) * -500 - toProg * 300}px) scale(${1 - toProg * 0.3})` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <Img src={staticFile('img/logo-clean.png')} style={{ width: 130 }} />
            <div style={{ fontFamily: SANS }}><div style={{ fontSize: 30, color: MUTED }}>Watazawwado · now</div><div style={{ fontSize: 44, fontWeight: 700, color: INK }}>Your lesson report is ready</div></div>
          </div>
          {rows.map((r, i) => {
            const p = io(f, tR - 10 + i * 6, tR + i * 6);
            return <div key={r} style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '20px 0', borderTop: '1px solid rgba(139,73,53,0.15)', opacity: p }}>
              <div style={{ width: 54, height: 54, borderRadius: 99, background: TEAL_DEEP, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, transform: `scale(${0.6 + 0.4 * p})` }}>✓</div>
              <div style={{ fontFamily: SANS, fontSize: 40, color: INK }}>{r}</div>
            </div>;
          })}
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 290, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 420, lineHeight: 1, opacity: toProg, transform: `scale(${0.7 + 0.3 * toProg})`, ...ribbonText }}>{Math.round(big)}%</div>
        <div style={{ position: 'absolute', top: 770, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontSize: 38, color: MUTED, opacity: toProg }}>Example: Tajweed, stage 2 of 3</div>
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: toProg }}>
          <path d="M140 1180 C 300 1180, 330 1000, 540 1000 S 780 1180, 940 1040" fill="none" stroke={TEAL} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray="1 1"
            strokeDashoffset={1 - io(f, tStage - 4, tStage + 24)} style={{ filter: `drop-shadow(0 0 10px ${TEAL})` }} />
        </svg>
        {[[140, 1180], [540, 1000], [940, 1040]].map(([x, y], i) => {
          const s = sp(f, tStage + i * 8, 9);
          return <div key={i} style={{ position: 'absolute', left: x - 46, top: y - 46, width: 92, height: 92, borderRadius: 99, background: i < 2 ? TEAL_DEEP : '#fff', border: `4px solid ${TEAL}`,
            color: i < 2 ? '#fff' : TEAL_DEEP, fontFamily: SERIF, fontWeight: 700, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${s * toProg})` }}>{i + 1}</div>;
        })}
      </Cam>
    </Scene>
  );
};

/* ===== 7. Subjects: three big cards ===== */
const GROUPS = [
  { title: 'Quran', color: GOLD, y: 300, items: [['Reading', 'Quran', 1], ['Tajweed', 'Tajweed', 0], ['Memorization', 'memorization', 0]] },
  { title: 'Arabic', color: CRIMSON, y: 700, items: [['Fusha', 'Fusha', 0], ['Egyptian', 'Egyptian', 0]] },
  { title: 'English', color: TEAL, y: 1060, items: [['Kids & adults', 'English', 0]] },
] as { title: string; color: string; y: number; items: [string, string, number][] }[];

const Subjects: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('subjects');
  return (
    <Scene d={d}>
      <Cam d={d} from={[8, -10, 0.98]} to={[2, 8, 1.03]}>
        {GROUPS.map((g, gi) => {
          const t0 = rel(wf(g.items[0][1], g.items[0][2]), 'subjects') - 8;
          const s = sp(f, t0, 12);
          return (
            <div key={g.title} style={{ position: 'absolute', left: 60, right: 60, top: g.y, height: 340, borderRadius: 40, ...glassLight, padding: '34px 40px', opacity: Math.min(1, s),
              transform: `translateX(${(1 - s) * (gi % 2 ? 900 : -900)}px) rotateY(${(1 - s) * (gi % 2 ? -35 : 35)}deg)` }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 80, color: INK, lineHeight: 1 }}><span style={{ color: g.color }}>●</span> {g.title}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 30 }}>
                {g.items.map(([label, w, nth]) => {
                  const ti = rel(wf(w, nth), 'subjects') - 3;
                  const p = sp(f, ti, 10);
                  const lit = f >= ti;
                  return <div key={label} style={{ padding: '16px 30px', borderRadius: 22, background: lit ? g.color : 'rgba(139,73,53,0.08)', color: lit ? (g.color === GOLD ? INK : '#fff') : MUTED,
                    transform: `scale(${0.85 + 0.15 * Math.min(1, p)})`, opacity: 0.35 + 0.65 * Math.min(1, p), fontFamily: SANS, fontWeight: 700, fontSize: 46 }}>{label}</div>;
                })}
              </div>
            </div>
          );
        })}
      </Cam>
    </Scene>
  );
};

/* ===== 8. Your teacher, kept ===== */
const Teacher: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('teacher');
  const a = sp(f, rel(wf('male'), 'teacher') - 4, 12), b = sp(f, rel(wf('female'), 'teacher') - 4, 12);
  const tK = rel(wf('keeps'), 'teacher');
  const pick = io(f, tK - 8, tK);
  const lock = sp(f, tK, 7);
  return (
    <Scene d={d}>
      <Cam d={d} from={[6, -16, 1]} to={[2, 10, 1.04]}>
        <Arch x={90} label="Ustadh" sub="Male teacher" active={pick} enter={a} f={f} />
        <Arch x={590} label="Ustadha" sub="Female teacher" active={0} enter={b * (1 - pick * 0.45)} f={f} />
        <div style={{ position: 'absolute', top: 960, left: 230, width: 120, height: 120, borderRadius: 99, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${lock})`, boxShadow: `0 0 60px ${GOLD}` }}>
          <svg width="56" height="64" viewBox="0 0 50 56"><path d={`M13 24 V16 a12 12 0 0 1 24 0 V${24 - 8 * (1 - Math.min(1, lock))}`} fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" /><rect x="5" y="24" width="40" height="30" rx="7" fill={INK} /></svg>
        </div>
        <Shockwave at={tK} x={290} y={1020} size={520} />
      </Cam>
    </Scene>
  );
};

/* ===== 9. Your time zone, any device ===== */
const Anywhere: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('anywhere');
  const tTime = rel(wf('time'), 'anywhere');
  const ph = sp(f, rel(wf('phone'), 'anywhere') - 4, 11), lp = sp(f, rel(wf('laptop'), 'anywhere') - 4, 11);
  const clock = sp(f, tTime - 6, 10);
  const ang = 150 + 1080 * (1 - io(f, tTime - 6, tTime + 20, 0, 1, Easing.out(Easing.cubic)));
  return (
    <Scene d={d}>
      <Cam d={d} from={[12, -18, 0.98]} to={[4, 14, 1.04]}>
        <div style={{ position: 'absolute', left: 340, top: 260, width: 400, display: 'flex', alignItems: 'center', gap: 24, padding: '20px 30px', borderRadius: 999, ...glassLight, transform: `scale(${clock})`, opacity: Math.min(1, clock) }}>
          <div style={{ width: 90, height: 90, borderRadius: 99, border: `4px solid ${INK}`, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 41, top: 18, width: 6, height: 28, background: INK, borderRadius: 4, transformOrigin: '3px 27px', transform: `rotate(${ang}deg)` }} />
            <div style={{ position: 'absolute', left: 42, top: 8, width: 4, height: 38, background: CRIMSON, borderRadius: 4, transformOrigin: '2px 37px', transform: `rotate(${ang * 12}deg)` }} />
          </div>
          <div style={{ fontFamily: SANS }}><div style={{ fontSize: 26, color: MUTED }}>your time zone</div><div style={{ fontSize: 44, fontWeight: 700, color: INK }}>5:00 PM</div></div>
        </div>
        <div style={{ position: 'absolute', left: 60, top: 460, width: 820, transform: `translateZ(${(1 - lp) * -1200}px) translateY(${(1 - lp) * 300}px)`, opacity: Math.min(1, lp) }}>
          <div style={{ height: 500, borderRadius: '26px 26px 0 0', background: '#1b1816', padding: 18, boxShadow: '0 40px 90px rgba(139,73,53,0.3)' }}>
            <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 10, overflow: 'hidden' }}><Screen f={f} /></div>
          </div>
          <div style={{ height: 34, margin: '0 -46px', borderRadius: '0 0 30px 30px', background: 'linear-gradient(180deg, #d8d2ca, #a9a29a)' }} />
        </div>
        <div style={{ position: 'absolute', left: 720, top: 720, width: 290, height: 580, borderRadius: 50, background: '#1b1816', padding: 12, transform: `rotate(9deg) translateY(${(1 - ph) * 700}px) translateZ(220px)`, opacity: Math.min(1, ph), boxShadow: '0 40px 80px rgba(0,0,0,0.35)' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 40, overflow: 'hidden' }}><Screen f={f + 40} /></div>
        </div>
      </Cam>
    </Scene>
  );
};

/* ===== 10. Families save ===== */
const Save: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('save');
  const tD = rel(wf('family', 1), 'save');
  const tag = sp(f, tD - 4, 6, 0.8);
  const swing = Math.sin((f - tD) / 5) * 14 * Math.exp(-Math.max(0, f - tD) / 20);
  const tC = rel(wf('credit'), 'save');
  const kids = [{ x: 300, c: CRIMSON, s: 'yusuf-stand.webp' }, { x: 540, c: GOLD, s: 'maryam-happy.webp' }, { x: 780, c: TEAL, s: 'zayn-stand.webp' }];
  const toFriend = io(f, rel(wf('Bring'), 'save') - 6, rel(wf('Bring'), 'save') + 6);
  return (
    <Scene d={d}>
      <Cam d={d} from={[6, -10, 1]} to={[0, 10, 1.04]}>
        <div style={{ opacity: 1 - toFriend, transform: `translateX(${-toFriend * 400}px)` }}>
          {kids.map((k, i) => {
            const s = sp(f, i * 5, 10);
            return <div key={i} style={{ position: 'absolute', left: k.x - 120, top: 760, width: 240, height: 240, borderRadius: 999, overflow: 'hidden', transform: `scale(${s})`, border: `5px solid ${k.c}`, boxShadow: `0 0 40px ${k.c}`, background: '#2a2420' }}>
              <Img src={staticFile(`img/${k.s}`)} style={{ width: '100%', position: 'absolute', top: 10 }} />
            </div>;
          })}
          <div style={{ position: 'absolute', left: 540 - 220, top: 300, width: 440, transformOrigin: '50% 0%', transform: `translateY(${(1 - tag) * -500}px) rotate(${swing}deg)` }}>
            <div style={{ width: 4, height: 70, margin: '0 auto', background: COPPER }} />
            <div style={{ height: 200, borderRadius: 30, background: RIBBON, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, boxShadow: '0 30px 80px rgba(139,73,53,0.4)' }}>
              <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 120, color: '#fff' }}>%</span>
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 46, color: '#fff', lineHeight: 1 }}>Family<br />discount</span>
            </div>
          </div>
        </div>
        <div style={{ opacity: toFriend, transform: `translateX(${(1 - toFriend) * 400}px)` }}>
          {[{ x: 250, c: CRIMSON, n: 'You' }, { x: 830, c: TEAL, n: 'Friend' }].map((u, i) => {
            const coin = sp(f, tC + i * 4, 8);
            return (
              <React.Fragment key={u.n}>
                <div style={{ position: 'absolute', left: u.x - 150, top: 700, width: 300, height: 360, borderRadius: 40, ...glassLight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                  <div style={{ width: 140, height: 140, borderRadius: 99, background: `radial-gradient(circle at 50% 35%, ${u.c}, #05363F)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Khatam size={76} glow={false} /></div>
                  <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 48, color: INK }}>{u.n}</div>
                </div>
                <div style={{ position: 'absolute', left: u.x - 85, top: 680 - 240 * Math.min(1, coin), transform: `scale(${coin}) rotateY(${f * 12}deg)`, width: 170, height: 170, borderRadius: 99,
                  background: `radial-gradient(circle at 35% 30%, #fff8, ${GOLD} 50%, #B9782A)`, boxShadow: `0 0 50px ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 34, color: '#3B2219' }}>+credit</div>
              </React.Fragment>
            );
          })}
        </div>
      </Cam>
    </Scene>
  );
};

/* ===== 11. Your first lesson is ON US ===== */
const OnUs: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('onus');
  const card = sp(f, rel(wf('first'), 'onus') - 6, 11);
  const tUs = rel(wf('us'), 'onus');
  const flip = io(f, tUs - 6, tUs + 4, 0, 1, Easing.inOut(Easing.cubic));
  const stamp = sp(f, tUs, 7);
  const c1 = sp(f, rel(wf('Thirty'), 'onus') - 2, 10), c2 = sp(f, rel(wf('card'), 'onus') - 6, 10);
  return (
    <Scene d={d}>
      <Cam d={d} from={[4, -8, 1]} to={[0, 6, 1.06]} shakeAt={tUs}>
        <div style={{ position: 'absolute', left: 120, right: 120, top: 360, height: 560, transform: `scale(${card}) rotateY(${flip * 180}deg)`, transformStyle: 'preserve-3d', opacity: Math.min(1, card) }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 48, ...glassLight, backfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: SANS, fontSize: 34, letterSpacing: 4, color: COPPER, fontWeight: 700 }}>YOUR FIRST LESSON</div>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 200, color: INK }}>?</div>
          </div>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 48, background: RIBBON, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 40px 100px rgba(197,31,36,0.35)' }}>
            <div style={{ fontFamily: SANS, fontSize: 34, letterSpacing: 4, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>YOUR FIRST LESSON IS</div>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 210, color: '#fff', lineHeight: 1, transform: `scale(${0.6 + 0.4 * Math.min(1, stamp)})` }}>ON US</div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 990, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 20 }}>
          <div style={{ padding: '18px 34px', borderRadius: 999, ...glassLight, fontFamily: SANS, fontWeight: 700, fontSize: 42, color: INK, transform: `scale(${c1})`, opacity: Math.min(1, c1) }}>⏱ 30 minutes</div>
          <div style={{ padding: '18px 34px', borderRadius: 999, ...glassLight, fontFamily: SANS, fontWeight: 700, fontSize: 42, color: INK, transform: `scale(${c2})`, opacity: Math.min(1, c2) }}>No card needed</div>
        </div>
      </Cam>
      <Burst at={tUs + 2} x={540} y={640} n={44} spread={640} color={GOLD} />
      <Shockwave at={tUs + 2} x={540} y={640} size={1400} />
    </Scene>
  );
};

/* ===== 12. Link in bio ===== */
const Link: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('link');
  const tL = rel(wf('link'), 'link');
  const tap = pulse(f, tL + 4, 8);
  const cx = interpolate(f, [0, tL + 2], [960, 640], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const cy = interpolate(f, [0, tL + 2], [1450, 1010], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <Scene d={d}>
      <Cam d={d} from={[4, -6, 1]} to={[0, 4, 1.04]}>
        <div style={{ position: 'absolute', left: 110, right: 110, top: 520, height: 560, borderRadius: 48, ...glassLight, padding: 50, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 190, height: 190, borderRadius: 999, background: PAPER, border: `5px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Img src={staticFile('img/logo-clean.png')} style={{ width: 150 }} /></div>
          <div style={{ marginTop: 22, fontFamily: SERIF, fontWeight: 700, fontSize: 60, color: INK }}>Watazawwado</div>
          <div style={{ fontFamily: SANS, fontSize: 32, color: MUTED }}>watazawwado.academy</div>
          <div style={{ marginTop: 30, padding: '22px 60px', borderRadius: 999, background: INK, color: PAPER, fontFamily: SANS, fontWeight: 700, fontSize: 42, transform: `scale(${1 - tap * 0.08})`, boxShadow: `0 0 0 ${tap * 30}px rgba(229,169,60,${0.35 * tap})` }}>Link in bio</div>
        </div>
        <Cursor x={cx} y={cy} press={tap} />
      </Cam>
      <Burst at={tL + 4} x={660} y={1000} n={18} spread={240} color={GOLD} />
    </Scene>
  );
};

/* ===== 13. Payoff: ask again next week ===== */
const Payoff: React.FC = () => {
  const f = useCurrentFrame();
  const d = dur('payoff');
  const q = sp(f, rel(wf('ask', 1), 'payoff') - 4, 11);
  const tWeek = rel(wf('week'), 'payoff');
  const ans = sp(f, tWeek + 4, 10);
  const kid = sp(f, tWeek, 9);
  const end = io(f, d - 50, d - 32);
  return (
    <Scene d={d + 6}>
      <Cam d={d} from={[2, -6, 1]} to={[0, 6, 1.05]}>
        <div style={{ opacity: 1 - end }}>
          <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: io(f, 0, 10) }}>
            <div style={{ padding: '14px 30px', borderRadius: 999, ...glassLight, fontFamily: SANS, fontWeight: 700, fontSize: 34, color: COPPER, letterSpacing: 2 }}>NEXT WEEK</div>
          </div>
          <div style={{ position: 'absolute', left: 80, right: 200, top: 420 }}><Bubble text="What did you learn today?" s={q} size={64} style={{ boxShadow: '0 30px 70px rgba(139,73,53,0.25)' }} /></div>
          <div style={{ position: 'absolute', left: 230, right: 70, top: 640, display: 'flex', justifyContent: 'flex-end' }}><Bubble text="Islam, Iman and Ihsan! 🤩" me s={ans} size={64} /></div>
          <Img src={staticFile('img/maryam-happy.webp')} style={{ position: 'absolute', left: 300, top: 860, width: 470, transform: `translateY(${(1 - kid) * 500}px) rotate(${Math.sin(f / 6) * 3}deg)`, opacity: Math.min(1, kid), filter: 'drop-shadow(0 30px 40px rgba(139,73,53,0.35))' }} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 460, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: end, transform: `scale(${0.85 + 0.15 * end})` }}>
          <Img src={staticFile('img/logo-clean.png')} style={{ width: 620 }} />
          <div style={{ marginTop: 20, fontFamily: SERIF, fontWeight: 700, fontSize: 110, ...ribbonText }}>Watazawwado</div>
          <div style={{ marginTop: 14, fontFamily: SANS, fontWeight: 700, fontSize: 52, color: INK }}>First lesson on us · link in bio</div>
        </div>
      </Cam>
      <Burst at={tWeek + 6} x={760} y={700} n={30} spread={420} color={GOLD} />
    </Scene>
  );
};

/* ===== timeline ===== */
const Worlds: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ opacity: io(f, T.plan - 6, T.plan + 4) }}><PaperWorld /></AbsoluteFill>
    </AbsoluteFill>
  );
};

export const TikTok: React.FC = () => {
  const scenes: [K, React.ReactNode][] = [
    ['hook', <Hook />], ['shrug', <Shrug />], ['plan', <Plan />], ['logo', <Logo />], ['story', <Story />], ['report', <Report />], ['subjects', <Subjects />],
    ['teacher', <Teacher />], ['anywhere', <Anywhere />], ['save', <Save />], ['onus', <OnUs />], ['link', <Link />], ['payoff', <Payoff />],
  ];
  const cuts = ORDER.map(([, v]) => v).filter((v) => v > 0);
  return (
    <AbsoluteFill style={{ background: '#090706' }}>
      <Worlds />
      {scenes.map(([k, node]) => <Sequence key={k} from={T[k]} durationInFrames={dur(k)}>{node}</Sequence>)}
      <vo.Captions dark={isDark} />
      <Sequence from={fr(0)} layout="none"><Audio src={staticFile('vo-tiktok.mp3')} /></Sequence>

      {/* sound: one soft whoosh per cut, few clear accents, room for the voice */}
      {cuts.map((c) => <Sfx key={c} at={c - 4} src="wv/fast-whoosh.wav" volume={0.55} />)}
      <Sfx at={0} src="wv/deep-whoosh.wav" volume={0.3} />
      <Sfx at={wf('one')} src="el/slam.mp3" volume={0.45} />
      <Sfx at={wf('What') - 2} src="wv/message-pop-reply.wav" volume={0.7} />
      <Sfx at={wf('shrug', 0)} src="wv/message-pop-reply.wav" volume={0.6} />
      <Sfx at={wf('stay')} src="wv/record-scratch.wav" volume={0.5} />
      <Sfx at={wf("can't") - 4} src="el/glass.mp3" volume={0.45} />
      <Sfx at={T.logo + 2} src="el/shimmer.mp3" volume={0.6} />
      <Sfx at={T.logo + 4} src="wv/bass-impact.wav" volume={0.5} />
      <Sfx at={wf('Zad') - 2} src="el/stamp.mp3" volume={0.4} />
      {[0, 3, 6].map((d) => <Sfx key={d} at={wf('characters') + d} src="wv/pop-hand.wav" volume={0.5} />)}
      {['kids', 'teens', 'adults'].map((w) => <Sfx key={w} at={wf(w) - 4} src="el/glass.mp3" volume={0.4} />)}
      <Sfx at={wf('after', 1) - 4} src="wv/message-pop-reply.wav" volume={0.6} />
      <Sfx at={wf('progress') - 4} src="counter.mp3" volume={0.35} />
      {GROUPS.map((g) => <Sfx key={g.title} at={wf(g.items[0][1], g.items[0][2]) - 8} src="el/glass.mp3" volume={0.45} />)}
      <Sfx at={wf('keeps')} src="lock.mp3" volume={0.6} />
      <Sfx at={wf('time') - 6} src="wv/tick-sound.wav" volume={0.7} />
      <Sfx at={wf('laptop') - 6} src="el/glass.mp3" volume={0.4} />
      <Sfx at={wf('family', 1) - 4} src="wv/swish-whoosh-large.wav" volume={0.4} />
      <Sfx at={wf('credit')} src="wv/several-coins.wav" volume={0.5} />
      <Sfx at={wf('us') - 6} src="wv/deep-whoosh.wav" volume={0.5} />
      <Sfx at={wf('us') + 2} src="el/slam.mp3" volume={0.75} />
      <Sfx at={wf('us') + 2} src="wv/bass-impact.wav" volume={0.5} />
      <Sfx at={wf('link') + 4} src="el/tap.mp3" volume={0.7} />
      <Sfx at={wf('ask', 1) - 4} src="wv/message-pop-reply.wav" volume={0.6} />
      <Sfx at={wf('week') + 4} src="wv/message-pop-reply.wav" volume={0.7} />
      <Sfx at={TT_TOTAL - 50} src="el/shimmer.mp3" volume={0.5} />
    </AbsoluteFill>
  );
};
