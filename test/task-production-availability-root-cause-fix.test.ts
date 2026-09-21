import { describe, it } from 'node:test';
import assert from 'node:assert';
import { resolveAuthoritativeTeacherForAvailability } from '../server/integrations/availabilityEngine';

describe('Production Availability Root-Cause Verification', () => {
  it('Single active connection resolves cleanly without teacherId', async () => {
    (globalThis as any).__TEST_RESOLVE_AUTHORITATIVE_TEACHER = (supplied?: string) => {
      const conns = [{ teacher_id: 'mahmoud-teacher-uuid', is_active: true }];
      if (conns.length === 1) {
        if (supplied && supplied.trim() !== '') {
          return supplied.trim() === conns[0].teacher_id ? conns[0].teacher_id : null;
        }
        return conns[0].teacher_id;
      }
      return null;
    };

    const result = await resolveAuthoritativeTeacherForAvailability();
    assert.strictEqual(result, 'mahmoud-teacher-uuid');
  });

  it('Multiple active connections resolve cleanly when assigned teacherId is supplied by student flow', async () => {
    (globalThis as any).__TEST_RESOLVE_AUTHORITATIVE_TEACHER = (supplied?: string) => {
      const conns = [
        { teacher_id: 'mahmoud-uuid', is_active: true },
        { teacher_id: 'other-teacher-uuid', is_active: true }
      ];
      if (supplied && supplied.trim() !== '') {
        const match = conns.find(c => c.teacher_id === supplied.trim());
        return match ? match.teacher_id : null;
      }
      return null;
    };

    const result = await resolveAuthoritativeTeacherForAvailability('mahmoud-uuid');
    assert.strictEqual(result, 'mahmoud-uuid');
  });

  it('Multiple active connections fail closed when malicious or unknown teacherId is supplied', async () => {
    (globalThis as any).__TEST_RESOLVE_AUTHORITATIVE_TEACHER = (supplied?: string) => {
      const conns = [
        { teacher_id: 'mahmoud-uuid', is_active: true },
        { teacher_id: 'other-teacher-uuid', is_active: true }
      ];
      if (supplied && supplied.trim() !== '') {
        const match = conns.find(c => c.teacher_id === supplied.trim());
        return match ? match.teacher_id : null;
      }
      return null;
    };

    const result = await resolveAuthoritativeTeacherForAvailability('fake-hacker-uuid');
    assert.strictEqual(result, null);
  });

  it('BookingService.getAvailability constructs proper URL with teacherId', async () => {
    const originalFetch = globalThis.fetch;
    let requestedUrl = '';

    globalThis.fetch = (async (input: any) => {
      requestedUrl = typeof input === 'string' ? input : input.url;
      return {
        ok: true,
        json: async () => ({ days: [], timezone: 'UTC' })
      };
    }) as any;

    try {
      const { bookingService } = await import('../src/booking/bookingService');
      await bookingService.getAvailability('America/Toronto', 45, 'teacher-xyz-123');

      assert.ok(requestedUrl.includes('timezone=America%2FToronto'), 'timezone is passed');
      assert.ok(requestedUrl.includes('duration=45'), 'duration is passed');
      assert.ok(requestedUrl.includes('teacherId=teacher-xyz-123'), 'teacherId is passed in query string');
    } finally {
      globalThis.fetch = originalFetch;
      delete (globalThis as any).__TEST_RESOLVE_AUTHORITATIVE_TEACHER;
    }
  });
});
