import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { lessonRoomClient } from './supabase';

export { isRoomEvent, isRoomInk, isRoomState, MAX_BOARD_BYTES, MAX_EVENT_BYTES } from './roomEvents';
export type { RoomEvent, RoomInk, RoomState } from './roomEvents';
import { isRoomEvent, isRoomInk, isRoomState, type RoomEvent, type RoomInk, type RoomState } from './roomEvents';
type Pt = [number, number];

/** Broadcast stays small: whole canvas units are plenty for ink. */
const roundInk = (ink: RoomInk): RoomInk => ({
  ...ink,
  strokes: ink.strokes.map((s) => ({ ...s, points: s.points.map(([x, y]) => [Math.round(x), Math.round(y)] as Pt) })),
  laser: ink.laser.map(([x, y]) => [Math.round(x), Math.round(y)] as Pt),
});
/** About 7 messages a second while drawing: Supabase Realtime allows 100 a second per project, shared by every room. */
export const INK_EVERY_MS = 150;

/**
 * The live channel for one lesson. The teacher publishes; the learner asks for the current state when they join
 * ("hello") and then follows every change. `connected` turns true once the channel is subscribed.
 */
export function useLessonRoom(roomKey: string | null, role: 'teacher' | 'learner') {
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<RoomState | null>(null);
  const [ink, setInk] = useState<RoomInk | null>(null);
  const channel = useRef<RealtimeChannel | null>(null);
  const last = useRef<RoomState | null>(null);
  const lastInk = useRef<RoomInk | null>(null);
  const inkTimer = useRef<number | null>(null);
  const listeners = useRef(new Set<(e: RoomEvent) => void>());

  useEffect(() => {
    if (!roomKey) return;
    const supabase = lessonRoomClient();
    const ch = supabase.channel(`lesson-room-${roomKey}`, { config: { broadcast: { self: false } } });
    ch.on('broadcast', { event: 'state' }, ({ payload }) => { if (role === 'learner' && isRoomState(payload)) setState(payload); });
    ch.on('broadcast', { event: 'ink' }, ({ payload }) => { if (role === 'learner' && isRoomInk(payload)) setInk(payload); });
    // Timeline events go both ways (the learner sends reactions and focus); every one is checked before use.
    ch.on('broadcast', { event: 'ev' }, ({ payload }) => { if (isRoomEvent(payload)) listeners.current.forEach((fn) => fn(payload)); });
    ch.on('broadcast', { event: 'hello' }, () => {
      if (role !== 'teacher') return;
      if (last.current) ch.send({ type: 'broadcast', event: 'state', payload: last.current });
      if (lastInk.current) ch.send({ type: 'broadcast', event: 'ink', payload: lastInk.current });
    });
    ch.subscribe((status) => {
      setConnected(status === 'SUBSCRIBED');
      if (status === 'SUBSCRIBED' && role === 'learner') ch.send({ type: 'broadcast', event: 'hello', payload: {} });
    });
    channel.current = ch;
    return () => {
      if (inkTimer.current) window.clearTimeout(inkTimer.current);
      inkTimer.current = null;
      lessonRoomClient().removeChannel(ch); channel.current = null; setConnected(false);
    };
  }, [roomKey, role]);

  const publish = useCallback((s: RoomState) => {
    last.current = s;
    channel.current?.send({ type: 'broadcast', event: 'state', payload: s });
  }, []);

  // Ink changes on every pointer move; send the latest picture at most every INK_EVERY_MS (trailing, so the last one always goes).
  const publishInk = useCallback((i: RoomInk) => {
    lastInk.current = roundInk(i);
    if (inkTimer.current) return;
    inkTimer.current = window.setTimeout(() => {
      inkTimer.current = null;
      channel.current?.send({ type: 'broadcast', event: 'ink', payload: lastInk.current });
    }, INK_EVERY_MS);
  }, []);

  const publishEvent = useCallback((e: RoomEvent) => {
    channel.current?.send({ type: 'broadcast', event: 'ev', payload: e });
  }, []);

  /** Listen to timeline events from the other side; returns the unsubscribe. */
  const onEvent = useCallback((fn: (e: RoomEvent) => void) => {
    listeners.current.add(fn);
    return () => { listeners.current.delete(fn); };
  }, []);

  return { connected, state, ink, publish, publishInk, publishEvent, onEvent };
}
