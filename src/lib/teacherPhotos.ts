import { useEffect, useState } from 'react';

/** A teacher's own photo by account id or by name (owner review 2026-11-09: their face wherever their name shows). */
type Entry = { id: string | null; names: string[]; photo: string };

let cache: Promise<Entry[]> | null = null;
const load = () => (cache ||= fetch('/api/teacher-photos').then((r) => r.json()).then((d) => d?.teachers || []).catch(() => { cache = null; return []; }));

export function findTeacherPhoto(list: Entry[], who: { id?: string | null; name?: string | null }): string | null {
  const name = String(who.name || '').trim().toLowerCase();
  const hit = list.find((t) => (who.id && t.id === who.id) || (name && t.names.some((n) => n.trim().toLowerCase() === name)));
  return hit?.photo || null;
}

/** The photo for a teacher, or null while loading or when they have none yet. */
export function useTeacherPhoto(who: { id?: string | null; name?: string | null }): string | null {
  const [list, setList] = useState<Entry[]>([]);
  useEffect(() => { let alive = true; load().then((l) => { if (alive) setList(l); }); return () => { alive = false; }; }, []);
  return findTeacherPhoto(list, who);
}

/** Every teacher photo, for lists that show several teachers. */
export function useTeacherPhotos(): Entry[] {
  const [list, setList] = useState<Entry[]>([]);
  useEffect(() => { let alive = true; load().then((l) => { if (alive) setList(l); }); return () => { alive = false; }; }, []);
  return list;
}
