import express from 'express';
import { sendEmail } from '../notifications/emailService.js';
import { renderSimpleNotice } from '../notifications/emailTemplates.js';

/**
 * "Pack your zaad" waitlist (RULES.md §2 "Launch in waves", BRAND.md §6). Public join by email or Google, an honest
 * place in line, an optional "what was missing before" answer, and super-admin invitations. The whole feature is
 * behind LEARNER_SIGNUP_MODE: in `open` (the default) only the /zaad page and these endpoints exist; in `waitlist`
 * new learner onboarding needs an invited email. Spec: docs/superpowers/specs/2026-11-05-pack-your-zaad-waitlist-design.md
 */

type Middleware = (req: any, res: any, next: any) => any;

export const TRACKS = ['quran', 'zad', 'arabic', 'english'] as const;
export const WHO = ['me', 'child'] as const;
export const PAINS = ['teacher_stays', 'clear_plan', 'see_progress', 'child_enjoys', 'times_fit', 'clear_prices'] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function signupMode(): 'open' | 'waitlist' {
  return process.env.LEARNER_SIGNUP_MODE?.trim() === 'waitlist' ? 'waitlist' : 'open';
}
export function waveSize(): number {
  const n = Number(process.env.WAVE_SIZE);
  return Number.isInteger(n) && n > 0 && n <= 1000 ? n : 20;
}

export type JoinInput = { email: string; track: typeof TRACKS[number]; who: typeof WHO[number]; lang: 'en' | 'ar'; source: string | null };

/** Validates the public join body. `website` is a honeypot: people never see it, bots fill it. */
export function parseJoin(body: any, emailOverride?: string): JoinInput | { error: string } {
  if (body?.website) return { error: 'Something went wrong. Please try again.' };
  const email = String(emailOverride ?? body?.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: 'Please enter a valid email address.' };
  if (!TRACKS.includes(body?.track)) return { error: 'Choose what you want to carry first.' };
  if (!WHO.includes(body?.who)) return { error: 'Choose who this is for.' };
  const lang = body?.lang === 'ar' ? 'ar' : 'en';
  const source = typeof body?.source === 'string' && /^[\w.\-:=&|]{1,80}$/.test(body.source) ? body.source : null;
  return { email, track: body.track, who: body.who, lang, source };
}

export function parseVoice(body: any): { pains: string[]; note: string | null } | { error: string } {
  const pains = Array.isArray(body?.pains) ? [...new Set(body.pains.filter((p: any) => PAINS.includes(p)))] as string[] : [];
  if (body?.note != null && typeof body.note !== 'string') return { error: 'The note must be text.' };
  const note = typeof body?.note === 'string' ? body.note.trim() : '';
  if (note.length > 500) return { error: 'Please keep it under 500 characters.' };
  if (!pains.length && !note) return { error: 'Tap one, or write a line.' };
  return { pains, note: note || null };
}

/** Place in line: how many entries were created at or before this one. */
export async function placeOf(client: any, createdAt: string): Promise<number> {
  const { count, error } = await client.from('waitlist_entries').select('id', { count: 'exact', head: true }).lte('created_at', createdAt);
  if (error) throw error;
  return count || 1;
}

/** In waitlist mode a new learner may finish onboarding only with an invited email. Marks the entry as joined. */
export async function onboardingAllowed(client: any, email: string | null | undefined): Promise<boolean> {
  if (signupMode() === 'open') return true;
  const clean = String(email || '').trim().toLowerCase();
  if (!clean) return false;
  const { data } = await client.from('waitlist_entries').select('id, invited_at').eq('email', clean).maybeSingle();
  if (!data?.invited_at) return false;
  await client.from('waitlist_entries').update({ joined_at: new Date().toISOString() }).eq('id', data.id).is('joined_at', null);
  return true;
}

const TRACK_NAMES: Record<string, { en: string; ar: string }> = {
  quran: { en: 'the Quran', ar: 'القرآن الكريم' }, zad: { en: 'the Zad Path', ar: 'مسار الزاد' },
  arabic: { en: 'Arabic', ar: 'اللغة العربية' }, english: { en: 'English', ar: 'الإنجليزية' },
};

async function join(client: any, input: JoinInput, res: any, verified: boolean) {
  const { data: existing } = await client.from('waitlist_entries').select('id, secret, created_at').eq('email', input.email).maybeSingle();
  let row = existing;
  let preexisting = Boolean(existing);
  if (!row) {
    const { data, error } = await client.from('waitlist_entries')
      .insert({ email: input.email, track: input.track, who: input.who, lang: input.lang, source: input.source })
      .select('id, secret, created_at').single();
    if (error) {
      // a parallel join with the same email won the race: read that row instead
      const again = await client.from('waitlist_entries').select('id, secret, created_at').eq('email', input.email).maybeSingle();
      if (!again.data) return res.status(500).json({ error: 'We could not save your place. Please try again.' });
      row = again.data;
      preexisting = true;
    } else {
      row = data;
      const place = await placeOf(client, row.created_at);
      const t = TRACK_NAMES[input.track];
      // Production only: local test runs share the database and must not email anyone.
      if (process.env.NODE_ENV === 'production') {
        const mail = renderSimpleNotice({
          lang: input.lang,
          title: { en: 'Your zaad is packed', ar: 'زادك جاهز' },
          body: {
            en: `You're number ${place} in line for our first wave (${waveSize()} places, early December). You packed ${t.en}. We'll write to you before your wave opens; no password and no payment until then.`,
            ar: `أنت رقم ${place} في انتظار الدفعة الأولى (${waveSize()} مكانًا، أوائل ديسمبر). جهّزت ${t.ar}. سنكتب لك قبل أن تفتح دفعتك، ولا كلمة سر ولا دفع حتى ذلك الوقت.`,
          },
        });
        sendEmail({ to: input.email, from: 'info', ...mail }).catch(() => {});
      }
    }
  }
  const place = await placeOf(client, row.created_at);
  // Anyone can type any email, so an unverified join of an existing email learns nothing about it: no place, id or
  // secret. The owner of the email gets their place by email instead.
  if (preexisting && !verified) {
    // at most one 'already in line' email a day per address, so the form cannot be used to flood an inbox
    const { data: fresh } = await client.from('waitlist_entries').update({ updated_at: new Date().toISOString() })
      .eq('id', row.id).lt('updated_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString()).select('id').maybeSingle();
    if (fresh && process.env.NODE_ENV === 'production') {
      const mail = renderSimpleNotice({
        lang: input.lang,
        title: { en: 'You are already in line', ar: 'أنت في الدور بالفعل' },
        body: { en: `You're number ${place} in line. We'll write to you before your wave opens.`, ar: `أنت رقم ${place} في الدور. سنكتب لك قبل أن تفتح دفعتك.` },
      });
      sendEmail({ to: input.email, from: 'info', ...mail }).catch(() => {});
    }
    return res.json({ already: true, waveSize: waveSize() });
  }
  return res.json({ place, waveSize: waveSize(), entryId: row.id, secret: row.secret });
}

export function registerWaitlistRoutes(app: express.Express, deps: {
  getClient: () => any;
  rateLimit: Middleware;
  verifyTeacherAuth: Middleware;
  requireSuperAdmin: Middleware;
}) {
  app.get('/api/public/launch', (_req, res) => {
    res.json({ signupMode: signupMode(), waveSize: waveSize(), waveLabel: { en: 'early December', ar: 'أوائل ديسمبر' } });
  });

  app.post('/api/waitlist', deps.rateLimit, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Service temporarily unavailable.' });
    const input = parseJoin(req.body);
    if ('error' in input) return res.status(400).json(input);
    try { return await join(client, input, res, false); } catch { return res.status(500).json({ error: 'We could not save your place. Please try again.' }); }
  });

  // Google: the email comes from the verified Supabase session, never from the body.
  app.post('/api/waitlist/google', deps.rateLimit, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Service temporarily unavailable.' });
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Please sign in with Google first.' });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user?.email) return res.status(401).json({ error: 'Please sign in with Google first.' });
    // only a confirmed email proves the person owns it; otherwise treat the join like the public form
    const verified = Boolean(data.user.email_confirmed_at);
    const input = parseJoin(req.body, data.user.email);
    if ('error' in input) return res.status(400).json(input);
    try { return await join(client, input, res, verified); } catch { return res.status(500).json({ error: 'We could not save your place. Please try again.' }); }
  });

  app.post('/api/waitlist/:id/voice', deps.rateLimit, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Service temporarily unavailable.' });
    if (!UUID_RE.test(req.params.id) || typeof req.body?.secret !== 'string') return res.status(404).json({ error: 'Not found.' });
    const voice = parseVoice(req.body);
    if ('error' in voice) return res.status(400).json(voice);
    const { data, error } = await client.from('waitlist_entries')
      .update({ pains: voice.pains, note: voice.note, updated_at: new Date().toISOString() })
      .eq('id', req.params.id).eq('secret', req.body.secret).select('id').maybeSingle();
    if (error) return res.status(500).json({ error: 'Could not send it. Please try again.' });
    if (!data) return res.status(404).json({ error: 'Not found.' });
    return res.json({ ok: true });
  });

  app.get('/api/dashboard/waitlist', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (_req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const { data, error } = await client.from('waitlist_entries')
      .select('id, email, track, who, lang, source, pains, note, wave, invited_at, joined_at, created_at')
      .order('created_at', { ascending: true }).limit(2000);
    if (error) return res.status(500).json({ error: 'Could not load the waitlist.' });
    const entries = (data || []).map((e: any, i: number) => ({ ...e, place: i + 1 }));
    const byTrack: Record<string, number> = {};
    const pains: Record<string, number> = {};
    for (const e of entries) {
      byTrack[e.track] = (byTrack[e.track] || 0) + 1;
      for (const p of e.pains || []) pains[p] = (pains[p] || 0) + 1;
    }
    return res.json({ entries, byTrack, pains, waveSize: waveSize(), signupMode: signupMode() });
  });

  app.post('/api/dashboard/waitlist/:id/invite', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    if (!UUID_RE.test(req.params.id)) return res.status(404).json({ error: 'Not found.' });
    const { data: entry } = await client.from('waitlist_entries').select('id, email, lang, invited_at').eq('id', req.params.id).maybeSingle();
    if (!entry) return res.status(404).json({ error: 'Not found.' });
    const invitedAt = entry.invited_at || new Date().toISOString();
    if (!entry.invited_at) await client.from('waitlist_entries').update({ invited_at: invitedAt, updated_at: invitedAt }).eq('id', entry.id);
    const mail = renderSimpleNotice({
      lang: entry.lang,
      title: { en: 'Your place is open', ar: 'مكانك جاهز' },
      body: {
        en: 'Your wave is open and your place is held for 72 hours, because the next family in line is waiting. Create your account with this email and book your free trial.',
        ar: 'فُتحت دفعتك، ومكانك محجوز لك 72 ساعة، لأن الأسرة التالية في الدور تنتظر. أنشئ حسابك بهذا البريد، واحجز حصتك التجريبية المجانية.',
      },
      buttonPath: `${entry.lang === 'ar' ? '/ar' : ''}/zaad?invited=1`,
    });
    const sent = process.env.NODE_ENV === 'production' ? await sendEmail({ to: entry.email, from: 'info', ...mail }) : { success: false, status: 'skipped_non_production' };
    return res.json({ ok: true, invitedAt, email: sent });
  });
}
