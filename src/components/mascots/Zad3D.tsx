import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sparkles, Trail } from '@react-three/drei';
import {
  AdditiveBlending, CanvasTexture, CatmullRomCurve3, Color, CurvePath, LineCurve3, DoubleSide, Group, InstancedMesh, Mesh, MeshBasicMaterial,
  MeshPhysicalMaterial, NormalBlending, Object3D, SRGBColorSpace, Shape, TubeGeometry, Vector3,
} from 'three';

/**
 * Zad in 3D, built in code from the approved 2D art (crimson khatam body with an engraved pattern,
 * polished gold rim, darker inner star with a gold inlay and studs, cream face in a beaded gold ring,
 * gold feathered wings like the first Zad drawings (owner, 2026-11-13), glossy shoes), so every part can move on its own.
 * Emotes follow the owner's game-pet reference (2026-11-13): big readable motion, a face that reacts, and an effect
 * that says what the move means (hearts for love, a lightbulb for thinking, a salam bubble, confetti, a medal).
 * Needs a lit environment around it (StudioLights in Stage3D) or the gold reads brown.
 */

export type ZadEmote =
  | 'idle' | 'wave' | 'cheer' | 'spin' | 'love' | 'dash' | 'dua' | 'proud' | 'think'
  | 'bow' | 'read' | 'sleep' | 'oops' | 'search' | 'point' | 'clap' | 'check';
export const EMOTE_LENGTH: Record<ZadEmote, number> = {
  idle: 0, wave: 2.2, cheer: 1.9, spin: 1.6, love: 2.8, dash: 2.4, dua: 3, proud: 2.5, think: 3.1,
  bow: 2.6, read: 4.6, sleep: 4.6, oops: 2.7, search: 3.8, point: 2.8, clap: 2.3, check: 2.9,
};

const CRIMSON_DEEP = '#7E1216';
export const GOLD = '#F3C15A';
export const GOLD_LIGHT = '#FFE7A8';
export const COPPER = '#A0603E';
export const FACE = '#FFF4E2';
export const INK = '#1E0F0A';
export const MOUTH = '#6A2219';
export const BLUSH = '#FF8F86';

/** Khatam outline: two overlapping squares, softened corners. */
export function khatam(r: number, round = 0.12) {
  const pts: [number, number][] = [];
  const inner = r * 0.7654;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Math.PI / 2;
    const rr = i % 2 === 0 ? r : inner;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  const s = new Shape();
  const lerp = (p: [number, number], q: [number, number], t: number): [number, number] => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  for (let i = 0; i < 16; i++) {
    const prev = pts[(i + 15) % 16], cur = pts[i], next = pts[(i + 1) % 16];
    const a = lerp(cur, prev, round), b = lerp(cur, next, round);
    if (i === 0) s.moveTo(a[0], a[1]); else s.lineTo(a[0], a[1]);
    s.quadraticCurveTo(cur[0], cur[1], b[0], b[1]);
  }
  return s;
}

export function star4(r: number) {
  const s = new Shape();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.42;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

/** A thin gold line that follows a khatam outline (the inlay around the inner star). */
function inlay(r: number, round: number, tube: number) {
  const pts = khatam(r, round).getPoints(10).map((p) => new Vector3(p.x, p.y, 0));
  return new TubeGeometry(new CatmullRomCurve3(pts, true, 'centripetal'), 320, tube, 8, true);
}

export function canvas(size: number, height = size) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = height;
  return [c, c.getContext('2d')!] as const;
}

export function radialTexture(inner: string) {
  const [c, g] = canvas(128);
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
}

/** Crimson with light from above and a faint engraved field of small eight-point stars. */
function bodyTexture() {
  const S = 512;
  const [c, g] = canvas(S);
  const grad = g.createLinearGradient(0, 0, 0, S);
  grad.addColorStop(0, '#D42A2F');
  grad.addColorStop(0.5, '#B81A20');
  grad.addColorStop(1, '#7E1216');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  const step = 64;
  g.lineWidth = 1.5;
  g.strokeStyle = 'rgba(255,205,150,0.11)';
  for (let row = 0, y = 0; y < S + step; row++, y += step * 0.86) {
    for (let x = row % 2 ? step / 2 : 0; x < S + step; x += step) {
      for (const rot of [0, Math.PI / 4]) {
        g.save(); g.translate(x, y); g.rotate(rot);
        g.strokeRect(-13, -13, 26, 26);
        g.restore();
      }
    }
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  // extrude caps use the shape's x/y as UVs: map the body's ±0.62 onto 0..1
  tex.repeat.set(1 / 1.24, 1 / 1.24);
  tex.offset.set(0.5, 0.5);
  tex.anisotropy = 8;
  return tex;
}

export const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
export const pulse = (u: number, a: number, b: number) => (u < a || u > b ? 0 : Math.sin(((u - a) / (b - a)) * Math.PI));
export const approach = (cur: number, to: number, k: number) => cur + (to - cur) * k;
export const backOut = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2);
/** scale of a prop that pops in with an overshoot at a and shrinks away by b */
export const popIn = (u: number, a: number, b: number) => (u < a || u > b ? 0 : Math.min(backOut((u - a) / 0.35), ease((b - u) / 0.25)));

/** One feather: a pointed leaf, slightly curved up at the tip. */
export function feather(l: number, w: number) {
  const s = new Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(l * 0.45, w, l, w * 0.2);
  s.quadraticCurveTo(l * 0.5, -w * 0.9, 0, 0);
  return s;
}
// [angle, length, width] fanned out from the shoulder; the leading feather is the longest
const FEATHERS: [number, number, number][] = [[0.38, 0.44, 0.075], [0.12, 0.4, 0.07], [-0.14, 0.34, 0.065], [-0.4, 0.27, 0.06]];
const FEATHER_SHAPES = FEATHERS.map(([, l, w]) => feather(l, w));
const COVERT = feather(0.24, 0.09);
const featherExtrude = { depth: 0.025, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.014, bevelSegments: 4, curveSegments: 16 };

export function heartShape(s: number) {
  const h = new Shape();
  h.moveTo(0, -0.9 * s);
  h.bezierCurveTo(-0.15 * s, -0.65 * s, -s, -0.25 * s, -s, 0.25 * s);
  h.bezierCurveTo(-s, 0.75 * s, -0.35 * s, s, 0, 0.55 * s);
  h.bezierCurveTo(0.35 * s, s, s, 0.75 * s, s, 0.25 * s);
  h.bezierCurveTo(s, -0.25 * s, 0.15 * s, -0.65 * s, 0, -0.9 * s);
  return h;
}

/** White sprites shaded top to bottom; the pool tints each one. */
export function spriteTexture(kind: 'heart' | 'star' | 'confetti' | 'puff') {
  const S = 128;
  const [c, g] = canvas(S);
  const grad = g.createLinearGradient(0, 0, 0, S);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(1, '#B9B0A8');
  g.fillStyle = grad;
  if (kind === 'heart') {
    g.beginPath();
    g.moveTo(64, 112);
    g.bezierCurveTo(8, 72, 6, 18, 64, 38);
    g.bezierCurveTo(122, 18, 120, 72, 64, 112);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.beginPath(); g.ellipse(42, 46, 11, 7, -0.6, 0, Math.PI * 2); g.fill();
  } else if (kind === 'star') {
    g.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 26 : 60;
      g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r);
    }
    g.fill();
  } else if (kind === 'confetti') {
    g.fillRect(40, 18, 48, 92);
  } else {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,0.95)');
    r.addColorStop(0.6, 'rgba(255,255,255,0.5)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, S, S);
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** A letter or word on a transparent square: Arabic in the site's display face, redrawn once the font has loaded. */
export function glyphTexture(text: string, { fill = '#FFFFFF', stroke = 'rgba(40,18,10,0.85)', px = 150, w = 256, h = 256, font = "'Thmanyah Serif Display', 'IBM Plex Sans Arabic', serif" } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  const f = `700 ${px}px ${font}`;
  const draw = () => {
    g.clearRect(0, 0, w, h);
    g.direction = 'rtl'; g.font = f; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = px * 0.12; g.strokeStyle = stroke;
    g.strokeText(text, w / 2, h / 2 + px * 0.06);
    g.fillStyle = fill; g.fillText(text, w / 2, h / 2 + px * 0.06);
    tex.needsUpdate = true;
  };
  draw();
  document.fonts?.load(f).then(draw).catch(() => {});
  return tex;
}

/** Faint lines of script on a cream page. */
function pageTexture() {
  const [c, g] = canvas(128);
  g.fillStyle = '#FFF6E6'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(110,60,40,0.55)'; g.lineWidth = 3; g.lineCap = 'round';
  for (let y = 22; y < 116; y += 13) {
    g.beginPath();
    let x = 112;
    g.moveTo(x, y);
    while (x > 18) { const n = x - 6 - Math.random() * 10; g.quadraticCurveTo((x + n) / 2, y - 3 + Math.random() * 6, n, y); x = n - (Math.random() < 0.25 ? 6 : 0); g.moveTo(x, y); }
    g.stroke();
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** An arrow pointing +x: shaft and head. */
function arrowShape() {
  const s = new Shape();
  s.moveTo(-0.22, 0.045); s.lineTo(0.04, 0.045); s.lineTo(0.04, 0.11); s.lineTo(0.2, 0);
  s.lineTo(0.04, -0.11); s.lineTo(0.04, -0.045); s.lineTo(-0.22, -0.045); s.closePath();
  return s;
}

export function raysTexture() {
  const [c, g] = canvas(256);
  g.translate(128, 128);
  for (let i = 0; i < 16; i++) {
    g.rotate(Math.PI / 8);
    const grad = g.createLinearGradient(0, 0, 0, -128);
    grad.addColorStop(0, 'rgba(255,231,168,0.9)');
    grad.addColorStop(1, 'rgba(255,231,168,0)');
    g.fillStyle = grad;
    g.beginPath(); g.moveTo(-7, 0); g.lineTo(0, -128); g.lineTo(7, 0); g.fill();
  }
  return new CanvasTexture(c);
}

/** Speech bubble with the greeting, in the site's Arabic display face (redrawn once the font has loaded). */
export function bubbleTexture(text: string) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 288;
  const g = c.getContext('2d')!;
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  const font = "700 84px 'Thmanyah Serif Display', 'IBM Plex Sans Arabic', serif";
  const draw = () => {
    g.clearRect(0, 0, 512, 288);
    const [x0, y0, x1, y1, r] = [16, 16, 496, 216, 64];
    g.beginPath();
    g.moveTo(x0 + r, y0); g.lineTo(x1 - r, y0); g.quadraticCurveTo(x1, y0, x1, y0 + r);
    g.lineTo(x1, y1 - r); g.quadraticCurveTo(x1, y1, x1 - r, y1);
    g.lineTo(440, y1); g.lineTo(476, 274); g.lineTo(372, y1); // tail points down-right, at Zad
    g.lineTo(x0 + r, y1); g.quadraticCurveTo(x0, y1, x0, y1 - r);
    g.lineTo(x0, y0 + r); g.quadraticCurveTo(x0, y0, x0 + r, y0);
    g.closePath();
    g.fillStyle = '#FFF4E2'; g.fill();
    g.lineWidth = 10; g.strokeStyle = '#E2A940'; g.stroke();
    g.direction = 'rtl'; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#B81A20'; g.fillText(text, 256, 120);
    tex.needsUpdate = true;
  };
  draw();
  document.fonts?.load(font).then(draw).catch(() => {});
  return tex;
}

export type BurstOpts = {
  n: number; speed: number; colors: string[]; size: [number, number]; life: [number, number];
  gravity?: number; up?: number; flip?: boolean; grow?: boolean;
};
export type PoolApi = { burst: (at: Vector3, o: BurstOpts) => void };

/** Camera-facing sprites (hearts, stars, confetti, dust): thrown out, then fall or float up, sway and fade. */
export function IconPool({ api, map, additive = false, N = 90 }: { api: React.MutableRefObject<PoolApi | null>; map: CanvasTexture; additive?: boolean; N?: number }) {
  const mesh = useRef<InstancedMesh>(null);
  const camera = useThree((s) => s.camera);
  const parts = useMemo(() => Array.from({ length: N }, () => ({ p: new Vector3(), v: new Vector3(), life: 0, max: 1, s: 0, g: 0, spin: 0, rot: 0, ph: 0, flip: false, grow: false })), [N]);
  const dummy = useMemo(() => new Object3D(), []);
  const cursor = useRef(0);
  api.current = {
    burst: (at, o) => {
      for (let i = 0; i < o.n; i++) {
        const k = cursor.current++ % N;
        const q = parts[k];
        const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * Math.PI * 0.8;
        q.p.copy(at);
        q.v.set(Math.cos(a) * Math.cos(e), Math.sin(e) + (o.up ?? 0), Math.sin(a) * Math.cos(e) * 0.6).multiplyScalar(o.speed * (0.5 + Math.random()));
        q.max = q.life = o.life[0] + Math.random() * (o.life[1] - o.life[0]);
        q.s = o.size[0] + Math.random() * (o.size[1] - o.size[0]);
        q.g = o.gravity ?? 1.6;
        q.spin = (Math.random() - 0.5) * (o.flip ? 10 : 2);
        q.rot = (Math.random() - 0.5) * 0.8;
        q.ph = Math.random() * 10;
        q.flip = !!o.flip; q.grow = !!o.grow;
        mesh.current?.setColorAt(k, new Color(o.colors[i % o.colors.length]));
      }
      if (mesh.current?.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    },
  };
  useFrame(({ clock }, dt) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < N; i++) {
      const q = parts[i];
      if (q.life > 0) {
        q.life -= dt;
        q.v.y -= q.g * dt;
        q.v.multiplyScalar(1 - dt * (q.flip ? 2.4 : 1.4));
        q.p.addScaledVector(q.v, dt);
        if (q.g < 0 || q.flip) q.p.x += Math.sin(t * 3 + q.ph) * dt * 0.2; // drift side to side
        q.rot += q.spin * dt;
      }
      const k = q.life > 0 ? q.life / q.max : 0;
      let s = q.s * Math.min(1, (1 - k) * 10) * Math.min(1, k * 3);
      if (q.grow) s *= 1 + (1 - k) * 1.6;
      dummy.position.copy(q.p);
      dummy.quaternion.copy(camera.quaternion);
      dummy.rotateZ(q.rot);
      dummy.scale.set(q.flip ? s * Math.cos(t * 9 + q.ph) : s, s, s);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, N]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} side={DoubleSide} blending={additive ? AdditiveBlending : NormalBlending} toneMapped={false} />
    </instancedMesh>
  );
}

export type Burst = (at: Vector3, n: number, speed: number, color?: string, up?: number) => void;

/** Pool of additive sparks; burst() throws a ring of them out from a point. */
export function SparkPool({ api }: { api: React.MutableRefObject<{ burst: Burst } | null> }) {
  const N = 160;
  const mesh = useRef<InstancedMesh>(null);
  const parts = useMemo(() => Array.from({ length: N }, () => ({ p: new Vector3(), v: new Vector3(), life: 0, max: 1, s: 0.03, spin: 0 })), []);
  const dummy = useMemo(() => new Object3D(), []);
  const colors = useMemo(() => [new Color(GOLD_LIGHT), new Color('#FFFFFF'), new Color('#FF9C94'), new Color(GOLD)], []);
  const cursor = useRef(0);
  api.current = {
    burst: (at, n, speed, color, up = 0) => {
      for (let i = 0; i < n; i++) {
        const k = cursor.current++ % N;
        const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.3) * Math.PI * 0.8;
        const q = parts[k];
        q.p.copy(at);
        q.v.set(Math.cos(a) * Math.cos(e), Math.sin(e) + up, Math.sin(a) * Math.cos(e) * 0.6).multiplyScalar(speed * (0.5 + Math.random()));
        q.max = q.life = 0.7 + Math.random() * 0.7;
        q.s = 0.022 + Math.random() * 0.04;
        q.spin = (Math.random() - 0.5) * 12;
        mesh.current?.setColorAt(k, color ? new Color(color) : colors[i % colors.length]);
      }
      if (mesh.current?.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    },
  };
  useFrame((_, dt) => {
    if (!mesh.current) return;
    for (let i = 0; i < N; i++) {
      const q = parts[i];
      if (q.life > 0) {
        q.life -= dt;
        q.v.y -= dt * 1.6;
        q.v.multiplyScalar(1 - dt * 1.2);
        q.p.addScaledVector(q.v, dt);
      }
      dummy.position.copy(q.p);
      dummy.rotation.set(0, 0, q.life * q.spin);
      // twinkle: sparks swell then shrink
      const k = q.life > 0 ? q.life / q.max : 0;
      dummy.scale.set(q.s * k * 1.7, q.s * k * 1.7, q.s * 0.4);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, N]} frustumCulled={false}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  );
}

/** Polished gold, shared look for rim, ring, studs and wings. */
export const Gold = ({ rough = 0.16, color = GOLD }: { rough?: number; color?: string }) => (
  <meshPhysicalMaterial color={color} metalness={1} roughness={rough} clearcoat={1} clearcoatRoughness={0.08} envMapIntensity={1.6} />
);

/** A gold wing fanned from the shoulder, a crimson covert feather on top; built pointing right, mirrored for the left. */
function Wing({ side }: { side: 1 | -1 }) {
  return (
    <group rotation={[0, 0, side * -0.9]}>
      <group scale={[side, 1, 1]}>
        {FEATHERS.map(([a], i) => (
          <mesh key={i} rotation={[0, 0, a]} position={[0, 0, -i * 0.016]} castShadow>
            <extrudeGeometry args={[FEATHER_SHAPES[i], featherExtrude]} />
            <Gold rough={0.12 + i * 0.03} color={i % 2 ? '#E5AC48' : GOLD} />
          </mesh>
        ))}
        <mesh rotation={[0, 0, 0.18]} position={[0, 0, 0.035]} castShadow>
          <extrudeGeometry args={[COVERT, featherExtrude]} />
          <meshPhysicalMaterial color="#C51F24" roughness={0.3} clearcoat={1} clearcoatRoughness={0.1} sheen={0.5} sheenColor="#FF9C94" />
        </mesh>
        <mesh position={[0.02, 0, 0.06]} scale={[1, 1, 0.7]}>
          <sphereGeometry args={[0.048, 20, 16]} />
          <Gold rough={0.1} />
        </mesh>
      </group>
    </group>
  );
}

export function ZadModel({ emote, startedAt, onDone, still }: { emote: ZadEmote; startedAt: number; onDone: () => void; still: boolean }) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const openL = useRef<Group>(null);
  const openR = useRef<Group>(null);
  const arcL = useRef<Mesh>(null);
  const arcR = useRef<Mesh>(null);
  const smile = useRef<Mesh>(null);
  const mouthO = useRef<Group>(null);
  const blushL = useRef<Mesh>(null);
  const blushR = useRef<Mesh>(null);
  const ring = useRef<Mesh>(null);
  const ringB = useRef<Mesh>(null);
  const column = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);
  const trailHead = useRef<Mesh>(null);
  const sparks = useRef<{ burst: Burst } | null>(null);
  const hearts = useRef<PoolApi | null>(null);
  const stars = useRef<PoolApi | null>(null);
  const confetti = useRef<PoolApi | null>(null);
  const puffs = useRef<PoolApi | null>(null);
  const bubble = useRef<Mesh>(null);
  const bulb = useRef<Group>(null);
  const bulbGlass = useRef<MeshPhysicalMaterial>(null);
  const bulbGlow = useRef<Mesh>(null);
  const dots = useRef<(Mesh | null)[]>([]);
  const medal = useRef<Group>(null);
  const rays = useRef<Mesh>(null);
  const bigHeart = useRef<Group>(null);
  const bubbleMat = useRef<MeshBasicMaterial>(null);
  const eyeSide = useRef<(Group | null)[]>([]);
  const book = useRef<Group>(null);
  const bookHalf = useRef<(Group | null)[]>([]);
  const flipPage = useRef<Group>(null);
  const letters = useRef<(Mesh | null)[]>([]);
  const word = useRef<Mesh>(null);
  const question = useRef<Group>(null);
  const sweat = useRef<Group>(null);
  const lens = useRef<Group>(null);
  const lensX = useRef(0);
  const arrow = useRef<Group>(null);
  const tickGroup = useRef<Group>(null);
  const tick = useRef<Mesh>(null);
  const tickCorner = useRef<Mesh>(null);
  const tickTip = useRef<Mesh>(null);
  const zees = useRef<PoolApi | null>(null);
  const fired = useRef<Set<string>>(new Set());
  const tapAt = useRef(-10);
  const face = useRef({ open: 0, happy: 0, blush: 0.55 });
  const { pointer, clock } = useThree();

  const bodyShape = useMemo(() => khatam(0.62), []);
  const rimShape = useMemo(() => khatam(0.7, 0.14), []);
  const innerShape = useMemo(() => khatam(0.52, 0.1), []);
  const inlayGeo = useMemo(() => inlay(0.52, 0.1, 0.013), []);
  const medalShape = useMemo(() => khatam(0.2, 0.12), []);
  const badgeShape = useMemo(() => khatam(0.24, 0.12), []);
  const badgeInner = useMemo(() => khatam(0.17, 0.1), []);
  const badgeStar = useMemo(() => star4(0.08), []);
  const heartGeo = useMemo(() => heartShape(0.25), []);
  const arrowGeo = useMemo(() => arrowShape(), []);
  const questionGeo = useMemo(() => new TubeGeometry(new CatmullRomCurve3(
    [[-0.075, 0.08], [-0.06, 0.15], [0, 0.185], [0.065, 0.15], [0.07, 0.085], [0.02, 0.035], [0, -0.01], [0, -0.05]].map(([a, b]) => new Vector3(a, b, 0)),
  ), 64, 0.024, 12), []);
  const tickCurve = useMemo(() => {
    const c = new CurvePath<Vector3>();
    const a = new Vector3(-0.3, -0.07, 0), b = new Vector3(-0.1, -0.29, 0), d = new Vector3(0.3, 0.29, 0);
    c.add(new LineCurve3(a, b)); c.add(new LineCurve3(b, d));
    return c;
  }, []);
  const tickGeo = useMemo(() => new TubeGeometry(tickCurve, 60, 0.035, 10), [tickCurve]);
  const tex = useMemo(() => ({
    heart: spriteTexture('heart'), star: spriteTexture('star'), confetti: spriteTexture('confetti'), puff: spriteTexture('puff'),
    rays: raysTexture(), bubble: bubbleTexture('السلام عليكم'), welcome: bubbleTexture('أهلاً بيك'),
    z: glyphTexture('Z', { font: "'IBM Plex Sans', 'Segoe UI', sans-serif", px: 170 }),
    page: pageTexture(),
    letters: ['ا', 'ق', 'ر', 'أ'].map((ch) => glyphTexture(ch, { fill: GOLD_LIGHT, stroke: '#6A2A12', px: 170 })),
    word: glyphTexture('اقرأ', { fill: GOLD_LIGHT, stroke: '#6A2A12', px: 170, w: 512, h: 256 }),
  }), []);
  const glow = useMemo(() => radialTexture('rgba(246,194,90,1)'), []);
  const blush = useMemo(() => radialTexture('rgba(255,143,134,1)'), []);
  const bodyMap = useMemo(() => bodyTexture(), []);
  const studs = useMemo(() => Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2 + Math.PI / 2), []);
  const beads = useMemo(() => Array.from({ length: 30 }, (_, i) => (i / 30) * Math.PI * 2), []);
  const extrude = { depth: 0.18, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 8, curveSegments: 12 };
  const extrudeThin = { depth: 0.1, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 6, curveSegments: 12 };
  const extrudeInner = { depth: 0.02, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 4, curveSegments: 12 };
  const badgeExtrude = { depth: 0.05, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 5, curveSegments: 12 };
  const heartExtrude = { depth: 0.08, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 8, curveSegments: 24 };

  React.useEffect(() => { fired.current = new Set(); }, [startedAt]);

  useFrame(({ clock: c }) => {
    const t = c.getElapsedTime();
    const u = t - startedAt;
    const len = EMOTE_LENGTH[emote];
    if (emote !== 'idle' && u > len) onDone();
    const once = (key: string, at: number, fn: () => void) => {
      if (u >= at && !fired.current.has(key)) { fired.current.add(key); fn(); }
    };
    const b = body.current!, r = root.current!, aL = armL.current!, aR = armR.current!;
    if (!b || !r || !aL || !aR) return;

    // defaults: idle breathing and a soft sway; arms resting
    const breathe = still ? 0 : Math.sin(t * 2) * 0.02;
    let y = breathe, rotY = still ? 0 : Math.sin(t * 0.6) * 0.18, rotZ = 0, sx = 1, sy = 1 + breathe * 0.6, x = 0, z = 0;
    // wings rest a little open, with a quick flutter every few seconds
    const flutter = still ? 0 : pulse(t % 5.5, 0, 0.45) * Math.sin(t * 34) * 0.14;
    let lA = -0.35 + (still ? 0 : Math.sin(t * 2 + 1) * 0.05) - flutter, rA = 0.35 - (still ? 0 : Math.sin(t * 2) * 0.05) + flutter;
    let ringO = 0, ringS = 1, colO = 0, haloO = 0.4 + breathe * 3, trailOn = false, wrap = 0, wrapL = 0, wrapR = 0, wrapK = 0.2, rotX = 0;
    // props of the newer moves: book (open amount, page turn, letters rising, the word), question mark, sweat drop,
    // magnifying glass, pointing arrow, the tick he draws (-1 = hidden)
    let bubbleWelcome = false, wide = 0, bookS = 0, bookOpen = 0, flipP = -1, letterP = -1, wordS = 0;
    let questionS = 0, sweatP = -1, lensS = 0, lensTo = 0, arrowS = 0, tickD = -1, tickS = 0;
    // face targets: open mouth 0..1, happy (^ ^) or calm (closed, praying) eyes, blush strength, gaze offset
    let open = 0, happy = 0, calm = false, blushTo = 0.55, gx = 0, gy = 0;
    // props: salam bubble, thinking dots and lightbulb, medal, the heart held to the chest, light rays behind a prop
    let bubbleS = 0, bulbS = 0, lit = 0, medalS = 0, heartS = 0, raysO = 0;
    const dotS = [0, 0, 0];
    const raysOnBulb = emote === 'think';
    const at = (px: number, py: number, pz: number) => new Vector3(px + x, py, pz);

    // tap: a quick squash and giggle
    const tu = t - tapAt.current;
    if (tu < 0.6) {
      const p = pulse(tu, 0, 0.5); sy -= p * 0.18; sx += p * 0.12; rotZ += Math.sin(tu * 40) * 0.08 * Math.max(0, 1 - tu / 0.5);
      happy = 1; open = 0.6; blushTo = 0.95;
    }

    if (!still) switch (emote) {
      case 'wave': {
        rA = 0.35 + ease(u / 0.3) * 1.45 - ease((u - 1.7) / 0.3) * 1.45;
        rA += u > 0.3 && u < 1.7 ? Math.sin((u - 0.3) * 14) * 0.35 : 0;
        rotZ += Math.sin(u * 7) * 0.05 * pulse(u, 0, 2);
        open = pulse(u, 0.1, 1.9) * 0.55;
        happy = u > 0.4 && u < 1.8 ? 1 : 0;
        bubbleS = popIn(u, 0.25, 2.1);
        break;
      }
      case 'cheer': {
        const j1 = pulse(u, 0.15, 0.7), j2 = pulse(u, 0.8, 1.4);
        y += (j1 + j2 * 0.8) * 0.45;
        sy += (pulse(u, 0, 0.18) + pulse(u, 0.68, 0.84) + pulse(u, 1.38, 1.6)) * -0.16 + (j1 + j2) * 0.06;
        sx -= (j1 + j2) * 0.03;
        // wings up and flapping fast
        const flap = Math.sin(u * 30) * 0.32 * pulse(u, 0.1, 1.6);
        lA = -0.35 - ease(u / 0.2) * 1.4 + ease((u - 1.5) / 0.3) * 1.4 - flap;
        rA = 0.35 + ease(u / 0.2) * 1.4 - ease((u - 1.5) / 0.3) * 1.4 + flap;
        open = 1; happy = 1; blushTo = 0.9;
        const party = { speed: 2.6, up: 1.3, gravity: 2.2, flip: true, size: [0.09, 0.14] as [number, number], life: [1.6, 2.3] as [number, number], colors: ['#C51F24', GOLD, '#FFF4E2', '#E43A3F', '#E5AC48', '#A0603E'] };
        once('c1', 0.45, () => confetti.current?.burst(at(0, 1.3, 0.2), { n: 46, ...party }));
        once('c2', 1.1, () => confetti.current?.burst(at(0, 1.2, 0.2), { n: 36, ...party }));
        break;
      }
      case 'spin': {
        const k = ease(u / 1.3);
        rotY += k * Math.PI * 4;
        y += pulse(u, 0, 1.4) * 0.2;
        lA = -0.35 - pulse(u, 0, 1.4) * 1.1; rA = 0.35 + pulse(u, 0, 1.4) * 1.1;
        ringO = pulse(u, 0.05, 1.5); ringS = 0.8 + k * 0.6;
        open = 0.8; happy = u > 1.25 ? 1 : 0;
        once('s1', 1.3, () => sparks.current?.burst(new Vector3(0, 0.6, 0), 44, 2.4, GOLD_LIGHT, 0.2));
        break;
      }
      case 'love': {
        // hugs a glossy heart to his chest, it beats twice, then breaks into small hearts floating up
        const hold = pulse(u, 0.1, 1.5) > 0 ? ease(u / 0.3) * (1 - ease((u - 1.25) / 0.25)) : 0;
        lA = -0.35 - hold * 0.5; rA = 0.35 + hold * 0.5; wrap = hold;
        const beat = Math.max(0, Math.sin((u - 0.45) * 11)) ** 6 * (u > 0.45 && u < 1.3 ? 1 : 0);
        heartS = popIn(u, 0.2, 1.35) * (1 + beat * 0.22);
        sx += beat * 0.04; sy += beat * 0.04;
        y += pulse(u, 1.3, 1.8) * 0.18;
        haloO += pulse(u, 0.4, 2.4) * 0.5;
        happy = 1; blushTo = 1;
        const love = { colors: ['#E43A3F', '#FF8F86', '#C51F24', '#FFB3AC'], gravity: -0.7, life: [1.6, 2.4] as [number, number] };
        once('l1', 1.3, () => hearts.current?.burst(at(0, 0.75, 0.5), { n: 18, speed: 1.5, up: 0.5, size: [0.08, 0.15], ...love }));
        once('l2', 1.8, () => hearts.current?.burst(at(0, 1.2, 0.3), { n: 10, speed: 0.9, up: 0.8, size: [0.06, 0.11], ...love }));
        break;
      }
      case 'dash': {
        // crouch, launch off to the upper right, drop back in and hit the ground
        sy += pulse(u, 0, 0.35) * -0.25;
        const out = ease((u - 0.3) / 0.5), back = ease((u - 1.1) / 0.45);
        if (u < 1.1) { x = out * 2.6; y += out * 2.2; rotZ += -out * 0.9; }
        else { x = (1 - back) * -2.4; y += (1 - back) * 2.4; rotZ += (1 - back) * 0.9; }
        sy += pulse(u, 1.55, 1.85) * -0.3; sx += pulse(u, 1.55, 1.85) * 0.22;
        // flies with his wings beating
        const beatW = Math.sin(u * 32) * 0.4 * pulse(u, 0.3, 1.6);
        lA = -0.35 - out * 1.2 * (1 - back) - beatW; rA = 0.35 + out * 1.2 * (1 - back) + beatW;
        trailOn = u > 0.3 && u < 1.6;
        ringO = pulse(u, 1.55, 2.3); ringS = 0.4 + ease((u - 1.55) / 0.7) * 2.2;
        open = u < 1.6 ? 1 : 0.4; happy = u > 1.6 ? 1 : 0;
        // dust clouds at take-off and landing
        const dust = { colors: ['#F4E6CC', '#E8D5B0', '#D9BF94'], gravity: -0.25, up: -0.25, grow: true };
        once('d0', 0.32, () => puffs.current?.burst(new Vector3(0, 0.08, 0), { n: 14, speed: 1.3, size: [0.14, 0.24], life: [0.7, 1.1], ...dust }));
        once('d1', 1.56, () => puffs.current?.burst(new Vector3(0, 0.08, 0.05), { n: 24, speed: 2, size: [0.16, 0.28], life: [0.8, 1.3], ...dust }));
        once('d2', 1.58, () => sparks.current?.burst(new Vector3(0, 0.2, 0.1), 24, 2, GOLD_LIGHT, 0.6));
        break;
      }
      case 'dua': {
        lA = -0.35 - ease(u / 0.5) * 1.25 + ease((u - 2.6) / 0.4) * 1.25;
        rA = 0.35 + ease(u / 0.5) * 1.25 - ease((u - 2.6) / 0.4) * 1.25;
        wrap = pulse(u, 0.2, 2.9) > 0 ? ease(u / 0.5) * (1 - ease((u - 2.6) / 0.4)) * 0.5 : 0;
        if (pulse(u, 0.4, 2.8) > 0.1) { happy = 1; calm = true; }
        y += pulse(u, 0.5, 2.8) * 0.12;
        colO = pulse(u, 0.3, 3) * 0.9;
        haloO += pulse(u, 0.3, 3) * 0.6;
        // small gold stars rise from the raised wings, like a prayer going up
        const rise = { n: 4, speed: 0.35, up: 1, gravity: -0.5, colors: [GOLD_LIGHT, GOLD], size: [0.05, 0.08] as [number, number], life: [1.6, 2.2] as [number, number] };
        for (const [k, when] of [['a', 0.6], ['b', 1.2], ['c', 1.8]] as const) {
          once(`u${k}L`, when, () => stars.current?.burst(at(-0.55, 1.05, 0.25), rise));
          once(`u${k}R`, when + 0.15, () => stars.current?.burst(at(0.55, 1.05, 0.25), rise));
        }
        break;
      }
      case 'proud': {
        sx += pulse(u, 0.2, 2) * 0.12; sy += pulse(u, 0.2, 2) * 0.1;
        rotZ += Math.sin(u * 3) * 0.06 * pulse(u, 0.2, 2);
        lA = -0.35 + pulse(u, 0.2, 2) * 0.6; rA = 0.35 - pulse(u, 0.2, 2) * 0.6; // wings tucked on his sides
        if (pulse(u, 0.3, 1.9) > 0.3) happy = 1;
        blushTo = 0.85;
        // a gold medal for you rises above his head with rays behind it, and stars rain down
        medalS = popIn(u, 0.25, 2.3);
        raysO = popIn(u, 0.35, 2.2);
        const rain = { speed: 1.1, up: 0.2, gravity: 1.4, colors: [GOLD_LIGHT, GOLD, '#FFFFFF'], size: [0.06, 0.11] as [number, number], life: [1.3, 1.9] as [number, number] };
        once('p1', 0.55, () => stars.current?.burst(at(0, 2.05, 0.1), { n: 16, ...rain }));
        once('p2', 1.15, () => stars.current?.burst(at(0, 2.05, 0.1), { n: 12, ...rain }));
        break;
      }
      case 'think': {
        rotZ += pulse(u, 0.2, 2.9) * 0.18;
        rA = 0.35 + pulse(u, 0.1, 2.9) * 1.5; // wing tip to the chin
        y += Math.sin(u * 4) * 0.015;
        const look = pulse(u, 0.2, 2.9);
        gx = look * 0.05; gy = look * 0.05; open = u < 1.55 ? look * 0.3 : 0;
        // three thought dots, then a lightbulb that flickers on: he has an idea
        dotS[0] = popIn(u, 0.3, 1.5) * 0.6; dotS[1] = popIn(u, 0.55, 1.5) * 0.8; dotS[2] = popIn(u, 0.8, 1.5);
        bulbS = popIn(u, 1.25, 2.95);
        lit = u < 1.55 ? 0 : u < 1.8 ? (Math.sin(u * 90) > 0 ? 1 : 0.15) : 1;
        raysO = u > 1.8 ? popIn(u, 1.8, 2.9) : 0;
        if (u > 1.8) { happy = 1; open = 0.7; blushTo = 0.85; }
        once('t1', 1.82, () => stars.current?.burst(at(0.12, 1.95, 0.15), { n: 14, speed: 1.2, up: 0.3, gravity: 0.6, colors: [GOLD_LIGHT, '#FFFFFF'], size: [0.06, 0.1], life: [0.7, 1.1] }));
        break;
      }
      case 'bow': {
        // right wing on the heart, a slow bow with closed eyes, then «أهلاً بيك»
        const hold = ease(u / 0.35) * (1 - ease((u - 2.1) / 0.4));
        rA = 0.35 + hold * 0.7; wrapR = hold * 1.15;
        lA = -0.35 + hold * 0.12;
        const bow = pulse(u, 0.45, 1.9);
        rotX += bow * 0.38;
        if (hold > 0.3) { happy = 1; calm = bow > 0.15; }
        blushTo = 0.95;
        haloO += pulse(u, 0.4, 2.3) * 0.45;
        bubbleS = popIn(u, 1.55, 2.6); bubbleWelcome = true;
        once('b1', 0.95, () => hearts.current?.burst(at(0.2, 0.9, 0.5), { n: 5, speed: 0.4, up: 1, gravity: -0.6, colors: [GOLD_LIGHT, '#FF8F86'], size: [0.05, 0.08], life: [1.2, 1.7] }));
        break;
      }
      case 'read': {
        // opens a book, his eyes run along the lines (right to left, as he reads), two pages turn,
        // then the letters ا ق ر أ float out of the page and join into the word «اقرأ»
        const hold = ease(u / 0.4) * (1 - ease((u - 4.15) / 0.4));
        lA = -0.35 + hold * 0.2; rA = 0.35 - hold * 0.2; wrapL = wrapR = hold * 0.85;
        bookS = popIn(u, 0.1, 4.5);
        bookOpen = ease((u - 0.4) / 0.45) * (1 - ease((u - 4.0) / 0.35));
        flipP = u > 1.5 && u < 2.0 ? ease((u - 1.5) / 0.5) : u > 2.5 && u < 3.0 ? ease((u - 2.5) / 0.5) : -1;
        rotX += hold * 0.1;
        const reading = u > 0.8 && u < 3.0 ? 1 : 0;
        gy = -0.06 * hold; gx = reading * (-0.045 + ((u * 1.1) % 1) * 0.09);
        letterP = u > 3.0 ? u - 3.0 : -1;
        wordS = popIn(u, 3.85, 4.55);
        if (u > 3.7) { happy = 1; open = 0.5; blushTo = 0.9; gy = 0.04 * hold; gx = 0; }
        once('r1', 3.85, () => stars.current?.burst(at(0, 1.95, 0.3), { n: 16, speed: 1.1, up: 0.2, gravity: 0.5, colors: [GOLD_LIGHT, '#FFFFFF'], size: [0.05, 0.09], life: [0.8, 1.2] }));
        break;
      }
      case 'sleep': {
        // dozes off: eyes shut, slow deep breaths, Z Z Z drifting up; then wakes with a start
        const doze = ease(u / 0.6) * (1 - ease((u - 3.7) / 0.12));
        rotZ += doze * (0.13 + Math.sin(u * 1.4) * 0.03);
        rotX += doze * 0.05;
        const breath = Math.sin(u * 2.4);
        sy += doze * breath * 0.035; sx -= doze * breath * 0.012;
        lA = -0.35 + doze * 0.3; rA = 0.35 - doze * 0.3;
        if (doze > 0.3) { happy = 1; calm = true; }
        blushTo = 0.55 + doze * 0.3;
        haloO -= doze * 0.25;
        const zz = { n: 1, speed: 0.25, up: 2.2, gravity: -0.15, colors: [FACE], life: [2.2, 2.6] as [number, number] };
        ([[1, 0.7, 0.1], [2, 1.4, 0.14], [3, 2.1, 0.18], [4, 2.8, 0.13]] as const).forEach(([k, when, sz]) =>
          once(`z${k}`, when, () => zees.current?.burst(at(0.32, 1.25, 0.35), { ...zz, size: [sz, sz] })));
        const jolt = pulse(u, 3.72, 4.15);
        y += jolt * 0.28; sy += jolt * 0.08;
        if (u > 3.72) { wide = pulse(u, 3.72, 4.6); open = wide * 0.8; }
        once('w1', 3.74, () => sparks.current?.burst(at(0, 1.45, 0.2), 14, 1.4, GOLD_LIGHT, 0.5));
        break;
      }
      case 'oops': {
        // shrugs with both wings and tilts his head; a question mark pops up and a sweat drop slides down
        const sh = ease(u / 0.25) * (1 - ease((u - 2.1) / 0.35));
        const bob = Math.sin(u * 9) * 0.05 * sh;
        lA = -0.35 - sh * 0.85 - bob; rA = 0.35 + sh * 0.85 + bob;
        rotZ += sh * 0.15;
        y += pulse(u, 0.12, 0.45) * 0.07;
        open = sh * 0.28; gy = sh * 0.045; gx = -sh * 0.035;
        blushTo = 0.3;
        questionS = popIn(u, 0.3, 2.55);
        sweatP = u > 0.6 && u < 2.3 ? (u - 0.6) / 1.7 : -1;
        break;
      }
      case 'search': {
        // looks around with a magnifying glass (the lens magnifies the eye behind it), then finds it
        const hold = ease(u / 0.35) * (1 - ease((u - 3.4) / 0.35));
        lensS = popIn(u, 0.1, 3.7);
        const looking = u < 2.4 ? 1 : 0;
        lensTo = looking ? Math.sin((u - 0.35) * 2.6) * 0.28 : 0.105;
        rA = 0.35 + hold * 1.05; wrapR = hold * 0.45;
        rotY += Math.sin((u - 0.35) * 2.6) * 0.22 * hold * looking;
        rotX += hold * 0.07;
        gx = lensTo * 0.15;
        if (u > 2.6) { happy = 1; open = 0.6; blushTo = 0.85; }
        once('f1', 2.6, () => stars.current?.burst(at(0.105, 0.95, 0.6), { n: 14, speed: 1.1, up: 0.3, gravity: 0.4, colors: [GOLD_LIGHT, '#FFFFFF'], size: [0.05, 0.09], life: [0.7, 1.1] }));
        break;
      }
      case 'point': {
        // tour guide: turns, holds his wing straight out and points; a gold arrow bounces the same way
        const hold = ease(u / 0.3) * (1 - ease((u - 2.45) / 0.3));
        rA = 0.35 + hold * 1.2 + Math.sin(u * 10) * 0.07 * hold;
        lA = -0.35 + hold * 0.15;
        rotY += hold * 0.4; rotZ -= hold * 0.08;
        gx = hold * 0.06; open = hold * 0.45;
        arrowS = popIn(u, 0.35, 2.7);
        break;
      }
      case 'clap': {
        // claps his wings in front of him, a spark at every clap
        const on = ease(u / 0.25) * (1 - ease((u - 1.9) / 0.3));
        const c = (1 - Math.cos(Math.max(0, u - 0.3) * 2.8 * Math.PI * 2)) / 2; // 0 = together
        lA = -0.35 - on * 0.45; rA = 0.35 + on * 0.45;
        wrapL = wrapR = on * (1.3 - c * 0.75); wrapK = 0.65; // fast enough to keep the beat
        y += on * (1 - c) * 0.04;
        happy = 1; open = on * 0.85; blushTo = 0.9;
        for (let k = 0; k < 4; k++) once(`k${k}`, 0.3 + (k + 1) / 2.8, () => stars.current?.burst(at(0, 0.42, 0.8), { n: 7, speed: 0.9, up: 0.1, gravity: 0.9, colors: [GOLD_LIGHT, GOLD], size: [0.05, 0.085], life: [0.5, 0.8] }));
        break;
      }
      case 'check': {
        // done! he draws a big gold tick in the air with his wing, it pops, and he hops
        tickD = u < 0.3 ? -1 : ease((u - 0.3) / 0.85);
        const draw = pulse(u, 0.2, 1.3);
        lA = -0.35 - draw * 1.2 - Math.sin(u * 8) * 0.12 * draw;
        gx = -draw * 0.06; gy = draw * 0.04;
        rotY -= draw * 0.3;
        tickS = (1 + pulse(u, 1.15, 1.5) * 0.25) * (1 - ease((u - 2.5) / 0.35));
        const hop = pulse(u, 1.25, 1.75); y += hop * 0.28; sy += hop * 0.05;
        if (u > 1.15) { happy = 1; open = 0.8; blushTo = 0.9; }
        once('c1', 1.15, () => {
          stars.current?.burst(at(-0.88, 1.45, 0.3), { n: 14, speed: 1.4, up: 0.2, gravity: 0.6, colors: [GOLD_LIGHT, GOLD, '#FFFFFF'], size: [0.05, 0.1], life: [0.8, 1.2] });
        });
        break;
      }
    }

    r.position.set(x, 0, z);
    b.position.y = y;
    b.rotation.set(rotX, rotY, rotZ);
    b.scale.set(sx, sy, sx);
    aL.rotation.z = lA;
    aR.rotation.z = rA;
    // wrap: wings swing forward around the chest (hug, dua)
    aL.rotation.y = approach(aL.rotation.y, (wrap + wrapL) * 1.1, wrapK);
    aR.rotation.y = approach(aR.rotation.y, -(wrap + wrapR) * 1.1, wrapK);

    const setPop = (o: Group | Mesh | null | undefined, s: number) => {
      if (!o) return;
      o.visible = s > 0.002;
      o.scale.setScalar(Math.max(s, 0.0001));
    };
    setPop(bubble.current, bubbleS);
    if (bubbleMat.current) bubbleMat.current.map = bubbleWelcome ? tex.welcome : tex.bubble;
    // book: halves fold open from the spine, a page turns from his left to his right
    setPop(book.current, bookS);
    bookHalf.current.forEach((h, i) => { if (h) h.rotation.y = (i === 0 ? 1 : -1) * (0.12 + (1 - bookOpen) * 1.45); });
    if (flipPage.current) { flipPage.current.visible = flipP >= 0; flipPage.current.rotation.y = -(0.12 + Math.max(0, flipP) * (Math.PI - 0.24)); }
    const LETTER_X = [0.24, 0.08, -0.08, -0.24];
    letters.current.forEach((m, i) => {
      if (!m) return;
      const k = letterP < 0 ? -1 : (letterP - i * 0.12) / 0.5;
      m.visible = k > 0 && k < 1.15;
      if (!m.visible) return;
      const e = ease(Math.min(k, 1));
      m.position.set(x + LETTER_X[i] * (0.5 + e * 0.5) + Math.sin(e * Math.PI) * LETTER_X[i] * 1.2, 0.5 + e * 1.45, 0.55 - e * 0.25);
      m.scale.setScalar(0.22 * Math.min(1, k * 4) * (k > 1 ? 1 - (k - 1) / 0.15 : 1));
    });
    setPop(word.current, wordS);
    if (word.current) word.current.position.y = 1.95 + Math.sin(t * 2.5) * 0.02;
    setPop(question.current, questionS * 1.3);
    if (question.current) question.current.rotation.z = Math.sin(t * 4) * 0.18;
    if (sweat.current) {
      sweat.current.visible = sweatP >= 0;
      sweat.current.position.y = 0.2 - Math.max(0, sweatP) ** 1.6 * 0.22;
      sweat.current.scale.setScalar(Math.max(0.0001, Math.min(1, sweatP * 6, (1 - sweatP) * 6)));
    }
    lensX.current = approach(lensX.current, lensTo, 0.12);
    setPop(lens.current, lensS);
    if (lens.current) lens.current.position.x = lensX.current;
    eyeSide.current.forEach((g, i) => {
      if (!g) return;
      const ex = (eyes.current?.position.x ?? 0) + (i === 0 ? -0.105 : 0.105);
      g.scale.setScalar((1 + 0.6 * lensS * Math.max(0, 1 - Math.abs(lensX.current - ex) / 0.11)) * (1 + wide * 0.25));
    });
    setPop(arrow.current, arrowS);
    if (arrow.current) arrow.current.position.x = 0.98 + Math.sin(t * 9) * 0.06;
    setPop(tickGroup.current, tickD >= 0 ? tickS : 0);
    if (tickD >= 0 && tick.current && tickTip.current && tickCorner.current) {
      tick.current.geometry.setDrawRange(0, Math.floor(tickD * 60) * 10 * 6);
      tickCorner.current.visible = tickD > 0.3;
      tickTip.current.position.copy(tickCurve.getPointAt(Math.min(tickD, 1)));
      if (tickD < 0.99 && tickGroup.current) stars.current?.burst(tickTip.current.position.clone().add(tickGroup.current.position), { n: 1, speed: 0.3, gravity: 0.3, colors: [GOLD_LIGHT, GOLD], size: [0.04, 0.07], life: [0.4, 0.7] });
    }
    if (bubble.current) bubble.current.position.y = 1.8 + Math.sin(t * 3) * 0.02;
    setPop(bulb.current, bulbS);
    dots.current.forEach((d, i) => setPop(d, dotS[i] * 0.05));
    if (bulbGlass.current) bulbGlass.current.emissiveIntensity = lit * 1.6;
    if (bulbGlow.current) (bulbGlow.current.material as MeshBasicMaterial).opacity = lit * 0.95;
    setPop(medal.current, medalS);
    if (medal.current) { medal.current.rotation.y = Math.sin(t * 2.2) * 0.6; medal.current.position.y = 1.86 + Math.sin(t * 2.5) * 0.03; }
    setPop(bigHeart.current, heartS);
    if (rays.current) {
      rays.current.position.set(raysOnBulb ? 0.12 : 0, raysOnBulb ? 1.84 : 1.86, -0.15);
      rays.current.rotation.z = t * 0.5;
      rays.current.scale.setScalar(raysOnBulb ? 1.1 : 1.4);
      (rays.current.material as MeshBasicMaterial).opacity = Math.min(1, raysO) * 0.85;
      rays.current.visible = raysO > 0.01;
    }

    // face: ease every value so expressions blend instead of popping
    const f = face.current;
    f.open = approach(f.open, open, 0.2);
    f.happy = approach(f.happy, happy, 0.25);
    f.blush = approach(f.blush, blushTo, 0.1);
    const blink = still ? 0 : (t % 3.6 > 3.45 ? 1 : 0);
    const eyeY = Math.max(0.06, (1 - blink) * (1 - f.happy));
    for (const e of [openL.current, openR.current]) if (e) { e.scale.y = eyeY; e.visible = f.happy < 0.9; }
    for (const a of [arcL.current, arcR.current]) if (a) {
      a.visible = f.happy > 0.1;
      a.scale.setScalar(Math.min(1, f.happy * 1.2));
      a.rotation.z = calm ? Math.PI : 0;
    }
    if (smile.current) { smile.current.visible = f.open < 0.5; smile.current.scale.setScalar(1 + f.happy * 0.25); }
    if (mouthO.current) { mouthO.current.visible = f.open >= 0.15; mouthO.current.scale.set(0.6 + f.open * 0.5, 0.35 + f.open * 0.85, 1); }
    for (const m of [blushL.current, blushR.current]) if (m) (m.material as MeshBasicMaterial).opacity = f.blush * 0.75;
    if (eyes.current) {
      eyes.current.position.x = approach(eyes.current.position.x, (emote === 'idle' ? pointer.x * 0.05 : 0) + gx, 0.1);
      eyes.current.position.y = approach(eyes.current.position.y, (emote === 'idle' ? pointer.y * 0.03 : 0) + 0.035 + gy, 0.1);
    }

    if (ring.current && ringB.current) {
      (ring.current.material as MeshBasicMaterial).opacity = ringO * 0.9;
      (ringB.current.material as MeshBasicMaterial).opacity = ringO * 0.5;
      ring.current.scale.setScalar(ringS);
      ringB.current.scale.setScalar(ringS * 1.12);
      ring.current.rotation.z = t * 6;
      ringB.current.rotation.z = -t * 4;
    }
    if (column.current) (column.current.material as MeshBasicMaterial).opacity = colO * 0.35;
    if (halo.current) (halo.current.material as MeshBasicMaterial).opacity = haloO;
    if (trailHead.current) trailHead.current.visible = trailOn;
  });

  return (
    <group>
      <group ref={root}>
        <group
          ref={body}
          onClick={(e) => {
            e.stopPropagation();
            tapAt.current = clock.getElapsedTime();
            hearts.current?.burst(new Vector3(root.current?.position.x ?? 0, 1.2, 0.3), { n: 6, speed: 0.8, up: 0.8, gravity: -0.8, colors: ['#E43A3F', '#FF8F86'], size: [0.06, 0.1], life: [1.1, 1.6] });
          }}
        >
          {/* soft gold halo behind */}
          <mesh ref={halo} position={[0, 0.72, -0.3]}>
            <planeGeometry args={[2.8, 2.8]} />
            <meshBasicMaterial map={glow} transparent opacity={0.3} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>

          <group position={[0, 0.72, 0]}>
            {/* polished gold back plate */}
            <mesh position={[0, 0, -0.12]} castShadow>
              <extrudeGeometry args={[rimShape, extrudeThin]} />
              <Gold rough={0.14} />
            </mesh>
            {/* the back, seen while spinning: crimson star with a gold inlay and a small gold khatam medallion */}
            <group rotation={[0, Math.PI, 0]}>
              <mesh position={[0, 0, 0.16]}>
                <extrudeGeometry args={[innerShape, extrudeInner]} />
                <meshPhysicalMaterial map={bodyMap} roughness={0.36} clearcoat={1} clearcoatRoughness={0.12} />
              </mesh>
              <mesh geometry={inlayGeo} position={[0, 0, 0.195]}><Gold rough={0.12} /></mesh>
              <mesh position={[0, 0, 0.19]}>
                <extrudeGeometry args={[medalShape, extrudeInner]} />
                <Gold rough={0.14} />
              </mesh>
            </group>
            {/* crimson body with the engraved star field */}
            <mesh position={[0, 0, -0.07]} castShadow>
              <extrudeGeometry args={[bodyShape, extrude]} />
              <meshPhysicalMaterial map={bodyMap} roughness={0.34} clearcoat={1} clearcoatRoughness={0.12} sheen={0.5} sheenColor="#FF9C94" envMapIntensity={1.1} />
            </mesh>
            {/* darker inner star, a gold inlay around it, gold studs on the eight points */}
            <mesh position={[0, 0, 0.17]}>
              <extrudeGeometry args={[innerShape, extrudeInner]} />
              <meshPhysicalMaterial color={CRIMSON_DEEP} roughness={0.4} clearcoat={1} clearcoatRoughness={0.1} />
            </mesh>
            <mesh geometry={inlayGeo} position={[0, 0, 0.205]}><Gold rough={0.12} /></mesh>
            {studs.map((a) => (
              <mesh key={a} position={[Math.cos(a) * 0.585, Math.sin(a) * 0.585, 0.19]}>
                <sphereGeometry args={[0.022, 16, 12]} />
                <Gold rough={0.1} />
              </mesh>
            ))}

            {/* face: a cream dome in a beaded gold ring */}
            <mesh position={[0, 0, 0.21]}>
              <torusGeometry args={[0.355, 0.03, 20, 96]} />
              <Gold rough={0.12} />
            </mesh>
            {beads.map((a) => (
              <mesh key={a} position={[Math.cos(a) * 0.392, Math.sin(a) * 0.392, 0.215]}>
                <sphereGeometry args={[0.011, 10, 8]} />
                <Gold rough={0.15} />
              </mesh>
            ))}
            <mesh position={[0, 0, 0.2]} scale={[1, 1, 0.42]}>
              <sphereGeometry args={[0.34, 64, 32]} />
              <meshPhysicalMaterial color={FACE} roughness={0.42} sheen={1} sheenColor="#FFD3BF" sheenRoughness={0.5} clearcoat={0.35} clearcoatRoughness={0.3} />
            </mesh>

            {/* eyes: glossy ink with two highlights; ^ ^ arcs for happy, upside down for a calm closed look */}
            <group ref={eyes} position={[0, 0.035, 0]}>
              {([[-1, openL, arcL], [1, openR, arcR]] as const).map(([side, openRef, arcRef]) => (
                <group key={side} ref={(g) => { eyeSide.current[side < 0 ? 0 : 1] = g; }} position={[side * 0.105, 0, 0]}>
                  <group ref={openRef}>
                    <mesh position={[0, 0, 0.322]} scale={[0.82, 1.12, 0.42]}>
                      <sphereGeometry args={[0.078, 32, 24]} />
                      <meshPhysicalMaterial color={INK} roughness={0.1} clearcoat={1} clearcoatRoughness={0.04} />
                    </mesh>
                    <mesh position={[0.022, 0.036, 0.355]}><sphereGeometry args={[0.024, 16, 12]} /><meshBasicMaterial color="#FFFFFF" toneMapped={false} /></mesh>
                    <mesh position={[-0.022, -0.038, 0.352]}><sphereGeometry args={[0.011, 12, 8]} /><meshBasicMaterial color="#FFFFFF" toneMapped={false} /></mesh>
                  </group>
                  <mesh ref={arcRef} position={[0, -0.01, 0.335]} visible={false}>
                    <torusGeometry args={[0.05, 0.014, 10, 28, Math.PI]} />
                    <meshPhysicalMaterial color={INK} roughness={0.2} clearcoat={1} />
                  </mesh>
                </group>
              ))}
            </group>

            {/* mouth: a small smile, or an open mouth with a tongue */}
            <mesh ref={smile} position={[0, -0.085, 0.336]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.032, 0.009, 8, 24, Math.PI]} />
              <meshStandardMaterial color={MOUTH} roughness={0.4} />
            </mesh>
            <group ref={mouthO} position={[0, -0.1, 0.334]} visible={false}>
              <mesh scale={[1, 1, 0.3]}><sphereGeometry args={[0.04, 24, 16]} /><meshStandardMaterial color={MOUTH} roughness={0.5} /></mesh>
              <mesh position={[0, -0.016, 0.006]} scale={[1, 0.6, 0.3]}><sphereGeometry args={[0.024, 16, 12]} /><meshStandardMaterial color="#F07B73" roughness={0.5} /></mesh>
            </group>

            {/* soft blush */}
            <mesh ref={blushL} position={[-0.2, -0.07, 0.322]} rotation={[0, -0.45, 0]}>
              <planeGeometry args={[0.14, 0.1]} />
              <meshBasicMaterial map={blush} color={BLUSH} transparent opacity={0.4} depthWrite={false} />
            </mesh>
            <mesh ref={blushR} position={[0.2, -0.07, 0.322]} rotation={[0, 0.45, 0]}>
              <planeGeometry args={[0.14, 0.1]} />
              <meshBasicMaterial map={blush} color={BLUSH} transparent opacity={0.4} depthWrite={false} />
            </mesh>

            {/* oops: a sweat drop sliding down the side of the face */}
            <group ref={sweat} position={[0.34, 0.2, 0.27]} visible={false}>
              <mesh scale={[0.75, 1, 0.6]}><sphereGeometry args={[0.045, 20, 16]} /><meshPhysicalMaterial color="#F2FAFC" roughness={0.05} clearcoat={1} transparent opacity={0.85} /></mesh>
              <mesh position={[0, 0.045, 0]}><coneGeometry args={[0.033, 0.06, 20]} /><meshPhysicalMaterial color="#F2FAFC" roughness={0.05} clearcoat={1} transparent opacity={0.85} /></mesh>
            </group>

            {/* search: a magnifying glass held in front of the face */}
            <group ref={lens} position={[0, 0.04, 0.52]} visible={false}>
              <mesh><torusGeometry args={[0.12, 0.018, 16, 64]} /><Gold rough={0.12} /></mesh>
              <mesh><circleGeometry args={[0.112, 48]} /><meshPhysicalMaterial color="#FFFFFF" roughness={0.02} clearcoat={1} transparent opacity={0.18} depthWrite={false} /></mesh>
              <mesh position={[-0.045, 0.05, 0.005]} rotation={[0, 0, 0.6]}><torusGeometry args={[0.07, 0.008, 6, 24, Math.PI * 0.45]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.7} toneMapped={false} /></mesh>
              <mesh position={[0.135, -0.135, 0]} rotation={[0, 0, Math.PI / 4]}><cylinderGeometry args={[0.022, 0.022, 0.05, 16]} /><Gold rough={0.15} /></mesh>
              <mesh position={[0.2, -0.2, 0]} rotation={[0, 0, Math.PI / 4]}><capsuleGeometry args={[0.026, 0.12, 6, 16]} /><meshPhysicalMaterial color="#5B2A1C" roughness={0.3} clearcoat={1} /></mesh>
            </group>
          </group>

          {/* wings pivot at the shoulders */}
          {([[-1, armL], [1, armR]] as const).map(([side, ref]) => (
            <group key={side} ref={ref} position={[side * 0.56, 0.72, 0.06]}>
              <Wing side={side} />
            </group>
          ))}

          {/* love: a glossy crimson heart held to the chest */}
          <group ref={bigHeart} position={[0, 0.4, 0.44]} visible={false}>
            <mesh position={[0, 0, -0.04]}>
              <extrudeGeometry args={[heartGeo, heartExtrude]} />
              <meshPhysicalMaterial color="#D8242C" roughness={0.18} clearcoat={1} clearcoatRoughness={0.05} sheen={0.6} sheenColor="#FFB3AC" emissive="#5A0710" />
            </mesh>
          </group>

          {/* read: an open book with crimson boards, gold edges and lines of script; one page turns */}
          <group ref={book} position={[0, 0.4, 0.56]} rotation={[-0.95, 0, 0]} visible={false}>
            {[-1, 1].map((side, i) => (
              <group key={side} ref={(g) => { bookHalf.current[i] = g; }}>
                <mesh position={[side * 0.12, 0, -0.012]} castShadow>
                  <boxGeometry args={[0.24, 0.32, 0.016]} />
                  <meshPhysicalMaterial color="#B81A20" roughness={0.35} clearcoat={1} clearcoatRoughness={0.15} />
                </mesh>
                <mesh position={[side * 0.236, 0, -0.012]}><boxGeometry args={[0.012, 0.32, 0.02]} /><Gold rough={0.2} /></mesh>
                <mesh position={[side * 0.11, 0, 0.008]}>
                  <boxGeometry args={[0.215, 0.295, 0.026]} />
                  <meshStandardMaterial color="#F6E7CC" roughness={0.8} />
                </mesh>
                <mesh position={[side * 0.11, 0, 0.0215]}>
                  <planeGeometry args={[0.2, 0.28]} />
                  <meshStandardMaterial map={tex.page} roughness={0.85} />
                </mesh>
              </group>
            ))}
            <group ref={flipPage} visible={false}>
              <mesh position={[0.105, 0, 0.028]}>
                <planeGeometry args={[0.2, 0.28]} />
                <meshStandardMaterial map={tex.page} roughness={0.85} side={DoubleSide} />
              </mesh>
            </group>
            <mesh position={[0, 0, -0.012]}><cylinderGeometry args={[0.014, 0.014, 0.32, 12]} /><Gold rough={0.2} /></mesh>
          </group>

          {/* legs and glossy shoes with a gold band */}
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.16, 0, 0]}>
              <mesh position={[0, 0.13, 0]} castShadow>
                <capsuleGeometry args={[0.033, 0.13, 6, 12]} />
                <meshPhysicalMaterial color={COPPER} metalness={0.35} roughness={0.35} clearcoat={0.8} />
              </mesh>
              <mesh position={[0, 0.075, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.04, 0.011, 8, 20]} />
                <Gold rough={0.15} />
              </mesh>
              <mesh position={[side * 0.02, 0.035, 0.05]} scale={[1.15, 0.62, 1.5]} castShadow>
                <sphereGeometry args={[0.072, 32, 16]} />
                <meshPhysicalMaterial color="#5B2A1C" roughness={0.28} clearcoat={1} clearcoatRoughness={0.06} />
              </mesh>
            </group>
          ))}
        </group>

        {/* wave: a salam bubble beside his head */}
        <mesh ref={bubble} position={[-0.52, 1.8, 0.25]} visible={false}>
          <planeGeometry args={[1, 0.5625]} />
          <meshBasicMaterial ref={bubbleMat} map={tex.bubble} transparent depthWrite={false} toneMapped={false} />
        </mesh>

        {/* think: three thought dots, then a lightbulb with a gold screw base that flickers on */}
        {[[0.46, 1.42], [0.38, 1.55], [0.27, 1.66]].map(([dx, dy], i) => (
          <mesh key={i} ref={(m) => { dots.current[i] = m; }} position={[dx, dy, 0.25]} visible={false}>
            <sphereGeometry args={[1, 20, 16]} />
            <meshPhysicalMaterial color={FACE} roughness={0.3} clearcoat={1} />
          </mesh>
        ))}
        <group ref={bulb} position={[0.12, 1.84, 0.1]} visible={false}>
          <mesh ref={bulbGlow} position={[0, 0.03, -0.05]}>
            <planeGeometry args={[0.9, 0.9]} />
            <meshBasicMaterial map={glow} transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <sphereGeometry args={[0.14, 32, 24]} />
            <meshPhysicalMaterial ref={bulbGlass} color="#FFF6DA" emissive={GOLD_LIGHT} emissiveIntensity={0} roughness={0.08} clearcoat={1} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, -0.08, 0]}>
            <cylinderGeometry args={[0.075, 0.064, 0.08, 24]} />
            <meshPhysicalMaterial color="#FFF6DA" roughness={0.08} clearcoat={1} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 0.03, 0.02]}>
            <torusGeometry args={[0.035, 0.007, 8, 24, Math.PI]} />
            <meshBasicMaterial color="#FFB547" toneMapped={false} />
          </mesh>
          <mesh position={[0, -0.155, 0]}>
            <cylinderGeometry args={[0.064, 0.058, 0.08, 24]} />
            <Gold rough={0.2} />
          </mesh>
          {[-0.135, -0.165].map((ry) => (
            <mesh key={ry} position={[0, ry, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.064, 0.008, 8, 24]} />
              <Gold rough={0.15} />
            </mesh>
          ))}
          <mesh position={[0, -0.205, 0]}><sphereGeometry args={[0.028, 16, 12]} /><meshStandardMaterial color={COPPER} roughness={0.4} /></mesh>
        </group>

        {/* proud: a gold khatam medal with a crimson centre and a gold star */}
        <group ref={medal} position={[0, 1.86, 0.1]} visible={false}>
          <mesh position={[0, 0, -0.025]}>
            <extrudeGeometry args={[badgeShape, badgeExtrude]} />
            <Gold rough={0.12} />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <extrudeGeometry args={[badgeInner, extrudeInner]} />
            <meshPhysicalMaterial color="#C51F24" roughness={0.3} clearcoat={1} clearcoatRoughness={0.08} />
          </mesh>
          <mesh position={[0, 0, 0.07]}>
            <extrudeGeometry args={[badgeStar, extrudeInner]} />
            <Gold rough={0.1} />
          </mesh>
        </group>
        <mesh ref={rays} visible={false}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={tex.rays} transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>

        {/* read: letters rising out of the book, then the word they make */}
        {tex.letters.map((m, i) => (
          <mesh key={i} ref={(o) => { letters.current[i] = o; }} visible={false}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={m} transparent depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
        <mesh ref={word} position={[0, 1.95, 0.3]} visible={false}>
          <planeGeometry args={[0.8, 0.4]} />
          <meshBasicMaterial map={tex.word} transparent depthWrite={false} toneMapped={false} />
        </mesh>

        {/* oops: a gold question mark */}
        <group ref={question} position={[0.24, 1.66, 0.2]} visible={false}>
          <mesh geometry={questionGeo}><Gold rough={0.12} /></mesh>
          <mesh position={[-0.075, 0.08, 0]}><sphereGeometry args={[0.024, 16, 12]} /><Gold rough={0.12} /></mesh>
          <mesh position={[0, -0.12, 0]}><sphereGeometry args={[0.036, 20, 16]} /><Gold rough={0.12} /></mesh>
        </group>

        {/* point: a gold arrow beside the raised wing */}
        <group ref={arrow} position={[0.98, 1.25, 0.2]} visible={false}>
          <mesh position={[0, 0, -0.025]}>
            <extrudeGeometry args={[arrowGeo, badgeExtrude]} />
            <Gold rough={0.12} />
          </mesh>
        </group>

        {/* check: the tick he draws, with a glowing pen tip */}
        <group ref={tickGroup} position={[-0.88, 1.45, 0.25]} visible={false}>
          <mesh ref={tick} geometry={tickGeo}><Gold rough={0.1} /></mesh>
          <mesh position={[-0.3, -0.07, 0]}><sphereGeometry args={[0.035, 16, 12]} /><Gold rough={0.1} /></mesh>
          <mesh ref={tickCorner} position={[-0.1, -0.29, 0]}><sphereGeometry args={[0.035, 16, 12]} /><Gold rough={0.1} /></mesh>
          <mesh ref={tickTip}><sphereGeometry args={[0.045, 16, 12]} /><meshBasicMaterial color={GOLD_LIGHT} toneMapped={false} /></mesh>
        </group>

        {/* comet trail while dashing */}
        <Trail width={2.4} length={6} color={GOLD_LIGHT} attenuation={(w) => w * w} decay={1.5}>
          <mesh ref={trailHead} position={[0, 0.72, 0]} visible={false}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color={GOLD_LIGHT} toneMapped={false} />
          </mesh>
        </Trail>
      </group>

      {/* spin / love / impact rings, lying on the ground */}
      <mesh ref={ring} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.7, 64, 1, 0, Math.PI * 1.5]} />
        <meshBasicMaterial color={GOLD_LIGHT} transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={ringB} position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 0.74, 64, 1, 0, Math.PI]} />
        <meshBasicMaterial color="#E43A3F" transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* dua: a soft column of light */}
      <mesh ref={column} position={[0, 1.6, -0.1]}>
        <cylinderGeometry args={[0.35, 0.7, 3.2, 32, 1, true]} />
        <meshBasicMaterial color={GOLD_LIGHT} transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {emote === 'dua' && !still && <Sparkles count={40} scale={[1.6, 2.6, 1]} position={[0, 1.4, 0]} size={4} speed={0.6} color={GOLD_LIGHT} />}
      <SparkPool api={sparks} />
      <IconPool api={hearts} map={tex.heart} />
      <IconPool api={confetti} map={tex.confetti} />
      <IconPool api={stars} map={tex.star} additive />
      <IconPool api={puffs} map={tex.puff} N={60} />
      <IconPool api={zees} map={tex.z} N={12} />
    </group>
  );
}
