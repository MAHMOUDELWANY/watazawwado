import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { installMode } from '../src/student/components/InstallHint.js';

const base = { standalone: false, narrow: true, ua: 'Mozilla/5.0 (Linux; Android 14)', canPrompt: false, dismissed: false };

describe('ST-07 install as an app', () => {
  it('the manifest opens the portal, with maskable icons', () => {
    const m = JSON.parse(fs.readFileSync('public/site.webmanifest', 'utf8'));
    assert.strictEqual(m.start_url, '/student');
    assert.strictEqual(m.display, 'standalone');
    const maskable = m.icons.filter((i: any) => i.purpose === 'maskable');
    assert.deepStrictEqual(maskable.map((i: any) => i.sizes).sort(), ['192x192', '512x512']);
    for (const i of m.icons) assert.ok(fs.existsSync(`public${i.src}`), i.src);
  });

  it('no service worker caches anything', () => {
    const files = ['index.html', 'src/main.tsx', 'src/student/components/InstallHint.tsx'];
    for (const f of files) assert.ok(!/serviceWorker\.register/.test(fs.readFileSync(f, 'utf8')), f);
  });

  it('the hint shows on phones only, once, and never inside the installed app', () => {
    assert.strictEqual(installMode({ ...base, canPrompt: true }), 'prompt');
    assert.strictEqual(installMode({ ...base, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari' }), 'ios');
    assert.strictEqual(installMode({ ...base, ua: 'Mozilla/5.0 (iPhone) CriOS/120' }), null, 'the iOS steps are written for Safari only');
    assert.strictEqual(installMode(base), null, 'nothing to offer');
    assert.strictEqual(installMode({ ...base, canPrompt: true, standalone: true }), null);
    assert.strictEqual(installMode({ ...base, canPrompt: true, narrow: false }), null);
    assert.strictEqual(installMode({ ...base, canPrompt: true, dismissed: true }), null);
  });
});
