import test from 'node:test';
import assert from 'node:assert/strict';
import { proxiedSupabaseUrl } from '../src/lib/supabase';

const PROJECT = 'https://abc.supabase.co';
const ORIGIN = 'https://watazawwado.academy';

test('proxiedSupabaseUrl maps project requests onto our /sb route, keeping path and query', () => {
  assert.equal(
    proxiedSupabaseUrl(`${PROJECT}/auth/v1/token?grant_type=password`, PROJECT, ORIGIN),
    `${ORIGIN}/sb/auth/v1/token?grant_type=password`
  );
  assert.equal(proxiedSupabaseUrl(`${PROJECT}/rest/v1/services?select=id`, `${PROJECT}/`, ORIGIN), `${ORIGIN}/sb/rest/v1/services?select=id`);
});

test('proxiedSupabaseUrl leaves every other request alone', () => {
  assert.equal(proxiedSupabaseUrl(`${ORIGIN}/api/health`, PROJECT, ORIGIN), null);
  assert.equal(proxiedSupabaseUrl('https://abc.supabase.co.evil.com/auth/v1/token', PROJECT, ORIGIN), null);
  assert.equal(proxiedSupabaseUrl(`${PROJECT}/auth/v1/token`, undefined, ORIGIN), null);
});
