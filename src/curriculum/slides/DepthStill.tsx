import React, { useEffect, useRef } from 'react';

/**
 * A still that moves in real depth (2.5D), for the Adults documentary look (owner, 2026-10-23). The photo and its depth
 * map (white = near) are drawn by one small WebGL shader:
 *  - parallax: the camera slides and near things move more than far ones;
 *  - dolly: pushing in enlarges the near plane faster than the far one;
 *  - rack focus: what is not at the focus depth softens, so the eye goes where the line of the slide points;
 *  - haze grows with distance, and light rays stream from the light source in the photo.
 * The target shot changes per build step; the camera eases to it on a critically damped spring (it can be interrupted
 * mid-move) and keeps a slow breathing drift. Three.js is loaded only when a depth still mounts. If WebGL or an image
 * fails, `onFail` lets the caller show its fallback. Reduced motion: one still frame, no drift.
 */

export type Shot = {
  /** Point the camera looks at, in % of the photo. */
  x: number; y: number;
  /** Zoom (1 = the whole photo). */
  z: number;
  /** Depth in focus, 0 (far) … 1 (near). */
  focus: number;
  /** Sideways camera offset for parallax, about -1 … 1. */
  pan?: number;
};

export type Light = { x: number; y: number; strength: number };

const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uImg;
uniform sampler2D uDepth;
uniform float uBoxAspect;
uniform float uImgAspect;
uniform vec2 uCenter;
uniform float uZoom;
uniform vec2 uCam;
uniform float uFocus;
uniform float uBlur;
uniform vec3 uLight;
uniform vec3 uHaze;
uniform float uHazeAmt;
uniform vec3 uGrade;

vec2 cover(vec2 uv) {
  vec2 s = uBoxAspect > uImgAspect ? vec2(1.0, uImgAspect / uBoxAspect) : vec2(uBoxAspect / uImgAspect, 1.0);
  return (uv - 0.5) * s + 0.5;
}

float depthAt(vec2 uv) { return texture2D(uDepth, clamp(uv, 0.001, 0.999)).r; }

void main() {
  vec2 base = cover(vUv);
  // Camera framing: zoom around the subject, keep the frame inside the photo.
  float z = max(uZoom, 1.0);
  vec2 c = clamp(uCenter, vec2(0.5 / z), vec2(1.0 - 0.5 / z));
  vec2 uv0 = c + (base - 0.5) / z;
  // Parallax with dolly: a few fixed-point steps find the depth of the surface this pixel really sees.
  vec2 uv = uv0;
  float d = depthAt(uv);
  for (int i = 0; i < 4; i++) {
    float k = d - 0.5;
    uv = uv0 + uCam * k + (uv0 - c) * k * 0.035 * (z - 1.0);
    d = depthAt(uv);
  }
  uv = clamp(uv, 0.001, 0.999);
  // Rack focus: a small disc blur whose size grows with distance from the focus depth.
  float coc = clamp(abs(d - uFocus) * uBlur, 0.0, 1.0) * 0.0045;
  vec3 col = texture2D(uImg, uv).rgb * 0.2;
  col += texture2D(uImg, uv + vec2( coc, 0.0)).rgb * 0.1;
  col += texture2D(uImg, uv + vec2(-coc, 0.0)).rgb * 0.1;
  col += texture2D(uImg, uv + vec2(0.0,  coc)).rgb * 0.1;
  col += texture2D(uImg, uv + vec2(0.0, -coc)).rgb * 0.1;
  col += texture2D(uImg, uv + vec2( coc,  coc) * 0.7).rgb * 0.1;
  col += texture2D(uImg, uv + vec2(-coc,  coc) * 0.7).rgb * 0.1;
  col += texture2D(uImg, uv + vec2( coc, -coc) * 0.7).rgb * 0.1;
  col += texture2D(uImg, uv + vec2(-coc, -coc) * 0.7).rgb * 0.1;
  // Atmosphere: far things sit in a little haze of the scene's own light.
  col = mix(col, uHaze, (1.0 - d) * uHazeAmt);
  // Light rays: march from this pixel towards the light and gather what is bright on the way.
  if (uLight.z > 0.0) {
    vec2 step = (uLight.xy - uv) / 22.0;
    vec2 p = uv;
    float decay = 1.0, sum = 0.0;
    for (int i = 0; i < 22; i++) {
      p += step;
      vec3 s = texture2D(uImg, clamp(p, 0.001, 0.999)).rgb;
      float b = max(0.0, dot(s, vec3(0.299, 0.587, 0.114)) - 0.62);
      sum += b * decay;
      decay *= 0.94;
    }
    col += vec3(1.0, 0.86, 0.62) * sum * uLight.z * 0.11;
  }
  col *= uGrade;
  // Exposure: AI stills come out a little dark; lift the mids without washing out the blacks.
  col = pow(col * 1.08, vec3(0.86));
  gl_FragColor = vec4(col, 1.0);
}
`;

/** Critically damped spring step (Apple's default feel: no overshoot), framerate independent. */
function spring(cur: number, vel: number, target: number, dt: number, response = 1.6) {
  const w = (2 * Math.PI) / response;
  const x = cur - target;
  const e = Math.exp(-w * dt);
  const nx = (x + (vel + w * x) * dt) * e;
  const nv = (vel - (vel + w * x) * w * dt) * e;
  return [target + nx, nv] as const;
}

export function DepthStill({ img, depth, shot, light, grade = 'then', still = false, onFail, className = 'absolute inset-0' }: {
  img: string; depth: string; shot: Shot; light?: Light; grade?: 'then' | 'now'; still?: boolean; onFail?: () => void; className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const target = useRef(shot);
  target.current = shot;
  const lightRef = useRef(light);
  lightRef.current = light;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let disposed = false;
    let raf = 0;
    let cleanup = () => {};
    (async () => {
      const THREE = await import('three');
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
      } catch {
        onFail?.();
        return;
      }
      const canvas = renderer.domElement;
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      el.appendChild(canvas);
      const loader = new THREE.TextureLoader();
      const load = (url: string) => new Promise<InstanceType<typeof THREE.Texture>>((ok, bad) => loader.load(url, ok, undefined, bad));
      let tImg: InstanceType<typeof THREE.Texture>, tDepth: InstanceType<typeof THREE.Texture>;
      try {
        [tImg, tDepth] = await Promise.all([load(img), load(depth)]);
      } catch {
        renderer.dispose();
        canvas.remove();
        onFail?.();
        return;
      }
      if (disposed) { tImg.dispose(); tDepth.dispose(); renderer.dispose(); canvas.remove(); return; }
      tImg.colorSpace = THREE.SRGBColorSpace;
      for (const t of [tImg, tDepth]) { t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; }
      const imgAspect = (tImg.image as HTMLImageElement).width / (tImg.image as HTMLImageElement).height;
      const s0 = target.current;
      const uniforms = {
        uImg: { value: tImg }, uDepth: { value: tDepth },
        uBoxAspect: { value: 4 / 3 }, uImgAspect: { value: imgAspect },
        uCenter: { value: new THREE.Vector2(s0.x / 100, 1 - s0.y / 100) }, uZoom: { value: s0.z * 1.05 },
        uCam: { value: new THREE.Vector2(0, 0) }, uFocus: { value: s0.focus }, uBlur: { value: 1.6 },
        uLight: { value: new THREE.Vector3(0, 0, 0) },
        uHaze: { value: grade === 'then' ? new THREE.Vector3(0.55, 0.42, 0.3) : new THREE.Vector3(0.2, 0.3, 0.36) },
        uHazeAmt: { value: 0.12 },
        uGrade: { value: grade === 'then' ? new THREE.Vector3(1.04, 0.99, 0.92) : new THREE.Vector3(0.94, 1.0, 1.05) },
      };
      const material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, depthTest: false, depthWrite: false });
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      const scene = new THREE.Scene();
      scene.add(quad);
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      // Render at the size the panel really has on screen (the slide is scaled to fit the device).
      const resize = () => {
        const r = el.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        renderer.setPixelRatio(dpr);
        renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
        uniforms.uBoxAspect.value = r.width / Math.max(1, r.height);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      // Spring state per channel.
      const st = { cx: s0.x, cy: s0.y, z: s0.z * 1.05, f: s0.focus, p: 0, lz: 0 };
      const vel = { cx: 0, cy: 0, z: 0, f: 0, p: 0, lz: 0 };
      let visible = true;
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
      io.observe(el);
      let last = performance.now();
      const t0 = last;
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (!visible || document.hidden) { last = now; return; }
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const t = target.current;
        const L = lightRef.current;
        const goals = { cx: t.x, cy: t.y, z: t.z, f: t.focus, p: t.pan ?? 0, lz: L?.strength ?? 0 };
        for (const k of Object.keys(goals) as (keyof typeof goals)[]) {
          if (still) { st[k] = goals[k]; continue; }
          const [nx, nv] = spring(st[k], vel[k], goals[k], dt, k === 'f' ? 1.2 : 2.2);
          st[k] = nx; vel[k] = nv;
        }
        // Breathing drift: a slow ellipse, so the photo is never frozen (about one turn every 18 s).
        const time = (now - t0) / 1000;
        const drift = still ? 0 : 1;
        uniforms.uCenter.value.set(st.cx / 100, 1 - st.cy / 100);
        uniforms.uZoom.value = st.z * (1 + 0.012 * drift * Math.sin(time * 0.35));
        uniforms.uCam.value.set((st.p * 0.03) + 0.012 * drift * Math.sin(time * 0.33), 0.008 * drift * Math.cos(time * 0.27));
        uniforms.uFocus.value = st.f;
        if (L) uniforms.uLight.value.set(L.x / 100, 1 - L.y / 100, st.lz * (0.85 + 0.15 * Math.sin(time * 0.9)));
        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(frame);
      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        material.dispose();
        quad.geometry.dispose();
        tImg.dispose();
        tDepth.dispose();
        renderer.dispose();
        canvas.remove();
      };
    })();
    return () => { disposed = true; cancelAnimationFrame(raf); cleanup(); };
  }, [img, depth, grade, still, onFail]);

  return <div ref={box} className={className} aria-hidden="true" />;
}
