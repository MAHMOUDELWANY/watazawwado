import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isValidEmail, pgrstValue, escapeLike } from '../api/index.js';

describe('PostgREST filter safety helpers', () => {
  it('accepts normal emails and rejects filter metacharacters', () => {
    assert.ok(isValidEmail('a.b+c@gmail.com'));
    assert.ok(!isValidEmail('x@y.z,id.eq.123'));
    assert.ok(!isValidEmail('%@gmail.com'));
    assert.ok(!isValidEmail('a(b)@c.com'));
    assert.ok(!isValidEmail('no-at-sign.com'));
  });

  it('quotes values so commas and quotes stay inside one filter value', () => {
    assert.strictEqual(pgrstValue('a,b"c'), '"a,b\\"c"');
    assert.strictEqual(pgrstValue('x\\y'), '"x\\\\y"');
  });

  it('escapes LIKE wildcards', () => {
    assert.strictEqual(escapeLike('50%_off*'), '50\\%\\_off\\*');
  });
});
