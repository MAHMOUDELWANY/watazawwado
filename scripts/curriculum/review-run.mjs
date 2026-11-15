// Real-time run of a whole lesson in the real LessonPlayer, for the curriculum-review skill: presses Next through every
// step, takes a mid-transition and a settled screenshot per press, and logs console errors and slow frames.
// usage: node scripts/curriculum/review-run.mjs <outDir> <subject> <lesson> <presses> [WxH=390x844] [dark] [reduced]
// The preview server must be running on PORT (default 3101). Real clock on purpose: the manual clock hides real-time bugs.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [out, subject, lesson, pressesArg, size = '390x844', ...flags] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
const presses = Number(pressesArg);
const PORT = process.env.PORT || 3101;
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
mkdirSync(out, { recursive: true });
const port = 9900 + Math.floor(Math.random() * 90);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--hide-scrollbars', `--window-size=${W},${H}`, '--autoplay-policy=no-user-gesture-required', '--mute-audio', `--user-data-dir=${join(out, '.profile')}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ws;
for (let i = 0; i < 150 && !ws; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const p = l.find((t) => t.type === 'page'); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch {}
  await sleep(200);
}
if (ws.readyState !== 1) await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const log = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') log.push({ press: cur, kind: 'exception', text: m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text });
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) log.push({ press: cur, kind: m.params.type, text: m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 400) });
});
const send = (method, params = {}) => new Promise((res) => { const n = ++id; pend.set(n, res); ws.send(JSON.stringify({ id: n, method, params })); });
let cur = -1;

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: W < 700 ? 2 : 1, mobile: W < 900 });
const media = [];
if (flags.includes('dark')) media.push({ name: 'prefers-color-scheme', value: 'dark' });
if (flags.includes('reduced')) media.push({ name: 'prefers-reduced-motion', value: 'reduce' });
if (media.length) await send('Emulation.setEmulatedMedia', { features: media });
// Longest gap between animation frames since the last reset: a hint of jank (headless timing is rough: confirm by eye).
await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { let last = performance.now(); window.__maxGap = 0; const f = (t) => { window.__maxGap = Math.max(window.__maxGap, t - last); last = t; requestAnimationFrame(f); }; requestAnimationFrame(f); })();` });
await send('Page.navigate', { url: `http://localhost:${PORT}/scripts/curriculum/preview/slide.html?subject=${subject}&lesson=${lesson}&player` });
await sleep(5000);
const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 }); writeFileSync(join(out, name), Buffer.from(r.result.data, 'base64')); };
const state = async () => (await send('Runtime.evaluate', { expression: `JSON.stringify({ gap: Math.round(window.__maxGap), scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, text: document.body.innerText.replace(/\\s+/g, ' ').slice(0, 160) })` })).result.result.value;
const rows = [];
await shot('p000_settled.jpg'); rows.push({ press: 0, ...JSON.parse(await state()) });
for (cur = 1; cur <= presses; cur++) {
  await send('Runtime.evaluate', { expression: 'window.__maxGap = 0' });
  for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await sleep(180);
  const n = String(cur).padStart(3, '0');
  await shot(`p${n}_mid.jpg`);
  await sleep(1500);
  await shot(`p${n}_settled.jpg`);
  rows.push({ press: cur, ...JSON.parse(await state()) });
}
writeFileSync(join(out, 'run.json'), JSON.stringify({ subject, lesson, size, flags, rows, log }, null, 1));
console.log(`run ${subject} L${lesson} ${size} ${flags.join(' ')}: ${presses} presses, ${log.length} console issues, worst frame gap ${Math.max(...rows.map((r) => r.gap))} ms`);
ws.close(); chrome.kill(); process.exit(0);
