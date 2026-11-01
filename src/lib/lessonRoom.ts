import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { lessonRoomClient } from './supabase';

/** What travels in the lesson room (NX-12): which lesson is open, where the teacher is, and the teacher's ink. Nothing else. */
export interface RoomState { track: string; number: number; page: number; step: number }
type Pt = [number, number];
export interface RoomInk { track: string; number: number; page: number; strokes: { tool: 'pen' | 'marker'; color: string; points: Pt[] }[]; laser: Pt[] }

const isPts = (v: any, max: number) => Array.isArray(v) && v.length <= max
  && v.every((p: any) => Array.isArray(p) && p.length === 2 && p.every((n: any) => Number.isFinite(n) && Math.abs(n) < 10000));

export function isRoomInk(v: any): v is RoomInk {
  return Boolean(v) && typeof v.track === 'string' && v.track.length < 60
    && [v.number, v.page].every((n) => Number.isInteger(n) && n >= 0 && n < 1000)
    && isPts(v.laser, 30) && Array.isArray(v.strokes) && v.strokes.length <= 300
    && v.strokes.every((s: any) => s && (s.tool === 'pen' || s.tool === 'marker') && typeof s.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(s.color) && isPts(s.points, 4000));
}

/** Broadcast stays small: whole canvas units are plenty for ink. */
const roundInk = (ink: RoomInk): RoomInk => ({
  ...ink,
  strokes: ink.strokes.map((s) => ({ ...s, points: s.points.map(([x, y]) => [Math.round(x), Math.round(y)] as Pt) })),
  laser: ink.laser.map(([x, y]) => [Math.round(x), Math.round(y)] as Pt),
});
const INK_EVERY_MS = 80;

export function isRoomState(v: any): v is RoomState {
  return Boolean(v) && typeof v.track === 'string' && v.track.length < 60
    && [v.number, v.page, v.step].every((n) => Number.isInteger(n) && n >= 0 && n < 1000);
}

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

  useEffect(() => {
    if (!roomKey) return;
    const supabase = lessonRoomClient();
    const ch = supabase.channel(`lesson-room-${roomKey}`, { config: { broadcast: { self: false } } });
    ch.on('broadcast', { event: 'state' }, ({ payload }) => { if (role === 'learner' && isRoomState(payload)) setState(payload); });
    ch.on('broadcast', { event: 'ink' }, ({ payload }) => { if (role === 'learner' && isRoomInk(payload)) setInk(payload); });
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

  return { connected, state, ink, publish, publishInk };
}
