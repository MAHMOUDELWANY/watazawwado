// Screenshots thumb.html into the film covers: node thumb.mjs <out dir>
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('../../../node_modules/playwright');
const out = process.argv[2];
const browser = await chromium.launch({ executablePath: process.env.CHROME });
for (const lang of ['ar', 'en']) for (const [fmt, W, H] of [['169', 1280, 720], ['916', 720, 1280]]) {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto(pathToFileURL(path.resolve('thumb.html')).href + `?lang=${lang}&fmt=${fmt}`);
  await page.evaluate(() => window.ready());
  await page.screenshot({ path: `${out}/${lang}-${fmt}.png` });
  await page.close();
}
await browser.close();
console.log('ok');
