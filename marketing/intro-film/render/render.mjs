// Renders film.html frame by frame into an MP4: node render.mjs <ar|en> <169|45> <out.mp4> [stills t1,t2,...]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('../../../node_modules/playwright');
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const [lang, fmt, out, stills] = process.argv.slice(2);
const [W, H] = fmt === '45' ? [864, 1080] : [1280, 720];
const FPS = 25;
const browser = await chromium.launch({ executablePath: process.env.CHROME });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(pathToFileURL(path.resolve('film.html')).href + `?lang=${lang}&fmt=${fmt}`);
const length = await page.evaluate(() => window.ready());
if (stills) {
  for (const t of stills.split(',').map(Number)) { await page.evaluate((t) => window.frame(t), t); await page.screenshot({ path: `${out}-${t}.jpg`, type: 'jpeg', quality: 85 }); }
  await browser.close(); process.exit(0);
}
const audio = path.resolve(`../vo/${lang}-v4-t1.mp3`);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', audio,
  '-filter_complex', '[1:a]apad,afade=t=out:st=' + (length - 1.2) + ':d=1.2[a]', '-map', '0:v', '-map', '[a]',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', '-t', String(length), out], { stdio: ['pipe', 'inherit', 'inherit'] });
const n = Math.ceil(length * FPS);
for (let i = 0; i < n; i++) {
  await page.evaluate((t) => window.frame(t), i / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();
console.log('done', out, n, 'frames');
