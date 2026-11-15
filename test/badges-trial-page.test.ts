import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

// Trial page for the new badge set (owner, 2026-11-15): routes, every render it shows, and the silent reveal.
const page = fs.readFileSync('src/components/public/badges/BadgesPreviewPage.tsx', 'utf8');

test('the trial page is routed in both languages', () => {
  const app = fs.readFileSync('src/App.tsx', 'utf8');
  assert.match(app, /path="\/badges"/);
  assert.match(app, /path="\/ar\/badges"/);
});

test('every badge on the page has its render, and numbered ones an Arabic-digit render too', () => {
  const ids = [...page.matchAll(/\{ id: '([a-z0-9-]+)', fam: '/g)].map((m) => m[1]);
  assert.strictEqual(ids.length, 24);
  for (const id of ids) {
    assert.ok(fs.existsSync(`public/badges/shelf/${id}.webp`), id);
    const line = page.split('\n').find((l) => l.includes(`id: '${id}', fam:`))!;
    if (line.includes('num: true')) assert.ok(fs.existsSync(`public/badges/shelf/${id}-ar.webp`), `${id}-ar`);
  }
});

test('the reveal plays muted and its files carry no sound track', () => {
  assert.match(page, /reveal\.mp4" muted/);
  for (const f of ['reveal.mp4', 'idle.mp4']) {
    const buf = fs.readFileSync(`public/badges/ruby-khatam/${f}`);
    assert.ok(!buf.includes(Buffer.from('soun')), `${f} has an audio track`); // mp4 handler type of an audio track
  }
});
