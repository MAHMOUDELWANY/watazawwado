// Records a slide as 30 fps frames, stepping the page clock 1/30 s per frame, so even a slow machine gives smooth video.
// usage: node scripts/curriculum/cast.mjs "<query>" <seconds> <outDir>
//   e.g. node scripts/curriculum/cast.mjs "subject=zad-adults&lesson=1&p=4&demo&gap=3800" 33 out/p4
//   then: ffmpeg -framerate 30 -i out/p4/f%05d.jpg -vf "scale=1280:-2,format=yuv420p" -c:v libx264 -crf 20 p4.mp4
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [query, secs = '10', out] = process.argv.slice(2);
const PORT = process.env.PORT || 3101;
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
mkdirSync(out, { recursive: true });
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--hide-scrollbars', '--window-size=1600,900', `--user-data-dir=${join(out, '.profile')}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ws;
for (let i = 0; i < 150 && !ws; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const p = l.find((t) => t.type === 'page'); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch {}
  await sleep(200);
}
if (ws.readyState !== 1) await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise((res) => { const n = ++id; pend.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.addScriptToEvaluateOnNewDocument', { source: readFileSync(new URL('./clock.js', import.meta.url), 'utf8') });
await send('Page.navigate', { url: `http://localhost:${PORT}/scripts/curriculum/preview/slide.html?${query}` });
await sleep(4000);
const adv = () => send('Runtime.evaluate', { expression: 'window.__advance(33.333)' });
for (let i = 0; i < 30; i++) await adv();
const total = Math.round(Number(secs) * 30);
for (let i = 0; i < total; i++) {
  await adv();
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80, clip: { x: 0, y: 0, width: 1600, height: 900, scale: 0.8 } });
  writeFileSync(join(out, `f${String(i).padStart(5, '0')}.jpg`), Buffer.from(r.result.data, 'base64'));
}
console.log('frames', total);
ws.close(); chrome.kill(); process.exit(0);
