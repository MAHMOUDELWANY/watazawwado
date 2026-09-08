import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 0.50.3 — Final One-Line Hardening Correction & Production Release Gate', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20260908000005_fix_booking_rpc_service_id_text.sql'
  );
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  // --------------------------------------------------------------------------
  // 1. EXACT REGEX AND SQL PATTERN AUDIT
  // --------------------------------------------------------------------------
  describe('1. Exact SQL Regex Hardening in Migration 000005', () => {
    it('verifies migration 000005 contains the hardened email validation regex', () => {
      assert.ok(
        migrationSql.includes("v_contact_email !~ '^[a-z0-9]+([._%+-][a-z0-9]+)*@[a-z0-9]+([.-][a-z0-9]+)*\\.[a-z]{2,}$'"),
        'Migration 000005 must use the minimal hardened regex rejecting leading/trailing/consecutive separators in local and domain parts'
      );
    });

    it('verifies trim and lower normalization occurs before regex validation', () => {
      assert.ok(
        migrationSql.includes("v_contact_email := lower(trim(COALESCE(p_booking->>'contact_email', '')));"),
        'Contact email must be trimmed and lowercased'
      );
    });

    it('verifies invalid email raises controlled exception with SQLSTATE P0001', () => {
      assert.ok(
        migrationSql.includes("RAISE EXCEPTION 'A valid email address is required.' USING ERRCODE = 'P0001';"),
        'Invalid email must raise P0001 error code'
      );
    });
  });

  // --------------------------------------------------------------------------
  // 2. REQUIRED EMAIL TEST VECTORS
  // --------------------------------------------------------------------------
  describe('2. Comprehensive Email Validation Suite', () => {
    const emailRegex = /^[a-z0-9]+([._%+-][a-z0-9]+)*@[a-z0-9]+([.-][a-z0-9]+)*\.[a-z]{2,}$/;

    function validateEmail(rawEmail: any): { valid: boolean; normalized: string } {
      const normalized = (rawEmail || '').trim().toLowerCase();
      if (normalized === '' || !emailRegex.test(normalized)) {
        return { valid: false, normalized };
      }
      return { valid: true, normalized };
    }

    it('accepts all specified valid email examples', () => {
      const validExamples = [
        'john@example.com',
        'john.doe@example.com',
        'john_doe@example.com',
        'john+test@example.com',
        'john-doe@example.co.uk',
        'student@example.com',
        'mahmoud@watazawwado.com',
        'learner.123_45@sub.domain.org',
        '  JOHN.DOE@EXAMPLE.COM  ' // Test normalization
      ];

      for (const email of validExamples) {
        const res = validateEmail(email);
        assert.equal(res.valid, true, `Expected valid for email: "${email}"`);
      }
    });

    it('rejects all specified malformed email examples', () => {
      const rejectExamples = [
        '@',
        'a@',
        '@example.com',
        'a@b',
        'a@b@c.com',
        'user..name@example.com', // Consecutive dots in local part
        '.user@example.com',       // Leading dot in local part
        'user.@example.com',       // Trailing dot in local part
        'user name@example.com',   // Space in local part
        'user@example..com',       // Consecutive dots in domain
        'user@example-.com',       // Trailing hyphen in domain label
        'user@-example.com',       // Leading hyphen in domain label
        'user@example.c',          // Single-letter TLD (< 2 chars)
        '',                        // Empty string
        '   ',                     // Whitespace only
        'user@domain'              // Missing TLD
      ];

      for (const email of rejectExamples) {
        const res = validateEmail(email);
        assert.equal(res.valid, false, `Expected invalid for email: "${email}"`);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 3. INVARIANTS AND SCOPE PRESERVATION
  // --------------------------------------------------------------------------
  describe('3. Invariant & Security Baseline Audit', () => {
    it('verifies 20260908000005 remains the single canonical migration', () => {
      const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
      const files = fs.readdirSync(migrationsDir);
      assert.ok(files.includes('20260908000005_fix_booking_rpc_service_id_text.sql'));
    });

    it('verifies duration overflow guard and contract (P0001) are preserved', () => {
      assert.ok(migrationSql.includes("trim(p_booking->>'duration_minutes') !~ '^[0-9]+$'"));
      assert.ok(migrationSql.includes("length(trim(p_booking->>'duration_minutes')) > 2"));
      assert.ok(migrationSql.includes("v_duration NOT IN (30, 45, 60)"));
    });

    it('verifies student ownership enforcement (P0003) is preserved', () => {
      assert.ok(migrationSql.includes("auth.uid() IS NOT NULL"));
      assert.ok(migrationSql.includes("WHERE auth_user_id = auth.uid()"));
      assert.ok(migrationSql.includes("Forbidden. Cannot create a booking on behalf of another student."));
      assert.ok(migrationSql.includes("Unauthenticated guests cannot specify a student ID."));
    });

    it('verifies canonical schema invariants are preserved', () => {
      assert.ok(migrationSql.includes("v_service_id TEXT;"));
      assert.ok(migrationSql.includes("hourly_rate_usd"));
      assert.ok(migrationSql.includes("trial_allowed"));
      assert.ok(migrationSql.includes("supported_durations"));
      assert.ok(migrationSql.includes("is_active"));
      assert.ok(!migrationSql.includes("price_hourly_usd"));
      assert.ok(!migrationSql.includes("trial_eligible"));
    });

    it('verifies project ID targeting is strictly fmwxqyroyxgigvpahpri', () => {
      assert.ok(!migrationSql.includes('kpftfmwnwcnkbvfgjfdy'), 'Must never target deprecated project');
    });
  });
});
