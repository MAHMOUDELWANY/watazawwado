import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls, Sparkles } from '@react-three/drei';
import { BackSide, CanvasTexture, NeutralToneMapping, SRGBColorSpace, type WebGLRenderer } from 'three';

/** Keeps the brand crimson and gold true; ACES greys them. */
export const toneRenderer = (gl: WebGLRenderer) => {
  gl.toneMapping = NeutralToneMapping;
  gl.toneMappingExposure = 1.05;
};

/** The lights and studio softboxes the 3D characters need: without them the polished gold reads brown. */
export function StudioLights({ shadows = true }: { shadows?: boolean }) {
  return (
    <>
      <ambientLight intensity={0.25} />
      <spotLight position={[1.5, 4, 3.5]} angle={0.45} penumbra={0.9} intensity={38} color="#FFF0DC" castShadow={shadows} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      <directionalLight position={[-2.5, 1.5, 2]} intensity={0.8} color="#FFE2C2" />
      {/* rim light from behind: outlines the character against a dark stage */}
      <directionalLight position={[0.5, 2.2, -3]} intensity={3.2} color="#FFC873" />
      <Environment resolution={128} frames={1}>
        {/* warm dim dome: metal reflects this from any angle instead of black */}
        <mesh scale={30}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial color="#5A3A22" side={BackSide} />
        </mesh>
        <Lightformer form="rect" intensity={1.6} color="#FFE2B8" position={[-4.5, 1.5, -3]} scale={[2, 4, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#FFE2B8" position={[4.5, 1.5, -3]} scale={[2, 4, 1]} />
        <Lightformer form="rect" intensity={3.2} color="#FFF3E2" position={[0, 4, 2.5]} scale={[6, 2.5, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#FFDDB0" position={[-4, 1.2, 1.5]} scale={[1.2, 4, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#FFE9CC" position={[4, 1.2, 1.5]} scale={[1.2, 4, 1]} />
        <Lightformer form="ring" intensity={2} color="#F6C25A" position={[0, 1.5, -4]} scale={2.5} />
        <Lightformer form="rect" intensity={0.8} color="#C51F24" position={[0, -2.5, 2]} scale={[6, 1.5, 1]} />
        {/* behind the camera: flat gold faces reflect this, not black */}
        <Lightformer form="rect" intensity={1.4} color="#FFE2B8" position={[0, 1, 6]} scale={[7, 3, 1]} />
      </Environment>
    </>
  );
}

/** The studio stage for a character on show: lights, an espresso pedestal with a gold khatam ring, drag to turn. */
export default function Stage3D({ children, onClock, still }: { children: React.ReactNode; onClock: (now: () => number) => void; still: boolean }) {
  const floor = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, '#5C3222');
    grad.addColorStop(0.7, '#36190F');
    grad.addColorStop(1, '#22100A');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, []);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.05, 4.9], fov: 34 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ clock, gl }) => { onClock(() => clock.getElapsedTime()); toneRenderer(gl); }}
    >
      <StudioLights />
      {children}
      {/* pedestal: espresso drum, gold lip, a gold khatam ring on top; unlit on purpose (lit dark materials wash out to tan) */}
      <mesh position={[0, -0.09, 0]}>
        <cylinderGeometry args={[1.25, 1.32, 0.18, 96, 1, true]} />
        <meshBasicMaterial color="#1A0D08" toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.25, 96]} />
        <meshBasicMaterial map={floor} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.25, 0.022, 12, 128]} />
        <meshPhysicalMaterial color="#F3C15A" metalness={1} roughness={0.18} clearcoat={1} />
      </mesh>
      {[Math.PI / 8, 0].map((rz) => (
        <mesh key={rz} position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, rz]}>
          <ringGeometry args={[0.98, 1.0, 8, 1]} />
          <meshPhysicalMaterial color="#F3C15A" metalness={1} roughness={0.25} />
        </mesh>
      ))}
      <ContactShadows position={[0, 0.004, 0]} opacity={0.6} scale={3} blur={2.4} far={1.5} color="#120804" />
      {!still && <Sparkles count={28} scale={[3.4, 2.4, 1.6]} position={[0, 1.2, -0.4]} size={2.2} speed={0.25} opacity={0.6} color="#FFE7A8" />}
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 3.2} maxPolarAngle={Math.PI / 2.05} target={[0, 0.8, 0]} />
    </Canvas>
  );
}
