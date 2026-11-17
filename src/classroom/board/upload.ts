/**
 * Adds a PDF or image to the lesson (Task 8). The file goes straight to Storage on a one-path signed upload, because a
 * Vercel function body is capped near 4.5 MB; the server then checks its real size and first bytes before giving a link.
 */
import { lessonRoomClient } from '../../lib/supabase';

const BUCKET = 'classroom-files';

async function call<T>(url: string, ticket: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-room-ticket': ticket },
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.error || `Upload failed (${res.status}).`), { status: res.status });
  return json as T;
}

export async function uploadClassroomFile(bookingId: string, ticket: string, file: File): Promise<{ fileId: string; url: string }> {
  const base = `/api/classroom/${bookingId}/files`;
  const { fileId, path, token } = await call<{ fileId: string; path: string; token: string }>(
    `${base}/upload-url`, ticket, { contentType: file.type, size: file.size },
  );
  const { error } = await lessonRoomClient().storage.from(BUCKET).uploadToSignedUrl(path, token, file, { contentType: file.type });
  if (error) throw new Error(error.message || 'Upload failed.');
  return call<{ fileId: string; url: string }>(`${base}/${fileId}/confirm`, ticket);
}
