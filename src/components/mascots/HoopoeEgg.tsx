import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending, BackSide, CanvasTexture, FrontSide, Group, LatheGeometry, Mesh, MeshBasicMaterial, SRGBColorSpace, Vector2, Vector3,
} from 'three';
import { GOLD, GOLD_LIGHT, Gold, backOut, canvas, ease, pulse, type Burst, type PoolApi } from './Zad3D';

/**
 * The hoopoe's first stage (owner, 2026-11-15; art: the egg in docs/design/companions/hoopoe-growth.png): a sand egg
 * dressed in rows of crimson, teal and cream feather scales, on a crimson velvet cushion with a gold cord. It rocks now
 * and then, cracks as the child earns the points to hatch it, and on hatching the top flies off in a burst of light.
 */

const EGG_H = 0.66;
const SPLIT = 0.56; // where the shell breaks, as a share of the height from the bottom
const TW = 1024, TH = 512;
// the break line around the egg: a zigzag in texture space (x across the width, y down from the top)
const zig = (x: number) => (1 - SPLIT) * TH + (Math.abs(((x / TW) * 14) % 2 - 1) - 0.5) * 34;

function eggGeometry() {
  const pts: Vector2[] = [];
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI; // bottom to top
    const y = (1 - Math.cos(a)) / 2;
    // narrower towards the top, like a real egg
    const r = Math.sin(a) * 0.235 * (1 - 0.18 * y);
    pts.push(new Vector2(Math.max(r, 0.0001), y * EGG_H));
  }
  return new LatheGeometry(pts, 96);
}

/** Rows of rounded feather scales in bands of brand colours, on sand. */
function shellTexture() {
  const [c, g] = canvas(TW, TH);
  g.fillStyle = '#F1DDBC';
  g.fillRect(0, 0, TW, TH);
  // bands from the top of the egg down: [row count, fill, edge]
  const bands: [number, string, string][] = [
    [2, '#D9874C', '#A35A2C'], [2, '#C51F24', '#7E1216'], [1, '#F7E4C4', '#C9A57A'], [2, '#0E6E7E', '#07434D'],
    [1, '#F7E4C4', '#C9A57A'], [2, '#C51F24', '#7E1216'], [2, '#E8B36A', '#B07A35'], [2, '#0E6E7E', '#07434D'], [3, '#D9874C', '#A35A2C'],
  ];
  const rows = bands.reduce((s, [k]) => s + k, 0);
  const rh = TH / rows, sw = TW / 14;
  let row = 0;
  for (const [k, fill, edge] of bands) {
    for (let j = 0; j < k; j++, row++) {
      const y = row * rh;
      for (let x = (row % 2 ? sw / 2 : 0) - sw; x < TW + sw; x += sw) {
        const grad = g.createLinearGradient(0, y, 0, y + rh * 1.35);
        grad.addColorStop(0, fill); grad.addColorStop(1, edge);
        g.fillStyle = grad;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + sw, y);
        g.quadraticCurveTo(x + sw, y + rh * 1.4, x + sw / 2, y + rh * 1.45);
        g.quadraticCurveTo(x, y + rh * 1.4, x, y);
        g.fill();
        g.strokeStyle = 'rgba(40,16,10,0.35)'; g.lineWidth = 2; g.stroke();
        // a soft highlight on each scale
        g.fillStyle = 'rgba(255,244,226,0.22)';
        g.beginPath(); g.ellipse(x + sw * 0.38, y + rh * 0.45, sw * 0.16, rh * 0.28, -0.3, 0, Math.PI * 2); g.fill();
      }
    }
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** White where a shell piece exists, black where it does not (alpha maps read the green channel). */
function pieceMask(top: boolean) {
  const [c, g] = canvas(TW, TH);
  g.fillStyle = '#000'; g.fillRect(0, 0, TW, TH);
  g.fillStyle = '#FFF';
  g.beginPath();
  g.moveTo(0, top ? 0 : TH);
  for (let x = 0; x <= TW; x += 8) g.lineTo(x, zig(x));
  g.lineTo(TW, top ? 0 : TH);
  g.closePath(); g.fill();
  return new CanvasTexture(c);
}

/** The cracks, drawn from one side around the egg; `amount` 0..1. White lines, tinted by the material. */
function crackTexture() {
  const [c, g] = canvas(TW, TH);
  const tex = new CanvasTexture(c);
  let drawn = -1;
  const draw = (amount: number) => {
    const k = Math.round(amount * 20) / 20;
    if (k === drawn) return;
    drawn = k;
    g.clearRect(0, 0, TW, TH);
    if (k <= 0) { tex.needsUpdate = true; return; }
    g.strokeStyle = '#FFF'; g.lineCap = 'round'; g.lineJoin = 'round';
    // starts at the front of the egg (u = 0 faces the camera) and runs both ways round
    const front = 0, half = (TW / 2) * k;
    g.lineWidth = 16;
    g.beginPath();
    for (let x = front - half; x <= front + half; x += 6) {
      const xx = ((x % TW) + TW) % TW;
      if (x === front - half || xx < 6) g.moveTo(xx, zig(xx)); else g.lineTo(xx, zig(xx));
    }
    g.stroke();
    // little branches off the main crack
    g.lineWidth = 9;
    for (let i = 0; i < Math.floor(k * 6); i++) {
      const x = (front + (i % 2 ? 1 : -1) * (30 + i * 52) + TW) % TW;
      const y = zig(x);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 18, y - 40 - i * 4); g.lineTo(x + 4, y - 66); g.stroke();
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - 16, y + 34); g.stroke();
    }
    tex.needsUpdate = true;
  };
  return { tex, draw };
}

export function HoopoeEgg({ crack, egg, hatchAt, still, tapAt, fx }: {
  /** How far it has cracked, 0..1. */
  crack: number;
  /** Still an egg (not hatched yet). */
  egg: boolean;
  /** Clock time the hatch started; 0 when not hatching. */
  hatchAt: number;
  still: boolean;
  tapAt: React.MutableRefObject<number>;
  fx: { confetti: React.RefObject<PoolApi | null>; stars: React.RefObject<PoolApi | null>; sparks: React.RefObject<{ burst: Burst } | null> };
}) {
  const group = useRef<Group>(null);
  const shell = useRef<Group>(null);
  const top = useRef<Group>(null);
  const bottom = useRef<Group>(null);
  const crackDark = useRef<Mesh>(null);
  const crackGlow = useRef<Mesh>(null);
  const flash = useRef<Mesh>(null);
  const burst = useRef(0);

  const parts = useMemo(() => {
    const geo = eggGeometry();
    const map = shellTexture();
    const masks = { top: pieceMask(true), bottom: pieceMask(false) };
    const cracks = crackTexture();
    return { geo, map, masks, cracks };
  }, []);
  const glowTex = useMemo(() => {
    const [c, g] = canvas(128);
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,240,200,1)'); grad.addColorStop(0.4, 'rgba(246,194,90,0.6)'); grad.addColorStop(1, 'rgba(246,194,90,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    return new CanvasTexture(c);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const gr = group.current, sh = shell.current, tp = top.current, bt = bottom.current;
    if (!gr || !sh || !tp || !bt) return;
    const hu = hatchAt ? t - hatchAt : -1;
    gr.visible = egg || (hu >= 0 && hu < 2.6);
    if (!gr.visible) return;

    // rocking: a gentle sway, a wobble every few seconds (more often once it is cracking), a wobble when tapped
    let rz = still ? 0 : Math.sin(t * 1.3) * 0.03;
    if (!still) {
      const every = crack > 0.5 ? 2.2 : 3.6;
      rz += pulse(t % every, 0, 0.8) * Math.sin((t % every) * 22) * (0.08 + crack * 0.08);
      const tu = t - tapAt.current;
      if (tu < 0.9) rz += Math.sin(tu * 26) * 0.16 * (1 - tu / 0.9);
    }
    // light leaks through the cracks now and then once it is close to hatching
    let shake = 0, glow = crack > 0.6 && !still ? pulse(t % 2.2, 0, 0.8) * 0.55 : 0;
    let topY = 0, topR = 0, topO = 1, botO = 1, flashO = 0, sy = 1;
    if (hu >= 0) {
      shake = hu < 0.9 ? ease(hu / 0.9) : 0;
      rz = Math.sin(hu * 48) * 0.12 * shake;
      sy = 1 - pulse(hu, 0.6, 0.9) * 0.1;
      glow = Math.max(glow, shake * 1.2);
      const k = Math.max(0, hu - 0.9);
      topY = k * 1.6 - k * k * 0.9; topR = k * 4; topO = 1 - ease((hu - 1.5) / 0.4);
      botO = 1 - ease((hu - 1.9) / 0.5);
      flashO = pulse(hu, 0.82, 1.6);
      if (hu > 0.9 && burst.current !== hatchAt) {
        burst.current = hatchAt;
        const party = { speed: 2.6, up: 1.3, gravity: 2.2, flip: true, size: [0.09, 0.14] as [number, number], life: [1.6, 2.3] as [number, number], colors: ['#C51F24', GOLD, '#FFF4E2', '#0E6E7E', '#E5AC48'] };
        fx.confetti.current?.burst(new Vector3(0, 0.6, 0.2), { n: 70, ...party });
        fx.stars.current?.burst(new Vector3(0, 0.55, 0.2), { n: 24, speed: 1.6, up: 0.6, gravity: 0.8, colors: [GOLD_LIGHT, GOLD, '#FFFFFF'], size: [0.05, 0.1], life: [0.9, 1.4] });
        fx.sparks.current?.burst(new Vector3(0, 0.5, 0.2), 40, 2.6, GOLD_LIGHT, 0.4);
      }
    }
    sh.rotation.z = rz;
    sh.scale.set(1 + (1 - sy) * 0.6, sy, 1 + (1 - sy) * 0.6);
    tp.position.set(topY * 0.25, SPLIT * EGG_H + topY, topY * 0.2);
    tp.rotation.set(topR * 0.4, 0, topR * 0.25);
    for (const [g, o] of [[tp, topO], [bt, botO]] as const) {
      g.visible = o > 0.01;
      g.traverse((m) => { const mat = (m as Mesh).material as MeshBasicMaterial | undefined; if (mat && 'opacity' in mat) { mat.transparent = o < 1; mat.opacity = o; } });
    }
    parts.cracks.draw(hu >= 0 ? 1 : crack);
    if (crackDark.current) (crackDark.current.material as MeshBasicMaterial).opacity = hu >= 0 && hu > 0.9 ? 0 : 0.85;
    if (crackGlow.current) (crackGlow.current.material as MeshBasicMaterial).opacity = hu > 0.9 ? 0 : glow;
    if (flash.current) {
      (flash.current.material as MeshBasicMaterial).opacity = flashO;
      flash.current.scale.setScalar(0.6 + backOut(Math.min(1, Math.max(0, hu - 0.82) / 0.5)) * 1.6);
    }
  });

  const piece = (which: 'top' | 'bottom') => (
    <>
      <mesh geometry={parts.geo} castShadow>
        <meshPhysicalMaterial map={parts.map} alphaMap={parts.masks[which]} alphaTest={0.5} side={FrontSide} roughness={0.42} clearcoat={0.6} clearcoatRoughness={0.25} sheen={0.4} sheenColor="#FFE6C8" />
      </mesh>
      {/* the inside of the shell */}
      <mesh geometry={parts.geo}>
        <meshStandardMaterial color="#FFF4E2" alphaMap={parts.masks[which]} alphaTest={0.5} side={BackSide} roughness={0.8} />
      </mesh>
    </>
  );

  return (
    <group ref={group}>
      {/* the velvet cushion with a gold cord */}
      <mesh position={[0, 0.065, 0]} scale={[1, 0.55, 1]} castShadow receiveShadow>
        <torusGeometry args={[0.27, 0.12, 32, 72]} />
        <meshPhysicalMaterial color="#7A1216" roughness={1} sheen={1} sheenColor="#E0574F" sheenRoughness={0.8} />
      </mesh>
      <mesh position={[0, 0.09, 0]} receiveShadow>
        <cylinderGeometry args={[0.28, 0.3, 0.05, 48]} />
        <meshPhysicalMaterial color="#6C0F13" roughness={1} sheen={1} sheenColor="#D84A43" sheenRoughness={0.8} />
      </mesh>
      {/* gold tufts round the cushion */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[Math.sin((i / 8) * Math.PI * 2) * 0.27, 0.125, Math.cos((i / 8) * Math.PI * 2) * 0.27]}>
          <sphereGeometry args={[0.014, 12, 8]} />
          <Gold rough={0.25} />
        </mesh>
      ))}
      <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.395, 0.012, 10, 96]} />
        <Gold rough={0.2} />
      </mesh>

      <group ref={shell} position={[0, 0.09, 0]}>
        <group ref={bottom}>{piece('bottom')}</group>
        {/* the top piece pivots on the break line */}
        <group ref={top} position={[0, SPLIT * EGG_H, 0]}>
          <group position={[0, -SPLIT * EGG_H, 0]}>{piece('top')}</group>
        </group>
        <mesh ref={crackDark} geometry={parts.geo} scale={1.004} renderOrder={2}>
          <meshBasicMaterial color="#3A1A10" alphaMap={parts.cracks.tex} transparent opacity={0.85} depthWrite={false} />
        </mesh>
        <mesh ref={crackGlow} geometry={parts.geo} scale={1.008} renderOrder={3}>
          <meshBasicMaterial color={GOLD_LIGHT} alphaMap={parts.cracks.tex} transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      <mesh ref={flash} position={[0, 0.5, 0.25]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={glowTex} transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
