/**
 * ====================================================================
 * WATAZAWWADO — GEMINI PROVIDER ERROR DIAGNOSTIC SANITIZER TESTS
 * File: test/phase05-gemini-provider-error-diagnostics.test.ts
 *
 * Proves the TEMPORARY diagnostic instrumentation:
 *  - classifies provider errors into the required buckets
 *  - emits only flat scalar metadata
 *  - redacts API keys, bearer tokens, and JWTs
 *  - never surfaces request/message/secret material
 * ====================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeProviderError,
  sanitizeProviderErrorMessage,
} from '../server/intake/intakeService.js';

describe('Phase 05 — Gemini provider error diagnostics (sanitized)', () => {
  it('classifies RESOURCE_EXHAUSTED / rate limit / quota', () => {
    const e: any = new Error('got status: 429. RESOURCE_EXHAUSTED: quota exceeded');
    e.name = 'ApiError';
    e.status = 429;
    const s = sanitizeProviderError(e);
    assert.equal(s.classification, 'RESOURCE_EXHAUSTED_OR_RATE_LIMIT');
    assert.equal(s.status, 429);
    assert.equal(s.name, 'ApiError');
  });

  it('classifies UNAVAILABLE / temporary overload', () => {
    const e: any = new Error('The service is currently unavailable. Please try again.');
    e.name = 'ApiError';
    e.status = 503;
    const s = sanitizeProviderError(e);
    assert.equal(s.classification, 'UNAVAILABLE_OR_OVERLOAD');
    assert.equal(s.status, 503);
  });

  it('classifies INVALID_ARGUMENT / structured-output rejection', () => {
    const e: any = new Error('Invalid value at generation_config.response_schema');
    e.name = 'ApiError';
    e.status = 400;
    const s = sanitizeProviderError(e);
    assert.equal(s.classification, 'INVALID_ARGUMENT');
  });

  it('classifies MODEL_NOT_FOUND / model availability', () => {
    const e: any = new Error('models/gemini-x is not found for API version v1beta');
    e.name = 'ApiError';
    e.status = 404;
    const s = sanitizeProviderError(e);
    assert.equal(s.classification, 'MODEL_NOT_FOUND');
  });

  it('classifies anything else as OTHER', () => {
    const e: any = new Error('socket hang up');
    const s = sanitizeProviderError(e);
    assert.equal(s.classification, 'OTHER');
    assert.equal(s.status, null);
    assert.equal(s.code, null);
  });

  it('emits only flat scalar metadata (no nested objects/arrays)', () => {
    const e: any = new Error('boom');
    e.status = 500;
    e.code = 'INTERNAL';
    e.error = { status: 'INTERNAL', code: 500, details: [{ nested: true }] };
    const s = sanitizeProviderError(e);
    for (const [k, v] of Object.entries(s)) {
      assert.ok(
        v === null || ['string', 'number'].includes(typeof v),
        `field ${k} must be a scalar, got ${typeof v}`
      );
    }
    assert.equal(s.providerStatus, 'INTERNAL');
    assert.equal(s.code, 'INTERNAL');
  });

  it('redacts Google API keys, bearer tokens, and JWTs from messages', () => {
    const msg =
      'auth failed key=AIzaSyFAKEfakeFAKEfakeFAKEfakeFAKEfake123 ' +
      'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payloadpart.sigpart ' +
      'token=eyJhbGciOiJIUzI1NiJ9.abc123def456.ghi789jkl012';
    const out = sanitizeProviderErrorMessage(msg);
    assert.equal(out.includes('AIzaSyFAKEfakeFAKEfakeFAKEfakeFAKEfake123'), false);
    assert.equal(/eyJ[A-Za-z0-9_-]{6,}\./.test(out), false);
    assert.ok(out.includes('[REDACTED_API_KEY]'));
    assert.ok(out.includes('[REDACTED_JWT]') || out.includes('Bearer [REDACTED]'));
  });

  it('bounds message length so raw payloads cannot be dumped', () => {
    const out = sanitizeProviderErrorMessage('x'.repeat(5000), 600);
    assert.ok(out.length <= 600 + '…[truncated]'.length);
    assert.ok(out.endsWith('…[truncated]'));
  });

  it('never includes the request body, messages, or headers', () => {
    const e: any = new Error('provider failed');
    e.status = 503;
    (e as any).request = { body: 'SECRET_STUDENT_MESSAGE', headers: { authorization: 'Bearer SECRET' } };
    const s = sanitizeProviderError(e);
    const serialized = JSON.stringify(s);
    assert.equal(serialized.includes('SECRET_STUDENT_MESSAGE'), false);
    assert.equal(serialized.includes('SECRET'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(s, 'request'), false);
  });
});
