import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('PU-04b hydrate prerendered public pages', () => {
  const main = fs.readFileSync('src/main.tsx', 'utf8');
  const app = fs.readFileSync('src/App.tsx', 'utf8');

  it('hydrates only a prerendered page built in the visitor language; account areas still render from scratch', () => {
    assert.ok(main.includes("root.hasAttribute('data-prerendered') && getStoredLanguage() === pathLanguage(pathname)"));
    assert.ok(main.includes('hydrateRoot(root, app)'));
    assert.ok(main.includes('createRoot(root).render(app)'));
    const prerender = fs.readFileSync('scripts/prerender-seo.ts', 'utf8');
    // The fallback summary is not the React tree, so only a real render gets the marker.
    assert.ok(prerender.includes('body ? `<div id="root" data-prerendered>${body}</div>` : `<div id="root">${summary}</div>`'));
  });

  it('every lazy public page can be loaded before hydration', () => {
    assert.ok(main.includes('preloadPage(pathname)'));
    const lazyPublic = [...app.matchAll(/const (\w+) = lazyWithReload\(\(\) => import\('\.\/components\/public/g)].map((m) => m[1]);
    assert.strictEqual(lazyPublic.length, 8);
    const map = app.slice(app.indexOf('const LAZY_PUBLIC_PAGES'), app.indexOf('};', app.indexOf('const LAZY_PUBLIC_PAGES')));
    for (const name of lazyPublic) assert.ok(map.includes(`: ${name}`), `${name} is missing from LAZY_PUBLIC_PAGES`);
    // A loaded page is handed to React.lazy synchronously, so hydration never suspends on it.
    assert.ok(app.includes('if (loaded) return { then: (resolve'));
  });

  it('the first render does not read the theme or screen size (it must match the prerendered HTML)', () => {
    const theme = fs.readFileSync('src/components/ThemeProvider.tsx', 'utf8');
    assert.ok(theme.includes("useState<ThemeMode>('light')"));
    const guide = fs.readFileSync('src/components/LearningGuide.tsx', 'utf8');
    assert.ok(guide.includes('const [revealed, setRevealed] = useState(true);'));
  });
});
