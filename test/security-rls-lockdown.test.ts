import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

// Security review 2026-10-21: browser roles must not read money or write bookings/payments/packages, and the
// old "any active teacher" policies admit only the super admin. Verified on production as a teacher session
// (rolled-back transaction): 0 payments, 0 packages, 0 leads/availability/ai_knowledge rows, no fee/token column.
const lockdown = fs.readFileSync('supabase/migrations/20261021000000_browser_roles_money_lockdown.sql', 'utf8');
const allowlist = fs.readFileSync('supabase/migrations/20261021000001_teacher_allowlist_to_super_admin.sql', 'utf8');

describe('RLS lockdown (security review 2026-10-21)', () => {
  it('payments are readable by the super admin only', () => {
    assert.match(lockdown, /ALTER POLICY "Active teachers read payments" ON public\.payments\s+USING \(public\.is_super_admin\(\)\)/);
  });

  it('browser roles cannot write bookings, payments or packages', () => {
    for (const t of ['bookings', 'payments', 'package_entitlements']) {
      assert.match(lockdown, new RegExp(`REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER ON public\\.${t} FROM anon, authenticated`));
    }
  });

  it('the booking fee and management token are not in the browser column grant', () => {
    const grant = lockdown.slice(lockdown.indexOf('GRANT SELECT ('));
    assert.ok(grant.length > 20);
    assert.ok(!/fee_amount_usd|management_token/.test(grant.slice(0, grant.indexOf(') ON public.bookings'))));
  });

  it('every former teacher allowlist policy now checks is_super_admin()', () => {
    const tables = [...allowlist.matchAll(/ALTER POLICY "Teacher allowlist access to (\w+)" ON public\.\1\s+USING \(public\.is_super_admin\(\)\) WITH CHECK \(public\.is_super_admin\(\)\)/g)].map(m => m[1]);
    assert.deepStrictEqual(tables.sort(), ['ai_knowledge', 'analytics_events', 'availability', 'blog_posts', 'guardians', 'leads', 'lesson_sessions', 'profiles', 'reminders', 'student_goals', 'student_progress', 'testimonials']);
  });
});
