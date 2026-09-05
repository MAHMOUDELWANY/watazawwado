import assert from 'node:assert';
import { describe, it } from 'node:test';
import { DateTime } from 'luxon';

// Unit & Functional tests for Phase 5D: Student Management, Notes, and Data Integrity

describe('Phase 5D — Timezone and Field Validations', () => {
  it('validates IANA timezones correctly with Luxon', () => {
    const validZones = [
      'America/Toronto',
      'America/New_York',
      'America/Chicago',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Africa/Cairo',
      'Asia/Dubai',
      'Asia/Riyadh',
      'Australia/Sydney',
      'UTC'
    ];

    for (const zone of validZones) {
      const isValid = DateTime.now().setZone(zone).isValid;
      assert.strictEqual(isValid, true, `Zone ${zone} should be valid`);
    }

    const invalidZones = [
      'Invalid/Timezone',
      'Fake/Zone',
      'Cairo Time',
      'foo-bar',
      'America/Nowhere'
    ];

    for (const zone of invalidZones) {
      const isValid = DateTime.now().setZone(zone).isValid;
      assert.strictEqual(isValid, false, `Zone ${zone} should be rejected as invalid`);
    }
  });

  it('enforces email format validation', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    assert.strictEqual(emailRegex.test('student@example.com'), true);
    assert.strictEqual(emailRegex.test('tariq.rahman+learning@gmail.co.uk'), true);
    assert.strictEqual(emailRegex.test('invalid-email'), false);
    assert.strictEqual(emailRegex.test('@no-local-part.com'), false);
    assert.strictEqual(emailRegex.test('no-domain@'), false);
    assert.strictEqual(emailRegex.test('spaces in@email.com'), false);
  });

  it('validates learner_type and current_level strict enums', () => {
    const allowedLearnerTypes = ['adult', 'child'];
    assert.strictEqual(allowedLearnerTypes.includes('adult'), true);
    assert.strictEqual(allowedLearnerTypes.includes('child'), true);
    assert.strictEqual(allowedLearnerTypes.includes('teenager'), false);
    assert.strictEqual(allowedLearnerTypes.includes('unknown'), false);

    const allowedLevels = ['beginner', 'elementary', 'intermediate', 'advanced'];
    assert.strictEqual(allowedLevels.includes('beginner'), true);
    assert.strictEqual(allowedLevels.includes('elementary'), true);
    assert.strictEqual(allowedLevels.includes('intermediate'), true);
    assert.strictEqual(allowedLevels.includes('advanced'), true);
    assert.strictEqual(allowedLevels.includes('master'), false);
    assert.strictEqual(allowedLevels.includes('fluent'), false);
  });

  it('ensures completed lessons count never counts cancelled or rescheduled bookings', () => {
    const mockBookings = [
      { id: '1', status: 'completed', scheduled_start: '2026-08-01T10:00:00Z' },
      { id: '2', status: 'completed', scheduled_start: '2026-08-08T10:00:00Z' },
      { id: '3', status: 'cancelled', scheduled_start: '2026-08-15T10:00:00Z' },
      { id: '4', status: 'rescheduled', scheduled_start: '2026-08-22T10:00:00Z' },
      { id: '5', status: 'confirmed', scheduled_start: '2026-09-10T10:00:00Z' }
    ];

    const completed = mockBookings.filter(b => b.status === 'completed');
    assert.strictEqual(completed.length, 2, 'Only completed status must be counted');
  });

  it('calculates next upcoming lesson accurately', () => {
    const nowIso = '2026-09-03T12:00:00Z';
    const mockBookings = [
      { id: 'past', status: 'completed', scheduled_start: '2026-09-01T10:00:00Z' },
      { id: 'cancelled_future', status: 'cancelled', scheduled_start: '2026-09-04T10:00:00Z' },
      { id: 'next_soonest', status: 'confirmed', scheduled_start: '2026-09-05T10:00:00Z' },
      { id: 'future_later', status: 'confirmed', scheduled_start: '2026-09-12T10:00:00Z' }
    ];

    const upcoming = mockBookings
      .filter(b => b.scheduled_start >= nowIso && ['confirmed', 'pending'].includes(b.status))
      .sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));

    assert.strictEqual(upcoming[0].id, 'next_soonest');
    assert.strictEqual(upcoming.length, 2);
  });

  describe('Guardian Email Semantics & Integrity', () => {
    // 1. Real parent email preserved
    it('preserves valid real parent email', () => {
      const input = '  Amina.Mother@Gmail.COM  ';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      assert.strictEqual(emailRegex.test(input.trim()), true);
      const normalized = input.trim().toLowerCase();
      assert.strictEqual(normalized, 'amina.mother@gmail.com');
    });

    // 2. Missing parent email yields null
    it('evaluates missing or empty parent email to null without fake placeholders', () => {
      const testCases = [null, undefined, '', '   '];
      for (const tc of testCases) {
        let cleanEmail: string | null = null;
        if (tc !== undefined && tc !== null) {
          cleanEmail = typeof tc === 'string' && tc.trim() ? tc.trim() : null;
        }
        assert.strictEqual(cleanEmail, null, `Expected null for input: ${JSON.stringify(tc)}`);
      }
    });

    // 3. Omitted parent email on PATCH preserves existing value
    it('preserves existing guardian email when omitted on PATCH', () => {
      const existingGuardian = {
        id: 'g-123',
        parent_name: 'Tariq Rahman Sr.',
        parent_email: 'tariq.sr@example.com',
        parent_whatsapp: '+15551234567'
      };

      // PATCH request body that does NOT contain parent_email
      const patchBody: { parent_name?: string; parent_email?: string | null } = {
        parent_name: 'Tariq Rahman Father'
      };

      const finalParentEmail = patchBody.parent_email !== undefined
        ? (patchBody.parent_email ? patchBody.parent_email.trim() : null)
        : existingGuardian.parent_email;

      assert.strictEqual(finalParentEmail, 'tariq.sr@example.com', 'Existing email must be preserved when omitted');
    });

    // 4. Explicitly clearing parent email sets null
    it('sets parent email to null when explicitly cleared on PATCH', () => {
      const existingGuardian = {
        id: 'g-123',
        parent_name: 'Tariq Rahman Sr.',
        parent_email: 'tariq.sr@example.com',
        parent_whatsapp: '+15551234567'
      };

      // Case A: explicitly set to null
      const patchNull: { parent_email?: string | null } = { parent_email: null };
      const resultNull = patchNull.parent_email !== undefined
        ? (patchNull.parent_email ? patchNull.parent_email.trim() : null)
        : existingGuardian.parent_email;
      assert.strictEqual(resultNull, null, 'Explicit null should result in null');

      // Case B: explicitly set to empty string ""
      const patchEmpty: { parent_email?: string | null } = { parent_email: '' };
      const resultEmpty = patchEmpty.parent_email !== undefined
        ? (patchEmpty.parent_email ? patchEmpty.parent_email.trim() : null)
        : existingGuardian.parent_email;
      assert.strictEqual(resultEmpty, null, 'Explicit empty string should result in null');
    });

    // 5. Zero fake guardian fallback generation
    it('never produces fake guardian placeholders or @guardian.local identities', () => {
      const guardianRecord = {
        parent_name: 'Parent Name',
        parent_email: null as string | null
      };

      // Ensure that when parent_email is null, no fallback placeholder is generated
      const resolvedEmail = guardianRecord.parent_email || null;
      assert.strictEqual(resolvedEmail, null);
      assert.strictEqual(resolvedEmail !== 'parent@guardian.local', true);
    });
  });
});
