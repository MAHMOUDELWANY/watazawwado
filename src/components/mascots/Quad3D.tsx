import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { Sparkles, Trail, useGLTF } from '@react-three/drei';
import {
  AdditiveBlending, Bone, BufferAttribute, BufferGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, Skeleton, SkinnedMesh,
  Vector3, type Material, type Object3D,
} from 'three';
import {
  GOLD, GOLD_LIGHT, IconPool, SparkPool, Gold, approach, backOut, ease, glyphTexture, khatam, popIn, pulse, radialTexture,
  raysTexture, spriteTexture, star4, type Burst, type PoolApi,
} from './Zad3D';

/**
 * The camel calf and the fennec, the two four-legged companions (owner, 2026-11-16), next to the hoopoe
 * (docs/superpowers/specs/2026-11-13-kids-companion-design.md). Like the hoopoe, each is the Meshy model made from the
 * owner's turnaround sheet (`docs/design/companions/{camel,fennec}-turnaround.png`); Meshy only rigs humanoids, so the
 * bones (neck, head, ears, tail, four legs) and smooth skin weights are computed here from the animal's shape.
 * Both are born, not hatched: the first stage is a newborn asleep on its bed (as in the growth sheets), which wakes,
 * stands up and takes its first steps when the child earns the first points.
 */

export type QuadKind = 'camel' | 'fennec';
export type CamelDance = 'trot' | 'nod' | 'wiggle' | 'spin' | 'bow' | 'kick' | 'rear' | 'gallop' | 'finale';
export type FennecDance = 'pounce' | 'ears' | 'chase' | 'wiggle' | 'roll' | 'zoomies' | 'flip' | 'hops' | 'finale';
export type QuadDance = 'idle' | CamelDance | FennecDance;

export const QUAD_DANCE_LENGTH: Record<Exclude<QuadDance, 'idle'>, number> = {
  trot: 2.2, nod: 2.8, wiggle: 3.0, spin: 2.4, bow: 3.4, kick: 2.3, rear: 2.9, gallop: 3.6, finale: 5.0,
  pounce: 2.4, ears: 2.8, chase: 2.6, roll: 2.6, zoomies: 3.4, flip: 2.1, hops: 3.2,
};

/** What growth has given it: size, head proportion (a newborn has a big head), the gold rewards, asleep or not. */
export type QuadLook = {
  size: number; head: number; goldTips: boolean; pendant: boolean; aura: boolean;
  /** Still the sleeping newborn, and how close it is to waking (0..1). */
  asleep: boolean; stir: number;
};

const BONES = ['root', 'neck', 'head', 'earL', 'earR', 'tail', 'legFL', 'legFR', 'legBL', 'legBR'] as const;
type BoneName = (typeof BONES)[number];
type V3 = [number, number, number];
type Weights = { neck: number; head: number; ear: number; tail: number; leg: number };

const smooth = (a: number, b: number, x: number) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/**
 * Landmarks of each model in units of its height (y from the ground, x across, z towards the head), read off the
 * models' silhouettes. Pivots are given for the right side (+x); the left mirrors them.
 */
type Spec = {
  model: string; H: number; yaw: number; frontZ: number; legTop: number; centerY: number; hit: [number, number];
  neck: V3; head: V3; ear: V3; tail: V3; legF: V3; legB: V3; chest: V3;
  /** Region weights at a point: neck (includes head), head (includes ears), ear, tail, leg. */
  weigh: (x: number, y: number, z: number) => Weights;
  /** Pose of the sleeping newborn. */
  sleep: { yaw: number; neck: number; head: number; headY: number; ear: number; earOut: number; tail: number };
  bed: { top: number; r: number; fur: boolean };
  /** Colour of the loose tufts thrown off in the dances. */
  fluff: string[];
};

const SPECS: Record<QuadKind, Spec> = {
  camel: {
    model: '/prototypes/companions/3d/camel-hq.glb', H: 1.85, yaw: 0.55, frontZ: -0.1, legTop: 0.4, centerY: 0.48, hit: [0.5, 0.36],
    neck: [0, 0.6, 0.07], head: [0, 0.79, 0.12], ear: [0.1, 0.91, 0.08], tail: [0, 0.55, -0.28],
    legF: [0.06, 0.4, 0.04], legB: [0.06, 0.4, -0.24], chest: [0, 0.6, 0.2],
    weigh: (x, y, z) => {
      const neck = smooth(0.0, 0.08, z) * smooth(0.54, 0.62, y);
      const head = neck * smooth(0.74, 0.8, y);
      const ear = head * smooth(0.085, 0.11, Math.abs(x)) * smooth(0.87, 0.9, y);
      const tail = (1 - neck) * smooth(0.255, 0.285, -z) * (1 - smooth(0.035, 0.05, Math.abs(x))) * smooth(0.27, 0.32, y) * (1 - smooth(0.56, 0.6, y));
      const leg = (1 - neck) * (1 - tail) * (1 - smooth(0.34, 0.42, y));
      return { neck, head, ear, tail, leg };
    },
    sleep: { yaw: 0.85, neck: 1.05, head: -0.55, headY: 0.35, ear: 0.5, earOut: 0.1, tail: 0.6 },
    bed: { top: 0.13, r: 0.36, fur: false },
    fluff: ['#E3A35C', '#C2541F', '#F2CB8E'],
  },
  fennec: {
    model: '/prototypes/companions/3d/fennec-hq.glb', H: 1.5, yaw: 0.4, frontZ: -0.03, legTop: 0.22, centerY: 0.36, hit: [0.42, 0.4],
    neck: [0, 0.4, 0.12], head: [0, 0.47, 0.14], ear: [0.08, 0.72, 0.07], tail: [0, 0.37, -0.2],
    legF: [0.05, 0.22, 0.11], legB: [0.05, 0.22, -0.17], chest: [0, 0.4, 0.2],
    weigh: (x, y, z) => {
      const neck = smooth(-0.02, 0.06, z) * smooth(0.37, 0.43, y);
      const head = neck * smooth(0.43, 0.49, y);
      const ear = head * smooth(0.035, 0.07, Math.abs(x)) * smooth(0.68, 0.74, y);
      // the brush runs from the rump down and back to a tip low on the left
      const back = smooth(lerp(0.2, 0.25, 1 - smooth(0.2, 0.36, y)), lerp(0.24, 0.28, 1 - smooth(0.2, 0.36, y)), -z);
      const tail = (1 - neck) * Math.max(back, smooth(0.1, 0.14, -x) * smooth(0.12, 0.2, -z)) * (1 - smooth(0.36, 0.42, y));
      const leg = (1 - neck) * (1 - tail) * (1 - smooth(0.17, 0.24, y));
      return { neck, head, ear, tail, leg };
    },
    sleep: { yaw: 0.7, neck: 0.55, head: 0.55, headY: 0.25, ear: 1.3, earOut: 0.55, tail: 1.3 },
    bed: { top: 0.16, r: 0.34, fur: true },
    fluff: ['#F2CB8E', '#E3A35C', '#9E3A1A'],
  },
};

/** Stand the mesh on the ground, height H, then give it bones and smooth skin weights from its shape. */
function buildRig(scene: Object3D, s: Spec, debug: boolean) {
  let src: Mesh | undefined;
  scene.traverse((o) => { if ((o as Mesh).isMesh && !src) src = o as Mesh; });
  if (!src) throw new Error('companion model has no mesh');
  src.updateWorldMatrix(true, false);
  const pos = src.geometry.attributes.position, nor = src.geometry.attributes.normal;
  const n = pos.count;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3);
  const v = new Vector3();
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(src.matrixWorld);
    P.set([v.x, v.y, v.z], i * 3);
    for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], P[i * 3 + a]); mx[a] = Math.max(mx[a], P[i * 3 + a]); }
    v.fromBufferAttribute(nor, i).transformDirection(src.matrixWorld);
    N.set([v.x, v.y, v.z], i * 3);
  }
  const h = mx[1] - mn[1], cx = (mn[0] + mx[0]) / 2, cz = (mn[2] + mx[2]) / 2;
  const skinIndex = new Uint16Array(n * 4), skinWeight = new Float32Array(n * 4);
  const colors = debug ? new Float32Array(n * 3) : null;
  const w = new Float32Array(BONES.length);
  const tint: V3[] = [[0.9, 0.9, 0.9], [0.2, 0.4, 1], [1, 0.9, 0.1], [1, 0.2, 0.8], [1, 0.2, 0.8], [0.1, 0.9, 0.3], [1, 0.3, 0.2], [1, 0.6, 0.2], [0.5, 0.2, 1], [0.2, 0.9, 0.9]];
  for (let i = 0; i < n; i++) {
    // units of height for the landmarks
    const x = (P[i * 3] - cx) / h, y = (P[i * 3 + 1] - mn[1]) / h, z = (P[i * 3 + 2] - cz) / h;
    P[i * 3] = x * s.H; P[i * 3 + 1] = y * s.H; P[i * 3 + 2] = z * s.H;
    const r = s.weigh(x, y, z);
    w.fill(0);
    w[1] = r.neck - r.head; w[2] = r.head - r.ear;
    w[x < 0 ? 3 : 4] = r.ear;
    w[5] = r.tail;
    const front = z > s.frontZ;
    w[front ? (x < 0 ? 6 : 7) : (x < 0 ? 8 : 9)] = r.leg;
    w[0] = Math.max(0, 1 - w.reduce((a, b, k) => (k ? a + b : a), 0));
    const order = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort((a, b) => w[b] - w[a]).slice(0, 4);
    const sum = order.reduce((a, b) => a + w[b], 0) || 1;
    order.forEach((b, j) => { skinIndex[i * 4 + j] = b; skinWeight[i * 4 + j] = w[b] / sum; });
    if (colors) {
      const c = [0, 0, 0];
      for (let b = 0; b < BONES.length; b++) for (let k = 0; k < 3; k++) c[k] += tint[b][k] * w[b];
      colors.set(c, i * 3);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(P, 3));
  geo.setAttribute('normal', new BufferAttribute(N, 3));
  geo.setAttribute('uv', src.geometry.attributes.uv);
  geo.setAttribute('skinIndex', new BufferAttribute(skinIndex, 4));
  geo.setAttribute('skinWeight', new BufferAttribute(skinWeight, 4));
  if (colors) geo.setAttribute('color', new BufferAttribute(colors, 3));
  geo.setIndex(src.geometry.index);

  const m = (p: V3, side = 1): V3 => [p[0] * side * s.H, p[1] * s.H, p[2] * s.H];
  const at: Record<BoneName, V3> = {
    root: [0, 0, 0], neck: m(s.neck), head: m(s.head), earL: m(s.ear, -1), earR: m(s.ear), tail: m(s.tail),
    legFL: m(s.legF, -1), legFR: m(s.legF), legBL: m(s.legB, -1), legBR: m(s.legB),
  };
  const parent: Partial<Record<BoneName, BoneName>> = {
    neck: 'root', head: 'neck', earL: 'head', earR: 'head', tail: 'root', legFL: 'root', legFR: 'root', legBL: 'root', legBR: 'root',
  };
  const bones = {} as Record<BoneName, Bone>;
  for (const name of BONES) {
    const b = new Bone();
    const p = parent[name];
    b.position.set(at[name][0] - (p ? at[p][0] : 0), at[name][1] - (p ? at[p][1] : 0), at[name][2] - (p ? at[p][2] : 0));
    if (p) bones[p].add(b);
    bones[name] = b;
  }
  const material = debug ? new MeshBasicMaterial({ vertexColors: true }) : (src.material as Material);
  const mesh = new SkinnedMesh(geo, material);
  mesh.add(bones.root);
  mesh.bind(new Skeleton(BONES.map((b) => bones[b])));
  mesh.castShadow = true;
  mesh.frustumCulled = false; // the bounding sphere does not follow the bones
  return { mesh, bones, at };
}

/** The newborn's bed: the camel's crimson velvet cushion with a gold cord, the fennec's ring of soft sand fur. */
function SleepBed({ spec, show }: { spec: Spec; show: React.MutableRefObject<number> }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const k = show.current;
    g.visible = k > 0.01;
    g.scale.setScalar(0.4 + 0.6 * k);
    g.traverse((o) => {
      const mat = (o as Mesh).material as MeshBasicMaterial | undefined;
      if (mat && 'opacity' in mat) { mat.transparent = k < 1; mat.opacity = k; }
    });
  });
  const { r, fur } = spec.bed;
  return (
    <group ref={group}>
      {fur ? (
        <>
          <mesh position={[0, 0.07, 0]} scale={[1, 0.48, 1]} castShadow receiveShadow>
            <torusGeometry args={[r * 0.86, r * 0.32, 32, 72]} />
            <meshPhysicalMaterial color="#E9C48E" roughness={1} sheen={1} sheenColor="#FFF0D2" sheenRoughness={0.5} />
          </mesh>
          <mesh position={[0, 0.05, 0]} receiveShadow>
            <cylinderGeometry args={[r * 0.9, r * 0.94, 0.11, 48]} />
            <meshPhysicalMaterial color="#D9AE74" roughness={1} sheen={1} sheenColor="#FFE6BE" sheenRoughness={0.6} />
          </mesh>
          {/* a teal woven band round the nest */}
          <mesh position={[0, 0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r * 1.16, 0.016, 10, 96]} />
            <meshPhysicalMaterial color="#0E6E7E" roughness={0.6} clearcoat={0.4} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 0.07, 0]} scale={[1, 0.55, 1]} castShadow receiveShadow>
            <torusGeometry args={[r * 0.78, r * 0.36, 32, 72]} />
            <meshPhysicalMaterial color="#7A1216" roughness={1} sheen={1} sheenColor="#E0574F" sheenRoughness={0.8} />
          </mesh>
          <mesh position={[0, 0.1, 0]} receiveShadow>
            <cylinderGeometry args={[r * 0.82, r * 0.86, 0.05, 48]} />
            <meshPhysicalMaterial color="#6C0F13" roughness={1} sheen={1} sheenColor="#D84A43" sheenRoughness={0.8} />
          </mesh>
          {Array.from({ length: 10 }, (_, i) => (
            <mesh key={i} position={[Math.sin((i / 10) * Math.PI * 2) * r * 0.78, 0.135, Math.cos((i / 10) * Math.PI * 2) * r * 0.78]}>
              <sphereGeometry args={[0.016, 12, 8]} />
              <Gold rough={0.25} />
            </mesh>
          ))}
          <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r * 1.17, 0.013, 10, 96]} />
            <Gold rough={0.2} />
          </mesh>
        </>
      )}
    </group>
  );
}

export function QuadModel({ kind, dance, startedAt, onDone, still, look, celebrateAt, wakeAt = 0 }: {
  kind: QuadKind; dance: QuadDance; startedAt: number; onDone: () => void; still: boolean; look: QuadLook; celebrateAt: number;
  /** Clock time the newborn started waking (0: not waking). */
  wakeAt?: number;
}) {
  const spec = SPECS[kind];
  const H = spec.H;
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const center = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const rays = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);
  const trailHead = useRef<Mesh>(null);
  const zs = useRef<Group>(null);
  const sparks = useRef<{ burst: Burst } | null>(null);
  const hearts = useRef<PoolApi | null>(null);
  const stars = useRef<PoolApi | null>(null);
  const confetti = useRef<PoolApi | null>(null);
  const puffs = useRef<PoolApi | null>(null);
  const tufts = useRef<PoolApi | null>(null);
  const fired = useRef<Set<string>>(new Set());
  const tapAt = useRef(-10);
  const shimmerAt = useRef(0);
  const bedShow = useRef(look.asleep ? 1 : 0);
  const { pointer, clock } = useThree();

  const debug = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV) && typeof window !== 'undefined' && /[?&]rigdebug\b/.test(window.location.search);
  const { scene } = useGLTF(spec.model, false, true);
  const rig = useMemo(() => buildRig(scene, spec, debug), [scene, spec, debug]);
  // dev check of the rig from another side: ?rigdebug&rigyaw=1.57
  const debugYaw = debug ? Number(new URLSearchParams(window.location.search).get('rigyaw')) : NaN;
  // dev check of a dance frame: ?pose=rear:1.2 holds that dance at that second
  const pose = (import.meta as { env?: { DEV?: boolean } }).env?.DEV && typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('pose')?.split(':') : undefined;

  const tex = useMemo(() => ({
    heart: spriteTexture('heart'), star: spriteTexture('star'), confetti: spriteTexture('confetti'), puff: spriteTexture('puff'),
    rays: raysTexture(), glow: radialTexture('rgba(246,194,90,1)'), z: glyphTexture('z', { fill: '#FFF4E2', px: 170, font: "'IBM Plex Sans Arabic', sans-serif" }),
  }), []);
  const pendant = useMemo(() => ({ outer: khatam(0.075, 0.12), inner: khatam(0.052, 0.1), star: star4(0.026) }), []);
  const thin = { depth: 0.02, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 4, curveSegments: 10 };

  useEffect(() => { fired.current = new Set(); }, [startedAt]);
  useEffect(() => {
    if (!celebrateAt) return;
    const party = { speed: 2.6, up: 1.3, gravity: 2.2, flip: true, size: [0.09, 0.14] as [number, number], life: [1.6, 2.3] as [number, number], colors: ['#C51F24', GOLD, '#FFF4E2', '#E43A3F', '#E5AC48', '#0E6E7E'] };
    confetti.current?.burst(new Vector3(0, 1.5, 0.2), { n: 60, ...party });
    sparks.current?.burst(new Vector3(0, 1.1, 0.2), 40, 2.4, GOLD_LIGHT, 0.4);
  }, [celebrateAt]);

  useFrame(({ clock: c }) => {
    const t = c.getElapsedTime();
    let u = t - startedAt;
    if (pose) { dance = pose[0] as QuadDance; u = Number(pose[1]) || 0; }
    else if (dance !== 'idle' && u > QUAD_DANCE_LENGTH[dance]) onDone();
    const once = (key: string, at: number, fn: () => void) => {
      if (u >= at && !fired.current.has(key)) { fired.current.add(key); fn(); }
    };
    const r = root.current, b = body.current, ce = center.current;
    if (!r || !b || !ce) return;
    const B = rig.bones;
    const S = look.size;

    // asleep (1) to standing (0); waking: it stirs, stretches its legs out and stands, then the bed fades away
    const hu = wakeAt ? t - wakeAt : 99;
    const lie = look.asleep ? 1 : hu < 1.6 ? 1 - ease((hu - 0.45) / 1.05) : 0;
    bedShow.current = look.asleep ? 1 : hu < 3 ? 1 - ease((hu - 1.6) / 0.8) : 0;

    const breathe = still ? 0 : Math.sin(t * (lie > 0.5 ? 1.3 : 2.2)) * (lie > 0.5 ? 0.025 : 0.014);
    let x = 0, z = 0, y = breathe * 0.5, rotX = 0, rotY = Number.isFinite(debugYaw) && debugYaw ? debugYaw : spec.yaw + (still ? 0 : Math.sin(t * 0.5) * 0.18), rotZ = 0;
    let sx = 1, sy = 1 + breathe * 0.6, glow = 0, yawOverride: number | null = null;
    let neckX = 0, neckY = 0, headX = 0, headY = 0, headZ = 0;
    let earOut = 0, earBack = 0, earL = 0, earR = 0;
    let tailY = still ? 0 : Math.sin(t * 1.6) * 0.25, tailX = 0;
    const leg = { FL: 0, FR: 0, BL: 0, BR: 0 }, fold = { FL: 1, FR: 1, BL: 1, BR: 1 };
    let ringO = 0, ringS = 1, raysO = 0, trailOn = false;
    // ear twitches at rest, like a real animal listening
    if (!still) { const tw = pulse(t % 5.3, 0, 0.35); earR += tw * 0.35; earL += pulse((t + 2.1) % 6.1, 0, 0.35) * 0.35; }
    const at = (px: number, py: number, pz: number) => new Vector3(px + x, py * S, pz + z);
    const dust = (n: number, px = 0, pz = 0) => puffs.current?.burst(at(px, 0.05, pz), { n, speed: 1.1, colors: ['#F4E6CC', '#E8D5B0', '#D9BF94'], gravity: -0.25, up: -0.25, grow: true, size: [0.1, 0.18], life: [0.6, 0.9] });
    const twinkle = (py: number, n = 16) => stars.current?.burst(at(0, py, 0.2), { n, speed: 1.3, up: 0.4, gravity: 0.7, colors: [GOLD_LIGHT, GOLD, '#FFFFFF'], size: [0.05, 0.1], life: [0.8, 1.3] });
    const party = { speed: 2.6, up: 1.3, gravity: 2.2, flip: true, size: [0.09, 0.14] as [number, number], life: [1.6, 2.3] as [number, number], colors: ['#C51F24', GOLD, '#FFF4E2', '#E43A3F', '#E5AC48', '#0E6E7E'] };
    const step = (p: number, amp: number) => { leg.FL = leg.BR = Math.sin(p) * amp; leg.FR = leg.BL = -Math.sin(p) * amp; };

    // tap: a little hop, ears up, a tail wag
    const tu = t - tapAt.current;
    if (tu < 0.7 && lie < 0.5) {
      const p = pulse(tu, 0, 0.6);
      y += p * 0.1; earOut -= p * 0.2; tailY += Math.sin(tu * 30) * p * 0.6; headX -= p * 0.15;
    }

    if (!still && lie < 0.01) switch (dance) {
      // ---- camel ----
      case 'trot': {
        const on = ease(u / 0.25) * (1 - ease((u - 1.9) / 0.3));
        const p = u * Math.PI * 2 * 2.3;
        step(p, 0.42 * on);
        y += Math.abs(Math.sin(p)) * 0.07 * on;
        neckX = Math.sin(p * 2) * 0.06 * on; tailY += Math.sin(p) * 0.4 * on;
        for (let i = 0; i < 4; i++) once(`d${i}`, 0.3 + i * 0.43, () => dust(5, (i % 2 ? 0.12 : -0.12)));
        break;
      }
      case 'nod': {
        const on = ease(u / 0.3) * (1 - ease((u - 2.5) / 0.3));
        const ph = Math.max(0, u - 0.2) * Math.PI * 2 * 1.3;
        neckX = Math.sin(ph) * 0.22 * on; headZ = Math.sin(ph / 2) * 0.28 * on; headX = -Math.sin(ph) * 0.12 * on;
        earOut = Math.max(0, Math.sin(ph)) * 0.4 * on; rotZ = Math.sin(ph / 2) * 0.05 * on;
        y += Math.abs(Math.sin(ph)) * 0.04 * on;
        ringO = on * (1 - ((ph / Math.PI) % 1)) * 0.6; ringS = 0.5 + ((ph / Math.PI) % 1) * 1.2;
        for (let i = 0; i < 4; i++) once(`n${i}`, 0.4 + i * 0.77, () => stars.current?.burst(at(0, 1.75, 0.3), { n: 5, speed: 0.9, up: 0.4, gravity: 0.8, colors: [GOLD_LIGHT, GOLD], size: [0.04, 0.07], life: [0.5, 0.8] }));
        break;
      }
      case 'wiggle': {
        // wiggles hump and tail side to side, dancing on the spot; a puff of tufts at the end
        const on = ease(u / 0.3) * (1 - ease((u - 2.7) / 0.3));
        const p = u * Math.PI * 2 * 1.6;
        rotZ = Math.sin(p) * 0.09 * on; x = Math.sin(p) * 0.06 * on;
        tailY = Math.sin(p * 2) * 0.9 * on; tailX = 0.4 * on;
        leg.BL = Math.max(0, Math.sin(p)) * -0.35 * on; leg.BR = Math.max(0, -Math.sin(p)) * -0.35 * on;
        neckY = -Math.sin(p) * 0.15 * on; headZ = Math.sin(p) * 0.15 * on;
        once('w1', 2.6, () => tufts.current?.burst(at(0, 1.0, -0.2), { n: 10, speed: 1, up: 0.5, gravity: 0.4, flip: true, colors: spec.fluff, size: [0.08, 0.12], life: [1.2, 1.8] }));
        break;
      }
      case 'spin': {
        const k = ease((u - 0.25) / 1.5);
        rotY += k * Math.PI * 4;
        y += pulse(u, 0.2, 1.9) * 0.14;
        step(u * 30, pulse(u, 0.2, 1.9) * 0.3);
        tailX = pulse(u, 0.2, 1.9) * 0.8; earOut = pulse(u, 0.2, 1.9) * 0.4;
        ringO = pulse(u, 0.25, 1.9); ringS = 0.9 + k * 0.5;
        once('s1', 1.8, () => twinkle(1.3));
        once('s2', 1.85, () => dust(10));
        break;
      }
      case 'bow': {
        // folds its front legs and bows its head, gold rays behind, then rises
        const dn = ease((u - 0.2) / 0.7) * (1 - ease((u - 2.5) / 0.6));
        fold.FL = fold.FR = 1 - dn * 0.6;
        rotX = dn * 0.22; y -= dn * 0.12;
        neckX = dn * 0.55; headX = dn * 0.2; earBack = dn * 0.4;
        raysO = popIn(u, 0.6, 2.6);
        once('b1', 1.0, () => twinkle(1.5, 18));
        break;
      }
      case 'kick': {
        // a playful buck: weight on the front legs, the back legs kick out, a bouncy landing
        const c1 = pulse(u, 0, 0.35);
        const k = pulse(u, 0.35, 1.1);
        sy -= c1 * 0.08;
        rotX = k * 0.32; y += k * 0.16;
        leg.BL = leg.BR = k * 1.0; leg.FL = leg.FR = -k * 0.15;
        neckX = k * 0.25; tailX = k * 1.1; earBack = k * 0.5;
        const land = pulse(u, 1.05, 1.4);
        sy -= land * 0.12; sx += land * 0.06;
        ringO = pulse(u, 1.05, 1.8); ringS = 0.5 + ease((u - 1.05) / 0.7) * 1.4;
        once('k1', 1.08, () => { dust(12); twinkle(0.6, 14); });
        break;
      }
      case 'rear': {
        // rears up on its back legs, front legs pedalling, then lands with dust and stars
        const up = ease((u - 0.3) / 0.5) * (1 - ease((u - 1.9) / 0.4));
        rotX = -up * 0.55; y += up * 0.42;
        leg.FL = (-0.7 + Math.sin(u * 16) * 0.5) * up; leg.FR = (-0.7 + Math.sin(u * 16 + Math.PI) * 0.5) * up;
        leg.BL = leg.BR = up * 0.35;
        neckX = -up * 0.25; headX = up * 0.2; earOut = up * 0.3; tailX = up * 0.4;
        const land = pulse(u, 2.2, 2.55);
        sy -= land * 0.12;
        once('r1', 1.0, () => stars.current?.burst(at(0, 1.9, 0.3), { n: 14, speed: 1.2, up: 0.5, gravity: 0.7, colors: [GOLD_LIGHT, GOLD, '#FFFFFF'], size: [0.05, 0.09], life: [0.8, 1.2] }));
        once('r2', 2.25, () => dust(14));
        break;
      }
      case 'gallop': case 'zoomies': {
        // runs a circle round the stage, legs a blur, dust behind
        const fast = dance === 'zoomies';
        const R = fast ? 0.5 : 0.55;
        const k = ease((u - 0.2) / (fast ? 2.8 : 3.0));
        const th = k * Math.PI * 2 * (fast ? 2 : 1);
        x = Math.sin(th) * R; z = (1 - Math.cos(th)) * R * 0.8;
        const moving = u > 0.2 && u < (fast ? 3.0 : 3.2);
        if (moving) {
          yawOverride = Math.atan2(Math.cos(th), Math.sin(th) * 0.8);
          const p = u * (fast ? 34 : 24);
          leg.FL = Math.sin(p) * 0.6; leg.FR = Math.sin(p + 0.5) * 0.6; leg.BL = Math.sin(p + Math.PI) * 0.6; leg.BR = Math.sin(p + Math.PI + 0.5) * 0.6;
          y += Math.abs(Math.sin(p)) * 0.08; rotX = Math.sin(p) * 0.05; rotZ = -0.12;
          earBack = 0.6; tailX = 0.9; tailY = Math.sin(p) * 0.2;
          trailOn = true;
          if (Math.floor(u * 8) !== Math.floor((u - 1 / 60) * 8)) dust(2, 0, 0);
        }
        once('g1', fast ? 3.05 : 3.25, () => twinkle(0.9, 12));
        break;
      }
      // ---- fennec ----
      case 'pounce': {
        // the fennec's sand dive: crouch and wiggle, a high leap, nose first into the sand, pop back up
        const crouch = ease(u / 0.3) * (1 - ease((u - 0.75) / 0.12));
        y -= crouch * 0.09; rotX = -crouch * 0.12; x = Math.sin(u * 40) * 0.02 * crouch; tailY = Math.sin(u * 40) * 0.5 * crouch;
        earOut -= crouch * 0.2;
        const k = (u - 0.85) / 0.7;
        const air = k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0;
        y += air * 0.75;
        rotX += k > 0 && k < 1 ? lerp(-0.4, 1.3, ease(k)) : 0;
        leg.FL = leg.FR = -air * 0.9; leg.BL = leg.BR = air * 0.7; tailX = air * 0.8;
        const dive = pulse(u, 1.5, 1.95);
        y -= dive * 0.25; rotX += dive * 1.1; sy -= dive * 0.1;
        once('p1', 1.52, () => puffs.current?.burst(at(0, 0.06, 0.15), { n: 22, speed: 1.6, colors: ['#F4E6CC', '#E8D5B0', '#D9BF94'], gravity: 0.4, up: 0.6, grow: true, size: [0.12, 0.2], life: [0.7, 1.1] }));
        once('p2', 2.0, () => twinkle(0.9, 12));
        break;
      }
      case 'ears': {
        // flicks one ear, then the other, then both, tilting its head; curious
        const on = ease(u / 0.2) * (1 - ease((u - 2.5) / 0.3));
        earR += pulse(u, 0.2, 0.7) * 0.9; earL += pulse(u, 0.8, 1.3) * 0.9;
        const both = pulse(u, 1.5, 2.3);
        earOut += both * 0.5; earBack += Math.sin(u * 30) * both * 0.15;
        headZ = (pulse(u, 0.2, 0.75) * 0.3 - pulse(u, 0.8, 1.35) * 0.3) * on; headX = -both * 0.15;
        y += both * 0.06; tailY += both * Math.sin(u * 20) * 0.5;
        once('e1', 1.55, () => stars.current?.burst(at(0, 1.45, 0.1), { n: 10, speed: 0.9, up: 0.5, gravity: 0.6, colors: [GOLD_LIGHT, GOLD], size: [0.04, 0.08], life: [0.7, 1.1] }));
        break;
      }
      case 'chase': {
        // chases its own tail round and round
        const k = ease((u - 0.2) / 1.9);
        rotY += -k * Math.PI * 4;
        headY = -0.6 * pulse(u, 0.1, 2.3); neckY = -0.3 * pulse(u, 0.1, 2.3);
        tailY = 0.9 * pulse(u, 0.1, 2.3) + Math.sin(u * 25) * 0.2; rotZ = -pulse(u, 0.2, 2.1) * 0.1;
        step(u * 32, pulse(u, 0.2, 2.1) * 0.4);
        ringO = pulse(u, 0.3, 2.1); ringS = 0.7 + k * 0.4;
        once('c1', 2.15, () => twinkle(0.8, 14));
        break;
      }
      case 'roll': {
        // lies down, rolls right over, springs back up
        const down = ease((u - 0.1) / 0.35) * (1 - ease((u - 1.9) / 0.35));
        fold.FL = fold.FR = fold.BL = fold.BR = 1 - down * 0.7;
        y -= down * spec.legTop * H * 0.7;
        rotZ = -ease((u - 0.5) / 1.2) * Math.PI * 2;
        // lift it as it turns over, so its back rolls on the floor instead of through it
        y += ((1 - Math.cos(rotZ)) / 2) * spec.centerY * H * 1.25 + Math.abs(Math.sin(rotZ)) * 0.12;
        earBack = down * 0.5; tailX = down * 0.3;
        once('o1', 1.75, () => { dust(10); hearts.current?.burst(at(0, 0.9, 0.3), { n: 5, speed: 0.8, up: 0.8, gravity: -0.8, colors: ['#E43A3F', '#FF8F86'], size: [0.06, 0.1], life: [1.1, 1.6] }); });
        break;
      }
      case 'hops': {
        // four bunny hops, a quarter turn each, ears flopping in the air
        for (let i = 0; i < 4; i++) {
          const a = 0.2 + i * 0.7, j = pulse(u, a, a + 0.5);
          y += j * 0.3; earBack += j * 0.5; leg.FL += -j * 0.4; leg.FR += -j * 0.4; leg.BL += j * 0.4; leg.BR += j * 0.4;
          sy -= pulse(u, a + 0.48, a + 0.62) * 0.1;
          once(`h${i}`, a + 0.5, () => dust(5));
        }
        rotY += Math.min(4, Math.floor(Math.max(0, u - 0.2) / 0.7) + ease(((Math.max(0, u - 0.2)) % 0.7) / 0.5)) * Math.PI / 2;
        break;
      }
      case 'flip': {
        sy -= pulse(u, 0, 0.34) * 0.2;
        const k = (u - 0.32) / 0.9;
        const air = k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0;
        y += air * 0.8;
        rotX -= ease(Math.min(Math.max(k, 0), 1)) * Math.PI * 2;
        leg.FL = leg.FR = -air * 0.6; leg.BL = leg.BR = air * 0.6; earBack = air * 0.6; tailX = air;
        const land = pulse(u, 1.2, 1.5);
        sy -= land * 0.22; sx += land * 0.14;
        ringO = pulse(u, 1.2, 1.9); ringS = 0.5 + ease((u - 1.2) / 0.7) * 1.6;
        once('l1', 1.22, () => twinkle(0.5, 20));
        break;
      }
      case 'finale': {
        // the big one: two hops, a double spin, then it stands proud as gold rays and confetti fill the stage
        const j1 = pulse(u, 0.1, 0.5), j2 = pulse(u, 0.55, 0.95);
        y += (j1 + j2) * 0.32;
        sy += (pulse(u, 0.48, 0.6) + pulse(u, 0.93, 1.05)) * -0.12;
        const k = ease((u - 1.0) / 1.0);
        rotY += k * Math.PI * 4;
        step(u * 26, pulse(u, 1.0, 2.0) * 0.35);
        ringO = pulse(u, 1.0, 2.1); ringS = 0.8 + k * 0.6;
        const blaze = ease((u - 2.0) / 0.3) * (1 - ease((u - 4.5) / 0.4));
        glow = blaze * 1.3; raysO = blaze;
        rotY += -blaze * spec.yaw * 0.8; // turns to face the child
        neckX = -blaze * 0.15; headX = -blaze * 0.1; earOut = -blaze * 0.15; tailX = blaze * 0.9; tailY += Math.sin(u * 14) * blaze * 0.5;
        if (kind === 'camel') { rotX = -blaze * 0.12; leg.FL = -blaze * 0.5; y += blaze * 0.06; }
        else { y += Math.abs(Math.sin(u * 6)) * blaze * 0.12; }
        once('x1', 2.1, () => confetti.current?.burst(at(0, 1.5, 0.2), { n: 50, ...party }));
        once('x2', 2.8, () => confetti.current?.burst(at(0, 1.4, 0.2), { n: 36, ...party }));
        once('x3', 3.3, () => stars.current?.burst(at(0, 2.0, 0.1), { n: 18, speed: 1.1, up: 0.2, gravity: 1.4, colors: [GOLD_LIGHT, GOLD, '#FFFFFF'], size: [0.06, 0.11], life: [1.3, 1.9] }));
        break;
      }
    }

    // waking: a stretch (head up, ears out), then up onto its legs with a little shake of joy
    if (hu < 2.4 && !look.asleep) {
      const shake = pulse(hu, 1.5, 2.3);
      earOut -= pulse(hu, 0.1, 0.9) * 0.3 + shake * 0.2; headX -= pulse(hu, 0.1, 1.2) * 0.25;
      rotZ += Math.sin(hu * 40) * shake * 0.06; tailY += Math.sin(hu * 30) * shake * 0.6;
      y += shake * 0.06;
    }
    // asleep: the stirring grows as the points near the first stage
    let stirLift = 0;
    if (look.asleep && !still && look.stir > 0.4) { stirLift = pulse(t % 4.2, 0, 0.9) * (look.stir - 0.3); }

    const SL = spec.sleep;
    r.position.set(x, 0, z);
    const drop = lie * (spec.legTop * H * 0.84 - spec.bed.top / Math.max(S, 0.01));
    b.position.y = (y - drop) * S;
    b.scale.set(sx * S, sy * S, sx * S);
    ce.rotation.set(rotX, yawOverride ?? lerp(rotY, SL.yaw, lie), rotZ);
    // folded legs: squashed up under the body; asleep they disappear into the bed
    for (const k of ['FL', 'FR', 'BL', 'BR'] as const) {
      const bone = B[`leg${k}` as BoneName];
      bone.rotation.x = leg[k] * (1 - lie);
      bone.scale.set(1, lerp(fold[k], 0.16, lie), 1);
    }
    const look2 = dance === 'idle' && lie < 0.5;
    B.neck.rotation.x = neckX + lie * SL.neck - stirLift * 0.3;
    B.neck.rotation.y = neckY;
    B.head.rotation.x = approach(B.head.rotation.x, headX + lie * SL.head - (look2 ? pointer.y * 0.15 : 0), 0.15);
    B.head.rotation.y = approach(B.head.rotation.y, headY + lie * SL.headY + (look2 ? pointer.x * 0.3 : 0), 0.1);
    B.head.rotation.z = headZ;
    B.head.scale.setScalar(look.head);
    const out = earOut + lie * SL.earOut, back = earBack + lie * SL.ear - stirLift * 0.6;
    B.earR.rotation.set(-back, 0, -out - earR);
    B.earL.rotation.set(-back, 0, out + earL);
    B.tail.rotation.set(tailX - lie * 0.2, tailY * (1 - lie) + lie * SL.tail, 0);

    // the gold shimmer earned at a level-up: stars drift off its head now and then
    if (look.goldTips && !still && lie < 0.5 && t - shimmerAt.current > (glow > 0.3 ? 0.25 : 1.6)) {
      shimmerAt.current = t;
      stars.current?.burst(B.head.getWorldPosition(new Vector3()).add(new Vector3(0, 0.15 * S, 0)), { n: 2, speed: 0.35, up: 0.3, gravity: -0.15, colors: [GOLD_LIGHT, GOLD], size: [0.04, 0.07], life: [0.7, 1.1] });
    }
    // Z z z above the sleeping head
    if (zs.current) {
      zs.current.visible = lie > 0.5 && !still;
      if (zs.current.visible) {
        const hp = B.head.getWorldPosition(new Vector3());
        zs.current.position.set(hp.x, hp.y + 0.12, hp.z);
        zs.current.children.forEach((m, i) => {
          const ph = ((t * 0.45 + i / 3) % 1);
          m.position.set(0.08 + ph * 0.22, ph * 0.45, 0.05);
          m.scale.setScalar((0.08 + ph * 0.1) * (1 + i * 0.1));
          ((m as Mesh).material as MeshBasicMaterial).opacity = Math.sin(ph * Math.PI) * 0.95;
        });
      }
    }

    if (ring.current) {
      (ring.current.material as MeshBasicMaterial).opacity = ringO * 0.85;
      ring.current.scale.setScalar(ringS * Math.max(S, 0.6));
      ring.current.rotation.z = t * 5;
      ring.current.position.set(x, 0.05, z);
    }
    if (rays.current) {
      rays.current.visible = raysO > 0.01;
      rays.current.position.set(x, (spec.head[1] * H * 0.9 + y) * S, z - 0.4);
      rays.current.rotation.z = t * 0.5;
      rays.current.scale.setScalar(2 * S);
      (rays.current.material as MeshBasicMaterial).opacity = Math.min(1, raysO) * 0.8;
    }
    if (halo.current) (halo.current.material as MeshBasicMaterial).opacity = (look.aura ? 0.55 : 0.26) + breathe * 3 + glow * 0.3;
    if (trailHead.current) { trailHead.current.visible = trailOn; trailHead.current.position.set(x, (spec.centerY * H + y) * S, z); }
  });

  const C = spec.centerY * H;
  const chestFromNeck: V3 = [0, (spec.chest[1] - spec.neck[1]) * H, (spec.chest[2] - spec.neck[2]) * H];
  return (
    <group>
      <SleepBed spec={spec} show={bedShow} />
      <group ref={root}>
        <group ref={body}>
          <group
            ref={center}
            position={[0, C, 0]}
            onClick={(e) => {
              e.stopPropagation();
              tapAt.current = clock.getElapsedTime();
              hearts.current?.burst(new Vector3(root.current?.position.x ?? 0, (look.asleep ? 0.5 : 1.3) * look.size, 0.3), { n: 6, speed: 0.8, up: 0.8, gravity: -0.8, colors: ['#E43A3F', '#FF8F86'], size: [0.06, 0.1], life: [1.1, 1.6] });
            }}
          >
            {/* What a tap hits: a light invisible ball, never the skinned body (CPU skinning per tap froze phones). */}
            <mesh position={[0, 0.05 * H, 0]}>
              <sphereGeometry args={[spec.hit[1] * H, 12, 8]} />
              <meshBasicMaterial visible={false} />
            </mesh>
            <group position={[0, -C, 0]}>
              <mesh ref={halo} position={[0, spec.centerY * H * 1.3, -0.7]} raycast={() => null}>
                <planeGeometry args={[2.8, 2.8]} />
                <meshBasicMaterial map={tex.glow} transparent opacity={0.3} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
              </mesh>
              <primitive object={rig.mesh} raycast={() => null} />
            </group>
          </group>
        </group>
      </group>

      {/* gold khatam pendant on a fine chain, hung from the neck so it follows the dances (a level-up reward) */}
      {look.pendant && createPortal(
        <group position={chestFromNeck}>
          <mesh rotation={[Math.PI / 2 - 0.35, 0, 0]} position={[0, 0.04, -0.06]}>
            <torusGeometry args={[kind === 'camel' ? 0.13 : 0.15, 0.008, 8, 64]} />
            <Gold rough={0.15} />
          </mesh>
          <group position={[0, -0.06, 0.04]} rotation={[-0.2, 0, 0]} scale={kind === 'camel' ? 1.1 : 1.15}>
            <mesh><extrudeGeometry args={[pendant.outer, thin]} /><Gold rough={0.12} /></mesh>
            <mesh position={[0, 0, 0.025]}><extrudeGeometry args={[pendant.inner, thin]} /><meshPhysicalMaterial color="#C51F24" roughness={0.3} clearcoat={1} /></mesh>
            <mesh position={[0, 0, 0.04]}><extrudeGeometry args={[pendant.star, thin]} /><Gold rough={0.1} /></mesh>
          </group>
        </group>,
        rig.bones.neck,
      )}

      <group ref={zs} visible={false}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={tex.z} transparent opacity={0} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <mesh ref={ring} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.68, 64, 1, 0, Math.PI * 1.5]} />
        <meshBasicMaterial color={GOLD_LIGHT} transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={rays} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={tex.rays} transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <Trail width={2.2} length={7} color={GOLD_LIGHT} attenuation={(w) => w * w} decay={1.4}>
        <mesh ref={trailHead} visible={false}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={GOLD_LIGHT} toneMapped={false} />
        </mesh>
      </Trail>
      {look.aura && !still && <Sparkles count={30} scale={[1.9, 2.2, 1]} position={[0, 1.1 * look.size, 0]} size={3.2} speed={0.4} color={GOLD_LIGHT} />}
      <SparkPool api={sparks} />
      <IconPool api={hearts} map={tex.heart} />
      <IconPool api={confetti} map={tex.confetti} />
      <IconPool api={stars} map={tex.star} additive />
      <IconPool api={puffs} map={tex.puff} N={60} />
      <IconPool api={tufts} map={tex.puff} N={24} />
    </group>
  );
}

