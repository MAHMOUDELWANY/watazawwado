import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { BOOKABLE_SERVICES } from '../src/booking/mockData.js';
import { findSubjectPage } from '../src/data/subjectPages.js';
import { SERVICES_DATA } from '../src/data/content.js';

const read = (p: string) => fs.readFileSync(p, 'utf8');
const DIR = 'src/components/public/homepage/';

describe('homepage redesign 2026-11-18 ("the zaad")', () => {
  it('the bag offers exactly the 8 bookable subjects, and every page it links to exists', () => {
    const pack = read(DIR + 'PackYourZaad.tsx');
    const ids = [...pack.matchAll(/\{ id: '([a-z-]+)', glyph:/g)].map((m) => m[1]);
    assert.deepStrictEqual(ids, ['quran-reading', 'tajweed', 'quran-memorization', 'zad-essentials', 'seerah', 'modern-standard-arabic', 'egyptian-arabic', 'english']);
    for (const id of ids) assert.ok(BOOKABLE_SERVICES.some((s) => s.id === id), id);
    for (const slug of new Set([...pack.matchAll(/'((?:online|learn|islamic)-[a-z-]+)'/g)].map((m) => m[1]))) {
      assert.ok(findSubjectPage(slug), slug);
    }
    // The free lesson starts with the first packed subject preselected.
    assert.ok(pack.includes('onClick={() => onTrial(first)}'));
  });

  it('track links open real subject families, and track prices match the catalogue', () => {
    const tracks = read(DIR + 'Tracks.tsx');
    for (const m of tracks.matchAll(/\/learning\?family=([a-z_]+)/g)) assert.ok(SERVICES_DATA.some((p) => p.id === m[1]), m[1]);
    const rate = (id: string) => BOOKABLE_SERVICES.find((s) => s.id === id)!.hourlyRateUsd;
    assert.strictEqual(rate('quran-reading'), 10);
    assert.strictEqual(rate('modern-standard-arabic'), 13);
    assert.strictEqual(rate('english'), 13);
    assert.match(tracks, /key: 'quran'[\s\S]*?\$10 an hour[\s\S]*?key: 'arabic'[\s\S]*?\$13 an hour[\s\S]*?key: 'english'[\s\S]*?\$13 an hour/);
  });

  it('no person is at the centre of the homepage (RULES.md §6b)', () => {
    for (const f of fs.readdirSync(DIR)) {
      const s = read(DIR + f);
      assert.doesNotMatch(s, /Mahmoud|Afnan|محمود|أفنان|ustadh-mahmoud|teacher-afnan/i, f);
    }
  });

  it('every picture the homepage uses is in public/', () => {
    const files = fs.readdirSync(DIR).map((f) => read(DIR + f)).join('\n');
    const paths = new Set([...files.matchAll(/"(\/(?:home|curriculum\/banners)\/[a-z0-9-]+\.webp)/g), ...files.matchAll(/'(\/(?:home|curriculum\/banners)\/[a-z0-9-]+\.webp)/g)].map((m) => m[1]));
    assert.ok(paths.size >= 7, String(paths.size));
    for (const p of paths) assert.ok(fs.existsSync('public' + p), p);
  });

  it('section entrances never hide prerendered content', () => {
    const hook = read(DIR + 'useReveal.ts');
    assert.ok(hook.includes("classList.add('rv-ready')"));
    assert.ok(hook.includes('prefers-reduced-motion: reduce'));
    const css = read('src/index.css');
    assert.match(css, /\.rv-ready \.rv \{ opacity: 0;/);
    assert.doesNotMatch(css, /^\.rv \{[^}]*opacity: 0/m);
  });
});
