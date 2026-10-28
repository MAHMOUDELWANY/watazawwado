import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p: string) => fs.readFileSync(p, 'utf8');
const routes = read('server/routes/payroll.ts');

describe('Teacher pay routes (launch plan D)', () => {
  it('admin endpoints are super admin only', () => {
    for (const path of ["'/api/dashboard/payroll'", "'/api/dashboard/payroll/rates/:teacherId'", "'/api/dashboard/payroll/adjustments'", "'/api/dashboard/payroll/adjustments/:id'", "'/api/dashboard/payroll/payouts'"]) {
      const i = routes.indexOf(path);
      assert.ok(i > 0, path);
      assert.match(routes.slice(i, i + 160), /deps\.requireSuperAdmin/, path);
    }
  });

  it('a teacher only ever reads their own pay, outside the dashboard money filter', () => {
    const i = routes.indexOf("'/api/teacher-pay/me'");
    assert.match(routes.slice(i, i + 600), /loadMonth\(client, req\.teacherUser\.id, month\)/);
    assert.match(read('api/index.ts'), /registerPayrollRoutes\(app, \{/);
  });

  it('pay never reads what students paid', () => {
    assert.doesNotMatch(routes, /fee_amount_usd|from\('payments'\)/);
    assert.doesNotMatch(read('server/payroll/payroll.ts'), /fee_amount|price_paid/);
  });

  it('the payout amount is computed on the server, only for an ended month, once', () => {
    assert.match(routes, /if \(month >= currentMonth\(\)\) return res\.status\(400\)/);
    assert.match(routes, /amount: statement\.total, currency: statement\.currency/);
    assert.match(routes, /if \(payout\) return res\.status\(409\)/);
    assert.match(routes, /eventType: 'payslip'/);
  });

  it('teacher absent is admin only; a technical problem by the lesson\'s own teacher or admin', () => {
    assert.match(routes, /if \(!isAdmin && \(reason === 'teacher_absent' \|\| booking\.teacher_id !== req\.teacherUser\.id\)\)/);
    const sql = read('supabase/migrations/20261028000000_teacher_pay.sql');
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.record_lesson_not_held\(UUID, TEXT\) TO service_role;/);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.record_lesson_not_held\(UUID, TEXT\) FROM authenticated;/);
  });
});
