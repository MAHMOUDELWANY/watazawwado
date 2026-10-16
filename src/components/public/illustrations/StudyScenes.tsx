import React from 'react';
import {
  GOLD, GOLD_HI, GOLD_LO, PAPER, PAPER_SHADE, INK, CRIMSON_DEEP,
  useGradientIds, GoldGradient, Sparkle, OpenMushaf, HangingLantern, Glyph,
} from './svgKit';

/**
 * Flat study scenes, one per subject family, for the family headers on the subjects page.
 * Faceless figures on a soft blob, gently moving: .scene-bob (floating things), .scene-flutter
 * (a page), .scene-drift (letters rising), .scene-swing (a lantern); all off for reduced motion.
 */

const SKIN = '#E2B48C';
const SKIN_DEEP = '#B9805A';
const HAIR = '#4A2A1E';
const TEAL = '#087D91';
const TEAL_DEEP = '#05434E';
const CRIMSON = '#B4231F';
const COPPER = '#8B4935';

type SceneProps = { className?: string };

function Scene({ className, tint, children }: SceneProps & { tint: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 320 220" className={className} aria-hidden="true" focusable="false" fill="none">
      <path
        className="scene-blob"
        style={{ fill: tint }}
        d="M58 46 C96 6 182 0 236 26 C292 52 312 112 290 160 C268 206 186 214 116 204 C50 194 6 160 16 110 C22 80 34 62 58 46 Z"
      />
      <ellipse cx="160" cy="196" rx="128" ry="9" fill={COPPER} fillOpacity="0.16" />
      {children}
    </svg>
  );
}

/** A head in a hijab, faceless; (x, y) is the centre of the face. */
function HijabHead({ x, y, cloth }: { x: number; y: number; cloth: string }) {
  return (
    <g>
      <path d={`M${x - 18} ${y + 4} C${x - 18} ${y - 18} ${x - 8} ${y - 24} ${x} ${y - 24} C${x + 8} ${y - 24} ${x + 18} ${y - 18} ${x + 18} ${y + 4} C${x + 18} ${y + 18} ${x + 9} ${y + 24} ${x} ${y + 24} C${x - 9} ${y + 24} ${x - 18} ${y + 18} ${x - 18} ${y + 4} Z`} fill={cloth} />
      <ellipse cx={x} cy={y + 1} rx="9.5" ry="12" fill={SKIN} />
    </g>
  );
}

/** A plain head with short hair (or a kufi), faceless. */
function Head({ x, y, r, skin = SKIN, cap = HAIR }: { x: number; y: number; r: number; skin?: string; cap?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={skin} />
      <path d={`M${x - r} ${y - 1} C${x - r} ${y - r * 1.15} ${x + r} ${y - r * 1.15} ${x + r} ${y - 1} C${x + r * 0.6} ${y - r * 0.55} ${x - r * 0.6} ${y - r * 0.55} ${x - r} ${y - 1} Z`} fill={cap} />
    </g>
  );
}

function Plant({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x - 6} 168 C${x - 22} 158 ${x - 20} 140 ${x - 14} 132 C${x - 6} 142 ${x - 4} 156 ${x - 6} 168 Z`} fill={TEAL} fillOpacity="0.75" />
      <path d={`M${x + 4} 168 C${x + 18} 156 ${x + 20} 140 ${x + 12} 128 C${x + 4} 140 ${x + 2} 156 ${x + 4} 168 Z`} fill={TEAL_DEEP} fillOpacity="0.8" />
      <path d={`M${x - 11} 194 L${x - 13} 170 H${x + 13} L${x + 11} 194 Z`} fill={COPPER} />
    </g>
  );
}

/** A floating ayah marker: a gold ring with a dot. */
function AyahMark({ x, y, r = 7 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} stroke={GOLD} strokeWidth="1.8" fill={PAPER} fillOpacity="0.9" />
      <circle cx={x} cy={y} r={r * 0.32} fill={GOLD_LO} />
    </g>
  );
}

/** Quran: a parent and a child reading together at a rehal, verses floating up. */
export function QuranScene({ className }: SceneProps) {
  const id = useGradientIds('gold');
  return (
    <Scene className={className} tint="#C51F24">
      <defs><GoldGradient id={id.gold} /></defs>
      <circle className="emblem-glow" cx="160" cy="112" r="46" fill={GOLD} fillOpacity="0.2" />
      <Plant x={290} />
      {/* rehal and mushaf */}
      <g stroke={`url(#${id.gold})`} strokeWidth="6" strokeLinecap="round">
        <path d="M140 192 L178 150" />
        <path d="M180 192 L142 150" />
      </g>
      <OpenMushaf transform="translate(160 138) scale(0.95) translate(-48 -45)" flutter />
      {/* child */}
      <path d="M50 194 C50 180 64 175 86 175 C108 175 120 182 120 194 Z" fill={CRIMSON} />
      <path d="M68 182 C68 156 76 142 88 142 C100 142 108 156 108 182 Z" fill={GOLD} />
      <path d="M102 158 C114 156 122 150 128 144" stroke={GOLD} strokeWidth="8" strokeLinecap="round" />
      <circle cx="129" cy="143" r="4" fill={SKIN_DEEP} />
      <Head x={88} y={126} r={13} skin={SKIN_DEEP} cap={PAPER} />
      {/* parent */}
      <path d="M196 194 C196 178 212 172 238 172 C262 172 278 180 278 194 Z" fill={TEAL_DEEP} />
      <path d="M214 180 C214 142 224 126 240 126 C256 126 266 142 266 180 Z" fill={TEAL} />
      <path d="M222 148 C208 152 200 148 194 142" stroke={TEAL} strokeWidth="9" strokeLinecap="round" />
      <circle cx="192" cy="141" r="4.2" fill={SKIN} />
      <HijabHead x={240} y={104} cloth={TEAL_DEEP} />
      {/* floating verses and light */}
      <g className="scene-bob"><AyahMark x={124} y={70} /></g>
      <g className="scene-bob" style={{ animationDelay: '1.6s' }}><AyahMark x={198} y={56} r={8} /></g>
      <g className="scene-bob" style={{ animationDelay: '3.1s' }}><AyahMark x={160} y={36} r={5.5} /></g>
      <Sparkle x={142} y={48} r={5} delay={0.4} />
      <Sparkle x={182} y={82} r={3.5} delay={1.5} />
      <Sparkle x={104} y={44} r={3} delay={2.4} />
    </Scene>
  );
}

/** Islamic studies: a young reader under a lantern, books beside, a crescent in the sky. */
export function IslamicStudiesScene({ className }: SceneProps) {
  const id = useGradientIds('gold', 'moon');
  return (
    <Scene className={className} tint="#087D91">
      <defs>
        <GoldGradient id={id.gold} />
        <mask id={id.moon}>
          <circle cx="62" cy="54" r="16" fill="#fff" />
          <circle cx="70" cy="47" r="14" fill="#000" />
        </mask>
      </defs>
      <circle className="emblem-glow" cx="62" cy="54" r="24" fill={GOLD} fillOpacity="0.18" />
      <circle cx="62" cy="54" r="16" fill={GOLD_HI} mask={`url(#${id.moon})`} />
      <Sparkle x={98} y={30} r={4} delay={0.6} />
      <Sparkle x={40} y={92} r={3} delay={1.7} />
      <HangingLantern x={204} top={0} s={1.45} goldId={id.gold} />
      {/* books */}
      <rect x="226" y="178" width="60" height="15" rx="2.5" fill={CRIMSON} />
      <rect x="232" y="163" width="50" height="15" rx="2.5" fill={GOLD} />
      <rect x="228" y="148" width="54" height="15" rx="2.5" fill={TEAL} />
      <g stroke={PAPER} strokeOpacity="0.7" strokeWidth="1.4" strokeLinecap="round">
        <path d="M232 185.5 H280" /><path d="M238 170.5 H276" /><path d="M234 155.5 H276" />
      </g>
      {/* reader */}
      <path d="M90 194 C90 178 110 172 140 172 C170 172 188 178 188 194 Z" fill={COPPER} />
      <path d="M116 178 C116 142 126 124 140 124 C154 124 164 142 164 178 Z" fill={TEAL_DEEP} />
      <Head x={140} y={104} r={15} cap={PAPER} />
      <path d="M140 162 L116 154 V132 L140 140 Z" fill={CRIMSON_DEEP} />
      <path d="M140 160 L119 152 V132 L140 139 Z" fill={PAPER} />
      <g className="scene-flutter" style={{ transformOrigin: '0% 50%' }}>
        <path d="M140 160 L161 152 V132 L140 139 Z" fill={PAPER_SHADE} />
      </g>
      <circle cx="118" cy="152" r="4.5" fill={SKIN} />
      <circle cx="162" cy="152" r="4.5" fill={SKIN} />
      <g className="scene-bob" style={{ animationDelay: '0.8s' }}><Sparkle x={168} y={118} r={4} /></g>
    </Scene>
  );
}

/** Arabic: a student writing with a qalam while letters float up from the page. */
export function ArabicScene({ className }: SceneProps) {
  const id = useGradientIds('gold');
  const letters: Array<[string, number, number, string]> = [
    ['ع', 186, 112, CRIMSON], ['ب', 214, 96, TEAL], ['م', 238, 116, GOLD_LO], ['ج', 200, 74, COPPER], ['ا', 250, 82, TEAL_DEEP],
  ];
  return (
    <Scene className={className} tint="#8B4935">
      <defs><GoldGradient id={id.gold} /></defs>
      <circle className="emblem-glow" cx="214" cy="104" r="44" fill={GOLD} fillOpacity="0.18" />
      {/* student (behind the desk) */}
      <path d="M96 194 C96 178 108 170 124 170 C140 170 152 178 152 194 Z" fill={TEAL_DEEP} />
      <path d="M94 152 C94 122 106 106 122 106 C138 106 150 122 150 152 Z" fill={CRIMSON} />
      <HijabHead x={122} y={86} cloth={COPPER} />
      {/* desk */}
      <rect x="66" y="150" width="190" height="8" rx="3" fill={COPPER} />
      <rect x="80" y="158" width="6" height="36" rx="2" fill={COPPER} fillOpacity="0.8" />
      <rect x="236" y="158" width="6" height="36" rx="2" fill={COPPER} fillOpacity="0.8" />
      {/* paper, inkwell, writing arm */}
      <path d="M150 150 H232 L224 138 H160 Z" fill={PAPER} />
      <path d="M166 144 H212" stroke={INK} strokeOpacity="0.35" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M244 150 C240 150 238 148 238 145 V140 C238 137 240 136 243 136 H253 C256 136 258 137 258 140 V145 C258 148 256 150 252 150 Z" fill="#3B2219" stroke={`url(#${id.gold})`} strokeWidth="1.4" />
      <rect x="244" y="131" width="8" height="5" rx="1" fill={`url(#${id.gold})`} />
      <path d="M142 126 C154 134 166 140 176 142" stroke={CRIMSON} strokeWidth="8" strokeLinecap="round" />
      <path d="M180 144 L198 116" stroke={GOLD_LO} strokeWidth="3" strokeLinecap="round" />
      <path d="M179.4 145 L181 139.6 L183.4 141.2 Z" fill="#3B2219" />
      <circle cx="178" cy="142" r="4.2" fill={SKIN} />
      {/* letters rising from the page */}
      {letters.map(([ch, x, y, color], i) => (
        <Glyph key={ch} x={x} y={y} size={24} fill={color} className="scene-drift" style={{ animationDelay: `${i * 1.4}s` }}>{ch}</Glyph>
      ))}
      <Sparkle x={168} y={62} r={4} delay={0.5} />
      <Sparkle x={272} y={56} r={3} delay={1.9} />
    </Scene>
  );
}

/** A speech bubble with one letter, gently bobbing. */
function Bubble({ x, y, w, h, tail, fill, ink, letter, latin, delay }: {
  x: number; y: number; w: number; h: number; tail: 'start' | 'end'; fill: string; ink: string; letter: string; latin?: boolean; delay: number;
}) {
  const tx = tail === 'start' ? x + 12 : x + w - 12;
  const dir = tail === 'start' ? -1 : 1;
  return (
    <g className="scene-bob" style={{ animationDelay: `${delay}s` }}>
      <rect x={x} y={y} width={w} height={h} rx="10" fill={fill} />
      <path d={`M${tx - 6} ${y + h - 1} L${tx + dir * 6} ${y + h + 12} L${tx + 6} ${y + h - 1} Z`} fill={fill} />
      <Glyph x={x + w / 2} y={y + h / 2} size={h * 0.6} fill={ink} style={latin ? { fontFamily: "'Thmanyah Serif Display', Georgia, serif" } : undefined}>{letter}</Glyph>
    </g>
  );
}

/** English: two learners talking, an A and an ع between them. */
export function EnglishScene({ className }: SceneProps) {
  const id = useGradientIds('gold');
  return (
    <Scene className={className} tint="#E5A93C">
      <defs><GoldGradient id={id.gold} /></defs>
      <Plant x={290} />
      {/* learner one */}
      <rect x="88" y="150" width="10" height="44" rx="4" fill={TEAL_DEEP} />
      <rect x="104" y="150" width="10" height="44" rx="4" fill={TEAL_DEEP} />
      <path d="M82 158 C82 118 90 102 101 102 C112 102 120 118 120 158 Z" fill={GOLD} />
      <path d="M117 124 C130 120 138 110 142 102" stroke={GOLD} strokeWidth="8" strokeLinecap="round" />
      <circle cx="143" cy="100" r="4.2" fill={SKIN_DEEP} />
      <Head x={101} y={84} r={15} skin={SKIN_DEEP} />
      {/* learner two */}
      <path d="M196 194 C198 152 204 106 220 106 C236 106 242 152 244 194 Z" fill={TEAL} />
      <path d="M204 128 C192 122 186 114 182 106" stroke={TEAL} strokeWidth="8" strokeLinecap="round" />
      <circle cx="181" cy="104" r="4.2" fill={SKIN} />
      <HijabHead x={220} y={86} cloth={CRIMSON} />
      {/* the conversation */}
      <path d="M150 50 C158 38 170 36 178 44" stroke={GOLD} strokeWidth="1.6" strokeDasharray="3 4" strokeLinecap="round" />
      <Bubble x={112} y={24} w={48} h={38} tail="start" fill={PAPER} ink={TEAL_DEEP} letter="A" latin delay={0} />
      <Bubble x={172} y={18} w={48} h={38} tail="end" fill={`url(#${id.gold})`} ink={CRIMSON_DEEP} letter="ع" delay={1.8} />
      <Sparkle x={250} y={34} r={4} delay={0.7} />
      <Sparkle x={86} y={36} r={3} delay={2} />
    </Scene>
  );
}

/** Subject family id (SERVICES_DATA) → its scene. */
export const FAMILY_SCENES: Record<string, React.ComponentType<SceneProps>> = {
  quran: QuranScene,
  islamic_studies: IslamicStudiesScene,
  arabic: ArabicScene,
  english: EnglishScene,
};
