import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { lessonRoomClient } from './supabase';

/** What travels in the lesson room (NX-12): which lesson is open and where the teacher is. Nothing else. */
export interface RoomState { track: string; number: number; page: number; step: number }

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
  const channel = useRef<RealtimeChannel | null>(null);
  const last = useRef<RoomState | null>(null);

  useEffect(() => {
    if (!roomKey) return;
    const supabase = lessonRoomClient();
    const ch = supabase.channel(`lesson-room-${roomKey}`, { config: { broadcast: { self: false } } });
    ch.on('broadcast', { event: 'state' }, ({ payload }) => { if (role === 'learner' && isRoomState(payload)) setState(payload); });
    ch.on('broadcast', { event: 'hello' }, () => {
      if (role === 'teacher' && last.current) ch.send({ type: 'broadcast', event: 'state', payload: last.current });
    });
    ch.subscribe((status) => {
      setConnected(status === 'SUBSCRIBED');
      if (status === 'SUBSCRIBED' && role === 'learner') ch.send({ type: 'broadcast', event: 'hello', payload: {} });
    });
    channel.current = ch;
    return () => { lessonRoomClient().removeChannel(ch); channel.current = null; setConnected(false); };
  }, [roomKey, role]);

  const publish = useCallback((s: RoomState) => {
    last.current = s;
    channel.current?.send({ type: 'broadcast', event: 'state', payload: s });
  }, []);

  return { connected, state, publish };
}
