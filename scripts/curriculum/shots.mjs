// Screenshots of slides at given steps, with the page clock under our control (Chrome's virtual time stalls here).
// usage: node scripts/curriculum/shots.mjs <outDir> <query> [<query> ...]
//   each query is the part after "slide.html?", e.g. "subject=zad-adults&lesson=1&p=4&s=3"
// The preview server must be running on PORT (default 3101). CHROME overrides the browser path.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [out, ...queries] = process.argv.slice(2);
const PORT = process.env.PORT || 3101;
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
mkdirSync(out, { recursive: true });
const port = 9800 + Math.floor(Math.random() * 100);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--hide-scrollbars', '--window-size=1600,900', `--user-data-dir=${join(out, '.profile')}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ws;
for (let i = 0; i < 150 && !ws; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const p = l.find((t) => t.type === 'page'); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch {}
  await sleep(200);
}
// The socket may already be open by now: never wait for an event that has passed.
if (ws.readyState !== 1) await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise((res) => { const n = ++id; pend.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.addScriptToEvaluateOnNewDocument', { source: readFileSync(new URL('./clock.js', import.meta.url), 'utf8') });
for (const query of queries) {
  await send('Page.navigate', { url: `http://localhost:${PORT}/scripts/curriculum/preview/slide.html?${query}` });
  await sleep(2500); // real time for modules and fonts
  for (let i = 0; i < 120; i++) await send('Runtime.evaluate', { expression: 'window.__advance && window.__advance(50)' }); // 6 s of page time
  await sleep(150);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, query.replace(/[^a-z0-9]+/gi, '_') + '.png'), Buffer.from(r.result.data, 'base64'));
}
console.log('shots', queries.length);
ws.close(); chrome.kill(); process.exit(0);
