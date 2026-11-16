import { useFrame as r3fUseFrame, type RootState } from '@react-three/fiber';

/** Video time for the copied Zad3D: Remotion advances R3F with wall-clock stamps, so Zad reads this clock instead. */
export const VT = { t: 0, dt: 1 / 30 };
const clock = { getElapsedTime: () => VT.t, get elapsedTime() { return VT.t; }, getDelta: () => VT.dt };

export function useFrame(cb: (state: RootState, dt: number, frame?: unknown) => void, priority?: number) {
  r3fUseFrame((state, _dt, frame) => cb({ ...state, clock } as unknown as RootState, VT.dt, frame), priority);
}
