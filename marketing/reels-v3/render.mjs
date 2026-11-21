// node render.mjs <v7|v9|v12> <out.mp4> [stills t1,t2,...]  — 1080x1920, 30 fps, voice from <id>.voice.wav
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('../../node_modules/playwright');
import { spawn } from 'node:child_process';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const [id, out, stills] = process.argv.slice(2);
const ROOT = path.resolve('../..');
// tiny static server so fetch() of the timeline works
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': f.endsWith('.png') ? 'image/png' : f.endsWith('.webp') ? 'image/webp' : f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.json') ? 'application/json' : f.endsWith('.svg') ? 'image/svg+xml' : f.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream' }); r.end(b); }); }).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({ executablePath: process.env.CHROME });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(`http://127.0.0.1:${port}/marketing/reels-v3/${process.env.FILM || 'film.html'}?v=${id}`);
const length = await page.evaluate(() => window.ready());
if (stills) {
  for (const t of stills.split(',').map(Number)) { await page.evaluate((t) => window.frame(t), t); await page.screenshot({ path: `${out}-${t}.jpg`, type: 'jpeg', quality: 80 }); }
} else {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-i', `${id}.voice.wav`,
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-t', String(length), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(length * 30);
  for (let i = 0; i < n; i++) { await page.evaluate((t) => window.frame(t), i / 30); const buf = await page.screenshot({ type: 'jpeg', quality: 92 }); if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log('done', out, n, 'frames', length);
}
await browser.close(); srv.close();
