/**
 * Leaked-password check (free replacement for Supabase's Pro-only setting).
 * Uses the Have I Been Pwned range API with k-anonymity: only the first 5 characters
 * of the password's SHA-1 hash leave the browser, never the password or the full hash.
 * Fails open (returns false) if the service can't be reached, so sign-up never breaks.
 * shortcut: runs in the browser, so a script calling Supabase directly can skip it; it protects
 * real users choosing a leaked password, which is the goal. Upgrade to Supabase's server setting on Pro.
 */
export async function isPasswordLeaked(password: string): Promise<boolean> {
  try {
    const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
    const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: controller.signal
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return false;

    const body = await res.text();
    return body.split('\n').some(line => {
      const [lineSuffix, count] = line.trim().split(':');
      return lineSuffix === suffix && Number(count) > 0; // padding rows have count 0
    });
  } catch {
    return false;
  }
}

export const LEAKED_PASSWORD_MESSAGE =
  'This password has appeared in a data leak, so it is not safe. Please choose a different one. / كلمة المرور دي ظهرت في تسريب بيانات قبل كده ومش آمنة، اختار كلمة مرور تانية.';
