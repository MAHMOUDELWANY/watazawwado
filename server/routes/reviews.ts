import express from 'express';
import crypto from 'node:crypto';
import { isUuid } from './progress.js';
import { notifySuperAdmins } from '../notifications/inbox.js';

/**
 * NX-05 (owner 2026-11-01): real reviews from families.
 * - The admin makes a one-time link (/review/<token>) and sends it to anyone; a family account with an attended lesson
 *   can also write one from the portal, and that one shows "studied with us".
 * - Nothing goes public until the admin publishes it. Declining is only for spam, abuse, personal data or a review
 *   that is not about us (docs/marketing/RULES.md §3.6: never hide bad reviews, never reward a review).
 * - Screenshots of families' messages (shared with their consent) live in a private bucket and are shown through
 *   short signed links.
 */
type Middleware = (req: any, res: any, next: any) => any;

export const SITE_URL = 'https://watazawwado.academy';
export const PROOF_BUCKET = 'review-proofs';
const INVITE_DAYS = 60;
const PROOF_LINK_SECONDS = 60 * 60 * 6;
const REVIEW_COLUMNS = 'id, source, verified, rating, body, lang, display_name, reviewer_role, country, status, decline_reason, created_at, reviewed_at';
const PUBLIC_COLUMNS = 'id, verified, rating, body, lang, display_name, reviewer_role, country, created_at';
const DECLINE_REASONS = ['spam', 'abuse', 'personal_data', 'not_ours'];
const PROOF_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
// Links, emails and phone numbers make a review an ad or leak personal data; ask the writer to leave them out.
const LINK_OR_CONTACT = /(https?:\/\/|www\.|\b[\w.+-]+@[\w-]+\.\w+|\+?\d[\d\s().-]{7,}\d)/i;

export type ReviewInput = { rating: number; body: string; lang: 'ar' | 'en'; display_name: string; reviewer_role: 'parent' | 'adult_learner'; country: string | null; consent: true };

/** What a writer sends, checked. The text keeps its line breaks; everything else is one trimmed line. */
export function parseReview(raw: any): { ok: true; value: ReviewInput } | { ok: false; error: string } {
  const rating = Number(raw?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, error: 'Choose a rating from 1 to 5.' };
  const body = typeof raw?.body === 'string' ? raw.body.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 1200) : '';
  if (body.length < 10) return { ok: false, error: 'Please write a few words (at least 10 characters).' };
  const display_name = clean(raw?.displayName, 40);
  if (!display_name) return { ok: false, error: 'Please add the name to show (for example, your first name).' };
  if (LINK_OR_CONTACT.test(body) || LINK_OR_CONTACT.test(display_name)) return { ok: false, error: 'Please leave out links, emails and phone numbers.' };
  const reviewer_role = raw?.role === 'adult_learner' ? 'adult_learner' : raw?.role === 'parent' ? 'parent' : null;
  if (!reviewer_role) return { ok: false, error: 'Tell us if you are a parent or an adult learner.' };
  if (raw?.consent !== true) return { ok: false, error: 'Please agree that we can show your review on our site.' };
  const lang = /[؀-ۿ]/.test(body) ? 'ar' : 'en';
  return { ok: true, value: { rating, body, lang, display_name, reviewer_role, country: clean(raw?.country, 40) || null, consent: true } };
}

export const newInviteToken = () => crypto.randomBytes(24).toString('base64url');

/** Published reviews with their average, and the screenshots with short-lived links. Public. */
async function publicReviews(client: any) {
  const [{ data: reviews }, { data: proofs }] = await Promise.all([
    client.from('family_reviews').select(PUBLIC_COLUMNS).eq('status', 'published').order('created_at', { ascending: false }).limit(60),
    client.from('review_proofs').select('id, storage_path, caption_en, caption_ar').eq('status', 'published').order('created_at', { ascending: false }).limit(24),
  ]);
  let proofLinks: any[] = [];
  if (proofs?.length) {
    const { data: links } = await client.storage.from(PROOF_BUCKET).createSignedUrls(proofs.map((p: any) => p.storage_path), PROOF_LINK_SECONDS);
    proofLinks = proofs.map((p: any, i: number) => ({ id: p.id, url: links?.[i]?.signedUrl || null, captionEn: p.caption_en, captionAr: p.caption_ar })).filter((p: any) => p.url);
  }
  const list = reviews || [];
  const average = list.length ? Math.round((list.reduce((s: number, r: any) => s + r.rating, 0) / list.length) * 10) / 10 : null;
  return { reviews: list, count: list.length, average, proofs: proofLinks };
}

async function tellAdmin(client: any, name: string, rating: number) {
  await notifySuperAdmins(client, {
    kind: 'review_submitted',
    title: { en: `New review from ${name} (${rating}/5)`, ar: `رأي جديد من ${name} (${rating}/5)` },
    body: { en: 'It waits for you to publish it.', ar: 'مستني تنشره.' },
    link: '/dashboard/reviews',
  });
}

export function registerFamilyReviewRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  verifyTeacherAuth: Middleware;
  requireSuperAdmin: Middleware;
  rateLimit: Middleware;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string }>>;
}) {
  const admin = [deps.verifyTeacherAuth, deps.requireSuperAdmin];

  // Public: the published reviews (home page).
  app.get('/api/reviews', async (_req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.json({ reviews: [], count: 0, average: null, proofs: [] });
    try {
      res.set('Cache-Control', 'public, max-age=300');
      return res.json(await publicReviews(client));
    } catch (err: any) {
      console.error('[GET reviews]', err?.message || err);
      return res.json({ reviews: [], count: 0, average: null, proofs: [] });
    }
  });

  const loadInvite = async (client: any, token: string) => {
    if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) return null;
    const { data } = await client.from('review_invites').select('id, expires_at, used_at').eq('token', token).maybeSingle();
    if (!data || data.used_at || new Date(data.expires_at).getTime() < Date.now()) return null;
    return data;
  };

  // Public: is this review link still open?
  app.get('/api/reviews/invite/:token', async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Not available.' });
    const invite = await loadInvite(client, String(req.params.token || ''));
    return invite ? res.json({ ok: true }) : res.status(404).json({ error: 'This link was already used or has expired.' });
  });

  // Public: write a review through a link (one review per link).
  app.post('/api/reviews/invite/:token', deps.rateLimit, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Not available.' });
    const parsed = parseReview(req.body);
    if (parsed.ok === false) return res.status(400).json({ error: parsed.error });
    try {
      const invite = await loadInvite(client, String(req.params.token || ''));
      if (!invite) return res.status(404).json({ error: 'This link was already used or has expired.' });
      // Claim the link first, so two quick sends cannot make two reviews.
      const { data: claimed } = await client.from('review_invites').update({ used_at: new Date().toISOString() })
        .eq('id', invite.id).is('used_at', null).select('id').maybeSingle();
      if (!claimed) return res.status(409).json({ error: 'This link was already used.' });
      const { error } = await client.from('family_reviews').insert({ ...parsed.value, source: 'invite', invite_id: invite.id, verified: false });
      if (error) {
        await client.from('review_invites').update({ used_at: null }).eq('id', invite.id);
        throw new Error(error.message);
      }
      await tellAdmin(client, parsed.value.display_name, parsed.value.rating);
      return res.json({ ok: true });
    } catch (err: any) {
      console.error('[POST review invite]', err?.message || err);
      return res.status(500).json({ error: 'Could not send. Please try again.' });
    }
  });

  /** A family that attended at least one lesson may write one review from the portal. */
  const portalState = async (client: any, req: any) => {
    const accountId = req.studentUser?.auth_id;
    if (!isUuid(accountId)) return { eligible: false, written: false, accountId: null };
    const learners = await deps.getLearners(client, req);
    const ids = learners.map((l) => l.id).filter(Boolean);
    const [{ count: lessons }, { data: mine }] = await Promise.all([
      ids.length
        ? client.from('bookings').select('id', { count: 'exact', head: true }).in('student_id', ids).eq('status', 'completed')
        : Promise.resolve({ count: 0 }),
      client.from('family_reviews').select('id').eq('source', 'portal').eq('account_user_id', accountId).maybeSingle(),
    ]);
    return { eligible: Boolean(lessons), written: Boolean(mine), accountId };
  };

  app.get('/api/student/review-status', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.json({ eligible: false, written: false });
    try {
      const { eligible, written } = await portalState(client, req);
      return res.json({ eligible, written });
    } catch (err: any) {
      console.error('[GET review-status]', err?.message || err);
      return res.json({ eligible: false, written: false });
    }
  });

  app.post('/api/student/reviews', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const parsed = parseReview(req.body);
    if (parsed.ok === false) return res.status(400).json({ error: parsed.error });
    try {
      const state = await portalState(client, req);
      if (!state.eligible) return res.status(403).json({ error: 'You can write a review after your first lesson.' });
      if (state.written) return res.status(409).json({ error: 'You already sent a review. Thank you!' });
      const { error } = await client.from('family_reviews').insert({ ...parsed.value, source: 'portal', account_user_id: state.accountId, verified: true });
      if (error) {
        if (String(error.code) === '23505') return res.status(409).json({ error: 'You already sent a review. Thank you!' });
        throw new Error(error.message);
      }
      await tellAdmin(client, parsed.value.display_name, parsed.value.rating);
      return res.json({ ok: true });
    } catch (err: any) {
      console.error('[POST student review]', err?.message || err);
      return res.status(500).json({ error: 'Could not send. Please try again.' });
    }
  });

  // Admin: everything, newest first, plus open links.
  app.get('/api/dashboard/reviews', ...admin, async (_req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    try {
      const [{ data: reviews }, { data: invites }, { data: proofs }] = await Promise.all([
        client.from('family_reviews').select(REVIEW_COLUMNS).order('created_at', { ascending: false }).limit(200),
        client.from('review_invites').select('id, label, expires_at, used_at, created_at').order('created_at', { ascending: false }).limit(50),
        client.from('review_proofs').select('id, storage_path, caption_en, caption_ar, consent_note, status, created_at').order('created_at', { ascending: false }).limit(50),
      ]);
      let proofList: any[] = proofs || [];
      if (proofList.length) {
        const { data: links } = await client.storage.from(PROOF_BUCKET).createSignedUrls(proofList.map((p) => p.storage_path), PROOF_LINK_SECONDS);
        proofList = proofList.map((p, i) => ({ ...p, url: links?.[i]?.signedUrl || null }));
      }
      return res.json({ reviews: reviews || [], invites: invites || [], proofs: proofList });
    } catch (err: any) {
      console.error('[GET dashboard reviews]', err?.message || err);
      return res.status(500).json({ error: 'Could not load reviews.' });
    }
  });

  // Admin: a new one-time review link to send to someone.
  app.post('/api/dashboard/review-invites', deps.rateLimit, ...admin, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    try {
      const token = newInviteToken();
      const expires = new Date(Date.now() + INVITE_DAYS * 24 * 3600 * 1000).toISOString();
      const { error } = await client.from('review_invites').insert({
        token, label: clean(req.body?.label, 80) || null, expires_at: expires,
        created_by: isUuid(req.teacherUser?.id) ? req.teacherUser.id : null,
      });
      if (error) throw new Error(error.message);
      return res.json({ url: `${SITE_URL}/review/${token}`, expiresAt: expires });
    } catch (err: any) {
      console.error('[POST review invite]', err?.message || err);
      return res.status(500).json({ error: 'Could not make the link.' });
    }
  });

  // Admin: publish, decline (with a reason) or put back to pending.
  app.post('/api/dashboard/reviews/:id/status', deps.rateLimit, ...admin, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const id = String(req.params.id || '');
    const status = req.body?.status;
    if (!isUuid(id) || !['published', 'declined', 'pending'].includes(status)) return res.status(400).json({ error: 'Invalid request.' });
    const reason = status === 'declined' ? req.body?.reason : null;
    if (status === 'declined' && !DECLINE_REASONS.includes(reason)) return res.status(400).json({ error: 'A review is declined only for spam, abuse, personal data or not being about us.' });
    try {
      const { data, error } = await client.from('family_reviews').update({
        status, decline_reason: reason, reviewed_at: new Date().toISOString(),
        reviewed_by: isUuid(req.teacherUser?.id) ? req.teacherUser.id : null,
      }).eq('id', id).select(REVIEW_COLUMNS).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return res.status(404).json({ error: 'Review not found.' });
      return res.json({ review: data });
    } catch (err: any) {
      console.error('[POST review status]', err?.message || err);
      return res.status(500).json({ error: 'Could not save.' });
    }
  });

  // Admin: a one-time upload link for a screenshot.
  app.post('/api/dashboard/review-proofs/upload-url', deps.rateLimit, ...admin, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const ext = PROOF_TYPES[String(req.body?.contentType || '')];
    if (!ext) return res.status(400).json({ error: 'Use a JPG, PNG or WebP image.' });
    try {
      const path = `proofs/${crypto.randomUUID()}.${ext}`;
      const { data, error } = await client.storage.from(PROOF_BUCKET).createSignedUploadUrl(path);
      if (error || !data) throw new Error(error?.message || 'no upload url');
      return res.json({ path, token: data.token, uploadUrl: data.signedUrl });
    } catch (err: any) {
      console.error('[review proof upload-url]', err?.message || err);
      return res.status(500).json({ error: 'Could not start the upload.' });
    }
  });

  // Admin: the upload finished; record it with the family's consent note.
  app.post('/api/dashboard/review-proofs', deps.rateLimit, ...admin, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const path = String(req.body?.path || '');
    const consent = clean(req.body?.consentNote, 200);
    if (!/^proofs\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(path)) return res.status(400).json({ error: 'Invalid upload.' });
    if (consent.length < 3) return res.status(400).json({ error: 'Write how the family agreed (for example: "Asked on WhatsApp, 1 Nov").' });
    try {
      const { data: found } = await client.storage.from(PROOF_BUCKET).list('proofs', { search: path.slice(7), limit: 1 });
      if (!found?.some((f: any) => `proofs/${f.name}` === path)) return res.status(400).json({ error: 'The upload did not arrive. Please try again.' });
      const { data, error } = await client.from('review_proofs').insert({
        storage_path: path, consent_note: consent,
        caption_en: clean(req.body?.captionEn, 160) || null, caption_ar: clean(req.body?.captionAr, 160) || null,
        created_by: isUuid(req.teacherUser?.id) ? req.teacherUser.id : null,
      }).select('id').single();
      if (error) throw new Error(error.message);
      return res.json({ id: data.id });
    } catch (err: any) {
      console.error('[POST review proof]', err?.message || err);
      return res.status(500).json({ error: 'Could not save.' });
    }
  });

  // Admin: hide or show a screenshot.
  app.post('/api/dashboard/review-proofs/:id/status', deps.rateLimit, ...admin, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const id = String(req.params.id || '');
    const status = req.body?.status;
    if (!isUuid(id) || !['published', 'hidden'].includes(status)) return res.status(400).json({ error: 'Invalid request.' });
    const { data, error } = await client.from('review_proofs').update({ status }).eq('id', id).select('id, status').maybeSingle();
    if (error) return res.status(500).json({ error: 'Could not save.' });
    return data ? res.json({ proof: data }) : res.status(404).json({ error: 'Not found.' });
  });
}
