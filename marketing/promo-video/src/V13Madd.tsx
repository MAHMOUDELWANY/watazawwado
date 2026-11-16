import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { COPPER, CRIMSON, GOLD, GOLD_SOFT, SANS, SERIF, TEAL_DEEP } from './kit';
import { AR, ESPRESSO, INK, Label, Paper, SAND, WHITE } from './V2Ain';
import { CFrame } from './V10Screen';
import { ZadStill } from './reel';

/**
 * V13 · "What is madd? Tajweed in one picture", 6 slides at 1080×1350 (Content Calendar, 28 Nov 2026).
 * One frame = one slide: `npx remotion still src/index.ts V13Madd out/v13/slide-N.png --frame=N-1`.
 * Natural madd (madd tabi'i, Hafs): a stretch letter after its matching vowel, two counts. Practice syllables are not
 * Quran; the three Quran words are copied from quran.ai fetch_quran (ar-uthmani-hafs): 1:1 and 112:3. A teacher checks
 * before publishing (content RULES §1.3).
 */
export const V13_SLIDES = 6;
const N = V13_SLIDES;

const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 200, color = WHITE }) => (
  <span style={{ fontFamily: AR, fontSize: size, color, lineHeight: 1.25 }}>{children}</span>
);

const S1: React.FC = () => (
  <CFrame n={1} total={N}>
    <Paper seed="v13s1" x={70} y={200} w={940} h={620} color={ESPRESSO} rot={-1}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}>
        <Big size={230} color={GOLD_SOFT}>بَـــــا</Big>
      </div>
      <svg width={940} height={620} style={{ position: 'absolute', left: 0, top: 0 }}>
        <path d="M200 470 C 380 430 560 430 740 470" stroke={GOLD} strokeWidth={12} fill="none" strokeLinecap="round" strokeDasharray="4 18" />
        <path d="M720 450 L745 472 L715 488" stroke={GOLD} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Paper>
    <div style={{ position: 'absolute', left: 90, right: 90, top: 870, fontFamily: SERIF, fontWeight: 700, fontSize: 70, lineHeight: 1.1, color: INK }}>
      Why does the reciter <span style={{ fontStyle: 'italic', color: CRIMSON }}>stretch</span> some sounds?
    </div>
    <Label at={-100} x={470} y={1130} text="It has a name: madd. Swipe →" size={42} />
    <ZadStill emote="search" k={50} x={890} y={1110} size={360} />
  </CFrame>
);

const S2: React.FC = () => (
  <CFrame n={2} total={N}>
    <div style={{ position: 'absolute', left: 90, right: 90, top: 190, fontFamily: SERIF, fontWeight: 700, fontSize: 74, lineHeight: 1.08, color: INK }}>
      Madd means <span style={{ fontStyle: 'italic', color: CRIMSON }}>stretch.</span>
    </div>
    <div style={{ position: 'absolute', left: 90, right: 90, top: 300, fontFamily: SANS, fontWeight: 500, fontSize: 42, color: '#453D34' }}>Three letters do the stretching:</div>
    <div style={{ position: 'absolute', left: 80, right: 80, top: 420, display: 'flex', gap: 34, direction: 'rtl' }}>
      {[['ا', 'alif', TEAL_DEEP], ['و', 'waw', COPPER], ['ي', 'ya', CRIMSON]].map(([l, n, c], i) => (
        <div key={l} style={{ flex: 1, height: 460, borderRadius: 34, background: c, border: '10px solid #fff', boxShadow: '0 12px 20px rgba(0,0,0,0.22)',
          transform: `rotate(${[-3, 2, -2][i]}deg)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Big size={230}>{l}</Big>
          <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 52, color: GOLD_SOFT }}>{n}</span>
        </div>
      ))}
    </div>
    <div style={{ position: 'absolute', left: 90, right: 90, top: 960, fontFamily: SANS, fontWeight: 500, fontSize: 42, lineHeight: 1.4, color: '#453D34' }}>
      But only when they carry no vowel of their own, and only after the right partner. →
    </div>
  </CFrame>
);

const S3: React.FC = () => (
  <CFrame n={3} total={N}>
    <div style={{ position: 'absolute', left: 90, right: 90, top: 190, fontFamily: SERIF, fontWeight: 700, fontSize: 70, lineHeight: 1.08, color: INK }}>
      Each one has a <span style={{ fontStyle: 'italic', color: CRIMSON }}>partner</span> vowel.
    </div>
    {[
      ['fatha', 'then alif', 'بَا', TEAL_DEEP],
      ['damma', 'then waw', 'بُو', COPPER],
      ['kasra', 'then ya', 'بِي', CRIMSON],
    ].map(([v, l, s, c], i) => (
      <div key={s} style={{ position: 'absolute', left: 90, right: 90, top: 340 + i * 260, height: 220, display: 'flex', alignItems: 'center', gap: 34 }}>
        <div style={{ width: 300, height: 210, borderRadius: 28, background: c, border: '8px solid #fff', boxShadow: '0 10px 16px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ marginTop: -24 }}><Big size={130}>{s}</Big></span>
        </div>
        <div>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 58, color: INK }}>{v}</div>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 44, color: '#6B6158' }}>{l}</div>
        </div>
      </div>
    ))}
    <div style={{ position: 'absolute', left: 90, right: 90, top: 1130, fontFamily: SANS, fontWeight: 700, fontSize: 34, color: '#6B6158' }}>Practice syllables, not Quran text.</div>
  </CFrame>
);

const S4: React.FC = () => (
  <CFrame n={4} total={N}>
    <Paper seed="v13s4" x={70} y={200} w={940} h={560} color={SAND} rot={1}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60 }}>
        {[1, 2].map((k) => (
          <div key={k} style={{ width: 250, height: 250, borderRadius: 999, background: WHITE, border: '10px solid #fff', boxShadow: '0 12px 20px rgba(0,0,0,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 150, color: CRIMSON }}>{k}</div>
        ))}
      </div>
    </Paper>
    <div style={{ position: 'absolute', left: 90, right: 90, top: 820, fontFamily: SERIF, fontWeight: 700, fontSize: 72, lineHeight: 1.08, color: INK }}>
      How long? <span style={{ fontStyle: 'italic', color: CRIMSON }}>Two counts.</span>
    </div>
    <div style={{ position: 'absolute', left: 90, right: 90, top: 940, fontFamily: SANS, fontWeight: 500, fontSize: 44, lineHeight: 1.4, color: '#453D34' }}>
      This is the natural madd. Tap two fingers while you hold the sound: one, two. Not one. Not five.
    </div>
  </CFrame>
);

/** A Quran word with its stretch letter in crimson. */
const QWord: React.FC<{ before: string; mark: string; after: string; ref: string; note: string; y: number }> = ({ before, mark, after, ref, note, y }) => (
  <div style={{ position: 'absolute', left: 80, right: 80, top: y, height: 270, borderRadius: 30, background: WHITE, border: '8px solid #fff', boxShadow: '0 10px 16px rgba(0,0,0,0.14)',
    display: 'flex', alignItems: 'center', padding: '0 40px', gap: 30 }}>
    <div style={{ flex: '0 0 460px', direction: 'rtl', textAlign: 'center', fontFamily: AR, fontSize: 110, color: INK, lineHeight: 1.4 }}>
      {before}<span style={{ color: CRIMSON }}>{mark}</span>{after}
    </div>
    <div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 38, color: INK, lineHeight: 1.25 }}>{note}</div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, color: '#6B6158', marginTop: 10 }}>{ref}</div>
    </div>
  </div>
);

const S5: React.FC = () => (
  <CFrame n={5} total={N}>
    <div style={{ position: 'absolute', left: 90, right: 90, top: 180, fontFamily: SERIF, fontWeight: 700, fontSize: 70, lineHeight: 1.08, color: INK }}>
      You already read it in <span style={{ fontStyle: 'italic', color: CRIMSON }}>Bismillah.</span>
    </div>
    <QWord before="ٱلرَّحِ" mark="ي" after="مِ" note="ya after kasra: hold it for two" ref="Al-Fatiha 1:1" y={330} />
    <QWord before="ٱلرَّحْمَ" mark="ـٰ" after="نِ" note="the small alif stretches too" ref="Al-Fatiha 1:1" y={630} />
    <QWord before="يُ" mark="و" after="لَدْ" note="waw after damma: two counts" ref="Al-Ikhlas 112:3" y={930} />
  </CFrame>
);

const S6: React.FC = () => (
  <CFrame n={6} total={N}>
    <Paper seed="v13s6" x={70} y={220} w={940} h={680} color={TEAL_DEEP} rot={-1}>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 90, fontFamily: SERIF, fontWeight: 700, fontSize: 80, lineHeight: 1.08, color: WHITE }}>
        Try it now, <span style={{ fontStyle: 'italic', color: GOLD_SOFT }}>out loud.</span>
      </div>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 260, direction: 'rtl', textAlign: 'center' }}><Big size={150} color={WHITE}>بَا · بُو · بِي</Big></div>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 540, fontFamily: SANS, fontWeight: 500, fontSize: 40, color: WHITE }}>Two taps for each. Then read Bismillah and listen for the stretch.</div>
    </Paper>
    <Img src={staticFile('img/zaad-bag.svg')} style={{ position: 'absolute', right: 90, top: 1060, width: 180, transform: 'rotate(8deg)', filter: 'drop-shadow(0 8px 10px rgba(40,25,15,0.3))' }} />
    <ZadStill emote="cheer" k={30} x={860} y={990} size={380} />
    <div style={{ position: 'absolute', left: 90, top: 1030, background: INK, color: WHITE, fontFamily: SANS, fontWeight: 700, fontSize: 44, padding: '16px 36px', borderRadius: 999,
      border: '8px solid #fff', boxShadow: '0 10px 18px rgba(0,0,0,0.25)' }}>Save this for your next read</div>
  </CFrame>
);

export const V13Madd: React.FC = () => {
  const f = useCurrentFrame();
  return [<S1 />, <S2 />, <S3 />, <S4 />, <S5 />, <S6 />][Math.min(f, N - 1)];
};
