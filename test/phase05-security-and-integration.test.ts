/**
 * ====================================================================
 * WATAZAWWADO — PHASE 05 SECURITY / SOURCE-VERIFICATION SUITE
 * File: test/phase05-security-and-integration.test.ts
 *
 * STATIC/SOURCE verification of the security invariants of the new
 * intake + pricing feature. These tests inspect the source + migration
 * to assert the intended guarantees. They do NOT prove production RLS
 * behaviour (no production credentials available) — that is stated
 * explicitly in the file naming and the final report.
 *
 * Invariants:
 *  - browser is never trusted for price or ownership
 *  - AI recommendation is never authoritative
 *  - teacher review cannot be bypassed by the client
 *  - new tables are RLS-enabled; students get SELECT-only
 *  - service-role credentials remain server-only
 *  - new schema does NOT redefine the package/ledger tables
 * ====================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const api = fs.readFileSync(path.join(root, 'api/index.ts'), 'utf-8');
const migration = fs.readFileSync(
  path.join(root, 'supabase/migrations/20261003000000_phase05_ai_intake_and_pricing.sql'),
  'utf-8'
);

describe('Phase 05 — Security & Integration (source-verified)', () => {
  describe('1. Server-authoritative pricing', () => {
    it('intake completion recomputes the recommendation server-side', () => {
      assert.ok(
        api.includes('const recommendation = evaluateAssessment(validated.value.assessment)'),
        'server must recompute recommendation from the validated assessment'
      );
    });
    it('does not read an approved price from the request body on intake endpoints', () => {
      // Scope to the intake endpoints only (the teacher review endpoint is the
      // ONLY place an explicit teacher price is legitimately accepted).
      const intakeTurn = api.slice(api.indexOf("app.post('/api/intake/turn'"), api.indexOf("app.post('/api/intake/complete'"));
      const intakeComplete = api.slice(api.indexOf("app.post('/api/intake/complete'"), api.indexOf("app.get('/api/intake/:id'"));
      for (const [name, slice] of [['turn', intakeTurn], ['complete', intakeComplete]] as const) {
        assert.ok(
          !/req\.body\?\.(approved_price_usd|recommended_price_usd|price)/.test(slice),
          `intake ${name} must not accept a price from the client`
        );
      }
    });
    it('teacher adjust requires an explicit positive server-validated amount', () => {
      assert.ok(api.includes("typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0"));
    });
    it('approve is blocked when no deterministic price exists (forces manual price)', () => {
      assert.ok(api.includes('REVIEW_REQUIRED_MANUAL_PRICE'));
    });
  });

  describe('2. AI output never authoritative', () => {
    it('model output is validated before use', () => {
      assert.ok(api.includes('validateIntakeOutput'));
      assert.ok(api.includes('runIntakeTurn'));
    });
    it('forbidden monetary fields are rejected at the endpoint', () => {
      assert.ok(api.includes('FORBIDDEN_PRICING_FIELDS'));
      assert.ok(api.includes('findForbiddenPricingFields'));
    });
  });

  describe('3. Teacher review cannot be bypassed', () => {
    it('review endpoint is teacher-authorized', () => {
      assert.ok(api.includes("app.post('/api/dashboard/intakes/:id/review', verifyTeacherAuth"));
    });
    it('students can only read their own presented offers', () => {
      assert.ok(api.includes("app.get('/api/student/offers', verifyStudentAuth"));
      assert.ok(api.includes("app.post('/api/student/offers/:id/accept', rateLimit, verifyStudentAuth"));
    });
    it('offer acceptance verifies ownership server-side', () => {
      assert.ok(api.includes('offer.auth_user_id !== authUserId'));
    });
    it('acceptance does NOT imply payment/entitlement (accepted != paid)', () => {
      const accept = api.slice(
        api.indexOf("app.post('/api/student/offers/:id/accept'"),
        api.indexOf("// --------------------------------------------------------------------\n// TEACHER REVIEW")
      );
      assert.ok(accept.includes('purchaseCompleted: false'), 'accept must explicitly report purchase not completed');
      assert.ok(accept.includes('purchaseRequired: true'), 'accept must indicate purchase is still required');
      assert.ok(accept.includes('existing_package_purchase'), 'accept must hand off to the existing purchase flow');
      // Must NOT create entitlements or touch the credit/payment tables.
      assert.ok(!accept.includes('package_entitlements'), 'accept must not create entitlements');
      assert.ok(!accept.includes('package_credit_ledger'), 'accept must not touch the ledger');
      assert.ok(!accept.includes(".from('payments')"), 'accept must not create payments');
    });
    it('intake read verifies ownership server-side', () => {
      assert.ok(api.includes("if (intake.auth_user_id !== authUserId) return res.status(404)"));
    });
    it('teacher_notes are never returned to students', () => {
      const start = api.indexOf("app.get('/api/intake/:id'");
      const end = api.indexOf("app.get('/api/student/offers'");
      const slice = api.slice(start, end).replace(/\/\/[^\n]*/g, ''); // strip comments
      const selectMatch = slice.match(/\.select\('([^']+)'\)/);
      assert.ok(selectMatch, 'intake read must use an explicit select list');
      assert.ok(!selectMatch![1].includes('teacher_notes'), 'student intake read must not select teacher_notes');
    });
  });

  describe('4. Migration safety', () => {
    it('enables RLS on all three new tables', () => {
      for (const table of ['student_intakes', 'learning_offers', 'intake_review_events']) {
        assert.ok(
          migration.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`),
          `RLS must be enabled on ${table}`
        );
      }
    });
    it('gives students SELECT-only ownership policies on intakes', () => {
      assert.ok(migration.includes('"Students read own intakes"'));
      assert.ok(migration.includes('FOR SELECT'));
      assert.ok(!/student_intakes[\s\S]*FOR (INSERT|UPDATE|DELETE)[\s\S]*TO authenticated[\s\S]*auth_user_id = auth\.uid\(\)/.test(migration),
        'students must not get write policies on intakes');
    });
    it('does NOT create or alter the existing package tables', () => {
      for (const t of ['package_catalog', 'package_entitlements', 'package_credit_ledger']) {
        assert.ok(
          !new RegExp(`CREATE TABLE[^;]*${t}`, 'i').test(migration),
          `must not recreate ${t}`
        );
        assert.ok(
          !new RegExp(`ALTER TABLE[^;]*${t}`, 'i').test(migration),
          `must not alter ${t}`
        );
      }
    });
    it('FKs reference only confirmed tables (or the new intake tables)', () => {
      const refs = migration.match(/REFERENCES public\.(\w+)/g) || [];
      // Confirmed existing tables + the three new tables we create here.
      const allowed = new Set([
        'students', 'services',
        'student_intakes', 'learning_offers', 'intake_review_events',
      ]);
      for (const r of refs) {
        const name = r.replace('REFERENCES public.', '');
        assert.ok(allowed.has(name), `unexpected FK target: ${name}`);
      }
    });
  });

  describe('5. Service-role credentials remain server-only', () => {
    it('new client components never reference the service role key', () => {
      const files = [
        'src/components/intake/IntakeConversation.tsx',
        'src/student/pages/StudentOffersPage.tsx',
        'src/dashboard/components/IntakeReviewPanel.tsx',
        'src/dashboard/pages/IntakeReviewPage.tsx',
      ];
      for (const f of files) {
        const src = fs.readFileSync(path.join(root, f), 'utf-8');
        assert.ok(!src.includes('SERVICE_ROLE'), `${f} must not reference service role`);
        assert.ok(!src.includes('supabaseAdmin'), `${f} must not import an admin client`);
      }
    });
  });

  describe('6. Existing Wave 2 preserved', () => {
    it('does not modify the package booking RPC or entitlement migration', () => {
      const bookingRepo = fs.readFileSync(path.join(root, 'src/lib/bookingRepository.ts'), 'utf-8');
      assert.ok(bookingRepo.includes('package_entitlement_id: data.packageEntitlementId || null'));
      assert.ok(!bookingRepo.includes('package_credit_ledger'));
    });
    it('keeps the existing /api/packages catalogue endpoint intact', () => {
      assert.ok(api.includes("'/api/packages'"));
      assert.ok(api.includes("from('package_catalog')"));
    });
  });
});
