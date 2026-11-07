import express from 'express';
import crypto from 'node:crypto';
import { notifySuperAdmins } from '../notifications/inbox.js';

/**
 * Owner review 2026-11-07 (item 18): a teacher adds their own photo and ID card in Settings.
 * - The photo shows on the teacher's card, so it lives in the public `teacher-photos` bucket and goes live at once.
 * - The ID card is for the academy only: private `teacher-documents` bucket, read by the super admin through a
 *   short signed link.
 * Uploads use one-time signed upload links; the path always starts with the teacher's own account id.
 */
type Middleware = (req: any, res: any, next: any) => any;

export const PHOTO_BUCKET = 'teacher-photos';
export const DOCS_BUCKET = 'teacher-documents';
const TYPES: Record<'photo' | 'id_card', Record<string, string>> = {
  photo: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' },
  id_card: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }
};
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

/** The path a teacher may confirm: their own folder, the right kind, a known extension. */
export function validUploadPath(path: string, teacherId: string, kind: 'photo' | 'id_card'): boolean {
  const exts = [...new Set(Object.values(TYPES[kind]))].join('|');
  return new RegExp(`^${teacherId}/${kind}-${UUID}\\.(${exts})$`).test(path) && new RegExp(`^${UUID}$`).test(teacherId);
}

const kindOf = (v: unknown): 'photo' | 'id_card' | null => (v === 'photo' || v === 'id_card' ? v : null);

export function registerTeacherFileRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyTeacherAuth: Middleware;
  requireSuperAdmin: Middleware;
  rateLimit: Middleware;
}) {
  const me = [deps.verifyTeacherAuth];

  app.get('/api/dashboard/me/files', ...me, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const { data } = await client.from('teacher_accounts').select('photo_url, id_card_uploaded_at').ilike('email', String(req.teacherUser?.email || '')).maybeSingle();
    return res.json({ photoUrl: data?.photo_url || null, idCardUploadedAt: data?.id_card_uploaded_at || null });
  });

  app.post('/api/dashboard/me/files/upload-url', deps.rateLimit, ...me, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const kind = kindOf(req.body?.kind);
    const teacherId = String(req.teacherUser?.id || '');
    if (!kind || !new RegExp(`^${UUID}$`).test(teacherId)) return res.status(400).json({ error: 'Invalid request.' });
    const ext = TYPES[kind][String(req.body?.contentType || '')];
    if (!ext) return res.status(400).json({ error: kind === 'photo' ? 'Use a JPG, PNG or WebP image.' : 'Use a JPG, PNG, WebP image or a PDF.' });
    try {
      const path = `${teacherId}/${kind}-${crypto.randomUUID()}.${ext}`;
      const { data, error } = await client.storage.from(kind === 'photo' ? PHOTO_BUCKET : DOCS_BUCKET).createSignedUploadUrl(path);
      if (error || !data) throw new Error(error?.message || 'no upload url');
      return res.json({ path, uploadUrl: data.signedUrl });
    } catch (err: any) {
      console.error('[teacher file upload-url]', err?.message || err);
      return res.status(500).json({ error: 'Could not start the upload.' });
    }
  });

  app.post('/api/dashboard/me/files', deps.rateLimit, ...me, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const kind = kindOf(req.body?.kind);
    const teacherId = String(req.teacherUser?.id || '');
    const email = String(req.teacherUser?.email || '');
    const path = String(req.body?.path || '');
    if (!kind || !validUploadPath(path, teacherId, kind)) return res.status(400).json({ error: 'Invalid upload.' });
    const bucket = kind === 'photo' ? PHOTO_BUCKET : DOCS_BUCKET;
    try {
      const name = path.slice(teacherId.length + 1);
      const { data: found } = await client.storage.from(bucket).list(teacherId, { search: name, limit: 1 });
      if (!found?.some((f: any) => f.name === name)) return res.status(400).json({ error: 'The upload did not arrive. Please try again.' });
      const { data: account } = await client.from('teacher_accounts').select('email, display_name, id_card_path').ilike('email', email).maybeSingle();
      if (!account) return res.status(404).json({ error: 'Teacher account not found.' });
      const update = kind === 'photo'
        ? { photo_url: client.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl }
        : { id_card_path: path, id_card_uploaded_at: new Date().toISOString() };
      const { error } = await client.from('teacher_accounts').update(update).eq('email', account.email);
      if (error) throw new Error(error.message);
      // The old ID card goes; only the latest one is kept.
      if (kind === 'id_card' && account.id_card_path && account.id_card_path !== path) {
        await client.storage.from(DOCS_BUCKET).remove([account.id_card_path]);
      }
      const who = account.display_name || email;
      await notifySuperAdmins(client, kind === 'photo'
        ? { kind: 'teacher_photo', title: { en: 'New teacher photo', ar: 'صورة معلم جديدة' }, body: { en: `${who} added a new photo. It is on their card now.`, ar: `${who} رفع صورة جديدة، وظهرت على الكارت بتاعه.` }, link: '/dashboard/teachers' }
        : { kind: 'teacher_id_card', title: { en: 'Teacher ID card received', ar: 'وصلت بطاقة معلم' }, body: { en: `${who} uploaded their ID card. Open Teachers to see it.`, ar: `${who} رفع صورة البطاقة. افتح صفحة المعلمين عشان تشوفها.` }, link: '/dashboard/teachers' });
      return res.json({ ok: true, ...('photo_url' in update ? { photoUrl: update.photo_url } : { idCardUploadedAt: (update as any).id_card_uploaded_at }) });
    } catch (err: any) {
      console.error('[POST teacher file]', err?.message || err);
      return res.status(500).json({ error: 'Could not save.' });
    }
  });

  // Super admin: a short link to look at a teacher's ID card.
  app.get('/api/dashboard/admin/teachers/:email/id-card', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const { data } = await client.from('teacher_accounts').select('id_card_path').ilike('email', String(req.params.email || '')).maybeSingle();
    if (!data?.id_card_path) return res.status(404).json({ error: 'No ID card yet.' });
    const { data: signed, error } = await client.storage.from(DOCS_BUCKET).createSignedUrl(data.id_card_path, 300);
    if (error || !signed) return res.status(500).json({ error: 'Could not open the file.' });
    return res.json({ url: signed.signedUrl });
  });
}
