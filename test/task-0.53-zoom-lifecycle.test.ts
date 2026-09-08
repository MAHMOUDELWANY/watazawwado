import assert from 'node:assert';
import { describe, it, before, after } from 'node:test';
import { updateZoomMeeting, deleteZoomMeeting } from '../server/integrations/zoom.js';

describe('Task 0.53.1: Zoom Lifecycle Behavioral Tests', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env.ZOOM_ACCOUNT_ID;
  
  before(() => {
    process.env.ZOOM_ACCOUNT_ID = 'test-account';
    process.env.ZOOM_CLIENT_ID = 'test-client';
    process.env.ZOOM_CLIENT_SECRET = 'test-secret';
  });

  after(() => {
    globalThis.fetch = originalFetch;
    process.env.ZOOM_ACCOUNT_ID = originalEnv;
  });

  it('updateZoomMeeting should make a PATCH request with correct payload', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody: any = null;

    globalThis.fetch = async (url: any, options: any) => {
      // Mock OAuth token fetch
      if (url.toString().includes('oauth/token')) {
        return {
          ok: true,
          json: async () => ({ access_token: 'mock-token', expires_in: 3599 })
        } as any;
      }

      capturedUrl = url.toString();
      capturedMethod = options.method;
      capturedBody = JSON.parse(options.body);

      return {
        status: 204,
        ok: true
      } as any;
    };

    await updateZoomMeeting('meeting-123', {
      scheduledStartUtc: '2027-01-01T10:00:00.000Z',
      durationMinutes: 45
    });

    assert.strictEqual(capturedMethod, 'PATCH');
    assert.ok(capturedUrl.includes('meeting-123'));
    assert.strictEqual(capturedBody.duration, 45);
    assert.strictEqual(capturedBody.start_time, '2027-01-01T10:00:00Z');
  });

  it('deleteZoomMeeting should make a DELETE request', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    globalThis.fetch = async (url: any, options: any) => {
      // Mock OAuth token fetch
      if (url.toString().includes('oauth/token')) {
        return {
          ok: true,
          json: async () => ({ access_token: 'mock-token', expires_in: 3599 })
        } as any;
      }

      capturedUrl = url.toString();
      capturedMethod = options.method;

      return {
        status: 204,
        ok: true
      } as any;
    };

    await deleteZoomMeeting('meeting-456');

    assert.strictEqual(capturedMethod, 'DELETE');
    assert.ok(capturedUrl.includes('meeting-456'));
  });

  it('deleteZoomMeeting should handle 404 as success', async () => {
    let capturedUrl = '';
    let capturedMethod = '';

    globalThis.fetch = async (url: any, options: any) => {
      // Mock OAuth token fetch
      if (url.toString().includes('oauth/token')) {
        return {
          ok: true,
          json: async () => ({ access_token: 'mock-token', expires_in: 3599 })
        } as any;
      }

      capturedUrl = url.toString();
      capturedMethod = options.method;

      return {
        status: 404,
        ok: false,
        text: async () => 'Not Found'
      } as any;
    };

    // Should not throw
    await deleteZoomMeeting('meeting-789');

    assert.strictEqual(capturedMethod, 'DELETE');
    assert.ok(capturedUrl.includes('meeting-789'));
  });
  
  it('updateZoomMeeting should throw on 404', async () => {
    globalThis.fetch = async (url: any, options: any) => {
      // Mock OAuth token fetch
      if (url.toString().includes('oauth/token')) {
        return {
          ok: true,
          json: async () => ({ access_token: 'mock-token', expires_in: 3599 })
        } as any;
      }
      return {
        status: 404,
        ok: false,
        text: async () => 'Not Found'
      } as any;
    };

    try {
      await updateZoomMeeting('meeting-999', {
        scheduledStartUtc: '2027-01-01T10:00:00.000Z',
        durationMinutes: 45
      });
      assert.fail('Should have thrown on 404');
    } catch (err: any) {
      assert.ok(err.message.includes('ZOOM_NOT_FOUND'));
    }
  });
});
