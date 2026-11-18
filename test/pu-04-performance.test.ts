import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('PU-04 performance', () => {
  it('the hero visual never starts invisible', () => {
    // The intro film's poster (bag + play button) is plain markup, painted on first load; scenes animate only after play.
    const film = fs.readFileSync('src/components/public/homepage/IntroFilm.tsx', 'utf8');
    const poster = film.slice(film.indexOf('// Poster:'), film.indexOf('{/* Zad rides along'));
    assert.ok(poster.length > 100);
    assert.ok(!/initial=/.test(poster));
    assert.ok(film.includes('preload="none"'), 'the voice-over loads only on play');
  });

  it('hashed bundles are cached for a year, fonts and media for shorter', () => {
    const cfg = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    const rule = (src: string) => cfg.headers.find((h: any) => h.source === src)?.headers.find((x: any) => x.key === 'Cache-Control')?.value;
    assert.strictEqual(rule('/assets/(.*)'), 'public, max-age=31536000, immutable');
    assert.match(rule('/fonts/(.*)'), /max-age=2592000/);
    assert.match(rule('/(.*)\\.(jpg|jpeg|png|webp|svg|mp3)'), /max-age=86400/);
    // HTML and the API keep their own (no long cache): no rule may cover them.
    for (const h of cfg.headers) {
      const cc = h.headers.find((x: any) => x.key === 'Cache-Control');
      if (cc) assert.ok(!['/(.*)', '/api/(.*)'].includes(h.source), h.source);
    }
  });
});
