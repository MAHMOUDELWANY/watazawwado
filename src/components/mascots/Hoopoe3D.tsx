import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sparkles, Trail, useGLTF } from '@react-three/drei';
import {
  AdditiveBlending, Bone, BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, Group, Mesh, MeshBasicMaterial,
  Skeleton, SkinnedMesh, SRGBColorSpace, Vector3, type Material, type Object3D,
} from 'three';
import {
  GOLD, GOLD_LIGHT, IconPool, SparkPool, Gold, approach, backOut, canvas, ease, khatam, popIn, pulse,
  radialTexture, raysTexture, spriteTexture, star4, type Burst, type PoolApi,
} from './Zad3D';
import { HoopoeEgg } from './HoopoeEgg';

/**
 * The hoopoe companion in 3D (owner, 2026-11-14: it must look like the approved art). The model is
 * the Meshy one made from `docs/design/companions/hoopoe-turnaround.png`; Meshy only rigs humanoids, so the bones
 * and skin weights are computed here from the shape of the bird (head, crest, beak, wings, tail), and the dances
 * drive those bones. The child unlocks dances with XP; it grows through the companion stages
 * (docs/superpowers/specs/2026-11-13-kids-companion-design.md) and gains gold details as it levels up.
 */

export type HoopoeDance = 'idle' | 'hop' | 'crest' | 'bob' | 'sway' | 'twirl' | 'slide' | 'flip' | 'loop' | 'finale';
export const DANCE_LENGTH: Record<HoopoeDance, number> = {
  idle: 0, hop: 1.8, crest: 2.6, bob: 3.3, sway: 3.4, twirl: 2.3, slide: 3.0, flip: 2.0, loop: 3.2, finale: 4.8,
};
/**
 * What growth has given it so far: overall size, crest size, head and beak proportions (a chick has a big head and a
 * short beak), a gold shimmer on the crest, a gold khatam pendant, a gold aura.
 */
export type HoopoeLook = {
  size: number; crest: number; head: number; beak: number; goldTips: boolean; pendant: boolean; aura: boolean;
  /** Still an egg, and how far it has cracked (0..1). */
  egg: boolean; crack: number;
};

const COPPER = '#D9874C';
const CREAM = '#F7E4C4';
const ESPRESSO = '#2A1610';
const MODEL = '/prototypes/companions/3d/hoopoe-hq.glb';
/** Height of the grown bird in scene units. */
const H = 1.6;

/** A small loose feather for the sprite pool. */
function featherSprite() {
  const [c, g] = canvas(128);
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#FFFFFF'); grad.addColorStop(1, '#C9BEB4');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(64, 8); g.quadraticCurveTo(104, 60, 66, 116); g.quadraticCurveTo(26, 62, 64, 8); g.fill();
  g.strokeStyle = 'rgba(60,30,20,0.5)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(64, 14); g.quadraticCurveTo(70, 70, 64, 124); g.stroke();
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

const smooth = (a: number, b: number, x: number) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

// landmarks of this model, in scene units after it is stood on the ground, H tall, beak towards +z
const L = {
  neck: [0.5 * H, 0.6 * H], // head weight fades in across the neck
  headPivot: [0, 0.55 * H, 0.05],
  crestPivot: [0, 0.83 * H, -0.1], crestDir: [0, 0.75, -0.65], crestFade: [0.0, 0.1],
  beakPivot: [0, 0.65 * H, 0.28], beakFade: [0.3, 0.36],
  wingPivot: [0.2, 0.47 * H, 0], wingX: [0.2, 0.27], wingY: [0.15 * H, 0.22 * H],
  tailPivot: [0, 0.25 * H, -0.25], tailZ: [0.26, 0.4], tailY: [0.3 * H, 0.4 * H],
};
const BONES = ['root', 'head', 'crest', 'beak', 'wingL', 'wingR', 'tail'] as const;
type BoneName = (typeof BONES)[number];

/** Stand the Meshy mesh on the ground facing +z, then give it bones and smooth skin weights from its shape. */
function buildRig(scene: Object3D) {
  let src: Mesh | undefined;
  scene.traverse((o) => { if ((o as Mesh).isMesh && !src) src = o as Mesh; });
  if (!src) throw new Error('hoopoe model has no mesh');
  src.updateWorldMatrix(true, false);
  const pos = src.geometry.attributes.position, nor = src.geometry.attributes.normal;
  const n = pos.count;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3);
  const v = new Vector3();
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(src.matrixWorld);
    P.set([v.x, v.y, v.z], i * 3);
    minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
    v.fromBufferAttribute(nor, i).transformDirection(src.matrixWorld);
    N.set([v.x, v.y, v.z], i * 3);
  }
  const k = H / (maxY - minY);
  // the beak is the thin part sticking out at head height: face it towards +z
  let headMinZ = Infinity, headMaxZ = -Infinity, footX = 0, footZ = 0, feet = 0;
  for (let i = 0; i < n; i++) {
    const y = (P[i * 3 + 1] - minY) * k, z = P[i * 3 + 2];
    if (y > 0.7 * H && y < 0.8 * H) { headMinZ = Math.min(headMinZ, z); headMaxZ = Math.max(headMaxZ, z); }
    if (y < 0.06 * H) { footX += P[i * 3]; footZ += z; feet++; }
  }
  footX /= feet; footZ /= feet;
  const flip = footZ - headMinZ > headMaxZ - footZ ? -1 : 1;
  for (let i = 0; i < n; i++) {
    P[i * 3] = (P[i * 3] - footX) * k * flip;
    P[i * 3 + 1] = (P[i * 3 + 1] - minY) * k;
    P[i * 3 + 2] = (P[i * 3 + 2] - footZ) * k * flip;
    N[i * 3] *= flip; N[i * 3 + 2] *= flip;
  }

  // skin weights: every vertex takes its four strongest bones
  const skinIndex = new Uint16Array(n * 4), skinWeight = new Float32Array(n * 4);
  const w = new Float32Array(BONES.length);
  const cd = new Vector3(...L.crestDir).normalize();
  for (let i = 0; i < n; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
    const head = smooth(L.neck[0], L.neck[1], y);
    const crest = head * smooth(L.crestFade[0], L.crestFade[1], (x - L.crestPivot[0]) * cd.x + (y - L.crestPivot[1]) * cd.y + (z - L.crestPivot[2]) * cd.z);
    const beak = head * (1 - crest) * smooth(L.beakFade[0], L.beakFade[1], z);
    const low = 1 - head;
    const tail = low * smooth(L.tailZ[0], L.tailZ[1], -z) * (1 - smooth(L.tailY[0], L.tailY[1], y));
    const wing = low * (1 - tail) * smooth(L.wingX[0], L.wingX[1], Math.abs(x)) * smooth(L.wingY[0], L.wingY[1], y);
    w[1] = head - crest - beak; w[2] = crest; w[3] = beak;
    w[4] = x < 0 ? wing : 0; w[5] = x >= 0 ? wing : 0; w[6] = tail;
    w[0] = Math.max(0, 1 - w[1] - w[2] - w[3] - w[4] - w[5] - w[6]);
    const order = [0, 1, 2, 3, 4, 5, 6].sort((a, b) => w[b] - w[a]).slice(0, 4);
    const sum = order.reduce((s, b) => s + w[b], 0) || 1;
    order.forEach((b, j) => { skinIndex[i * 4 + j] = b; skinWeight[i * 4 + j] = w[b] / sum; });
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(P, 3));
  geo.setAttribute('normal', new BufferAttribute(N, 3));
  geo.setAttribute('uv', src.geometry.attributes.uv);
  geo.setAttribute('skinIndex', new BufferAttribute(skinIndex, 4));
  geo.setAttribute('skinWeight', new BufferAttribute(skinWeight, 4));
  geo.setIndex(src.geometry.index);

  const at: Record<BoneName, number[]> = {
    root: [0, 0, 0], head: L.headPivot, crest: L.crestPivot, beak: L.beakPivot,
    wingL: [-L.wingPivot[0], L.wingPivot[1], L.wingPivot[2]], wingR: L.wingPivot, tail: L.tailPivot,
  };
  const parent: Partial<Record<BoneName, BoneName>> = { head: 'root', crest: 'head', beak: 'head', wingL: 'root', wingR: 'root', tail: 'root' };
  const bones = {} as Record<BoneName, Bone>;
  for (const name of BONES) {
    const b = new Bone();
    const p = parent[name];
    b.position.set(at[name][0] - (p ? at[p][0] : 0), at[name][1] - (p ? at[p][1] : 0), at[name][2] - (p ? at[p][2] : 0));
    if (p) bones[p].add(b);
    bones[name] = b;
  }
  const mesh = new SkinnedMesh(geo, src.material as Material);
  mesh.add(bones.root);
  mesh.bind(new Skeleton(BONES.map((b) => bones[b])));
  mesh.castShadow = true;
  mesh.frustumCulled = false; // the bounding sphere does not follow the bones
  return { mesh, bones };
}

export function HoopoeModel({ dance, startedAt, onDone, still, look, celebrateAt, hatchAt = 0 }: {
  dance: HoopoeDance; startedAt: number; onDone: () => void; still: boolean; look: HoopoeLook; celebrateAt: number;
  /** Clock time the egg started hatching (0: not hatching). */
  hatchAt?: number;
}) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const center = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const rays = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);
  const trailHead = useRef<Mesh>(null);
  const sparks = useRef<{ burst: Burst } | null>(null);
  const hearts = useRef<PoolApi | null>(null);
  const stars = useRef<PoolApi | null>(null);
  const confetti = useRef<PoolApi | null>(null);
  const puffs = useRef<PoolApi | null>(null);
  const plumes = useRef<PoolApi | null>(null);
  const fired = useRef<Set<string>>(new Set());
  const tapAt = useRef(-10);
  const shimmerAt = useRef(0);
  const { pointer, clock } = useThree();

  const { scene } = useGLTF(MODEL, false, true);
  const rig = useMemo(() => buildRig(scene), [scene]);
  const head = { current: rig.bones.head };

  const tex = useMemo(() => ({
    heart: spriteTexture('heart'), star: spriteTexture('star'), confetti: spriteTexture('confetti'), puff: spriteTexture('puff'),
    plume: featherSprite(), rays: raysTexture(), glow: radialTexture('rgba(246,194,90,1)'),
  }), []);
  const pendant = useMemo(() => ({ outer: khatam(0.075, 0.12), inner: khatam(0.052, 0.1), star: star4(0.026) }), []);
  const thin = { depth: 0.02, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 4, curveSegments: 10 };

  useEffect(() => { fired.current = new Set(); }, [startedAt]);
  useEffect(() => {
    if (!celebrateAt) return;
    const party = { speed: 2.6, up: 1.3, gravity: 2.2, flip: true, size: [0.09, 0.14] as [number, number], life: [1.6, 2.3] as [number, number], colors: ['#C51F24', GOLD, '#FFF4E2', '#E43A3F', '#E5AC48', COPPER] };
    confetti.current?.burst(new Vector3(0, 1.5, 0.2), { n: 60, ...party });
    sparks.current?.burst(new Vector3(0, 1.2, 0.2), 40, 2.4, GOLD_LIGHT, 0.4);
  }, [celebrateAt]);

  useFrame(({ clock: c }) => {
    const t = c.getElapsedTime();
    const u = t - startedAt;
    if (dance !== 'idle' && u > DANCE_LENGTH[dance]) onDone();
    const once = (key: string, at: number, fn: () => void) => {
      if (u >= at && !fired.current.has(key)) { fired.current.add(key); fn(); }
    };
    const r = root.current, b = body.current, ce = center.current, h = head.current;
    if (!r || !b || !ce || !h) return;
    // hatching: the bird pops out of the egg as the top of the shell flies off
    const hu = hatchAt ? t - hatchAt : 99;
    const appear = look.egg ? 0 : hu < 0.85 ? 0 : backOut((hu - 0.85) / 0.5);
    b.visible = appear > 0.001;
    const S = look.size * Math.max(appear, 0.001);

    // idle: breathing, a slow sway, tail flicks, the crest flicks up now and then like a real hoopoe's
    const breathe = still ? 0 : Math.sin(t * 2.2) * 0.018;
    let x = 0, y = breathe, rotX = 0, rotY = still ? 0 : Math.sin(t * 0.55) * 0.2, rotZ = 0, sx = 1, sy = 1 + breathe * 0.6;
    let wL = still ? 0 : Math.sin(t * 2.2) * 0.03, wR = wL, crest = 0.35, glow = 0, headX = 0, headZ = 0;
    let tailY = still ? 0 : Math.sin(t * 1.3) * 0.15;
    if (!still) { const flick = pulse(t % 6.5, 0, 0.7); crest += flick * 0.55; tailY += flick * Math.sin(t * 30) * 0.2; }
    let happy = 0, blushTo = 0.55, beak = 0, gx = 0, gy = 0;
    let ringO = 0, ringS = 1, raysO = 0, trailOn = false;
    const at = (px: number, py: number, pz: number) => new Vector3(px + x, py * S, pz);

    // tap: crest flares, a little hop and a chirp
    const tu = t - tapAt.current;
    if (tu < 0.7) {
      const p = pulse(tu, 0, 0.6);
      y += p * 0.12; crest += p * 0.8; beak = Math.abs(Math.sin(tu * 30)) * p; happy = 1; blushTo = 0.95;
    }

    if (hu < 2) { const p = pulse(hu, 0.9, 1.9); crest += p * 0.9; happy = 1; y += p * 0.1; }

    if (!still && !look.egg) switch (dance) {
      case 'hop': {
        const j1 = pulse(u, 0.12, 0.62), j2 = pulse(u, 0.78, 1.32), land = pulse(u, 0.6, 0.8) + pulse(u, 1.3, 1.5);
        y += (j1 + j2 * 1.15) * 0.42;
        sy += (pulse(u, 0, 0.14) + land) * -0.16 + (j1 + j2) * 0.07;
        sx += land * 0.1 - (j1 + j2) * 0.03;
        wL = wR = (j1 + j2) * 0.9 + Math.sin(u * 28) * 0.35 * (j1 + j2);
        crest += (j1 + j2) * 0.45 + land * 0.35;
        rotY += ease((u - 0.78) / 0.54) * Math.PI * 2; // the second hop is a full turn
        happy = 1; beak = (j1 + j2) * 0.5; blushTo = 0.9;
        const dust = { colors: ['#F4E6CC', '#E8D5B0', '#D9BF94'], gravity: -0.25, up: -0.25, grow: true, size: [0.1, 0.18] as [number, number], life: [0.6, 0.9] as [number, number] };
        once('d1', 0.62, () => puffs.current?.burst(at(0, 0.06, 0.05), { n: 10, speed: 1.1, ...dust }));
        once('d2', 1.32, () => puffs.current?.burst(at(0, 0.06, 0.05), { n: 14, speed: 1.4, ...dust }));
        break;
      }
      case 'crest': {
        // fans the crest open wide, chest out, head up; it shimmers gold with rays behind it
        const up = backOut((u - 0.3) / 0.45) * (1 - ease((u - 2.15) / 0.35));
        crest = 0.35 + up * 0.95;
        glow = pulse(u, 0.5, 2.3);
        headX = -up * 0.22;
        sx += up * 0.06; sy += up * 0.03;
        wL = wR = up * 0.25;
        raysO = popIn(u, 0.45, 2.35);
        happy = up > 0.5 ? 1 : 0; blushTo = 0.9; beak = up * 0.25;
        once('c1', 0.6, () => stars.current?.burst(at(0, 1.62, 0.1), { n: 18, speed: 1.3, up: 0.5, gravity: 0.6, colors: [GOLD_LIGHT, GOLD, '#FFFFFF'], size: [0.05, 0.1], life: [0.8, 1.3] }));
        break;
      }
      case 'bob': {
        // head bob to a steady beat: the head tilts left, right, left; wings flick in turn; a ripple on every beat
        const on = ease(u / 0.3) * (1 - ease((u - 3.0) / 0.3));
        const ph = Math.max(0, (u - 0.2) / 0.42);
        const s = Math.sin(ph * Math.PI), bnc = Math.abs(s), frac = ph % 1;
        y += bnc * 0.09 * on; sy -= (1 - bnc) * 0.05 * on;
        headZ = s * 0.32 * on; rotZ -= s * 0.08 * on;
        headX = (1 - bnc) * 0.14 * on;
        wL = (s > 0 ? bnc : 0) * 0.6 * on; wR = (s < 0 ? bnc : 0) * 0.6 * on;
        crest += bnc * 0.4 * on;
        ringO = on * (1 - frac) * 0.7; ringS = 0.5 + frac * 1.3;
        happy = 1; beak = bnc * 0.35 * on; blushTo = 0.85;
        for (let i = 0; i < 7; i += 2) once(`b${i}`, 0.2 + i * 0.42, () => stars.current?.burst(at(0, 1.3, 0.3), { n: 5, speed: 0.9, up: 0.4, gravity: 0.8, colors: [GOLD_LIGHT, GOLD], size: [0.04, 0.07], life: [0.5, 0.8] }));
        break;
      }
      case 'sway': {
        // sways side to side with wings spread, a wave rolling through them; loose feathers drift down
        const on = ease(u / 0.4) * (1 - ease((u - 3.0) / 0.4));
        const p = Math.sin(u * Math.PI * 1.2);
        x = p * 0.22 * on; rotZ -= p * 0.16 * on; headZ = -p * 0.18 * on;
        wL = (1.1 + Math.sin(u * 6.5) * 0.4) * on; wR = (1.1 + Math.sin(u * 6.5 + Math.PI) * 0.4) * on;
        crest += on * 0.3;
        happy = on > 0.5 ? 1 : 0; blushTo = 0.85; beak = on * 0.15;
        const drift = { n: 2, speed: 0.6, up: 0.6, gravity: 0.35, flip: true, colors: [COPPER, CREAM, ESPRESSO], size: [0.1, 0.14] as [number, number], life: [1.8, 2.4] as [number, number] };
        once('f1', 0.9, () => plumes.current?.burst(at(-0.65, 0.95, 0.1), drift));
        once('f2', 1.7, () => plumes.current?.burst(at(0.65, 0.95, 0.1), drift));
        once('f3', 2.5, () => plumes.current?.burst(at(-0.6, 0.95, 0.1), drift));
        break;
      }
      case 'twirl': {
        // twirls twice with wings out, gold sparks spiralling off the wing tips
        const k = ease((u - 0.25) / 1.4);
        const spin = k * Math.PI * 4;
        rotY += spin;
        y += pulse(u, 0.2, 1.85) * 0.12;
        wL = wR = pulse(u, 0.15, 1.95) * 1.25;
        crest += pulse(u, 0.2, 1.9) * 0.65;
        ringO = pulse(u, 0.25, 1.8); ringS = 0.8 + k * 0.5;
        happy = u > 1.55 ? 1 : 0; beak = 0.4;
        if (u > 0.35 && u < 1.6) {
          for (const sgn of [1, -1]) {
            const a = rotY;
            stars.current?.burst(new Vector3(x + Math.cos(a) * 0.6 * sgn * S, (0.72 + y) * S, -Math.sin(a) * 0.6 * sgn * S), { n: 1, speed: 0.3, gravity: -0.2, colors: [GOLD_LIGHT, GOLD], size: [0.04, 0.07], life: [0.5, 0.8] });
          }
        }
        once('t1', 1.7, () => stars.current?.burst(at(0, 1.2, 0.3), { n: 16, speed: 1.4, up: 0.3, gravity: 0.6, colors: [GOLD_LIGHT, GOLD, '#FFFFFF'], size: [0.05, 0.09], life: [0.8, 1.2] }));
        break;
      }
      case 'slide': {
        // glides smoothly one way, then the other, leaning into it; dust where it turns
        const on = ease(u / 0.25) * (1 - ease((u - 2.7) / 0.3));
        const a = Math.max(0, (u - 0.2) / 2.4) * Math.PI * 2;
        x = Math.sin(a) * 0.55 * on;
        rotZ -= Math.cos(a) * 0.2 * on; headZ = Math.cos(a) * 0.12 * on;
        rotY += Math.cos(a) * 0.5 * on;
        y += Math.abs(Math.sin(u * 9)) * 0.025 * on;
        wL = wR = 0.55 * on;
        crest += 0.25 * on;
        happy = 1; blushTo = 0.85;
        const dust = { colors: ['#F4E6CC', '#E8D5B0'], gravity: -0.2, up: -0.2, grow: true, size: [0.08, 0.14] as [number, number], life: [0.5, 0.8] as [number, number] };
        once('s1', 0.8, () => puffs.current?.burst(at(0, 0.05, 0), { n: 8, speed: 0.9, ...dust }));
        once('s2', 2.0, () => puffs.current?.burst(at(0, 0.05, 0), { n: 8, speed: 0.9, ...dust }));
        break;
      }
      case 'flip': {
        // crouch, a backflip high in the air, a squashy landing with a burst of stars
        sy -= pulse(u, 0, 0.34) * 0.22;
        const k = (u - 0.32) / 0.9;
        const air = k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0;
        y += air * 0.8;
        rotX -= ease(Math.min(Math.max(k, 0), 1)) * Math.PI * 2;
        const land = pulse(u, 1.2, 1.5);
        sy -= land * 0.24; sx += land * 0.16;
        wL = wR = air * 1.4 + land * 0.4;
        crest += air * 0.5 + land * 0.4;
        happy = u > 1.25 ? 1 : 0; beak = air * 0.5;
        ringO = pulse(u, 1.2, 1.9); ringS = 0.5 + ease((u - 1.2) / 0.7) * 1.6;
        once('l1', 1.22, () => stars.current?.burst(at(0, 0.5, 0.3), { n: 20, speed: 1.8, up: 0.5, gravity: 1, colors: [GOLD_LIGHT, GOLD, '#FFFFFF'], size: [0.05, 0.1], life: [0.8, 1.2] }));
        break;
      }
      case 'loop': {
        // takes off and flies a loop-the-loop with a comet trail, then lands
        const R = 0.42;
        const flying = u > 0.15 && u < 2.85;
        if (u < 0.6) y += ease((u - 0.15) / 0.45) * 0.35;
        else if (u < 2.2) {
          const th = ease((u - 0.6) / 1.6) * Math.PI * 2;
          x = Math.sin(th) * R; y += 0.35 + R * (1 - Math.cos(th)); rotZ += th;
        } else y += (1 - ease((u - 2.2) / 0.6)) * 0.35;
        const land = pulse(u, 2.8, 3.1);
        sy -= land * 0.2; sx += land * 0.14;
        if (flying) { wL = wR = 0.9 + Math.sin(u * 32) * 0.55; crest = 0.15; }
        crest += land * 0.9;
        trailOn = u > 0.5 && u < 2.4;
        happy = 1; beak = flying ? 0.3 : 0;
        once('o1', 1.4, () => plumes.current?.burst(at(0, 1.6, 0.1), { n: 6, speed: 1, up: 0.3, gravity: 0.35, flip: true, colors: [COPPER, CREAM, ESPRESSO], size: [0.09, 0.13], life: [1.6, 2.2] }));
        once('o2', 2.82, () => stars.current?.burst(at(0, 0.4, 0.3), { n: 14, speed: 1.4, up: 0.4, gravity: 0.9, colors: [GOLD_LIGHT, GOLD], size: [0.05, 0.09], life: [0.7, 1.1] }));
        break;
      }
      case 'finale': {
        // the big one: two hops, a double twirl, then the crest blazes gold with rays and confetti, wings wide
        const j1 = pulse(u, 0.1, 0.5), j2 = pulse(u, 0.55, 0.95);
        y += (j1 + j2) * 0.35;
        sy += (pulse(u, 0.48, 0.6) + pulse(u, 0.93, 1.05)) * -0.14;
        const k = ease((u - 1.0) / 1.0);
        rotY += k * Math.PI * 4;
        ringO = pulse(u, 1.0, 2.1); ringS = 0.8 + k * 0.6;
        const blaze = ease((u - 2.0) / 0.3) * (1 - ease((u - 4.3) / 0.4));
        crest += (j1 + j2) * 0.4 + pulse(u, 1.0, 2.0) * 0.5 + blaze * 0.95;
        glow = blaze * 1.3;
        wL = wR = (j1 + j2) * 0.9 + pulse(u, 1.0, 2.0) * 1.2 + blaze * 1.45 + Math.sin(u * 6) * 0.1 * blaze;
        headX = -blaze * 0.2;
        raysO = blaze;
        happy = 1; beak = 0.3 + blaze * 0.3; blushTo = 1;
        const party = { speed: 2.6, up: 1.3, gravity: 2.2, flip: true, size: [0.09, 0.14] as [number, number], life: [1.6, 2.3] as [number, number], colors: ['#C51F24', GOLD, '#FFF4E2', '#E43A3F', '#E5AC48', COPPER] };
        once('x1', 2.1, () => confetti.current?.burst(at(0, 1.5, 0.2), { n: 50, ...party }));
        once('x2', 2.8, () => confetti.current?.burst(at(0, 1.4, 0.2), { n: 36, ...party }));
        once('x3', 3.3, () => stars.current?.burst(at(0, 2.0, 0.1), { n: 18, speed: 1.1, up: 0.2, gravity: 1.4, colors: [GOLD_LIGHT, GOLD, '#FFFFFF'], size: [0.06, 0.11], life: [1.3, 1.9] }));
        break;
      }
    }

    r.position.set(x, 0, 0);
    b.position.y = y * S;
    b.scale.set(sx * S, sy * S, sx * S);
    ce.rotation.set(rotX, rotY, rotZ);
    const { crest: crestB, beak: beakB, wingL, wingR, tail } = rig.bones;
    h.rotation.x = approach(h.rotation.x, headX - (dance === 'idle' ? pointer.y * 0.15 : 0), 0.15);
    h.rotation.y = approach(h.rotation.y, dance === 'idle' ? pointer.x * 0.35 : 0, 0.1);
    h.rotation.z = headZ;
    h.scale.setScalar(look.head);
    beakB.scale.set(1, 1, look.beak);
    // the wings are one skin with the body, so they lift and flutter rather than spread wide
    wingL.rotation.z = -Math.min(0.75, wL * 0.5);
    wingR.rotation.z = Math.min(0.75, wR * 0.5);
    wingL.rotation.y = Math.min(0.5, wL * 0.3);
    wingR.rotation.y = -Math.min(0.5, wR * 0.3);
    tail.rotation.y = tailY;
    tail.rotation.x = -Math.abs(tailY) * 0.4;

    // crest: laid back (0) to standing tall and forward (1), overshoot allowed
    const cr = Math.max(0, crest);
    crestB.rotation.x = approach(crestB.rotation.x, (Math.min(cr, 1.3) - 0.35) * 0.55, 0.35);
    crestB.scale.setScalar(look.crest * (1 + (Math.min(cr, 1.3) - 0.35) * 0.3));
    void happy; void blushTo; void beak; void gx; void gy;

    // the gold shimmer earned at a level-up: stars drift off the crest now and then
    if (look.goldTips && !still && t - shimmerAt.current > (glow > 0.3 ? 0.25 : 1.6)) {
      shimmerAt.current = t;
      stars.current?.burst(crestB.getWorldPosition(new Vector3()).add(new Vector3(0, 0.12 * S, 0)), { n: 2, speed: 0.35, up: 0.3, gravity: -0.15, colors: [GOLD_LIGHT, GOLD], size: [0.04, 0.07], life: [0.7, 1.1] });
    }

    if (ring.current) {
      (ring.current.material as MeshBasicMaterial).opacity = ringO * 0.85;
      ring.current.scale.setScalar(ringS * S);
      ring.current.rotation.z = t * 5;
      ring.current.position.x = x;
    }
    if (rays.current) {
      rays.current.visible = raysO > 0.01;
      rays.current.position.set(x, (1.25 + y) * S, -0.35);
      rays.current.rotation.z = t * 0.5;
      rays.current.scale.setScalar(1.8 * S);
      (rays.current.material as MeshBasicMaterial).opacity = Math.min(1, raysO) * 0.8;
    }
    if (halo.current) (halo.current.material as MeshBasicMaterial).opacity = (look.aura ? 0.55 : 0.28) + breathe * 3 + glow * 0.3;
    if (trailHead.current) { trailHead.current.visible = trailOn; trailHead.current.position.set(x, (0.62 + y) * S, 0); }
  });

  return (
    <group>
      <group ref={root}>
        <group ref={body}>
          <group
            ref={center}
            position={[0, 0.62, 0]}
            onClick={(e) => {
              e.stopPropagation();
              tapAt.current = clock.getElapsedTime();
              hearts.current?.burst(new Vector3(root.current?.position.x ?? 0, 1.35 * look.size, 0.3), { n: 6, speed: 0.8, up: 0.8, gravity: -0.8, colors: ['#E43A3F', '#FF8F86'], size: [0.06, 0.1], life: [1.1, 1.6] });
            }}
          >
            <group position={[0, -0.62, 0]}>
              {/* warm glow behind; brighter once it has the aura */}
              <mesh ref={halo} position={[0, 0.85, -0.6]} raycast={() => null}>
                <planeGeometry args={[2.6, 2.6]} />
                <meshBasicMaterial map={tex.glow} transparent opacity={0.3} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
              </mesh>

              <primitive object={rig.mesh} />

              {/* gold khatam pendant on a fine chain (a level-up reward) */}
              {look.pendant && (
                <group position={[0, 0.555 * H, 0.03]}>
                  <mesh rotation={[Math.PI / 2 - 0.5, 0, 0]}>
                    <torusGeometry args={[0.165, 0.008, 8, 64]} />
                    <Gold rough={0.15} />
                  </mesh>
                  <group position={[0, -0.1, 0.2]} rotation={[-0.25, 0, 0]} scale={1.25}>
                    <mesh><extrudeGeometry args={[pendant.outer, thin]} /><Gold rough={0.12} /></mesh>
                    <mesh position={[0, 0, 0.025]}><extrudeGeometry args={[pendant.inner, thin]} /><meshPhysicalMaterial color="#C51F24" roughness={0.3} clearcoat={1} /></mesh>
                    <mesh position={[0, 0, 0.04]}><extrudeGeometry args={[pendant.star, thin]} /><Gold rough={0.1} /></mesh>
                  </group>
                </group>
              )}
            </group>
          </group>
        </group>
      </group>

      {/* ground ripple and the rays behind the crest */}
      <mesh ref={ring} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.68, 64, 1, 0, Math.PI * 1.5]} />
        <meshBasicMaterial color={GOLD_LIGHT} transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={rays} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={tex.rays} transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <Trail width={2.2} length={7} color={GOLD_LIGHT} attenuation={(w) => w * w} decay={1.4}>
        <mesh ref={trailHead} visible={false} position={[0, 0.62 * look.size, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={GOLD_LIGHT} toneMapped={false} />
        </mesh>
      </Trail>
      {look.aura && !still && <Sparkles count={30} scale={[1.8, 2.2, 1]} position={[0, 1.1 * look.size, 0]} size={3.2} speed={0.4} color={GOLD_LIGHT} />}
      {(look.egg || hatchAt > 0) && (
        <group onClick={(e) => { e.stopPropagation(); tapAt.current = clock.getElapsedTime(); }}>
          <HoopoeEgg crack={look.crack} egg={look.egg} hatchAt={hatchAt} still={still} tapAt={tapAt} fx={{ confetti, stars, sparks }} />
        </group>
      )}
      <SparkPool api={sparks} />
      <IconPool api={hearts} map={tex.heart} />
      <IconPool api={confetti} map={tex.confetti} />
      <IconPool api={stars} map={tex.star} additive />
      <IconPool api={puffs} map={tex.puff} N={50} />
      <IconPool api={plumes} map={tex.plume} N={24} />
    </group>
  );
}

useGLTF.preload(MODEL, false, true);
