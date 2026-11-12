import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('P4 quick wins', () => {
  it('P4-039: the ribbon never blends gold straight into teal (that mix is olive green)', () => {
    const css = src('src/index.css');
    const ribbons = (css.match(/\.text-ribbon\s*\{[^}]*\}/g) || []).filter((r) => r.includes('linear-gradient'));
    assert.ok(ribbons.length >= 2);
    for (const r of ribbons) assert.ok(r.includes('#D8C6AE'), r);
    assert.ok(!/E5A93C 55%, var\(--teal\)/.test(css));
  });

  it('P4-011: the language gate starts on the device language and goes on with one tap', () => {
    const gate = src('src/components/public/LanguageWelcome.tsx');
    assert.ok(gate.includes('setPicked(s);'));
    assert.ok(gate.includes('const tap = (lang: Language) => { setPicked(lang); go(lang); };'));
    assert.ok(!/lw-eyebrow \{[^}]*uppercase/.test(src('src/index.css')));
  });

  it('P4-033: a trial shows age, goal and placement, and a teacher never gets the family email', () => {
    const api = src('api/index.ts');
    assert.ok(api.includes("if (!isAdmin) { t.contact_email = ''; t.contact_whatsapp = null; }"));
    assert.ok(api.includes('t.placement = placement ?'));
    assert.ok(src('src/dashboard/pages/TrialsPage.tsx').includes('data-testid="trial-prep"'));
  });

  it('P4-034: phones type their hours before the grid', () => {
    const page = src('src/dashboard/pages/AvailabilityPage.tsx');
    assert.ok(page.includes('<div className="order-2 md:order-none">'));
    assert.ok(page.includes("'Type your hours'"));
  });

  it('P4-036: admin numbers leave out +qa- accounts on production', () => {
    const api = src('api/index.ts');
    const start = api.indexOf("app.get('/api/dashboard/overview-metrics'");
    const route = api.slice(start, api.indexOf('// 17. DASHBOARD', start));
    assert.ok(route.includes("const hideQa = process.env.VERCEL_ENV === 'production';"));
    assert.ok(route.includes('.is.null,${col}.not.ilike.*+qa-*'));
    assert.equal((route.match(/noQa\(supabase/g) || []).length, 9);
  });
});
