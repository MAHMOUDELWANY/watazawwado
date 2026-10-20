import { describe, it } from 'node:test';
import assert from 'node:assert';
import { firstTouchFrom, sanitizeLeadSource, sourceLabel, isHeardAbout } from '../src/lib/leadSource.js';
import { sourceDetail } from '../server/routes/crm.js';

describe('lead source capture (first touch)', () => {
  it('keeps UTM tags, the outside referrer host and the landing path only', () => {
    const t = firstTouchFrom('?utm_source=instagram&utm_medium=social&utm_content=id12&email=a@b.c', '/pricing', 'https://l.instagram.com/x?y=1', 'watazawwado.academy')!;
    assert.strictEqual(t.utm_source, 'instagram');
    assert.strictEqual(t.utm_content, 'id12');
    assert.strictEqual(t.referrer, 'l.instagram.com');
    assert.strictEqual(t.landing_path, '/pricing');
    assert.ok(!JSON.stringify(t).includes('a@b.c'), 'no other query params are stored');
  });

  it('stores nothing for a direct or internal visit', () => {
    assert.strictEqual(firstTouchFrom('', '/', '', 'watazawwado.academy'), null);
    assert.strictEqual(firstTouchFrom('', '/', 'https://watazawwado.academy/about', 'watazawwado.academy'), null);
  });

  it('server sanitizer drops unknown keys, markup and bad values', () => {
    const s = sanitizeLeadSource({ utm_source: '<script>x', referrer: 'evil.com/path', landing_path: 'http://x', admin: true, at: 'nope' })!;
    assert.deepStrictEqual(s, { utm_source: 'scriptx' });
    assert.strictEqual(sanitizeLeadSource('str'), null);
    assert.strictEqual(sanitizeLeadSource({ landing_path: '/' }), null);
  });

  it('labels and details for the CRM', () => {
    assert.ok(isHeardAbout('youtube') && !isHeardAbout('myspace'));
    assert.strictEqual(sourceLabel(null, 'friend_family'), 'A friend or family');
    assert.strictEqual(sourceLabel({ referrer: 'google.com' }, 'youtube'), 'google.com');
    assert.strictEqual(sourceDetail({ utm_source: 'youtube', utm_medium: 'video' }, 'youtube'), 'youtube / video · heard: YouTube');
    assert.strictEqual(sourceDetail(null, null), null);
  });
});
