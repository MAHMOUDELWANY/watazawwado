/**
 * RN-07: which optional emails an account wants (public.notification_preferences). No row means everything on.
 * Transactional emails (bookings, reminders, payments) never ask. A switch only stops the email: on-site notices stay.
 */
export type EmailPreference = 'progress_emails' | 'renewal_reminders' | 'follow_ups';
export const EMAIL_PREFERENCES: EmailPreference[] = ['progress_emails', 'renewal_reminders', 'follow_ups'];

export type Preferences = Record<EmailPreference, boolean>;
export const DEFAULT_PREFERENCES: Preferences = { progress_emails: true, renewal_reminders: true, follow_ups: true };

export async function loadPreferences(client: any, userId: string | null | undefined): Promise<Preferences> {
  if (!client || !userId) return { ...DEFAULT_PREFERENCES };
  try {
    const { data, error } = await client
      .from('notification_preferences')
      .select('progress_emails, renewal_reminders, follow_ups')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) console.warn('[Preferences] load failed:', error.message);
    return { ...DEFAULT_PREFERENCES, ...(data || {}) };
  } catch (err) {
    console.warn('[Preferences] load failed:', err);
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function emailAllowed(client: any, userId: string | null | undefined, key: EmailPreference): Promise<boolean> {
  return (await loadPreferences(client, userId))[key] !== false;
}

/** Keeps only known keys with boolean values; null when nothing valid was sent. */
export function sanitizePreferences(body: unknown): Partial<Preferences> | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const out: Partial<Preferences> = {};
  for (const k of EMAIL_PREFERENCES) {
    const v = (body as Record<string, unknown>)[k];
    if (typeof v === 'boolean') out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}
