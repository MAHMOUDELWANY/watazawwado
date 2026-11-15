import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Center, ContactShadows, Environment, OrbitControls, useAnimations, useGLTF } from '@react-three/drei';
import { Box3, Vector3, type Group } from 'three';

/** DEV-ONLY: a companion GLB on the same sand stage as the 2D art, with a gentle idle. */

function Model({ url, still }: { url: string; still: boolean }) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, group);
  // models come in at any size: scale so the companion is 1 unit tall
  const fit = React.useMemo(() => 1 / (new Box3().setFromObject(scene).getSize(new Vector3()).y || 1), [scene]);
  React.useEffect(() => {
    if (still || !names.length) return;
    const a = actions[names.find((n) => /idle|breath/i.test(n)) ?? names[0]];
    a?.reset().fadeIn(0.3).play();
    return () => { a?.fadeOut(0.3); };
  }, [actions, names, still]);
  // tap: a happy hop with a full turn, squash on landing
  const hop = useRef(-10);
  const clock = useThree((st) => st.clock);
  useFrame(({ clock }) => {
    if (still || !group.current || names.length) return;
    const t = clock.getElapsedTime();
    const k = (t - hop.current) / 0.9; // 0..1 while hopping
    const air = k >= 0 && k < 1 ? Math.sin(k * Math.PI) : 0;
    const land = k >= 0.85 && k < 1.15 ? Math.sin(((k - 0.85) / 0.3) * Math.PI) : 0;
    group.current.position.y = Math.sin(t * 1.6) * 0.02 + air * 0.35;
    group.current.scale.set(1 + land * 0.08, 1 + Math.sin(t * 1.6) * 0.008 - land * 0.12 + air * 0.05, 1 + land * 0.08);
    group.current.rotation.y = Math.sin(t * 0.4) * 0.25 + (k >= 0 && k < 1 ? k * Math.PI * 2 : 0);
  });
  return (
    <group
      ref={group}
      onClick={(e) => { e.stopPropagation(); hop.current = clock.getElapsedTime(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    >
      <Center top>
        <primitive object={scene} scale={fit} />
      </Center>
    </group>
  );
}

export default function Companion3D({ url, still = false }: { url: string; still?: boolean }) {
  return (
    <Canvas camera={{ position: [0.5, 0.68, 1.85], fov: 32 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 2]} intensity={1.6} color="#FFE9C9" />
      <directionalLight position={[-2, 1.5, -2]} intensity={0.8} color="#FFD3A1" />
      <Suspense fallback={null}>
        <Environment preset="sunset" environmentIntensity={0.45} />
        <Model url={url} still={still} />
      </Suspense>
      <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={3} blur={2.4} far={1.2} color="#7A4A22" />
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2.1} target={[0, 0.5, 0]} />
    </Canvas>
  );
}
