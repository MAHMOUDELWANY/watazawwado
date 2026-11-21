// Renders film.html frame by frame with the English nasheed bed: node render.mjs <v6|v8|v10|v11> <out.mp4> [stills t1,t2,...]
// Encode per PRODUCTION.md §4 (carousel as video): 1080x1920, 30 fps, H.264 High crf 14, AAC 192k 48 kHz, bed fades over the last 3 s.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('../../node_modules/playwright');
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const [id, out, stills] = process.argv.slice(2);
const FPS = 30;
const browser = await chromium.launch({ executablePath: process.env.CHROME });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(pathToFileURL(path.resolve('film.html')).href + `?v=${id}`);
const length = await page.evaluate(() => window.ready());
if (stills) {
  for (const t of stills.split(',').map(Number)) { await page.evaluate((t) => window.frame(t), t); await page.screenshot({ path: `${out}-${t}.jpg`, type: 'jpeg', quality: 85 }); }
  await browser.close(); process.exit(0);
}
const bed = path.resolve('../brand-assets/nasheed/suno/nasheed-bed-en.mp3');
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', bed,
  '-filter_complex', `[1:a]atrim=0:${length},afade=t=in:d=0.3,afade=t=out:st=${length - 3}:d=3,aresample=48000[a]`, '-map', '0:v', '-map', '[a]',
  '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-t', String(length), out], { stdio: ['pipe', 'inherit', 'inherit'] });
const n = Math.round(length * FPS);
for (let i = 0; i < n; i++) {
  await page.evaluate((t) => window.frame(t), i / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();
console.log('done', out, n, 'frames', length, 's');
