import { useEffect, useState } from 'react';
import { uploadClassroomFile } from '../board/upload';
import { baseType } from './media';

/** A signed link to a room file (it ends by the hard close); null while loading or with no file. */
export function useRoomFileUrl(bookingId: string, ticket: string, fileId: string | null): string | null {
  const [url, setUrl] = useState<{ id: string; url: string } | null>(null);
  useEffect(() => {
    if (!fileId) return;
    let live = true;
    fetch(`/api/classroom/${encodeURIComponent(bookingId)}/files/${encodeURIComponent(fileId)}`, { headers: { 'x-room-ticket': ticket } })
      .then((r) => r.json().then((b) => ({ ok: r.ok, b })))
      .then(({ ok, b }) => { if (live && ok && typeof b?.url === 'string') setUrl({ id: fileId, url: b.url }); })
      .catch(() => {});
    return () => { live = false; };
  }, [bookingId, ticket, fileId]);
  return fileId && url?.id === fileId ? url.url : null;
}

/** Uploads a sound (a picked file or a recording) as a room file, with the plain type Storage and the server expect. */
export function uploadRoomAudio(bookingId: string, ticket: string, blob: Blob, name = 'sound'): Promise<{ fileId: string; url: string }> {
  const type = baseType(blob.type || 'audio/webm');
  return uploadClassroomFile(bookingId, ticket, new File([blob], name, { type }));
}
