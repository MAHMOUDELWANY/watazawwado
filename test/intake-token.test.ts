import test from 'node:test';
import assert from 'node:assert';
import { createIntakeToken, readIntakeToken } from '../server/intake/intakeToken';

test('intake token: only the unedited, own, fresh AI result is accepted', () => {
  const secret = 'server-secret';
  const assessment = { service_category: 'quran', level: 'beginner' };
  const token = createIntakeToken('user-1', { goal: 'read' }, assessment, secret, 1_000);

  assert.deepStrictEqual(readIntakeToken(token, 'user-1', secret, 2_000)?.assessment, assessment);
  assert.strictEqual(readIntakeToken(token, 'user-2', secret, 2_000), null, 'another account');
  assert.strictEqual(readIntakeToken(token, 'user-1', 'other-secret', 2_000), null, 'forged signature');
  assert.strictEqual(readIntakeToken(token, 'user-1', secret, 1_000 + 25 * 3600_000), null, 'expired');

  const [body, sig] = token.split('.');
  const edited = JSON.parse(Buffer.from(body, 'base64url').toString());
  edited.a.service_category = 'english';
  assert.strictEqual(readIntakeToken(`${Buffer.from(JSON.stringify(edited)).toString('base64url')}.${sig}`, 'user-1', secret, 2_000), null, 'edited assessment');
  assert.strictEqual(readIntakeToken(undefined, 'user-1', secret), null);
});
