import * as THREE from 'three';

/**
 * "Here, your teacher stays" (owner's idea 1, 2026-11-05): a child stands alone; the teacher arrives on a flying carpet,
 * kneels, takes the child's hand and lifts them up; side by side they fly one full loop of a golden infinity and stop
 * in its centre. The two figures are the logo's: teal teacher, copper student.
 *
 * The scroll position drives the story (0..1). Joints run on springs and arms on two-bone IK, so poses ease and
 * settle instead of snapping. Loaded on demand, so three.js stays out of the homepage's first download.
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const DOWN = V(0, -1, 0);
const QID = new THREE.Quaternion();
const PI = Math.PI;

// Logo colours (sampled from public/logo.png) and the site's crimson and gold.
const TEAL = 0x0e96ae, TEAL_HEAD = 0x149fb6, COPPER = 0xa25e2f, COPPER_HEAD = 0xb9703a, GOLD = 0xe5a93c;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const bump = (p: number, a: number, b: number) => Math.sin(PI * seg(p, a, b));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Damped spring for one number: gives follow-through and a soft settle. */
class Spring {
  private c: number; v = 0;
  constructor(private k = 100, z = 0.7, public x = 0) { this.c = 2 * z * Math.sqrt(k); }
  to(t: number, dt: number) {
    const n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n;
    for (let i = 0; i < n; i++) { this.v += (this.k * (t - this.x) - this.c * this.v) * h; this.x += this.v * h; }
    return this.x;
  }
}
class Spring3 {
  private c: number; private ok = false; private a = V(0, 0, 0);
  x = V(0, 0, 0); v = V(0, 0, 0);
  constructor(private k = 100, z = 0.7) { this.c = 2 * z * Math.sqrt(k); }
  to(t: THREE.Vector3, dt: number) {
    if (!this.ok) { this.x.copy(t); this.ok = true; return this.x; }
    const n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n;
    for (let i = 0; i < n; i++) {
      this.a.copy(t).sub(this.x).multiplyScalar(this.k).addScaledVector(this.v, -this.c);
      this.v.addScaledVector(this.a, h); this.x.addScaledVector(this.v, h);
    }
    return this.x;
  }
}

function radialTexture(c0: string, c1: string) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d')!; const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, c0); g.addColorStop(1, c1); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Crimson carpet with a gold border, a teal inner line and an infinity woven in the middle. */
function carpetTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 256, 512); g.addColorStop(0, '#C51F24'); g.addColorStop(1, '#9E161A');
  x.fillStyle = g; x.fillRect(0, 0, 256, 512);
  x.strokeStyle = '#E5A93C'; x.lineWidth = 12; x.strokeRect(12, 12, 232, 488); x.lineWidth = 3; x.strokeRect(30, 30, 196, 452);
  x.strokeStyle = '#087D91'; x.lineWidth = 5; x.strokeRect(42, 42, 172, 428);
  x.fillStyle = '#E5A93C';
  for (let i = 0; i < 13; i++) for (const cx of [21, 235]) {
    const cy = 40 + i * 36; x.beginPath(); x.moveTo(cx, cy - 7); x.lineTo(cx + 6, cy); x.lineTo(cx, cy + 7); x.lineTo(cx - 6, cy); x.fill();
  }
  x.strokeStyle = '#F2C46B'; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath();
  for (let i = 0; i <= 240; i++) {
    const s = (i / 240) * PI * 2, d = 1 + Math.sin(s) ** 2;
    const px = 128 + (92 * Math.cos(s)) / d, py = 256 + (56 * Math.sin(s) * Math.cos(s)) / d;
    if (i) x.lineTo(px, py); else x.moveTo(px, py);
  }
  x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

type Carpet = { group: THREE.Group; under: THREE.Sprite; wave: (x: number, z: number, t: number, a: number) => number; flutter: (t: number, a: number) => void };
function makeCarpet(w: number, l: number, tex: THREE.Texture, glow: THREE.Texture): Carpet {
  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(w, l, 16, 28); geo.rotateX(-PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute; const base = (pos.array as Float32Array).slice();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.82, side: THREE.DoubleSide }));
  mesh.castShadow = mesh.receiveShadow = true; group.add(mesh);
  const fringe: THREE.Mesh[] = [];
  const fg = new THREE.CylinderGeometry(0.013, 0.006, 0.14, 6), fm = new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.45, metalness: 0.3 });
  const n = Math.round(w / 0.14);
  for (const s of [-1, 1]) for (let i = 0; i < n; i++) {
    const f = new THREE.Mesh(fg, fm); f.rotation.x = PI / 2;
    f.userData = { x: -w / 2 + 0.07 + (i * (w - 0.14)) / (n - 1), z: s * (l / 2 + 0.06) }; group.add(f); fringe.push(f);
  }
  const under = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffd27a, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
  under.scale.set(w * 2.3, w * 2.3, 1); under.position.y = -0.3; group.add(under);
  const half = l / 2;
  const wave = (x: number, z: number, t: number, a: number) =>
    a * (0.05 * Math.sin((z / half) * 3.2 - t * 4.6) * (0.3 + 0.7 * Math.abs(z / half)) + 0.016 * Math.sin(x * 6 + t * 3.1));
  const flutter = (t: number, a: number) => {
    const p = pos.array as Float32Array;
    for (let i = 0; i < p.length; i += 3) p[i + 1] = base[i + 1] + wave(base[i], base[i + 2], t, a);
    pos.needsUpdate = true; geo.computeVertexNormals();
    fringe.forEach((f) => f.position.set(f.userData.x, wave(f.userData.x, f.userData.z * 0.97, t, a), f.userData.z));
  };
  return { group, under, wave, flutter };
}

type Arm = { sh: THREE.Group; el: THREE.Group; hd: THREE.Mesh; s: number; base: THREE.Vector3; spr: Spring3 };
type Person = {
  root: THREE.Group; pelvis: THREE.Group; head: THREE.Mesh; seed: number;
  legs: { hip: THREE.Group; knee: THREE.Group }[]; arms: Arm[];
  sp: { c: Spring; l: Spring; h: Spring[]; k: Spring[]; yaw: Spring };
};
let seedCount = 0;
/** A figure from the logo: glossy round head on a soft gown-shaped body, with jointed legs and arms. */
function makePerson(col: number, hcol: number): Person {
  const m = new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.45, clearcoat: 0.7, clearcoatRoughness: 0.3 });
  const hm = new THREE.MeshPhysicalMaterial({ color: hcol, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12 });
  const mesh = (g: THREE.BufferGeometry, mt: THREE.Material) => { const x = new THREE.Mesh(g, mt); x.castShadow = x.receiveShadow = true; return x; };
  const root = new THREE.Group();
  const legs = [-1, 1].map((s) => {
    const hip = new THREE.Group(); hip.position.set(0.085 * s, 0.53, 0);
    const th = mesh(new THREE.CapsuleGeometry(0.068, 0.13, 6, 16), m); th.position.y = -0.13;
    const knee = new THREE.Group(); knee.position.y = -0.26;
    const kn = mesh(new THREE.SphereGeometry(0.06, 20, 14), m);
    const sh = mesh(new THREE.CapsuleGeometry(0.056, 0.13, 6, 16), m); sh.position.y = -0.12;
    const ft = mesh(new THREE.SphereGeometry(0.07, 20, 14), m); ft.scale.set(1, 0.55, 1.55); ft.position.set(0, -0.235, 0.045);
    knee.add(kn, sh, ft); hip.add(th, knee); root.add(hip); return { hip, knee };
  });
  const pelvis = new THREE.Group(); pelvis.position.y = 0.55; root.add(pelvis);
  const prof = new THREE.SplineCurve([
    new THREE.Vector2(0.001, -0.4), new THREE.Vector2(0.25, -0.375), new THREE.Vector2(0.24, -0.22), new THREE.Vector2(0.205, 0),
    new THREE.Vector2(0.19, 0.2), new THREE.Vector2(0.18, 0.42), new THREE.Vector2(0.135, 0.6), new THREE.Vector2(0.06, 0.705), new THREE.Vector2(0.001, 0.72),
  ]).getPoints(56);
  pelvis.add(mesh(new THREE.LatheGeometry(prof, 56), m));
  const head = mesh(new THREE.SphereGeometry(0.2, 48, 32), hm); head.position.y = 0.92; pelvis.add(head);
  const arms = [-1, 1].map((s) => {
    const sh = new THREE.Group(); sh.position.set(0.165 * s, 0.55, 0);
    const up = mesh(new THREE.CapsuleGeometry(0.05, 0.14, 6, 16), m); up.position.y = -0.12;
    const el = new THREE.Group(); el.position.y = -0.24;
    const elb = mesh(new THREE.SphereGeometry(0.049, 20, 14), m);
    const fo = mesh(new THREE.CapsuleGeometry(0.045, 0.13, 6, 16), m); fo.position.y = -0.11;
    const hd = mesh(new THREE.SphereGeometry(0.062, 20, 14), hm); hd.scale.set(0.9, 1.1, 0.85); hd.position.y = -0.24;
    el.add(elb, fo, hd); sh.add(up, el); pelvis.add(sh);
    return { sh, el, hd, s, base: sh.position.clone(), spr: new Spring3(150, 0.6) };
  });
  return {
    root, pelvis, head, legs, arms, seed: seedCount++ * 1.7,
    sp: { c: new Spring(70, 0.8), l: new Spring(60, 0.65), h: [new Spring(120, 0.6), new Spring(120, 0.6)], k: [new Spring(120, 0.6), new Spring(120, 0.6)], yaw: new Spring(45, 0.75) },
  };
}

/** Two-bone arm: the hand reaches the target and the elbow bends back and out. */
function solveArm(A: Arm, tl: THREE.Vector3) {
  const a = 0.24, b = 0.24, S = A.base;
  const d = tl.clone().sub(S); let dist = d.length(); const dn = d.normalize();
  dist = clamp(dist, 0.06, a + b - 0.002);
  const cA = clamp((a * a + dist * dist - b * b) / (2 * a * dist), -1, 1), sA = Math.sqrt(1 - cA * cA);
  const pole = V(A.s * 0.5, -0.2, -1); const n = pole.sub(dn.clone().multiplyScalar(pole.dot(dn)));
  if (n.lengthSq() < 1e-6) n.set(0, 0, -1); n.normalize();
  const E = S.clone().addScaledVector(dn, a * cA).addScaledVector(n, a * sA);
  A.sh.quaternion.setFromUnitVectors(DOWN, E.clone().sub(S).normalize());
  const H = S.clone().addScaledVector(dn, dist);
  A.el.quaternion.setFromUnitVectors(DOWN, H.sub(E).normalize().applyQuaternion(A.sh.quaternion.clone().invert()));
}

type ArmGoal = { w: number; p?: THREE.Vector3; loc?: THREE.Vector3 };
type PoseIn = { crouch?: number; lean?: number; roll?: number; walk?: number; ph?: number; dangle?: number; arms?: ArmGoal[] };
function pose(P: Person, o: PoseIn, dt: number, t: number) {
  const c = P.sp.c.to(o.crouch || 0, dt), ln = P.sp.l.to((o.lean || 0) + 0.35 * c, dt);
  const w = o.walk || 0, ph = o.ph || 0, dg = o.dangle || 0;
  P.pelvis.position.y = 0.55 - 0.23 * c + Math.abs(Math.sin(ph)) * 0.025 * w;
  P.pelvis.rotation.set(ln + Math.sin(t * 1.3 + P.seed) * 0.012, 0, (o.roll || 0) + Math.sin(t * 0.9 + P.seed) * 0.02);
  P.pelvis.scale.set(1, 1 + Math.sin(t * 1.8 + P.seed) * 0.012, 1); // breathing
  P.head.position.set(Math.sin(t * 0.9 + P.seed + 0.6) * 0.012, 0.92, -ln * 0.06);
  P.legs.forEach((L, i) => {
    const q = ph + i * PI;
    L.hip.rotation.x = P.sp.h[i].to(Math.sin(q) * 0.42 * w + dg * (Math.sin(t * 5 + i * 2.1) * 0.32 - 0.2), dt);
    L.knee.rotation.x = P.sp.k[i].to(Math.max(0, Math.sin(q - 1.1)) * 0.7 * w + 1.5 * c + 0.5 * dg, dt);
  });
  P.root.updateMatrixWorld(true);
  P.arms.forEach((A, i) => {
    const rest = A.base.clone().add(V(A.s * 0.06 + Math.sin(t * 1.1 + i + P.seed) * 0.014, -0.46, 0.05));
    const g = o.arms?.[i]; let tl = rest;
    if (g && g.w > 0) { const tg = g.loc ? g.loc.clone() : P.pelvis.worldToLocal(g.p!.clone()); tl = rest.lerp(tg, g.w); }
    solveArm(A, A.spr.to(tl, dt));
  });
  P.root.updateMatrixWorld(true);
}
const handW = (P: Person, i: number) => P.arms[i].hd.getWorldPosition(V(0, 0, 0));
const shW = (P: Person, i: number) => P.arms[i].sh.getWorldPosition(V(0, 0, 0));

/** Bernoulli's lemniscate: the infinity sign. u = 0.25 is its crossing point. */
class Lemniscate extends THREE.Curve<THREE.Vector3> {
  constructor() { super(); }
  getPoint(u: number, tg = new THREE.Vector3()) {
    const s = u * PI * 2, d = 1 + Math.sin(s) ** 2;
    return tg.set((3 * Math.cos(s)) / d, (3 * Math.sin(s) * Math.cos(s)) / d, 0);
  }
}

export type CarpetScene = { setTheme: (dark: boolean) => void; dispose: () => void };
type Opts = { section: HTMLElement; stage: HTMLElement; canvas: HTMLCanvasElement; dark: boolean; still: boolean; onFrame: (p: number) => void };

export function mountCarpetScene({ section, stage, canvas, dark, still, onFrame }: Opts): CarpetScene | null {
  let R: THREE.WebGLRenderer;
  try { R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { return null; }
  const phone = Math.min(innerWidth, innerHeight) < 600;
  R.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.5 : 2));
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap;

  const S = new THREE.Scene(); S.fog = new THREE.Fog(0xffffff, 15, 50);
  const fog = S.fog as THREE.Fog;
  const cam = new THREE.PerspectiveCamera(40, 1, 0.05, 140);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1); S.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1); key.position.set(3, 7, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 22 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4; S.add(key);
  const rim = new THREE.DirectionalLight(0x9fe3ef, 1); rim.position.set(-4, 3, -5); S.add(rim);
  const lamp = new THREE.PointLight(0xffc56b, 0, 7, 2); lamp.position.set(0.9, 1.9, 1.9); S.add(lamp);

  const glowTex = radialTexture('rgba(255,230,170,1)', 'rgba(255,230,170,0)');
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.18 }));
  ground.rotation.x = -PI / 2; ground.receiveShadow = true; S.add(ground);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.8, 48), new THREE.MeshBasicMaterial({ map: radialTexture('rgba(229,169,60,.42)', 'rgba(229,169,60,0)'), transparent: true, depthWrite: false }));
  pool.rotation.x = -PI / 2; pool.position.set(0.5, 0.003, 0.75); S.add(pool);

  const carpet = makeCarpet(1.2, 2.0, carpetTexture(), glowTex); S.add(carpet.group);
  const teacher = makePerson(TEAL, TEAL_HEAD); teacher.root.scale.setScalar(0.85); carpet.group.add(teacher.root);
  const child = makePerson(COPPER, COPPER_HEAD); child.root.scale.setScalar(0.62); S.add(child.root);

  const lem = new Lemniscate(), inf = new THREE.Group();
  inf.position.set(0, 2.8, -3); inf.rotation.x = -PI / 2 + 0.45; S.add(inf); inf.updateMatrixWorld(true);
  const tubeG = new THREE.TubeGeometry(lem, 420, 0.06, 12, true), haloG = new THREE.TubeGeometry(lem, 420, 0.2, 10, true);
  const tubeM = new THREE.MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.3 });
  inf.add(new THREE.Mesh(tubeG, tubeM), new THREE.Mesh(haloG, new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })));
  const tN = tubeG.index!.count, hN = haloG.index!.count;
  const drawInf = (k: number) => { tubeG.setDrawRange(0, Math.floor((tN * k) / 6) * 6); haloG.setDrawRange(0, Math.floor((hN * k) / 6) * 6); };
  const lemW = (u: number) => inf.localToWorld(lem.getPoint(((u % 1) + 1) % 1));

  // Sparkle trail behind the carpet, and slow gold dust in the air.
  const TN = 170, tp = new Float32Array(TN * 3).fill(-999), tc = new Float32Array(TN * 3), trailG = new THREE.BufferGeometry();
  trailG.setAttribute('position', new THREE.BufferAttribute(tp, 3)); trailG.setAttribute('color', new THREE.BufferAttribute(tc, 3));
  const trailM = new THREE.PointsMaterial({ size: 0.1, map: glowTex, vertexColors: true, transparent: true, depthWrite: false });
  const trailPts = new THREE.Points(trailG, trailM); trailPts.frustumCulled = false; S.add(trailPts);
  const hist: THREE.Vector3[] = [], goldC = new THREE.Color(GOLD), tmpC = new THREE.Color();
  const DN = 260, dp = new Float32Array(DN * 3);
  for (let i = 0; i < DN; i++) { dp[i * 3] = (Math.random() - 0.5) * 18; dp[i * 3 + 1] = Math.random() * 8; dp[i * 3 + 2] = -14 + Math.random() * 18; }
  const dbase = dp.slice(), dustG = new THREE.BufferGeometry(); dustG.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dustM = new THREE.PointsMaterial({ size: 0.05, map: glowTex, color: GOLD, transparent: true, depthWrite: false }); S.add(new THREE.Points(dustG, dustM));
  const clasp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffe3a0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); S.add(clasp);

  let isDark = dark, glowK = 1, tubeK = 0.5;
  // Light intensities are written as the legacy values times PI (three.js now uses physical light units).
  function setTheme(d: boolean) {
    isDark = d;
    fog.color.set(d ? '#1E150E' : '#FAF7F2');
    hemi.color.set(d ? 0x8ea4c2 : 0xfffaf2); hemi.groundColor.set(d ? 0x3a2416 : 0xd8c6ae); hemi.intensity = (d ? 0.42 : 0.5) * PI;
    key.color.set(d ? 0xcad8ff : 0xfff1dd); key.intensity = (d ? 0.5 : 0.72) * PI; rim.intensity = (d ? 0.55 : 0.28) * PI;
    lamp.intensity = d ? 1.4 * PI : 0;
    pool.material.opacity = d ? 1 : 0.45; (ground.material as THREE.ShadowMaterial).opacity = d ? 0.34 : 0.16;
    dustM.blending = d ? THREE.AdditiveBlending : THREE.NormalBlending; dustM.opacity = d ? 0.85 : 0.35; dustM.needsUpdate = true;
    trailM.blending = d ? THREE.AdditiveBlending : THREE.NormalBlending; trailM.opacity = d ? 1 : 0.9; trailM.needsUpdate = true;
    glowK = d ? 1 : 0.55; tubeK = d ? 0.7 : 0.35; carpet.under.material.opacity = d ? 0.55 : 0.22;
  }
  setTheme(dark);

  // Paths
  const dummy = new THREE.Object3D();
  const along = (pos: THREE.Vector3, dir: THREE.Vector3, bank: number) => {
    dummy.position.copy(pos); dummy.quaternion.identity(); dummy.lookAt(pos.clone().add(dir)); dummy.rotateZ(bank); return dummy.quaternion.clone();
  };
  const faceCam = (pos: THREE.Vector3) => { dummy.position.copy(pos); dummy.quaternion.identity(); dummy.lookAt(V(cam.position.x, pos.y, cam.position.z)); return dummy.quaternion.clone(); };
  const lemPose = (u: number) => {
    const pos = lemW(u), d1 = lemW(u + 0.004).sub(pos), d2 = lemW(u + 0.02).sub(lemW(u + 0.016));
    const bank = clamp(-d1.clone().normalize().cross(d2.normalize()).y * 9, -0.55, 0.55);
    return { pos, q: along(pos, d1, bank) };
  };
  const H = V(-0.25, 0.55, 0.75), H1 = V(-0.25, 1.25, 0.75), S0 = V(0.8, 0, 0.85);
  const inCurve = new THREE.CubicBezierCurve3(V(-14, 6, -30), V(-9, 4.5, -12), V(3.5, 1.8, -2.5), H.clone());
  const E = lemW(0), Et = lemW(0.003).sub(E).normalize();
  const outCurve = new THREE.CubicBezierCurve3(H1, V(-0.25, 2.2, -1.2), E.clone().addScaledVector(Et, -2.2), E.clone());
  const KEYS: [number, THREE.Vector3, THREE.Vector3][] = [
    [0, V(0.2, 1.35, 6), V(0.05, 1, 0)], [0.3, V(0.3, 1.3, 5.6), V(0.2, 0.8, 0.4)], [0.6, V(0.2, 1.5, 5.4), V(0.1, 0.9, 0.5)],
    [0.7, V(0, 3, 7), V(0.4, 1.8, -1)], [0.8, V(0, 6.6, 8.6), V(0, 2.5, -2.6)], [1, V(0, 5, 6), V(0, 2.7, -2.9)],
  ];
  function camAt(p: number) {
    let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
    const [a, pa, la] = KEYS[i], [b, pb, lb] = KEYS[i + 1], k = ease(seg(p, a, b));
    cam.position.lerpVectors(pa, pb, k); const l = la.clone().lerp(lb, k);
    // Phones: step back, and further once the whole infinity must fit the narrow screen.
    if (cam.aspect < 0.8) cam.position.add(cam.position.clone().sub(l).multiplyScalar(0.28 + 0.32 * seg(p, 0.7, 0.8)));
    cam.lookAt(l);
  }

  function frame(p: number, t: number, dt: number) {
    // Carpet: flies in, hovers by the child, rises, then flies one loop of the infinity and stops in its centre.
    let pA: THREE.Vector3, qA: THREE.Quaternion, amp = 1;
    if (p < 0.34) {
      const u = ease(seg(p, 0.04, 0.34)); pA = inCurve.getPoint(u);
      qA = along(pA, inCurve.getTangent(Math.min(u, 0.999)), -0.3 * Math.sin(u * PI)); qA.slerp(QID, ease(seg(p, 0.26, 0.34)));
    } else if (p < 0.68) {
      pA = H.clone().lerp(H1, ease(seg(p, 0.6, 0.68))); pA.y += Math.sin(t * 2) * 0.035; amp = 0.6;
      qA = QID.clone().slerp(along(pA, V(0, 0.4, -1), 0), ease(seg(p, 0.63, 0.68)));
    } else if (p < 0.75) {
      const u = ease(seg(p, 0.68, 0.75)); pA = outCurve.getPoint(u); qA = along(pA, outCurve.getTangent(Math.min(u, 0.999)), 0);
    } else {
      const L = lemPose(1.25 * ease(seg(p, 0.75, 0.94))); pA = L.pos; qA = L.q;
      qA.slerp(faceCam(pA), ease(seg(p, 0.94, 1))); pA.y += Math.sin(t * 2) * 0.04 * seg(p, 0.94, 1);
    }
    key.castShadow = p < 0.68;
    carpet.group.position.copy(pA); carpet.group.quaternion.copy(qA); carpet.flutter(t, amp); carpet.group.updateMatrixWorld(true);

    // Teacher: rides in waving, walks to the edge, kneels, reaches, lifts, then holds the child's hand.
    const walk1 = seg(p, 0.34, 0.4), walk2 = seg(p, 0.52, 0.6);
    const tx = lerp(lerp(-0.15, 0.3, ease(walk1)), -0.15, ease(walk2));
    const crouch = Math.min(ease(seg(p, 0.39, 0.45)), 1 - ease(seg(p, 0.52, 0.58)));
    const lift = ease(seg(p, 0.5, 0.6));
    teacher.root.position.set(tx, 0.015 + carpet.wave(tx, 0, t, amp), 0);
    teacher.root.rotation.set(0, teacher.sp.yaw.to((PI / 2) * (ease(seg(p, 0.36, 0.41)) - ease(seg(p, 0.56, 0.62))), dt), 0);
    const hold = ease(seg(p, 0.6, 0.66));
    const M = shW(teacher, 1).lerp(shW(child, 0), 0.5).add(V(0, -0.24, 0));
    let tR: ArmGoal = { w: 0 };
    if (p < 0.5) tR = { w: ease(seg(p, 0.42, 0.48)), p: handW(child, 0) };
    else if (p < 0.6) tR = { w: 1, p: child.root.position.clone().add(V(0, 0.62 * 1.45, 0)) };
    else tR = { w: hold, p: M };
    const wv = bump(p, 0.22, 0.37);
    pose(teacher, { crouch, walk: bump(p, 0.34, 0.4) + bump(p, 0.52, 0.6), ph: p * 140, arms: [{ w: wv, loc: V(-0.32, 1.02 + Math.sin(t * 8) * 0.05, 0.12) }, tR] }, dt, t);

    // Child: alone, looks up, hesitates, reaches, is lifted, then stands on the carpet holding the teacher's hand.
    const hes = bump(p, 0.34, 0.44), look = bump(p, 0.1, 0.36);
    const slot = carpet.group.localToWorld(V(0.42, 0.015 + carpet.wave(0.42, 0, t, amp), 0));
    child.root.position.lerpVectors(S0.clone().add(V(0.16 * hes, 0, 0)), slot, lift);
    child.root.position.y += Math.sin(PI * lift) * 0.55;
    dummy.quaternion.setFromEuler(new THREE.Euler(0, child.sp.yaw.to(-1.0 * ease(seg(p, 0.4, 0.46)), dt), 0));
    child.root.quaternion.copy(dummy.quaternion).slerp(carpet.group.quaternion, lift);
    const cL: ArmGoal = p < 0.6 ? { w: ease(seg(p, 0.43, 0.49)), p: handW(teacher, 1) } : { w: hold, p: M };
    pose(child, { lean: -0.14 * look + 0.12 * hes, roll: -0.12 * hes * (1 - lift), walk: hes, ph: p * 160, dangle: Math.sin(PI * lift), arms: [cL, { w: 0 }] }, dt, t);

    // A warm glow where the hands meet.
    clasp.position.copy(handW(teacher, 1));
    const g = p < 0.62 ? ease(seg(p, 0.46, 0.5)) : hold * 0.55;
    clasp.material.opacity = g * glowK * (0.85 + 0.15 * Math.sin(t * 6)); clasp.scale.setScalar(0.45 + 0.35 * g);

    drawInf(ease(seg(p, 0.64, 0.78)));
    tubeM.emissiveIntensity = tubeK * (1 + 0.8 * seg(p, 0.93, 1) * (0.7 + 0.3 * Math.sin(t * 3)));
    if (p > 0.68 && p < 0.99) { hist.unshift(pA.clone().add(V((Math.random() - 0.5) * 0.5, -0.12, (Math.random() - 0.5) * 0.5))); if (hist.length > TN) hist.length = TN; }
    else if (p <= 0.68) hist.length = 0;
    for (let i = 0; i < TN; i++) {
      const v = hist[i], f = v ? 1 - i / TN : 0;
      if (v) { tp[i * 3] = v.x; tp[i * 3 + 1] = v.y; tp[i * 3 + 2] = v.z; } else tp[i * 3 + 1] = -999;
      if (isDark) tmpC.copy(goldC).multiplyScalar(f); else tmpC.copy(fog.color).lerp(goldC, f);
      tc[i * 3] = tmpC.r; tc[i * 3 + 1] = tmpC.g; tc[i * 3 + 2] = tmpC.b;
    }
    trailG.attributes.position.needsUpdate = trailG.attributes.color.needsUpdate = true;
    for (let i = 0; i < DN; i++) dp[i * 3 + 1] = dbase[i * 3 + 1] + Math.sin(t * 0.6 + i) * 0.25;
    dustG.attributes.position.needsUpdate = true;

    camAt(p);
    onFrame(p);
  }

  const progress = () => { const r = section.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };
  const size = () => {
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    R.setSize(w, h, false); cam.aspect = w / h; cam.fov = cam.aspect < 0.8 ? 56 : 40; cam.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(size); ro.observe(stage); size();

  let pS = still ? 1 : progress(), clock = 0, last = performance.now(), visible = false, raf = 0;
  for (let i = 0; i < 150; i++) { clock += 1 / 60; frame(pS, clock, 1 / 60); } // settle springs before the first paint
  R.render(S, cam);
  const loop = (now: number) => {
    raf = 0; if (!visible) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
    pS += (progress() - pS) * (1 - Math.exp(-dt * 6));
    frame(pS, clock, dt); R.render(S, cam); raf = requestAnimationFrame(loop);
  };
  // With reduced motion the scene is one still frame of the ending; otherwise it runs only while on screen.
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting && !still;
    if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
  });
  io.observe(section);

  return {
    setTheme: (d) => { setTheme(d); if (!visible) { frame(pS, clock, 1 / 60); R.render(S, cam); } },
    dispose: () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      S.traverse((o) => {
        const m = o as THREE.Mesh; m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((mt) => { (mt as THREE.MeshStandardMaterial).map?.dispose(); mt.dispose(); });
      });
      R.dispose(); R.forceContextLoss();
    },
  };
}
